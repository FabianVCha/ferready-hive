import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>No encontrado</h1>
      <p className="meta">Esta referencia no existe o todavía no está publicada.</p>
      <p>
        <Link href="/">Volver al catálogo</Link>
      </p>
    </>
  );
}
