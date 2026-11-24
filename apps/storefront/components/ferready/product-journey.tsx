"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { journeyState, productStory } from "@/lib/campaign.mjs";
import { Icon } from "./shell";
import { ProductFigure } from "./product-figure";
import { DrillKitTable } from "./drill-kit-table";
import { confirmedContents, productTablePieces } from "@/lib/editorial-media.mjs";
import { storefront } from "@/data/storefront.mjs";
import { brandLogo } from "@/lib/storefront-brand.mjs";
import { useVisualCatalog, type DisplayProduct } from "./catalog-context";

function headerInset() {
  return Math.ceil(document.querySelector(".fr-header")?.getBoundingClientRect().height ?? 88);
}

export function ProductJourney({ product, children }: { product: DisplayProduct; children: ReactNode }) {
  const parcelLogo = brandLogo(storefront);
  const tapeLogo = brandLogo(storefront, true);
  const { informational } = useVisualCatalog();
  const root = useRef<HTMLElement>(null);
  const object = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const finishScrub = useRef<(() => void) | null>(null);
  const [still, setStill] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [pointer, setPointer] = useState(true);
  const [replay, setReplay] = useState(0);
  const [sceneAngle, setSceneAngle] = useState(0);
  const tablePieces = informational ? productTablePieces(product) : undefined;
  const sceneViews = tablePieces?.[0]?.views ?? [];
  const kit = informational ? Boolean(tablePieces?.length) : product.slug === storefront.kitSlug;
  const story = productStory(product);
  const currentScene = sceneAngle && chapter < 2 ? sceneViews.filter(view => view.src !== story.media?.[chapter]?.src)[sceneAngle - 1] : null;
  const contents = confirmedContents(product);
  useEffect(() => {
    const scrollInput = () => setPointer(true);
    window.addEventListener("wheel", scrollInput, { passive: true });
    window.addEventListener("touchstart", scrollInput, { passive: true });
    return () => { window.removeEventListener("wheel", scrollInput); window.removeEventListener("touchstart", scrollInput); };
  }, []);
  useLayoutEffect(() => {
    if (!kit || !root.current) return;
    const project = root.current.querySelector<HTMLElement>(".journey-object");
    const table = root.current.querySelector<HTMLElement>(".kit-table");
    if (!project || !table) return;
    const showingTable = chapter >= 2;
    const duration = still || !pointer || matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280;
    const animations = [
      project.animate([{ opacity: getComputedStyle(project).opacity }, { opacity: showingTable ? 0 : 1 }], { duration, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" }),
      table.animate([{ opacity: getComputedStyle(table).opacity, transform: getComputedStyle(table).transform }, { opacity: showingTable ? 1 : 0, transform: showingTable ? "translateY(0) scale(1)" : "translateY(12px) scale(.96)" }], { duration, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" }),
    ];
    const projectLayer = project.querySelector<HTMLElement>(".journey-media-layer:nth-child(2)");
    if (projectLayer) animations.push(projectLayer.animate([{ transform: getComputedStyle(projectLayer).transform }, { transform: showingTable ? "translate(-8%, 8%) scale(.9)" : "translate(0, 0) scale(1)" }], { duration, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" }));
    return () => { animations.forEach(animation => { animation.commitStyles(); animation.cancel(); }); };
  }, [chapter, kit, still, pointer]);
  useEffect(() => {
    if (!root.current || !object.current || !box.current || still) return;
    gsap.registerPlugin(ScrollTrigger);
    const element = root.current;
    const figure = object.current;
    const parcel = box.current;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      element.classList.add("is-enhanced");
      const driver = { progress: 0 };
      let lastChapter = -1;
      const render = () => {
        const state = journeyState(driver.progress);
        gsap.set(figure, { yPercent: state.y, scale: state.scale, rotation: state.rotation, rotationY: state.rotationY, transformPerspective: 1100 });
        if (!kit) {
          gsap.set(parcel, { autoAlpha: Math.min(1, Math.max(0, (driver.progress - 0.69) / 0.08)), y: (1 - state.packing) * 22 });
          element.style.setProperty("--packing", String(state.packing));
          element.style.setProperty("--parcel-close", String(Math.max(0, Math.min(1, (state.packing - 0.72) / 0.28))));
        }
        element.style.setProperty("--journey-progress", String(driver.progress));
        if (!kit) element.dataset.packed = state.packing > 0.96 ? "true" : "false";
        if (state.chapter !== lastChapter) {
          setChapter(state.chapter);
          lastChapter = state.chapter;
        }
      };
      const updateInset = () => element.style.setProperty("--journey-inset", `${headerInset()}px`);
      updateInset();
      const tween = gsap.to(driver, { progress: 1, ease: "none", onUpdate: render, scrollTrigger: { trigger: element, start: () => `top ${headerInset()}px`, end: "bottom bottom", scrub: 0.35, invalidateOnRefresh: true, onRefreshInit: updateInset } });
      finishScrub.current = () => { ScrollTrigger.update(); tween.scrollTrigger?.getTween()?.progress(1); };
      render();
      const refresh = () => ScrollTrigger.refresh();
      const images = Array.from(element.querySelectorAll("img"));
      images.forEach((image) => image.addEventListener("load", refresh));
      ScrollTrigger.refresh();
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        finishScrub.current = null;
        element.classList.remove("is-enhanced");
        delete element.dataset.packed;
        figure.style.removeProperty("transform");
        parcel.style.removeProperty("transform");
        parcel.style.removeProperty("opacity");
        parcel.style.removeProperty("visibility");
        element.style.removeProperty("--packing");
        element.style.removeProperty("--parcel-close");
        element.style.removeProperty("--journey-progress");
        element.style.removeProperty("--journey-inset");
        images.forEach((image) => image.removeEventListener("load", refresh));
      };
    }, element);
    return () => media.revert();
  }, [product.slug, still, kit]);

  const jump = (event: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    const element = root.current;
    event.preventDefault();
    setPointer(event.detail > 0);
    setReplay(value => value + 1);
    setChapter(index);
    if (!element?.classList.contains("is-enhanced")) {
      if (kit && element) window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - headerInset(), behavior: "instant" });
      return;
    }
    const inset = headerInset();
    const top = element.getBoundingClientRect().top + window.scrollY - inset;
    const distance = element.offsetHeight - window.innerHeight + inset;
     window.scrollTo({ top: top + distance * (index === 3 ? (kit ? .79 : 1) : (index + 0.1) / 4), behavior: kit || event.detail === 0 ? "instant" : "smooth" });
    if (kit) finishScrub.current?.();
  };

  return (
    <section ref={root} data-phase={chapter} data-contents-confirmed={Boolean(contents)} className={`product-journey product-first ${kit ? "drill-kit-journey" : ""} ${still ? "journey-still" : ""}`} id="recorrido" aria-label={`Recorrido visual de ${product.name}`}>
      <div className="journey-stage">
        <div className="journey-product-heading"><h1>{product.name}</h1><Link className="product-brand" href={`/catalogo?q=${encodeURIComponent(product.brand)}`}>{product.brand}</Link></div>
        <div className="journey-topline"><h2>Conoce lo que eliges.</h2><button className="text-link" onClick={() => setStill(!still)} aria-pressed={still}>{still ? "Activar animación" : "Ver sin animación"}<Icon name={still ? "arrow" : "minus"} size={17} /></button></div>
        <nav className="journey-stops" aria-label="Etapas del producto">
          {["El producto", "Tu proyecto", "Qué incluye", "A tu caja"].map((label, index) => <a href={`#etapa-${index}-${product.slug}`} aria-current={chapter === index ? "step" : undefined} onClick={(event) => jump(event, index)} key={label}>{label}</a>)}
        </nav>
        <div className="journey-composition">
          <div className="journey-copy">
            <div className="journey-chapters">
            {story.chapters.map((entry, index) => <article data-journey-chapter aria-hidden={chapter !== index} inert={chapter !== index} id={`etapa-${index}-${product.slug}`} key={entry.title}>
               <h3>{index === 2 && (story.contents || informational) ? "Qué incluye" : entry.title}</h3>
               {index === 2 && informational && contents ? <><ul className="journey-contents"><li>1 taladro</li>{contents.components.map(piece => <li key={piece.id}>1 {piece.label.toLocaleLowerCase("es")}</li>)}</ul><p className="journey-content-note">Inclusión confirmada por el usuario (23/11/2026), no por el fabricante. Accesorios ilustrados; el mango es el mismo montado.</p></> : index === 2 && informational ? <p>{(tablePieces?.length ?? 0) > 1 ? "Producto y accesorios ilustrados; inclusión por confirmar con el fabricante." : "Contenido del empaque por confirmar con el fabricante."}</p> : index === 2 && story.contents ? <><ul className="journey-contents">{story.contents.map(item => <li key={item}>{item}</li>)}</ul><p className="journey-content-note">{story.contentNote}</p></> : index > 0 && <p>{entry.body}</p>}
              {index === 0 && entry.detail && <p className="journey-spec">{entry.detail[0]}: <strong>{entry.detail[1]}</strong></p>}
               {index === 2 && <Link className="text-link" href="#especificaciones">Revisar todos los detalles <Icon name="arrow" size={20} /></Link>}
            </article>)}
            <article data-journey-chapter aria-hidden={chapter !== 3} inert={chapter !== 3} id={`etapa-3-${product.slug}`} className="journey-checkout">
              <h3>{informational ? "Conoce los detalles antes de elegir." : "Tu próximo proyecto. En camino."}</h3>
              <p>{informational ? "Empaque ilustrativo. Precio y disponibilidad por confirmar; sin compra en línea." : "Empaque y pedido de demostración. No se realiza un pago."}</p>
            </article>
            </div>
            {children}
          </div>
          <div className="journey-visual" aria-label="Presentación visual y empaque ilustrativo">
            <div className="journey-orbit" aria-hidden="true" />
            <div ref={object} className="journey-object">
               {story.media ? story.media.map((view, index) => {
                 if (kit && index > 1) return null;
                 const alternatives = sceneViews.filter(item => item.src !== view.src);
                 const selected = sceneAngle && alternatives.length ? alternatives[(sceneAngle - 1) % alternatives.length] : null;
                 const src = selected?.src ?? view.src;
                 return <div className={`journey-media-layer ${view.presentation === "plate" ? "journey-media-plate" : ""}`} data-media-src={src} data-active={chapter === index} aria-hidden={chapter !== index} key={`${index}-${view.src}`}>
                   {view.presentation === "plate" ? <img src={src} alt={view.alt} width="1200" height="800" /> : <ProductFigure src={src} alt={view.alt} priority preservePixels={informational} />}
                   {sceneViews.length > 1 && index < 2 && <button type="button" className="journey-change-view" aria-label={`Cambiar vista de ${product.name}`} disabled={chapter !== index} onClick={() => setSceneAngle(value => (value + 1) % sceneViews.length)}><span>Cambiar vista · {sceneAngle + 1}/{sceneViews.length}</span></button>}
                 </div>;
               }) : product.missingImage ? <div className="approved-missing-image">Fotografía no disponible</div> : <ProductFigure src={story.image} alt={product.name} priority preservePixels={Boolean(product.gallery?.length)} />}
            </div>
            {kit && <DrillKitTable key={product.slug} chapter={chapter} still={still} pointer={pointer} replay={replay} pieces={tablePieces} confirmed={!informational || Boolean(contents)} />}
            <div ref={box} className="shipping-parcel" data-branded={Boolean(parcelLogo)} aria-hidden="true">
              <div className="parcel-back" />
              {["left", "right"].map(side => <div className={`parcel-flap parcel-flap-${side}`} key={side}>
                {parcelLogo && tapeLogo && <div className="parcel-seal" data-dark={Boolean(storefront.logoDark)}>
                  {[0, 1].map(index => <img src={tapeLogo.src} width={tapeLogo.width} height={tapeLogo.height} alt="" key={index} />)}
                </div>}
              </div>)}
              <div className="parcel-front">
                {parcelLogo ? <img className="parcel-brand-logo" src={parcelLogo.src} width={parcelLogo.width} height={parcelLogo.height} alt="" /> : <strong>{storefront.brandName}</strong>}
                <span>Empaque ilustrativo</span>
              </div>
              <div className="parcel-side">
                {parcelLogo && storefront.mark && <img className="parcel-brand-mark" src={storefront.mark.src} width={storefront.mark.width} height={storefront.mark.height} alt="" />}
              </div>
            </div>
            <p className="journey-image-note">{currentScene?.detail ?? story.media?.[chapter]?.note ?? (product.missingImage ? "Fotografía pendiente de procedencia verificable" : "Imagen del producto · empaque ilustrativo")}</p>
          </div>
        </div>
        <div className="journey-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
