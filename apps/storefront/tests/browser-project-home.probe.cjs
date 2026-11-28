const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const activeCatalog = require("../../../data/project/first15-truper.json");

const base = process.env.STOREFRONT_URL || "http://localhost:8000";
const out = process.env.BROWSER_EVIDENCE_DIR || "/tmp/opencode/ferready-home-port";
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    const report = { views: [], links: [], errors: [] };
    page.on("pageerror", error => report.errors.push(error.message));
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal((await page.goto(base, { waitUntil: "networkidle" })).status(), 200);
      await page.locator("main img").evaluateAll(async images => {
        await Promise.all(images.map(async image => { image.loading = "eager"; await image.decode(); }));
      });
      for (const section of await page.locator(".project-home section").all()) {
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(650);
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(650);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
      assert.equal(await page.locator(".project-home h1").innerText(), "Manos a\nla obra.");
      assert.equal(await page.locator(".project-home section").count(), 6);
      assert.equal(await page.locator("main [role=alert]").count(), 0);
      assert.match(await page.locator(".client-selection-note").innerText(), /Precio y disponibilidad por confirmar/);
      for (const link of await page.locator(".fr-footer a, .client-company-link, .client-showroom-caption a").all()) {
        assert.ok((await link.boundingBox()).height >= 44, `Touch target at ${width}`);
      }
      assert.equal(await page.locator(".client-socials svg").count(), 3);
      assert.equal(await page.locator(".client-socials a").count(), 2);
      for (const [name, href] of [
        ["Facebook", "https://www.facebook.com/profile.php?id=61597257410189"],
        ["TikTok", "https://www.tiktok.com/@ferready?_r=1&_t=ZS-9BluHoXtjXA"],
      ]) {
        assert.equal(await page.getByRole("link", { name, exact: true }).getAttribute("href"), href);
      }
      assert.equal(await page.getByRole("img", { name: "Instagram · enlace por confirmar", exact: true }).count(), 1);
      const platform = await page.locator(".showroom-counter").evaluate(element => {
        const top = element.querySelector(".hero-counter-top").getBoundingClientRect();
        const edge = element.querySelector(".hero-counter-edge").getBoundingClientRect();
        const scene = element.parentElement.getBoundingClientRect();
        return { decorative: element.getAttribute("aria-hidden"), pointerEvents: getComputedStyle(element).pointerEvents,
          width: top.width, depth: top.height, thickness: edge.height, joined: Math.abs(top.bottom - edge.top) < 1,
          contained: edge.left >= scene.left && edge.right <= scene.right };
      });
      assert.equal(platform.decorative, "true");
      assert.equal(platform.pointerEvents, "none");
      assert.ok(platform.width > 200 && platform.depth > 30 && platform.thickness >= 12 && platform.joined && platform.contained, `Physical platform at ${width}`);
      await page.locator(".client-showroom").screenshot({ path: path.join(out, `platform-${width}.png`) });
      await page.screenshot({ path: path.join(out, `8000-${width}.png`), fullPage: true });
      report.views.push({ width, overflow: false, images: "loaded" });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    const buttons = page.locator(".client-showroom-tools button");
    await buttons.nth(1).click();
    assert.equal(await buttons.nth(1).getAttribute("aria-pressed"), "true");
    assert.match(await page.locator(".client-showroom-caption a").getAttribute("href"), /104271/);
    const destinations = await page.locator(".project-home a").evaluateAll(links =>
      [...new Set(links.map(link => link.getAttribute("href")).filter(href => href.startsWith("/") && !href.startsWith("//")))],
    );
    for (const href of destinations) {
      const response = await page.request.get(`${base}${href}`);
      assert.equal(response.status(), 200, href);
      report.links.push({ href, status: response.status() });
    }
    // Client-side navigation must also deactivate the home-only shell CSS.
    await page.locator(".client-showroom-caption a").click();
    await page.waitForURL("**/p/**");
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator(".project-home").count(), 0);
    assert.equal(await page.locator(".ferready:has(.project-home)").count(), 0);
    assert.equal(await page.locator("#category-navigation a").filter({ hasText: "La empresa" }).count(), 0);
    assert.ok(await page.locator("#category-navigation a").count() >= 3);
    await page.screenshot({ path: path.join(out, "original-product-1440.png"), fullPage: true });
    assert.equal((await page.goto(`${base}/catalogo`, { waitUntil: "networkidle" })).status(), 200);
    // The catalog also retains the owner's non-commercial pending hose slot.
    assert.equal(await page.locator(".product-card").count(), activeCatalog.products.length + 1);
    assert.equal(await page.locator(".project-home").count(), 0);
    await page.screenshot({ path: path.join(out, "original-catalog-1440.png"), fullPage: true });
    assert.equal((await page.goto(`${base}/carrito`, { waitUntil: "networkidle" })).status(), 200);
    report.cart = await page.locator("main").innerText();
    if (report.cart.includes("No pudimos cargar el carrito")) {
      assert.equal(await page.getByRole("button", { name: "Reintentar conexión" }).count(), 1);
      assert.ok((await page.getByRole("button", { name: "Reintentar conexión" }).boundingBox()).height >= 44);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".client-showroom-tools button").first().evaluate(element => getComputedStyle(element).transitionDuration), "0s");
    await page.locator(".mobile-menu").click();
    await page.locator("#category-navigation a").filter({ hasText: "La empresa" }).click();
    await page.waitForURL("**/#empresa");
    assert.equal(new URL(page.url()).hash, "#empresa");
    await page.keyboard.press("Tab");
    await page.screenshot({ path: path.join(out, "home-reduced-motion-mobile.png"), fullPage: true });
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
