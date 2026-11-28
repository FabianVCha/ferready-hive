const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../../data/project/first15-truper.json")));
const base = process.env.STOREFRONT_URL || "http://localhost:8000";
const capture = process.env.STOREFRONT_PROBE_CAPTURE;

async function verifyProductPanels(page, product, width) {
  const spotlight = page.locator(".product-spotlight");
  const spotlightButtons = spotlight.getByRole("button");
  assert.deepEqual(await spotlightButtons.allTextContents(), [`Código${product.reference}`, `Modelo${product.model}`]);
  await spotlightButtons.nth(1).click();
  await spotlight.getByRole("button", { name: /Modelo/, pressed: true }).waitFor();
  assert.match(await spotlight.locator(".spotlight-reading").innerText(), /^Modelo\./);

  const explorer = page.locator(".product-explorer");
  await page.getByRole("link", { name: "Ver ficha técnica" }).click();
  await explorer.getByRole("button", { name: "Los detalles", expanded: true }).waitFor();
  const specifications = explorer.locator("#explorer-specs");
  await specifications.waitFor();
  assert.deepEqual(await specifications.locator("dt").allTextContents(), ["Código", "Modelo", "Incluye"]);
  assert.deepEqual(await specifications.locator("dd").allTextContents(), [product.reference, product.model, product.specifications.Incluye]);
  if (capture && product.handle === "104412-a12-rot-1") {
    await explorer.screenshot({ path: path.join(capture, `especificaciones-${width}.png`) });
  }

  for (const [id, label, copy] of [
    ["contents", "Dentro de la caja", product.specifications.Incluye],
    ["care", "Después de elegir", "garantías comerciales por confirmar"],
    ["project", "¿Es para mí?", product.description],
  ]) {
    await explorer.getByRole("button", { name: label }).click();
    const panel = explorer.locator(`#explorer-${id}`);
    await panel.waitFor();
    assert.equal(await explorer.locator("article:visible").count(), 1);
    assert.ok((await panel.innerText()).includes(copy), `${product.handle}: ${label}`);
  }
  assert.equal(await explorer.locator("#explorer-care a").getAttribute("href"), product.source_url);
}

async function verifyPhases(page, activate) {
  const phases = page.locator(".journey-stops a");
  for (const phase of [1, 2, 3, 0]) {
    await activate(phases.nth(phase));
    await page.waitForFunction(expected => document.querySelector(".product-journey")?.dataset.phase === String(expected), phase);
    assert.equal(await phases.nth(phase).getAttribute("aria-current"), "step");
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() !== "error") return;
    if (message.text().includes("503") && message.location().url.endsWith("/api/selection-cart")) return;
    errors.push(message.text());
  });
  page.on("response", response => {
    if (response.status() === 503 && response.url() === `${base}/api/selection-cart`) return;
    if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`);
  });
  try {
    if (capture) fs.mkdirSync(capture, { recursive: true });
    for (const product of catalog.products) {
      for (const view of product.gallery) {
        const response = await page.request.get(`${base}${view.src}`);
        assert.equal(response.status(), 200, view.src);
      }
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".client-showroom-tools button").count(), 3);
      assert.ok(!(await page.locator("body").innerText()).includes("Bauker"));
      await page.goto(`${base}/catalogo`, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".catalog-products > *").count(), 14);
      assert.equal(await page.getByRole("region", { name: "Por confirmar" }).getByRole("heading", { name: "Manguera para lavamanos" }).count(), 1);
      assert.match(await page.locator(".catalog-toolbar").innerText(), /14 productos confirmados.*1 pendiente/);
      assert.equal(await page.getByRole("region", { name: "Por confirmar" }).getByRole("link").count(), 0);
      for (const product of catalog.products) {
        const response = await page.goto(`${base}/p/${product.handle}`, { waitUntil: "networkidle" });
        assert.equal(response.status(), 200, product.handle);
        assert.ok((await page.locator("body").innerText()).includes(product.title));
        assert.equal(await page.locator(".journey-stops a").count(), 4);
        assert.ok((await page.locator(".journey-contents").textContent()).includes(product.specifications.Incluye.split("; ")[0]), `${product.handle}: source contents`);
        await verifyProductPanels(page, product, width);
        await verifyPhases(page, phase => phase.click());
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${product.handle} overflow at ${width}`);
        assert.equal(await page.locator('img').evaluateAll(images => images.filter(img => img.complete && img.naturalWidth === 0).length), 0);
      }
    }
    const drill = `${base}/p/104412-a12-rot-1`;
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(drill, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".spotlight-choices button").first().evaluate(button => getComputedStyle(button).transitionDuration), "0s");
    assert.equal(await page.locator(".product-journey.is-enhanced").count(), 0);
    const model = page.getByRole("button", { name: /Modelo/ });
    await model.press("Space");
    await page.getByRole("button", { name: /Modelo/, pressed: true }).waitFor();
    const contents = page.getByRole("button", { name: "Dentro de la caja" });
    await contents.press("Enter");
    await page.locator("#explorer-contents").waitFor();
    await verifyPhases(page, phase => phase.press("Enter"));

    const touch = await browser.newPage({ viewport: { width: 320, height: 667 }, hasTouch: true, isMobile: true });
    await touch.goto(drill, { waitUntil: "networkidle" });
    await touch.getByRole("button", { name: /Modelo/ }).tap();
    await touch.getByRole("button", { name: /Modelo/, pressed: true }).waitFor();
    await touch.getByRole("link", { name: "Ver ficha técnica" }).tap();
    await touch.locator("#explorer-specs").waitFor();
    await touch.waitForFunction(() => {
      const heading = document.querySelector("#explorer-title");
      const { right, top, height } = heading.getBoundingClientRect();
      return heading.contains(document.elementFromPoint(right - 20, top + height / 2));
    });
    await touch.getByRole("button", { name: "Dentro de la caja" }).tap();
    await touch.locator("#explorer-contents").waitFor();
    await verifyPhases(touch, phase => phase.tap());

    assert.deepEqual(errors, []);
    console.log("PASS: 14 routes × 3 widths, 53 assets, 15 catalog slots, exact interactive panels and reversible phases; keyboard, reduced motion and emulated touch over LAN.");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
