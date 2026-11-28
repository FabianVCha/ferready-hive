"use client";

import { useState } from "react";
import type { DisplayProduct } from "./catalog-context";
import { Icon } from "./shell";
import "./product-explorer.css";

export function ProductSpotlight({ product }: { product: DisplayProduct }) {
  const facts = Object.entries(product.specs).filter(([label]) => label !== "Incluye").slice(0, 3);
  const [selected, setSelected] = useState(0);
  const fact = facts[selected] ?? facts[0];

  if (!fact) return <p className="detail-description">{product.description}</p>;

  return (
    <div className="product-spotlight">
      <p className="detail-description">{product.description}</p>
      <div className="spotlight-choices" role="group" aria-label="Datos del producto">
        {facts.map(([label, value], index) => (
          <button key={label} type="button" aria-pressed={fact[0] === label} onClick={() => setSelected(index)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </button>
        ))}
      </div>
      <p className="spotlight-reading" aria-live="polite">
        <strong>{fact[0]}.</strong>{" "}
        {fact[0] === "Código"
          ? "Úsalo para localizar esta referencia en la ficha del fabricante."
          : fact[0] === "Modelo"
            ? "Compáralo con el modelo indicado en la ficha del fabricante."
            : "Consulta este dato junto con las especificaciones de la referencia."}
      </p>
    </div>
  );
}

const topics = [
  { id: "project", label: "¿Es para mí?", title: "Primero, tu proyecto." },
  { id: "specs", label: "Los detalles", title: "Conoce sus números." },
  { id: "contents", label: "Dentro de la caja", title: "Sin sorpresas al abrir." },
  { id: "care", label: "Después de elegir", title: "Consulta al fabricante." },
] as const;

export type ProductTopic = (typeof topics)[number]["id"];

export function ProductExplorer({ product, active, onChange }: {
  product: DisplayProduct;
  active: ProductTopic;
  onChange: (topic: ProductTopic) => void;
}) {
  return (
    <section className="product-explorer" id="especificaciones" aria-labelledby="explorer-title" tabIndex={-1}>
      <div className="explorer-intro">
        <h2 id="explorer-title">No solo verla.<br />Conocerla.</h2>
        <p>Elige qué quieres descubrir de esta referencia. Los datos, el contenido y lo que conviene revisar antes de decidir.</p>
        <div className="explorer-topics" role="group" aria-label="Explorar información del producto">
          {topics.map(({ id, label }) => (
            <button type="button" key={id} onClick={() => onChange(id)} aria-controls={`explorer-${id}`} aria-expanded={active === id}>
              {label}<Icon name="diagonal" size={18} />
            </button>
          ))}
        </div>
      </div>
      <div className="explorer-reading">
        {topics.map(({ id, title, label }) => (
          <article id={`explorer-${id}`} key={id} hidden={active !== id} aria-label={label}>
            <h3>{title}</h3>
            {id === "project" && <>
              <p>{product.description}</p>
              <p>{product.compatibility}</p>
              <a className="text-link" href="#recorrido">Volver al recorrido visual <Icon name="diagonal" size={18} /></a>
            </>}
            {id === "specs" && <>
              <p>Compara la referencia, no solo la apariencia.</p>
              <dl>
                {Object.entries(product.specs).map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </>}
            {id === "contents" && <>
              <p>{product.includes}</p>
              {product.gallery?.some(({ kind }) => kind === "illustration") && (
                <p className="explorer-note">Las imágenes identificadas como ilustraciones no son fotografías.</p>
              )}
            </>}
            {id === "care" && <>
              <p>Consulta las indicaciones de uso y mantenimiento del fabricante para esta referencia.</p>
              <p>Precio, disponibilidad, cobertura, tarifas y garantías comerciales por confirmar. Este catálogo no habilita compras en línea.</p>
              {product.source && (
                <a href={product.source} target="_blank" rel="noreferrer" className="text-link">
                  Consultar ficha del fabricante <Icon name="diagonal" size={18} />
                </a>
              )}
            </>}
          </article>
        ))}
      </div>
    </section>
  );
}
