# Approved multi-image products on the local storefront

The owner's 24 November 2026 authorization is implemented in the existing
informational storefront, not in Medusa or production.

## Scope

- Added exactly nine references: `104495`, `103722`, `100891`, `100894`,
  `104242`, `104274`, `13178`, `100362`, `104111`.
- The approved catalog now contains **45 unique products** in **11 categories**.
  Manufacturer research supplies the titles, models, specifications and source
  URLs; original photos are retained separately from derivatives.
- Expanded the **20 folders containing more than two source images**. The
  selection contains **132 supplied illustrations**: 56 product angles,
  3 details and 73 accessory illustrations.
- The existing `103068` confirmation still supplies two additional illustrations
  (handle and chuck key). It remains the only explicit user-confirmed contents
  manifest. No other product inherits that confirmation.
- There are 43 manufacturer-photo cutouts, 134 illustration cutouts including
  those two confirmed components, and two intentionally missing-photo products
  (`19784`, `12544`). No substitute image was invented.

## Existing interaction, expanded content

All **166 source files** in those twenty folders are accounted for exactly once:
20 manufacturer originals + 132 selected illustrations + 2 confirmed component
illustrations + 12 explicit exclusions. No source in that scope is silently
left pending.

The original four journey chapters, scroll choreography, table, selection,
packing and reduced-motion alternative remain. No thumbnail strip or duplicate
gallery was added.

In **El producto** and **Tu proyecto**, the product itself is a keyboard-accessible
“Cambiar vista” button. It traverses the semantic product-angle/detail sources,
not accessory images or arbitrary gallery chunks. Table selection retains its
original emphasis behavior; it does not become a second gallery control.

In **Qué incluye**, the existing three-object table keeps the product and up to
two accessory illustrations visible. Anterior/Siguiente controls expose every
remaining accessory without overlapping additional objects. Each is labeled
“ilustrado”; the chapter explicitly says inclusion is unconfirmed. Product
views never establish package contents. The final packing remains illustrative.

## Conflicts retained outside the storefront

`data/approved/truper-multi-media-exclusions.json` records twelve conflicting
files in these twenty folders, with source paths and reasons:

- Five `16590` images have incompatible disc diameters or motor markings.
- The isolated `104412` battery has a conflicting slide-mount shape.
- One `104274` composition combines three different tools.
- Two `13178` files are demolition chisels, not stapler components.
- Two `104495` images incorrectly label capacity as 100 or 10,000 mAh rather
  than the verified 12,000 mAh. The correct 12,000 mAh illustration is retained.
- One `104111` rear view incorrectly says NLL-4D / 20 V rather than NL-16 /
  11.1 V. The front views match the manufacturer's illustrated battery geometry.

The partial `100362` front-panel image is a **detail**, not a full-product angle.
The source tree remains unchanged. Existing full-root coverage remains 338
files / 189 folders. Earlier contact-sheet review is not retrospectively
represented as individual full-resolution certification; targeted full-resolution
inspection found the additional label conflicts above.

## Reproduce

From the repository root:

```bash
node scripts/prepare-truper-selected-folders.mjs --approved-multi
python3 scripts/select-truper-multi-media.py
python3 scripts/prepare-truper-galleries.py
node scripts/validate-catalog.mjs
node --test scripts/truper-galleries.test.mjs
python3 scripts/test_truper_galleries.py
python3 scripts/test-truper-image-classification.py
```

Intake is allowlisted and idempotent; it does not import the remaining
single-image research products. The manufacturer photographs remain immutable;
cutouts use the existing edge-connected white removal, safe framing and lossless
illustration pipeline.

Storefront verification uses `npm test`, `npm run lint`, `npm run build` and
`tests/browser-all-truper.probe.cjs`. The browser probe exercises the original
chapters plus every view and accessory page at 1440, 390 and 320 pixels.
`AUDIT_MOTION=normal AUDIT_MULTI_ONLY=1` selects the twenty expanded products
with normal motion; the default also covers all other approved products with
reduced motion. Evidence belongs under `/tmp/opencode`, not in source control.

No backend import was run. Existing Medusa drafts, prices, availability and
publication states were not changed. No production deployment, commit or push
is part of this work.

## Verification result — 24 November 2026

- Storefront: 47 tests passed; lint and production build passed.
- Catalog/schema/template: 20 tests passed; importer mocks: 4 passed, without
  connecting to Medusa.
- Image processing: 8 pixel tests passed; full-root classification: 4 passed.
- Browser: **540 reduced-motion chapter checks** across all 45 products and
  **240 normal-motion chapter checks** across the 20 expanded products.
  Every selected view and accessory page is exercised, with no image errors,
  horizontal overflow, label clipping or visible object/caption collisions.
- Confirmed contents: 51 additional checks passed, including the original
  three-piece `103068` selection, pause, motion and packing behavior.
- Navigation: 33 category checks passed across 11 categories and three widths;
  both narrow-screen menus reach the last category and close on navigation.
- All 220 referenced image URLs returned valid image responses.
- Intake rerun added zero products; catalog validation remains 45/11.

Browser sizes were 1440×900, 390×900 and 320×900; this is emulation, not a claim
of physical-device testing. Evidence is under
`/tmp/opencode/truper-multi-final/{reduced-verified,normal-verified,confirmed-verified,navigation-verified}/`.

Mobile captions reserve space above paginated table objects; shorter accessory
captions avoid repeating “illustrated.” The collision probe uses actual source
alpha and `object-fit` placement rather than invisible image letterboxing.
