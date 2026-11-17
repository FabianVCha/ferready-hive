# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing Next.js 16 / React 19 storefront with TypeScript and plain CSS. Preserve the existing stack. GSAP is already declared.

## Users

Shoppers browsing products and buying through the website. Hardware is the first demonstration niche; cosmetics and other product categories are intended future adaptations.

## Product Purpose

Create a reusable ecommerce template rather than the final production website. Product discovery and purchase through the website are primary. User answer: "Comprar en la web".

## Capabilities and Constraints

- The local demonstration remains opt-in through FERREADY_DEMO=1 and independent of the default Medusa storefront.
- Preserve working catalog, product detail, cart, and guest demo checkout routes. The checkout collects test delivery/contact details only in memory, offers review and a downloadable non-fiscal PDF marked pending payment, and never clears the cart. Do not activate real payments, submit real orders, or publish.
- Demonstration product selection is flexible; previously supplied products are not an exclusive catalog.
- Make brand, campaign imagery, and niche content replaceable without rebuilding the storefront.
- Existing storefront UI is Colombian Spanish. No invented testimonials, business statistics, guarantees, or support channels.
- Current source changes and Git staging predate this redesign and must be preserved.

## Brand Commitments

Ferready is the first demonstration brand. Preserve its supplied logos and brand colors. Current implemented primary colors are red #e4261e and navy #1d3659, with steel #4f7399. Existing fonts are not confirmed binding brand requirements.

The user requests a modern, elegant, professional and lively design, informed by the supplied product-editorial, retro storytelling, and cosmetics references without copying or combining their visual identities indiscriminately.

## Evidence on Hand

- Official logo copies: apps/storefront/public/ferready/{logo.svg,logo-light.svg,mark.svg}.
- Existing demo fixtures: apps/storefront/data/prototype-products.json.
- Existing reference-image provenance: apps/storefront/public/ferready/image-sources.json; no public-use license is assumed.
- image-gen responded successfully and explicitly identified Claude Opus 5.5 / Anthropic. Higgsfield MCP is connected and completed three proposal images through the parent session as transport; image-gen inspected all three. Its child session does not expose MCP tools. CLI authentication works but CLI generation was rejected; use the connected MCP, not another CLI retry.
- PROTOTYPE.md documents demo isolation, routes and test commands.

## Product Principles

- Product imagery and storytelling support shopping rather than conceal prices and navigation.
- Separate reusable structure from the first niche's campaign content.
- Universal objective flow: choose a predefined objective, review associated products and editorial initial quantities, remove or adjust items, then add the selected set to the demo cart. No questionnaires or niche-specific calculations. Ferready supplies example content only.
- Motion is purposeful, responsive and accessible with reduced-motion alternatives.
- Verify the rendered desktop and mobile experience, not just the source.
