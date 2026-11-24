import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { confirmedContents, editorialMedia, editorialRoles, productTablePieces } from "../lib/editorial-media.mjs";

const catalog = JSON.parse(readFileSync(new URL("../../../data/approved/catalog.json", import.meta.url)));
test("all twenty owner-approved multi-image references have semantic chapter roles", () => {
  const multiple = catalog.products.filter(product => product.gallery.length > 1);
  assert.equal(multiple.length, 20);
  assert.equal(Object.keys(editorialRoles).length, 9);
  for (const product of catalog.products) {
    const media = editorialMedia({ ...product, name: product.title });
    if (!product.gallery.length) {
      assert.equal(media, null);
      continue;
    }
    assert.equal(media.length, 4);
    assert.equal(media[0].src, product.gallery.find(view => view.kind === "photo").src);
    assert.equal(media[3].src, media[0].src);
    for (const view of media) assert.ok(product.gallery.some(item => item.src === view.src));
    assert.equal(media[2].src, media[0].src);
    assert.equal(media[2].role, "contents");
    assert.match(media[2].note, product.reference === "103068" ? /confirmada por el usuario/ : /contenido del empaque por confirmar/);
  }
});
test("16590 rejects misleading generated disc and motor markings instead of reusing them", () => {
  const product = catalog.products.find(product => product.reference === "16590");
  assert.ok(product.gallery.slice(1).every(view => view.role === "accessory"));
  assert.equal(product.gallery[0].kind, "photo");
  assert.equal(editorialRoles["16590"], undefined);
  const media = editorialMedia({ ...product, name: product.title });
  assert.ok(media.every(view => view.src === product.gallery[0].src));
});
test("corded TAL-1/2N2 never maps its chuck close-up or fictional accessories to contents", () => {
  const product = catalog.products.find(product => product.reference === "103068");
  const media = editorialMedia({ ...product, name: product.title });
  assert.match(media[1].src, /2b9a7918cf3a/);
  assert.equal(media[2].src, product.gallery[0].src);
  assert.ok(media.every(view => !/bauker|battery|charger|drill-kit/.test(view.src)));
});
test("original scene controls and scroll chapters are not replaced by galleries", () => {
  const source = name => readFileSync(new URL(`../components/ferready/${name}.tsx`, import.meta.url), "utf8");
  const hero = source("product-hero");
  const journey = source("product-journey");
  assert.doesNotMatch(hero + journey, /ImageSelector|imageIndex|viewIndex/);
  assert.doesNotMatch(source("storefront"), /ProductGallery/);
  assert.match(hero, /10_000/);
  assert.match(hero, /!reducedMotion && !hovered && !focused && !interacting/);
  assert.match(journey, /informational \? Boolean\(tablePieces\?\.length\)/);
  assert.match(journey, /ScrollTrigger/);
  assert.match(journey, /preservePixels=\{informational\}/);
});
test("only the exact user-confirmed SKU claims inclusion; other accessories remain illustrative", () => {
  for (const product of catalog.products) {
    const pieces = productTablePieces(product);
    const photo = product.gallery.find(view => view.kind === "photo");
    assert.equal(pieces.length, product.reference === "103068" ? 3 : photo ? 1 + product.gallery.filter(view => view.role === "accessory").length : 0);
    if (photo) {
      assert.equal(pieces[0].src, photo.src);
      assert.match(pieces[0].detail, product.reference === "103068" ? /fotografía del fabricante/ : /por confirmar/);
    }
    if (product.reference !== "103068") for (const piece of pieces.slice(1)) assert.match(piece.detail, /ilustrado; inclusión por confirmar/);
  }
  assert.deepEqual(productTablePieces({}), []);
  assert.deepEqual(productTablePieces({ gallery: [{ src: "/invented-battery.webp", kind: "illustration" }] }), []);
  const drill = catalog.products.find(product => product.reference === "103068");
  const pieces = productTablePieces(drill);
  assert.deepEqual(pieces.map(piece => piece.id), ["drill", "handle", "key"]);
  assert.deepEqual(pieces.map(piece => piece.label), ["Taladro", "Mango auxiliar", "Llave de broquero"]);
  for (const piece of pieces.slice(1)) {
    assert.match(piece.detail, /ilustración suministrada, no fotografía/);
    assert.ok(readFileSync(new URL(`../public${piece.src}`, import.meta.url)).length > 0);
  }
  assert.equal(confirmedContents(drill).confirmation.source, "user-confirmed");
  assert.equal(confirmedContents(drill).confirmation.confirmed_at, "2026-11-23");
  assert.equal(confirmedContents(drill).confirmation.manufacturer_verified, false);
  assert.equal(confirmedContents({ ...drill, model: "another-model" }), null);
  assert.equal(productTablePieces({ ...drill, model: "another-model" }).length, 1);
});
test("every selected illustration is reachable in the original scene or accessory table", () => {
  const selection = JSON.parse(readFileSync(new URL("../../../data/approved/truper-gallery-selection.json", import.meta.url)));
  for (const product of catalog.products) {
    const pieces = productTablePieces(product);
    const reachable = new Set(pieces.flatMap(piece => [piece.src, ...(piece.views ?? []).map(view => view.src)]));
    for (const view of product.gallery) assert.ok(reachable.has(view.src), `${product.reference}: unreachable ${view.src}`);
    for (const view of product.gallery.filter(view => view.kind === "illustration")) {
      assert.ok(selection.some(entry => entry.reference === product.reference && entry.source === view.provenance));
      assert.ok(["angle", "detail", "accessory"].includes(view.role));
    }
  }
});
test("a motor close-up does not become a project scene merely because it is the first illustration", () => {
  const product = catalog.products.find(product => product.reference === "13448");
  const media = editorialMedia({ ...product, name: product.title });
  assert.equal(media[1].src, media[0].src);
});
