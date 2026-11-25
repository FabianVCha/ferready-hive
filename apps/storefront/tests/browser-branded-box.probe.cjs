const { chromium } = require('/home/fabianvcha/playwright-login/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const { storefront } = await import('../data/storefront.mjs');
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const reduced of [false, true]) for (const [width, height] of [[1440, 900], [390, 844], [320, 740]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:8000/p/103068-tal-1-2n2', { waitUntil: 'networkidle' });
      const tabs = page.locator('.journey-stops a');
      await tabs.nth(3).click();
      if (!reduced) {
        await page.waitForTimeout(100);
        await page.screenshot({ path: `/tmp/opencode/ferready-branded-box-${width}-open.png` });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `/tmp/opencode/ferready-branded-box-${width}-packing.png` });
      }
      await page.waitForTimeout(1600);
      assert.equal(await page.locator('.parcel-flap .parcel-seal').count(), 2);
      assert.equal(await page.locator('.parcel-brand-mark').getAttribute('src'), storefront.mark.src);
      for (const image of await page.locator('.parcel-seal img, .parcel-brand-mark').all()) {
        assert(await image.evaluate(img => img.complete && img.naturalWidth > 0));
      }
      const tape = await page.locator('.parcel-seal').first().evaluate(el => ({
        clipped: getComputedStyle(el).clipPath !== 'none',
        attached: el.parentElement.classList.contains('parcel-flap'),
      }));
      assert(tape.clipped && tape.attached);
      const logo = page.locator('.parcel-front .parcel-brand-logo');
      assert.equal(await logo.getAttribute('src'), storefront.logo.src);
      assert.equal(await logo.getAttribute('alt'), '');
      await logo.waitFor({ state: 'visible' });
      assert(await logo.evaluate(img => img.complete && img.naturalWidth > 0));
      const bounds = await logo.evaluate(img => {
        const logo = img.getBoundingClientRect(), panel = img.parentElement.getBoundingClientRect();
        return { fits: logo.left >= panel.left && logo.right <= panel.right && logo.top >= panel.top && logo.bottom <= panel.bottom, width: logo.width, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert(bounds.fits && bounds.width > 60 && !bounds.overflow, JSON.stringify(bounds));
      if (!reduced) await page.screenshot({ path: `/tmp/opencode/ferready-branded-box-${width}.png` });
      else await page.screenshot({ path: `/tmp/opencode/ferready-branded-box-${width}-reduced.png` });
      const root = page.locator('.product-journey');
      assert.equal(await root.getAttribute('data-packed'), 'true');
      await tabs.nth(2).click();
      await page.waitForTimeout(450);
      await tabs.nth(3).click();
      await page.waitForTimeout(1600);
      assert.equal(await root.getAttribute('data-packed'), 'true');
      // Re-enter through the public chapter navigation using keyboard input.
      // The incumbent replay button is hidden by the scene's CSS.
      await tabs.nth(2).focus();
      await page.keyboard.press('Enter');
      await tabs.nth(3).focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(450);
      assert.equal(await root.getAttribute('data-packed'), 'true');
      assert.equal(await logo.getAttribute('src'), storefront.logo.src);
      assert.deepEqual(errors, []);
      console.log({ width, reduced, bounds });
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
