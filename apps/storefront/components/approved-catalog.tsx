import Link from "next/link";
import type { CatalogProduct } from "@hive-web/catalog-schema";
import { approvedCatalog } from "@/lib/approved-catalog";
import styles from "./approved-catalog.module.css";

export function ApprovedCatalog({ category, query = "" }: { category?: string; query?: string }) {
  const selected = approvedCatalog.categories.find((item) => item.handle === category);
  const products = approvedCatalog.products.filter((product) =>
    (!category || product.category === category) &&
    `${product.title} ${product.reference} ${product.model}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))
  );
  return (
    <section className={`${styles.catalog} catalog-page page-pad`}>
      <h1>{selected?.name ?? "Herramientas Truper"}</h1>
      <p>Consulta las referencias y sus características. Precio y disponibilidad por confirmar; sin compra en línea.</p>
      <nav aria-label="Categorías del catálogo" className={styles.categories}>
        <Link href="/catalogo">Todas las herramientas</Link>
        {approvedCatalog.categories.map((item) => (
          <Link key={item.handle} href={`/c/${item.handle}`}>{item.name}</Link>
        ))}
      </nav>
      <form action="/catalogo" role="search" className={styles.search}>
        <label htmlFor="catalog-search">Buscar por nombre, código o modelo</label>{" "}
        <input id="catalog-search" name="q" defaultValue={query} />
        <button type="submit">Buscar</button>
      </form>
      <p>{products.length} referencias</p>
      <ul className={`${styles.products} product-grid catalog-products`}>
        {products.map((product) => (
          <li className={`${styles.product} card product-card`} key={product.reference}>
            <Link href={product.path!}>
              {product.images[0] && <img src={product.images[0]} alt={product.title} width={500} height={500} style={{ width: "100%", height: "15rem", objectFit: "contain" }} />}
              {!product.images.length && <div className={styles.missingImage}>Fotografía no disponible</div>}
              <h2>{product.title}</h2>
            </Link>
            <p>{product.brand} · {product.reference} · {product.model}</p>
            <p>Precio y disponibilidad por confirmar</p>
          </li>
        ))}
      </ul>
      {!products.length && <p>No encontramos referencias con esa búsqueda.</p>}
    </section>
  );
}

export function ApprovedProduct({ product }: { product: CatalogProduct }) {
  return (
    <article className={`${styles.catalog} ${styles.detail} page-pad`}>
      <Link href="/catalogo">Volver al catálogo</Link>
      <h1>{product.title}</h1>
      <p>{product.brand} · Código {product.reference} · Modelo {product.model}</p>
      {product.images[0] && <img src={product.images[0]} alt={product.title} width={600} height={600} style={{ width: "100%", maxWidth: "36rem", height: "auto", background: "white" }} />}
      <p className="notice">Precio y disponibilidad por confirmar. Esta referencia no está habilitada para compra en línea.</p>
      <p>{product.description}</p>
      <h2>Ficha técnica</h2>
      <dl>
        {Object.entries(product.specifications).map(([label, value]) => (
          <div key={label}><dt><strong>{label}</strong></dt><dd>{value}</dd></div>
        ))}
      </dl>
      {product.source_url && <a href={product.source_url} rel="noreferrer" target="_blank">Consultar ficha del fabricante</a>}
    </article>
  );
}
