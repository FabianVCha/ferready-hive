/**
 * Rules for the manually approved catalog file.
 *
 * Canonical URLs are always derived from the product handle. Nothing in the
 * approved file may override a URL, so a reference can only ever resolve to
 * one path. Content variants never produce extra routes.
 */

const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Keys that would let a human author a URL path. They are rejected on purpose. */
const FORBIDDEN_PRODUCT_KEYS = ["url", "path", "route", "canonical", "slug"];

export function slugify(input) {
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function productPath(handle) {
  if (!HANDLE_PATTERN.test(handle)) {
    throw new Error(`invalid handle: ${handle}`);
  }
  return `/p/${handle}`;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * @param {unknown} input parsed content of data/approved/catalog.json
 * @returns {{ok: boolean, errors: string[], catalog: {version: number, categories: object[], products: object[]}}}
 */
export function validateCatalog(input) {
  const errors = [];
  const categories = [];
  const products = [];

  if (!isPlainObject(input)) {
    return { ok: false, errors: ["catalog must be a JSON object"], catalog: { version: 1, categories, products } };
  }

  if (input.version !== 1) {
    errors.push(`unsupported catalog version: ${JSON.stringify(input.version)} (expected 1)`);
  }

  const rawCategories = input.categories ?? [];
  if (!Array.isArray(rawCategories)) {
    errors.push("categories must be an array");
  } else {
    const seen = new Set();
    rawCategories.forEach((category, index) => {
      const at = `categories[${index}]`;
      if (!isPlainObject(category)) {
        errors.push(`${at} must be an object`);
        return;
      }
      if (!isNonEmptyString(category.handle) || !HANDLE_PATTERN.test(category.handle)) {
        errors.push(`${at}.handle must be a lowercase hyphenated slug`);
        return;
      }
      if (!isNonEmptyString(category.name)) {
        errors.push(`${at}.name is required`);
      }
      if (seen.has(category.handle)) {
        errors.push(`${at}.handle duplicated: ${category.handle}`);
        return;
      }
      seen.add(category.handle);
      categories.push({ handle: category.handle, name: String(category.name).trim() });
    });
  }

  const knownCategories = new Set(categories.map((category) => category.handle));
  const rawProducts = input.products ?? [];
  if (!Array.isArray(rawProducts)) {
    errors.push("products must be an array");
  } else {
    const seenReferences = new Set();
    const seenHandles = new Set();

    rawProducts.forEach((product, index) => {
      const at = `products[${index}]`;
      if (!isPlainObject(product)) {
        errors.push(`${at} must be an object`);
        return;
      }

      const forbidden = FORBIDDEN_PRODUCT_KEYS.filter((key) => key in product);
      if (forbidden.length > 0) {
        errors.push(`${at} must not define ${forbidden.join(", ")}: URLs are derived from the handle`);
      }

      if (!isNonEmptyString(product.reference) || !REFERENCE_PATTERN.test(product.reference)) {
        errors.push(`${at}.reference must match ${REFERENCE_PATTERN}`);
        return;
      }
      if (seenReferences.has(product.reference)) {
        errors.push(`${at}.reference duplicated: ${product.reference}`);
        return;
      }
      seenReferences.add(product.reference);

      if (!isNonEmptyString(product.title)) {
        errors.push(`${at}.title is required`);
      }

      if (!isNonEmptyString(product.category) || !knownCategories.has(product.category)) {
        errors.push(`${at}.category must reference an existing category handle`);
      }

      if (!isNonEmptyString(product.approved_by)) {
        errors.push(`${at}.approved_by is required`);
      }
      if (!isNonEmptyString(product.approved_at) || !DATE_PATTERN.test(product.approved_at)) {
        errors.push(`${at}.approved_at must be an ISO date (YYYY-MM-DD)`);
      }

      const handle = isNonEmptyString(product.handle)
        ? String(product.handle).trim()
        : slugify(product.title ?? "");

      if (!HANDLE_PATTERN.test(handle)) {
        errors.push(`${at}.handle could not be derived as a valid slug (got ${JSON.stringify(handle)})`);
        return;
      }
      if (seenHandles.has(handle)) {
        errors.push(`${at}.handle duplicated: ${handle}`);
        return;
      }
      seenHandles.add(handle);

      if (product.price_cop !== undefined && product.price_cop !== null) {
        if (!Number.isInteger(product.price_cop) || product.price_cop < 0) {
          errors.push(`${at}.price_cop must be a non-negative integer amount in COP`);
        }
      }

      const variants = [];
      if (product.content_variants !== undefined) {
        if (!Array.isArray(product.content_variants)) {
          errors.push(`${at}.content_variants must be an array`);
        } else {
          product.content_variants.forEach((variant, variantIndex) => {
            const variantAt = `${at}.content_variants[${variantIndex}]`;
            if (!isPlainObject(variant)) {
              errors.push(`${variantAt} must be an object`);
              return;
            }
            if (!isNonEmptyString(variant.label) || !isNonEmptyString(variant.body)) {
              errors.push(`${variantAt} requires label and body`);
              return;
            }
            variants.push({ label: String(variant.label).trim(), body: String(variant.body).trim() });
          });
        }
      }

      const images = product.images ?? [];
      if (!Array.isArray(images) || images.some((image) =>
        typeof image !== "string" || !/^\/project\/products\/[a-zA-Z0-9/_-]+\.(jpg|png|webp)$/.test(image)
      )) {
        errors.push(`${at}.images must contain local /project/products/ image paths`);
      }
      const specifications = product.specifications ?? {};
      const gallery = product.gallery ?? [];
      if (!Array.isArray(gallery) || gallery.some((entry) =>
        !isPlainObject(entry) ||
        !/^\/project\/products\/[a-zA-Z0-9/_-]+\.(jpg|png|webp)$/.test(entry.src ?? "") ||
        !["photo", "illustration"].includes(entry.kind) ||
        !isNonEmptyString(entry.caption) || !isNonEmptyString(entry.provenance)
      ) || new Set(gallery.map((entry) => entry.src)).size !== gallery.length) {
        errors.push(`${at}.gallery requires unique local images with kind, caption and provenance`);
      }
      if (!isPlainObject(specifications) || Object.entries(specifications).some(
        ([key, value]) => !isNonEmptyString(key) || !isNonEmptyString(value)
      )) {
        errors.push(`${at}.specifications must contain non-empty string values`);
      }
      for (const field of ["brand", "model", "source_url", "image_source_url"]) {
        if (product[field] !== undefined && !isNonEmptyString(product[field])) {
          errors.push(`${at}.${field} must be a non-empty string`);
        }
      }
      for (const field of ["source_url", "image_source_url"]) {
        if (product[field] !== undefined) {
          try {
            if (new URL(product[field]).protocol !== "https:") throw new Error("insecure source");
          } catch {
            errors.push(`${at}.${field} must be an absolute HTTPS URL`);
          }
        }
      }

      products.push({
        reference: String(product.reference),
        title: String(product.title ?? "").trim(),
        handle,
        path: HANDLE_PATTERN.test(handle) ? productPath(handle) : null,
        category: String(product.category ?? "").trim(),
        summary: isNonEmptyString(product.summary) ? String(product.summary).trim() : null,
        description: isNonEmptyString(product.description) ? String(product.description).trim() : null,
        price_cop: Number.isInteger(product.price_cop) ? product.price_cop : null,
        images: Array.isArray(images) ? images : [],
        gallery: Array.isArray(gallery) ? gallery : [],
        specifications: isPlainObject(specifications) ? specifications : {},
        brand: product.brand ?? null,
        model: product.model ?? null,
        source_url: product.source_url ?? null,
        image_source_url: product.image_source_url ?? null,
        content_variants: variants,
        approved_by: String(product.approved_by ?? "").trim(),
        approved_at: String(product.approved_at ?? "").trim(),
      });
    });
  }

  return { ok: errors.length === 0, errors, catalog: { version: 1, categories, products } };
}

export const CATALOG_RULES = {
  HANDLE_PATTERN,
  REFERENCE_PATTERN,
  DATE_PATTERN,
  FORBIDDEN_PRODUCT_KEYS,
};
