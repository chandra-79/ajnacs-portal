/* Checks the generated site before it ships. Run by CI on every build. */
import { readFile, readdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

let failures = 0;
const fail = (m) => { console.error("  ✗ " + m); failures++; };
const ok = (m) => console.log("  ✓ " + m);

const manifest = JSON.parse(await readFile("content/manifest.json", "utf8"));
const TODAY = (process.env.TODAY || new Date().toISOString().slice(0, 10));
const live = manifest.filter(m => m.date <= TODAY);
const queued = manifest.filter(m => m.date > TODAY);

console.log("\nStructure");
for (const f of ["index.html", "404.html", "robots.txt", "sitemap.xml", "feed.xml",
                 "CNAME", "assets/css/site.css", "assets/js/site.js",
                 "services/index.html", "insights/index.html", "contact/index.html",
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

console.log("\nBrand & reader");
{
  for (const f of ["images/ajna-mark.svg", "images/favicon.ico", "images/apple-touch-icon.png", "images/icon-512.png"]) {
    try { await access(f, constants.R_OK); } catch { fail(`missing ${f}`); }
  }
  const shell = await readFile(`insights/${dirs[0].name}/index.html`, "utf8");
  if (/ajna-logo\.png/.test(shell)) fail("the retired logo is still referenced");
  else ok("mark and icon set in place");
  if (!/Quintessential/.test(shell)) fail("the wordmark face is not being loaded");
  else ok("wordmark face loaded");

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
    for (const m of h.matchAll(/(?:og:image|twitter:image)" content="[^"]*?(\/assets\/og\/[^"]+)"/g)) cards.add(m[1]);
  }
  const missingCards = [];
  for (const c of cards) { try { await access(c.replace(/^\//, ""), constants.R_OK); } catch { missingCards.push(c); } }
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
    else ok(`every technical article has a figure (by title ${why.title || 0}, by tag ${why.tag || 0}, none ${why["no systemic subject"] || 0})`);

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
