import { productMedia, productStoryOverrides } from "../data/ferready-product-media.mjs";

/** Replace campaign content here when adapting the storefront to another niche. */
export const campaign = {
  brand: {
    name: "Ferready",
    red: "#E4261E",
    navy: "#1D3659",
    ink: "#12161B",
    steel: "#4F7399",
    paper: "#F5F2EC",
    logo: "/ferready/logo.svg",
    logoLight: "/ferready/logo-light.svg",
  },
  headline: "Ideas que toman forma.",
  description: "Herramientas para tus proyectos en casa.",
  featured: ["taladro-bauker-12v", "caja-herramientas-bauker", "manguera-flexible-50cm"],
  projects: [
    { title: "Dale forma a tu idea.", description: "Perforar, instalar y construir.", href: "/c/herramientas-electricas", image: "/ferready/products/484299.webp", tone: "blue" },
    { title: "Resuelve ese pendiente.", description: "Las piezas pequeñas también cuentan.", href: "/c/plomeria-hogar", image: "/ferready/products/690526.webp", tone: "paper" },
    { title: "Dale vida a tu espacio.", description: "Cuidar, cortar y volver a empezar.", href: "/c/seguridad-jardin", image: "/ferready/products/137879.webp", tone: "red" },
  ],
};

/** Derive every claim from the selected product, not from its category's hero. */
export function productStory(product) {
  return {
    image: product.image,
    media: productMedia[product.slug] ?? null,
    video: null,
    ...productStoryOverrides[product.slug],
    specs: Object.entries(product.specs),
    chapters: [
      { title: "Míralo de cerca.", body: product.description, detail: Object.entries(product.specs)[0] },
      { title: "Que encaje contigo.", body: product.compatibility, detail: Object.entries(product.specs)[1] },
      { title: "Sin sorpresas al abrir.", body: product.includes, detail: null },
    ],
  };
}

/** Reversible scroll choreography shared by the rendered experience and its tests. */
export function journeyState(progress) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const packing = Math.max(0, Math.min(1, (p - 0.78) / (1 - 0.78)));
  return {
    chapter: Math.min(3, Math.floor(p * 4)),
    packing,
    y: -Math.sin(p * Math.PI) * 5 + packing * 52,
    scale: 1 + Math.sin(p * Math.PI) * 0.06 - packing * 0.63,
    rotation: -7 + Math.sin(p * Math.PI * 2) * 9 + packing * 7,
    rotationY: Math.sin(p * Math.PI * 2) * 16,
  };
}

/** Total automatic drill packing duration, including the lids, in seconds. */
export const kitPackingDuration = 1;

/** Each object clears the rim before the lids can move; pure and reversible. */
export function kitPackingState(packing) {
  const clamp = value => Math.max(0, Math.min(1, value));
  const p = Number.isFinite(packing) ? clamp(packing) : 0;
  return {
    items: [[0, .36], [.28, .65], [.57, .86]].map(([start, end]) => clamp((p - start) / (end - start))),
    close: clamp((p - .89) / .11),
    table: 1 - clamp(p / .28),
  };
}
