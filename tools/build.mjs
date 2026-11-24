/* Generates the whole site into the repo root. Run locally or from CI.
   Only items whose date has arrived are emitted, so the scheduled queue
   publishes itself when CI re-runs. */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { SITE, esc, fmtDate, readingTime, seriesSlug, primaryTopic, PRIMARY_TOPICS, icon, parseFront } from "./lib.mjs";
import { page } from "./shell.mjs";
import { artwork, colorFor } from "./visuals.mjs";
import { makeRenderer, tableOfContents, headingAnchors } from "./render.mjs";
import { staticPages } from "./pages.mjs";
import { referencesFor, referencesBlock } from "./references.mjs";
import { publicationDate } from "./publication.mjs";
import { buildArticleImages } from "./article-images.mjs";
import { buildPageImage } from "./site-images.mjs";
import { coverFor, photoFor } from "./covers.mjs";
import { noteCover } from "./note-covers.mjs";
import { fieldGuides, worksheet, worksheetCsv } from "./field-guides.mjs";
import { relatedArticles, robotsPolicy, topicPath, featuredCollections } from "./discovery.mjs";
import "./icons.mjs";
import "./diagrams.mjs";

const TODAY = publicationDate();
const manifest = JSON.parse(await readFile("content/manifest.json", "utf8"));
await buildArticleImages(manifest, TODAY);
const articlePreviewHashes=JSON.parse(await readFile('assets/og/articles/sources.json','utf8'));

const live = manifest
  .filter(m => m.date <= TODAY)
  .sort((a, b) => b.date.localeCompare(a.date));
const insights = live.filter(m => m.section === "insights");
const notes = live.filter(m => m.section === "notes");
const guideBySlug = new Map(fieldGuides.map(guide => [guide.slug, guide]));

const topicCounts = {};
for (const m of insights) for (const t of m.tags) if (PRIMARY_TOPICS.includes(t)) topicCounts[t] = (topicCounts[t] || 0) + 1;
const topicList = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

const tagsInUse = new Set(insights.flatMap(m => m.tags));
const filters = [...topicList, ...[...tagsInUse].filter(t => !PRIMARY_TOPICS.includes(t)).sort().map(t => [t, insights.filter(m => m.tags.includes(t)).length])];
const hubTopics = new Set(topicList.map(([topic, count]) => count >= 3 ? topic : null).filter(Boolean));
const articleTopicPath = topic => topicPath(topic, hubTopics);


const out = async (rel, html) => {
  // Anything with a file extension is written as a file. The old whitelist
  // was .xml/.txt/.html, so every OG card landed at foo.svg/index.html and
  // the URL in the meta tag answered 301 text/html — no social preview on
  // the site resolved to an image. No slug contains a dot, so extension
  // detection is safe here.
  const p = /\.[a-z0-9]{2,5}$/i.test(path.basename(rel)) ? rel : path.join(rel, "index.html");
  if(p.endsWith('.html') && html.includes('/assets/og/pages/')) {
    const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    const meta=name=>decode(html.match(new RegExp(`(?:property|name)="${name}" content="([^"]*)"`))?.[1]||'');
    const urlPath=new URL(meta('og:url')).pathname;
    const topic=decode(html.match(/<body[^>]* data-topic="([^"]+)"/)?.[1]||'')||null;
    await buildPageImage(urlPath,meta('og:title'),meta('og:description'),topic);
  }
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, html, "utf8");
};

/* ---------- shared bits ---------- */
/* One static house-promotion group per page. Slots stay in the document
   flow so swapping the contents cannot move the article or the archive. */
const housePromotions = (placement) => `<aside class="writing-promos" aria-label="Promotions" data-ad-slot="${placement}">
  <p class="promo-label">From our projects</p>
  <div class="promo-cards">
    <section class="promo-card promo-techknowen" aria-label="TechKnowen">
      <p class="promo-name">TechKnowen</p>
      <p>Practical reading on software, architecture, and engineering.</p>
      <a href="https://www.techknowen.com/" rel="noopener">Explore TechKnowen</a>
    </section>
    <section class="promo-card promo-ziggle" aria-label="Ziggle">
      <p class="promo-name">Ziggle</p>
      <p>A new place to play brain teasers.</p>
      <p class="promo-status">Coming soon</p>
    </section>
  </div>
</aside>`;

