export type CatalogCategory = { handle: string; name: string };

export type CatalogContentVariant = { label: string; body: string };

export type CatalogProduct = {
  reference: string;
  title: string;
  handle: string;
  path: string | null;
  category: string;
  summary: string | null;
  description: string | null;
  price_cop: number | null;
  content_variants: CatalogContentVariant[];
  approved_by: string;
  approved_at: string;
};

export type Catalog = {
  version: number;
  categories: CatalogCategory[];
  products: CatalogProduct[];
};

export type ValidationResult = { ok: boolean; errors: string[]; catalog: Catalog };

export function slugify(input: string): string;
export function productPath(handle: string): string;
export function validateCatalog(input: unknown): ValidationResult;

export const CATALOG_RULES: {
  HANDLE_PATTERN: RegExp;
  REFERENCE_PATTERN: RegExp;
  DATE_PATTERN: RegExp;
  FORBIDDEN_PRODUCT_KEYS: string[];
};
