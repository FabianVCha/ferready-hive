const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const out = "/tmp/opencode/ferready-page-navigation/catalog-entry";
fs.mkdirSync(out, { recursive: true });
const base = process.env.STOREFRONT_URL || "http://localhost:8000";

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const report = [];
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        recordVideo: { dir: out, size: { width, height: 1000 } },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(() => {
        window.catalogEntries = [];
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          const animation = animate.apply(this, args);
          if (this.classList.contains("catalog-page")) {
            const record = { gridReady: !!this.querySelector(".catalog-products"), samples: [] };
            window.catalogEntries.push(record);
            const start = performance.now();
            const sample = () => {
              const grid = this.querySelector(".catalog-products");
              const header = document.querySelector(".fr-header");
              record.samples.push({
                time: Math.round(performance.now() - start),
                opacity: getComputedStyle(this).opacity,
                gridTop: grid?.getBoundingClientRect().top,
                transform: getComputedStyle(this).transform,
                headerTop: header.getBoundingClientRect().top,
              });
              if (performance.now() - start < 350) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }
          return animation;
        };
      });
      await page.goto(base, { waitUntil: "networkidle" });
      const nav = page.getByRole("navigation", { name: "Navegación principal" });
      for (const link of ["header", "cta", "header", "cta"]) {
        const before = await page.evaluate(() => window.catalogEntries.length);
        await (link === "cta"
          ? page.getByRole("link", { name: "Explorar el catálogo", exact: true })
          : nav.getByRole("link", { name: "Catálogo", exact: true })).click();
        await page.waitForURL("**/catalogo");
        await page.waitForTimeout(450);
        const entries = await page.evaluate(() => window.catalogEntries);
        assert.equal(entries.length, before + 1, "Each catalog navigation animates its committed content once");
        const entry = entries.at(-1);
        assert.ok(entry.gridReady);
        assert.ok(entry.samples.some(s => s.time < 100 && Number(s.opacity) < 0.3));
        assert.ok(entry.samples.some(s => s.time > 100 && s.time < 240 && Number(s.opacity) > 0.1 && Number(s.opacity) < 0.95));
        assert.equal(entry.samples.at(-1).opacity, "1");
        assert.ok(entry.samples.every(s => s.transform === "none" && s.headerTop === 0));
        report.push({ width, link, ...entry });
        await page.screenshot({ path: `${out}/catalog-${width}-${link}.png` });
        await nav.getByRole("link", { name: "Inicio", exact: true }).click();
        await page.waitForURL(base + "/");
        await page.waitForTimeout(450);
      }
      const before = await page.evaluate(() => window.catalogEntries.length);
      await nav.getByRole("link", { name: "Catálogo", exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.waitForURL("**/catalogo");
      await page.waitForTimeout(350);
      assert.equal(await page.evaluate(() => window.catalogEntries.length), before);
      await nav.getByRole("link", { name: "Inicio", exact: true }).click();
      await page.waitForURL(base + "/");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await nav.getByRole("link", { name: "Catálogo", exact: true }).click();
      await page.waitForURL("**/catalogo");
      await page.waitForTimeout(350);
      assert.equal(await page.evaluate(() => window.catalogEntries.length), before);
      assert.deepEqual(errors, []);
      await context.close();
      await page.video().saveAs(`${out}/navigation-${width}.webm`);
    }
    fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
    console.log(`Passed ${report.length} catalog entrances, keyboard and reduced motion.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
