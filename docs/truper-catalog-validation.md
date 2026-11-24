# Truper catalog validation — all remaining references

## Outcome and limits

All **35 other SKUs**, plus the **103068 regression**, were checked against the
cached manufacturer code/model/title/specifications, source images, selected
media, explicit chapter roles and rendered product routes. This is not blanket
approval of package contents or proof that all supplied illustrations are faithful.
No new extraction, generation, publication, commercial data change or database
write was performed. Existing dirty work and all source files were preserved.

The four selected source folders contain **109 images**: 104 belong to the 35
other SKUs and five to the regression SKU. All were inspected in labeled contact
sheets, including ignored accessories and retailer candidates. Retained
illustrations were additionally inspected in larger four-image sheets; suspicious
labels were enlarged individually. Six byte-identical cross-SKU groups occur
under 14012/16590; none establishes compatibility or inclusion.

### Corrections

- **16590:** removed four complete-product illustrations from the approved
  selection and chapter mapping. Three visibly print **6″ / 150 mm**, rather than
  the product's 9″; the other prints a nominal 9″ disc but corrupts the motor-power
  marking. The manufacturer's original states 9″ / 2350 W and remains active.
  No misleading label was painted over or replaced.
- **103740, 104271:** removed the detached `Nuevo` badge from transparent
  derivatives only. The reviewed empty corner is pinned to exact source hashes;
  pixels outside it, product geometry and originals remain untouched.
- **11452:** corrected the exclusion rationale: BROU-R2-1/4M is readable in the
  supplied alternate at full resolution. Its altered cutting-tip geometry still
  does not establish a faithful alternate photograph.
- Added exact 16590 fallback regression coverage and an exhaustive browser probe.

Current selected media: **34 manufacturer photographs, 27 illustrations in nine
references, two user-confirmed illustrated 103068 components**. There are 44
excluded illustrations and two retailer candidates kept out of the active set.
Retained illustrations remain explicitly labeled illustrations, not manufacturer
photographs or independent accessory evidence. Their unreadable small print must
never be used as a specification source.

## Per-reference matrix

`Sources` counts every on-disk raster in the selected reference folder.
`Media` counts selected manufacturer/illustration views, not table components.
`Pieces` counts independent table objects: a set photographed together is **one
composition**, not one item in the physical package. A count of one does not claim
the package contains no accessories. Exact paths, hashes, alpha bounds, sources,
chapter assignments and detailed decisions are in
`data/approved/truper-catalog-validation.json`, generated offline by
`python scripts/audit-truper-catalog.py`.

| Reference / model | Sources | Media | Pieces | Finding |
| --- | ---: | ---: | ---: | --- |
| 101895 / TPN-861-2 | 7 | 5 | 1 | 6″ pneumatic sander; pad 19390 is a mounted part code, not this product code. Loose wrench pending. |
| 103740 / SICI-7-1/4N5 | 2 | 1 | 1 | 7-1/4″ saw; badge fixed. Blade, guide and hex-key render is not a cached included-items list. |
| 103741 / SME-10S | 1 | 1 | 1 | 10″ table saw; complete manufacturer composition retained. No isolated extras. |
| 104271 / N20-RAT-2 | 6 | 1 | 1 | Title confirms **two 4-Ah batteries**. Loose illustrated battery marking matches; full accessory inventory remains unconfirmed. Badge fixed. |
| 104275 / N20-COMBO-RD | 11 | 7 | 1 | Both tools appear in original combo; individual angles are product views. Exact bit counts and loose inventory unresolved. |
| 104412 / A12-ROT-1 | 8 | 4 | 1 | Title confirms **one 2-Ah battery**. Supplied loose slide-pack battery differs from compact handle battery. Original retains printed dimensions. |
| 11452 / BROU-R2-1/4M | 2 | 1 | 1 | Original engraving checked. Alternate engraving readable but cutting-tip geometry differs; remains excluded. |
| 13448 / LIBA-3X21A2 | 4 | 2 | 1 | 3×21″ belt sander; vent close-up remains detail, never project/contents. Loose belt/bag pending. |
| 14012 / ESMA-7A3 | 10 | 4 | 1 | 7″ PRO grinder. Shared isolated accessories do not validate 16590's fit or package. |
| 16182 / TAPI-17 | 5 | 3 | 1 | 17″ floor drill; B16 taper supported by specs. Three mounted feed handles do not imply three extra handles. |
| 16590 / ESMA-9N2 | 11 | 1 | 1 | Four misleading renders removed. Manufacturer 9″ / 2350-W photograph only. |
| 103030 / COMP-10L2 | 8 | 4 | 1 | Orange 10-L compressor. SAE30 type does not prove supplied 250-ml bottle inclusion. Filter/cap/hardware pending. |
| 104215 / WT-400F | 1 | 1 | 1 | 400-ml aerosol; complete single product. |
| 104491 / COMP-50M | 1 | 1 | 1 | White vertical 50-L compressor, distinct from orange 10-L reference. |
| 10745 / MAJA-9X | 1 | 1 | 1 | Bare 9″ roller frame/cage is correct; sleeve is not missing from this product photo. |
| 12465 / BRT-1/2C | 1 | 1 | 1 | Wood-handle brush. Source specification has an inconsistent 4-3/4″ / 118 cm conversion; flagged, not invented away. |
| 13879 / ROPI-930 | 1 | 1 | 1 | Pink thick-sleeve roller and frame as photographed. |
| 17849 / BRT-1/2X | 1 | 1 | 1 | Black plastic-handle brush, not wood-handle 12465. |
| 100416 / CAT-50X | 1 | 1 | 1 | Orange 5.5-ft³ wheelbarrow, solid tire. |
| 102639 / LLA-12 | 1 | 1 | 1 | Rounded 12″ trowel, wood handle; six-rivet source specification. |
| 11776 / CAT-60ND | 1 | 1 | 1 | Red 6-ft³ wheelbarrow, pneumatic tire; no extra wheel inferred. |
| 15020 / GTS-SH | 1 | 1 | 1 | Garden trowel; gardening reclassification retained. |
| 15850 / ET-2FX | 1 | 1 | 1 | Flexible 2″ stainless putty knife; complete single tool. |
| 19784 / BAS-2B | 1 | 0 | 0 | Two-bearing set identity supported; retailer candidate provenance unresolved. Explicit no-photo state retained. |
| 100105 / ST-1040EX | 1 | 1 | 1 | Printed 10″ / 40 teeth / 1″ bore checked. |
| 102364 / JBS-5 | 1 | 1 | 1 | Five SDS Plus bits confirmed as a set; one real composite, not invented separate objects. |
| 103660 / TRM-141 | 7 | 4 | 1 | 14″ D-handle saw; actual tool angles retained. Loose disc/key/brush inventory pending. |
| 104549 / CAZ-120LX | 1 | 1 | 1 | 120-cm cutter title confirms case, but no case asset. Source explicitly says **AAA batteries not included**. |
| 11110 / BAV-1/16 | 1 | 1 | 1 | Single 1/16″ HSS bit; no kit inferred. |
| 11423 / MT-5/8X11 | 1 | 1 | 1 | 5/8×11 UNC tap; title confirms individual case, no separate case asset. |
| 12544 / DICOF-3010 | 1 | 0 | 0 | 3″ / 1-mm disc candidate has matching identity but unverified manufacturer-photo provenance. |
| 15711 / DLTP-7040 | 1 | 1 | 1 | Printed 15711 / 7″ / grit 40 / 7/8″ bore checked. |
| 17025 / NV-7X | 1 | 1 | 1 | Orange folding knife with open blade; not a blade set. |
| 17903 / REP-CUT-7 | 1 | 1 | 1 | Cached `Contenido: 10 Cuchillas` confirms ten 25-mm blades, not ten additional cases. |
| 50004 / DESP-BAV-29C | 1 | 1 | 1 | 29-bit set in orange case; set-as-product photograph retained. |
| **103068 / TAL-1/2N2 — regression** | 5 | 3 | **3** | Exact user-confirmed drill, auxiliary handle and chuck key preserved; same handle mounted in photograph is not a fourth piece. |

