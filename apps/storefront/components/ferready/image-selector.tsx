"use client";

import type { DisplayProduct } from "./catalog-context";
import "./image-selector.css";

export function ImageSelector({ product, index, onSelect }: { product: DisplayProduct; index: number; onSelect: (index: number) => void }) {
  const images = product.gallery ?? [];
  if (images.length < 2) return null;
  return <div className="image-selector" aria-label={`Vistas de ${product.model ?? product.name}`}>
    <div className="image-selector-thumbnails" role="group" aria-label="Seleccionar vista del producto" onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? images.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + images.length) % images.length;
      onSelect(next);
      event.currentTarget.querySelectorAll("button")[next]?.focus();
    }}>
      {images.map((image, position) => <button type="button" key={image.src} aria-pressed={index === position} aria-label={`Ver vista ${position + 1}: ${image.kind === "photo" ? "fotografía" : "ilustración"}`} onClick={() => onSelect(position)}>
        <img src={image.src} width="64" height="56" alt="" />
        <span>{image.kind === "photo" ? "Foto" : "Ilustración"}</span>
      </button>)}
    </div>
    <p aria-live="polite">{index + 1} / {images.length} · {images[index].kind === "photo" ? "Fotografía del fabricante" : "Ilustración suministrada · no es fotografía del fabricante"}</p>
  </div>;
}
