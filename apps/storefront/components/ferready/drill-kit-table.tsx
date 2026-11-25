"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { TablePiece } from "@/lib/editorial-media.mjs";
import { kitPackingDuration, kitPackingState } from "@/lib/campaign.mjs";
import { storefront } from "@/data/storefront.mjs";

const demoPieces = storefront.kitPieces.map(piece => ({ ...piece, src: storefront.placeholder }));

export function renderKitPacking(root: HTMLElement, packing: number) {
  const state = kitPackingState(packing);
  const parcel = root.querySelector<HTMLElement>(".shipping-parcel");
  root.querySelectorAll<HTMLElement>(".kit-piece").forEach((piece, index) => {
    const p = state.items[index] ?? state.items.at(-1)!;
    const eased = p * p * (3 - 2 * p);
    // Both objects share the visual's coordinate system. Target the actual
    // parcel interior so portrait, landscape and resized scenes land alike.
    const x = parcel ? parcel.offsetLeft + parcel.offsetWidth / 2 - piece.offsetLeft - piece.offsetWidth / 2 : 0;
    const y = parcel ? parcel.offsetTop + parcel.offsetHeight * .55 - piece.offsetTop - piece.offsetHeight + piece.offsetHeight * .16 : 0;
    gsap.set(piece, { xPercent: 0, yPercent: 0, x: x * eased, y: y * eased - Math.sin(p * Math.PI) * 36, scale: 1 - eased * .68, rotation: (index === 0 ? 12 : -9) * eased, opacity: p >= 1 ? 0 : 1, zIndex: p > .42 ? 2 : 5 });
    piece.dataset.packed = String(p >= 1);
  });
  gsap.set(root.querySelector(".kit-counter"), { opacity: state.table, y: (1 - state.table) * 12 });
  root.style.setProperty("--parcel-close", String(state.close));
  root.dataset.kitPacking = String(packing);
  root.dataset.packed = String(packing >= 1);
}

