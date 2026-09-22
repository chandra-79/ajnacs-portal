/* The page shell: head, header, footer. Everything renders through this. */
import { SITE, esc, icon } from "./lib.mjs";

const NAV = [
  ["/services/", "Services"],
  ["/insights/", "Insights"],
  ["/series/", "Series"],
  ["/case-studies/", "Case studies"],
  ["/about/", "About"],
];

export function page({
  title, description, path: urlPath, body,
  ogImage = "/assets/og/default.svg", type = "website",
  jsonld = [], bodyClass = "", topic = null, canonical = null,
}) {
  const url = SITE.url + urlPath;
  const fullTitle = urlPath === "/" ? title : `${title} | ${SITE.short}`;
  const meta = String(description || "").replace(/\s+/g, " ").trim().slice(0, 300);
  const metaShort = meta.length > 158 ? meta.slice(0, 155).replace(/[\s,;:—-]+$/, "") + "…" : meta;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(metaShort)}">
<meta name="author" content="Chandra Lanka">
<link rel="canonical" href="${esc(canonical || url)}">
<meta name="robots" content="index, follow, max-image-preview:large">

<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(metaShort)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(SITE.url + ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(metaShort)}">
<meta name="twitter:image" content="${esc(SITE.url + ogImage)}">

<link rel="icon" href="/images/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/images/ajna-logo.png">
<meta name="theme-color" content="#0a1020">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/css/site.css">
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.name)} — Insights" href="/feed.xml">
<script>
/* Set the theme before first paint so the page never flashes the wrong one. */
(function(){try{var t=localStorage.getItem('acs-theme');
if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
</script>
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>
<body class="${bodyClass}"${topic ? ` data-topic="${esc(topic)}"` : ""}>
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header" id="siteHeader">
  <div class="wrap" style="display:flex;align-items:center;width:min(1220px,100% - var(--gutter)*2)">
    <a class="brand" href="/">
      <img src="/images/ajna-logo.png" alt="" width="32" height="32">
      <span class="brand-name">Ajna<span>CS</span></span>
    </a>
    <nav class="nav" id="nav" aria-label="Primary">
      ${NAV.map(([href, label]) =>
        `<a href="${href}"${urlPath.startsWith(href) && href !== "/" ? ' aria-current="page"' : ""}>${label}</a>`).join("\n      ")}
      <a class="btn btn-sm" href="/contact/" style="margin-left:.4rem">Engage engineering</a>
    </nav>
    <div class="nav-actions">
      <button class="icon-btn" id="themeBtn" type="button" aria-label="Switch to dark mode" aria-pressed="false">${icon.moon}</button>
      <button class="icon-btn nav-toggle" id="navToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav">${icon.menu}</button>
    </div>
  </div>
</header>

<main id="main" tabindex="-1">
${body}
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="grid g-4" style="gap:2rem">
      <div>
        <a class="brand" href="/" style="color:#fff;margin-bottom:.9rem">
          <img src="/images/ajna-logo.png" alt="" width="32" height="32">
          <span class="brand-name">Ajna<span style="color:#6f9bff">CS</span></span>
        </a>
        <p style="font-size:.88rem;line-height:1.65;color:#9fb0d0;max-width:30ch">
          Specialised engineering partner for enterprise architecture, AI &amp; MLOps, and technical enablement.
        </p>
        <div class="social" style="margin-top:1.1rem">
          <a href="${SITE.youtube}" rel="noopener" aria-label="YouTube"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.8-.5-5.6a2.9 2.9 0 0 0-2-2C18.7 4 12 4 12 4s-6.7 0-8.5.4a2.9 2.9 0 0 0-2 2C1 8.2 1 12 1 12s0 3.8.5 5.6a2.9 2.9 0 0 0 2 2C5.3 20 12 20 12 20s6.7 0 8.5-.4a2.9 2.9 0 0 0 2-2C23 15.8 23 12 23 12zM9.8 15.4V8.6l5.9 3.4z"/></svg></a>
          <a href="${SITE.blog}" rel="noopener" aria-label="TechKnowen blog"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3h16v3H4zm0 5h16v13l-8-4-8 4z"/></svg></a>
          <a href="/feed.xml" aria-label="RSS feed"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="6.2" cy="17.8" r="2.2"/><path d="M4 10.2v3a6.6 6.6 0 0 1 6.6 6.6h3A9.6 9.6 0 0 0 4 10.2zM4 4v3c7.2 0 13 5.8 13 13h3C20 11.2 12.8 4 4 4z"/></svg></a>
        </div>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <li><a href="/services/#architecture">Enterprise architecture</a></li>
          <li><a href="/services/#ai">AI &amp; MLOps</a></li>
          <li><a href="/services/#training">Technical enablement</a></li>
          <li><a href="/case-studies/">Case studies</a></li>
        </ul>
      </div>
      <div>
        <h4>Insights</h4>
        <ul>
          <li><a href="/insights/">All articles</a></li>
          <li><a href="/series/">Series</a></li>
          <li><a href="/topics/">Topics</a></li>
          <li><a href="/notes/">Personal notes</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
          <li><a href="/contact/">Start an engagement</a></li>
          <li><a href="/about/">About</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span id="yr">2026</span> ${esc(SITE.name)}. All rights reserved.</span>
      <span style="display:flex;gap:1.2rem"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></span>
    </div>
  </div>
</footer>
<script src="/assets/js/site.js" defer></script>
</body>
</html>`;
}
