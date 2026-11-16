import { notFound } from "next/navigation";
import { InformationView } from "@/components/ferready/purchase";
import { isDemoEnabled } from "@/lib/prototype.mjs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Envíos e información",
  robots: { index: false, follow: false },
};
export default function InformationPage() {
  if (!isDemoEnabled(process.env.FERREADY_DEMO)) notFound();
  return <InformationView />;
}
