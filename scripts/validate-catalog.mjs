#!/usr/bin/env node
/**
 * Validates data/approved/catalog.json without starting Medusa.
 * Usage: node scripts/validate-catalog.mjs
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateCatalog } from "../packages/catalog-schema/src/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(await readFile(resolve(root, "data/approved/catalog.json"), "utf8"));
const { ok, errors, catalog } = validateCatalog(raw);

if (!ok) {
  console.error("approved catalog is invalid:");
  for (const error of errors) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

console.log(
  `approved catalog ok: ${catalog.products.length} products, ${catalog.categories.length} categories`
);
