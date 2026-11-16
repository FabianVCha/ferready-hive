import { test } from "node:test";
import assert from "node:assert/strict";
import { productStory, journeyState } from "../lib/campaign.mjs";

test("sparse non-hardware facts remain specific to the selected product", () => {
  for (const specs of [{}, { Contenido: "30 ml" }]) {
    const product = {
      image: "/serum.webp", description: "Sérum",
      compatibility: "Revisar ingredientes", includes: "Un frasco", specs,
    };
    const story = productStory(product);
    assert.deepEqual(story.chapters.map((chapter) => chapter.body),
      [product.description, product.compatibility, product.includes]);
    assert.deepEqual(story.specs, Object.entries(specs));
    assert.equal(story.image, product.image);
    assert.equal(story.video, null);
  }
});

test("chapter boundaries and packing geometry stay finite and reversible", () => {
  for (const [progress, chapter] of [[0, 0], [0.249, 0], [0.25, 1], [0.5, 2], [0.75, 3], [1, 3]]) {
    assert.equal(journeyState(progress).chapter, chapter);
  }
  for (const progress of [-1, NaN, Infinity, undefined]) {
    assert.deepEqual(journeyState(progress), journeyState(0));
  }
  const forward = Array.from({ length: 101 }, (_, i) => journeyState(i / 100));
  const reverse = Array.from({ length: 101 }, (_, i) => journeyState((100 - i) / 100));
  assert.deepEqual(reverse.reverse(), forward);
  forward.forEach((state) => {
    Object.values(state).forEach((value) => assert.ok(Number.isFinite(value)));
    assert.ok(state.scale > 0);
  });
  assert.equal(forward[78].packing, 0);
  assert.equal(forward[100].packing, 1);
  for (let i = 79; i <= 100; i++) assert.ok(forward[i].y > forward[i - 1].y);
});
