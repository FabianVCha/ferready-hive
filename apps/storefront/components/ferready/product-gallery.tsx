"use client";

import { useState } from "react";
import type { DisplayProduct } from "./catalog-context";
import "./product-gallery.css";

/** Supplements the original journey, without coupling gallery choice to scroll. */
export function ProductGallery({ product }: { product: DisplayProduct }) {
  const [index, setIndex] = useState(0);
  const gallery = product.gallery ?? [];
  if (!gallery.length) return null;
  const current = gallery[index];
  const select = (next: number) => setIndex((next + gallery.length) % gallery.length);
  return (
    <section id="imagenes-producto" className="product-gallery" aria-label={`Imágenes de ${product.name}`}>
      <h2>Imágenes del producto</h2>
      <figure>
        <img src={current.src} alt={`${product.name} · ${current.kind === "photo" ? "fotografía" : "ilustración"} ${index + 1}`} width="1200" height="1200" />
        <figcaption aria-live="polite">
          <strong>{index + 1} / {gallery.length}</strong> · {current.caption}
          <details><summary>Procedencia de esta imagen</summary><p>{current.provenance}</p></details>
          {current.original && <a href={current.original}>Ver fotografía original sin editar</a>}
        </figcaption>
      </figure>
      {gallery.length > 1 && <>
        <div className="gallery-controls">
          <button type="button" onClick={() => select(index - 1)} aria-label="Imagen anterior">Anterior</button>
          <button type="button" onClick={() => select(index + 1)} aria-label="Imagen siguiente">Siguiente</button>
        </div>
        <div className="gallery-thumbnails" role="group" aria-label="Seleccionar imagen" onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft" || event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? gallery.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + gallery.length) % gallery.length;
            setIndex(next);
            event.currentTarget.querySelectorAll("button")[next]?.focus();
          }
        }}>
          {gallery.map((entry, position) => <button type="button" key={entry.src} aria-label={`Ver imagen ${position + 1}: ${entry.kind === "photo" ? "fotografía" : "ilustración"}`} aria-pressed={position === index} onClick={() => setIndex(position)}>
            <img src={entry.src} alt="" width="100" height="100" loading="lazy" />
            <span>{entry.kind === "photo" ? "Foto" : "Ilustración"}</span>
          </button>)}
        </div>
      </>}
    </section>
  );
}
