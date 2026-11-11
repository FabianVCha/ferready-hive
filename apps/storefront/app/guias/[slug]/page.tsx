import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";

import { getGuide } from "@/lib/guides";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  return {
    title: guide?.title ?? "Guía no encontrada",
    alternates: { canonical: `/guias/${slug}` },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);

  if (!guide) {
    notFound();
  }

  const html = marked.parse(guide.markdown, { async: false });

  return (
    <article>
      <p className="meta">
        <Link href="/guias">Guías</Link> / {guide.slug}
      </p>
      <h1>{guide.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
