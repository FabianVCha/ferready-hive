import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CatalogView } from "@/components/ferready/storefront";
import { categories as demoCategories } from "@/components/ferready/catalog";
import { isDemoEnabled } from "@/lib/prototype.mjs";
import { approvedCatalog, usesApprovedCatalog } from "@/lib/approved-catalog";

import {
  listCategories,
  listProducts,
  priceOf,
  referenceOf,
} from "@/lib/medusa";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  if (isDemoEnabled(process.env.FERREADY_DEMO))
    return {
      title: demoCategories.find((c) => c.slug === handle)?.name ?? "Categoría",
      alternates: { canonical: `/c/${handle}` },
      robots: { index: false, follow: false },
    };
  if (usesApprovedCatalog) return {
    title: approvedCatalog.categories.find((item) => item.handle === handle)?.name ?? "Categoría",
    alternates: { canonical: `/c/${handle}` },
    robots: { index: false, follow: false },
  };
  const categories = await listCategories();
  const category = categories.find((item) => item.handle === handle);
  return {
    title: category?.name ?? "Categoría",
    alternates: { canonical: `/c/${handle}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { handle } = await params;
  if (isDemoEnabled(process.env.FERREADY_DEMO)) {
    if (!demoCategories.some((c) => c.slug === handle)) notFound();
    return <CatalogView key={handle} category={handle} />;
  }
  if (usesApprovedCatalog) {
    if (handle === "seleccion-inicial") {
      const params = await searchParams;
      const filters = new URLSearchParams();
      for (const name of ["q", "brand", "sort"]) {
        const value = params[name];
        if (typeof value === "string" && value) filters.set(name, value);
      }
      redirect(filters.size ? `/catalogo?${filters}` : "/catalogo");
    }
    if (!approvedCatalog.categories.some((item) => item.handle === handle)) notFound();
    return <CatalogView key={handle} category={handle} />;
  }
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(handle),
  ]);
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
                {price ? (
                  <p className="price">{price}</p>
                ) : (
                  <p className="meta">Precio por confirmar</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
