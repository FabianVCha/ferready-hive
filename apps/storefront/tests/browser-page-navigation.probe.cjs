const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.STOREFRONT_URL || "http://localhost:8000";
const out = "/tmp/opencode/ferready-page-navigation";
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const report = { views: [], animations: [], errors: [] };
  try {
    const page = await browser.newPage();
    page.on("pageerror", error => report.errors.push(error.message));
    await page.addInitScript(() => {
      window.routeAnimations = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const result = animate.apply(this, args);
        if (this.classList.contains("route-surface") || this.classList.contains("catalog-page")) {
          const record = { frames: args[0], options: args[1], initial: getComputedStyle(this).opacity };
          window.routeAnimations.push(record);
          requestAnimationFrame(() => { record.during = getComputedStyle(this).opacity; });
          result.finished.then(() => { record.finished = getComputedStyle(this).opacity; }).catch(() => {});
        }
        return result;
      };
    });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base, { waitUntil: "networkidle" });
      const nav = page.getByRole("navigation", { name: "Navegación principal" });
      async function check(route) {
        for (const name of ["Inicio", "Catálogo"]) {
          const box = await nav.getByRole("link", { name, exact: true }).boundingBox();
          assert.ok(box && box.height >= 44 && box.x >= 0 && box.x + box.width <= width);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        report.views.push({ width, route });
      }
      await check("/");
      await nav.getByRole("link", { name: "Catálogo", exact: true }).click();
      await page.waitForURL("**/catalogo");
      await page.waitForTimeout(350);
      await check("/catalogo");
      const product = await page.locator('main a[href^="/p/"]').evaluateAll(links =>
        links.map(a => a.getAttribute("href")).find(href => href.includes("104412")));
      assert.ok(product, "104412 is reachable from the catalog");
      await page.locator(`main a[href="${product}"]`).first().click();
      await page.waitForURL(`**${product}`);
      await page.waitForTimeout(350);
      await check(product);
      await page.locator(".cart-link").click();
      await page.waitForURL("**/carrito");
      await page.waitForTimeout(350);
      await check("/carrito");
      await nav.getByRole("link", { name: "Inicio", exact: true }).click();
      await page.waitForURL(base + "/");
      await page.waitForTimeout(350);
      await check("/");
      await page.screenshot({ path: `${out}/home-${width}.png` });
      report.animations.push(...await page.evaluate(() => window.routeAnimations.splice(0)));
    }
    assert.ok(report.animations.some(a => Number(a.during) < 1 && a.finished === "1"), "Actual opacity changes and settles");
    assert.ok(report.animations.every(a => Number(a.initial) <= 0.1 && a.options.duration === 280), "Page changes have a perceptible entrance, not a barely-visible tint change");
    assert.ok(report.animations.every(a => !a.frames.some(f => "transform" in f)));
    await page.evaluate(() => { window.routeAnimations = []; });
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Catálogo", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/catalogo");
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.routeAnimations.length), 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Inicio", exact: true }).click();
    await page.waitForURL(base + "/");
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.routeAnimations.length), 0);
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
