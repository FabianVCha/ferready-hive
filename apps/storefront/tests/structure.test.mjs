import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { productPath } from "@hive-web/catalog-schema";

const appDir = fileURLToPath(new URL("../app", import.meta.url));

test("canonical product path is derived from the handle only", () => {
  assert.equal(productPath("referencia-de-ejemplo"), "/p/referencia-de-ejemplo");
});

test("the product route has a single dynamic segment", async () => {
  const entries = await readdir(`${appDir}/p`);
  assert.deepEqual(entries, ["[slug]"]);
  const routeFiles = await readdir(`${appDir}/p/[slug]`);
  assert.deepEqual(routeFiles, ["page.tsx"], "no variant route may exist under the product route");
});

test("category routes are a single dynamic segment too", async () => {
  const entries = await readdir(`${appDir}/c`);
  assert.deepEqual(entries, ["[handle]"]);
});
