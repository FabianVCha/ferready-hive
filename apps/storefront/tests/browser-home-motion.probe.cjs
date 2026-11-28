const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const base = process.env.STOREFRONT_URL || "http://localhost:8000";
const out = process.env.BROWSER_EVIDENCE_DIR || "/tmp/opencode/ferready-home-motion";
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ reducedMotion: "no-preference" });
  const errors = [], views = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base, { waitUntil: "networkidle" });
      const scene = page.locator(".client-showroom");
      const tools = page.locator(".client-showroom-tools button");
      await scene.scrollIntoViewIfNeeded();
      await page.mouse.move(1, 1);
      await page.waitForFunction(() => document.querySelector(".client-showroom").dataset.idle === "running");
      const before = await tools.evaluateAll(elements => elements.findIndex(element => element.getAttribute("aria-pressed") === "true"));
      const sway = await tools.first().locator(".hero-object-sway").evaluate(async element => {
        const samples = [];
        for (let frame = 0; frame < 20; frame++) {
          await new Promise(requestAnimationFrame);
          samples.push(getComputedStyle(element).transform);
        }
        return samples;
      });
      assert.ok(new Set(sway).size > 10, `Real sway frames at ${width}`);
      await scene.screenshot({ path: `${out}/before-${width}.png` });
      // Observe the real ten-second cadence, not a mocked timer or final class.
      await page.waitForTimeout(10_200);
      const after = await tools.evaluateAll(elements => elements.findIndex(element => element.getAttribute("aria-pressed") === "true"));
      assert.equal(after, (before + 1) % 3, `Automatic selection at ${width}`);
      await page.waitForTimeout(400);
      await scene.screenshot({ path: `${out}/after-${width}.png` });
      assert.equal(await page.locator(".client-showroom-caption").getAttribute("aria-live"), "off");

      await page.evaluate(() => {
        window.homeMotionFrames = [];
        let frame = 0;
        function sample() {
          const elements = [...document.querySelectorAll(".client-showroom-tools button")];
          window.homeMotionFrames.push(elements.map(element => getComputedStyle(element).transform));
          if (++frame < 40) requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      await tools.nth((after + 1) % 3).click();
      await page.waitForTimeout(750);
      const frames = await page.evaluate(() => window.homeMotionFrames);
      assert.ok(new Set(frames.map(frame => frame.join("|"))).size > 5, `Pointer transition frames at ${width}`);
      assert.equal(await page.locator(".client-showroom-caption").getAttribute("aria-live"), "polite");
      assert.equal(await scene.getAttribute("data-idle"), "paused", "Mouse hover pauses the cycle");
      await page.mouse.move(1, 1);

      const toggle = page.locator(".showroom-motion-toggle");
      await toggle.click();
      await page.mouse.move(1, 1);
      assert.equal(await toggle.getAttribute("aria-pressed"), "true");
      assert.equal(await scene.getAttribute("data-idle"), "paused");
      assert.equal(await tools.first().locator(".hero-object-sway").evaluate(element => getComputedStyle(element).animationPlayState), "paused");
      if (width === 1440) {
        const selected = await tools.evaluateAll(elements => elements.map(element => element.getAttribute("aria-pressed")));
        await page.waitForTimeout(10_200);
        assert.deepEqual(await tools.evaluateAll(elements => elements.map(element => element.getAttribute("aria-pressed"))), selected);
      }
      await toggle.click();
      await page.mouse.move(1, 1);
      await tools.first().focus();
      await page.keyboard.press("Enter");
      assert.equal(await scene.getAttribute("data-motion"), "keyboard");
      assert.equal(await scene.getAttribute("data-idle"), "paused");
      assert.equal(await tools.first().evaluate(element => getComputedStyle(element).transitionDuration), "0s");
      await page.evaluate(() => document.activeElement.blur());
      await page.locator(".fr-footer").scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector(".client-showroom").dataset.idle === "paused");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      views.push({ width, before, after, swayFrames: new Set(sway).size, pointerFrames: new Set(frames.map(frame => frame.join("|"))).size });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator(".client-showroom").scrollIntoViewIfNeeded();
    await page.mouse.move(1, 1);
    assert.equal(await page.locator(".client-showroom").getAttribute("data-idle"), "paused");
    assert.equal(await page.locator(".hero-object-sway").first().evaluate(element => getComputedStyle(element).animationName), "none");
    await page.waitForTimeout(10_200);
    assert.equal(await page.locator(".client-showroom-tools button").first().getAttribute("aria-pressed"), "true");
    await page.locator(".client-showroom-tools button").nth(2).click();
    assert.equal(await page.locator(".client-showroom-tools button").nth(2).getAttribute("aria-pressed"), "true");
    assert.deepEqual(errors, []);
    fs.writeFileSync(`${out}/results.json`, JSON.stringify({ views, reducedMotion: true, errors }, null, 2));
    console.log(JSON.stringify({ views, reducedMotion: true, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
