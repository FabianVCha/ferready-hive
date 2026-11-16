import { notFound } from "next/navigation";
import { CheckoutView } from "@/components/ferready/purchase";
import { isDemoEnabled } from "@/lib/prototype.mjs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Compra de demostración",
  robots: { index: false, follow: false },
};
export default function CheckoutPage() {
  if (!isDemoEnabled(process.env.FERREADY_DEMO)) notFound();
  return <CheckoutView />;
}
