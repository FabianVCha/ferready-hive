import test from 'node:test';
import assert from 'node:assert/strict';
import { storefront } from '../data/storefront.mjs';
import { projectConfig } from '../data/project-config.mjs';
import { campaign, productStory, kitPackingState } from '../lib/campaign.mjs';
import { objectiveItems, selectionResult } from '../lib/objectives.mjs';
import { restoreCart, cartTotal } from '../lib/prototype.mjs';
import { createSnapshot, emptyDelivery, receiptLines, simulatePayment } from '../lib/guest-checkout.ts';
import { createPaymentProvider } from '../lib/payment-provider.ts';
import { brandLogo, brandIcon } from '../lib/storefront-brand.mjs';
import { readFileSync } from 'node:fs';

test('Ferready identity preserves the generic catalog and consistent routes', () => {
  assert.equal(storefront.brandName, 'Ferready');
  assert.doesNotMatch(JSON.stringify(storefront.products), /bauker|taladro|herramienta|homecenter|bosch|ferreter/i);
  assert.equal(storefront.products.length, 3);
  assert.equal(new Set(storefront.products.map(product => product.slug)).size, 3);
  for (const product of storefront.products) {
    assert(storefront.categories.some(category => category.slug === product.categorySlug));
    assert.equal(product.image, storefront.placeholder);
    assert(product.price > 0);
    const story = productStory(product);
    assert.equal(story.image, storefront.placeholder);
    assert.doesNotMatch(JSON.stringify(story), /ferready|taladro|bauker/i);
  }
  assert.equal(campaign.brand.name, storefront.brandName);
  assert.equal(productStory(storefront.products[0]).contents.length, 3);
  for (const value of Object.values(storefront.tokens)) assert.match(value, /^#[a-f0-9]{6}$/i);
  assert.equal(storefront.tokens.accent, '#E4261E');
  assert.equal(storefront.tokens.navy, '#1D3659');
  assert.equal(storefront.tokens.ink, '#12161B');
  assert.equal(storefront.tokens.steel, '#4F7399');
  assert.equal(storefront.tokens.paper, '#F5F2EC');
});

test('template objectives and cart work with the same generic catalog', () => {
  for (const objective of storefront.objectives) {
    const items = objectiveItems(objective, storefront.products);
    assert.equal(items.length, 2);
    const result = selectionResult([], items, storefront.products);
    assert(result.added > 0);
    assert.deepEqual(restoreCart(JSON.stringify(result.cart), storefront.products), result.cart);
    assert(cartTotal(result.cart, storefront.products) > 0);
  }
  assert(Math.abs(kitPackingState(1).close - 1) < 1e-12);
});

test('template paid receipt uses configured name and preserves demo safety', () => {
  const delivery = { ...emptyDelivery, fullName: 'Cliente de prueba', email: 'test@example.com', phone: '3000000000', address: 'Dirección de ejemplo' };
  const order = createSnapshot([{ slug: storefront.products[0].slug, quantity: 1 }], storefront.products, delivery, 'DEMO-template', '2026-11-17T12:00:00Z');
  assert.throws(() => receiptLines(order));
  const text = receiptLines(simulatePayment(order)).join('\n');
  assert(text.includes(storefront.brandName));
  assert(text.includes(storefront.products[0].name));
  assert.match(text, /SIN COBRO REAL/);
  assert.doesNotMatch(text, /taladro|bauker/i);
});

test('project configuration owns project identity and provider selection', () => {
  assert.equal(projectConfig.projectId, 'ferready-hive');
  assert.equal(projectConfig.paymentProvider, 'demo');
  assert.equal(projectConfig.storefront, storefront);
});

test('optional brand assets retain neutral template compatibility', () => {
  assert.equal(brandLogo({ brandName: 'Tu tienda' }), null);
  assert.equal(brandIcon({}), '/template/product-placeholder.svg');
  assert.equal(brandLogo({ logo: storefront.logo }, true), storefront.logo);
  assert.equal(brandLogo(storefront), storefront.logo);
  assert.equal(brandLogo(storefront, true), storefront.logoDark);
  assert.equal(brandIcon(storefront), storefront.icon);
  assert.equal(storefront.mark.src, '/project/ferready-isotipo-claro.svg');
  assert.equal(storefront.mark.width, 207);
  assert.equal(storefront.mark.height, 241);
  for (const name of ['logotipo-claro', 'logotipo-oscuro', 'isotipo-claro', 'isotipo-oscuro']) {
    const svg = readFileSync(new URL(`../public/project/ferready-${name}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /<svg/);
    assert.match(svg, /#E4261E/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\bonload=/i);
  }
});

test('illustrative parcel uses optional configured identity inside its moving front panel', () => {
  const journey = readFileSync(new URL('../components/ferready/product-journey.tsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../app/template.css', import.meta.url), 'utf8');
  assert.match(journey, /const parcelLogo = brandLogo\(storefront\)/);
  assert.match(journey, /className="parcel-front">[\s\S]*?parcelLogo \? <img className="parcel-brand-logo" src=\{parcelLogo.src\}/);
  assert.match(journey, /height=\{parcelLogo.height\} alt="" \/> : <strong>\{storefront.brandName\}<\/strong>/);
  assert.match(journey, /Empaque ilustrativo/);
  assert.doesNotMatch(journey, /\/project\/|ferready-logotipo|TRUPER/);
  assert.match(css, /\.parcel-front:has\(\.parcel-brand-logo\)[\s\S]*?var\(--paper\)[\s\S]*?var\(--red\)/);
  assert.match(css, /\.parcel-front \.parcel-brand-logo[\s\S]*?object-fit: contain/);
  assert.equal(brandLogo({ brandName: 'Another store' }), null);
  const custom = { src: '/another-store.svg', width: 200, height: 80 };
  assert.equal(brandLogo({ logo: custom }), custom);
  assert.match(journey, /className="parcel-seal" data-dark=\{Boolean\(storefront.logoDark\)\}/);
  assert.match(journey, /src=\{tapeLogo.src\}/);
  assert.match(journey, /parcelLogo && storefront.mark && <img className="parcel-brand-mark" src=\{storefront.mark.src\}/);
  assert.match(css, /clip-path: polygon\(48% 0, 66% 0, 51% 100%, 33% 100%\)/);
});

test('demo payment provider preserves the existing simulated payment contract', async () => {
  const delivery = { ...emptyDelivery, fullName: 'Cliente de prueba', email: 'test@example.com', phone: '3000000000', address: 'Dirección de ejemplo' };
  const order = createSnapshot([{ slug: storefront.products[0].slug, quantity: 1 }], storefront.products, delivery, 'DEMO-provider', '2026-11-17T12:00:00Z');
  const result = await createPaymentProvider('demo').createPayment(order);
  assert.equal(result.provider, 'demo');
  assert.equal(result.status, 'paid');
  assert.equal(result.reference, order.reference);
  assert.equal(result.order.paymentStatus, 'simulated-paid');
});
