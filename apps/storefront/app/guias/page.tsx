import Link from "next/link";

import { listGuides } from "@/lib/guides";

export const dynamic = "force-dynamic";

export const metadata = { title: "Guías", alternates: { canonical: "/guias" } };

export default async function GuidesPage() {
  const guides = await listGuides();

  return (
    <>
      <h1>Guías</h1>
      {guides.length === 0 ? (
        <p className="meta">Sin guías publicadas todavía.</p>
      ) : (
        <ul className="grid">
          {guides.map((guide) => (
            <li className="card" key={guide.slug}>
              <h2>
                <Link href={`/guias/${guide.slug}`}>{guide.title}</Link>
              </h2>
              {guide.updated && <p className="meta">Actualizada: {guide.updated}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
