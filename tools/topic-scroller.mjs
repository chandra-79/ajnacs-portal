import { esc } from "./lib.mjs";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function scrollerItems(lanes, insights) {
  const topics = lanes.map(({ id, title }) => ({ href: "/learn/" + id + "/", title }));
  const newest = insights
    .filter(article => article.section === "insights" && article.status === "published" && slugPattern.test(article.slug) && article.title && article.date)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  const seen = new Set();
  const articles = [];
  for (const { slug, title } of newest) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    articles.push({ href: "/insights/" + slug + "/", title });
    if (articles.length === 3) break;
  }
  return [...topics, ...articles];
}

export function topicScroller(items) {
  function list(mirror) {
    const links = items.map(({ href, title }) => '<li><a href="' + esc(href) + '"' +
      (mirror ? ' tabindex="-1"' : '') + '>' + esc(title) + '</a></li>').join("");
    return '<ul class="topic-scroller-list"' +
      (mirror ? ' data-scroller-mirror aria-hidden="true"' : ' data-scroller-list') + '>' + links + '</ul>';
  }
  return '<section class="marquee-wrap hair topic-scroller" aria-label="Topics and latest articles" data-topic-scroller>' +
    '<div class="marquee" data-scroller-viewport><div class="marquee-track">' + list(false) + list(true) + '</div></div>' +
    '<button class="topic-scroller-pause" type="button" data-scroller-pause aria-pressed="false" aria-label="Pause scroller" hidden>Pause</button>' +
    '</section>';
}
