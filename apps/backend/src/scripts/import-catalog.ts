import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";

const CATALOG_PATH = resolve(process.cwd(), "../../data/approved/catalog.json");

type Summary = {
  created: number;
  updated: number;
  skippedDraftHandles: string[];
  categoriesCreated: number;
};

export default async function importApprovedCatalog({ container }: ExecArgs): Promise<Summary> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productService = container.resolve(Modules.PRODUCT);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);

  // The schema package is ESM and this app compiles to CommonJS.
  const { validateCatalog } = await import("@hive-web/catalog-schema");

  const raw = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const { ok, errors, catalog } = validateCatalog(raw);

  if (!ok) {
    logger.error(`[catalog] approved catalog is invalid:\n- ${errors.join("\n- ")}`);
    throw new Error("approved catalog failed validation; nothing was imported");
  }

  const summary: Summary = { created: 0, updated: 0, skippedDraftHandles: [], categoriesCreated: 0 };

  const categoryIdByHandle = new Map<string, string>();
  const existingCategories = await productService.listProductCategories({}, { select: ["id", "handle"] });
  for (const category of existingCategories) {
    if (category.handle) {
      categoryIdByHandle.set(category.handle, category.id);
    }
  }

  for (const category of catalog.categories) {
    if (categoryIdByHandle.has(category.handle)) {
      continue;
    }
    const created = await productService.createProductCategories({
      handle: category.handle,
      name: category.name,
      is_active: true,
    });
    categoryIdByHandle.set(category.handle, created.id);
    summary.categoriesCreated += 1;
  }

  const [salesChannel] = await salesChannelService.listSalesChannels({}, { take: 1 });

  for (const product of catalog.products) {
    const [existing] = await productService.listProducts(
      { handle: product.handle },
      { select: ["id", "handle", "status"] }
    );

    const metadata = {
      reference: product.reference,
      approved_by: product.approved_by,
      approved_at: product.approved_at,
      content_variants: product.content_variants,
      brand: product.brand,
      model: product.model,
      specifications: product.specifications,
      source_url: product.source_url,
      image_source_url: product.image_source_url,
      gallery: product.gallery,
      pricing_status: product.price_cop === null ? "quote_required" : "approved",
      availability_status: "unconfirmed",
    };
    // Images are hosted by the local storefront, not the backend's /static folder.
    const assetOrigin = process.env.CATALOG_ASSET_ORIGIN ?? "http://localhost:8000";
    const images = product.images.map((path) => ({ url: new URL(path, assetOrigin).href }));
    const media = images.length ? { images, thumbnail: images[0].url } : {};

    if (existing) {
      // Never publish from the importer: publication is a human decision.
      await productService.updateProducts(existing.id, {
        title: product.title,
        description: product.description ?? undefined,
        metadata,
        ...media,
        category_ids: [categoryIdByHandle.get(product.category)!],
      });
      summary.updated += 1;
      if (existing.status === ProductStatus.DRAFT) {
        summary.skippedDraftHandles.push(product.handle);
      }
      continue;
    }

    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: product.title,
            handle: product.handle,
            description: product.description ?? product.summary ?? undefined,
            status: ProductStatus.DRAFT,
            category_ids: [categoryIdByHandle.get(product.category)!],
            metadata,
            ...media,
            options: [{ title: "Presentación", values: ["Única"] }],
            variants: [
              {
                title: "Única",
                sku: product.reference,
                manage_inventory: false,
                allow_backorder: true,
                options: { Presentación: "Única" },
                ...(product.price_cop !== null
                  ? { prices: [{ currency_code: "cop", amount: product.price_cop }] }
                  : {}),
              },
            ],
            sales_channels: salesChannel ? [{ id: salesChannel.id }] : undefined,
          },
        ],
      },
    });
    summary.created += 1;
    summary.skippedDraftHandles.push(product.handle);
  }

  logger.info(
    `[catalog] created=${summary.created} updated=${summary.updated} ` +
      `categories=${summary.categoriesCreated} drafts_pending_review=${summary.skippedDraftHandles.length}`
  );

  return summary;
}
