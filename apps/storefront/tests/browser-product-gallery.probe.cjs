const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/home/fabianvcha/playwright-login/node_modules/playwright");
const assert = require("node:assert/strict");
const catalog = require("../../../data/approved/catalog.json");

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const product of catalog.products) {
        await page.goto(`http://localhost:8000/p/${product.handle}`, { waitUntil: "networkidle" });
        const gallery = page.locator(".product-gallery");
        assert.equal(await gallery.count(), product.gallery.length ? 1 : 0);
        if (!product.gallery.length) continue;
        assert.equal(await gallery.locator(".gallery-thumbnails button").count(), product.gallery.length > 1 ? product.gallery.length : 0);
        if (product.gallery.length > 1) {
          await gallery.getByRole("button", { name: "Imagen siguiente" }).click();
          assert.equal(await gallery.locator("figure > img").getAttribute("src"), product.gallery[1].src);
          assert.match(await gallery.locator("figcaption").innerText(), /Ilustración suministrada/);
          await gallery.locator(".gallery-thumbnails button").nth(1).focus();
          await page.keyboard.press("End");
          assert.equal(await gallery.locator("figure > img").getAttribute("src"), product.gallery.at(-1).src);
          await page.keyboard.press("Home");
          assert.equal(await gallery.locator("figure > img").getAttribute("src"), product.gallery[0].src);
          await gallery.getByRole("button", { name: "Imagen anterior" }).click();
          assert.equal(await gallery.locator("figure > img").getAttribute("src"), product.gallery.at(-1).src);
        }
        await gallery.scrollIntoViewIfNeeded();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (product.reference === "101895") await page.screenshot({ path: `/tmp/opencode/product-gallery-${width}.png` });
      }
    }
    assert.deepEqual(errors, []);
    console.log("PASS: 36 galleries / empty states at 1440 and 390px; next, previous, Home/End keyboard, labels and overflow");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
