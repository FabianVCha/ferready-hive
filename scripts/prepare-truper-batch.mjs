/**
 * Materialize only the twelve user-approved references. This is an explicit
 * intake command, not research auto-publication or an ongoing synchronization.
 */
import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalogPath = resolve(root, "data/approved/catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const research = JSON.parse(await readFile(resolve(root, "data/research/truper/products.json"), "utf8"));
const references = ["101895", "103068", "103740", "103741", "104271", "104275", "104412", "11452", "13448", "14012", "16182", "16590"];
if (catalog.products.length !== references.length ||
    references.some((reference) => !catalog.products.some((p) => p.reference === reference))) {
  throw new Error("This intake command only supports the approved twelve-reference batch");
}
await mkdir(resolve(root, "apps/storefront/public/project/products/truper"), { recursive: true });
const evidence = [];
for (const product of catalog.products) {
  const source = research.products.find((p) => p.official_code === product.reference);
  if (!source || source.name !== product.title) throw new Error(`Identity mismatch: ${product.reference}`);
  const image = `/project/products/truper/${product.reference}.jpg`;
  // 11452: reviewed candidate visibly bears BROU-R2 1/4M, matching the source
  // attribute BROU-R2-1-4M.jpg. Never include the generated ancillary PNGs.
  const filename = product.reference === "11452" ? "candidato-truper.jpg" : "original-truper.jpg";
  await copyFile(
    resolve(root, `data/research/truper/images/herramientas-electricas/${product.handle}/${filename}`),
    resolve(root, `apps/storefront/public${image}`),
  );
  Object.assign(product, {
    brand: source.brand.replaceAll("_", " "),
    model: source.model,
    specifications: source.specifications,
    source_url: source.official_source_url,
    image_source_url: source.source_image_url ?? `https://www.truper.com/media/import/imagenes/${source.source_image_attribute.split("/").at(-1)}`,
    images: [image],
  });
  evidence.push({
    reference: source.official_code,
    title: source.name,
    model: source.model,
    brand: source.brand.replaceAll("_", " "),
    specifications: source.specifications,
    source_url: source.official_source_url,
    image_source_url: product.image_source_url,
    retrieved_at: source.retrieved_at,
    response_sha256: source.evidence.response_sha256,
    photograph_sha256: createHash("sha256").update(await readFile(resolve(root, `apps/storefront/public${image}`))).digest("hex"),
  });
}
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(resolve(root, "data/approved/truper-source-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Prepared ${catalog.products.length} approved references with source photographs; no prices or stock added.`);
