# First Ferready product selection

The active informational storefront reads `data/project/first15-truper.json`.
It contains the 14 identified references supplied in the owner's
`primeros-15-truper` batch. The fifteenth slot, the lavatory hose, is pending:
it has no invented SKU, brand, image, price, or product route.

`data/approved/catalog.json` remains the historical 45-reference dataset.
This selection does not delete, publish, import, or update Medusa records.
Prices and availability remain unconfirmed; online purchase stays disabled.
Adding these references to the persisted quotation selection is also disabled
until the backend has been explicitly synchronized. Existing saved selections
are not deleted.

## Source and media

- `first15-truper-provenance.json` records original filenames, source SHA-256
  hashes, photo/illustration classification, and the supplied verification claim.
  That claim is not a new independent manufacturer verification.
- `first15-truper-scenes.json` assigns exact-model scene media and individually
  supplied component illustrations for the three drills.
- All 53 supplied images are available in each product's gallery. Derived WebP
  files preserve aspect ratio and native alpha. Only near-white backgrounds
  connected to the image boundary are removed; enclosed product labels remain.
- Source JSON and source images are never edited. Component quantities come
  from each supplied `includes` array, not from image count or gallery order.
- The original four-stage journey and home motion remain in place. Home product
  references and search links now address this selection.

Regenerate from the owner's local source directory:

```bash
python scripts/prepare-first15-truper.py /absolute/path/to/primeros-15-truper
```

An optional second argument generates the same derived files inside a separate
checkout. Each checkout owns its JSON and images; no cross-worktree symlink is
required. Generate all files before restarting its development server.

## Verification

```bash
cd apps/storefront
npm test
npm run lint
npm run build
STOREFRONT_URL=http://localhost:8000 node tests/browser-first15-truper.probe.cjs
```

The browser probe expects Playwright and Chromium to be available. Set
`PLAYWRIGHT_MODULE` if Playwright is installed outside the storefront.
The unit suite always validates media references and provenance. It checks the
physical files when the first-selection media directory is available.

The browser probe checks the homepage, 15 catalog slots, all 14 detail routes at
1440/390/320 pixels, four reversible phases, reduced motion, console errors,
and failed local requests. A stopped selection-cart service causes the strict
probe to fail with `/api/selection-cart` 503; that is not a hydration or media
failure and is not silently ignored.
