/* Checks the generated site before it ships. Run by CI on every build. */
import { readFile, readdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { markFile } from "./mark.mjs";
import { seriesSlug } from "./lib.mjs";
import { publicationDate } from "./publication.mjs";
import { fieldGuides, worksheetCsv } from "./field-guides.mjs";
import { models } from "../assets/js/field-math.mjs";
import { caseCategories } from "./case-library.mjs";
import { topicPath } from "./discovery.mjs";
import { loadDeepDives } from "./deep-dives.mjs";

let failures = 0;
const fail = (m) => { console.error("  ✗ " + m); failures++; };
const ok = (m) => console.log("  ✓ " + m);

const manifest = JSON.parse(await readFile("content/manifest.json", "utf8"));
const TODAY = publicationDate();
const live = manifest.filter(m => m.date <= TODAY);
const queued = manifest.filter(m => m.date > TODAY);

console.log("\nStructure");
for (const f of [".nojekyll", "index.html", "404.html", "robots.txt", "sitemap.xml", "feed.xml",
                 "CNAME", "assets/css/site.css", "assets/js/site.js",
                 "services/index.html", "insights/index.html", "contact/index.html", "field-guides/index.html",
                 "privacy/index.html", "terms/index.html", "about/index.html"]) {
  try { await access(f, constants.R_OK); } catch { fail(`missing ${f}`); }
}
if (!failures) ok("all required pages present");

if ((await readFile("CNAME", "utf8")).trim() !== "ajnacs.com") fail("CNAME no longer points at ajnacs.com");
else ok("CNAME intact (custom domain preserved)");

console.log("\nContent");
const dirs = (await readdir("insights", { withFileTypes: true })).filter(d => d.isDirectory());
const liveInsights = live.filter(m => m.section === "insights");
if (dirs.length !== liveInsights.length) fail(`insights on disk (${dirs.length}) != manifest live (${liveInsights.length})`);
else ok(`${dirs.length} insight pages match the manifest`);

// Nothing scheduled may leak into the built site.
let leaked = 0;
for (const m of queued) {
  try { await access(path.join(m.section === "notes" ? "notes" : "insights", m.slug, "index.html")); leaked++; } catch {}
}
if (leaked) fail(`${leaked} scheduled articles were published early`);
else ok(`${queued.length} scheduled articles correctly withheld`);

console.log("\nDiscovery");
{
  const robots = await readFile("robots.txt", "utf8");
  const groups = robots.split(/\n\n+/);
  const general = groups.find(group => group.includes("User-agent: *")) || "";
  const restricted = groups.find(group => group.includes("User-agent: GPTBot")) || "";
  if (!general.includes("Allow: /\n") || !["/content/", "/tools/", "/docs/", "/brand-lab/"].every(route => general.includes(`Disallow: ${route}`))) fail("public and internal crawler paths are misconfigured");
  if (!restricted.endsWith("Disallow: /") || !["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"].every(agent => restricted.includes(`User-agent: ${agent}\n`))) fail("training and dataset crawler group is incomplete");
  if (/User-agent: (?:Googlebot|bingbot|OAI-SearchBot|Claude-SearchBot)\b/i.test(restricted)) fail("search crawler included in the training block");
  const sitemap = await readFile("sitemap.xml", "utf8");
  const urls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]));
  for (const m of live) {
    const route = `https://ajnacs.com/${m.section}/${m.slug}/`;
    if (!urls.has(route) || !sitemap.includes(`<loc>${route}</loc><lastmod>${m.modified || m.date}</lastmod>`)) fail(`sitemap URL or date missing: ${m.slug}`);
    if (m.section === "insights" && m.editorialRevision) {
      const text = await readFile(`content/insights/${m.slug}.md`, "utf8");
      if (!text.includes("## What to measure") || !text.includes("Illustrative measurement.")) fail(`edited insight missing a labelled measurement: ${m.slug}`);
    }
  }
  if (!urls.has("https://ajnacs.com/field-guides/")) fail("field guide archive missing from sitemap");
  if ([...urls].some(url => url.includes('?') || url.endsWith('404.html'))) fail("sitemap contains a filter or error URL");
  if (!failures) ok("crawler rules, article sitemap dates and labelled evidence checked");
}

