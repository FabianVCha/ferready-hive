const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/home/fabianvcha/playwright-login/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const catalog = require("../../../data/approved/catalog.json");
const origin = process.env.CATALOG_TEST_ORIGIN || "http://localhost:8000";
const out = process.env.BROWSER_EVIDENCE_DIR || "/tmp/opencode/ferready-approved-catalog";
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    const errors = [];
    const cssResponses = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", (response) => {
      if (response.request().resourceType() === "stylesheet") cssResponses.push(response.status());
    });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/catalogo", ...catalog.categories.map((c) => `/c/${c.handle}`), ...catalog.products.map((p) => `/p/${p.handle}`)]) {
        const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
        assert.equal(response.status(), 200, route);
        assert.match(await page.title(), /Ferready/);
        const body = await page.locator("main").innerText();
        assert.match(body, /Precio y disponibilidad por confirmar/);
        assert.doesNotMatch(body, /\$\s?[\d.,]+|En stock/i);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow: ${route} at ${width}`);
        const images = await page.locator("main img").evaluateAll(async (items) => {
          items.forEach((image) => { image.loading = "eager"; });
          await Promise.all(items.map((image) => image.decode()));
          return items.map((image) => image.naturalWidth > 0);
        });
        const product = catalog.products.find((p) => route === `/p/${p.handle}`);
        if (product) assert.equal(await page.locator(".journey-product-heading h1").innerText(), product.title);
        assert(images.every(Boolean), route);
        if (product?.images.length === 0) {
          assert.equal(await page.locator(".journey-object img").count(), 0, route);
          assert.match(await page.locator(".journey-object").innerText(), /Fotografía no disponible/);
        }
        else assert(images.length > 0, route);
      }
      await page.goto(`${origin}/catalogo`);
      assert.equal(await page.locator("main .product-card").count(), catalog.products.length);
      assert.equal(await page.locator(".catalog-layout .catalog-filters").count(), 1);
      assert.equal(await page.locator(".ferready.neutral-template .fr-header .template-logo").count(), 1);
      assert.equal(await page.locator(".cart-link").count(), 1);
      const design = await page.locator(".ferready").evaluate((element) => ({
        font: getComputedStyle(element).fontFamily,
        paper: getComputedStyle(element).backgroundColor,
      }));
      assert.match(design.font, /Manrope/);
      assert.equal(design.paper, "rgb(245, 242, 236)");
      assert.equal(await page.locator(".approved-navigation a").count(), catalog.categories.length + 2);
      await page.screenshot({ path: path.join(out, `catalog-${width}.png`), fullPage: true });
      fs.writeFileSync(path.join(out, `computed-${width}.json`), JSON.stringify(design, null, 2));
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".campaign-home .product-hero").count(), 1);
      assert.equal(await page.locator(".hero-object").count(), 3);
      await page.locator(".hero-object").nth(1).click();
      assert.equal(await page.locator(".hero-object").nth(1).getAttribute("aria-pressed"), "true");
      await page.locator(".hero-object").evaluateAll((elements) =>
        Promise.all(elements.flatMap((element) => element.getAnimations().map((animation) => animation.finished.catch(() => {})))));
      assert.equal(await page.locator(".objective-options button").count(), catalog.categories.length);
      await page.locator(".objective-options button").nth(1).click();
      assert.equal(await page.locator(".objective-options button").nth(1).getAttribute("aria-pressed"), "true");
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({ path: path.join(out, `home-${width}.png`), fullPage: false });
      if (width < 760) {
        await page.locator("#por-tarea").scrollIntoViewIfNeeded();
        await page.locator(".mobile-menu").click();
        assert.equal(await page.locator(".mobile-menu").getAttribute("aria-expanded"), "true");
        const menuBox = await page.locator(".category-nav").boundingBox();
        assert(menuBox.y >= 0 && menuBox.y < 200 && menuBox.y + menuBox.height <= 901, "Mobile menu stays visible below sticky header after scrolling");
        await page.screenshot({ path: path.join(out, `menu-${width}.png`), fullPage: false });
        await page.locator(".category-nav a").nth(1).click();
        await page.waitForURL(`**/c/${catalog.categories[0].handle}`);
      }
      await page.goto(`${origin}/p/${catalog.products[0].handle}`, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".product-journey .journey-stops a").count(), 4);
      assert.equal(await page.locator(".product-information details").count(), 4);
      assert.equal(await page.locator(".buy-controls").count(), 1);
      assert.equal(await page.locator(".buy-now").count(), 0);
      await page.screenshot({ path: path.join(out, `product-${width}.png`), fullPage: false });
      await page.getByRole("button", { name: "Ver sin animación", exact: true }).click();
      assert(await page.locator(".product-journey").evaluate((element) => element.classList.contains("journey-still")));
      await page.getByRole("link", { name: "Qué incluye", exact: true }).click();
      await page.locator("#especificaciones").scrollIntoViewIfNeeded();
      await page.getByText("Especificaciones del producto", { exact: false }).click();
      assert(await page.locator("#especificaciones details").nth(1).evaluate((element) => element.open));
    }
    await page.goto(`${origin}/catalogo?q=11452`);
    assert.equal(await page.locator("main .product-card").count(), 1);
    assert(cssResponses.length > 0);
    assert(cssResponses.every((status) => status === 200));
    // An expected 404 is checked separately from unexpected console errors.
    assert.deepEqual(errors, []);
    assert.equal((await page.goto(`${origin}/carrito`)).status(), 200);
    assert.equal((await page.goto(`${origin}/checkout`)).status(), 404);
    await page.goto(`${origin}/p/not-an-approved-product`);
    assert.equal(await page.locator("main img").count(), 0);
    console.log(`Passed: ${2 + catalog.categories.length + catalog.products.length} approved routes at 3 widths, audited photographs and explicit missing images, no invented prices/stock, search and missing product.`);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
