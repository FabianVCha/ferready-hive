import { notFound } from "next/navigation";
import { CatalogView } from "@/components/ferready/storefront";
import { isDemoEnabled } from "@/lib/prototype.mjs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Todos los productos",
  robots: { index: false, follow: false },
};
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!isDemoEnabled(process.env.FERREADY_DEMO)) notFound();
  const { q } = await searchParams;
  return (
    <CatalogView key={q || "all"} query={typeof q === "string" ? q : ""} />
  );
}
