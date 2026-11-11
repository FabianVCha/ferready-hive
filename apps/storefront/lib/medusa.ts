const BACKEND_URL = (process.env.MEDUSA_BACKEND_URL ?? "http://127.0.0.1:9000").replace(/\/$/, "");
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

export type StoreVariant = {
  id: string;
  title: string | null;
  calculated_price?: { calculated_amount: number; currency_code: string } | null;
};

export type StoreProduct = {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  variants: StoreVariant[];
};

export type StoreCategory = {
  id: string;
  name: string;
  handle: string;
};

type ListResponse<T> = { products?: T[]; product_categories?: T[]; count?: number };

async function storeFetch<T>(path: string): Promise<T | null> {
  if (!PUBLISHABLE_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/store${path}`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function listProducts(categoryHandle?: string): Promise<StoreProduct[]> {
  const query = new URLSearchParams({ limit: "50" });
  if (categoryHandle) {
    query.set("category_handle", categoryHandle);
  }
  const data = await storeFetch<ListResponse<StoreProduct>>(`/products?${query.toString()}`);
  return data?.products ?? [];
}

export async function getProductByHandle(handle: string): Promise<StoreProduct | null> {
  const query = new URLSearchParams({ handle, limit: "1" });
  const data = await storeFetch<ListResponse<StoreProduct>>(`/products?${query.toString()}`);
  return data?.products?.[0] ?? null;
}

export async function listCategories(): Promise<StoreCategory[]> {
  const data = await storeFetch<ListResponse<StoreCategory>>("/product-categories?limit=50");
  return data?.product_categories ?? [];
}

export function referenceOf(product: StoreProduct): string | null {
  const reference = product.metadata?.reference;
  return typeof reference === "string" && reference.length > 0 ? reference : null;
}

export function priceOf(product: StoreProduct): string | null {
  const amount = product.variants?.[0]?.calculated_price?.calculated_amount;
  if (typeof amount !== "number") {
    return null;
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function isBackendReachable(): Promise<boolean> {
  return (await storeFetch<ListResponse<StoreProduct>>("/products?limit=1")) !== null;
}
