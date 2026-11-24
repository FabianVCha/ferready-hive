/** Exhaustive local SKU/stage audit; never touches backend state. */
const { chromium } = require("/home/fabianvcha/playwright-login/node_modules/playwright");
const fs = require("node:fs");
const path = require("node:path");
const catalog = require("../../../data/approved/catalog.json");
const out = process.env.BROWSER_EVIDENCE_DIR || "/tmp/opencode/truper-all-validation/browser";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const { editorialMedia, productTablePieces } = await import("../lib/editorial-media.mjs");
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const checks = [], issues = [], errors = [], assets = [];
  try {
    const page = await browser.newPage();
    page.on("pageerror", error => errors.push(error.message));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: process.env.AUDIT_MOTION === "normal" ? "no-preference" : "reduce" });
      for (const product of catalog.products) {
        if (process.env.AUDIT_MULTI_ONLY && product.gallery.length < 2) continue;
        const response = await page.goto(`http://localhost:8000/p/${product.handle}`, { waitUntil: "load" });
        if (response.status() !== 200) issues.push(`${width}/${product.reference}: HTTP ${response.status()}`);
        for (let chapter = 0; chapter < 4; chapter++) {
          await page.locator(".journey-stops a").nth(chapter).click();
          await page.waitForTimeout(process.env.AUDIT_MOTION === "normal" ? chapter === 3 ? 1250 : 400 : 40);
          const state = await page.locator(".product-journey").evaluate(async root => {
            const visual = root.querySelector(".journey-visual").getBoundingClientRect();
            const table = root.querySelector(".kit-table");
            const active = [...root.querySelectorAll('.journey-media-layer[data-active="true"] img, .kit-piece img')];
            const images = [];
            for (const img of active) {
              await img.decode();
              const r = img.getBoundingClientRect();
              const layer = img.closest(".journey-media-layer");
              images.push({ src: img.getAttribute("src"), loaded: img.complete && img.naturalWidth > 0,
                size: [img.clientWidth, img.clientHeight],
                layer: layer ? [layer.clientWidth, layer.clientHeight] : null,
                rect: [r.left - visual.left, r.top - visual.top, r.right - visual.left, r.bottom - visual.top] });
            }
            return { phase: root.dataset.phase, confirmed: root.dataset.contentsConfirmed,
              overflow: document.documentElement.scrollWidth > innerWidth,
              tableCount: table ? Number(table.dataset.count) : 0, images,
              packed: root.dataset.packed,
              piecesPacked: [...root.querySelectorAll(".kit-piece")].map(piece => piece.dataset.packed),
              visual: [visual.width, visual.height],
              copy: root.querySelector('[data-journey-chapter][aria-hidden="false"]')?.textContent,
              missing: !!root.querySelector(".approved-missing-image") };
          });
          const key = `${width}/${product.reference}/${chapter}`;
          const media = editorialMedia({ ...product, name: product.title });
          if (chapter < 2 && media && !state.images.some(image => image.src === media[chapter].src))
            issues.push(`${key}: expected exact role source ${media[chapter].src}`);
          if (state.phase !== String(chapter)) issues.push(`${key}: incorrect phase`);
          if (state.overflow) issues.push(`${key}: horizontal overflow`);
           const expected = Math.min(3, productTablePieces(product).length);
          if (state.tableCount !== expected) issues.push(`${key}: table inventory ${state.tableCount}, expected ${expected}`);
          if (chapter === 3 && expected && (state.packed !== "true" || state.piecesPacked.some(value => value !== "true")))
            issues.push(`${key}: packing did not finish`);
          for (const img of state.images) {
            if (!img.loaded) issues.push(`${key}: unloaded ${img.src}`);
            if (img.layer && (img.size[0] > img.layer[0] + 1 || img.size[1] > img.layer[1] + 1))
              issues.push(`${key}: intrinsic image exceeds layer ${img.src}`);
          }
          if (chapter === 2 && product.reference !== "103068" && !/por confirmar/.test(state.copy))
            issues.push(`${key}: missing contents uncertainty`);
           if (!product.images.length && !state.missing) issues.push(`${key}: missing-photo state absent`);
           if (chapter === 0) {
             const views = productTablePieces(product)[0]?.views ?? [];
             const observed = new Set([media?.[0]?.src]);
             for (let index = 1; index < views.length; index++) {
               await page.locator('.journey-media-layer[data-active="true"] .journey-change-view').click();
               const image = page.locator('.journey-media-layer[data-active="true"] img');
               await image.evaluate(img => img.decode());
               observed.add(await image.getAttribute("src"));
             }
             for (const view of views) if (!observed.has(view.src)) issues.push(`${key}: inaccessible view ${view.src}`);
             if (views.length > 1) await page.locator('.journey-media-layer[data-active="true"] .journey-change-view').click();
             assets.push({ reference: product.reference, width, sceneViews: [...observed] });
           }
           if (chapter === 2) {
             const pieces = productTablePieces(product);
             const observed = new Set();
             const next = page.getByRole("button", { name: "Siguientes", exact: true });
             do {
               for (const image of await page.locator(".kit-piece img").all()) {
                 await image.evaluate(img => img.decode());
                 observed.add(await image.getAttribute("src"));
               }
               for (const button of await page.locator(".kit-select").all()) {
                 await button.click();
                 if (await button.getAttribute("aria-pressed") !== "true") issues.push(`${key}: table selection lost`);
               }
               const labelFit = await page.locator(".kit-label").evaluateAll(labels => labels.every(label => {
                 const rect = label.getBoundingClientRect();
                 const visual = label.closest(".journey-visual").getBoundingClientRect();
                 return label.scrollWidth <= label.clientWidth + 1 && rect.left >= visual.left - 1 && rect.right <= visual.right + 1 && rect.bottom <= visual.bottom + 1;
               }));
               if (!labelFit) issues.push(`${key}: table label clipping`);
               const captionFit = expected ? await page.locator(".kit-table").evaluate(table => {
                 const caption = table.querySelector(".kit-info");
                 if (!caption || getComputedStyle(caption).display === "none") return true;
                 const note = caption.getBoundingClientRect();
                 return [...table.querySelectorAll(".kit-piece img")].every(image => {
                   const rect = image.getBoundingClientRect();
                   // The element's box contains empty object-fit letterboxing.
                   // Check visible source alpha, not that invisible rectangle.
                   const canvas = document.createElement("canvas");
                   canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
                   const context = canvas.getContext("2d");
                   context.drawImage(image, 0, 0);
                   const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                   let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
                   for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
                     if (pixels[(y * canvas.width + x) * 4 + 3] <= 16) continue;
                     left = Math.min(left, x); right = Math.max(right, x + 1);
                     top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
                   }
                   const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
                   const x = rect.left + (rect.width - canvas.width * scale) / 2;
                   const y = rect.bottom - canvas.height * scale;
                   return x + right * scale <= note.left || x + left * scale >= note.right || y + bottom * scale <= note.top || y + top * scale >= note.bottom;
                 });
               }) : true;
               if (!captionFit) issues.push(`${key}: caption overlaps a table object`);
               if (!await next.count() || !await next.isEnabled()) break;
               await next.click();
             } while (true);
             for (const piece of pieces.slice(1)) if (!observed.has(piece.src)) issues.push(`${key}: inaccessible accessory ${piece.src}`);
             const previous = page.getByRole("button", { name: "Anteriores", exact: true });
             while (await previous.count() && await previous.isEnabled()) await previous.click();
             assets.push({ reference: product.reference, width, tableSources: [...observed] });
           }
           await page.screenshot({ path: path.join(out, `${width}-${product.reference}-${chapter}.png`) });
          checks.push({ width, reference: product.reference, chapter, ...state });
        }
      }
    }
    const sources = new Set(catalog.products.flatMap(product => [...product.images, ...product.gallery.map(view => view.src)]));
    const contents = require("../../../data/approved/truper-contents-selection.json");
    Object.values(contents).forEach(entry => entry.components.forEach(component => sources.add(component.src)));
    for (const src of sources) {
      const response = await page.request.get(`http://localhost:8000${src}`);
      assets.push({ src, status: response.status(), type: response.headers()["content-type"] });
      if (response.status() !== 200 || !response.headers()["content-type"]?.startsWith("image/"))
        issues.push(`asset HTTP/type: ${src}`);
    }
    fs.writeFileSync(path.join(out, "proof.json"), JSON.stringify({ checks, assets, issues, errors }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, assets: assets.length, issues, errors }));
    if (issues.length || errors.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
