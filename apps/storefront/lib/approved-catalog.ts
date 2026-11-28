import { validateCatalog } from "@hive-web/catalog-schema";
import input from "../../../data/project/first15-truper.json";
import { projectConfig } from "@/data/project-config.mjs";
import { first15Categories, first15Discovery } from "@/data/first15-discovery";
import type { VisualCatalog } from "@/components/ferready/catalog-context";

const result = validateCatalog({
  ...input,
  categories: first15Categories,
  products: input.products.map((product) => ({
    ...product,
    category: first15Discovery(product.reference)?.category,
  })),
});
if (!result.ok) throw new Error(`Invalid approved catalog: ${result.errors.join("; ")}`);

export const approvedCatalog = result.catalog;
export const usesApprovedCatalog = projectConfig.catalogSource === "approved";

export const approvedVisualCatalog: VisualCatalog = {
  pending: [{ name: "Manguera para lavamanos", note: "Pendiente de confirmar referencia, medidas e imagen. No disponible para compra." }],
  informational: true,
  products: approvedCatalog.products.map((product) => ({
    slug: product.handle,
    name: product.title,
    cardTitle: first15Discovery(product.reference)?.cardTitle,
    searchAliases: first15Discovery(product.reference)?.searchAliases,
    brand: product.brand ?? "",
    category: approvedCatalog.categories.find((category) => category.handle === product.category)!.name,
    categorySlug: product.category,
    price: product.price_cop,
    image: product.gallery[0]?.src ?? product.images[0] ?? "",
    gallery: product.gallery,
    missingImage: product.images.length === 0,
    description: product.description ?? product.summary ?? "",
    compatibility: "Consulta las especificaciones del fabricante para comprobar la compatibilidad con tu tarea.",
    includes: product.specifications["Incluye"] ?? "Contenido del empaque por confirmar con el fabricante.",
    source: product.source_url ?? "",
    specs: { Código: product.reference, ...(product.model ? { Modelo: product.model } : {}), ...product.specifications },
    reference: product.reference,
    selectionAvailable: false,
    model: product.model ?? undefined,
  })),
  categories: approvedCatalog.categories.map((category) => ({
    slug: category.handle, name: category.name, short: category.name,
    image: approvedCatalog.products.find((product) => product.category === category.handle && product.images.length)?.images[0] ?? "",
  })),
  objectives: approvedCatalog.categories.map((category) => ({
    id: category.handle, title: category.name,
    description: `Explora las referencias aprobadas de ${category.name.toLocaleLowerCase("es")}.`,
    image: approvedCatalog.products.find((product) => product.category === category.handle && product.images.length)?.images[0] ?? "",
    items: approvedCatalog.products.filter((product) => product.category === category.handle).map((product) => ({ slug: product.handle, quantity: 1 })),
  })),
};
