import { notFound } from "next/navigation";
import { CatalogView } from "@/components/ferready/storefront";
import { isDemoEnabled } from "@/lib/prototype.mjs";
import { usesApprovedCatalog } from "@/lib/approved-catalog";

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
  const { q } = await searchParams;
  if (!isDemoEnabled(process.env.FERREADY_DEMO)) {
    if (!usesApprovedCatalog) notFound();
    return <CatalogView key={q || "all"} query={typeof q === "string" ? q : ""} />;
  }
  return (
    <CatalogView key={q || "all"} query={typeof q === "string" ? q : ""} />
  );
}
