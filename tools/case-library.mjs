import { readFile } from "node:fs/promises";
import { SITE, esc } from "./lib.mjs";
import { page } from "./shell.mjs";
import { headingAnchors, makeRenderer, tableOfContents } from "./render.mjs";
import { csv, deliveryFlow, evidence, metricValue } from "./measurements.mjs";

const base = "/case-studies/";
export const simulationNotice = "Hypothetical engagement. The organisation, delivery events, and measurements are simulated.";

export const caseCategories = [
  ["architecture-audit", "Architecture audit", "Architecture", "A magnifying glass reveals a bottleneck in a layered system", "Find the constraint, gather enough evidence to make a decision, and hand the engineering team an ordered remediation plan."],
  ["legacy-modernisation", "Legacy modernisation", "Cloud Architecture", "A routing switch diverts work from a mainframe to modular services", "Replace one capability at a time. Protect data integrity, rehearse recovery, and define the conditions for retiring the old path."],
  ["ai-into-production", "AI into production", "Enterprise AI", "A model moves through a validation gate to production servers", "Measure quality, safety, cost and operability before giving a model or workflow production traffic."],
  ["team-enablement", "Team enablement", "Engineering Leadership", "Lab workstations share a training bench and an open runbook", "Turn instruction into a repeatable capability. Assess what participants can do unaided, including recovery and handover."],
].map(([id, title, topic, alt, description]) => ({ id, title, topic, alt, description }));

function readCase(raw, source) {
  const [title, ...lines] = raw.trim().split("\n");
  const fields = key => lines.filter(line => line.startsWith(`@${key} `)).map(line => line.slice(key.length + 2).split(" | "));
  const [[slug, description] = []] = fields("meta");
  const [flow = []] = fields("flow");
  const metrics = fields("metric");
  const [reference = []] = fields("ref");
  const markdown = lines.filter(line => !line.startsWith("@")).join("\n").trim();
  const expected = ["Situation and scope", "Plan and execution", "Rollout and handover", "How to read the numbers"];
  if (!/^[a-z\d-]+$/.test(slug || "") || !description || flow.length < 3 || metrics.length < 2 ||
      metrics.some(([label, unit, ...values]) => !label || !unit || values.length !== 2 || values.some(value => value.includes("/") && unit !== "%")) ||
      !reference[0] || !reference[1]?.startsWith("https://") ||
      expected.some(heading => !markdown.includes(`### ${heading}`))) {
    throw new Error(`Incomplete case study ${title} in ${source}`);
  }
  return { slug, title, description, flow, metrics, markdown, reference };
}

export async function caseLibrary(out, promotions) {
  const urls = [];
  for (const category of caseCategories) {
    const dir = base + category.id + "/";
    const source = `content/case-studies/${category.id}.md`;
    const raw = await readFile(source, "utf8");
    const cases = raw.split(/^## /m).slice(1).map(block => readCase(block, source));
    if (cases.length < 8 || cases.length > 10 || new Set(cases.map(item => item.slug)).size !== cases.length) {
      throw new Error(`Expected 8–10 unique case studies in ${source}`);
    }

    const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="${base}">Case studies</a>`;
    await out(dir.slice(1), page({
      title: category.title + " case studies",
      description: "Hypothetical engineering scenarios. " + category.description,
      path: dir,
      topic: category.topic,
      body: `<section class="section mesh"><div class="publication-wrap">
  ${crumbs}</nav>
  <h1 class="h-display">${esc(category.title)}</h1>
  <p class="lede field-intro">${esc(category.description)}</p>
  <p class="case-notice">These ${cases.length} worked examples use simulated organisations, events and results.</p>
</div></section>
<section class="publication-wrap case-library" aria-label="Scenarios">
  <div class="grid g-2 capability-grid">${cases.map(item => `<article class="guide-tile">
    <h2 class="h3"><a class="card-destination" href="${dir}${item.slug}/">${esc(item.title)}</a></h2>
    <p>${esc(item.description)}</p>
  </article>`).join("\n")}</div>
</section>`,
    }));
    urls.push(dir);

    for (const item of cases) {
      const route = dir + item.slug + "/";
      const dataPath = dir + item.slug + ".csv";
      const [referenceName, referenceLink] = item.reference;
      const { marked, headings } = makeRenderer();
      const caseCopy = headingAnchors(marked.parse(item.markdown.replace(/^### /gm, "## ")));
      await out(dataPath.slice(1), csv([
        ["metric", "unit", "baseline_input", "pilot_input", "baseline_value", "pilot_value", "data_origin"],
        ...item.metrics.map(([label, unit, baseline, pilot]) => [label, unit, baseline, pilot, metricValue(baseline), metricValue(pilot), "synthetic"]),
      ]));
      await out(route.slice(1), page({
        title: item.title,
        description: "Hypothetical engagement. " + item.description,
        path: route,
        type: "article",
        topic: category.topic,
        body: `<article class="article">
  <div class="reading-layout">
    <header class="article-head">
      ${crumbs}<span aria-hidden="true">/</span><a href="${dir}">${esc(category.title)}</a></nav>
      <h1 class="h1">${esc(item.title)}</h1>
      <p class="lede field-intro">${esc(item.description)}</p>
      <p class="case-notice">${simulationNotice}</p>
    </header>
    <div class="article-hero case-schematic" data-topic="${esc(category.topic)}">${deliveryFlow(item.flow)}</div>
    <div class="reader-aside">${tableOfContents(headings)}</div>
    <div class="article-copy">
      <div class="prose">${caseCopy}</div>
      ${evidence("Worked comparison", item.metrics)}
      <p class="case-download"><a href="${dataPath}" download>Download the simulated measurements (CSV)</a></p>
      <p class="case-download"><a href="${esc(referenceLink)}">${esc(referenceName)}</a></p>
      <div class="row"><a class="btn btn-ghost" href="${dir}">More ${esc(category.title.toLowerCase())} scenarios</a><a class="btn" href="/contact/">Discuss a similar engagement</a></div>
    </div>
    ${promotions("case-study-rail")}
  </div>
</article>`,
        jsonld: [{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: simulationNotice + " " + item.description,
          author: { "@type": "Organization", name: SITE.name, url: SITE.url },
          mainEntityOfPage: SITE.url + route,
        }],
      }));
      urls.push(route);
    }
  }
  return urls;
}
