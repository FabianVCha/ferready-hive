export const projectConfig: Readonly<{
  projectId: string;
  paymentProvider: string;
  catalogSource?: "approved" | "medusa";
  storefront: typeof import("./storefront.mjs").storefront;
}>;
