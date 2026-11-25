"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DemoProduct } from "@/lib/prototype.mjs";
import type { Objective } from "@/lib/objectives.mjs";
import { products, categories } from "./catalog";
import { objectives } from "@/data/ferready-objectives";

/** Visual content is independent of simulated cart and checkout fixtures. */
export type DisplayProduct = Omit<DemoProduct, "price"> & {
  price: number | null;
  reference?: string;
  model?: string;
  missingImage?: boolean;
  gallery?: { src: string; original?: string; kind: "photo" | "illustration"; caption: string; provenance: string }[];
};
export type DisplayCategory = { slug: string; name: string; short: string; image: string };
export type VisualCatalog = {
  products: DisplayProduct[];
  categories: DisplayCategory[];
  objectives: Objective[];
  informational: boolean;
};
const CatalogContext = createContext<VisualCatalog>({ products, categories, objectives, informational: false });
export function VisualCatalogProvider({ catalog, children }: { catalog: VisualCatalog; children: ReactNode }) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}
export function useVisualCatalog() { return useContext(CatalogContext); }
