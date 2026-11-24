import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  SERVICE_IDS, loadServiceLibrary, publishServiceLibrary, renderServiceLibrary,
  serviceCard, servicePath, servicePaths, serviceScenarioNotice, validateService,
} from "./service-library.mjs";

function copy(words, title) {
  // Fixtures exercise rendering and length boundaries, not editorial content.
  return `## ${title}\n\n${Array.from({ length: words }, (_, i) => `evidence${i}`).join(" ")}\n\n## Acceptance checks\n\nCheck the outcome and preserve the input record.\n`;
}

function chart(slug) {
  return {
    slug, kind: "bar", title: "A synthetic completion comparison", unit: "completed tasks",
    points: [{ label: "Baseline", value: 6 }, { label: "Pilot", value: 9 }],
    method: "Synthetic cohorts each contain ten tasks. Six and nine tasks finish within the same deadline. No customer results are claimed.",
    alt: "Six of ten tasks finish at baseline and nine of ten in the illustrative pilot.",
    dataOrigin: "synthetic", steps: [],
  };
}

function fixture(id = "cloud-modernisation") {
  return {
    id, title: "Cloud modernisation", category: "architecture",
    description: "Assess dependencies, rehearse migration and verify recovery.",
    methodology: copy(1810, "Plan and measure the engagement"),
    figure: chart(`service-${id}`),
    references: [
      { label: "Google SRE: implementing SLOs", url: "https://sre.google/workbook/implementing-slos/" },
      { label: "PostgreSQL backup", url: "https://www.postgresql.org/docs/current/backup.html" },
    ],
    useCases: Array.from({ length: 5 }, (_, i) => ({
      id: `industry-${i + 1}`, title: `A hypothetical industry ${i + 1} migration`, industry: `Industry ${i + 1}`,
      description: "A hypothetical planning exercise with explicit synthetic evidence.",
      body: copy(420, "Situation and scope"),
      figure: chart(`service-${id}-industry-${i + 1}`),
    })),
  };
}

const clone = value => structuredClone(value);
let library;
function rendered() {
  library ||= renderServiceLibrary([fixture()], { promotions: placement => `<aside data-ad-slot="${placement}">Project reading</aside>` });
  return library;
}

test("schema enforces substantial methods, five complete scenarios and explicit numerical provenance", () => {
  const source = fixture(), snapshot = clone(source);
  assert.equal(validateService(source), source);
  assert.deepEqual(source, snapshot, "validation must not mutate authored content");
  const bad = [
    [service => { service.methodology = copy(1700, "Too short"); }, /methodology.*1800/],
    [service => { service.useCases.pop(); }, /exactly five/],
    [service => { service.useCases[1].id = service.useCases[0].id; }, /unique URL slugs/],
    [service => { service.useCases[0].id = "methodology"; }, /reserved/],
    [service => { service.useCases[0].body = copy(300, "Too short"); }, /400–700/],
    [service => { service.useCases[0].body = copy(710, "Too long"); }, /400–700/],
    [service => { service.useCases[0].figure.slug = "wrong"; }, /figure slug/],
    [service => { service.figure.dataOrigin = "measured"; }, /illustrative origin/],
    [service => { service.figure.points[0].value = -1; }, /invalid chart values/],
    [service => { service.figure.points[0].value = Infinity; }, /invalid chart values/],
    [service => { service.figure.points[0].label = "A label that is too long for the chart"; }, /point label/],
    [service => { service.references[0].url = "javascript:alert(1)"; }, /HTTPS/],
    [service => { service.references[0].url = "https://user:secret@example.com/"; }, /HTTPS/],
    [service => { service.references[1].url = service.references[0].url; }, /reference URLs must be unique/],
    [service => { service.category = "made-up"; }, /unknown category/],
    [service => { service.id = "../../escape"; }, /unknown service id/],
  ];
  for (const [mutate, error] of bad) {
    const service = fixture();
    mutate(service);
    assert.throws(() => validateService(service), error);
  }
});

