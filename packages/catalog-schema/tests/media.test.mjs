import test from "node:test";
import assert from "node:assert/strict";
import { validateCatalog } from "../src/index.js";

const product = {
  reference: "12345", title: "Tool", handle: "tool", category: "tools",
  approved_by: "Reviewer", approved_at: "2026-11-22",
};
const validate = (fields) => validateCatalog({
  version: 1, categories: [{ handle: "tools", name: "Tools" }],
  products: [{ ...product, ...fields }],
});

test("normalizes local media and source specifications without losing metadata", () => {
  const fields = {
    images: ["/project/products/truper/12345.jpg"],
    specifications: { Power: "800 W" }, model: "MODEL", brand: "Brand",
    source_url: "https://www.truper.com/example",
  };
  const result = validate(fields);
  assert.equal(result.ok, true);
  for (const [key, value] of Object.entries(fields)) assert.deepEqual(result.catalog.products[0][key], value);
});

test("rejects external, traversal and generated-media paths and malformed specifications", () => {
  for (const image of ["https://example.com/image.jpg", "/project/products/../secret.jpg", "/generated/fake.png", "//example.com/image.jpg"]) {
    assert.equal(validate({ images: [image] }).ok, false, image);
  }
  assert.equal(validate({ specifications: { Power: 800 } }).ok, false);
  assert.equal(validate({ images: "photo.jpg" }).ok, false);
  assert.equal(validate({ source_url: "javascript:alert(1)" }).ok, false);
  assert.equal(validate({ image_source_url: "/relative.jpg" }).ok, false);
});
