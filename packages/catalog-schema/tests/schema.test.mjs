import { test } from "node:test";
import assert from "node:assert/strict";

import { productPath, slugify, validateCatalog } from "../src/index.js";

const validProduct = {
  reference: "HIVE-0001",
  title: "Referencia de ejemplo",
  category: "categoria-de-ejemplo",
  approved_by: "revision-humana",
  approved_at: "2026-11-10",
};

const validCatalog = {
  version: 1,
  categories: [{ handle: "categoria-de-ejemplo", name: "Categoría de ejemplo" }],
  products: [validProduct],
};

test("empty catalog is valid", () => {
  const result = validateCatalog({ version: 1, categories: [], products: [] });
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.catalog.products.length, 0);
});

test("valid product resolves to a canonical path derived from its handle", () => {
  const result = validateCatalog(validCatalog);
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.catalog.products[0].handle, "referencia-de-ejemplo");
  assert.equal(result.catalog.products[0].path, "/p/referencia-de-ejemplo");
});

test("accented titles slugify without diacritics", () => {
  assert.equal(slugify("Café de Origen – Edición 2026"), "cafe-de-origen-edicion-2026");
});

test("content variants never change the product path", () => {
  const withVariants = {
    ...validCatalog,
    products: [
      {
        ...validProduct,
        content_variants: [
          { label: "Foto frontal", body: "assets/frente.jpg" },
          { label: "Foto lateral", body: "assets/lateral.jpg" },
        ],
      },
    ],
  };
  const result = validateCatalog(withVariants);
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.catalog.products[0].path, "/p/referencia-de-ejemplo");
  assert.equal(result.catalog.products[0].content_variants.length, 2);
});

test("a product may not author its own URL", () => {
  const result = validateCatalog({ ...validCatalog, products: [{ ...validProduct, url: "/otra-ruta" }] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /must not define url/);
});

test("duplicate references are rejected", () => {
  const result = validateCatalog({ ...validCatalog, products: [validProduct, validProduct] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /reference duplicated/);
});

test("duplicate handles are rejected", () => {
  const result = validateCatalog({
    ...validCatalog,
    products: [validProduct, { ...validProduct, reference: "HIVE-0002" }],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /handle duplicated/);
});

test("unknown category is rejected", () => {
  const result = validateCatalog({ ...validCatalog, products: [{ ...validProduct, category: "no-existe" }] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /existing category handle/);
});

test("missing approval metadata is rejected", () => {
  const result = validateCatalog({ ...validCatalog, products: [{ ...validProduct, approved_by: "" }] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /approved_by/);
});

test("negative or fractional prices are rejected", () => {
  const negative = validateCatalog({ ...validCatalog, products: [{ ...validProduct, price_cop: -1 }] });
  const fractional = validateCatalog({ ...validCatalog, products: [{ ...validProduct, price_cop: 10.5 }] });
  assert.equal(negative.ok, false);
  assert.equal(fractional.ok, false);
});

test("productPath refuses handles that are not slugs", () => {
  assert.throws(() => productPath("Not A Slug"));
});
