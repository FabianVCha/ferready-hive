import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { validateCatalog } from "../../../packages/catalog-schema/src/index.js";
import { confirmedContents, editorialMedia, productTablePieces } from "../lib/editorial-media.mjs";
import { first15Categories, first15Discovery } from "../data/first15-discovery.ts";
import { searchProducts } from "../lib/prototype.mjs";

const root = new URL("../../../", import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root)));
const input = read("data/project/first15-truper.json");
const provenance = read("data/project/first15-truper-provenance.json");
const scenes = read("data/project/first15-truper-scenes.json");

test("owner batch contains exactly 14 real references and one non-commercial pending slot", () => {
  const result = validateCatalog(input);
  assert.deepEqual(result.errors, []);
  assert.equal(result.catalog.products.length, 14);
  assert.equal(provenance.pending.length, 1);
  assert.equal(provenance.pending[0].reference, null);
  assert.deepEqual(provenance.pending[0].images, []);
  assert.equal(read("data/approved/catalog.json").products.length, 45);
});

test("all 53 supplied assets have local URLs and provenance labels", () => {
  assert.equal(input.products.reduce((sum, p) => sum + p.gallery.length, 0), 53);
  for (const product of input.products) {
    assert.equal(product.price_cop, null);
    for (const view of product.gallery) {
      assert.match(view.src, /^\/project\/products\/first15-truper\//);
      assert.ok(view.provenance.includes("Owner-supplied"));
    }
    assert.equal(scenes[product.reference].model, product.model);
  }
});

test("the first selection media set is complete when present", (t) => {
  if (!existsSync(new URL("apps/storefront/public/project/products/first15-truper/", root))) {
    return t.skip("first selection media is hosted outside Git");
  }
  for (const product of input.products) {
    for (const view of product.gallery) {
      assert.ok(existsSync(new URL(`apps/storefront/public${view.src}`, root)), view.src);
    }
  }
});

test("contents remain exact-model scoped and preserve supplied quantities", () => {
  assert.match(input.products.find(p => p.reference === "104271").specifications.Incluye, /2 baterías/);
  assert.match(input.products.find(p => p.reference === "11899").specifications.Incluye, /no en set de 10/);
  assert.match(input.products.find(p => p.reference === "102410").title, /44 herramientas/);
  assert.match(input.products.find(p => p.reference === "23566").specifications.Incluye, /sin llaves/);
  for (const scene of Object.values(scenes)) {
    for (const component of scene.components) {
      assert.ok(component.src.includes("/first15-truper/"));
      assert.ok(component.id.startsWith("accessory-"), "Use the original scene's positioned accessory slots");
    }
  }
});

test("all new products resolve four scenes and source-specific contents, without legacy accessories", () => {
  for (const product of input.products) {
    assert.equal(confirmedContents(product).confirmation.source, "owner-supplied-json");
    assert.equal(editorialMedia({ ...product, name: product.title }).length, 4);
    assert.ok(productTablePieces({ ...product, name: product.title }).every(piece => piece.src.includes("/first15-truper/")));
    assert.equal(confirmedContents({ ...product, model: "DIFFERENT-MODEL" }), null);
  }
});

test("catalog discovery assigns every reference to a customer-facing category", () => {
  const categories = new Map(first15Categories.map(({ handle, name }) => [handle, name]));
  const counts = new Map();
  for (const product of input.products) {
    const profile = first15Discovery(product.reference);
    assert.ok(profile?.cardTitle && categories.has(profile.category), product.reference);
    counts.set(profile.category, (counts.get(profile.category) ?? 0) + 1);
  }
  assert.equal(counts.size, categories.size);
  assert.ok([...counts.values()].every((count) => count < input.products.length));
});

test("Colombian search terms only match relevant references and retain exact code/model lookup", () => {
  const products = input.products.map((product) => ({
    ...product,
    name: product.title,
    ...first15Discovery(product.reference),
  }));
  for (const [query, expected] of [
    ["taladro", ["104412", "104271", "14659"]],
    ["taladro inalambrico", ["104412", "104271"]],
    ["chazo 1/4", ["40159"]],
    ["bombillo", ["46993"]],
    ["multimetro", ["100362"]],
    ["104412", ["104412"]],
    ["N20-RAT-2", ["104271"]],
    ["roto-1/2a9", ["14659"]],
  ]) {
    assert.deepEqual(searchProducts(products, query).map(({ reference }) => reference), expected, query);
  }
});
