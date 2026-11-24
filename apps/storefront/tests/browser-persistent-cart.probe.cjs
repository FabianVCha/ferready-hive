const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/home/fabianvcha/playwright-login/node_modules/playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const catalog = require("../../../data/approved/catalog.json");
const origin = process.env.CATALOG_TEST_ORIGIN || "http://localhost:8000";
const out = process.env.BROWSER_EVIDENCE_DIR || "/tmp/opencode/ferready-persistent-cart";
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  let checks = 0;
  try {
    for (const width of [1692, 1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const first = catalog.products[0], second = catalog.products[1];
      await page.goto(`${origin}/catalogo`);
      await page.locator(`.product-card h3 a[href="/p/${first.handle}"]`).click();
      const add = page.getByRole("button", { name: "Añadir al carrito", exact: true });
      await add.waitFor();
      await page.waitForFunction(() => ![...document.querySelectorAll("button")].find((b) => b.textContent === "Añadir al carrito")?.disabled);
      await add.click();
      await page.getByRole("link", { name: "Carrito, 1 productos", exact: true }).waitFor();
      checks++;
      await page.getByRole("link", { name: "Carrito, 1 productos", exact: true }).click();
      await page.locator(".cart-item").waitFor();
      await page.getByRole("button", { name: `Aumentar cantidad de ${first.title}`, exact: true }).click();
      await page.getByRole("link", { name: "Carrito, 2 productos", exact: true }).waitFor();
      await page.reload();
      await page.getByRole("link", { name: "Carrito, 2 productos", exact: true }).waitFor();
      const quantity = page.getByRole("spinbutton", { name: `Cantidad de ${first.title}`, exact: true });
      assert.equal(await quantity.inputValue(), "2");
      await quantity.fill("");
      await quantity.press("Tab");
      assert.equal(await quantity.inputValue(), "2");
      await quantity.fill("0");
      await quantity.press("Enter");
      assert.equal(await quantity.inputValue(), "2");
      await quantity.fill("20");
      await quantity.press("Enter");
      await page.getByRole("link", { name: "Carrito, 20 productos", exact: true }).waitFor();
      await page.reload();
      assert.equal(await quantity.inputValue(), "20");
      assert(await page.getByRole("button", { name: `Aumentar cantidad de ${first.title}`, exact: true }).isDisabled());
      await quantity.fill("2");
      await quantity.press("Enter");
      await page.getByRole("link", { name: "Carrito, 2 productos", exact: true }).waitFor();
      assert.match(await page.locator(".cart-guidance").innerText(), /medidas y la compatibilidad/);
      await page.getByRole("link", { name: "Ver resumen", exact: true }).click();
      const thermal = page.getByRole("article", { name: "Resumen térmico de selección", exact: true });
      assert.match(await thermal.innerText(), /Resumen de selección[\s\S]*No es comprobante de pago[\s\S]*Precios por definir/);
      assert.doesNotMatch(await thermal.innerText(), /Ref:|Pago de prueba|Entrega de ejemplo|\$|DEMO/);
      await page.evaluate(() => { window.print = () => { window.__summaryPrinted = true; }; });
      await page.getByRole("button", { name: "Imprimir resumen", exact: true }).click();
      assert(await page.evaluate(() => window.__summaryPrinted));
      await page.emulateMedia({ media: "print" });
      assert.equal(await thermal.evaluate(node => getComputedStyle(node).visibility), "visible");
      assert.equal(await page.locator(".cart-items").evaluate(node => getComputedStyle(node).visibility), "hidden");
      const pdf = `${out}/selection-${width}.pdf`;
      await page.pdf({ path: pdf, format: "A4" });
      const printed = execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
      assert.match(printed, /Resumen de selección[\s\S]*No es comprobante de pago[\s\S]*Precios por definir/);
      assert.doesNotMatch(printed, /Compra aún no disponible|Seguir explorando|Ref:|Pago de prueba|\$/);
      await page.emulateMedia({ media: "screen" });
      checks++;
      assert.match(await page.locator(".order-summary").innerText(), /Total[\s\S]*Por definir/);
      assert.doesNotMatch(await page.locator("main").innerText(), /\$\s*[\d.,]+/);
      assert(await page.getByRole("button", { name: "Compra aún no disponible" }).isDisabled());
      const summaryAction = await page.getByRole("link", { name: "Ver resumen", exact: true }).boundingBox();
      const purchaseAction = await page.getByRole("button", { name: "Compra aún no disponible" }).boundingBox();
      assert(purchaseAction.y - summaryAction.y - summaryAction.height >= 12, `CTA gap ${width}`);
      assert.equal(purchaseAction.x, summaryAction.x, `CTA alignment ${width}`);
      assert.equal(purchaseAction.width, summaryAction.width, `CTA width ${width}`);
      const dismissNotice = page.getByRole("button", { name: "Cerrar aviso", exact: true });
      if (await dismissNotice.count()) await dismissNotice.click();
      await page.screenshot({ path: `/tmp/opencode/ferready-cart-spacing-${width}.png`, fullPage: true });
      assert.equal((await page.goto(`${origin}/checkout`)).status(), 404);
      checks++;
      await page.goto(`${origin}/carrito`);
      await page.locator(".cart-item").waitFor();
      const tab = await context.newPage();
      await tab.goto(`${origin}/p/${second.handle}`);
      await tab.getByRole("button", { name: "Añadir al carrito" }).click();
      await page.getByRole("link", { name: "Carrito, 3 productos", exact: true }).waitFor();
      assert.equal(await page.locator(".cart-item").count(), 2);
      checks++;
      // A separate cookie jar cannot retrieve another guest's selection.
      const guest = await browser.newContext();
      const empty = await guest.request.get(`${origin}/api/selection-cart`);
      assert.deepEqual((await empty.json()).items, []);
      await guest.close();
      const cookie = (await context.cookies()).find((item) => item.name === "ferready-selection");
      assert(cookie?.httpOnly && cookie.sameSite === "Lax");
      assert.equal(await page.evaluate(() => document.cookie.includes("ferready-selection")), false);
      for (const body of [{ slug: first.handle, quantity: -1 }, { slug: first.handle, quantity: 21 },
        { slug: first.handle, quantity: 1.2 }, { slug: "unknown", quantity: 1 },
        { slug: first.handle, quantity: 1, price: 0 }]) {
        const response = await context.request.post(`${origin}/api/selection-cart`, { headers: { origin }, data: body });
        assert([400, 404].includes(response.status()), `${response.status()} ${JSON.stringify(body)}`);
      }
      const csrf = await context.request.post(`${origin}/api/selection-cart`, { headers: { origin: "https://other.invalid" }, data: { slug: first.handle, quantity: 0 } });
      assert.equal(csrf.status(), 403);
      checks++;
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow ${width}`);
      await page.screenshot({ path: `${out}/cart-${width}.png`, fullPage: true });
      await tab.close();
      // A failed mutation must not pretend that the product was added.
      await page.goto(`${origin}/p/${first.handle}`);
      await page.getByRole("link", { name: "Carrito, 3 productos", exact: true }).waitFor();
      await page.route("**/api/selection-cart", (route) => route.request().method() === "POST"
        ? route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Unavailable"}' }) : route.continue());
      await page.getByRole("button", { name: "Añadir al carrito" }).click();
      await page.locator("main [role=alert]").waitFor();
      assert.match(await page.locator("main [role=alert]").innerText(), /No pudimos guardar/);
      assert.equal(await page.getByRole("link", { name: "Carrito, 3 productos", exact: true }).count(), 1);
      await page.unroute("**/api/selection-cart");
      await page.getByRole("button", { name: "Añadir al carrito" }).focus();
      await page.keyboard.press("Enter");
      await page.getByRole("link", { name: "Carrito, 4 productos", exact: true }).waitFor();
      checks++;
      await page.goto(`${origin}/carrito`);
      await page.locator(".cart-item").first().waitFor();
      await page.getByRole("button", { name: "Eliminar", exact: true }).first().click();
      await page.waitForFunction(() => document.querySelectorAll(".cart-item").length === 1);
      await page.getByRole("button", { name: "Eliminar", exact: true }).click();
      await page.getByRole("heading", { name: "Tu carrito empieza aquí." }).waitFor();
      await page.reload();
      await page.getByRole("heading", { name: "Tu carrito empieza aquí." }).waitFor();
      assert.deepEqual(errors, []);
      checks++;
      await context.close();
    }
    fs.writeFileSync(`${out}/proof.json`, JSON.stringify({ checks, widths: [1692, 1440, 390, 320], backend: "Medusa/PostgreSQL", passed: true }, null, 2));
    console.log(`PASS: ${checks} persistent cart browser scenarios, desktop/mobile, real Medusa/PostgreSQL.`);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
