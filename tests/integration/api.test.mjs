import { after, before, test } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.MEDUSA_TEST_URL ?? "http://127.0.0.1:9001";
const KEY = process.env.PUBLISHABLE_KEY ?? "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

let adminToken = "";

async function api(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, init);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

before(async () => {
  const login = await api("/auth/user/emailpass", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.equal(login.status, 200, `admin login failed: ${JSON.stringify(login.body)}`);
  adminToken = login.body.token;
  assert.ok(adminToken, "admin login returned no token");
});

test("health endpoint is up", async () => {
  const { status } = await api("/health");
  assert.equal(status, 200);
});

test("admin API rejects anonymous requests", async () => {
  const { status } = await api("/admin/products");
  assert.equal(status, 401);
});

test("admin API accepts an authenticated session", async () => {
  const { status, body } = await api("/admin/products?limit=50", {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(status, 200);
  const handles = (body.products ?? []).map((product) => product.handle);
  assert.ok(handles.includes("fixture-draft"), "draft fixture should be visible to admin");
});

test("public registration creates an identity but no admin access", async () => {
  const email = `intruder-${Date.now()}@example.test`;
  const password = "not-allowed-123";

  const register = await api("/auth/user/emailpass/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(register.status, 200, "register route is exposed by the auth module");

  const login = await api("/auth/user/emailpass", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200, "the identity can authenticate");

  const admin = await api("/admin/products", {
    headers: { authorization: `Bearer ${login.body.token}` },
  });
  assert.notEqual(admin.status, 200, "a self-registered identity must not reach the admin API");
});

test("draft products are invisible through the Store API", async () => {
  const { status, body } = await api("/store/products?handle=fixture-draft", {
    headers: { "x-publishable-api-key": KEY },
  });
  assert.equal(status, 200);
  assert.equal(body.count, 0);
  assert.deepEqual(body.products, []);
});

test("published products are reachable through the Store API", async () => {
  const { status, body } = await api("/store/products?handle=fixture-published", {
    headers: { "x-publishable-api-key": KEY },
  });
  assert.equal(status, 200);
  assert.equal(body.count, 1);
  assert.equal(body.products[0].handle, "fixture-published");
});

test("Store API rejects requests without a publishable key", async () => {
  const { status } = await api("/store/products");
  assert.notEqual(status, 200);
});

after(() => {
  // Nothing to tear down: fixtures live only in the isolated test database.
});
