import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { validateCatalog } from "../../../packages/catalog-schema/src/index.js";

const root = new URL("../../../", import.meta.url);
const input = JSON.parse(await readFile(new URL("data/approved/catalog.json", root), "utf8"));
const evidence = JSON.parse(await readFile(new URL("data/approved/truper-source-evidence.json", root), "utf8"));
const { catalog, ok, errors } = validateCatalog(input);

test("approved non-demo routes retain the Ferready shell without demo commerce", async () => {
  const layout = await readFile(new URL("apps/storefront/app/layout.tsx", root), "utf8");
  const shell = await readFile(new URL("apps/storefront/components/ferready/shell.tsx", root), "utf8");
  assert.match(layout, /if \(demo \|\| usesApprovedCatalog\)/);
  assert.match(layout, /informational=\{!demo\}/);
  assert.match(layout, /approvedCategories=\{approvedCatalog.categories\}/);
  assert.match(shell, /className="cart-link"/);
  assert.match(shell, /fetch\("\/api\/selection-cart"/);
  assert.doesNotMatch(shell, /!informational && <Link\s+href="\/carrito"/);
  assert.match(shell, /if \(ready && !informational\)/);
});

test("approved routes reuse the original homepage, catalog and rich product components", async () => {
  for (const [path, expected] of [
    ["app/page.tsx", /if \(usesApprovedCatalog\) return <HomeView/],
    ["app/catalogo/page.tsx", /return <CatalogView/],
    ["app/c/[handle]/page.tsx", /return <CatalogView/],
    ["app/p/[slug]/page.tsx", /approvedVisualCatalog.products.find/],
  ]) {
    const source = await readFile(new URL(`apps/storefront/${path}`, root), "utf8");
    assert.match(source, expected);
    assert.doesNotMatch(source, /components\/approved-catalog/);
  }
});

test("the approved Truper batches preserve source identities without prices or stock", () => {
  assert.equal(ok, true, errors.join("\n"));
  assert.deepEqual(catalog.products.slice(0, 12).map((p) => p.reference), [
    "101895", "103068", "103740", "103741", "104271", "104275",
    "104412", "11452", "13448", "14012", "16182", "16590",
  ]);
  assert.equal(catalog.products.length, 45);
  assert.equal(new Set(catalog.products.map((p) => p.reference)).size, 45);
  assert.equal(new Set(catalog.products.map((p) => p.handle)).size, 45);
  assert.deepEqual(catalog.products.slice(36).map(p => p.reference).sort(), [
    "100362", "100891", "100894", "103722", "104111", "104242", "104274", "104495", "13178",
  ]);
  for (const product of catalog.products) {
    const source = evidence.find((item) => item.reference === product.reference);
    assert.equal(product.title, source.title);
    assert.equal(product.model, source.model);
    assert.equal(product.brand, source.brand);
    assert.deepEqual(product.specifications, source.specifications);
    assert.equal(product.price_cop, null);
    assert.equal(product.path, `/p/${product.handle}`);
    assert.equal("stock" in product, false);
    assert.equal(product.source_url, source.source_url);
  }
});

test("public photographs match audited hashes, never generated ancillary images", async () => {
  for (const product of catalog.products) {
    if (["19784", "12544"].includes(product.reference)) {
      assert.deepEqual(product.images, []);
      continue;
    }
    assert.equal(product.images.length, 1);
    const publicImage = await readFile(new URL(`apps/storefront/public${product.images[0]}`, root));
    const source = evidence.find((item) => item.reference === product.reference);
    assert.equal(createHash("sha256").update(publicImage).digest("hex"), source.photograph_sha256);
    assert.equal(publicImage[0], 0xff);
    assert.equal(publicImage[1], 0xd8);
  }
});

test("selected folder intake corrects garden classification and excludes retailer image candidates", () => {
  assert.equal(catalog.products.find((p) => p.reference === "15020").category, "jardineria");
  for (const reference of ["19784", "12544"]) {
    assert.equal(evidence.find((p) => p.reference === reference).image_source_url, null);
  }
  const counts = Object.fromEntries(["aire-comprimido-y-pintura", "construccion", "corte-y-abrasivos"]
    .map((category) => [category, evidence.filter((p) => p.selection_folder?.startsWith(`${category}/`)).length]));
  assert.deepEqual(counts, { "aire-comprimido-y-pintura": 7, construccion: 6, "corte-y-abrasivos": 11 });
});
