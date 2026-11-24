import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import { SITE, esc, readingTime } from "./lib.mjs";
import { page } from "./shell.mjs";
import { copyLinkControl, readerControls } from "./reader.mjs";
import { headingAnchors, makeRenderer, tableOfContents } from "./render.mjs";
import { conceptCsv, conceptDetails, conceptSvg, validateConcept } from "./concept-figures.mjs";
import { renderEditorialPng } from "./raster-art.mjs";

export const SERVICE_IDS = Object.freeze([
  "cloud-modernisation", "resilient-it-operations", "finops-cost-governance", "devops-automation",
  "agentic-ai-workflows", "mlops-data-pipelines", "predictive-analytics", "ai-security-iam",
  "enterprise-middleware", "cloud-native-infrastructure", "software-engineering", "hands-on-lab-environments",
]);

export const SERVICE_CATEGORIES = Object.freeze({
  architecture: { title: "Architecture and operations", topic: "Cloud Architecture" },
  ai: { title: "AI and data engineering", topic: "Enterprise AI" },
  training: { title: "Engineering enablement", topic: "Engineering Leadership" },
});

export const serviceScenarioNotice = "Hypothetical industry scenario. The organisation and engagement are invented. Any numbers are synthetic inputs, not customer results or industry benchmarks.";
export const serviceMethodNotice = "Delivery methodology. The industry scenarios and numerical examples are illustrative; they do not describe named or unnamed customer engagements.";

