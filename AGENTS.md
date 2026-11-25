# ferready-hive Agent Context

## Project identity

- Project: `ferready-hive`
- Repository: `FabianVCha/ferready-hive`
- Upstream template: `FabianVCha/hive-web`
- Template baseline: `f101bfe`
- Default branch: `main`

This repository is the first derived project from the `hive-web` storefront
template. It is intentionally independent from the template repository and
receives shared-code updates through Pull Requests.

## Current state

- The project starts from the neutral storefront template.
- Project-specific configuration belongs in
  `apps/storefront/data/project-config.mjs`.
- The payment provider is still `demo`; no real payment credentials or gateway
  are configured.
- Production runs on the mew VPS behind the Cloudflare tunnel at ferready.odelza.com. The catalog
  stays draft-only until a person publishes each reference.
- The first niche adaptation is the Ferready storefront and should be
  introduced through project-owned configuration and approved assets.

## Update contract

Read `README.md`, `docs/template-updates.md`, and `template-manifest.json`
before changing the template boundary.

- Do not push directly to `main`.
- The initial template bootstrap is the only exception; all subsequent changes
  must arrive through Pull Requests.
- Template updates arrive through `chore/template-update-*` Pull Requests.
- Preserve `project.id` and project-owned configuration.
- Never commit `.env` files, tokens, payment credentials, or generated local
  artifacts.
- Resolve template conflicts in the Pull Request; do not silently discard
  project-specific behavior.

## Verification

For storefront changes, run:

```bash
cd apps/storefront
npm test
npm run lint
npm run build
```

For template synchronization changes, also run:

```bash
node scripts/template-manifest.mjs
node --test scripts/template-manifest.test.mjs scripts/prepare-template-update.test.mjs
```

Keep tests and documentation with the behavior they describe. If a change
requires a new payment provider, implement an adapter behind
`PaymentProvider`; never put provider-specific credentials in source code.
