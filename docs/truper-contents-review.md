# Contents scene review

## Exhaustive follow-up

[`truper-catalog-validation.md`](truper-catalog-validation.md) and
`data/approved/truper-catalog-validation.json` record the subsequent review of
all 35 other references plus the unchanged 103068 regression. Full-resolution
labels invalidated four previously selected 16590 illustrations. They are no
longer selected; only its manufacturer photograph is used. The current totals
are 27 selected illustrations, 44 excluded illustrations, 34 manufacturer
photos and the same two specifically confirmed 103068 components.
Historical counts and decisions below describe the earlier review.

## Current decision: user-confirmed 103068 contents

On 2026-11-23 the user explicitly confirmed the exact question:
"¿Confirmas que el taladro 103068/TAL-1/2N2 incluye ese mango y esa llave?"
with "si, confirmo procede". This supersedes the product-only pending decision
below **for 103068 / TAL-1/2N2 only**. It is user evidence, not manufacturer
verification, and does not approve any other reference's accessories.

`data/approved/truper-contents-selection.json` records the confirmation and
the exact source SHA-256 hashes. The table now contains:

- Taladro: existing manufacturer photograph, `103068-alpha.png`.
- Mango auxiliar: supplied illustration from `Gemini_Generated_Image_d9ta5ud9ta5ud9ta.jpg`,
  derived as `103068-contents-handle-be2dbd7cd703.webp`.
- Llave de broquero: supplied illustration from `Gemini_Generated_Image_d9ta5ud9ta5ud9ta(1).jpg`,
  derived as `103068-contents-key-e3cd46b99694.webp`.

The handle shown separately is the same component shown mounted in the drill
photograph, not an additional fourth component. Persistent contents copy explains
this, labels the accessories as illustrations and attributes inclusion to the
user with its date. Selected-piece details distinguish illustration from photo.
The existing movement, selection, pause, reduced-motion and three-object packing
sequence are retained.

Two additional alpha assets use the existing conservative background-removal
and even-margin normalization pipeline. No source image, manufacturer
specification, price, stock, catalog status or Medusa record is changed.
The generator audit moves only these two sources from excluded to
`confirmed_contents`; the remaining 40 illustration exclusions are unchanged.

## Historical review before user confirmation

The original `hive-web` implementation at `81d4d48` uses a selectable counter:
independent objects share the home counter styling, sway, idle emphasis, pause,
keyboard/reduced-motion handling, and automatic packing/replay. It is not a
slideshow of photographs. The previous `kitSlug` gate prevented real catalog
references from using it and incorrectly substituted a detail view.

## Visual decisions

All supplied category contact sheets and the ten multi-image reference strips
were inspected before selecting scene media. For TAL-1/2N2 (103068), the five
supplied images show the manufacturer drill with mounted auxiliary handle,
a synthetic complete drill with cord, a synthetic chuck close-up, a synthetic
isolated handle, and a synthetic chuck key. The mounted handle is visible in the
manufacturer photograph; that does not establish a separately shipped handle.
No reference-specific included-items list is present in the approved record.
Neither isolated accessory is authorized as package contents.

| Reference | Visible supplied alternate views | Contents decision |
| --- | --- | --- |
| 101895 | Pneumatic sander angles, pad, wrench | Manufacturer product only |
| 103068 | Complete corded drill, chuck, handle, key | Manufacturer product only |
| 104275 | Drill/driver angles, charger, bag, bit sets | Manufacturer composite only; no inferred loose inventory |
| 104412 | Compact drill angles, charger, adapter, battery, clip | Manufacturer product only |
| 13448 | Motor vent close-up, sanding belt, dust bag | Manufacturer product only; vent is not a project view |
| 14012 | Grinder angles, flanges, guard, handle, brushes, wrench, disc | Manufacturer product only |
| 16182 | Drill press angles, chuck, three feed handles | Manufacturer product only |
| 16590 | Grinder angles, flanges, guard, handle, brushes, wrench, disc | Manufacturer product only |
| 103030 | Compressor angles, oil, filter, cap, hardware | Manufacturer product only |
| 103660 | Cut-off saw angles, disc, hex key, brushes | Manufacturer product only |

The same rule applies to single-image products. A manufacturer photograph can
show a complete set as photographed, but is never decomposed into an invented
inventory. Missing photographs retain the truthful missing-image state.
Illustrations remain labeled illustrations; neither a filename nor an attractive
render verifies inclusion. Approved records and the database are unchanged.

## Implementation contract

### Filesystem re-audit (2026-11-23)

The complete local image tree contains 338 raster files in 189 reference folders.
The four selected catalog categories contain 109 files, all reviewed in contact
sheets against their reference originals, including the previously excluded files.
The generator now records every one in `truper-gallery-audit.json` under
`inventory`, with dimensions, native alpha range, source hash and selection role.
This is a filesystem inventory, not just the previous selection manifest.

For `herramientas-electricas/103068-tal-1-2n2/`, the file-level findings are:

| File | Visual finding | Use |
| --- | --- | --- |
| `original-truper.jpg` | Manufacturer drill, auxiliary handle mounted; large blank square canvas | Main product and existing product-only table, transparent derived copy trimmed with 6% margin |
| `Gemini_Generated_Image_wy6jwnwy6jwnwy6j(1).jpg` | Complete illustrated drill with cord; white square background | Project stage; transparent derived copy, complete cord retained |
| `Gemini_Generated_Image_wy6jwnwy6jwnwy6j.jpg` | Illustrated chuck/gearbox close-up, not another complete product | Labeled gallery detail, not contents |
| `Gemini_Generated_Image_d9ta5ud9ta5ud9ta.jpg` | Isolated illustrated auxiliary handle; visually resembles the mounted handle | Not a second shipped handle; pending exact-package confirmation |
| `Gemini_Generated_Image_d9ta5ud9ta5ud9ta(1).jpg` | Isolated illustrated chuck key; compatible-looking mechanism is not proof of exact fit or inclusion | Pending exact-package confirmation |

The cached record in `data/research/truper/products.json` supplies eleven
specification fields for 103068 but no included-items block. The approved source
evidence also has no such block. This remains a specific evidence gap after
inspection, not an assumption that accessory images do not exist.

All 31 selected illustrations previously retained opaque white backgrounds.
They now use the same conservative edge-connected white removal as the 34
manufacturer-derived views. All 65 derived views are trimmed and padded without
stretching, while source files remain untouched. Enclosed white details are
intentionally preserved rather than globally deleting bright pixels.

Browser inspection also found that the project-stage grid let its square image
resolve to 672 × 672 inside a 672 × 388 layer, clipping the cable at the bottom.
Absolutely containing the image inside that layer fixes the sizing rather than
disguising it with a scale transform. Normalized main views no longer receive the
old compensating 1.2× zoom.

No accessory has been newly claimed as included. The product-only contents scene
is still an explicit pending item, not a completed accessory inventory.

`productTablePieces` supplies only the reference's approved photograph to the
existing counter. Informational mode explicitly says package contents are pending
confirmation. The original demo still has its configured three example pieces.
The component accepts variable piece counts, including the one-product scene.
No fabricated battery or charger, generated accessory, or detail crop enters
the contents scene. Synthetic detail views are retained in the source catalog,
not forced into unrelated story chapters.
