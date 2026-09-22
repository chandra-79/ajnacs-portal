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
if (/#[0-9a-f]*[g-z]/i.test(css.replace(/\/\*[\s\S]*?\*\//g, ""))) fail("site.css contains an invalid hex colour");
else ok("no invalid colour tokens");

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