console.log("\nField guides");
{
  const expected = new Map([["toil", [24, 11]], ["onboarding", [30, 6.5]], ["unitCost", [.2, .14]]]);
  for (const guide of fieldGuides.filter(guide => liveInsights.some(m => m.slug === guide.slug))) {
    const html = await readFile(`insights/${guide.slug}/index.html`, "utf8");
    const csv = await readFile(`field-guides/${guide.slug}.csv`, "utf8");
    const sample = Object.fromEntries(guide.inputs.map(([key, , value]) => [key, value]));
    const chart = models[guide.key](sample).chart;
    if (!html.includes('id="measurement-worksheet"') || !html.includes('id="methodology"') ||
        !html.includes("Illustrative data") || !html.includes(`data-field-worksheet="${guide.key}"`)) {
      fail(`worksheet with labelled evidence missing: ${guide.slug}`);
    }
    if (csv !== worksheetCsv(guide) || chart.some((value, index) => value !== expected.get(guide.key)[index])) {
      fail(`worked inputs and chart disagree: ${guide.slug}`);
    }
  }
  if (!failures) ok("worksheets, methodology, worked results and CSVs checked");
}

console.log("\nCase studies and article discovery");
{
  let count = 0;
  const caseImages = new Set();
  for (const { id } of caseCategories) {
    const folder = `case-studies/${id}`;
    const routes = (await readdir(folder, { withFileTypes: true })).filter(entry => entry.isDirectory());
    if (routes.length < 8 || routes.length > 10) fail(`${id} must publish 8–10 case studies`);
    const categoryHtml = await readFile(`${folder}/index.html`, "utf8");
    for (const route of routes) {
      const path = `${folder}/${route.name}`;
      const html = await readFile(`${path}/index.html`, "utf8");
      const csv = await readFile(`${path}.csv`, "utf8");
      const image = await readFile(`assets/cases/${route.name}.png`);
      const hash = createHash("sha256").update(image).digest("hex");
      if (caseImages.has(hash) || image.readUInt32BE(16) !== 960 || image.readUInt32BE(20) !== 540 ||
          !html.includes(`<img src="/assets/cases/${route.name}.png?v=${hash.slice(0, 12)}"`) ||
          !categoryHtml.includes(`<img src="/assets/cases/${route.name}.png?v=${hash.slice(0, 12)}"`)) {
        fail(`case art missing, wrong size or duplicated: ${path}`);
      }
      caseImages.add(hash);
      if (!html.includes("Hypothetical engagement") || !html.includes("Simulated figures") ||
          !html.includes('class="delivery-flow"') || !csv.includes('"synthetic"') ||
          !categoryHtml.includes(`href="/${path}/"`) || !html.includes('aria-label="Study paths"')) fail(`case study or supporting evidence missing: ${path}`);
      count++;
    }
  }
  const tags = new Set(live.flatMap(article => article.tags));
  const paths = new Set([...tags].map(tag => topicPath(tag, tags)));
  if (tags.size !== paths.size) fail("Tag pages collide after URL normalisation");
  for (const route of paths) {
    const html = await readFile(`.${route}index.html`, "utf8");
    if (!html.includes("Start with ") || !html.includes('class="card-destination"')) fail(`Topic page has no detailed article links: ${route}`);
  }
  const fieldSlugs = new Set(fieldGuides.map(guide => guide.slug));
  const revised = live.filter(article => article.date <= "2026-11-23");
  for (const article of revised) {
    const html = await readFile(`${article.section}/${article.slug}/index.html`, "utf8");
    if (!html.includes('aria-label="Study paths"')) fail(`Study path missing: ${article.slug}`);
    if (!/<div class="article-hero"[^>]*><img[^>]* alt="[^"]+"/.test(html)) fail(`Cover description missing: ${article.slug}`);
    if (!fieldSlugs.has(article.slug) && !html.includes('id="worked-example"')) fail(`Worked example missing: ${article.slug}`);
    if (article.section === "insights" && !html.includes('class="refs-title"')) fail(`References missing: ${article.slug}`);
    if (article.tags.some(tag => !html.includes(`href="${topicPath(tag, tags)}"`))) fail(`Topic links missing: ${article.slug}`);
  }
  if (!failures) ok(`${count} case studies, ${revised.length} archive revisions, ${caseImages.size} case illustrations and ${tags.size} topic paths verified`);
}

