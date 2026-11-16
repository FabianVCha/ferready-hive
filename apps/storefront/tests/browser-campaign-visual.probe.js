// Targeted recheck of the three finish-review findings; no shopping state writes.
async (page) => {
  const context = await page.context().browser().newContext();
  const probe = await context.newPage();
  const results = [];
  const check = (condition, message) => { if (!condition) throw new Error(message); results.push(message); };
  try {
    for (const [name, width, height] of [["desktop", 1440, 1000], ["tablet", 768, 1024], ["mobile", 390, 844]]) {
      await probe.setViewportSize({ width, height });
      await probe.goto("http://127.0.0.1:8002/", { waitUntil: "networkidle" });
      for (const section of await probe.locator("[data-campaign-reveal]").all()) {
        await section.scrollIntoViewIfNeeded();
        await probe.waitForFunction((element) => Array.from(element.children).every((child) => Number(getComputedStyle(child).opacity) > 0.99), await section.elementHandle());
      }
      const image = await probe.locator(".study-visual .product-figure").boundingBox();
      const label = await probe.locator(".study-fact").boundingBox();
      check(image.y + image.height <= label.y, `${name}: specification label has its own unobscured area`);
      await probe.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await probe.waitForFunction(() => scrollY === 0 && Array.from(document.querySelectorAll(".campaign-copy > *, .campaign-buy > *")).every((el) => Number(getComputedStyle(el).opacity) > 0.99));
      const lines = await probe.locator("h1").evaluate((el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
      check(lines <= 2.1, `${name}: campaign headline fits in two lines`);
      await probe.screenshot({ path: `.impeccable/review/${name}.png`, fullPage: true });
    }
    await probe.setViewportSize({ width: 1440, height: 1000 });
    await probe.goto("http://127.0.0.1:8002/p/taladro-bauker-12v", { waitUntil: "networkidle" });
    await probe.getByRole("link", { name: "Tu proyecto", exact: true }).click();
    await probe.waitForFunction(() => document.querySelector(".product-journey")?.getAttribute("data-phase") === "1");
    const panel = probe.locator("[data-journey-chapter][aria-hidden='false']");
    check(await panel.evaluate((el) => getComputedStyle(el).opacity === "1"), "Active details are fully readable immediately after the chapter changes");
    await probe.screenshot({ path: ".impeccable/review/product-details-intermediate.png" });
    await probe.waitForFunction(() => {
      const box = document.querySelector("[data-journey-chapter][aria-hidden='false']");
      return box && ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(box).transform);
    });
    check(await panel.evaluate((el) => getComputedStyle(el).opacity === "1"), "Settled product details retain full contrast");
    await probe.screenshot({ path: ".impeccable/review/product-details-desktop.png" });
    return results;
  } finally { await context.close(); }
}
