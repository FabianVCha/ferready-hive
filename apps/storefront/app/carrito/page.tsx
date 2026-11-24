import { notFound } from "next/navigation";
import { CartView } from "@/components/ferready/purchase";
import { isDemoEnabled } from "@/lib/prototype.mjs";
import { usesApprovedCatalog } from "@/lib/approved-catalog";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tu carrito",
  robots: { index: false, follow: false },
};
export default function CartPage() {
  if (usesApprovedCatalog && !isDemoEnabled(process.env.FERREADY_DEMO)) return <CartView selection />;
  if (!isDemoEnabled(process.env.FERREADY_DEMO)) notFound();
  return <CartView />;
}
