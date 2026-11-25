/**
 * Opt-in integration test against the isolated local ferready_hive database.
 * Runs the actual importer twice, then verifies persisted records and media.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(new URL("../data/approved/catalog.json", import.meta.url), "utf8"));
function sql(query) {
  return execFileSync("docker", ["exec", "hive-web-db", "sh", "-c",
    'exec psql -X -A -t -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d ferready_hive -c "$1"', "sh", query],
  { encoding: "utf8", cwd: root }).trim();
}
assert.equal(sql("select current_database()"), "ferready_hive");
for (let run = 0; run < 2; run++) {
  const output = execFileSync(process.execPath, ["scripts/local-ferready-backend.mjs", "import"], { cwd: root, encoding: "utf8" });
  assert.match(output, /created=0 updated=45 categories=0 drafts_pending_review=45/);
}
const rows = JSON.parse(sql(`select json_agg(row_to_json(t)) from (
  select p.id,p.handle,p.status,p.metadata,p.thumbnail,
    (select json_agg(url order by rank) from image where product_id=p.id and deleted_at is null) as images,
    (select count(*) from product_variant v join product_variant_price_set l on l.variant_id=v.id
      join price pr on pr.price_set_id=l.price_set_id and pr.deleted_at is null
      where v.product_id=p.id and v.deleted_at is null) as prices
  from product p where p.deleted_at is null
) t`));
assert.equal(rows.length, 45);
assert.equal(new Set(rows.map((p) => p.handle)).size, 45);
const audit = JSON.parse(await readFile(new URL("../data/approved/truper-gallery-audit.json", import.meta.url), "utf8"));
for (const expected of catalog.products) {
  const actual = rows.find((p) => p.handle === expected.handle);
  assert(actual, expected.handle);
  assert.equal(actual.status, "draft");
  assert.equal(actual.prices, 0);
  assert.equal(actual.metadata.reference, expected.reference);
  assert.deepEqual(actual.metadata.specifications, expected.specifications);
  assert.deepEqual(actual.metadata.gallery, expected.gallery);
  assert.equal(actual.metadata.pricing_status, "quote_required");
  assert.deepEqual(actual.images ?? [], expected.images.map((path) => new URL(path, process.env.CATALOG_ASSET_ORIGIN ?? "http://localhost:8000").href));
  for (const image of [...expected.images, ...(expected.gallery ?? []).map((item) => item.src)]) {
    assert((await readFile(new URL(`../apps/storefront/public${image}`, import.meta.url))).length > 0);
  }
  for (const item of (expected.gallery ?? []).filter((item) => item.kind === "illustration")) {
    assert(audit.approved.some((approved) => approved.reference === expected.reference && approved.src === item.src), item.src);
  }
}
console.log("PASS: two real imports; 45 unique drafts, exact approved media/metadata, no linked prices, all local assets present.");
