"use client";

import { useEffect, useRef, useState } from "react";

/** Only remove the connected studio background; retain isolated metal highlights. */
function removeStudioGround(context: CanvasRenderingContext2D, width: number, height: number) {
  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  const seen = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;
  const visit = (index: number) => {
    if (seen[index]) return;
    seen[index] = 1;
    const offset = index * 4;
    const minimum = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    const maximum = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    if (minimum > 224 && maximum - minimum < 26) queue[tail++] = index;
  };
  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 1; y < height - 1; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++];
    pixels[index * 4 + 3] = 0;
    const x = index % width;
    if (x > 0) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    if (index >= width) visit(index - width);
    if (index < width * (height - 1)) visit(index + width);
  }
  context.putImageData(frame, 0, 0);
}

export function ProductFigure({ src, alt, className = "", priority = false }: {
  src: string; alt: string; className?: string; priority?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [painted, setPainted] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setPainted(false);
    setFailed(false);
    const image = new Image();
    image.onload = () => {
      if (cancelled || !canvas.current) return;
      const ratio = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.round(image.naturalWidth * ratio);
      const height = Math.round(image.naturalHeight * ratio);
      const context = canvas.current.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      canvas.current.width = width;
      canvas.current.height = height;
      context.drawImage(image, 0, 0, width, height);
      try {
        removeStudioGround(context, width, height);
        setPainted(true);
      } catch {
        // The unmodified photograph remains the accessible fallback.
      }
    };
    image.onerror = () => { if (!cancelled) setFailed(true); };
    image.src = src;
    return () => { cancelled = true; image.onload = null; image.onerror = null; };
  }, [src]);
  return (
    <div className={`product-figure ${painted ? "figure-painted" : ""} ${className}`} role="img" aria-label={alt}>
      <canvas ref={canvas} aria-hidden="true" />
      {!failed && <img src={src} alt="" width="832" height="832" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} onError={() => setFailed(true)} />}
      {failed && <span className="figure-fallback">Imagen no disponible. Consulta los detalles del producto.</span>}
    </div>
  );
}
