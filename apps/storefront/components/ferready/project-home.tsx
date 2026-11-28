"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useVisualCatalog } from "./catalog-context";
import { ProductFigure } from "./product-figure";
import "./project-home.css";

// Brand paths: Simple Icons (CC0), https://github.com/simple-icons/simple-icons.
// Only owner-supplied profile URLs are enabled.
const socialProfileUrls: Record<string, string | null> = {
  Facebook: "https://www.facebook.com/profile.php?id=61597257410189",
  Instagram: null,
  TikTok: "https://www.tiktok.com/@ferready?_r=1&_t=ZS-9BluHoXtjXA",
};
const socialProfiles: { name: string; path: string; url: string | null }[] = [
  { name: "Facebook", url: null, path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" },
  { name: "Instagram", url: null, path: "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" },
  { name: "TikTok", url: null, path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
].map(profile => ({ ...profile, url: socialProfileUrls[profile.name] ?? null }));

// Home-only labels; canonical product names remain available in image and link labels.
const homeProductNames: Record<string, string> = {
  "104412": "Taladro rotomartillo 12 V",
  "104271": "Rotomartillo 20 V",
  "14659": "Rotomartillo con cable, 850 W",
  "11145": "Caja de herramientas 22″",
  "11335": "Juego de 11 brocas",
  "102410": "Juego de 44 herramientas",
  "23104": "Tijera de poda 8″",
};

function homeProductName(product: { reference?: string; name: string }) {
  return (product.reference && homeProductNames[product.reference]) || product.name;
}

/** The approved home composition reads the existing inventory, never preview fixtures. */
export function ProjectHome() {
  const { products } = useVisualCatalog();
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [focused, setFocused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [pointer, setPointer] = useState(false);
  const [manualSelection, setManualSelection] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const focusModality = useRef<"keyboard" | "pointer">("keyboard");
  const running = visible && !paused && !reducedMotion && !focused && !interacting;
  const byReference = (reference: string) => products.find(product => product.reference === reference);
  const featured = ["104412", "104271", "14659"].map(byReference).filter(product => product !== undefined);
  const selection = ["11145", "11335", "102410", "23104"].map(byReference).filter(product => product !== undefined);
  const drill = byReference("104412");
  const painting = byReference("12906");
  const meter = byReference("100362");
  const current = featured[selected] ?? featured[0];

  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    let inView = false;
    const updateVisibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateVisibility();
    });
    observer.observe(element);
    const release = () => setInteracting(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!running || featured.length < 2) return;
    const timer = setTimeout(() => {
      setManualSelection(false);
      setPointer(true);
      setSelected(index => (index + 1) % featured.length);
    }, 4_000);
    return () => clearTimeout(timer);
  }, [running, selected, countdown, featured.length]);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.animate(
          [{ transform: "translateY(20px)", opacity: .5 }, { transform: "translateY(0)", opacity: 1 }],
          { duration: 600, easing: "cubic-bezier(.23,1,.32,1)" },
        );
        observer.unobserve(entry.target);
      }
    }, { threshold: .2 });
    root.current?.querySelectorAll(".client-showroom-tools button, .client-work-grid img, .client-selection-grid img").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return <div className="client-home project-home" ref={root}>
    <section className="client-hero" aria-labelledby="client-title">
      <div className="client-hero-copy">
        <h1 id="client-title">Manos a<br />la obra.</h1>
        <p>Somos Ferready. Herramientas, materiales y accesorios para construir, reparar y darle forma a tu próximo proyecto.</p>
        <Link className="client-action" href="/catalogo">Explorar el catálogo</Link>
        <p className="client-selection-note">Explora referencias y guarda tu selección. Precio y disponibilidad por confirmar.</p>
        <a className="client-company-link" href="#empresa">Conoce Ferready</a>
      </div>
      {current && <div className="client-showroom" ref={scene} data-idle={running ? "running" : "paused"} data-motion={pointer ? "pointer" : "keyboard"}
        onKeyDownCapture={() => { focusModality.current = "keyboard"; setFocused(true); setPointer(false); }}
        onFocusCapture={() => { if (focusModality.current === "keyboard") setFocused(true); }}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onPointerDownCapture={() => { focusModality.current = "pointer"; setFocused(false); setInteracting(true); }}>
        <button className="showroom-motion-toggle" type="button" hidden={reducedMotion} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Activar animación" : "Pausar animación"}</button>
        <div className="client-showroom-tools" aria-label="Selecciona una herramienta destacada">
          <div className="hero-counter showroom-counter" aria-hidden="true"><div className="hero-counter-top" /><div className="hero-counter-edge" /></div>
          {featured.map((product, index) => <button key={product.slug} type="button" aria-pressed={selected === index} onClick={event => { setManualSelection(true); setPointer(event.detail > 0); setSelected(index); setCountdown(value => value + 1); }} aria-label={`Ver ${product.name}`} className={selected === index ? "is-selected" : ""}>
            <span className="hero-object-sway"><ProductFigure src={product.image} alt={product.name} priority preservePixels /></span>
          </button>)}
        </div>
        <div className="client-showroom-caption" aria-live={manualSelection ? "polite" : "off"}><div><span>En nuestra selección</span><h2>{homeProductName(current)}</h2></div><Link href={`/p/${current.slug}`} aria-label={`Conocer ${current.name}`}>Conocer el producto</Link></div>
      </div>}
      <div className="client-hero-bottom"><span>Para el hogar. Para el oficio. Para hacer.</span><span>Bogotá · Soacha · Chía</span></div>
    </section>
    <section className="client-company" id="empresa" aria-labelledby="company-title">
      <h2 id="company-title">Tu proyecto<br />nos mueve.</h2>
      <div><p>Compara herramientas con cable e inalámbricas, revisa medidas y consulta qué incluye cada referencia antes de elegir.</p><p>En las fichas encuentras imágenes y especificaciones disponibles del producto. Guarda las referencias que necesitas en tu selección.</p><Link href="/catalogo">Encuentra tu herramienta</Link></div>
    </section>
    <section className="client-work" id="por-tarea" aria-labelledby="work-title">
      <div className="client-section-heading"><h2 id="work-title">¿Qué vas a hacer?</h2><p>Empieza por tu proyecto, no por una lista interminable.</p></div>
      <div className="client-work-grid">
        <Link href="/catalogo?q=rotomartillo" className="client-work-large">{drill && <img src={drill.image} alt={drill.name} width="800" height="800" />}<div><h3>Perforar y montar</h3><p>Elige entre herramientas con cable e inalámbricas.</p><span>Ver herramientas eléctricas</span></div></Link>
        <Link href="/catalogo?q=sellador" className="client-work-small">{painting && <img src={painting.image} alt={painting.name} width="600" height="600" />}<div><h3>Renovar tus espacios</h3><span>Ver sellador</span></div></Link>
        <Link href="/catalogo?q=multímetro" className="client-work-small client-work-measure">{meter && <img src={meter.image} alt={meter.name} width="600" height="600" />}<div><h3>Revisar y mantener</h3><span>Ver medición</span></div></Link>
      </div>
    </section>
    <section className="client-selection" aria-labelledby="selection-title">
      <div className="client-section-heading"><h2 id="selection-title">Un buen comienzo.</h2><Link href="/catalogo">Ver todas las referencias</Link></div>
      <div className="client-selection-grid">{selection.map(product => <Link href={`/p/${product.slug}`} key={product.slug} aria-label={`Conocer ${product.name}`}><div><img src={product.image} alt={product.name} width="500" height="500" /></div><span>{product.brand}</span><h3>{homeProductName(product)}</h3><p>Conocer el producto</p></Link>)}</div>
    </section>
    <section className="client-coverage" id="cobertura" aria-labelledby="coverage-title"><div><h2 id="coverage-title">Cerca de<br />tu proyecto.</h2><p>Prepara tu selección con las referencias que necesitas.</p><p>Precio, disponibilidad y condiciones de entrega por confirmar.</p><Link href="/catalogo">Ver catálogo</Link></div><ul className="client-places" aria-label="Ciudades de cobertura"><li>Bogotá</li><li>Soacha</li><li>Chía</li></ul></section>
    <section className="client-socials" aria-labelledby="socials-title">
      <div><h2 id="socials-title">Redes sociales</h2><p>Encuéntranos en Facebook y TikTok. Instagram, próximamente.</p></div>
      <ul aria-label="Redes de Ferready">{socialProfiles.map(profile => {
        const icon = <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false"><path d={profile.path} /></svg>;
        const url = profile.url && /^https:\/\//i.test(profile.url) ? profile.url : null;
        return <li key={profile.name}>{url
          ? <a href={url} aria-label={profile.name}>{icon}</a>
          : <span role="img" aria-label={`${profile.name} · enlace por confirmar`} title={`${profile.name} · enlace por confirmar`}>{icon}</span>}</li>;
      })}</ul>
    </section>
  </div>;
}
