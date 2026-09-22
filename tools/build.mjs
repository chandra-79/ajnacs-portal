/* Generates the whole site into the repo root. Run locally or from CI.
   Only items whose date has arrived are emitted, so the scheduled queue
   publishes itself when CI re-runs. */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { SITE, esc, fmtDate, readingTime, seriesSlug, primaryTopic, PRIMARY_TOPICS, icon, parseFront } from "./lib.mjs";
import { page } from "./shell.mjs";
import { artwork, ogCard, colorFor } from "./visuals.mjs";
import { makeRenderer, extractStats, statStrip, barChart, injectAfterFirstH2, tableOfContents } from "./render.mjs";
import { staticPages } from "./pages.mjs";
import { referencesFor, referencesBlock } from "./references.mjs";

const TODAY = (process.env.TODAY || new Date().toISOString().slice(0, 10)).slice(0, 10);
const manifest = JSON.parse(await readFile("content/manifest.json", "utf8"));

const live = manifest
  .filter(m => m.date <= TODAY)
  .sort((a, b) => b.date.localeCompare(a.date));
const insights = live.filter(m => m.section === "insights");
const notes = live.filter(m => m.section === "notes");

const out = async (rel, html) => {
  const p = rel.endsWith(".xml") || rel.endsWith(".txt") || rel.endsWith(".html")
    ? rel : path.join(rel, "index.html");
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, html, "utf8");
};

/* ---------- shared bits ---------- */
const cardFor = (m, base) => {
  const topic = primaryTopic(m.tags);
  return `<a class="card" data-card data-topics="|${esc(m.tags.join("|"))}|" data-search="${esc((m.title + " " + m.description + " " + m.tags.join(" ")).toLowerCase())}" data-topic="${esc(topic)}" href="${base}/${m.slug}/">
  <div class="card-art">${artwork(m.slug, m.tags)}</div>
  <div class="card-body">
    <span class="chip">${esc(topic)}</span>
    <h3 class="card-title">${esc(m.title)}</h3>
    <p class="card-desc">${esc(m.description)}</p>
    <div class="card-meta"><time datetime="${m.date}">${fmtDate(m.date)}</time><span class="dot"></span><span>${readingTime(m.words)} min read</span>${m.series ? `<span class="dot"></span><span>Series</span>` : ""}</div>
  </div>
</a>`;
};

