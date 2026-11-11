import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "hive-web", template: "%s · hive-web" },
  description: "Catálogo y guías de hive-web",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            hive-web
          </Link>
          <nav>
            <Link href="/">Catálogo</Link>
            <Link href="/guias">Guías</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>hive-web · contenido aprobado manualmente</p>
        </footer>
      </body>
    </html>
  );
}