test("Markdown permits technical code and safe links but rejects executable page content", () => {
  const service = fixture();
  service.methodology += '\n\n```html\n<script>example only</script>\n```\n\n[Contact](/contact/) and [Source](https://example.org/reference).';
  assert.doesNotThrow(() => validateService(service));
  for (const unsafe of ['<script>alert(1)</script>', '[Bad](javascript:alert)', '[Bad](//example.com/)']) {
    const broken = fixture();
    broken.methodology += `\n\n${unsafe}`;
    assert.throws(() => validateService(broken), /raw HTML|unsupported link target/);
  }
});

test("loader requires the complete declared inventory and verifies filename identities", async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ajna-service-library-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const expectedIds = ["cloud-modernisation"];
  await assert.rejects(loadServiceLibrary({ directory, expectedIds }), /missing files/);
  const filename = path.join(directory, "cloud-modernisation.json");
  await writeFile(filename, JSON.stringify(fixture()));
  const result = await loadServiceLibrary({ directory, expectedIds });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, expectedIds[0]);
  await assert.rejects(loadServiceLibrary({ directory }), /missing files/);
  await writeFile(path.join(directory, "orphan.json"), "{}");
  await assert.rejects(loadServiceLibrary({ directory, expectedIds }), /unexpected files.*orphan/);
  await rm(path.join(directory, "orphan.json"));
  await writeFile(filename, JSON.stringify(fixture("resilient-it-operations")));
  await assert.rejects(loadServiceLibrary({ directory, expectedIds }), /must match filename/);
});

test("all twelve services produce 72 unique canonical detail routes", () => {
  const services = SERVICE_IDS.map(id => fixture(id));
  const routes = servicePaths(services);
  assert.equal(routes.length, 72);
  assert.equal(new Set(routes).size, 72);
  assert.ok(routes.every(route => /^\/services\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)?$/.test(route)));
  assert.equal(servicePath("cloud-modernisation"), "/services/cloud-modernisation/");
  assert.throws(() => servicePath("cloud-modernisation", "../escape"), /invalid service or scenario id/);
  assert.throws(() => servicePath("cloud-modernisation", null), /invalid service or scenario id/);
  assert.throws(() => servicePaths([fixture(), fixture()]), /duplicate page routes/);
});