/* ---------- article pages ---------- */
let built = 0;
for (const m of live) {
  const raw = await readFile(`content/${m.section}/${m.slug}.md`, "utf8");
  const { body } = parseFront(raw);
  const { marked, headings } = makeRenderer();
  let html = await marked.parse(body);

  const topic = primaryTopic(m.tags);
  const stats = extractStats(body);
  if (m.section === "insights") {
    const chart = barChart(stats, m.title);
    html = injectAfterFirstH2(html, chart || statStrip(stats));
  }

  const tocHtml = tableOfContents(headings);
  const refsHtml = m.section === "insights" ? referencesBlock(referencesFor(body)) : "";

  const ogPath = `/assets/og/${m.section}-${m.slug}.svg`;
  await out(`assets/og/${m.section}-${m.slug}.svg`.replace(/\.svg$/, ".svg"), ogCard(m.title, topic, m.tags));

  const idx = live.filter(x => x.section === m.section);
  const pos = idx.findIndex(x => x.slug === m.slug);
  const newer = idx[pos - 1], older = idx[pos + 1];

  const seriesItems = m.series ? live.filter(x => x.series === m.series)
    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0)) : [];

  const base = m.section === "notes" ? "/notes" : "/insights";
  const related = live.filter(x => x.section === m.section && x.slug !== m.slug &&
      x.tags.some(t => m.tags.includes(t)))
    .slice(0, 3);

  const body_ = `
<div class="read-bar" aria-hidden="true"><span id="readBar"></span></div>
<article class="article">
  <header class="article-head">
    <div class="wrap-narrow">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span>
        <a href="${base}/">${m.section === "notes" ? "Notes" : "Insights"}</a> <span aria-hidden="true">/</span>
        <span>${esc(topic)}</span>
      </nav>
      <h1 class="h1">${esc(m.title)}</h1>
      ${m.derived ? "" : `<p class="lede" style="margin-top:1rem">${esc(m.description)}</p>`}
      <div class="article-meta">
        <span class="chip">${esc(topic)}</span>
        <time datetime="${m.date}">${fmtDate(m.date)}</time>
        <span class="dot"></span><span>${readingTime(m.words)} min read</span>
        <button class="btn btn-ghost btn-sm" id="copyLink" type="button" style="margin-left:auto">Copy link</button>
      </div>
    </div>
  </header>

  <div class="article-hero wrap-narrow" data-topic="${esc(topic)}">${artwork(m.slug, m.tags, { w: 1200, h: 380, calm: m.section === "notes" })}</div>

  <div class="wrap-narrow article-grid${tocHtml ? " has-toc" : ""}">
    ${tocHtml}
    <div class="prose">
${html}
    </div>
  </div>

  ${refsHtml ? `<div class="wrap-narrow">${refsHtml}</div>` : ""}

  ${seriesItems.length > 1 ? `<div class="wrap-narrow" style="margin-top:3rem">
    <aside class="series-box">
      <p class="eyebrow">Series</p>
      <h2 class="h3" style="margin:.5rem 0 1rem">${esc(m.series)}</h2>
      <ol class="series-list">
        ${seriesItems.map(s => `<li${s.slug === m.slug ? ' aria-current="true"' : ""}><a href="/insights/${s.slug}/">${esc(s.title)}</a></li>`).join("\n        ")}
      </ol>
    </aside>
  </div>` : ""}

  <div class="wrap-narrow article-foot">
    <div class="row" style="gap:.4rem">
      ${m.tags.map(t => `<a class="chip chip-plain" href="/insights/?topic=${encodeURIComponent(t)}">${esc(t)}</a>`).join("")}
    </div>
    <nav class="prevnext" aria-label="More articles">
      ${older ? `<a href="${base}/${older.slug}/"><span>Previous</span><strong>${esc(older.title)}</strong></a>` : "<span></span>"}
      ${newer ? `<a href="${base}/${newer.slug}/" class="next"><span>Next</span><strong>${esc(newer.title)}</strong></a>` : "<span></span>"}
    </nav>
  </div>

  ${related.length ? `<section class="section surface hair" style="margin-top:4rem">
    <div class="wrap">
      <p class="eyebrow">Related</p>
      <div class="grid g-3" style="margin-top:1.4rem">${related.map(r => cardFor(r, base)).join("\n")}</div>
    </div>
  </section>` : ""}

  <section class="section">
    <div class="wrap-narrow cta-panel">
      <h2 class="h2">Working on this in production?</h2>
      <p class="lede" style="margin-top:.7rem">We do this work directly alongside engineering teams — architecture review, migration, and hands-on enablement.</p>
      <div class="row" style="margin-top:1.4rem">
        <a class="btn" href="/contact/">Engage engineering ${icon.arrow}</a>
        <a class="btn btn-ghost" href="/services/">See what we do</a>
      </div>
    </div>
  </section>
</article>`;

  await out(`${m.section === "notes" ? "notes" : "insights"}/${m.slug}`, page({
    title: m.title,
    description: m.description,
    path: `${base}/${m.slug}/`,
    ogImage: ogPath,
    type: "article",
    topic,
    body: body_,
    jsonld: [{
      "@context": "https://schema.org", "@type": "BlogPosting",
      headline: m.title, description: m.description,
      datePublished: m.date, dateModified: m.date,
      author: { "@type": "Person", name: "Chandra Lanka", url: "https://ajnacs.com/about/" },
      publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
      mainEntityOfPage: SITE.url + base + "/" + m.slug + "/",
      image: SITE.url + ogPath,
      keywords: m.tags.join(", "),
      articleSection: topic,
      wordCount: m.words,
    }, {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url + "/" },
        { "@type": "ListItem", position: 2, name: m.section === "notes" ? "Notes" : "Insights", item: SITE.url + base + "/" },
        { "@type": "ListItem", position: 3, name: m.title },
      ],
    }],
  }));
  built++;
}

/* ---------- insights index ---------- */
const topicCounts = {};
for (const m of insights) for (const t of m.tags) if (PRIMARY_TOPICS.includes(t)) topicCounts[t] = (topicCounts[t] || 0) + 1;
const topicList = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

