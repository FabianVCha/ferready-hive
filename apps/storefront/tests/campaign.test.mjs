import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  campaign,
  productStory,
  journeyState,
} from "../lib/campaign.mjs";

const products = JSON.parse(
  readFileSync(new URL("../data/prototype-products.json", import.meta.url)),
);

test("campaign keeps official brand assets and editable niche content separate", () => {
  assert.equal(campaign.brand.red, "#E4261E");
  assert.equal(campaign.brand.navy, "#1D3659");
  assert.equal(campaign.brand.logo, "/ferready/logo.svg");
  assert.equal(campaign.brand.logoLight, "/ferready/logo-light.svg");
  assert.ok(campaign.featured.every((slug) => products.some((p) => p.slug === slug)));
  assert.equal(campaign.projects.length, 3);
  assert.ok(campaign.projects.every((p) => p.href.startsWith("/c/")));
});

test("product journey uses the current product's facts, compatibility and actual image", () => {
  for (const product of products) {
    const story = productStory(product);
    assert.equal(story.image, product.image);
    assert.equal(story.chapters.length, 3);
    assert.equal(story.chapters[0].body, product.description);
    assert.equal(story.chapters[1].body, product.compatibility);
    assert.equal(story.chapters[2].body, product.includes);
    assert.deepEqual(story.specs, Object.entries(product.specs));
    assert.equal(story.video, null);
  }
  const cosmetics = {
    slug: "serum-demo", name: "Sérum de demostración", image: "/serum.webp",
    description: "Descripción del sérum", compatibility: "Revisar ingredientes",
    includes: "Un frasco", specs: { Contenido: "30 ml" },
  };
  const story = productStory(cosmetics);
  assert.equal(story.image, "/serum.webp");
  assert.ok(!JSON.stringify(story).includes("taladro"));
});

test("scroll journey reveals details and lowers the product into the box at its end", () => {
  assert.equal(journeyState(0).chapter, 0);
  assert.equal(journeyState(0.4).chapter, 1);
  assert.equal(journeyState(0.7).chapter, 2);
  assert.equal(journeyState(1).chapter, 3);
  assert.equal(journeyState(0).packing, 0);
  assert.equal(journeyState(1).packing, 1);
  assert.ok(journeyState(1).y > journeyState(0).y);
  assert.ok(journeyState(1).scale < journeyState(0).scale);
  assert.deepEqual(journeyState(-1), journeyState(0));
  assert.deepEqual(journeyState(99), journeyState(1));
  assert.deepEqual(journeyState(NaN), journeyState(0));
  assert.deepEqual(journeyState(0.4), journeyState(0.4));
});
