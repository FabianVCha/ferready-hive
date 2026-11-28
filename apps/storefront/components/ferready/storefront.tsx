"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { searchProducts } from "@/lib/prototype.mjs";
import { categories, products, money } from "./catalog";
import { Icon, useCart } from "./shell";
import { ProductJourney } from "./product-journey";
import { ProductExplorer, ProductSpotlight, type ProductTopic } from "./product-explorer";
import { SafeImage } from "./safe-image";
import { AddButton } from "./selection-motion";
import { useVisualCatalog, type DisplayProduct } from "./catalog-context";
import { PendingPriceAdd } from "./selection-cart";
import { useCatalogRouteReady } from "./route-motion";

export function ProductCard({ product, catalog = false }: { product: DisplayProduct; catalog?: boolean }) {
  const { add, ready } = useCart();
  const { informational } = useVisualCatalog();
  const title = catalog ? product.cardTitle ?? product.name : product.name;
  return (
    <article className="product-card">
      <Link href={`/p/${product.slug}`} className="product-image">
        {product.missingImage ? <span className="approved-missing-image">Fotografía no disponible</span> : <SafeImage
          src={product.image}
          alt={product.name}
          width="500"
          height="500"
          loading="lazy"
        />}
        <span className="product-view">
          Ver producto <Icon name="diagonal" size={18} />
        </span>
      </Link>
      <div className="product-card-info">
        <p className="product-brand">{product.brand}</p>
        <h3>
          <Link href={`/p/${product.slug}`} title={title !== product.name ? product.name : undefined}>{title}</Link>
        </h3>
        <p className="product-short">
          {Object.values(product.specs).slice(0, 2).join(" · ")}
        </p>
        <div className="product-price-row">
          <span className={informational ? "quote-status" : undefined}>{informational ? "Precio y disponibilidad por confirmar" : product.price === null ? "Precio por confirmar" : money(product.price)}</span>
          {!informational && product.price !== null && <AddButton
            disabled={!ready}
            className="quick-add"
            onClick={() => add(product.slug)}
            aria-label={`Añadir ${product.name} al carrito`}
          >
          </AddButton>}
        </div>
      </div>
    </article>
  );
}

