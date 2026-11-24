const { chromium } = require("/home/fabianvcha/playwright-login/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const catalog = require("../../../data/approved/catalog.json");
const out = process.env.BROWSER_EVIDENCE_DIR || "/tmp/opencode/contents-table";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const { productTablePieces } = await import("../lib/editorial-media.mjs");
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const report = [], errors = [];
  try {
    const page = await browser.newPage();
    page.on("pageerror", error => errors.push(error.message));
    const sample = () => page.evaluate(() => {
      const root = document.querySelector(".product-journey"), table = root.querySelector(".kit-table");
      return {
        phase: root.dataset.phase, overflow: document.documentElement.scrollWidth > innerWidth,
        table: table ? { opacity: +getComputedStyle(table).opacity, count: table.dataset.count, hidden: table.getAttribute("aria-hidden"), idle: table.dataset.idle } : null,
        items: [...root.querySelectorAll(".kit-piece img")].map(img => ({ src: img.getAttribute("src"), loaded: img.complete && img.naturalWidth > 0 })),
         packed: root.dataset.packed, close: +root.style.getPropertyValue("--parcel-close"),
         piecesPacked: [...root.querySelectorAll(".kit-piece")].map(piece => piece.dataset.packed),
        copy: root.querySelector('[data-journey-chapter][aria-hidden="false"]')?.textContent,
      };
    });
    for (const reduced of [false, true]) for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      await page.goto("http://localhost:8000/p/103068-tal-1-2n2", { waitUntil: "networkidle" });
      for (const chapter of [0, 1]) {
        await page.locator(".journey-stops a").nth(chapter).click();
        await page.waitForTimeout(500);
        const fit = await page.locator('.journey-media-layer[data-active="true"] img').evaluate(async img => {
          await img.decode();
          const layer = img.closest(".journey-media-layer");
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const context = canvas.getContext("2d");
          context.drawImage(img, 0, 0);
          return { image: [img.clientWidth, img.clientHeight], layer: [layer.clientWidth, layer.clientHeight],
            cornerAlpha: context.getImageData(0, 0, 1, 1).data[3] };
        });
        assert(fit.image[0] <= fit.layer[0] + 1);
        assert(fit.image[1] <= fit.layer[1] + 1, "image must not grow to its intrinsic square height and clip");
        assert.equal(fit.cornerAlpha, 0, "both product and project backgrounds must be transparent");
        await page.screenshot({ path: path.join(out, `${width}-${reduced}-chapter-${chapter}.png`) });
      }
      await page.locator(".journey-stops a").nth(2).click();
      await page.waitForTimeout(500);
      const state = await sample();
      assert.equal(state.phase, "2");
       assert.equal(state.table.count, "3");
      assert.equal(state.table.opacity, 1);
      assert.equal(state.table.hidden, "false");
      assert.match(state.items[0].src, /103068-alpha\.png/);
       assert(state.items[0].loaded);
       assert(state.items.every(item => item.loaded));
       assert.match(state.items[1].src, /103068-contents-handle-be2dbd7cd703/);
       assert.match(state.items[2].src, /103068-contents-key-e3cd46b99694/);
       const assetProof = await page.locator(".kit-piece img").evaluateAll(async images => Promise.all(images.map(async img => {
         await img.decode();
         const canvas = document.createElement("canvas");
         canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
         const context = canvas.getContext("2d"); context.drawImage(img, 0, 0);
         return { alpha: context.getImageData(0, 0, 1, 1).data[3], width: img.clientWidth, height: img.clientHeight };
       })));
       assert(assetProof.every(item => item.alpha === 0 && item.width > 0 && item.height > 0));
       const labelFit = await page.locator(".kit-label").evaluateAll(labels => labels.map(label => {
         const visual = label.closest(".journey-visual").getBoundingClientRect();
         const rect = label.getBoundingClientRect();
         return label.scrollWidth <= label.clientWidth + 1 && rect.left >= visual.left - 1 && rect.right <= visual.right + 1 && rect.bottom <= visual.bottom + 1;
       }));
       assert(labelFit.every(Boolean), "all three complete labels must fit inside the table");
       assert.match(state.copy, /Inclusión confirmada por el usuario/);
       assert.match(state.copy, /1 taladro1 mango auxiliar1 llave de broquero/);
      assert(!state.overflow);
       const selectors = page.locator(".kit-select");
       for (let index = 0; index < 3; index++) {
         const select = selectors.nth(index);
         await select.click();
         assert.equal(await select.getAttribute("aria-pressed"), "true");
         assert.equal(await page.locator('.kit-select[aria-pressed="true"]').count(), 1);
         const label = await select.getAttribute("aria-label");
         assert.match(label, [/taladro/, /mango auxiliar/, /llave de broquero/][index]);
         const info = await page.locator(".kit-info").textContent();
         assert.match(info, index === 0 ? /fotografía del fabricante/ : /ilustración suministrada, no fotografía/);
         await page.screenshot({ path: path.join(out, `${width}-${reduced}-selected-${index}.png`) });
       }
       await selectors.first().focus();
       await page.keyboard.press("Enter");
       assert.equal(await selectors.first().getAttribute("aria-pressed"), "true");
      const toggle = page.locator(".kit-table .hero-motion-toggle");
       const sway = page.locator(".kit-piece .hero-object-sway").first();
      if (!reduced) {
        await toggle.click();
        assert.equal(await toggle.getAttribute("aria-pressed"), "true");
        assert.equal(await sway.evaluate(el => getComputedStyle(el).animationPlayState), "paused");
        await toggle.click();
        await page.mouse.move(0, 0);
        await page.locator(".journey-stops a").nth(2).click();
        await page.mouse.move(0, 0);
        await page.waitForTimeout(100);
        const before = await sway.evaluate(el => getComputedStyle(el).transform);
        await page.waitForTimeout(450);
        const after = await sway.evaluate(el => getComputedStyle(el).transform);
        assert.notEqual(before, after, "original object sway must run");
      } else assert.equal(await sway.evaluate(el => getComputedStyle(el).animationName), "none");
      await page.screenshot({ path: path.join(out, `${width}-${reduced}-contents.png`) });
      await page.locator(".journey-stops a").nth(3).click();
      await page.waitForTimeout(1400);
      const packing = await sample();
      assert.equal(packing.packed, "true");
       assert(packing.close > .999);
       assert.deepEqual(packing.piecesPacked, ["true", "true", "true"]);
      await page.screenshot({ path: path.join(out, `${width}-${reduced}-packed.png`) });
      report.push({ width, reduced, state, packing });
      await page.goto("http://localhost:8000/", { waitUntil: "networkidle" });
      assert.equal(await page.locator(".hero-object").count(), 3);
      await page.screenshot({ path: path.join(out, `${width}-${reduced}-home.png`) });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const product of catalog.products) {
      await page.goto("http://localhost:8000/p/" + product.handle, { waitUntil: "networkidle" });
      await page.locator(".journey-stops a").nth(2).click();
      const state = await sample();
      const photo = product.gallery.find(view => view.kind === "photo");
        assert.equal(state.items.length, Math.min(3, productTablePieces(product).length));
      if (photo) assert.equal(state.items[0].src, photo.src);
      assert(!state.overflow);
       assert.match(state.copy, product.reference === "103068" ? /Inclusión confirmada por el usuario/ : /por confirmar/);
      report.push({ reference: product.reference, state });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, "proof.json"), JSON.stringify({ report, errors }, null, 2));
    console.log(`PASS: ${report.length} scene checks, original motion/pause/packing, 3 widths, reduced motion, no browser errors`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