export function DrillKitTable({ chapter, still, pointer, replay, pieces = demoPieces, confirmed = true }: { chapter: number; still: boolean; pointer: boolean; replay: number; pieces?: TablePiece[]; confirmed?: boolean }) {
  const scene = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [accessoryPage, setAccessoryPage] = useState(0);
  const pages = Math.max(1, Math.ceil((pieces.length - 1) / 2));
  const shownPieces = [pieces[0], ...pieces.slice(1 + accessoryPage * 2, 3 + accessoryPage * 2)].filter(Boolean);
  const selectedDetail = shownPieces[selected]?.detail;
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const focusModality = useRef<"keyboard" | "pointer">("keyboard");
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [manual, setManual] = useState(false);
  const [pointerSelection, setPointerSelection] = useState(false);
  const [play, setPlay] = useState(0);
  const replayInput = useRef<boolean | null>(null);
  const packingTween = useRef<gsap.core.Timeline | null>(null);
  const pointerInput = useRef(pointer);
  pointerInput.current = pointer;
  const running = chapter === 2 && visible && !paused && !focused && !hovered && !reduced && !still;
  useEffect(() => {
    const root = scene.current?.closest<HTMLElement>(".product-journey");
    const visual = scene.current?.parentElement;
    if (!root || !visual) return;
    const observer = new ResizeObserver(() => renderKitPacking(root, Number(root.dataset.kitPacking) || 0));
    observer.observe(visual);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    replayInput.current = null;
  }, [chapter, replay]);
  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); media.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", update); };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => { setManual(false); setPointerSelection(true); setSelected(value => (value + 1) % shownPieces.length); }, 10_000);
    return () => clearTimeout(timer);
  }, [running, selected, shownPieces.length]);
  useEffect(() => {
    const root = scene.current?.closest<HTMLElement>(".product-journey");
    if (!root) return;
    gsap.set(root.querySelector(".shipping-parcel"), { autoAlpha: chapter === 3 ? 1 : 0, y: 0 });
    const driver = { packing: chapter === 3 ? 1 : 0 };
    if (chapter === 3 && (replayInput.current ?? pointerInput.current) && !reduced && !still) {
      driver.packing = 0;
      renderKitPacking(root, 0);
      const tween = gsap.timeline({ paused: !visible }).to(driver, { packing: 1, duration: kitPackingDuration, ease: "none", onUpdate: () => renderKitPacking(root, driver.packing) });
      packingTween.current = tween;
      return () => { tween.kill(); packingTween.current = null; renderKitPacking(root, 0); };
    }
    renderKitPacking(root, driver.packing);
  }, [chapter, reduced, still, play]);
  useEffect(() => {
    packingTween.current?.paused(!visible);
    const hide = () => { packingTween.current?.pause(); };
    const show = () => { packingTween.current?.paused(!visible); };
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);
    return () => { window.removeEventListener("pagehide", hide); window.removeEventListener("pageshow", show); };
  }, [visible]);
  return <div ref={scene} className="kit-table" data-count={shownPieces.length} data-total={pieces.length} data-pages={pages} data-idle={running ? "running" : "paused"} data-motion={pointerSelection ? "pointer" : "keyboard"} data-selected={selected}
    aria-label={confirmed ? "Componentes incluidos en el kit" : "Producto y accesorios ilustrados · inclusión por confirmar"} role="group" inert={chapter !== 2 && chapter !== 3} aria-hidden={chapter !== 2 && chapter !== 3}
    onFocusCapture={() => { if (focusModality.current === "keyboard") setFocused(true); }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDownCapture={() => { focusModality.current = "keyboard"; setFocused(true); }}
    onPointerDownCapture={() => { focusModality.current = "pointer"; setFocused(false); }}
    onPointerEnter={event => { if (event.pointerType === "mouse" && matchMedia("(hover: hover) and (pointer: fine)").matches) setHovered(true); }} onPointerLeave={() => setHovered(false)}>
    <div className="hero-counter kit-counter" aria-hidden="true"><div className="hero-counter-top" /><div className="hero-counter-edge" /></div>
    {shownPieces.map((piece, index) => <div className={`kit-piece kit-piece-${piece.id}`} data-slot={index} key={piece.id}>
      <button className="kit-select" type="button" aria-pressed={selected === index} aria-label={`Ver ${piece.label.toLowerCase()}${confirmed ? " · componente incluido" : index === 0 ? " fotografiado" : " · ilustración, inclusión por confirmar"}`} disabled={chapter !== 2} onClick={event => { setManual(true); setPointerSelection(event.detail > 0); setSelected(index); }}>
        <span className="kit-emphasis" data-active={selected === index}><b className="hero-object-sway"><img src={piece.src} alt="" width={piece.width} height={piece.height} /></b></span>
        <span className="kit-label">{piece.label}{!confirmed && index > 0 && piece.label !== "Accesorio ilustrado" ? " · ilustrado" : ""}</span>
      </button>
    </div>)}
    {chapter === 2 && <>{pages > 1 && <nav className="kit-pages" aria-label="Accesorios ilustrados"><button type="button" disabled={accessoryPage === 0} onClick={() => { setAccessoryPage(value => value - 1); setSelected(0); }}>Anteriores</button><span>{accessoryPage + 1} / {pages}</span><button type="button" disabled={accessoryPage === pages - 1} onClick={() => { setAccessoryPage(value => value + 1); setSelected(0); }}>Siguientes</button></nav>}<button className="hero-motion-toggle" type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? "Activar animación" : "Pausar animación"}</button><p className="kit-info" aria-live={manual ? "polite" : "off"}>{selectedDetail}</p></>}
    {chapter === 3 && <button className="kit-replay text-link" type="button" onClick={event => { replayInput.current = event.detail > 0; setPlay(value => value + 1); }}>Ver empaque de nuevo</button>}
  </div>;
}
