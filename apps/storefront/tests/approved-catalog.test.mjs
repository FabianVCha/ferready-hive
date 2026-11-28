import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { validateCatalog } from "../../../packages/catalog-schema/src/index.js";

const root = new URL("../../../", import.meta.url);
const input = JSON.parse(await readFile(new URL("data/approved/catalog.json", root), "utf8"));
const evidence = JSON.parse(await readFile(new URL("data/approved/truper-source-evidence.json", root), "utf8"));
const { catalog, ok, errors } = validateCatalog(input);

// Product photography is deliberately not versioned (see docs/despliegue-vps.md):
// it lives on the host and is mounted into the container. The byte-level audit only
// runs where the media set exists, so CI skips it instead of failing on missing files.
const productMediaPresent = existsSync(new URL("apps/storefront/public/project/products/", root));

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

test("approved home is isolated while catalog and rich product components are retained", async () => {
  for (const [path, expected] of [
    ["app/page.tsx", /if \(usesApprovedCatalog\) return <ProjectHome/],
    ["app/catalogo/page.tsx", /return <CatalogView/],
    ["app/c/[handle]/page.tsx", /return <CatalogView/],
    ["app/p/[slug]/page.tsx", /approvedVisualCatalog.products.find/],
  ]) {
    const source = await readFile(new URL(`apps/storefront/${path}`, root), "utf8");
    assert.match(source, expected);
    assert.doesNotMatch(source, /components\/approved-catalog/);
  }
});

test("project home uses only existing references without activating the mock inventory", async () => {
  const home = await readFile(new URL("apps/storefront/components/ferready/project-home.tsx", root), "utf8");
  const layout = await readFile(new URL("apps/storefront/app/layout.tsx", root), "utf8");
  const shell = await readFile(new URL("apps/storefront/components/ferready/shell.tsx", root), "utf8");
  assert.match(home, /useVisualCatalog\(\)/);
  assert.doesNotMatch(home + layout, /client-mock|mockCatalog|CLIENT_MOCK|prototype-products/);
  assert.doesNotMatch(home, /15 referencias|Propuesta visual/);
  assert.match(home, /preservePixels/);
  assert.match(shell, /const projectHome = informational && path === "\/"/);
  const activeCatalog = JSON.parse(await readFile(new URL("data/project/first15-truper.json", root), "utf8"));
  for (const reference of [...home.matchAll(/"(\d{5,6})"/g)].map(match => match[1])) {
    const product = activeCatalog.products.find(product => product.reference === reference);
    assert.ok(product, `Home reference ${reference} must exist in the active owner selection`);
    assert.ok(product.images.length, `Home reference ${reference} needs an existing photograph`);
  }
  for (const query of ["rotomartillo", "sellador", "multímetro"]) {
    assert.ok(activeCatalog.products.some(product => product.title.toLocaleLowerCase("es").includes(query)));
  }
});

test("home and catalog suppress passive cart errors without disabling cart recovery", async () => {
  const shell = await readFile(new URL("apps/storefront/components/ferready/shell.tsx", root), "utf8");
  assert.match(shell, /informational && cartError && !projectHome && \(!browsingCatalog \|\| cartError\.operation === "save"\)/);
  assert.match(shell, /Reintentar conexión/);
  assert.match(shell, /catch \{\s*setCartError\(\{ message: "No pudimos guardar el carrito/);
  assert.match(shell, /Carrito no disponible/);
  assert.match(shell, /href="\/carrito"/);
});

test("home uses concise presentation names and explains its selection-only workflow", async () => {
  const home = await readFile(new URL("apps/storefront/components/ferready/project-home.tsx", root), "utf8");
  assert.match(home, /homeProductName\(current\)/);
  assert.match(home, /homeProductName\(product\)/);
  assert.match(home, /Precio y disponibilidad por confirmar/);
  assert.match(home, /aria-label=\{`Conocer \$\{product.name\}`\}/);
  assert.match(home, /Instagram: null/);
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

test("public photographs match audited hashes, never generated ancillary images", async (t) => {
  if (!productMediaPresent) {
    t.diagnostic("product photography is not versioned; the hash audit needs apps/storefront/public/project/products/ in this checkout");
    return t.skip("product photography is not present in this checkout");
  }
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
