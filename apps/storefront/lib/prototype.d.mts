export type DemoProduct = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  price: number;
  image: string;
  description: string;
  compatibility: string;
  includes: string;
  source: string;
  specs: Record<string, string>;
};
export type CartItem = { slug: string; quantity: number };
export function isDemoEnabled(value: string | undefined): boolean;
export function searchProducts<T extends Pick<DemoProduct, "name" | "brand" | "category" | "description"> & { reference?: string; model?: string }>(
  products: T[],
  query: string,
): T[];
export function updateCart(
  cart: CartItem[],
  slug: string,
  quantity: number,
  products: DemoProduct[],
): CartItem[];
export function restoreCart(
  raw: string | null,
  products: DemoProduct[],
): CartItem[];
export function cartTotal(cart: CartItem[], products: DemoProduct[]): number;
