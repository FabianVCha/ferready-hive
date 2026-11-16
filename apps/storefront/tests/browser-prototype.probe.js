// Run with the host Playwright browser code tool; no added test dependency.
async (page) => {
  const origin = "http://127.0.0.1:8001";
  const results = [];
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
    results.push(message);
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin);
  await page.evaluate(() => localStorage.removeItem("ferready-demo-cart-v1"));
  await page.reload();
  await page
    .getByRole("searchbox", { name: "Buscar productos" })
    .fill("manguera");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page.waitForURL("**/catalogo?q=manguera");
  await page
    .getByRole("heading", { level: 3 })
    .first()
    .getByRole("link")
    .click();
  await page.waitForURL("**/p/manguera-flexible-50cm");
  check(
    (await page.locator("h1").innerText()).includes("Manguera"),
    "Direct search reaches hose without guided steps",
  );
  await page
    .getByRole("button", { name: "Aumentar cantidad", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Añadir al carrito", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("ferready-demo-cart-v1") || "[]")[0]
        ?.quantity === 2,
  );
  await page.goto(`${origin}/carrito`);
  await page
    .getByRole("heading", { name: "Manguera flexible para lavamanos · 50 cm" })
    .waitFor();
  check(
    (await page.locator(".summary-total").innerText()).includes("49.800"),
    "Two hoses and Bogotá delivery total COP 49,800 after reload",
  );
  await page
    .getByRole("button", { name: /Aumentar cantidad de Manguera/ })
    .click();
  check(
    (await page.locator(".summary-total").innerText()).includes("68.700"),
    "Cart quantity change recalculates total",
  );
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page
    .getByRole("heading", { name: "Tu caja de herramientas empieza aquí." })
    .waitFor();
  check(
    (await page.locator(".cart-item").count()) === 0,
    "Removing an item exposes the empty cart",
  );
  await page.goto(`${origin}/p/taladro-bauker-12v`);
  await page.getByRole("button", { name: "Ver imagen 2", exact: true }).click();
  check(
    (await page.locator(".gallery-main img").getAttribute("src")).includes(
      "_01",
    ),
    "Standalone product image gallery works",
  );
  await page
    .getByRole("button", { name: "Aumentar cantidad", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Comprar ahora", exact: true })
    .click();
  await page.waitForURL("**/checkout");
  await page.getByLabel("Zona de entrega").selectOption("Chía");
  check(
    (await page.locator(".summary-total").innerText()).includes("337.800"),
    "Standalone purchase includes selected units and recalculates Chía shipping",
  );
  const posts = [];
  const onRequest = (request) => {
    if (request.method() !== "GET") posts.push(request.url());
  };
  page.on("request", onRequest);
  await page
    .getByRole("button", { name: "Finalizar simulación", exact: true })
    .click();
  await page.getByRole("heading", { name: /Así de fácil/ }).waitFor();
  await page.waitForFunction(
    () => localStorage.getItem("ferready-demo-cart-v1") === "[]",
  );
  page.off("request", onRequest);
  check(
    posts.length === 0,
    "Simulated checkout makes no submission and clears the cart",
  );
  const missing = await page.goto(`${origin}/p/no-existe`);
  check(missing.status() === 404, "Unknown product returns HTTP 404");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/catalogo`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.images) image.loading = "eager";
      await Promise.all(
        Array.from(document.images).map((i) => i.decode().catch(() => {})),
      );
    });
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      broken: Array.from(document.images)
        .filter((i) => !i.naturalWidth)
        .map((i) => i.src),
    }));
    check(
      !metrics.overflow,
      `Catalog has no horizontal overflow at ${width}px`,
    );
    check(
      metrics.broken.length === 0,
      `Every catalog image loads at ${width}px`,
    );
    if (width === 390) {
      await page.getByRole("button", { name: "Filtrar", exact: true }).click();
      await page.getByRole("button", { name: /Plomería y hogar/ }).click();
      check(
        (await page.locator(".product-card").count()) === 2,
        "Mobile category filter works without orientation steps",
      );
      await page.getByRole("button", { name: "Abrir menú" }).click();
      check(
        await page.locator(".category-nav").isVisible(),
        "Mobile menu exposes direct category navigation",
      );
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(origin);
  check(
    await page.locator("h1").isVisible(),
    "Reduced motion preserves the primary content",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  return { status: "passed", checks: results };
};