export function HomeView() {
  const [spotlight, setSpotlight] = useState(0);
  const spotlights = [products[0], products[3], products[14]];
  const selected = spotlights[spotlight];
  return (
    <>
      <section className="home-hero">
        <img
          className="hero-photo"
          src="/ferready/hero.png"
          alt="Composición editorial de herramientas sobre rojo industrial Ferready"
          width="1536"
          height="1024"
          fetchPriority="high"
        />
        <div className="hero-copy">
          <h1>Manos a la obra.</h1>
          <p>
            Herramientas y soluciones para tu casa.
            <br />
            Elige bien. Resuelve mejor.
          </p>
          <Link className="button button-paper" href="/catalogo">
            Encuentra lo que necesitas <Icon name="diagonal" size={22} />
          </Link>
          <div className="hero-delivery">
            <Icon name="truck" size={20} />
            <span>Entregas propias en Bogotá y alrededores</span>
          </div>
        </div>
        <div className="hero-bottom">
          <span>La pieza correcta cambia todo.</span>
          <div className="hero-mini">
            <Link href="/c/herramientas-electricas">
              <img src={products[0].image} width="80" height="80" alt="" />
              <span>
                Potencia para tus ideas
                <Icon name="arrow" size={17} />
              </span>
            </Link>
            <Link href="/c/plomeria-hogar">
              <img src={products[14].image} width="80" height="80" alt="" />
              <span>
                Pequeños arreglos
                <Icon name="arrow" size={17} />
              </span>
            </Link>
          </div>
        </div>
      </section>
      <section className="shop-section section-space">
        <div className="section-heading">
          <h2>
            Lo que necesitas.
            <br />
            Sin darle más vueltas.
          </h2>
          <p>
            Desde el primer tornillo hasta el último detalle.
            <br />
            Explora nuestra selección para el hogar.
          </p>
        </div>
        <div className="category-strip">
          {categories.map((c) => (
            <Link href={`/c/${c.slug}`} key={c.slug}>
              <div className="category-picture">
                <img
                  src={`/ferready/products/${c.image}.webp`}
                  alt=""
                  width="240"
                  height="220"
                  loading="lazy"
                />
              </div>
              <h3>
                {c.name}
                <Icon name="diagonal" size={18} />
              </h3>
            </Link>
          ))}
        </div>
      </section>
      <section className="section-space essentials">
        <div className="section-heading">
          <div>
            <h2>Listos para tu próximo arreglo.</h2>
            <p>Una selección pequeña. Muchas posibilidades.</p>
          </div>
          <Link className="text-link" href="/catalogo">
            Ver todos los productos <Icon name="arrow" size={20} />
          </Link>
        </div>
        <div className="product-grid">
          {[products[0], products[5], products[6], products[14]].map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
      <section className="object-section">
        <div className="object-list">
          <h2>
            Una buena elección.
            <br />
            Un trabajo bien hecho.
          </h2>
          <p>
            Distintas tareas. La misma tranquilidad de elegir con información
            clara.
          </p>
          <div role="group" aria-label="Explorar productos destacados">
            {spotlights.map((p, i) => (
              <button
                key={p.slug}
                onClick={() => setSpotlight(i)}
                aria-pressed={spotlight === i}
                className={spotlight === i ? "selected" : ""}
              >
                {
                  [
                    "Perfora. Atornilla. Resuelve.",
                    "Todo en su lugar.",
                    "Adiós a esa fuga.",
                  ][i]
                }
                <Icon name="arrow" size={24} />
              </button>
            ))}
          </div>
        </div>
        <div className="object-visual">
          <img
            key={selected.slug}
            src={selected.image}
            alt={selected.name}
            width="680"
            height="600"
            loading="lazy"
          />
          <Link href={`/p/${selected.slug}`} className="object-caption">
            <span>
              {selected.brand}
              <strong>{selected.name}</strong>
              {money(selected.price)}
            </span>
            <span className="round-action">
              <Icon name="diagonal" size={24} />
            </span>
          </Link>
        </div>
      </section>
      <section id="por-tarea" className="section-space task-section">
        <div className="section-heading">
          <div>
            <h2>¿Tienes un arreglo en mente?</h2>
            <p>También puedes empezar por lo que quieres hacer.</p>
          </div>
          <Link href="/catalogo" className="text-link">
            Prefiero ver productos <Icon name="arrow" size={19} />
          </Link>
        </div>
        <div className="task-grid">
          <Link href="/c/accesorios-fijacion" className="task-tile task-red">
            <SafeImage
              src={products[5].image}
              alt="Brocas para elegir según el material"
              width="500"
              height="440"
              loading="lazy"
            />
            <div>
              <h3>Que quede bien fijo.</h3>
              <p>Perforar, colgar y sujetar.</p>
            </div>
            <Icon name="diagonal" size={26} />
          </Link>
          <Link href="/c/plomeria-hogar" className="task-tile task-blue">
            <img
              src={products[14].image}
              alt="Manguera flexible para el lavamanos"
              width="500"
              height="440"
              loading="lazy"
            />
            <div>
              <h3>Ese arreglo pendiente.</h3>
              <p>Repuestos para tu hogar.</p>
            </div>
            <Icon name="diagonal" size={26} />
          </Link>
          <Link href="/c/seguridad-jardin" className="task-tile task-paper">
            <img
              src={products[11].image}
              alt="Tijera para el mantenimiento del jardín"
              width="500"
              height="440"
              loading="lazy"
            />
            <div>
              <h3>Un jardín a punto.</h3>
              <p>Cortar, cuidar y renovar.</p>
            </div>
            <Icon name="diagonal" size={26} />
          </Link>
        </div>
      </section>
      <section className="closing-banner">
        <div>
          <h2>
            La confianza también
            <br />
            viene en la caja.
          </h2>
          <p>
            Compatibilidad explicada. Contenido claro.
            <br />
            Lo importante, antes de comprar.
          </p>
          <Link href="/informacion" className="text-link">
            Conoce cómo comprar <Icon name="arrow" size={20} />
          </Link>
        </div>
        <img
          src="/ferready/products/279788.webp"
          alt="Caja y organizador Bauker"
          width="700"
          height="500"
          loading="lazy"
        />
      </section>
    </>
  );
}

function catalogHref(category: string, filters: { q?: string; brand?: string; sort?: string } = {}) {
  const path = category ? `/c/${category}` : "/catalogo";
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);
  return params.size ? `${path}?${params}` : path;
}

