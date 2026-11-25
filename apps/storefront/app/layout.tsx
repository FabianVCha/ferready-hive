import type { Metadata } from "next";
import Link from "next/link";
import { DemoShell } from "@/components/ferready/shell";
import { isDemoEnabled } from "@/lib/prototype.mjs";
import { storefront } from "@/data/storefront.mjs";
import { brandIcon } from "@/lib/storefront-brand.mjs";
import { approvedCatalog, approvedVisualCatalog, usesApprovedCatalog } from "@/lib/approved-catalog";

import "./globals.css";
import "./ferready.css";
import "./campaign.css";
import "./template.css";

const demo = isDemoEnabled(process.env.FERREADY_DEMO);
export const metadata: Metadata = demo
  ? {
      title: {
        default: storefront.brandName,
        template: `%s | ${storefront.brandName}`,
      },
      description:
        storefront.description,
      robots: { index: false, follow: false },
      icons: { icon: brandIcon(storefront) },
    }
  : {
      title: { default: storefront.brandName, template: `%s · ${storefront.brandName}` },
      description: "Referencias y fichas técnicas. Precio y disponibilidad por confirmar.",
      icons: { icon: brandIcon(storefront) },
    };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (demo || usesApprovedCatalog)
    return (
      <html lang="es-CO">
        <body>
          <DemoShell informational={!demo} approvedCategories={approvedCatalog.categories} visualCatalog={!demo ? approvedVisualCatalog : undefined}>{children}</DemoShell>
        </body>
      </html>
    );
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            {storefront.brandName}
          </Link>
          <nav>
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/guias">Guías</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>{storefront.brandName} · contenido aprobado manualmente</p>
        </footer>
      </body>
    </html>
  );
}
