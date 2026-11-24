import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { validateCatalog } from "../packages/catalog-schema/src/index.js";

const input = JSON.parse(readFileSync(new URL("../data/approved/catalog.json", import.meta.url)));
test("reviewed galleries retain all approved references and originals", () => {
  const result = validateCatalog(input);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.catalog.products.length, 45);
  assert.equal(result.catalog.products.filter(p => p.gallery.length > 1).length, 20);
  assert.equal(result.catalog.products.reduce((n, p) => n + p.gallery.filter(e => e.kind === "illustration").length, 0), 132);
  for (const product of result.catalog.products) {
    assert.equal(new Set(product.gallery.map(e => e.src)).size, product.gallery.length);
    for (const entry of product.gallery) {
      assert.ok(existsSync(new URL(`../apps/storefront/public${entry.src}`, import.meta.url)));
      if (entry.kind === "illustration") assert.match(entry.caption, /[Ii]lustraci[oó]n|ilustrado/);
      else assert.equal(entry.original, product.images[0]);
    }
    if (["19784", "12544"].includes(product.reference)) assert.deepEqual(product.gallery, []);
  }
});
test("gallery validation rejects duplicates and absent provenance", () => {
  for (const mutate of [
    p => p.gallery.push(p.gallery[0]),
    p => delete p.gallery[0].provenance,
    p => p.gallery[0].kind = "manufacturer-generated",
    p => p.gallery[0].src = "https://example.com/photo.png",
  ]) {
    const copy = structuredClone(input);
    mutate(copy.products[0]);
    assert.equal(validateCatalog(copy).ok, false);
  }
});
test("full-resolution identity conflicts never enter product scenes or tables", () => {
  const excluded = JSON.parse(readFileSync(new URL("../data/approved/truper-multi-media-exclusions.json", import.meta.url)));
  assert.equal(excluded.length, 12);
  const sources = new Set(input.products.flatMap(product => product.gallery.map(view => view.provenance)));
  for (const entry of excluded) {
    assert.ok(!sources.has(entry.source), entry.source);
    assert.ok(entry.reason.length > 20);
  }
  for (const reference of ["104495", "104111"]) {
    assert.ok(input.products.find(product => product.reference === reference).gallery.some(view => view.role === "angle"));
  }
});
test("every source in the twenty approved folders is used or explicitly excluded", () => {
  const classification = JSON.parse(readFileSync(new URL("../data/approved/truper-image-classification.json", import.meta.url)));
  const selection = JSON.parse(readFileSync(new URL("../data/approved/truper-gallery-selection.json", import.meta.url)));
  const excluded = JSON.parse(readFileSync(new URL("../data/approved/truper-multi-media-exclusions.json", import.meta.url)));
  const contents = JSON.parse(readFileSync(new URL("../data/approved/truper-contents-selection.json", import.meta.url)));
  const references = new Set(classification.folders.filter(folder => folder.source_count > 2).map(folder => folder.reference));
  assert.equal(references.size, 20);
  const sources = classification.files.filter(file => references.has(file.reference));
  assert.equal(sources.length, 166);
  const active = new Set(selection.map(entry => entry.source));
  const rejected = new Set(excluded.map(entry => entry.source));
  const confirmed = new Set(Object.values(contents).flatMap(entry => entry.components.map(component => component.source)));
  for (const source of sources) {
    const primary = source.path.endsWith("/original-truper.jpg");
    assert.equal(Number(primary) + Number(active.has(source.path)) + Number(rejected.has(source.path)) + Number(confirmed.has(source.path)), 1, source.path);
  }
  assert.equal(active.size + confirmed.size, 134);
});
