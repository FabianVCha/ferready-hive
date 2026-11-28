import { notFound } from "next/navigation";
import { CatalogView } from "@/components/ferready/storefront";
import { isDemoEnabled } from "@/lib/prototype.mjs";
import { usesApprovedCatalog } from "@/lib/approved-catalog";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Todos los productos",
  robots: { index: false, follow: false },
};
export default function CatalogPage() {
  if (!isDemoEnabled(process.env.FERREADY_DEMO) && !usesApprovedCatalog) notFound();
  return <CatalogView />;
}
