import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  searchProducts,
  updateCart,
  cartTotal,
  restoreCart,
  isDemoEnabled,
} from "../lib/prototype.mjs";

const products = JSON.parse(
  readFileSync(new URL("../data/prototype-products.json", import.meta.url)),
);

test("all fifteen candidates have unique canonical handles and complete visual fixtures", () => {
  assert.equal(products.length, 15);
  assert.equal(new Set(products.map((p) => p.slug)).size, 15);
  for (const p of products) {
    for (const key of [
      "name",
      "brand",
      "category",
      "image",
      "description",
      "compatibility",
      "includes",
      "source",
    ])
      assert.ok(p[key], `${p.slug}: ${key}`);
    assert.ok(Number.isInteger(p.price) && p.price > 0);
    assert.ok(Object.keys(p.specs).length >= 2);
  }
});
test("direct search finds a hose without choosing a task and ignores accents", () => {
  assert.equal(
    searchProducts(products, "manguera")[0].slug,
    "manguera-flexible-50cm",
  );
  assert.equal(searchProducts(products, "plomeria").length, 2);
  assert.equal(searchProducts(products, "MULTIMETRO")[0].brand, "Redline");
  assert.equal(searchProducts(products, "").length, 15);
  assert.equal(searchProducts(products, "no-existe").length, 0);
});
test("cart adds, changes quantities, removes and calculates only valid fixture prices", () => {
  const slug = products[0].slug;
  let cart = updateCart([], slug, 1, products);
  cart = updateCart(cart, slug, 2, products);
  assert.deepEqual(cart, [{ slug, quantity: 2 }]);
  assert.equal(cartTotal(cart, products), products[0].price * 2);
  assert.deepEqual(updateCart(cart, slug, 0, products), []);
  assert.deepEqual(updateCart(cart, "unknown", 2, products), cart);
  assert.deepEqual(updateCart(cart, slug, -1, products), cart);
  assert.deepEqual(updateCart(cart, slug, 2.5, products), cart);
});
test("stored demo cart rejects malformed or tampered input and bounds quantities", () => {
  assert.deepEqual(restoreCart("{bad", products), []);
  assert.deepEqual(restoreCart('{"slug":"x"}', products), []);
  assert.deepEqual(
    restoreCart('[{"slug":"unknown","quantity":2}]', products),
    [],
  );
  assert.deepEqual(
    restoreCart(
      JSON.stringify([{ slug: products[0].slug, quantity: 99999 }]),
      products,
    ),
    [],
  );
});
test("real storefront remains the default and demonstration requires explicit activation", () => {
  assert.equal(isDemoEnabled(undefined), false);
  assert.equal(isDemoEnabled("0"), false);
  assert.equal(isDemoEnabled("1"), true);
});