test("methodology cards lead to five illustrated scenarios and the exact CSV downloads emitted", () => {
  const result = rendered(), method = result.pages.find(document => !document.caseId);
  assert.equal(result.pages.length, 6);
  assert.equal(result.assets.length, 18);
  assert.match(method.contents, /Five industry scenarios/);
  assert.equal((method.contents.match(/class="card case-card service-case-card"/g) || []).length, 5);
  const paths = new Set(result.assets.map(asset => asset.path));
  for (const document of result.pages) {
    for (const [, source] of document.contents.matchAll(/(?:src|href)="(\/assets\/services\/[^"?#]+)(?:\?[^"#]*)?"/g)) {
      assert.ok(paths.has(source), `Missing service asset ${source}`);
    }
    assert.doesNotMatch(document.contents, /\/field-guides\/examples\/service-/);
    assert.match(document.contents, /Chart methodology and values/);
    assert.match(document.contents, /Read the chart values/);
    assert.match(document.contents, /Synthetic worked example/);
    assert.match(document.contents, /<strong>6 completed tasks<\/strong>/);
    assert.match(document.contents, /<strong>9 completed tasks<\/strong>/);
  }
  for (const item of fixture().useCases) assert.ok(method.contents.includes(`href="${servicePath("cloud-modernisation", item.id)}"`));
  const card = serviceCard(fixture());
  assert.match(card, /href="\/services\/cloud-modernisation\/"/);
  assert.match(card, /loading="lazy"/);
  assert.throws(() => serviceCard(fixture(), { heading: "script" }), /heading level/);
});

test("scenario pages disclose fiction in visible text, metadata and structured data", () => {
  for (const document of rendered().pages.filter(page => page.caseId)) {
    assert.ok(document.contents.includes(serviceScenarioNotice));
    assert.match(document.contents, /data-scenario-disclosure="hypothetical"/);
    assert.match(document.contents, /<meta property="og:description" content="Hypothetical industry scenario\./);
    assert.match(document.contents, /"genre":"Hypothetical industry scenario"/);
    assert.match(document.contents, /alt="Hypothetical scenario\./);
    assert.doesNotMatch(document.contents, /NDA|confidential customer|real customer outcomes/i);
    assert.match(document.contents, /href="\/services\/cloud-modernisation\/"/);
    assert.match(document.contents, /href="\/contact\/"/);
    assert.match(document.contents, /data-ad-slot="service-scenario-rail"/);
  }
});

test("reading controls and table-of-contents targets are unique and present", () => {
  for (const document of rendered().pages) {
    const html = document.contents;
    for (const id of ["copyLink", "readerBtn", "focusBtn", "readerPanel", "concept-method-title"]) {
      assert.equal((html.match(new RegExp(`id="${id}"`, "g")) || []).length, 1, `${document.path}: ${id}`);
    }
    const toc = html.match(/<nav class="toc"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(toc, `${document.path}: missing table of contents`);
    for (const [, id] of toc.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`));
    assert.match(html, /aria-current="page"/);
    assert.match(html, /Continue reading/);
  }
  const cases = rendered().pages.filter(page => page.caseId);
  assert.doesNotMatch(cases[0].contents, /Previous scenario/);
  assert.match(cases[0].contents, /Next scenario/);
  assert.match(cases.at(-1).contents, /Previous scenario/);
  assert.doesNotMatch(cases.at(-1).contents, /Next scenario/);
});

test("hero and social image dimensions are explicit and the PNG is a real raster artifact", () => {
  const result = rendered();
  for (const asset of result.assets) {
    if (asset.path.endsWith(".svg")) assert.match(asset.contents, /width="1280" height="720"/);
    if (asset.path.endsWith(".png")) {
      assert.ok(Buffer.isBuffer(asset.contents));
      assert.equal(asset.contents.subarray(1, 4).toString(), "PNG");
      assert.equal(asset.contents.readUInt32BE(16), 1200);
      assert.equal(asset.contents.readUInt32BE(20), 630);
      assert.ok(asset.contents.length > 1000);
    }
  }
  for (const document of result.pages) {
    assert.match(document.contents, /og:image:type" content="image\/png"/);
    assert.match(document.contents, /og:image:width" content="1200"/);
    assert.match(document.contents, /og:image:height" content="630"/);
    assert.match(document.contents, /fetchpriority="high"/);
  }
});

test("conceptual service diagrams expose steps without broken CSV links", () => {
  const service = fixture();
  service.figure = {
    slug: `service-${service.id}`, kind: "flow", title: "A reviewed migration sequence", unit: "", points: [],
    method: "Conceptual sequence. Each stage has an acceptance decision before the next begins.",
    alt: "Discover, rehearse and verify a migration.", dataOrigin: "conceptual",
    steps: [{ label: "Discover", detail: "Map dependencies and ownership." }, { label: "Rehearse", detail: "Test the migration and restoration." }, { label: "Verify", detail: "Reconcile outcomes and hand over." }],
  };
  const result = renderServiceLibrary([service]);
  assert.equal(result.assets.length, 17);
  const method = result.pages[0].contents;
  assert.match(method, /How to use the diagram/);
  assert.match(method, /Read the steps/);
  assert.match(method, /Conceptual illustration/);
  assert.doesNotMatch(method, /methodology\.csv/);
});

test("publication writes assets before pages through the existing relative-path callback", async () => {
  const written = [];
  const urls = await publishServiceLibrary(async (path, contents) => written.push({ path, contents }), [fixture()]);
  assert.equal(urls.length, 6);
  assert.equal(written.length, 24);
  assert.ok(written.every(file => !file.path.startsWith("/")));
  assert.ok(written.slice(0, 18).every(file => file.path.startsWith("assets/services/")));
  assert.ok(written.slice(18).every(file => file.path.startsWith("services/")));
});
