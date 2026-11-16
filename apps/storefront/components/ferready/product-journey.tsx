"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { campaign, journeyState, productStory } from "@/lib/campaign.mjs";
import type { DemoProduct } from "@/lib/prototype.mjs";
import { money } from "./catalog";
import { Icon, useCart } from "./shell";
import { ProductFigure } from "./product-figure";

export function ProductJourney({ product }: { product: DemoProduct }) {
  const root = useRef<HTMLElement>(null);
  const object = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { add, ready } = useCart();
  const router = useRouter();
  const story = productStory(product);
  useEffect(() => {
    if (!root.current || !object.current || !box.current || still) return;
    gsap.registerPlugin(ScrollTrigger);
    const element = root.current;
    const figure = object.current;
    const parcel = box.current;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference) and (min-height: 810px), (prefers-reduced-motion: no-preference) and (min-width: 761px) and (min-height: 700px)", () => {
      element.classList.add("is-enhanced");
      const panels = element.querySelectorAll<HTMLElement>("[data-journey-chapter]");
      const tabs = element.querySelectorAll<HTMLElement>(".journey-stops a");
      const driver = { progress: 0 };
      let lastChapter = -1;
      const render = () => {
        const state = journeyState(driver.progress);
        gsap.set(figure, { yPercent: state.y, scale: state.scale, rotation: state.rotation, rotationY: state.rotationY, transformPerspective: 1100 });
        gsap.set(parcel, { autoAlpha: Math.min(1, Math.max(0, (driver.progress - 0.69) / 0.08)), y: (1 - state.packing) * 22 });
        element.style.setProperty("--packing", String(state.packing));
        element.style.setProperty("--journey-progress", String(driver.progress));
        element.dataset.phase = String(state.chapter);
        element.dataset.packed = state.packing > 0.96 ? "true" : "false";
        if (state.chapter !== lastChapter) {
          panels.forEach((panel, index) => {
            const active = index === state.chapter;
            panel.setAttribute("aria-hidden", String(!active));
            panel.inert = !active;
          });
          tabs.forEach((tab, index) => activeTab(tab, index === state.chapter));
          lastChapter = state.chapter;
        }
      };
      const inset = window.matchMedia("(max-width: 760px)").matches ? 124 : 88;
      const tween = gsap.to(driver, { progress: 1, ease: "none", onUpdate: render, scrollTrigger: { trigger: element, start: `top ${inset}px`, end: "bottom bottom", scrub: 0.35, invalidateOnRefresh: true } });
      render();
      const refresh = () => ScrollTrigger.refresh();
      const images = Array.from(element.querySelectorAll("img"));
      images.forEach((image) => image.addEventListener("load", refresh));
      ScrollTrigger.refresh();
      return () => {
        tween.kill();
        element.classList.remove("is-enhanced");
        delete element.dataset.phase;
        delete element.dataset.packed;
        figure.style.removeProperty("transform");
        parcel.style.removeProperty("transform");
        parcel.style.removeProperty("opacity");
        parcel.style.removeProperty("visibility");
        element.style.removeProperty("--packing");
        element.style.removeProperty("--journey-progress");
        panels.forEach((panel) => { panel.removeAttribute("aria-hidden"); panel.inert = false; });
        tabs.forEach((tab) => tab.removeAttribute("aria-current"));
        images.forEach((image) => image.removeEventListener("load", refresh));
      };
    }, element);
    return () => media.revert();
  }, [product.slug, still]);

  function activeTab(tab: HTMLElement, active: boolean) {
    if (active) tab.setAttribute("aria-current", "step");
    else tab.removeAttribute("aria-current");
  }

  const jump = (event: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    const element = root.current;
    if (!element?.classList.contains("is-enhanced")) return;
    event.preventDefault();
    const inset = window.matchMedia("(max-width: 760px)").matches ? 124 : 88;
    const top = element.getBoundingClientRect().top + window.scrollY - inset;
    const distance = element.offsetHeight - window.innerHeight + inset;
    window.scrollTo({ top: top + distance * (index === 3 ? 1 : (index + 0.1) / 4), behavior: "smooth" });
  };

  return (
    <section ref={root} className={`product-journey ${still ? "journey-still" : ""}`} id="recorrido" aria-label={`Recorrido visual de ${product.name}`}>
      <div className="journey-stage">
        <div className="journey-topline"><span>Conoce lo que eliges.</span><button className="text-link" onClick={() => setStill(!still)} aria-pressed={still}>{still ? "Activar animación" : "Ver sin animación"}<Icon name={still ? "arrow" : "minus"} size={17} /></button></div>
        <nav className="journey-stops" aria-label="Etapas del producto">
          {["El producto", "Tu proyecto", "Qué incluye", "A tu caja"].map((label, index) => <a href={`#etapa-${index}-${product.slug}`} onClick={(event) => jump(event, index)} key={label}>{label}</a>)}
        </nav>
        <div className="journey-composition">
          <div className="journey-copy">
            {story.chapters.map((chapter, index) => <article data-journey-chapter id={`etapa-${index}-${product.slug}`} key={chapter.title}>
              <h2>{chapter.title}</h2>
              <p>{chapter.body}</p>
              {chapter.detail && <div className="journey-fact"><strong>{chapter.detail[1]}</strong><span>{chapter.detail[0]}</span></div>}
              {index === 2 && <Link className="text-link" href="#especificaciones">Revisar todos los detalles <Icon name="arrow" size={20} /></Link>}
            </article>)}
            <article data-journey-chapter id={`etapa-3-${product.slug}`} className="journey-checkout">
              <h2>Tu próximo proyecto.<br />En camino.</h2>
              <p>Ya lo conoces. Ahora elige cuántos necesitas y arma tu pedido.</p>
              <p className="journey-final-name">{product.name}</p>
              <p className="journey-price">{money(product.price)} <small>COP · precio demo</small></p>
              <div className="buy-controls">
                <div className="quantity-control"><button aria-label="Disminuir cantidad del recorrido" disabled={quantity === 1} onClick={() => setQuantity(quantity - 1)}><Icon name="minus" size={16} /></button><output aria-label="Cantidad del recorrido">{quantity}</output><button aria-label="Aumentar cantidad del recorrido" disabled={quantity === 20} onClick={() => setQuantity(quantity + 1)}><Icon name="plus" size={16} /></button></div>
                <button className="button button-red" disabled={!ready} onClick={() => add(product.slug, quantity)}>Agregar al carrito <Icon name="bag" size={20} /></button>
              </div>
              <button className="button button-dark journey-buy" disabled={!ready} onClick={() => { add(product.slug, quantity); router.push("/checkout"); }}>Comprar este producto <Icon name="arrow" size={20} /></button>
              <small className="journey-disclosure">Empaque y pedido de demostración. No se realiza un pago.</small>
            </article>
          </div>
          <div className="journey-visual" aria-label="Presentación visual y empaque ilustrativo">
            <div className="journey-orbit" aria-hidden="true" />
            <div ref={object} className="journey-object"><ProductFigure src={story.image} alt={product.name} /></div>
            <div ref={box} className="shipping-parcel" aria-hidden="true">
              <div className="parcel-back" />
              <div className="parcel-flap parcel-flap-left" />
              <div className="parcel-flap parcel-flap-right" />
              <div className="parcel-front"><img src={campaign.brand.logoLight} alt="" width="180" height="48" /><span>Una nueva idea por abrir.</span></div>
              <div className="parcel-side" />
            </div>
            <p className="journey-image-note">Fotografía de referencia · animación ilustrativa</p>
          </div>
        </div>
        <div className="journey-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
