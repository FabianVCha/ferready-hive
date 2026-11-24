export type BrandLogo = { src: string; width: number; height: number };
export type BrandAssets = { logo?: BrandLogo; logoDark?: BrandLogo; mark?: BrandLogo; icon?: string };
export function brandLogo(storefront: BrandAssets, dark?: boolean): BrandLogo | null;
export function brandIcon(storefront: BrandAssets): string;