const defaultDirectory = fileURLToPath(new URL("../content/services/", import.meta.url));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const markdown = new Marked();
const wordCount = text => (text.match(/\b[\w]+(?:[-’'][\w]+)*\b/g) || []).length;
const hash = value => createHash("sha256").update(value).digest("hex").slice(0, 12);

function fail(context, message) {
  throw new Error(`${context}: ${message}`);
}

function requiredText(value, context, max = 300) {
  if (typeof value !== "string" || !value.trim() || value.length > max) fail(context, `expected nonempty text of at most ${max} characters`);
}

function validHttps(value) {
  if (typeof value !== "string" || /[\u0000-\u0020]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function safeMarkdown(text, context, minWords, maxWords) {
  requiredText(text, context, 160000);
  const count = wordCount(text);
  if (count < minWords || count > maxWords) fail(context, `expected ${minWords}–${maxWords} words; received ${count}`);
  // The existing renderer accepts raw HTML. This content format deliberately
  // uses Markdown only, so a source file cannot inject active page markup.
  markdown.walkTokens(markdown.lexer(text), token => {
    if (token.type === "html") fail(context, "raw HTML is not supported; use Markdown");
    if (["link", "image"].includes(token.type)) {
      const href = token.href || "";
      if (!(validHttps(href) || /^\/(?!\/)[^\\\s]*$/.test(href) || /^#[a-z0-9-]+$/i.test(href))) {
        fail(context, `unsupported link target ${href}`);
      }
    }
  });
  if (!/^##\s+\S/m.test(text)) fail(context, "include descriptive level-two headings");
  return count;
}

function validateFigure(figure, expectedSlug) {
  if (!figure || typeof figure !== "object") fail(expectedSlug, "missing figure");
  validateConcept(figure);
  if (figure.slug !== expectedSlug) fail(expectedSlug, `figure slug must be ${expectedSlug}`);
  requiredText(figure.title, `${expectedSlug} figure title`, 70);
  requiredText(figure.alt, `${expectedSlug} figure alternative text`, 1000);
  requiredText(figure.method, `${expectedSlug} figure methodology`, 4000);
  if (figure.kind === "flow") {
    for (const step of figure.steps) {
      requiredText(step.label, `${expectedSlug} step label`, 28);
      requiredText(step.detail, `${expectedSlug} step detail`, 65);
    }
  } else {
    requiredText(figure.unit, `${expectedSlug} units`, 70);
    for (const point of figure.points) requiredText(point.label, `${expectedSlug} point label`, 28);
    if (new Set(figure.points.map(point => point.label)).size !== figure.points.length) fail(expectedSlug, "chart labels must be unique");
  }
}

/** Validate an authored service without changing its input object. */
export function validateService(service) {
  if (!service || typeof service !== "object" || !SERVICE_IDS.includes(service.id)) fail("Service", "unknown service id");
  const context = `Service ${service.id}`;
  requiredText(service.title, `${context} title`, 160);
  requiredText(service.description, `${context} description`, 600);
  if (!Object.hasOwn(SERVICE_CATEGORIES, service.category)) fail(context, "unknown category");
  safeMarkdown(service.methodology, `${context} methodology`, 1800, 12000);
  validateFigure(service.figure, `service-${service.id}`);
  if (!Array.isArray(service.references) || service.references.length < 2 || service.references.length > 24) fail(context, "expected 2–24 primary references");
  for (const reference of service.references) {
    requiredText(reference?.label, `${context} reference label`, 240);
    if (!validHttps(reference.url)) fail(context, "reference URLs must use HTTPS without credentials");
  }
  if (new Set(service.references.map(reference => reference.url)).size !== service.references.length) fail(context, "reference URLs must be unique");
  if (!Array.isArray(service.useCases) || service.useCases.length !== 5) fail(context, "expected exactly five industry scenarios");
  const ids = new Set();
  for (const item of service.useCases) {
    if (!item || typeof item.id !== "string" || item.id.length > 80 || !slugPattern.test(item.id) || item.id === "methodology" || ids.has(item.id)) fail(context, "scenario ids must be unique URL slugs of at most 80 characters; methodology is reserved");
    ids.add(item.id);
    requiredText(item.title, `${context}/${item.id} title`, 180);
    requiredText(item.industry, `${context}/${item.id} industry`, 120);
    requiredText(item.description, `${context}/${item.id} description`, 600);
    safeMarkdown(item.body, `${context}/${item.id} body`, 400, 700);
    validateFigure(item.figure, `service-${service.id}-${item.id}`);
  }
  return service;
}

/** Default loading is all-or-nothing: no partial service library is published. */
export async function loadServiceLibrary({ directory = defaultDirectory, expectedIds = SERVICE_IDS } = {}) {
  const folder = directory instanceof URL ? fileURLToPath(directory) : directory;
  if (!Array.isArray(expectedIds) || !expectedIds.length || new Set(expectedIds).size !== expectedIds.length || expectedIds.some(id => !SERVICE_IDS.includes(id))) {
    fail("Service library", "expectedIds must be unique known service ids");
  }
  const files = (await readdir(folder)).filter(file => file.endsWith(".json")).sort();
  const expectedFiles = expectedIds.map(id => `${id}.json`);
  const missing = expectedFiles.filter(file => !files.includes(file));
  const unexpected = files.filter(file => !expectedFiles.includes(file));
  if (missing.length || unexpected.length) fail("Service library", `missing files [${missing.join(", ")}]; unexpected files [${unexpected.join(", ")}]`);
  const services = await Promise.all(expectedIds.map(async id => {
    const file = path.join(folder, `${id}.json`);
    let service;
    try {
      service = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      throw new Error(`Cannot read service source ${file}: ${error.message}`, { cause: error });
    }
    if (service.id !== id) fail(file, `service id must match filename ${id}`);
    return validateService(service);
  }));
  return services;
}

export function servicePath(serviceId, caseId) {
  if (!SERVICE_IDS.includes(serviceId) || caseId !== undefined && (typeof caseId !== "string" || caseId.length > 80 || caseId === "methodology" || !slugPattern.test(caseId))) fail("Service path", "invalid service or scenario id");
  return `/services/${serviceId}/${caseId === undefined ? "" : `${caseId}/`}`;
}

export function servicePaths(services) {
  const routes = services.flatMap(service => [servicePath(service.id), ...service.useCases.map(item => servicePath(service.id, item.id))]);
  if (new Set(routes).size !== routes.length) fail("Service library", "duplicate page routes");
  return routes;
}

function imagePaths(service, item) {
  const stem = `/assets/services/${service.id}/${item ? item.id : "methodology"}`;
  return { hero: `${stem}.svg`, social: `${stem}-social.png`, data: `${stem}.csv` };
}

function illustration(service, item, { lazy = false } = {}) {
  const figure = item?.figure || service.figure;
  const paths = imagePaths(service, item);
  const version = hash(conceptSvg(figure));
  const alt = `${item ? "Hypothetical scenario. " : ""}${figure.alt}`;
  return `<img src="${paths.hero}?v=${version}" alt="${esc(alt)}" width="1280" height="720" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async">`;
}

/** A landing-page card; its destination is the detailed methodology. */
export function serviceCard(service, { heading = "h3" } = {}) {
  if (!["h2", "h3", "h4"].includes(heading)) fail("Service card", "unsupported heading level");
  return `<article class="card service-card" data-category="${esc(service.category)}" data-topic="${esc(SERVICE_CATEGORIES[service.category].topic)}">
  <div class="card-art">${illustration(service, null, { lazy: true })}</div>
  <div class="card-body"><p class="eyebrow">Delivery methodology · Five industry scenarios</p>
    <${heading} class="card-title"><a class="card-destination" href="${servicePath(service.id)}">${esc(service.title)}</a></${heading}>
    <p class="card-desc">${esc(service.description)}</p>
  </div></article>`;
}

function scenarioCards(service) {
  return `<section class="service-scenarios" aria-labelledby="service-scenarios-title">
    <h2 id="service-scenarios-title" class="h2">Five industry scenarios</h2>
    <p class="case-notice">These worked scenarios are hypothetical. Their figures explain assumptions and calculations, not customer outcomes.</p>
    <div class="grid g-2 capability-grid">${service.useCases.map(item => `<article class="card case-card service-case-card">
      <div class="card-art">${illustration(service, item, { lazy: true })}</div>
      <div class="card-body"><p class="eyebrow">Hypothetical · ${esc(item.industry)}</p>
        <h3 class="card-title"><a class="card-destination" href="${servicePath(service.id, item.id)}">${esc(item.title)}</a></h3>
        <p class="card-desc">${esc(item.description)}</p>
      </div></article>`).join("\n")}</div>
  </section>`;
}

function breadcrumbs(service, item) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span>
    <a href="/services/">Services</a><span aria-hidden="true">/</span>
    ${item ? `<a href="${servicePath(service.id)}">${esc(service.title)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(item.industry)}</span>` : `<span aria-current="page">${esc(service.title)}</span>`}
  </nav>`;
}

function referenceList(service) {
  return `<section class="prose service-references" aria-labelledby="service-references-title">
    <h2 id="service-references-title">Primary references</h2>
    <p>These sources support the engineering methods. They do not substantiate the hypothetical engagements or their invented numbers.</p>
    <ul>${service.references.map(reference => `<li><a href="${esc(reference.url)}" rel="noopener" target="_blank">${esc(reference.label)}</a></li>`).join("")}</ul>
  </section>`;
}

function readNext(service, item, services) {
  const index = item ? service.useCases.findIndex(candidate => candidate.id === item.id) : -1;
  const prior = service.useCases[index - 1], next = service.useCases[index + 1];
  const related = services.find(candidate => candidate.id !== service.id && candidate.category === service.category);
  return `<nav class="series-box depth-nav" aria-labelledby="service-read-next-title">
    <h2 id="service-read-next-title" class="h3">Continue reading</h2><ul class="series-list">
      ${item ? `<li><a href="${servicePath(service.id)}">Methodology · ${esc(service.title)}</a></li>` : ""}
      ${prior ? `<li><a href="${servicePath(service.id, prior.id)}">Previous scenario · ${esc(prior.title)}</a></li>` : ""}
      ${next ? `<li><a href="${servicePath(service.id, next.id)}">${item ? "Next scenario" : "Start with a scenario"} · ${esc(next.title)}</a></li>` : ""}
      ${related ? `<li><a href="${servicePath(related.id)}">Related service · ${esc(related.title)}</a></li>` : '<li><a href="/insights/">Explore engineering insights</a></li>'}
      <li><a href="/services/">All services and delivery methods</a></li>
    </ul></nav>`;
}

function callToAction(service) {
  return `<section class="section"><div class="art-wrap"><div class="cta-panel">
    <h2 class="h2">Plan your next engineering engagement</h2>
    <p class="lede">Discuss your constraints, evidence and desired outcome. Define scope, acceptance criteria and responsibilities before work begins.</p>
    <div class="row"><a class="btn" href="/contact/">Discuss your requirements</a><a class="btn btn-ghost" href="/services/">Explore all services</a></div>
  </div></div></section>`;
}

function renderDetail(service, item, services, promotions, socialVersion) {
  const route = servicePath(service.id, item?.id);
  const title = item?.title || service.title;
  const description = item ? `Hypothetical industry scenario. ${item.description}` : service.description;
  const source = item?.body || service.methodology;
  const figure = item?.figure || service.figure;
  const images = imagePaths(service, item);
  const { marked, headings } = makeRenderer();
  const copy = headingAnchors(marked.parse(source));
  const details = conceptDetails(figure).replace(`/field-guides/examples/${figure.slug}.csv`, images.data);
  // Include non-Markdown sections in the same navigation and reading order.
  const toc = [...headings,
    { id: "concept-method-title", text: figure.kind === "flow" ? "How to use the diagram" : "Chart methodology and values" },
    { id: "service-references-title", text: "Primary references" },
    ...(!item ? [{ id: "service-scenarios-title", text: "Five industry scenarios" }] : []),
    { id: "service-read-next-title", text: "Continue reading" },
  ];
  const body = `<article class="article service-detail${item ? " service-scenario" : " service-methodology"}" data-service="${service.id}"${item ? ` data-scenario="${item.id}"` : ""}>
  <div class="reading-layout"><header class="article-head">
    ${breadcrumbs(service, item)}
    <p class="eyebrow">${item ? `Hypothetical · ${esc(item.industry)}` : esc(SERVICE_CATEGORIES[service.category].title) + " · Delivery methodology"}</p>
    <h1 class="h1">${esc(title)}</h1><p class="lede field-intro">${esc(item?.description || service.description)}</p>
    <p class="case-notice" data-scenario-disclosure="${item ? "hypothetical" : "methodology"}">${item ? serviceScenarioNotice : serviceMethodNotice}</p>
    <div class="article-meta"><span>${readingTime(wordCount(source))} min read</span><span class="dot" aria-hidden="true"></span><a href="/about/">Ajna Consulting Services</a>${copyLinkControl()}</div>
  </header>
  <div class="article-hero depth-chart" data-topic="${esc(SERVICE_CATEGORIES[service.category].topic)}">${illustration(service, item)}</div>
  <div class="reader-aside">${tableOfContents(toc)}</div>
  <div class="article-copy"><div class="prose">${copy}</div>
    ${details}${referenceList(service)}${item ? "" : scenarioCards(service)}${readNext(service, item, services)}
  </div>${promotions(item ? "service-scenario-rail" : "service-methodology-rail")}
  </div>${callToAction(service)}${readerControls()}</article>`;
  const article = {
    "@context": "https://schema.org", "@type": "Article", headline: title,
    description: item ? `${serviceScenarioNotice} ${item.description}` : description,
    genre: item ? "Hypothetical industry scenario" : "Service delivery methodology",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: SITE.url + route,
    image: SITE.url + images.social + `?v=${socialVersion}`,
    about: { "@id": SITE.url + servicePath(service.id) + "#service", "@type": "Service", name: service.title, url: SITE.url + servicePath(service.id), provider: { "@type": "Organization", name: SITE.name, url: SITE.url } },
  };
  const serviceEntity = { "@context": "https://schema.org", "@type": "Service", "@id": SITE.url + route + "#service",
    name: service.title, serviceType: service.title, description: service.description, url: SITE.url + route,
    provider: { "@type": "Organization", "@id": SITE.url + "/#org", name: SITE.name, url: SITE.url } };
  return page({ title, description, path: route, body, type: "article", topic: SERVICE_CATEGORIES[service.category].topic,
    ogImage: `${images.social}?v=${socialVersion}`, imageWidth: 1200, imageHeight: 630,
    imageAlt: `${item ? "Hypothetical scenario. " : ""}${figure.alt}`, jsonld: item ? [article] : [article, serviceEntity] });
}

/** Render deterministically in memory; the caller controls when files publish. */
export function renderServiceLibrary(services, { promotions = () => "" } = {}) {
  if (!Array.isArray(services) || !services.length) fail("Service library", "no services supplied");
  services.forEach(validateService);
  const urls = servicePaths(services);
  const pages = [], assets = [], assetPaths = new Set();
  for (const service of services) {
    for (const item of [null, ...service.useCases]) {
      const figure = item?.figure || service.figure;
      const paths = imagePaths(service, item);
      const svg = conceptSvg(figure);
      const png = renderEditorialPng(conceptSvg(figure, 1200, 630));
      const entries = [{ path: paths.hero, contents: svg }, { path: paths.social, contents: png }];
      if (figure.kind !== "flow") entries.push({ path: paths.data, contents: conceptCsv(figure) });
      for (const asset of entries) {
        if (assetPaths.has(asset.path)) fail("Service library", `duplicate asset ${asset.path}`);
        assetPaths.add(asset.path);
        assets.push(asset);
      }
      pages.push({ path: servicePath(service.id, item?.id), contents: renderDetail(service, item, services, promotions, hash(png)), serviceId: service.id, caseId: item?.id || null });
    }
  }
  return { pages, assets, urls };
}

/** Adapter matching the existing build's out(relativePath, contents) callback. */
export async function publishServiceLibrary(out, services, options = {}) {
  const library = renderServiceLibrary(services, options);
  for (const asset of library.assets) await out(asset.path.slice(1), asset.contents);
  for (const document of library.pages) await out(document.path.slice(1), document.contents);
  return library.urls;
}
