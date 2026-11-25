/** Optional brand assets preserve the text-only template fallback. */
export function brandLogo(storefront, dark = false) {
  return (dark && storefront.logoDark) || storefront.logo || null;
}

export function brandIcon(storefront) {
  return storefront.icon || "/template/product-placeholder.svg";
}