## Remaining evidence, not blanket approval

- **Full loose-package inventory:** 101895, 103740, 103741, 104271, 104275,
  104412, 13448, 14012, 16182, 16590, 103030, 104491 and 103660 have no complete
  included-items block in the cached data. Not all have isolated accessory
  images. The battery quantities above are already known and must not be
  described as unknown just because other contents remain uncertain.
- **Missing approved photographs:** 19784 and 12544. No fabricated replacements.
- **Missing component views despite title evidence:** case for 104549 and
  individual case for 11423. No AAA batteries for 104549.
- **Image-quality exception:** 104412's genuine original contains dimension lines
  touching the product silhouette and a caption. It remains a truthful annotated
  source, **not a clean isolated main view**. Removal without a verified matte
  would risk deleting product pixels, so no blind erasure was performed.
- **Specification exception:** 12465's cached handle-length conversion is
  inconsistent. It needs an authoritative correction, not a guessed edit.
- Ordinary single hand tools, refills and fluids have no extra items asserted;
  they do not require fabricated three-piece tables.

## Verification and local evidence

Browser evidence lives under `/tmp/opencode/truper-all-validation/`.
`browser/proof.json` and `browser-normal/proof.json` each passed all 36 SKUs ×
3 widths (1440, 390, 320) × 4 chapters: **864 stage checks** across normal and
reduced motion, of which 840 cover the requested 35 other references,
including the exact active role source, image decode/fit, table count, explicit
missing photos, horizontal overflow and completed packing. All **97 selected
asset URLs** returned image content with HTTP 200. The independent
`browser-contents-table.probe.cjs` covers the three-piece regression, selection,
keyboard, pause, sway, automatic packing, reduced motion and original home objects.
Its **42 scene checks passed**. The full shell probe also passed **45 routes at
three widths**, including mobile navigation, home selection, seven categories,
search, computed Manrope/paper styling, stylesheet HTTP 200 and blocked commerce.
No unexpected browser errors were reported.
Labeled source sheets, enlarged labels, before-cleanup images and rendered sheets
are available alongside those reports. Browser emulation does not prove physical
phone behavior or package truth.

Automated verification: **46 storefront tests**, **7 Python pixel/source tests**,
**7 gallery/schema/template tests** and **4 importer tests** passed; storefront
lint and production build passed. Existing non-blocking Node module-type and
Pillow deprecation warnings remain. The site was rebuilt and restarted from this
workspace, with catalog/product routes verified on port 8000.

Medusa was checked **read-only** in the independent `ferready_hive` database:
36 products, all draft; 36 distinct SKUs; 34 image records whose actual URLs point
to the 34 original manufacturer JPEGs; zero prices linked to product variants.
The backend HTTP service was not running, so no admin/browser verification is
claimed. Direct local image URLs were tested through the storefront.
**Known metadata discrepancy:** Medusa's 16590 draft still has five historical
gallery entries, while the corrected file catalog has one. Re-import/metadata
synchronization remains pending; this audit did not silently write the database.
The two badge derivatives keep the same paths; original Medusa photos are intact.
