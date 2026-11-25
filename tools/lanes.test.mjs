
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildLaneDirectory, laneFor, lanePath, lanes } from "./lanes.mjs";

const manifest = JSON.parse(readFileSync(new URL("../content/manifest.json", import.meta.url), "utf8"));
const live = manifest.filter(article => article.status === "published");

test("The complete queue maps to one engineering lane for each Insight", () => {
  const directory = buildLaneDirectory(manifest, live);
  const laneIds = new Set(lanes.map(lane => lane.id));
  assert.equal(new Set(lanes.map(lanePath)).size, lanes.length);
  for (const article of manifest) {
    const lane = directory.laneBySlug.get(article.slug);
    if (article.section === "notes") {
      assert.equal(lane, undefined);
      assert.equal(laneFor(article), null);
      continue;
    }
    assert.ok(laneIds.has(lane?.id), article.slug);
    assert.equal(lanePath(lane), "/learn/" + lane.id + "/");
  }
  const ordered = [...directory.liveByLane.values()].flat();
  assert.equal(ordered.length, live.filter(article => article.section === "insights").length);
  assert.equal(new Set(ordered.map(article => article.slug)).size, ordered.length);
  for (const lane of lanes) {
    assert.ok(directory.pathsByLane.get(lane.id).length >= 3);
    for (const { article, reason } of directory.pathsByLane.get(lane.id)) {
      assert.equal(laneFor(article), lane);
      assert.equal(article.status, "published");
      assert.ok(reason.length > 20);
    }
  }
});

test("Reliability continues the authored path and suggests distinct related reads", () => {
  const directory = buildLaneDirectory(manifest, live);
  const opener = live.find(article => article.slug === "sre-toil-reduction");
  const { next, related, seriesNext } = directory.continuationFor(opener);
  assert.equal(next.article.slug, "mttr-reduction-playbook");
  assert.match(next.reason, /incident evidence/);
  assert.equal(directory.continuationFor(next.article).next.article.slug, "chaos-engineering-practices");
  assert.deepEqual(related.map(({article}) => article.slug), [
    "observability-opentelemetry-2026", "trace-sampling-strategies"
  ]);
  assert.equal(seriesNext, false);
});

test("Series neighbors follow chapter order and only target available articles", () => {
  const directory = buildLaneDirectory(manifest, live);
  const article = live.find(item => item.slug === "platform-eng-idp-design");
  const { next, previous, seriesNext } = directory.continuationFor(article);
  assert.equal(next.article.slug, "platform-eng-self-service");
  assert.equal(previous.article.slug, "platform-eng-what-it-is");
  assert.equal(seriesNext, true);
  const restricted = buildLaneDirectory(manifest, live.filter(item => item.slug !== next.article.slug));
  const suggestions = restricted.continuationFor(article);
  assert.equal(suggestions.next.article.slug, "platform-eng-observability");
  assert.ok(!suggestions.related.some(({ article: item }) => item.slug === next.article.slug));
});

test("Every Continue and Related link targets a published page and continuation terminates", () => {
  for (const cohort of [live, manifest]) {
    const directory = buildLaneDirectory(manifest, cohort);
    const available = new Set(cohort.map(article => article.slug));
    const choices = new Map(cohort.map(article => [article.slug, directory.continuationFor(article)]));
    for (const article of cohort) {
      const recommendation = choices.get(article.slug);
      if (article.section === "notes") {
        assert.deepEqual(recommendation, { next: null, previous: null, related: [], seriesNext: false });
        continue;
      }
      const { next, previous, related, seriesNext } = recommendation;
      const distinct = new Set([article.slug, next?.article.slug, ...related.map(item => item.article.slug)]);
      assert.equal(distinct.size, related.length + 2, article.slug);
      for (const item of [next, previous, ...related].filter(Boolean)) {
        assert.ok(available.has(item.article.slug), item.article.slug);
        assert.notEqual(item.article.slug, article.slug);
        assert.ok(item.reason.length > 0);
      }
      if (next && !seriesNext) assert.equal(next.lane, laneFor(article));
      assert.ok(related.length <= 2);
      const visited = new Set([article.slug]);
      for (let target = next; target; target = choices.get(target.article.slug).next) {
        assert.ok(!visited.has(target.article.slug), "Reading loop from " + article.slug);
        visited.add(target.article.slug);
      }
    }
  }
});

