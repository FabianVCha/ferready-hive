import fixtures from "@/data/prototype-products.json";
import type { DemoProduct } from "@/lib/prototype.mjs";

export const products: DemoProduct[] = fixtures.map((product) => ({
  ...product,
  specs: Object.fromEntries(
    Object.entries(product.specs).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  ),
}));
export const categories = [
  {
    slug: "herramientas-electricas",
    name: "Herramientas eléctricas",
    short: "Eléctricas",
    image: "484299",
  },
  {
    slug: "herramientas-manuales",
    name: "Herramientas manuales",
    short: "Manuales",
    image: "901942",
  },
  {
    slug: "accesorios-fijacion",
    name: "Accesorios y fijación",
    short: "Accesorios",
    image: "167850",
  },
  {
    slug: "plomeria-hogar",
    name: "Plomería y hogar",
    short: "Plomería",
    image: "690526",
  },
  {
    slug: "electricidad",
    name: "Electricidad e iluminación",
    short: "Electricidad",
    image: "412200",
  },
  {
    slug: "seguridad-jardin",
    name: "Seguridad y jardín",
    short: "Jardín",
    image: "137879",
  },
];
export const money = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
