"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { campaign } from "@/lib/campaign.mjs";
import { products, categories, money } from "./catalog";
import { Icon, useCart } from "./shell";
import { ProductFigure } from "./product-figure";
import { ProductCard } from "./storefront";

export function CampaignHome() {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { add, ready } = useCart();
  const selection = campaign.featured.flatMap((slug) => products.filter((p) => p.slug === slug));
  const product = selection[selected];
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".campaign-copy > *, .campaign-buy > *", { y: 22, opacity: 0, stagger: 0.07, duration: 0.7, ease: "power3.out", clearProps: "opacity,transform" });
      gsap.to(".campaign-stage", { yPercent: 8, rotation: 2, ease: "none", scrollTrigger: { trigger: ".campaign-hero", start: "top top", end: "bottom top", scrub: 0.5 } });
      gsap.to(".scene-case", { yPercent: -12, rotation: -7, ease: "none", scrollTrigger: { trigger: ".campaign-hero", start: "top top", end: "bottom top", scrub: 0.7 } });
      gsap.utils.toArray<HTMLElement>("[data-campaign-reveal]").forEach((section) => {
        gsap.from(section.children, { y: 26, opacity: 0, stagger: 0.08, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: section, start: "top 90%", once: true }, clearProps: "opacity,transform" });
      });
    }, root);
    return () => media.revert();
  }, []);
  return (
    <div ref={root} className="campaign-home">
      <section className="campaign-hero" aria-label="Selección de campaña">
        <div className="campaign-wedge" aria-hidden="true" />
        <div className="campaign-worktop" aria-hidden="true" />
        <div className="campaign-copy">
          <h1>{campaign.headline}</h1>
          <p>{campaign.description}</p>
          <Link className="campaign-explore" href="/catalogo">Explorar la selección <Icon name="arrow" size={20} /></Link>
        </div>
        <div className="campaign-stage" aria-live="polite">
          <ProductFigure className="scene-case" src="/ferready/products/279788.webp" alt="Caja y organizador Bauker" />
          <ProductFigure key={product.slug} className="scene-main" src={product.image} alt={product.name} priority />
          <ProductFigure className="scene-bits" src="/ferready/products/167850.webp" alt="Brocas para elegir según el material" />
        </div>
        <div className="campaign-buy">
          <Link href={`/p/${product.slug}`}><h2>{product.name}</h2></Link>
          <p className="campaign-price">{money(product.price)} <small>COP</small></p>
          <p className="campaign-demo">Precio de demostración.</p>
          <div className="campaign-purchase">
            <div className="quantity-control">
              <button aria-label="Disminuir cantidad destacada" disabled={quantity === 1} onClick={() => setQuantity(quantity - 1)}><Icon name="minus" size={16} /></button>
              <output aria-label="Cantidad destacada">{quantity}</output>
              <button aria-label="Aumentar cantidad destacada" disabled={quantity === 20} onClick={() => setQuantity(quantity + 1)}><Icon name="plus" size={16} /></button>
            </div>
            <button className="button button-red" disabled={!ready} onClick={() => add(product.slug, quantity)}>Agregar al carrito <Icon name="bag" size={19} /></button>
          </div>
          <Link className="campaign-product-link" href={`/p/${product.slug}`}>Conócelo de cerca <Icon name="diagonal" size={18} /></Link>
        </div>
        <div className="campaign-selector" role="group" aria-label="Producto de campaña">
          {selection.map((p, index) => <button key={p.slug} aria-pressed={selected === index} onClick={() => { setSelected(index); setQuantity(1); }}><span>{p.brand}</span>{index === 0 ? "Para crear" : index === 1 ? "Para organizar" : "Para resolver"}<Icon name="arrow" size={17} /></button>)}
        </div>
      </section>

      <section id="por-tarea" className="campaign-section project-section" data-campaign-reveal>
        <div className="section-heading"><h2>Elige tu próximo proyecto.</h2><Link href="/catalogo" className="text-link">O ve directo al catálogo <Icon name="arrow" size={20} /></Link></div>
        <div className="campaign-projects">
          {campaign.projects.map((project) => <Link className={`campaign-project project-${project.tone}`} href={project.href} key={project.href}>
            <ProductFigure src={project.image} alt={project.title} />
            <div><h3>{project.title}</h3><p>{project.description}</p></div><Icon name="diagonal" size={24} />
          </Link>)}
        </div>
      </section>

      <section className="campaign-study" data-campaign-reveal>
        <div className="study-visual"><ProductFigure src={products[0].image} alt={products[0].name} /><span className="study-fact">{Object.values(products[0].specs)[0]} <small>La referencia, de cerca.</small></span></div>
        <div className="study-copy"><h2>No solo lo mires.<br />Conócelo.</h2><p>Recorre sus detalles, revisa qué incluye y descubre si encaja con lo que quieres hacer.</p><Link className="button button-paper" href={`/p/${products[0].slug}#recorrido`}>Explorar el producto <Icon name="diagonal" size={21} /></Link><span className="study-disclosure">Imágenes de referencia · experiencia de demostración.</span></div>
      </section>

      <section className="campaign-section" data-campaign-reveal>
        <div className="section-heading"><div><h2>Tu siguiente buena elección.</h2><p>Herramientas, piezas y posibilidades.</p></div><Link className="text-link" href="/catalogo">Ver todos los productos <Icon name="arrow" /></Link></div>
        <div className="product-grid">{[products[0], products[5], products[6], products[14]].map((p) => <ProductCard product={p} key={p.slug} />)}</div>
      </section>

      <section className="campaign-section category-index" data-campaign-reveal>
        <h2>Encuentra tu punto de partida.</h2>
        <div>{categories.map((category) => <Link key={category.slug} href={`/c/${category.slug}`}><span>{category.name}</span><Icon name="arrow" size={25} /></Link>)}</div>
      </section>

      <section className="campaign-close" data-campaign-reveal>
        <div><h2>De la idea<br />al siguiente paso.</h2><p>Explora, revisa los detalles y arma tu pedido de demostración.</p><Link className="button button-dark" href="/catalogo">Comprar en la web <Icon name="arrow" /></Link></div>
        <ProductFigure src="/ferready/products/279788.webp" alt="Caja y organizador de herramientas Bauker" />
      </section>
    </div>
  );
}
