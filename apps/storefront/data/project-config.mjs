/**
 * Project-owned configuration.
 *
 * Derived repositories may replace this file without changing the template
 * runtime. The template update workflow preserves this path during merges.
 */
export const projectConfig = Object.freeze({
  projectId: "ferready-hive",
  paymentProvider: "demo",
  // The approved catalog is informational; Medusa publication remains manual.
  catalogSource: "approved",
  storefront: {
    brandName: "Ferready",
    description: "Ferready: tienda de demostración con productos y precios de ejemplo. Sin cobros ni pedidos reales.",
    logo: { src: "/project/ferready-logotipo-claro.svg", width: 680, height: 178 },
    logoDark: { src: "/project/ferready-logotipo-oscuro.svg", width: 680, height: 178 },
    mark: { src: "/project/ferready-isotipo-claro.svg", width: 207, height: 241 },
    icon: "/project/ferready-isotipo-claro.svg",
    placeholder: "/template/product-placeholder.svg",
    kitSlug: "producto-ejemplo-1",
    tokens: { paper: "#F5F2EC", surface: "#E8E9E8", ink: "#12161B", muted: "#1D3659", border: "#4F7399", accent: "#E4261E", navy: "#1D3659", steel: "#4F7399", footer: "#12161B", onFooter: "#F5F2EC" },
    hero: { title: "Ferready.", description: "Explora esta tienda de demostración. Productos y precios de ejemplo.", background: "#F5F2EC" },
    guides: [{ slug: "guia-ejemplo", title: "Guía de ejemplo", updated: null, markdown: "Espacio para una guía de tu tienda. Sustituye este contenido por información útil para tus productos." }],
    categories: [1, 2, 3].map(index => ({ slug: `categoria-${index}`, name: `Categoría ${index}`, short: `Categoría ${index}`, image: "/template/product-placeholder.svg" })),
    products: [1, 2, 3].map(index => ({
      slug: `producto-ejemplo-${index}`, name: `Producto de ejemplo ${index}`, brand: "Marca de ejemplo",
      category: `Categoría ${index}`, categorySlug: `categoria-${index}`, price: index * 10000,
      image: "/template/product-placeholder.svg", description: "Espacio para la descripción de tu producto. Este artículo y su precio son de ejemplo.",
      compatibility: "Añade aquí la información que ayude a elegir este producto.",
      includes: "Producto de ejemplo y dos complementos de ejemplo. Personaliza el contenido antes de publicar.",
      source: "", specs: { "Detalle de ejemplo": "Por personalizar", "Información adicional": "Por personalizar" },
    })),
    kitPieces: ["Producto", "Complemento 1", "Complemento 2"].map((label, index) => ({ id: ["drill", "battery", "charger"][index], label, detail: `${label} de ejemplo. Espacio para tu contenido.`, width: 500, height: 500 })),
    objectives: [1, 2, 3].map(index => ({ id: `objetivo-${index}`, title: `Objetivo de ejemplo ${index}`, description: "Personaliza esta selección con los productos de tu catálogo.", image: "/template/product-placeholder.svg", items: [index, index % 3 + 1].map(product => ({ slug: `producto-ejemplo-${product}`, quantity: 1 })) })),
  },
});
