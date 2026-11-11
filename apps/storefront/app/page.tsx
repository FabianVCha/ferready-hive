import Link from "next/link";

import { isBackendReachable, listCategories, listProducts, priceOf, referenceOf } from "@/lib/medusa";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, products, reachable] = await Promise.all([
    listCategories(),
    listProducts(),
    isBackendReachable(),
  ]);

  return (
    <>
      <h1>{categories.length > 0 ? "Catálogo" : "hive-web"}</h1>

      {!reachable && (
        <p className="notice">
          El backend no responde o falta <code>NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY</code>. Esta página no
          muestra productos hasta que el catálogo local esté disponible.
        </p>
      )}

      {categories.length > 0 && (
        <ul className="variants">
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={`/c/${category.handle}`}>{category.name}</Link>
            </li>
          ))}
        </ul>
      )}

      {products.length === 0 ? (
        <p className="meta">Sin productos publicados.</p>
      ) : (
        <ul className="grid">
          {products.map((product) => {
            const reference = referenceOf(product);
            const price = priceOf(product);
            return (
              <li className="card" key={product.id}>
                <h2>
                  <Link href={`/p/${product.handle}`}>{product.title}</Link>
                </h2>
                {reference && <p className="meta">{reference}</p>}
                {price ? <p className="price">{price}</p> : <p className="meta">Precio por confirmar</p>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
