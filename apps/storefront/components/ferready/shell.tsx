"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { restoreCart, updateCart, type CartItem } from "@/lib/prototype.mjs";
import { products, categories } from "./catalog";
import { campaign } from "@/lib/campaign.mjs";

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
  setQuantity: (slug: string, quantity: number) => void;
  add: (slug: string, quantity?: number) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
export function useCart() {
  const value = useContext(CartContext);
  if (!value)
    throw new Error("Demo cart must be used inside the prototype shell.");
  return value;
}

export function DemoShell({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fr-enter");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(
        ".hero-copy > *, .hero-mini > a, .section-heading, .category-strip > a, .product-card, .object-list, .object-visual, .task-tile, .closing-banner > *, .footer-top > *",
      )
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [path]);
  useEffect(() => {
    try {
      setCart(
        restoreCart(localStorage.getItem("ferready-demo-cart-v1"), products),
      );
    } catch {
      /* Private mode may disable browser storage. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("ferready-demo-cart-v1", JSON.stringify(cart));
      } catch {
        /* The in-memory cart remains usable. */
      }
    }
  }, [cart, ready]);
  useEffect(() => {
    setMenu(false);
  }, [path]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const setQuantity = (slug: string, quantity: number) =>
    setCart((current) => updateCart(current, slug, quantity, products));
  const add = (slug: string, quantity = 1) => {
    if (!ready) return;
    setCart((current) =>
      updateCart(
        current,
        slug,
        Math.min(
          20,
          (current.find((p) => p.slug === slug)?.quantity || 0) + quantity,
        ),
        products,
      ),
    );
    setToast("Producto añadido a tu carrito");
  };
  return (
    <CartContext.Provider
      value={{ cart, ready, setQuantity, add, clear: () => setCart([]) }}
    >
      <div className="ferready campaign-theme">
        <a className="skip-link" href="#contenido">
          Ir al contenido
        </a>
        <div className="announcement">
          <span>
            <Icon name="truck" size={17} /> De nuestra ferretería a tu puerta.
          </span>
          <span>
            Bogotá y alrededores <Icon name="pin" size={15} />
          </span>
        </div>
        <header className="fr-header">
          <Link href="/" className="fr-brand" aria-label="Ferready, inicio">
            <img
              src={campaign.brand.logoLight}
              alt="Ferready"
              width="190"
              height="48"
            />
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
            <Link href="/catalogo" className="shop-link">
              Explorar tienda <Icon name="diagonal" size={17} />
            </Link>
            <Link
              href="/carrito"
              className="cart-link"
              aria-label={`Carrito, ${cart.reduce((n, p) => n + p.quantity, 0)} productos`}
            >
              <Icon name="bag" />
              <span className="cart-count">
                {cart.reduce((n, p) => n + p.quantity, 0)}
              </span>
            </Link>
            <button
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
          className={`category-nav ${menu ? "is-open" : ""}`}
          aria-label="Categorías de productos"
        >
          <Link className="all-categories" href="/catalogo">
            <Icon name="menu" size={18} /> Todos los productos
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`}>
              {c.short}
            </Link>
          ))}
          <Link href="/#por-tarea" className="task-nav">
            Ideas para tu próximo arreglo <Icon name="arrow" size={15} />
          </Link>
        </nav>
        <main id="contenido" className="fr-main">
          {children}
        </main>
        <footer className="fr-footer">
          <div className="footer-top">
            <div>
              <img
                src={campaign.brand.logoLight}
                width="210"
                height="50"
                alt="Ferready"
              />
              <p>
                Buenas herramientas.
                <br />
                Mejores soluciones.
              </p>
            </div>
            <div>
              <h2>Tu ferretería, a un clic.</h2>
              <Link href="/catalogo">
                Todos los productos <Icon name="arrow" />
              </Link>
              <Link href="/#por-tarea">
                Encuentra por tarea <Icon name="arrow" />
              </Link>
              <Link href="/informacion">
                Envíos y preguntas frecuentes <Icon name="arrow" />
              </Link>
            </div>
            <div className="footer-location">
              <Icon name="pin" size={26} />
              <p>
                Bogotá, Colombia.
                <br />Y un poco más cerca de resolverlo.
              </p>
              <span>Precios en pesos colombianos.</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Ferready.</span>
            <span>
              Prototipo privado · imágenes y condiciones comerciales de
              demostración.
            </span>
            <Link href="/informacion#demo">Acerca de esta demo</Link>
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
