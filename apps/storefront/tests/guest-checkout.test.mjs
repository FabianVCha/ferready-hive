import test from 'node:test';
import assert from 'node:assert/strict';
import { createSnapshot, deliveryEstimate, emptyDelivery, validateDelivery } from '../lib/guest-checkout.ts';

const delivery = { ...emptyDelivery, fullName: 'Laura Pérez Ñáñez', email: 'laura@example.com', phone: '+57 (300) 000-0000', address: 'Calle de prueba 123', city: 'Chía' };
test('guest delivery validates necessary fields, accents and flexible telephone', () => {
  assert.deepEqual(validateDelivery(delivery), {});
  assert.equal(Object.keys(validateDelivery(emptyDelivery)).length, 4);
  assert.ok(validateDelivery({ ...delivery, email: 'bad' }).email);
  assert.ok(validateDelivery({ ...delivery, phone: 'abc123456789' }).phone);
  assert.ok(validateDelivery({ ...delivery, city: 'Otro municipio' }).municipality);
  assert.ok(validateDelivery({ ...delivery, fullName: 'x'.repeat(121) }).fullName);
  assert.ok(validateDelivery({ ...delivery, address: 'line\nline' }).address);
});
test('snapshot trusts catalog prices, copies data and leaves the cart untouched', () => {
  const cart = [{ slug: 'test', quantity: 2 }];
  const order = createSnapshot(cart, [{ slug: 'test', name: 'Taladro', price: 10000 }], delivery, 'DEMO-test', '2026-11-17T12:00:00Z');
  assert.equal(order.total, 38000);
  assert.equal(order.items[0].subtotal, 20000);
  assert.notEqual(order.delivery, delivery);
  assert.deepEqual(cart, [{ slug: 'test', quantity: 2 }]);
  assert.throws(() => createSnapshot([], [], delivery, 'DEMO-test', '2026-11-17T12:00:00Z'));
  assert.throws(() => createSnapshot([{ slug: 'test', quantity: 21 }], [{ slug: 'test', name: 'Taladro', price: 10000 }], delivery, 'DEMO-test', '2026-11-17T12:00:00Z'));
});
test('unknown coverage is not a free or fabricated delivery quote', () => {
  assert.equal(deliveryEstimate('Bogotá').amount, 12000);
  assert.equal(deliveryEstimate('Soacha').amount, 18000);
  assert.equal(deliveryEstimate('Chía').amount, 18000);
  assert.equal(deliveryEstimate('Otro municipio').amount, null);
});