console.log("\nDeep dives");
{
  const { tracks } = await loadDeepDives();
  const indexed = await readFile("sitemap.xml", "utf8");
  const hub = await readFile("deep-dives/index.html", "utf8");
  const images = new Set();
  if (!indexed.includes("<loc>https://ajnacs.com/deep-dives/</loc>")) fail("Deep-dive hub missing from sitemap");
  for (const track of tracks) {
    const paths = await readFile(`.${track.path}index.html`, "utf8");
    if (!hub.includes(`href="${track.path}"`) || !paths.includes(`href="/${track.start}/"`)) fail(`Study path entry missing: ${track.id}`);
    for (const [index, lesson] of track.lessons.entries()) {
      const html = await readFile(`.${lesson.path}index.html`, "utf8");
      const data = await readFile(`.${lesson.path}chart.csv`, "utf8");
      const asset = `assets/deep-dives/${track.id}-${lesson.slug}.png`;
      const png = await readFile(asset);
      const hash = createHash("sha256").update(png).digest("hex");
      if (!indexed.includes(`<loc>https://ajnacs.com${lesson.path}</loc>`) ||
          !paths.includes(`href="${lesson.path}"`) || !html.includes(`Level ${lesson.level} ·`) ||
          !html.includes(`href="${lesson.path}chart.csv"`) || !html.includes(`<div class="article-hero depth-chart"><img src="/${asset}?v=${hash.slice(0, 12)}"`) ||
          !html.includes("Limits of the example") || !html.includes("The chart uses illustrative inputs.") ||
          !html.includes(`href="${track.lessons[index - 1]?.path || "/" + track.start + "/"}"`) ||
          (track.lessons[index + 1] && !html.includes(`href="${track.lessons[index + 1].path}"`)) ||
          data.trimEnd().split("\n").length !== lesson.points.length + 1 ||
          png.readUInt32BE(16) !== 1000 || png.readUInt32BE(20) !== 370 || images.has(hash)) {
        fail(`Missing lesson, chart data, source path or navigation: ${lesson.path}`);
      }
      images.add(hash);
    }
  }
  const audit = await readFile("docs/deep-dive-coverage.csv", "utf8");
  if (audit.trimEnd().split("\n").length !== 131) fail("Editorial coverage must record all 130 source entries");
  if (!failures) ok(`${tracks.length} paths with ${images.size} distinct visual examples and downloadable chart data`);
}

console.log("\nQuality");
let noDesc = 0, noTitle = 0, badCanon = 0, noJsonLd = 0, orphanHero = 0;
for (const d of dirs) {
  const html = await readFile(`insights/${d.name}/index.html`, "utf8");
  if (!/<meta name="description" content="[^"]{40,}"/.test(html)) noDesc++;
  if (!/<title>.{15,}<\/title>/.test(html)) noTitle++;
  if (!html.includes(`<link rel="canonical" href="https://ajnacs.com/insights/${d.name}/">`)) badCanon++;
  if (!html.includes("application/ld+json")) noJsonLd++;
  if (!html.includes("article-hero")) orphanHero++;
}
if (noDesc) fail(`${noDesc} articles have a thin or missing meta description`); else ok("every article has a meta description");
if (noTitle) fail(`${noTitle} articles have no usable title`); else ok("every article has a title");
if (badCanon) fail(`${badCanon} articles have a wrong canonical URL`); else ok("canonical URLs correct");
if (noJsonLd) fail(`${noJsonLd} articles lack structured data`); else ok("structured data on every article");
if (orphanHero) fail(`${orphanHero} articles have no hero artwork`); else ok("artwork on every article");