export function CatalogView({ category = "" }: { category?: string }) {
  const routeContent = useCatalogRouteReady();
  const { products, categories, informational, pending = [] } = useVisualCatalog();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  const query = params.get("q")?.trim() ?? "";
  const requestedBrand = params.get("brand") ?? "";
  const brand = brands.includes(requestedBrand) ? requestedBrand : "";
  const requestedSort = params.get("sort") ?? "";
  const sort = (informational ? ["name"] : ["low", "high"]).includes(requestedSort) ? requestedSort : "featured";
  const filters = { q: query, brand, sort };
  const hasFilters = Boolean(category || brand);
  const visiblePending = !query && !hasFilters ? pending : [];
  const categoryName = categories.find((c) => c.slug === category)?.name;
  const matchingProducts = useMemo(
    () => searchProducts(products, query).filter((p) => !brand || p.brand === brand),
    [products, query, brand],
  );
  const result = useMemo(() => {
    const list = matchingProducts.filter((p) => !category || p.categorySlug === category);
    if (sort === "low") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "high") list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    if (sort === "name") list.sort((a, b) => (a.cardTitle ?? a.name).localeCompare(b.cardTitle ?? b.name, "es"));
    return list;
  }, [matchingProducts, category, sort]);
  const heading = query
    ? `Resultados para “${query}”`
    : categoryName ||
      (informational ? "Herramientas Truper" : "Catálogo de ejemplo");
  const resultLabel = result.length === 1 ? "1 producto confirmado" : `${result.length} productos confirmados`;
  const pendingLabel = visiblePending.length === 1 ? "1 pendiente" : `${visiblePending.length} pendientes`;
  const clearFiltersHref = catalogHref("", { q: query, sort });
  const updateFilter = (name: "q" | "brand" | "sort", value: string) => {
    const current = new URLSearchParams(window.location.search);
    const href = catalogHref(category, {
      q: current.get("q")?.trim(),
      brand: current.get("brand") ?? undefined,
      sort: current.get("sort") ?? undefined,
      [name]: value,
    });
    if (href !== `${window.location.pathname}${window.location.search}`) {
      window.history.pushState(null, "", href);
    }
  };
  return (
    <div ref={routeContent} className="catalog-page page-pad">
      <div className="breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        {categoryName ? <>
          <Link href="/catalogo">Catálogo</Link>
          <span>/</span>
          <span aria-current="page">{categoryName}</span>
        </> : <span aria-current="page">Catálogo</span>}
      </div>
      <div className="catalog-intro">
        <h1>{heading}</h1>
        <p>
          {informational ? "Consulta las referencias y sus características." : "Tu espacio para presentar productos."}
          <br />
          {informational ? "Precio y disponibilidad por confirmar; sin compra en línea." : "Encuentra lo que buscas y revisa sus detalles."}
        </p>
      </div>
      <div className="catalog-toolbar">
        <p className="catalog-result-count" role="status">
          {resultLabel}{visiblePending.length > 0 && ` · ${pendingLabel}`}
        </p>
        <button
          className="filter-toggle text-link"
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
        >
          Filtrar{hasFilters && ` (${Number(Boolean(category)) + Number(Boolean(brand))})`}
        </button>
        <label>
          Ordenar por{" "}
          <select value={sort} onChange={(e) => updateFilter("sort", e.target.value)}>
            <option value="featured">Recomendados</option>
            {informational ? <option value="name">Nombre (A–Z)</option> : <><option value="low">Menor precio</option><option value="high">Mayor precio</option></>}
          </select>
        </label>
      </div>
      <div className="catalog-layout">
        <aside
          id="catalog-filters"
          aria-label="Filtros del catálogo"
          className={`catalog-filters ${filtersOpen ? "filters-open" : ""}`}
        >
          <h2>Categorías</h2>
          <nav className="catalog-category-list" aria-label="Categorías del catálogo">
            <Link href={catalogHref("", filters)} scroll={false} aria-current={!category ? "page" : undefined}>
              Todos los productos <span>{matchingProducts.length}</span>
            </Link>
            {categories.map((c) => (
              <Link key={c.slug} href={catalogHref(c.slug, filters)} scroll={false}
                aria-current={category === c.slug ? "page" : undefined}
              >
                {c.name}
                <span>{matchingProducts.filter((p) => p.categorySlug === c.slug).length}</span>
              </Link>
            ))}
          </nav>
          <label className="brand-filter">
            Marca
            <select value={brand} onChange={(e) => updateFilter("brand", e.target.value)}>
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          {hasFilters && (
            <Link className="text-link catalog-clear-filters" href={clearFiltersHref} scroll={false}>
              Limpiar filtros <Icon name="close" size={16} />
            </Link>
          )}
          <div className="filter-note">
            <Icon name="pin" />
            <p>
              {informational ? "Precio y disponibilidad" : "Envíos de ejemplo,"}
              <br />
              {informational ? "por confirmar." : "por personalizar."}
            </p>
            {!informational && <Link href="/informacion">Consulta los envíos</Link>}
          </div>
        </aside>
        <div>
          {result.length ? (
            <div className="product-grid catalog-products">
              {result.map((p) => (
                <ProductCard key={p.slug} product={p} catalog />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="search" size={40} />
              <h2>No encontramos productos</h2>
              <p>Busca por nombre, código o modelo{hasFilters ? ", o limpia los filtros" : ""}.</p>
              <form className="catalog-empty-search" role="search" aria-label="Buscar en los resultados"
                action={catalogHref(category)} onSubmit={(event) => {
                  event.preventDefault();
                  const q = new FormData(event.currentTarget).get("q");
                  updateFilter("q", typeof q === "string" ? q.trim() : "");
                }}>
                <input key={query} type="search" name="q" defaultValue={query} aria-label="Nombre, código o modelo" />
                {brand && <input type="hidden" name="brand" value={brand} />}
                {sort !== "featured" && <input type="hidden" name="sort" value={sort} />}
                <button className="button button-dark" type="submit">Buscar <Icon name="search" size={18} /></button>
              </form>
              <div className="catalog-empty-actions">
                {hasFilters && <Link className="text-link" href={clearFiltersHref} scroll={false}>Limpiar filtros</Link>}
                <Link className="text-link" href="/catalogo">Ver todo el catálogo <Icon name="arrow" size={18} /></Link>
              </div>
            </div>
          )}
          {visiblePending.length > 0 && (
            <section className="catalog-pending" aria-labelledby="catalog-pending-heading">
              <h2 id="catalog-pending-heading">Por confirmar</h2>
              {visiblePending.map((item) => (
                <div key={item.name}>
                  <h3>{item.name}</h3>
                  <p>{item.note}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductView({ product }: { product: DisplayProduct }) {
  const { add, ready } = useCart();
  const { products, informational } = useVisualCatalog();
  const [quantity, setQuantity] = useState(1);
  const [zone, setZone] = useState("Bogotá");
  const [topic, setTopic] = useState<ProductTopic>("project");
  const router = useRouter();
  const related = products
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);
  const buy = () => {
    add(product.slug, quantity);
    router.push("/checkout");
  };
  return (
    <div className="product-page page-pad">
      <div className="breadcrumb">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <Link href={`/c/${product.categorySlug}`}>{product.category}</Link>
        <span>/</span>
        <span>{product.brand}</span>
      </div>
      <ProductJourney key={product.slug} product={product}>
        <div className="product-purchase">
          {informational
            ? <ProductSpotlight product={product} />
            : <p className="detail-description">{product.description}</p>}
          {informational ? <div className="approved-quote">
            <a href="#especificaciones" className="button button-red" onClick={() => setTopic("specs")}>
              Ver ficha técnica <Icon name="arrow" />
            </a>
            <p>Código {product.reference} · Modelo {product.model}</p>
            <p className="detail-price">Precio por confirmar</p>
            <p>Precio y disponibilidad por confirmar. Sin compra en línea.</p>
            {product.selectionAvailable === false
              ? <p>Ficha informativa. Selección para cotización pendiente de habilitar.</p>
              : <PendingPriceAdd slug={product.slug} />}
          </div> : <>
          <p className="detail-price">
            {product.price === null ? "Precio por confirmar" : money(product.price)} <small>IVA incluido · precio demo</small>
          </p>
          <p className="stock">
            <span /> Disponible en esta demostración
          </p>
          <div className="buy-controls">
            <div className="quantity-control">
              <button
                aria-label="Disminuir cantidad"
                disabled={quantity === 1}
                onClick={() => setQuantity(quantity - 1)}
              >
                <Icon name="minus" size={16} />
              </button>
              <output aria-label="Cantidad">{quantity}</output>
              <button
                aria-label="Aumentar cantidad"
                disabled={quantity === 20}
                onClick={() => setQuantity(quantity + 1)}
              >
                <Icon name="plus" size={16} />
              </button>
            </div>
            <AddButton
              className="button button-red"
              disabled={!ready}
              onClick={() => add(product.slug, quantity)}
            >
              Añadir al carrito
            </AddButton>
          </div>
          <button
            className="button button-dark buy-now"
            onClick={buy}
            disabled={!ready}
          >
            Comprar ahora <Icon name="arrow" size={20} />
          </button>
          </>}
        </div>
      </ProductJourney>
      {!informational && <section className="product-delivery" aria-label="Entrega y compra de demostración">
          <div className="delivery-box">
            <Icon name="truck" size={25} />
            <div>
              <label htmlFor="delivery-zone">
                Entrega propia en{" "}
                <select
                  id="delivery-zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                >
                  <option>Bogotá</option>
                  <option>Chía</option>
                  <option>Soacha</option>
                </select>
              </label>
              <strong>
                {zone === "Bogotá"
                  ? "Recíbelo en 1–2 días hábiles"
                  : "Recíbelo en 2–3 días hábiles"}
              </strong>
              <span>
                {zone === "Bogotá" ? "Envío $12.000" : "Envío $18.000"} ·
                condiciones simuladas
              </span>
            </div>
          </div>
          <div className="purchase-note">
            <Icon name="shield" size={18} />
            <span>Revisa compatibilidad y contenido antes de elegir.</span>
          </div>
      </section>}
      {informational ? <ProductExplorer product={product} active={topic} onChange={setTopic} /> : (
      <section className="product-information" id="especificaciones">
        <div>
          <h2>
            Que sea justo
            <br />
            lo que necesitas.
          </h2>
          <p>
            Los detalles que importan,
            <br />
            sin letra pequeña.
          </p>
        </div>
        <div className="product-accordions">
          <details open>
            <summary>
              ¿Es compatible con mi tarea? <Icon name="plus" size={18} />
            </summary>
            <p>{product.compatibility}</p>
          </details>
          <details>
            <summary>
              Especificaciones del producto <Icon name="plus" size={18} />
            </summary>
            <dl>
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </details>
          <details>
            <summary>
              ¿Qué incluye? <Icon name="plus" size={18} />
            </summary>
            <p>{product.includes}</p>
          </details>
          <details>
            <summary>
              Envíos, cambios y garantías <Icon name="plus" size={18} />
            </summary>
            <p>
              Esta es una demostración sin venta real. Cobertura, tarifas y
              plazos son simulados; las políticas y garantías comerciales aún no
              están aprobadas.
            </p>
            <Link href="/informacion">Conoce los detalles de la demo</Link>
          </details>
        </div>
      </section>)}
      <section className="related-products section-space">
        <div className="section-heading">
          <h2>Explora otros productos.</h2>
          <Link href="/catalogo" className="text-link">
            Explorar catálogo <Icon name="arrow" size={20} />
          </Link>
        </div>
        <div className="product-grid">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