await out("insights", page({
  title: "Insights",
  description: "Field notes on enterprise architecture, cloud, AI and MLOps, security and cost — written from production work, not theory.",
  path: "/insights/",
  body: `
<section class="section mesh">
  <div class="wrap">
    <p class="eyebrow">Insights</p>
    <h1 class="h-display" style="margin-top:.8rem;max-width:18ch">Engineering, written down.</h1>
    <p class="lede" style="margin-top:1.2rem;max-width:62ch">Architecture decisions, production failures, and the trade-offs behind them. Written from delivery work with enterprise engineering teams.</p>
  </div>
</section>

<section class="wrap" style="padding-bottom:var(--section-y)">
  <div class="filter-bar">
    <div class="search-field">
      ${icon.search}
      <label class="sr-only" for="postSearch">Search articles</label>
      <input type="search" id="postSearch" placeholder="Search the archive…" autocomplete="off">
    </div>
    <p class="small muted" id="postCount" role="status" aria-live="polite"></p>
  </div>

  <div class="chip-row" role="group" aria-label="Filter by topic">
    ${topicList.map(([t, n]) => `<button class="chip chip-plain" type="button" data-topic-filter="${esc(t)}" aria-pressed="false">${esc(t)} <span class="muted">${n}</span></button>`).join("\n    ")}
  </div>

  <div class="grid g-3" id="postList" style="margin-top:2rem">
    ${insights.map(m => cardFor(m, "/insights")).join("\n")}
  </div>
  <p id="postEmpty" hidden class="center muted" style="padding:3rem 0">No articles match that. Try another topic or search term.</p>
  <div class="center" style="margin-top:2.5rem"><button class="btn btn-ghost" id="postMore" type="button" hidden>Show more</button></div>
</section>`,
  jsonld: [{
    "@context": "https://schema.org", "@type": "Blog",
    name: `${SITE.name} — Insights`, url: SITE.url + "/insights/",
    description: "Enterprise architecture, cloud, AI and MLOps writing.",
    blogPost: insights.slice(0, 20).map(m => ({
      "@type": "BlogPosting", headline: m.title, url: `${SITE.url}/insights/${m.slug}/`, datePublished: m.date,
    })),
  }],
}));

/* ---------- notes index ---------- */
await out("notes", page({
  title: "Notes",
  description: "Personal writing — career, craft, and the parts of a long technical life that do not fit on a CV.",
  path: "/notes/",
  body: `
<section class="section">
  <div class="wrap-narrow">
    <p class="eyebrow">Personal</p>
    <h1 class="h1" style="margin-top:.8rem">Notes</h1>
    <p class="lede" style="margin-top:1rem">Personal writing by Chandra Lanka — on craft, career and the things that do not belong in a service brochure. Separate from the engineering work on purpose.</p>
  </div>
</section>
<section class="wrap" style="padding-bottom:var(--section-y)">
  <div class="notes-list">
    ${notes.map(m => `<a class="note-row" href="/notes/${m.slug}/">
      <time datetime="${m.date}">${fmtDate(m.date)}</time>
      <h2>${esc(m.title)}</h2>
      <p>${esc(m.description)}</p>
    </a>`).join("\n")}
  </div>
</section>`,
}));

/* ---------- series ---------- */
const seriesMap = new Map();
for (const m of insights) if (m.series) {
  if (!seriesMap.has(m.series)) seriesMap.set(m.series, []);
  seriesMap.get(m.series).push(m);
}
for (const [name, items] of seriesMap) {
  items.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
  const sslug = seriesSlug(name);
  await out(`series/${sslug}`, page({
    title: name,
    description: `A ${items.length}-part series: ${items[0].description}`,
    path: `/series/${sslug}/`,
    topic: primaryTopic(items[0].tags),
    body: `
<section class="section mesh">
  <div class="wrap-narrow">
    <p class="eyebrow">Series · ${items.length} parts</p>
    <h1 class="h1" style="margin-top:.8rem">${esc(name)}</h1>
  </div>
</section>
<section class="wrap" style="padding-bottom:var(--section-y)">
  <ol class="series-index">
    ${items.map((m, i) => `<li><a href="/insights/${m.slug}/"><span class="n">${String(i + 1).padStart(2, "0")}</span><span><strong>${esc(m.title)}</strong><em>${esc(m.description)}</em></span></a></li>`).join("\n    ")}
  </ol>
</section>`,
  }));
}
await out("series", page({
  title: "Series",
  description: "Multi-part engineering series — Linux, containers, platform engineering, FinOps, AI, DevSecOps and operating systems.",
  path: "/series/",
  body: `
<section class="section mesh">
  <div class="wrap">
    <p class="eyebrow">Series</p>
    <h1 class="h-display" style="margin-top:.8rem;max-width:16ch">Read it in order.</h1>
    <p class="lede" style="margin-top:1.2rem;max-width:58ch">Longer arcs, written to be read start to finish rather than dipped into.</p>
  </div>
</section>
<section class="wrap" style="padding-bottom:var(--section-y)">
  <div class="grid g-2">
    ${[...seriesMap].map(([name, items]) => {
      const t = primaryTopic(items[0].tags);
      return `<a class="card" data-topic="${esc(t)}" href="/series/${seriesSlug(name)}/">
      <div class="card-art">${artwork(seriesSlug(name), items[0].tags)}</div>
      <div class="card-body">
        <span class="chip">${items.length} parts</span>
        <h2 class="card-title">${esc(name)}</h2>
        <p class="card-desc">${esc(items[0].description)}</p>
      </div></a>`;
    }).join("\n")}
  </div>
  ${seriesMap.size === 0 ? '<p class="muted center" style="padding:3rem 0">Series are being published progressively — the first parts are on their way.</p>' : ""}
</section>`,
}));

