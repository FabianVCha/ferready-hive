/** Local informational routes and responsive navigation; no backend writes. */
const { chromium } = require("/home/fabianvcha/playwright-login/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const catalog = require("../../../data/approved/catalog.json");
const out = process.env.BROWSER_EVIDENCE_DIR || "/tmp/opencode/truper-multi-final/navigation";
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const proof = [];
  try {
    const page = await browser.newPage({ reducedMotion: "reduce" });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal((await page.goto("http://localhost:8000/")).status(), 200);
      assert.equal(await page.locator(".hero-object").count(), 3);
      for (const category of catalog.categories) {
        assert.equal(await page.locator(`.category-nav a[href="/c/${category.handle}"]`).count(), 1);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${out}/${width}-home.png` });
      if (width <= 760) {
        await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
        const last = catalog.categories.at(-1);
        await page.locator(`.category-nav a[href="/c/${last.handle}"]`).click();
        await page.waitForURL(`http://localhost:8000/c/${last.handle}`);
        assert.equal(await page.locator(".category-nav.is-open").count(), 0);
      }
      for (const category of catalog.categories) {
        assert.equal((await page.goto(`http://localhost:8000/c/${category.handle}`)).status(), 200);
        const expected = catalog.products.filter(product => product.category === category.handle);
        for (const product of expected) assert.ok(await page.locator(`.catalog-products a[href="/p/${product.handle}"]`).count());
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        proof.push({ width, category: category.handle, products: expected.length });
      }
      assert.equal((await page.goto("http://localhost:8000/catalogo")).status(), 200);
      assert.equal(await page.locator(".catalog-products .product-card").count(), 45);
      await page.screenshot({ path: `${out}/${width}-catalog.png`, fullPage: true });
      for (const product of catalog.products.slice(36)) {
        assert.equal((await page.goto(`http://localhost:8000/catalogo?q=${product.reference}`)).status(), 200);
        assert.ok(await page.locator(`.catalog-products a[href="/p/${product.handle}"]`).count());
      }
    }
    fs.writeFileSync(`${out}/proof.json`, JSON.stringify(proof, null, 2));
    console.log(JSON.stringify({ categoryChecks: proof.length, catalogProducts: 45, widths: [1440, 390, 320] }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
