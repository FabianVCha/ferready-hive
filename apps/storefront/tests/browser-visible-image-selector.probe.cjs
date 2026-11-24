const { chromium } = require("/home/fabianvcha/playwright-login/node_modules/playwright");
const assert = require("node:assert/strict");
const product = require("../../../data/approved/catalog.json").products.find(p => p.reference === "103068");

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const surface of ["home", "product"]) {
        await page.goto(`http://localhost:8000${surface === "home" ? "/" : "/p/103068-tal-1-2n2"}`, { waitUntil: "networkidle" });
        if (surface === "home") {
          await page.getByRole("button", { name: `Seleccionar ${product.title}`, exact: true }).click();
          await page.locator(".hero-object").evaluateAll(es => Promise.all(es.flatMap(e => e.getAnimations().map(a => a.finished.catch(() => {})))));
        }
        const selector = page.locator(surface === "home" ? ".hero-detail .image-selector" : ".journey-stage > .image-selector");
        const image = page.locator(surface === "home" ? '.hero-object[data-slot="active"] img' : ".journey-object img");
        await selector.scrollIntoViewIfNeeded();
        assert.equal(await selector.locator("button").count(), 3);
        await page.screenshot({ path: `/tmp/opencode/tal-after-${surface}-${width}-before-click.png` });
        for (const index of [1, 2, 0]) {
          await selector.locator("button").nth(index).click();
          await image.evaluate(im => im.decode());
          assert.equal(await image.getAttribute("src"), product.gallery[index].src);
          assert.equal(await selector.locator("button").nth(index).getAttribute("aria-pressed"), "true");
          assert(await image.isVisible());
          const box = await image.boundingBox();
          assert(box.width > 60 && box.height > 60, `${surface} image collapsed at ${width}: ${JSON.stringify(box)}`);
          await page.screenshot({ path: `/tmp/opencode/tal-after-${surface}-${width}-view-${index}.png` });
        }
        await selector.locator("button").first().focus();
        await page.keyboard.press("ArrowRight");
        assert.equal(await image.getAttribute("src"), product.gallery[1].src);
        assert.match(await selector.innerText(), /Ilustración suministrada/);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
    }
    console.log("PASS: TAL-1/2N2 visible selectors change actual hero/journey images on home+product at 1440/390/320; keyboard, labels and overflow");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