const cardFor = (m, base) => {
  const topic = primaryTopic(m.tags);
  return `<a class="card" data-card data-topics="|${esc(m.tags.join("|"))}|" data-search="${esc((m.title + " " + m.description + " " + m.tags.join(" ")).toLowerCase())}" data-topic="${esc(topic)}" href="${base}/${m.slug}/">
  <div class="card-art">${coverFor(m)}</div>
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
  const fieldGuide = guideBySlug.get(m.slug);
  const { marked, headings } = makeRenderer();
  let html = await marked.parse(body);

  const topic = primaryTopic(m.tags);
  html = headingAnchors(html);

  const tocHtml = tableOfContents(headings);
  const refsHtml = m.section === "insights" ? referencesBlock(referencesFor(body)) : "";

  /* Every article's subject-specific preview is prepared before publication. */
  const photo = photoFor(m.slug);
  const ogPath = photo?.path || `/assets/og/articles/${m.slug}.png?v=${articlePreviewHashes[m.slug].slice(0,12)}`;
  const imageAlt = photo?.alt || noteCover(m.slug, 1200, 630)?.alt || `Illustration for ${m.title}`;

  const idx = live.filter(x => x.section === m.section);
  const pos = idx.findIndex(x => x.slug === m.slug);
  const newer = idx[pos - 1], older = idx[pos + 1];

  const seriesItems = m.series ? live.filter(x => x.series === m.series)
    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0)) : [];

  const longForm = Boolean(m.series) || m.words > 1200;
  const base = m.section === "notes" ? "/notes" : "/insights";
  const related = relatedArticles(m, idx);
  const topicHref = m.section === "insights" ? articleTopicPath(topic) : "/notes/";
  const authorHref = "/about/#chandra-lanka";

  /* A series is this site's version of a book: the chapter list belongs
     beside the text, not buried at the foot of the article. */
  const chaptersHtml = longForm && seriesItems.length > 1 ? `<nav class="chapters" aria-label="Articles in this series">
      <p class="chapters-title">${esc(m.series)}</p>
      <ol>${seriesItems.map(x => `<li${x.slug === m.slug ? ' aria-current="true"' : ""}><a href="/insights/${x.slug}/">${esc(x.title)}</a></li>`).join("")}</ol>
    </nav>` : "";

  const asideHtml = tocHtml || chaptersHtml
    ? `<div class="reader-aside">${tocHtml}${chaptersHtml}</div>`
    : "";

  /* Reading preferences are offered on every article; the chapter bar only
     where there is enough article to navigate. */
  const readerChrome = `
<div class="reader-tools">
  <button class="icon-btn" id="readerBtn" type="button" aria-expanded="false" aria-controls="readerPanel" title="Reading settings" aria-label="Reading settings">${icon.sliders}</button>
  <button class="icon-btn" id="focusBtn" type="button" aria-pressed="false" title="Focus mode" aria-label="Enter focus mode">${icon.expand}</button>
</div>
<div class="reader-panel" id="readerPanel" role="dialog" aria-label="Reading settings" hidden>
  <fieldset><legend>Text size</legend>
    <div class="seg" data-pref="rsize">
      ${[["s","Small","s"],["m","Default",""],["l","Large","l"],["xl","Largest","l"]]
        .map(([v,label,cls]) => `<button type="button" data-val="${v}" aria-pressed="false"><span class="sample ${cls}">Aa</span>${label}</button>`).join("")}
    </div>
  </fieldset>
  <fieldset><legend>Ground</legend>
    <div class="seg" data-pref="theme">
      ${[["light","Light"],["sepia","Sepia"],["dark","Dark"]]
        .map(([v,label]) => `<button type="button" data-val="${v}" aria-pressed="false"><span class="swatch ${v}"></span>${label}</button>`).join("")}
    </div>
  </fieldset>
  <fieldset><legend>Column width</legend>
    <div class="seg" data-pref="rwidth">
      ${[["s","Narrow"],["m","Default"],["l","Wide"],["xl","Widest"]]
        .map(([v,label]) => `<button type="button" data-val="${v}" aria-pressed="false">${label}</button>`).join("")}
    </div>
  </fieldset>
  <fieldset><legend>Typeface</legend>
    <div class="seg" data-pref="rface">
      <button type="button" data-val="sans" aria-pressed="false"><span class="sample">Aa</span>Sans</button>
      <button type="button" data-val="serif" aria-pressed="false"><span class="sample serif">Aa</span>Serif</button>
    </div>
  </fieldset>
  <button class="reader-reset" id="readerReset" type="button">Reset to defaults</button>
  <p class="reader-note">Saved in this browser only — these settings do not follow you to another device.</p>
</div>
<button class="focus-exit" id="focusExit" type="button">${icon.collapse} Exit focus</button>
${longForm ? `<div class="chapter-bar" id="chapterBar">
  <div class="chapter-where">
    <b>${esc(m.title)}</b>
    <span>${esc(m.series || topic)}</span>
  </div>
  <span class="chapter-left" id="chapterLeft"></span>
  <nav class="chapter-step" aria-label="Article navigation">
    ${older ? `<a href="${base}/${older.slug}/" aria-label="Previous: ${esc(older.title)}">${icon.prev}</a>`
            : `<a aria-disabled="true" aria-label="No previous article">${icon.prev}</a>`}
    ${newer ? `<a href="${base}/${newer.slug}/" aria-label="Next: ${esc(newer.title)}">${icon.next}</a>`
            : `<a aria-disabled="true" aria-label="No next article">${icon.next}</a>`}
  </nav>
</div>` : ""}`;

  const body_ = `
<div class="read-bar" aria-hidden="true"><span id="readBar"></span></div>
<article class="article">
  <div class="reading-layout">
    <header class="article-head">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span>
        <a href="${base}/">${m.section === "notes" ? "Notes" : "Insights"}</a> <span aria-hidden="true">/</span>
        <a href="${topicHref}">${esc(topic)}</a>
      </nav>
      <h1 class="h1">${esc(m.title)}</h1>
      ${m.derived ? "" : `<p class="lede" style="margin-top:1rem">${esc(m.description)}</p>`}
      <div class="article-meta">
        <a class="article-byline" href="${authorHref}">Chandra Lanka</a>
        <span class="dot" aria-hidden="true"></span><time datetime="${m.date}">${fmtDate(m.date)}</time>
        ${m.modified ? `<span class="dot" aria-hidden="true"></span><span>Updated <time datetime="${m.modified}">${fmtDate(m.modified)}</time></span>` : ''}
        <span class="dot"></span><span>${readingTime(m.words)} min read</span>
        <button class="btn btn-ghost btn-sm" id="copyLink" type="button" style="margin-left:auto">Copy link</button>
      </div>
    </header>

    <div class="article-hero" data-topic="${esc(topic)}">${coverFor(m, { hero: true, sizes: '(min-width: 90rem) 1180px, (min-width: 74rem) 65vw, 100vw' })}</div>
${asideHtml}
    <div class="article-copy">
      <div class="prose">
${html}
      </div>
${fieldGuide ? worksheet(fieldGuide) : ""}

${refsHtml}

${seriesItems.length > 1 && !chaptersHtml ? `<aside class="series-box" style="margin-top:3rem">
        <p class="eyebrow">Series</p>
        <h2 class="h3" style="margin:.5rem 0 1rem">${esc(m.series)}</h2>
        <ol class="series-list">
          ${seriesItems.map(s => `<li${s.slug === m.slug ? ' aria-current="true"' : ""}><a href="/insights/${s.slug}/">${esc(s.title)}</a></li>`).join("\n          ")}
        </ol>
      </aside>` : ""}

      <footer class="article-foot">
        <div class="row" style="gap:.4rem">
          ${m.tags.map(t => m.section === 'notes' ? `<span class="chip chip-plain">${esc(t)}</span>` : `<a class="chip chip-plain" href="${articleTopicPath(t)}">${esc(t)}</a>`).join("")}
        </div>
        <nav class="prevnext" aria-label="More articles">
          ${older ? `<a href="${base}/${older.slug}/"><span>Previous</span><strong>${esc(older.title)}</strong></a>` : "<span></span>"}
          ${newer ? `<a href="${base}/${newer.slug}/" class="next"><span>Next</span><strong>${esc(newer.title)}</strong></a>` : "<span></span>"}
        </nav>
      </footer>
    </div>
    ${housePromotions("article-rail")}
  </div>

  ${related.length ? `<section class="section surface hair" style="margin-top:4rem">
    <div class="wrap">
      <p class="eyebrow">Related</p>
      <div class="grid g-3" style="margin-top:1.4rem">${related.map(r => cardFor(r, base)).join("\n")}</div>
    </div>
  </section>` : ""}

  <section class="section">
    <div class="art-wrap"><div class="cta-panel">
      <h2 class="h2">Working on this in production?</h2>
      <p class="lede" style="margin-top:.7rem">We do this work directly alongside engineering teams — architecture review, migration, and hands-on enablement.</p>
      <div class="row" style="margin-top:1.4rem">
        <a class="btn" href="/contact/">Engage engineering ${icon.arrow}</a>
        <a class="btn btn-ghost" href="/services/">See what we do</a>
      </div>
    </div></div>
  </section>
</article>
${readerChrome}`;

  await out(`${m.section === "notes" ? "notes" : "insights"}/${m.slug}`, page({
    title: m.title,
    description: m.description,
    path: `${base}/${m.slug}/`,
    ogImage: ogPath,
    imageAlt,
    imageWidth: photo?.width,
    imageHeight: photo?.height,
    published: m.date,
    modified: m.modified,
    type: "article",
    topic,
    body: body_,
    jsonld: [{
      "@context": "https://schema.org", "@type": "BlogPosting",
      headline: m.title, description: m.description,
      datePublished: m.date, dateModified: m.modified || m.date,
      author: { "@type": "Person", name: "Chandra Lanka", url: SITE.url + authorHref },
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
await out("insights", page({
  title: "Insights",
  description: "Field notes on enterprise architecture, cloud, AI and MLOps, security and cost — written from production work, not theory.",
  path: "/insights/",
  body: `
<section class="section mesh">
  <div class="publication-wrap">
    <p class="eyebrow">Insights</p>
    <h1 class="h-display" style="margin-top:.8rem;max-width:18ch">Engineering, written down.</h1>
    <p class="lede" style="margin-top:1.2rem;max-width:62ch">Architecture decisions, production failures and the trade-offs behind them. Written for the people who build and run production systems.</p>
    <div class="row insights-actions"><a class="btn" href="/field-guides/">Field guides and worksheets</a><a class="btn btn-ghost" href="/topics/">Browse topics</a><a class="btn btn-ghost" href="/feed.xml">Subscribe via RSS</a></div>
  </div>
</section>

<section class="publication-wrap archive-layout">
  <div class="archive-main">
  <section class="archive-collections" aria-labelledby="archive-start"><h2 class="h3" id="archive-start">Start with a guide</h2><div class="grid g-3">
    ${featuredCollections.filter(({slug}) => insights.some(m => m.slug === slug)).map(({slug,label,description}) => `<a class="guide-link" href="/insights/${slug}/"><strong>${esc(label)}</strong><span>${esc(description)}</span></a>`).join('')}
  </div></section>
  <div class="filter-bar">
    <div class="search-field">
      ${icon.search}
      <label class="sr-only" for="postSearch">Search articles</label>
      <input type="search" id="postSearch" placeholder="Search the archive…" autocomplete="off">
    </div>
    <label class="sr-only" for="postTopic">Filter by topic</label>
    <select id="postTopic" class="topic-select" hidden>
      <option value="">All topics</option>
      ${filters.map(([t, n]) => `<option value="${esc(t)}">${esc(t)} (${n})</option>`).join('')}
    </select>
    <p class="small muted" id="postCount" role="status" aria-live="polite"></p>
  </div>

  <div class="chip-row" role="group" aria-label="Filter by topic">
    ${topicList.map(([t, n]) => `<button class="chip chip-plain" type="button" data-topic-filter="${esc(t)}" aria-pressed="false">${esc(t)} <span class="muted">${n}</span></button>`).join("\n    ")}
  </div>

  <div class="grid archive-cards" id="postList" style="margin-top:2rem">
    ${insights.map(m => cardFor(m, "/insights")).join("\n")}
  </div>
  <p id="postEmpty" hidden class="center muted" style="padding:3rem 0">No articles match that. Try another topic or search term.</p>
  <div class="center" style="margin-top:2.5rem"><button class="btn btn-ghost" id="postMore" type="button" hidden>Show more</button></div>
  </div>
  ${housePromotions("insights-rail")}
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
  <div class="publication-wrap">
    <p class="eyebrow">Personal</p>
    <h1 class="h1" style="margin-top:.8rem">Notes</h1>
    <p class="lede" style="margin-top:1rem">Personal writing by Chandra Lanka — on craft, career and the things that do not belong in a service brochure. Separate from the engineering work on purpose.</p>
  </div>
</section>
<section class="publication-wrap archive-layout">
  <div class="notes-list">
    ${notes.map(m => `<a class="note-row" href="/notes/${m.slug}/">
      <div class="content-thumbnail">${coverFor(m)}</div>
      <div class="note-summary">
      <time datetime="${m.date}">${fmtDate(m.date)}</time>
      <h2>${esc(m.title)}</h2>
      <p>${esc(m.description)}</p>
      </div>
    </a>`).join("\n")}
  </div>
  ${housePromotions("notes-rail")}
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
  <div class="publication-wrap">
    <p class="eyebrow">Series · ${items.length} parts</p>
    <h1 class="h-display series-title">${esc(name)}</h1>
  </div>
</section>
<section class="publication-wrap archive-layout">
  <ol class="series-index">
    ${items.map((m, i) => `<li><a href="/insights/${m.slug}/"><div class="content-thumbnail">${coverFor(m, { sizes: '(min-width: 600px) 160px, 100vw' })}</div><span class="n">${String(i + 1).padStart(2, "0")}</span><span><strong>${esc(m.title)}</strong><em>${esc(m.description)}</em></span></a></li>`).join("\n    ")}
  </ol>
  ${housePromotions("series-chapters-rail")}
</section>`,
  }));
}
await out("series", page({
  title: "Series",
  description: "Multi-part engineering series — Linux, containers, platform engineering, FinOps, AI, DevSecOps and operating systems.",
  path: "/series/",
  body: `
<section class="section mesh">
  <div class="publication-wrap">
    <p class="eyebrow">Series</p>
    <h1 class="h-display" style="margin-top:.8rem;max-width:16ch">Read it in order.</h1>
    <p class="lede" style="margin-top:1.2rem;max-width:58ch">Longer arcs, written to be read start to finish rather than dipped into.</p>
  </div>
</section>
<section class="publication-wrap archive-layout">
  <div class="archive-main">
  <div class="grid series-cards">
    ${[...seriesMap].map(([name, items]) => {
      const t = primaryTopic(items[0].tags);
      return `<a class="card" data-topic="${esc(t)}" href="/series/${seriesSlug(name)}/">
      <div class="card-art">${artwork(seriesSlug(name), items[0].tags, { title: name })}</div>
      <div class="card-body">
        <span class="chip">${items.length} parts</span>
        <h2 class="card-title">${esc(name)}</h2>
        <p class="card-desc">${esc(items[0].description)}</p>
      </div></a>`;
    }).join("\n")}
  </div>
  ${seriesMap.size === 0 ? '<p class="muted center" style="padding:3rem 0">Series are being published progressively — the first parts are on their way.</p>' : ""}
  </div>
  ${housePromotions("series-rail")}
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
    ${topicList.map(([t, n]) => `<a class="topic-tile" data-topic="${esc(t)}" href="${articleTopicPath(t)}">
      <div class="content-thumbnail">${artwork('topic-'+t.toLowerCase().replace(/[^a-z0-9]+/g,'-'),[t],{title:t})}</div>
      <strong>${esc(t)}</strong><span>${n} article${n === 1 ? "" : "s"}</span></a>`).join("\n    ")}
  </div>
</section>`,
}));

/* ---------- searchable topic hubs ---------- */
for (const topic of hubTopics) {
  const url = articleTopicPath(topic);
  const articles = insights.filter(m => m.tags.includes(topic));
  await out(url.slice(1, -1), page({
    title: `${topic} articles and guides`,
    description: `Browse ${topic} articles from Ajna Consulting Services, with production trade-offs, worked measurements and implementation guides.`,
    path: url, topic,
    body: `<section class="section mesh"><div class="publication-wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/insights/">Insights</a><span aria-hidden="true">/</span><a href="/topics/">Topics</a></nav><h1 class="h-display">${esc(topic)}</h1><p class="lede">${articles.length} articles</p></div></section>
<section class="publication-wrap archive-layout" aria-label="Articles about ${esc(topic)}">
  <div class="grid archive-cards">${articles.map(m => cardFor(m, '/insights')).join('')}</div>
  ${housePromotions("topic-rail")}
</section>`,
  }));
}

/* ---------- evergreen field guides ---------- */
const publishedGuides = fieldGuides.filter(guide => insights.some(article => article.slug === guide.slug));
await out("field-guides", page({
  title: "Engineering field guides",
  description: "Practical guides and measurement worksheets for SRE toil, platform onboarding, and cloud cost per unit.",
  path: "/field-guides/",
  body: `
<section class="section mesh">
  <div class="publication-wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/insights/">Insights</a></nav>
    <h1 class="h-display">Engineering field guides</h1>
    <p class="lede field-intro">Measure recurring production work, first deployment, and the cost of delivering an order. Each guide pairs a practical decision with a worked example and its method.</p>
    <div class="row insights-actions"><a class="btn btn-ghost" href="/feed.xml">Follow Insights via RSS</a></div>
  </div>
</section>
<section class="publication-wrap archive-layout" aria-label="Field guides and worksheets">
  <div class="grid series-cards">
    ${publishedGuides.map(guide => `<article class="guide-tile">
      <h2 class="h3">${esc(guide.name)}</h2>
      <p>${esc(guide.question)}</p>
      <a href="/insights/${guide.slug}/">Read the guide</a>
      <a href="/insights/${guide.slug}/#measurement-worksheet">Open the worksheet</a>
      <a href="/insights/${guide.slug}/#methodology">Review the methodology</a>
    </article>`).join("\n    ")}
  </div>
  ${housePromotions("field-guides-rail")}
</section>`,
}));
for (const guide of publishedGuides) {
  await out(`field-guides/${guide.slug}.csv`, worksheetCsv(guide));
}

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
  <image>
    <url>${SITE.url}/favicon.png</url>
    <title>${esc(SITE.name)} — Insights</title>
    <link>${SITE.url}/insights/</link>
    <width>32</width>
    <height>32</height>
  </image>
  <lastBuildDate>${new Date((insights[0]?.date || TODAY) + "T09:00:00Z").toUTCString()}</lastBuildDate>
${feedItems}
</channel>
</rss>`);

const urls = [
  ...['/', '/services/', '/insights/', '/series/', '/topics/', '/field-guides/', '/case-studies/', '/about/', '/contact/', '/notes/', '/privacy/', '/terms/'].map(url => [url]),
  ...live.map(m => [`/${m.section}/${m.slug}/`, m.modified || m.date]),
  ...[...seriesMap.keys()].map(n => [`/series/${seriesSlug(n)}/`]),
  ...[...hubTopics].map(topic => [articleTopicPath(topic)]),
];
await out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([url, lastmod]) => `  <url><loc>${SITE.url}${url}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join("\n")}
</urlset>`);

await out("robots.txt", robotsPolicy(SITE.url));



await (async () => {
  const { copyFile } = await import("node:fs/promises");
  await copyFile("images/favicon.ico", "favicon.ico");
})();

console.log(`built ${built} article pages`);
console.log(`  insights live: ${insights.length} | notes live: ${notes.length} | series: ${seriesMap.size}`);
console.log(`  topics: ${topicList.length} | sitemap urls: ${urls.length}`);
console.log(`  queued (not emitted): ${manifest.filter(m => m.date > TODAY).length}`);
