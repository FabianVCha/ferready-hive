import { notFound } from "next/navigation";
import { CartView } from "@/components/ferready/purchase";
import { isDemoEnabled } from "@/lib/prototype.mjs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tu carrito",
  robots: { index: false, follow: false },
};
export default function CartPage() {
  if (!isDemoEnabled(process.env.FERREADY_DEMO)) notFound();
  return <CartView />;
}
