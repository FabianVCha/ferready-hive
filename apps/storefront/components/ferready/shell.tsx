"use client";

import Link from "next/link";
import Image from "next/image";
import { brandLogo } from "@/lib/storefront-brand.mjs";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { restoreCart, updateCart, type CartItem } from "@/lib/prototype.mjs";
import { products, categories } from "./catalog";
import { selectionResult, type ObjectiveItem } from "@/lib/objectives.mjs";
import { RouteMotion } from "./route-motion";
import { storefront } from "@/data/storefront.mjs";
import type { CSSProperties } from "react";
import { VisualCatalogProvider, type VisualCatalog } from "./catalog-context";

export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </>
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    diagonal: (
      <>
        <path d="M5 19 19 5M5 5h14v14" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    truck: (
      <>
        <path d="M2 5h12v12H2zM14 9h4l4 5v3h-8" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    close: <path d="m5 5 14 14M19 5 5 19" />,
    minus: <path d="M5 12h14" />,
    plus: <path d="M5 12h14M12 5v14" />,
    shield: (
      <>
        <path d="m12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5l8-3Z" />
        <path d="m8 11 3 3 5-5" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="9" r="2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}

type CartContextValue = {
  cart: CartItem[];
  ready: boolean;
  busy: boolean;
  error: string;
  retry: () => void;
  saveSelection: (slug: string, quantity: number) => Promise<boolean>;
  setQuantity: (slug: string, quantity: number) => void;
  add: (slug: string, quantity?: number) => boolean;
  addSelection: (items: ObjectiveItem[]) => boolean;
  clear: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
export function useCart() {
  const value = useContext(CartContext);
  if (!value)
    throw new Error("Demo cart must be used inside the prototype shell.");
  return value;
}

function Brand({ dark = false, showMark = false }: { dark?: boolean; showMark?: boolean }) {
  const logo = brandLogo(storefront, dark);
  return logo ? (
    <span className="template-brand-assets">
      {showMark && storefront.mark && (
        <Image className="template-brand-mark" src={storefront.mark.src} width={storefront.mark.width} height={storefront.mark.height} alt="" aria-hidden="true" loading="eager" unoptimized />
      )}
      <Image className="template-logo" src={logo.src} width={logo.width} height={logo.height} alt={storefront.brandName} loading="eager" unoptimized />
    </span>
  ) : <span className="template-wordmark">{storefront.brandName}</span>;
}

export function DemoShell({ children, informational = false, approvedCategories = [], visualCatalog }: { children: React.ReactNode; informational?: boolean; approvedCategories?: { handle: string; name: string }[]; visualCatalog?: VisualCatalog }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuNav = useRef<HTMLElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!header.current) return;
    const update = () => menuNav.current?.style.setProperty("--fr-header-height", `${header.current!.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(update);
    observer.observe(header.current);
    update();
    return () => observer.disconnect();
  }, []);
  const cartRef = useRef(cart);
  cartRef.current = cart;
  useEffect(() => {
    if (!menu) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenu(false);
      menuTrigger.current?.focus();
    };
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuNav.current?.contains(target) && !menuTrigger.current?.contains(target)) setMenu(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [menu]);
  const path = usePathname();
  useEffect(() => {
    if (informational) {
      const refresh = () => { void loadSelection(); };
      refresh();
      window.addEventListener("focus", refresh);
      const channel = new BroadcastChannel("ferready-selection");
      channel.onmessage = refresh;
      return () => { window.removeEventListener("focus", refresh); channel.close(); };
    }
    try {
      setCart(
        restoreCart(localStorage.getItem("ferready-demo-cart-v1"), products),
      );
    } catch {
      /* Private mode may disable browser storage. */
    }
    setReady(true);
  }, [informational]);
  async function loadSelection() {
    if (saving.current) return;
    try {
      const response = await fetch("/api/selection-cart", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCart(data.items);
      setError("");
    } catch { setError("No pudimos cargar el carrito. Intenta de nuevo."); }
    finally { setReady(true); }
  }
  async function saveSelection(slug: string, quantity: number) {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/selection-cart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, quantity }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCart(data.items);
      setToast(quantity > 0 ? "Carrito guardado. Precio y disponibilidad por confirmar." : "Producto eliminado del carrito.");
      const channel = new BroadcastChannel("ferready-selection");
      channel.postMessage("updated");
      channel.close();
      return true;
    } catch {
      setError("No pudimos guardar el carrito. Intenta de nuevo.");
      return false;
    } finally { saving.current = false; setBusy(false); }
  }
  useEffect(() => {
    if (ready && !informational) {
      try {
        localStorage.setItem("ferready-demo-cart-v1", JSON.stringify(cart));
      } catch {
        /* The in-memory cart remains usable. */
      }
    }
  }, [cart, ready, informational]);
  useEffect(() => {
    setMenu(false);
  }, [path]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 12000);
    return () => clearTimeout(timer);
  }, [toast]);
  const setQuantity = (slug: string, quantity: number) => {
    if (informational) { void saveSelection(slug, quantity); return; }
    setCart((current) => updateCart(current, slug, quantity, products));
  };
  const add = (slug: string, quantity = 1) => {
    if (!ready || informational) return false;
    return addSelection([{ slug, quantity }]);
  };
  const addSelection = (items: ObjectiveItem[]) => {
    if (!ready || informational) return false;
    const result = selectionResult(cartRef.current, items, products);
    cartRef.current = result.cart;
    setCart(result.cart);
    setToast(result.message);
    return result.added > 0;
  };
  return (
    <CartContext.Provider
      value={{ cart, ready, busy, error, retry: () => { void loadSelection(); }, saveSelection, setQuantity, add, addSelection, clear: () => { if (!informational) setCart([]); } }}
    >
      <div className="ferready campaign-theme neutral-template" style={Object.fromEntries(Object.entries(storefront.tokens).map(([key, value]) => [`--template-${key}`, value])) as CSSProperties}>
        <a className="skip-link" href="#contenido">
          Ir al contenido
        </a>
        <div className="announcement">
          <span>
            <Icon name="truck" size={17} /> {informational ? "Catálogo informativo · sin compra en línea" : "Tienda de demostración."}
          </span>
          <span>
            Bogotá y alrededores <Icon name="pin" size={15} />
          </span>
        </div>
        <header ref={header} className="fr-header">
          <Link href="/" className="fr-brand" aria-label={`${storefront.brandName}, inicio`}>
            <Brand showMark />
          </Link>
          <form action="/catalogo" className="header-search" role="search">
            <Icon name="search" size={20} />
            <input
              type="search"
              name="q"
              placeholder="¿Qué estás buscando?"
              aria-label="Buscar productos"
            />
            <button type="submit" aria-label="Buscar">
              <Icon name="arrow" size={19} />
            </button>
          </form>
          <div className="header-actions">
            {<Link
              href="/carrito"
              className="cart-link"
              aria-label={`Carrito, ${cart.reduce((n, p) => n + p.quantity, 0)} productos`}
            >
              <Icon name="bag" />
              <span className="cart-count">
                {cart.reduce((n, p) => n + p.quantity, 0)}
              </span>
            </Link>}
            <button
              ref={menuTrigger}
              aria-controls="category-navigation"
              className="mobile-menu icon-button"
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
            >
              <Icon name={menu ? "close" : "menu"} />
            </button>
          </div>
        </header>
        <nav
          id="category-navigation"
          ref={menuNav}
          onClick={(event) => { if ((event.target as Element).closest("a")) setMenu(false); }}
          className={`category-nav ${informational ? "approved-navigation" : ""} ${menu ? "is-open" : ""}`}
          aria-label="Categorías de productos"
        >
          <Link className="all-categories" href="/catalogo">
            <Icon name="menu" size={18} /> Todos los productos
          </Link>
          {informational ? approvedCategories.map((c) => (
            <Link key={c.handle} href={`/c/${c.handle}`}>{c.name}</Link>
          )) : categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`}>
              {c.short}
            </Link>
          ))}
          <Link href="/#por-tarea" className="task-nav">
            {informational ? "Explorar por categoría" : "Explorar por objetivo"} <Icon name="arrow" size={15} />
          </Link>
        </nav>
        <main id="contenido" className="fr-main">
          {informational && error && <div className="page-pad" role="alert"><p>{error}</p><button className="text-link" onClick={() => { void loadSelection(); }}>Reintentar conexión</button></div>}
          <RouteMotion>{visualCatalog ? <VisualCatalogProvider catalog={visualCatalog}>{children}</VisualCatalogProvider> : children}</RouteMotion>
        </main>
        <footer className="fr-footer">
          <div className="footer-top">
            <div>
              <Brand dark />
              <p>
                {informational ? "Herramientas Truper." : "Tu contenido."}
                <br />
                {informational ? "Referencias y fichas técnicas." : "Tu espacio."}
              </p>
            </div>
            <div>
              <h2>Explora tu tienda.</h2>
              <Link href="/catalogo">
                Todos los productos <Icon name="arrow" />
              </Link>
              <Link href="/#por-tarea">
                {informational ? "Explora por categoría" : "Encuentra por objetivo"} <Icon name="arrow" />
              </Link>
              {!informational && <Link href="/informacion">
                Envíos y preguntas frecuentes <Icon name="arrow" />
              </Link>}
            </div>
            <div className="footer-location">
              <Icon name="pin" size={26} />
              <p>
                {informational ? "Catálogo aprobado." : "Plantilla de demostración."}
                <br />{informational ? "Sin compra en línea." : "Personaliza tu información."}
              </p>
              <span>{informational ? "Precio y disponibilidad por confirmar." : "Precios en pesos colombianos."}</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} {storefront.brandName}.</span>
            <span>
              {informational ? "Referencias aprobadas · condiciones comerciales por confirmar." : "Prototipo privado · imágenes y condiciones comerciales de demostración."}
            </span>
            {!informational && <Link href="/informacion#demo">Acerca de esta demo</Link>}
          </div>
        </footer>
        <div className="toast" role="status" aria-live="polite">
          {toast && (
            <>
              <Icon name="check" size={18} /> {toast}{" "}
              <Link href="/carrito">Ver carrito</Link>
              <button
                className="icon-button"
                aria-label="Cerrar aviso"
                onClick={() => setToast("")}
              >
                <Icon name="close" size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </CartContext.Provider>
  );
}