/* ---------- topics ---------- */
await out("topics", page({
  title: "Topics",
  description: "Browse writing by topic — architecture, cloud, AI and MLOps, security, reliability, cost and leadership.",
  path: "/topics/",
  body: `
<section class="section mesh"><div class="wrap">
  <p class="eyebrow">Topics</p>
  <h1 class="h-display" style="margin-top:.8rem;max-width:16ch">Browse by subject.</h1>
</div></section>
<section class="wrap" style="padding-bottom:var(--section-y)">
  <div class="grid g-4">
    ${topicList.map(([t, n]) => `<a class="topic-tile" data-topic="${esc(t)}" href="/insights/?topic=${encodeURIComponent(t)}">
      <strong>${esc(t)}</strong><span>${n} article${n === 1 ? "" : "s"}</span></a>`).join("\n    ")}
  </div>
</section>`,
}));

/* ---------- static pages ---------- */
for (const [rel, html] of Object.entries(staticPages({ insights, notes, seriesMap, topicList, cardFor }))) {
  await out(rel, html);
}

/* ---------- feeds and robots ---------- */
const feedItems = insights.slice(0, 40).map(m => `  <item>
    <title>${esc(m.title)}</title>
    <link>${SITE.url}/insights/${m.slug}/</link>
    <guid isPermaLink="true">${SITE.url}/insights/${m.slug}/</guid>
    <pubDate>${new Date(m.date + "T09:00:00Z").toUTCString()}</pubDate>
    <description>${esc(m.description)}</description>
    ${m.tags.map(t => `<category>${esc(t)}</category>`).join("")}
  </item>`).join("\n");
await out("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(SITE.name)} — Insights</title>
  <link>${SITE.url}/insights/</link>
  <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Enterprise architecture, cloud, AI and MLOps writing from Ajna Consulting Services.</description>
  <language>en</language>
  <lastBuildDate>${new Date((insights[0]?.date || TODAY) + "T09:00:00Z").toUTCString()}</lastBuildDate>
${feedItems}
</channel>
</rss>`);

const urls = [
  ["/", "1.0", "weekly"], ["/services/", "0.9", "monthly"], ["/insights/", "0.9", "daily"],
  ["/series/", "0.7", "weekly"], ["/topics/", "0.6", "weekly"], ["/case-studies/", "0.8", "monthly"],
  ["/about/", "0.6", "monthly"], ["/contact/", "0.7", "monthly"], ["/notes/", "0.4", "weekly"],
  ...insights.map(m => [`/insights/${m.slug}/`, "0.7", "monthly"]),
  ...notes.map(m => [`/notes/${m.slug}/`, "0.3", "yearly"]),
  ...[...seriesMap.keys()].map(n => [`/series/${seriesSlug(n)}/`, "0.6", "monthly"]),
];
await out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p, f]) => `  <url><loc>${SITE.url}${u}</loc><changefreq>${f}</changefreq><priority>${p}</priority></url>`).join("\n")}
</urlset>`);

await out("robots.txt", `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`);

await out("assets/og/default.svg", ogCard(SITE.name, "Enterprise Engineering", ["Architecture"]));

console.log(`built ${built} article pages`);
console.log(`  insights live: ${insights.length} | notes live: ${notes.length} | series: ${seriesMap.size}`);
console.log(`  topics: ${topicList.length} | sitemap urls: ${urls.length}`);
console.log(`  queued (not emitted): ${manifest.filter(m => m.date > TODAY).length}`);
