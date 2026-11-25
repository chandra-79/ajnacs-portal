import { esc, icon, readingTime } from "./lib.mjs";
import { lanePath } from "./lanes.mjs";

function articlePath(article) {
  return "/insights/" + esc(article.slug) + "/";
}

export function laneBreadcrumb(lane) {
  return '<nav class="crumbs" aria-label="Breadcrumb">' +
    '<a href="/">Home</a> <span aria-hidden="true">/</span> ' +
    '<a href="/topics/">Topics</a> <span aria-hidden="true">/</span> ' +
    '<a href="' + esc(lanePath(lane)) + '">' + esc(lane.title) + '</a></nav>';
}

export function laneChapterLinks({ previous, next }) {
  function step(entry, label, direction) {
    return entry
      ? '<a href="' + articlePath(entry.article) + '" aria-label="' + label + ': ' + esc(entry.article.title) + '">' + direction + '</a>'
      : '<a aria-disabled="true" aria-label="No ' + label.toLowerCase() + ' article">' + direction + '</a>';
  }
  return step(previous, "Previous", icon.prev) + step(next, "Next", icon.next);
}

export function laneContinuation(article, lane, { next, related = [], seriesNext }) {
  const short = lane.short || lane.title;
  const directory = esc(lanePath(lane));
  const accent = /^#[\da-f]{6}$/i.test(lane.accent) ? ' style="--reading-lane-accent:' + lane.accent + '"' : "";
  const seen = new Set([article.slug, next?.article.slug]);
  const reading = related.filter(entry => {
    if (entry.lane?.id !== lane.id || seen.has(entry.article.slug)) return false;
    seen.add(entry.article.slug);
    return true;
  }).slice(0, 2);
  const label = !next ? "Read more in " + short : seriesNext ? "Next in this series" : "Continue in " + short;
  const reason = next?.reason ? '<span class="lane-reading-reason">' + esc(next.reason) + '</span>' : "";
  const action = next
    ? '<a class="lane-reading-next" data-lane-next href="' + articlePath(next.article) + '">' +
      '<strong>' + esc(next.article.title) + '</strong>' + reason +
      '<span class="lane-reading-meta">' + readingTime(next.article.words) + ' min read</span></a>'
    : '<a class="lane-reading-next" href="' + directory + '"><strong>Browse all ' + esc(short) + ' articles</strong></a>';
  const relatedReading = reading.length
    ? '<div class="lane-reading-related"><h3 class="h3">Related reading</h3><ul class="lane-reading-list">' +
      reading.map(({ article: item, reason: explanation }) =>
        '<li><a data-lane-related href="' + articlePath(item) + '"><strong>' + esc(item.title) + '</strong>' +
        (explanation ? '<span class="lane-reading-reason">' + esc(explanation) + '</span>' : '') +
        '</a></li>').join('') + '</ul></div>'
    : "";
  return '<section class="lane-reading" data-lane-continuation="' + esc(lane.id) + '" aria-labelledby="lane-reading-title"' + accent + '>' +
    '<h2 id="lane-reading-title" class="h3">' + esc(label) + '</h2>' +
    action + relatedReading +
    (next ? '<a class="lane-reading-index" href="' + directory + '">All ' + esc(short) + ' articles</a>' : '') +
    '</section>';
}
