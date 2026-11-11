import Link from "next/link";

import { listCategories, listProducts, priceOf, referenceOf } from "@/lib/medusa";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const categories = await listCategories();
  const category = categories.find((item) => item.handle === handle);
  return { title: category?.name ?? "Categoría", alternates: { canonical: `/c/${handle}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { handle } = await params;
  const [categories, products] = await Promise.all([listCategories(), listProducts(handle)]);
  const category = categories.find((item) => item.handle === handle);

  return (
    <>
      <p className="meta">
        <Link href="/">Catálogo</Link> / {handle}
      </p>
      <h1>{category?.name ?? handle}</h1>

      {products.length === 0 ? (
        <p className="meta">Sin productos publicados en esta categoría.</p>
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
