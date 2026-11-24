/**
 * Explicit, incremental intake of the three locally approved folder selections.
 * No network access, generated images, pricing, stock or publication.
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(new URL("../apps/storefront/package.json", import.meta.url));
const sharp = require("sharp");
const load = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const catalog = await load("data/approved/catalog.json");
const research = await load("data/research/truper/products.json");
const candidates = await load("data/research/truper/image-candidates.json");
const evidence = await load("data/approved/truper-source-evidence.json");
const selections = {
  "aire-comprimido-y-pintura": "Aire comprimido y pintura",
  construccion: "Construcción",
  "corte-y-abrasivos": "Corte y abrasivos",
};
// Explicit owner-approved multi-image additions, not a category-wide import.
const multiReferences = new Set(["104495", "103722", "100891", "100894", "104242", "104274", "13178", "100362", "104111"]);
const multiOnly = process.argv.includes("--approved-multi");
if (multiOnly) {
  for (const key of Object.keys(selections)) delete selections[key];
  Object.assign(selections, {
    "equipo-automotriz": "Equipo automotriz",
    "ferreteria-y-fijacion": "Ferretería y fijación",
    "herramientas-manuales": "Herramientas manuales",
    "medicion-y-trazado": "Medición y trazado",
  });
}
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const destination = resolve(root, "apps/storefront/public/project/products/truper");
await mkdir(destination, { recursive: true });
let added = 0;
for (const [selection, name] of Object.entries(selections)) {
  const directory = resolve(root, `data/research/truper/images/${selection}`);
  for (const handle of (await readdir(directory)).sort()) {
    const reference = handle.split("-")[0];
    if (multiOnly && !multiReferences.has(reference)) continue;
    const source = research.products.find((p) => p.official_code === reference);
    if (!source || handle !== `${reference}-${source.model.toLowerCase().replaceAll("/", "-")}`) {
      throw new Error(`Unmatched exact identity: ${selection}/${handle}`);
    }
    const existing = catalog.products.find((p) => p.reference === reference || p.handle === handle);
    if (existing) {
      if (existing.reference !== reference || existing.handle !== handle) throw new Error(`Duplicate identity: ${handle}`);
      continue;
    }
    const category = reference === "15020" ? "jardineria" : selection;
    if (!catalog.categories.some((c) => c.handle === category)) {
      catalog.categories.push({ handle: category, name: category === "jardineria" ? "Jardinería" : name });
    }
    const candidate = candidates.image_candidates.find((p) => p.official_code === reference);
    // Two retailer-hosted candidates cannot establish manufacturer provenance.
    const imageSource = source.source_image_url ?? (
      candidate?.candidate_image_url.startsWith("https://www.truper.com/media/import/imagenes/")
        ? candidate.candidate_image_url : null
    );
    const images = [];
    let originalHash = null;
    let photographHash = null;
    if (imageSource) {
      const filename = source.source_image_url ? "original-truper.jpg" : "candidato-truper.jpg";
      const bytes = await readFile(resolve(directory, handle, filename));
      originalHash = sha256(bytes);
      const optimized = await sharp(bytes).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 88, mozjpeg: true }).toBuffer();
      photographHash = sha256(optimized);
      await writeFile(resolve(destination, `${reference}.jpg`), optimized);
      images.push(`/project/products/truper/${reference}.jpg`);
    }
    const product = {
      reference, handle, title: source.name, category,
      description: `Marca: ${source.brand.replaceAll("_", " ")}. Modelo: ${source.model}.`,
      approved_by: "Ferready", approved_at: multiOnly ? "2026-11-24" : "2026-11-22",
      brand: source.brand.replaceAll("_", " "), model: source.model,
      specifications: source.specifications, source_url: source.official_source_url,
      ...(imageSource ? { image_source_url: imageSource } : {}), images,
    };
    catalog.products.push(product);
    evidence.push({
      reference, title: product.title, model: product.model, brand: product.brand,
      specifications: source.specifications, source_url: product.source_url,
      image_source_url: imageSource, retrieved_at: source.retrieved_at,
      response_sha256: source.evidence.response_sha256,
      photograph_sha256: photographHash, original_photograph_sha256: originalHash,
      selection_folder: `${selection}/${handle}`,
      image_review: imageSource ? "Visually reviewed local manufacturer photograph; optimized JPEG derivative." :
        "Retailer-hosted candidate excluded: manufacturer photograph provenance not established.",
      ...(reference === "15020" ? { category_review: "GTS-SH is a garden trowel, not a construction tool." } : {}),
    });
    added++;
  }
}
await writeFile(resolve(root, "data/approved/catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(resolve(root, "data/approved/truper-source-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Added ${added}; total ${catalog.products.length}. No prices, stock or publication.`);