console.log("\nIntegrity");
const home = await readFile("index.html", "utf8");
if (!home.includes("cdn.tailwindcss.com")) ok("no Tailwind CDN (production warning gone)");
else fail("Tailwind CDN is back in index.html");

const contact = await readFile("contact/index.html", "utf8");
if (contact.includes("https://formspree.io/f/")) ok("contact form posts to Formspree");
else fail("contact form has lost its Formspree endpoint");
if (contact.includes("novalidate")) ok("form uses its own validation");
else fail("form lost novalidate; inline errors will not show");
if (!/mailto:[^"]*\?subject=/.test(contact)) ok("no mailto-only fallback masquerading as a form");

// Third-party marks must not come back.
try {
  const imgs = await readdir("images");
  const marks = imgs.filter(f => /^client\d/.test(f));
  if (marks.length) fail(`third-party logos present in images/: ${marks.join(", ")}`);
  else ok("no third-party client logos in the repo");
} catch {}

const css = await readFile("assets/css/site.css", "utf8");
const braces = (css.match(/{/g) || []).length - (css.match(/}/g) || []).length;
if (braces !== 0) fail(`site.css braces unbalanced by ${braces}`); else ok("site.css is well formed");
// Only declaration values can hold a colour. Scanning the whole file also
// catches id selectors like #readBar, which are not colours at all.
{
  const decls = css.replace(/\/\*[\s\S]*?\*\//g, "")
    .match(/:[^;{}]+[;}]/g) || [];
  const bad = decls.flatMap(d => (d.match(/#[0-9a-zA-Z]+/g) || []))
    .filter(h => !/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(h));
  if (bad.length) fail(`site.css has ${bad.length} invalid hex colour(s): ${[...new Set(bad)].slice(0, 5).join(", ")}`);
  else ok("no invalid colour tokens");
}

// The article's blocks all take their width from one container. If any of
// them goes back to a different wrapper, the body text stops lining up with
// the title and the page visibly steps sideways as you scroll it.
{
  let drift = 0;
  for (const d of dirs.slice(0, 12)) {
    const h = await readFile(`insights/${d.name}/index.html`, "utf8");
    const art = h.slice(h.indexOf("<article"), h.indexOf("</article>"));
    if (/wrap-narrow/.test(art)) drift++;
  }
  if (drift) fail(`${drift} article(s) still mix wrap-narrow into the article column`);
  else ok("article blocks share one column");
  if (!/--art-col:/.test(css)) fail("--art-col is gone; the article column is undefined");
  else ok("article column width is tokenised");
}

// The mobile reading order follows the DOM. Promotions occupy one slot
// after the article or listing, and the desktop grid moves that same slot.
const promotionPlacements = new Map([
  ["insights/index.html", "insights-rail"],
  ["notes/index.html", "notes-rail"],
  ["series/index.html", "series-rail"],
  ...live.map(m => [`${m.section}/${m.slug}/index.html`, "article-rail"]),
  ...live.filter(m => m.series).map(m => [`series/${seriesSlug(m.series)}/index.html`, "series-chapters-rail"]),
]);
let promotionErrors = 0;
for (const [file, placement] of promotionPlacements) {
  const html = await readFile(file, "utf8");
  const slots = [...html.matchAll(/<aside class="writing-promos" aria-label="Promotions" data-ad-slot="([^"]+)">([\s\S]*?)<\/aside>/g)];
  const [slot] = slots;
  const article = placement === "article-rail";
  if (slots.length !== 1 || slot[1] !== placement ||
      !slot[2].includes('href="https://www.techknowen.com/"') ||
      !slot[2].includes("Coming soon") || !slot[2].includes('href="/projects/ziggle/"') || slot[2].match(/<a\b/g)?.length !== 2 ||
      (article && (!html.includes('class="reading-layout"') || slot.index < html.indexOf('class="article-copy"')))) {
    fail(`${file}: invalid publication layout or house promotion`);
    promotionErrors++;
  }
}
if (!promotionErrors) ok("one house promotion slot per writing page, after the content in DOM order");

console.log("\nBrand & reader");
{
  for (const f of ["images/ajna-mark.svg", "images/favicon.ico", "images/apple-touch-icon.png", "images/icon-512.png"]) {
    try { await access(f, constants.R_OK); } catch { fail(`missing ${f}`); }
  }
  const shell = await readFile(`insights/${dirs[0].name}/index.html`, "utf8");
  if (/ajna-logo\.png/.test(shell)) fail("the retired logo is still referenced");
  else ok("mark and icon set in place");
  const localFonts=await readFile('assets/fonts/fonts.css','utf8');
  if (!/href="\/assets\/fonts\/fonts\.css/.test(shell)||!/font-family:\s*['"]?Quintessential/.test(localFonts)) fail("the local wordmark face is not being loaded");
  else ok("wordmark face loaded from local licensed fonts");

  // Reading preferences are offered on every article; the chapter bar only
  // where there is enough article to navigate.
  let noPanel = 0, barOnShort = 0, noBarOnLong = 0;
  for (const m of live) {
    const dir = m.section === "notes" ? "notes" : "insights";
    let h; try { h = await readFile(`${dir}/${m.slug}/index.html`, "utf8"); } catch { continue; }
    if (!/id="readerPanel"/.test(h)) noPanel++;
    const longForm = Boolean(m.series) || m.words > 1200;
    const hasBar = /id="chapterBar"/.test(h);
    if (hasBar && !longForm) barOnShort++;
    if (!hasBar && longForm) noBarOnLong++;
  }
  if (noPanel) fail(`${noPanel} article(s) without reading settings`);
  else ok("reading settings on every article");
  if (barOnShort || noBarOnLong) fail(`chapter bar misapplied (${barOnShort} short with, ${noBarOnLong} long without)`);
  else ok("chapter bar only on long-form");
  if (!/\[data-theme="sepia"\]/.test(css)) fail("the sepia ground is gone");
  else ok("three reading grounds defined");

  // .card{display:flex} out-specifies the UA's [hidden] rule. Without an
  // !important reset the insights filters set the attribute on every
  // non-matching card and nothing disappears.
  if (!/\[hidden\]\{display:none!important\}/.test(css)) fail("[hidden] reset is gone; the filters will look inert");
  else ok("hidden elements actually hide");
  if (!/--art-scale/.test(css)) fail("--art-scale is gone; headings stop following the text-size control");
  else ok("article type scales as one");

  // A mistyped unit makes the browser drop the whole gradient silently, and
  // the section just renders flat. Nothing else in the build catches it.
  const badAngle = (css.match(/(?:linear|conic)-gradient\(\s*-?[\d.]+(?!deg|grad|rad|turn|%)[a-z]+/gi) || []);
  if (badAngle.length) fail(`${badAngle.length} gradient(s) with a bad angle unit: ${badAngle.slice(0, 3).join(", ")}`);
  else ok("gradient angles are well formed");
  for (const t of ["--page", "--lift"]) {
    if (!css.includes(t + ":")) fail(`${t} is gone; dark surfaces stop lifting off the ground`);
  }
  if (/--page:/.test(css) && /--lift:/.test(css)) ok("dark elevation tokens present");

  // parseInline already entity-encodes, so escaping again on the way into the
  // contents list printed a literal &quot; on the page.
  let doubled = 0;
  for (const d of dirs.slice(0, 20)) {
    const h = await readFile(`insights/${d.name}/index.html`, "utf8");
    const m = h.match(/<nav class="toc"[\s\S]*?<\/nav>/);
    if (m && /&amp;(quot|amp|lt|gt|#39);/.test(m[0])) doubled++;
  }
  if (doubled) fail(`${doubled} contents list(s) with double-escaped entities`);
  else ok("contents lists are not double-escaped");
}

console.log("\nAssets");
{
  // Every local reference in a built page has to resolve. An article that
  // names an image ingest never copied ships a broken figure, and nothing
  // else in the pipeline notices.
  const { readdir: rd } = await import("node:fs/promises");
  const walk = async (dir) => {
    const out = [];
    for (const e of await rd(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...await walk(full));
      else if (e.name.endsWith(".html")) out.push(full);
    }
    return out;
  };
  const pages = await walk(".");
  const resolve = async (p) => {
    const clean = decodeURIComponent(p.replace(/^\//, "").split("#")[0].split("?")[0]) || "index.html";
    for (const cand of [clean, path.join(clean, "index.html")]) {
      try { await access(cand, constants.R_OK); return true; } catch {}
    }
    return false;
  };
  const broken = [];
  let refs = 0;
  for (const f of pages) {
    const h = await readFile(f, "utf8");
    for (const m of h.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const u = m[1];
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(u)) continue;
      refs++;
      if (!(await resolve(u))) broken.push(`${f} -> ${u}`);
    }
  }
  if (broken.length) fail(`${broken.length} broken local reference(s): ${broken.slice(0, 3).join("; ")}`);
  else ok(`${refs} local references all resolve`);

  // og:image lives in a meta content attribute, so the href/src sweep above
  // never sees it. Every card a page points at has to exist, and it has to
  // be a raster format: no major platform renders SVG for a social preview.
  const cards = new Set();
  for (const f of pages) {
    const h = await readFile(f, "utf8");
    for (const m of h.matchAll(/(?:og:image|twitter:image)" content="[^"]*?(\/assets\/(?:og|covers)\/[^"]+)"/g)) cards.add(m[1]);
  }
  const missingCards = [];
  for (const c of cards) { try { await access(c.replace(/^\//, "").split(/[?#]/)[0], constants.R_OK); } catch { missingCards.push(c); } }
  if (missingCards.length) fail(`${missingCards.length} social card(s) missing: ${missingCards.slice(0, 4).join(", ")}`);
  else ok(`${cards.size} social cards all present`);
  const svgCards = [...cards].filter(c => c.endsWith(".svg"));
  if (svgCards.length) fail(`${svgCards.length} social card(s) still SVG; no platform renders those`);
  else ok("social cards are a raster format");

  // Browsers ask for /favicon.ico at the root whatever the link tags say.
  try {
    await access("favicon.ico", constants.R_OK);
    const [root, src] = await Promise.all([readFile("favicon.ico"), readFile("images/favicon.ico")]);
    if (!root.equals(src)) fail("the root favicon.ico has drifted from images/favicon.ico");
    else ok("root favicon.ico present and in sync");
  } catch { fail("no favicon.ico at the site root"); }

  // The mark must actually be four petals. It renders from a CSS custom
  // property inside the page and from a baked transform outside it; when the
  // still variant lost its transforms, every standalone render collapsed to
  // one triangle and nothing noticed.
  const markSvg = await readFile("images/ajna-mark.svg", "utf8");
  const spins = (markSvg.match(/rotate\(\d+ 50 50\)/g) || []).length;
  if (spins !== 4) fail(`ajna-mark.svg has ${spins} baked rotations, expected 4 — the mark will render as one petal`);
  else ok("standalone mark carries its own rotations");

  // Everything with the mark on it - the SVG icon, the .ico, the touch
  // icons - is generated from markFile(), but by a script that needs a
  // browser and so does not run in the build. The <head>'s cache-busting
  // version is computed from markFile() and moves the moment the mark does,
  // which is exactly how a redrawn mark once shipped under a fresh version
  // with every icon still showing the old one. The stamp closes that.
  {
    const want = createHash("sha256").update(markFile(512)).digest("hex");
    let stamp = "";
    try { stamp = (await readFile("images/.mark-hash", "utf8")).trim(); } catch {}
    if (markSvg !== markFile(512)) fail("images/ajna-mark.svg is not what tools/mark.mjs draws - run `node tools/icons.mjs`");
    else if (stamp !== want) fail("the mark has changed since the icons were built - run `node tools/icons.mjs`");
    else ok("every icon is built from the current mark");
  }

  // The bloom was rewritten once and the old version left in place below
  // it, so the stale rules won the cascade: on hover the four facets still
  // pushed apart inside a bud that was shrinking around them. One
  // definition, or the mark opens a hole in itself again.
  {
    const keyframes = (css.match(/@keyframes am-[a-z-]+/g) || []);
    const dupes = keyframes.filter((k, i) => keyframes.indexOf(k) !== i);
    const pushes = (css.match(/\.am-petal\s*\{[^}]*translate\(/g) || []).length
                 + (css.match(/is-open[^{]*\.am-petal/g) || []).length;
    if (dupes.length) fail(`the mark defines ${[...new Set(dupes)].join(", ")} more than once`);
    else if (pushes) fail("the mark's facets are pushed apart on open - the old bloom is back");
    else if (css.includes("am-heart")) fail("am-heart is styled but the mark no longer draws one");
    else if (keyframes.length || /\.brand:(?:hover|focus-visible)[^{]*\.ajna-mark/.test(css)) fail("the old CSS bloom competes with the selected motion controller");
    else {
      const motion = await readFile("assets/js/brand-motion.mjs", "utf8");
      const shell = await readFile("tools/shell.mjs", "utf8");
      const liveMark = (await import("./mark.mjs")).mark();
      if ((liveMark.match(/class="am-leaf"/g) || []).length !== 8) fail("selected Option B must draw eight leaves around its intact diamond");
      else if (!motion.includes("springStep") || !motion.includes("prefers-reduced-motion") || !motion.includes("clearTimeout(this.timer)")) fail("the bloom lost coordinated, interruptible, motion-aware behaviour");
      else if (!shell.includes('data-ajna-motion') || !shell.includes('class="brand-home"') || !shell.includes('/assets/js/brand-motion.mjs')) fail("logo motion controls must remain separate from the ordinary home link");
      else ok("Option B has eight leaves, one motion controller, and an independent home link");
    }
  }

  const home = await readFile("index.html", "utf8");
  if (!/favicon\.ico\?v=[0-9a-f]{8}/.test(home)) fail("icon links lost their cache-busting version");
  else ok("icon links are versioned by content");

  // Artwork has to belong to its subject. A seeded pick once gave a personal
  // essay about saying no a four-stage pipeline diagram.
  //
  // One topic no longer means one figure, deliberately: a Cloud Architecture
  // piece about spend wants a bar chart and one about latency wants a trace.
  // What has to hold is narrower — a note never gets a diagram, and an
  // article with a systemic subject always does.
  {
    const { motifReason, SPECIFIC_TOPICS } = await import("./visuals.mjs");
    const specific = new Set(SPECIFIC_TOPICS);
    let noteDiagrams = 0;
    const missing = [];
    const why = {};
    for (const m of manifest) {
      const calm = m.section === "notes";
      const { name, why: reason } = motifReason(m.tags, calm, m.title, m.slug);
      why[reason.split(":")[0]] = (why[reason.split(":")[0]] || 0) + 1;
      if (calm && name !== "field") noteDiagrams++;
      if (!calm && name === "field" && (m.tags || []).some(t => specific.has(t))) missing.push(m.slug);
    }
    if (noteDiagrams) fail(`${noteDiagrams} personal note(s) carrying a systems diagram`);
    else ok("personal notes carry no diagram");
    if (missing.length) fail(`${missing.length} article(s) with a technical subject and no figure: ${missing.slice(0, 3).join(", ")}`);
    else ok(`every article has a source-specific visual direction (${why["article-source"] || 0} article sources)`);

    // Relevant is not enough: an archive page showing forty cards drawn from
    // four shapes reads as wallpaper. No one figure may carry a quarter of
    // the corpus, and the drawing has to reach the edges of whatever canvas
    // it is handed - the motifs once drew to a fixed 640 and left the right
    // half of every 1200-wide hero empty.
    const { motifNameFor, artwork, MOTIF_COUNT } = await import("./visuals.mjs");
    const spread = {};
    for (const m of manifest) {
      const n = motifNameFor(m.tags, m.section === "notes", m.title, m.slug);
      spread[n] = (spread[n] || 0) + 1;
    }
    const used = Object.keys(spread).length;
    const [top, topN] = Object.entries(spread).sort((a, b) => b[1] - a[1])[0];
    const share = topN / manifest.length;
    if (used < 10) fail(`only ${used} of ${MOTIF_COUNT + 1} figures in use across the corpus`);
    else if (share > 0.25) fail(`"${top}" carries ${(share * 100).toFixed(0)}% of the corpus - the archive will look repetitive`);
    else ok(`${used} distinct figures in use, commonest "${top}" at ${(share * 100).toFixed(0)}%`);

    // The motifs once drew to a fixed 640 whatever canvas they were handed,
    // so every 1200-wide hero was art on the left and empty gradient on the
    // right. The property that has to hold is that the drawing is expressed
    // in the canvas it is given: widen the canvas and the geometry widens
    // with it.
    const geom = (svg) => {
      const body = svg.slice(svg.indexOf("<g clip-path"))
        .replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, "") // years in article titles aren't geometry
        .replace(/#[0-9a-fA-F]{3,8}/g, "")        // hex colours are not coordinates
        .replace(/-opacity="[^"]*"/g, "")
        .replace(/url\(#[^)]*\)/g, "");
      const ns = [...body.matchAll(/-?\d+(?:\.\d+)?/g)].map(v => +v[0]);
      return ns.length ? Math.max(...ns) : 0;
    };
    const stuck = [];
    for (const m of manifest) {
      const o = { calm: m.section === "notes", title: m.title };
      const narrow = geom(artwork(m.slug, m.tags, { ...o, w: 640, h: 360 }));
      const wide = geom(artwork(m.slug, m.tags, { ...o, w: 1200, h: 380 }));
      if (!narrow || wide / narrow < 1.7) stuck.push(`${m.slug} ${narrow}->${wide}`);
    }
    if (stuck.length) fail(`${stuck.length} figure(s) not drawn to the canvas they are given: ${stuck.slice(0, 3).join(", ")}`);
    else ok("figures scale to the canvas they are given (640 -> 1200)");
  }

  // Horizontal rules: every one in the corpus sat before a heading that
  // already made the break.
  {
    const { readdir: rd2 } = await import("node:fs/promises");
    let rules = 0;
    for (const sec of ["insights", "notes"]) {
      for (const f of await rd2(`content/${sec}`)) {
        const body = (await readFile(`content/${sec}/${f}`, "utf8")).split(/^---$/m).slice(2).join("---");
        rules += (body.match(/^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gm) || []).length;
      }
    }
    if (rules) fail(`${rules} horizontal rule(s) back in the corpus`);
    else ok("no horizontal rules in any article");
  }

  const ingest = await readFile("tools/ingest.mjs", "utf8");
  if (!/const NOT_OURS = new Set\(/.test(ingest))
    fail("the third-party image blocklist is gone; a re-ingest will pull vendor press photos back in");
  else ok("third-party images stay stripped at ingest");
}

console.log("\nAccessibility");
const sample = await readFile(`insights/${dirs[0].name}/index.html`, "utf8");
for (const [re, what] of [
  [/class="skip-link"/, "skip link"],
  [/<main id="main"/, "main landmark"],
  [/aria-label="Breadcrumb"/, "breadcrumb on articles"],
  [/lang="en"/, "document language"],
  [/aria-label="Primary"/, "labelled primary navigation"],
]) { if (!re.test(sample)) fail(`missing ${what}`); }

// Live regions belong where content actually changes, not on static pages.
const insightsIdx = await readFile("insights/index.html", "utf8");
if (!/id="postCount"[^>]*aria-live="polite"/.test(insightsIdx))
  fail("insights index does not announce the filtered result count");
if (!/data-form-status[^>]*aria-live="polite"/.test(contact))
  fail("contact form does not announce its send status");

// Icon-only controls must be labelled.
for (const [id, where] of [["themeBtn", "theme toggle"], ["navToggle", "menu button"]]) {
  const re = new RegExp(`id="${id}"[^>]*aria-label=`);
  if (!re.test(sample)) fail(`${where} has no accessible name`);
}
ok("landmarks, live regions and control labelling");

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${live.length} live, ${queued.length} queued, ${dirs.length} article pages built.`);
process.exit(failures ? 1 : 0);
