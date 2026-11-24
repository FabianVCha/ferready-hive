import { readFile } from "node:fs/promises";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import importApprovedCatalog from "../import-catalog";

jest.mock("node:fs/promises", () => ({ readFile: jest.fn() }));
jest.mock("@medusajs/medusa/core-flows", () => ({ createProductsWorkflow: jest.fn() }));
// Validation has its own native ESM tests. Keep this CommonJS Jest suite focused
// on service/workflow boundaries rather than SWC's dynamic-import conversion.
jest.mock("@hive-web/catalog-schema", () => ({
  validateCatalog: jest.fn((raw) => ({
    ok: true, errors: [], catalog: {
      ...raw,
      products: raw.products.map((item: object) => ({
        price_cop: null, content_variants: [], ...item,
      })),
    },
  })),
}));

const product = {
  reference: "12345", title: "Approved tool", handle: "approved-tool",
  category: "tools", approved_by: "Reviewer", approved_at: "2026-11-22",
  images: ["/project/products/truper/12345.jpg"], model: "MODEL",
  brand: "TRUPER", specifications: { Power: "800 W" },
  gallery: [{ src: "/project/products/truper/12345-illustration.webp", kind: "illustration", caption: "Supplied illustration", provenance: "local-reviewed-source.png" }],
};

function harness(existing?: { id: string; handle: string; status: string }) {
  const run = jest.fn().mockResolvedValue({});
  (createProductsWorkflow as unknown as jest.Mock).mockReturnValue({ run });
  (readFile as jest.Mock).mockResolvedValue(JSON.stringify({
    version: 1, categories: [{ handle: "tools", name: "Tools" }], products: [product],
  }));
  const service = {
    listProductCategories: jest.fn().mockResolvedValue([{ id: "cat_1", handle: "tools" }]),
    listProducts: jest.fn().mockResolvedValue(existing ? [existing] : []),
    updateProducts: jest.fn().mockResolvedValue({}),
  };
  const container = {
    resolve: (key: string) => {
      if (key === "product") return service;
      if (key === "sales_channel") return { listSalesChannels: async () => [{ id: "sc_1" }] };
      if (key === "logger") return { info: jest.fn(), error: jest.fn() };
      throw new Error(`Unexpected dependency ${key}`);
    },
  };
  return { run, service, container };
}

test("creates a draft with source images and metadata, without inventing a price", async () => {
  const { run, container } = harness();
  const summary = await importApprovedCatalog({ container } as never);
  expect(summary.created).toBe(1);
  const imported = run.mock.calls[0][0].input.products[0];
  expect(imported.status).toBe("draft");
  expect(imported.thumbnail).toBe("http://localhost:8000/project/products/truper/12345.jpg");
  expect(imported.images).toEqual([{ url: imported.thumbnail }]);
  expect(imported.metadata.gallery).toEqual(product.gallery);
  expect(imported.images).not.toContainEqual({ url: expect.stringContaining("illustration") });
  expect(imported.metadata).toMatchObject({
    reference: "12345", model: "MODEL", specifications: { Power: "800 W" },
    availability_status: "unconfirmed", pricing_status: "quote_required",
  });
  expect(imported.variants[0]).not.toHaveProperty("prices");
});

test.each(["draft", "published"])("re-import updates the existing %s product without publishing or duplicating it", async (status) => {
  const { run, container, service } = harness({ id: "prod_1", handle: product.handle, status });
  const summary = await importApprovedCatalog({ container } as never);
  expect(summary.created).toBe(0);
  expect(summary.updated).toBe(1);
  expect(run).not.toHaveBeenCalled();
  expect(service.updateProducts).toHaveBeenCalledTimes(1);
  const update = service.updateProducts.mock.calls[0][1];
  expect(update).not.toHaveProperty("status");
  expect(update).not.toHaveProperty("variants");
  expect(update.metadata.reference).toBe(product.reference);
  expect(update.metadata.gallery).toEqual(product.gallery);
});

test("invalid approval fails before any catalog mutation", async () => {
  const { run, container, service } = harness();
  jest.requireMock("@hive-web/catalog-schema").validateCatalog.mockReturnValueOnce({
    ok: false, errors: ["invalid approval"], catalog: {},
  });
  await expect(importApprovedCatalog({ container } as never)).rejects.toThrow("nothing was imported");
  expect(service.listProductCategories).not.toHaveBeenCalled();
  expect(service.updateProducts).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
});
