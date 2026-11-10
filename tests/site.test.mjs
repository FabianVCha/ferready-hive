import { test } from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(resolve(root, path), "utf8");

test("index.html starts with a doctype and declares a language", async () => {
  const html = await read("index.html");
  assert.match(html.trimStart(), /^<!DOCTYPE html>/i);
  assert.match(html, /<html[^>]*\slang="[a-z]{2,}(-[A-Za-z0-9]+)*"/);
});

test("index.html has a non-empty title and exactly one h1", async () => {
  const html = await read("index.html");
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  assert.ok(title, "missing <title>");
  assert.ok(title[1].trim().length > 0, "title must not be empty");
  const headings = html.match(/<h1[\s>]/gi) ?? [];
  assert.equal(headings.length, 1, "expected exactly one <h1>");
});

test("every local asset referenced by index.html exists", async () => {
  const html = await read("index.html");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/gi)].map((match) => match[1]);
  const localRefs = refs.filter((ref) => !/^(?:https?:|mailto:|#)/i.test(ref));
  assert.ok(localRefs.length > 0, "expected at least one local asset reference");
  for (const ref of localRefs) {
    await access(resolve(root, ref));
  }
});

test("tracked site files do not contain merge conflict markers", async () => {
  for (const file of ["index.html", "assets/styles.css", "assets/app.js"]) {
    const text = await read(file);
    assert.ok(!/^(<{7}|={7}|>{7})/m.test(text), `${file} contains conflict markers`);
  }
});
