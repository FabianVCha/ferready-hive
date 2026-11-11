import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductByHandle, priceOf, referenceOf } from "@/lib/medusa";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = await getProductByHandle(slug);
  const canonical = `/p/${slug}`;

  return {
    title: product?.title ?? "Producto no disponible",
    alternates: { canonical },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductByHandle(slug);

  if (!product) {
    notFound();
  }

  const reference = referenceOf(product);
  const price = priceOf(product);
  const variants = Array.isArray(product.metadata?.content_variants)
    ? (product.metadata?.content_variants as { label: string }[])
    : [];

  return (
    <article>
      <p className="meta">
        <Link href="/">Catálogo</Link> / {product.handle}
      </p>
      <h1>{product.title}</h1>
      {reference && <p className="meta">{reference}</p>}
      {price ? <p className="price">{price}</p> : <p className="meta">Precio por confirmar con el proveedor</p>}
      {product.description && <p>{product.description}</p>}

      {variants.length > 0 && (
        <>
          <h2>Contenido</h2>
          <ul className="variants">
            {variants.map((variant) => (
              <li key={variant.label}>{variant.label}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
