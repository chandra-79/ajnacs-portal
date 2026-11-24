import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Marked } from "marked";
import { Resvg } from "@resvg/resvg-js";
import { SITE, esc, parseFront } from "./lib.mjs";
import { page } from "./shell.mjs";
import { headingAnchors, makeRenderer, tableOfContents } from "./render.mjs";
import { csv, metricValue } from "./measurements.mjs";

const base = "/deep-dives/";
const levelNames = ["Work the numbers", "Build the model", "Test the decision"];
const colors = ["#246b95", "#563e99", "#137767", "#9a4b29", "#5c4c8a", "#337674", "#3d589b", "#8c4162", "#26576a"];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const lex = new Marked();

function readLesson(block, track, index) {
  const lines = block.trim().split("\n");
  const title = lines.shift();
  const get = key => lines.filter(line => line.startsWith(`@${key} `)).map(line => line.slice(key.length + 2).split(" | "));
  const [[slug, description] = []] = get("lesson");
  const [[metric, unit] = []] = get("chart");
  const points = get("value").map(([label, raw]) => ({ label, raw, number: metricValue(raw) }));
  const references = get("source");
  const words = get("match").flat();
  const markdown = lines.filter(line => !line.startsWith("@")).join("\n").trim();
  if (!slugPattern.test(slug || "") || !title || !description || !metric || !unit ||
      points.length < 2 || points.length > 5 || points.some(point => !point.label || point.label.length > 25) ||
      new Set(points.map(point => point.label)).size !== points.length ||
      points.some(point => point.raw.includes("/") && unit !== "%" || unit === "%" && point.number > 100) ||
      !references.length || references.some(([name, url]) => !name || !url?.startsWith("https://")) ||
      words.length < 2 || markdown.length < 800 || !markdown.includes("## Limits of the example")) {
    throw new Error(`Incomplete lesson: ${track.id}/${slug}`);
  }
  return { slug, title, description, metric, unit, points, references, words, markdown, level: index + 2,
    path: `${base}${track.id}/${slug}/` };
}

export async function loadDeepDives() {
  const tracks = JSON.parse(await readFile("content/deep-dives/index.json", "utf8"));
  const sources = new Map();
  const caseSources = new Map();
  for (const [index, track] of tracks.entries()) {
    const raw = await readFile(`content/deep-dives/${track.id}.md`, "utf8");
    track.path = `${base}${track.id}/`;
    track.color = colors[index % colors.length];
    track.lessons = raw.split(/^# /m).slice(1).map((block, i) => readLesson(block, track, i));
    if (track.lessons.length !== 3 || new Set(track.lessons.map(lesson => lesson.slug)).size !== 3)
      throw new Error(`Expected three levels for ${track.id}`);
    for (const [keys, map] of [[track.sources, sources], [track.caseSources, caseSources]]) {
      for (const key of keys.split(" ").filter(Boolean)) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(track);
      }
    }
  }
  return { tracks, sources, caseSources };
}

const normal = value => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function depthLinks(tracks, body) {
  if (!tracks?.length) return {};
  const candidates = lex.lexer(body).filter(token => token.type === "paragraph");
  const scored = tracks.flatMap(track => track.lessons.map(lesson => {
    const terms = lesson.words.map(term => ` ${normal(term)} `);
    const matches = candidates.map(({ raw }) => {
      const clean = ` ${normal(raw)} `;
      return { raw, score: terms.reduce((sum, term) => sum + (clean.includes(term) ? term.trim().split(" ").length : 0), 0) };
    }).sort((a, b) => b.score - a.score);
    return { lesson, match: matches[0] };
  })).sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0) || a.lesson.level - b.lesson.level);
  const best = scored[0];
  const inline = (best.match?.score || 0) >= 2 ? best : null;
  const footer = `<nav class="series-box" aria-label="Study paths">
    <h2 class="h3">Study this in more depth</h2>
    <ul class="series-list">${tracks.map(track => `<li><a href="${track.path}">${esc(track.title)} <span>· Levels 2–4</span></a></li>`).join("")}</ul>
  </nav>`;
  return {
    footer,
    afterParagraph: inline ? raw => raw === inline.match.raw ?
      `<p class="depth-reading"><a href="${inline.lesson.path}">Level ${inline.lesson.level} · ${esc(inline.lesson.title)}</a></p>\n` : "" : undefined,
    match: inline,
  };
}

const number = value => new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
function chart(lesson, color) {
  const width = 1000, height = 370, x = 282, plot = 566;
  const maxValue = Math.max(...lesson.points.map(point => point.number)) || 1;
  const scale = 10 ** Math.floor(Math.log10(maxValue));
  const max = lesson.unit === "%" && maxValue >= 50 ? 100 : Math.ceil(maxValue / scale) * scale;
  const marks = Array.from({ length: 5 }, (_, i) => {
    const px = x + plot * i / 4;
    return `<path stroke="#cbd5df" d="M${px} 86V311"/><text x="${px}" y="339" text-anchor="middle">${number(max * i / 4)}</text>`;
  }).join("");
  const bars = lesson.points.map(({ label, number: value }, i) => {
    const y = 88 + i * 222 / lesson.points.length;
    const bar = plot * value / max;
    return `<text x="262" y="${y + 22}" text-anchor="end">${esc(label)}</text>
      <rect x="${x}" y="${y + 4}" width="${bar}" height="25" rx="3" fill="${i % 2 ? '#1a7b74' : color}"/>
      <text x="${x + bar + 11}" y="${y + 22}" font-weight="bold">${number(value)}${lesson.unit === "%" ? "%" : ""}</text>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="16" fill="#f4f7fa"/>
    <g font-family="Arial, sans-serif" fill="#152b40" font-size="17">
      <text x="38" y="46" font-size="25" font-weight="bold">${esc(lesson.metric)}</text>
      <text x="38" y="74">Worked example · ${esc(lesson.unit)}</text>
      ${marks}${bars}
    </g>
  </svg>`;
  const version = createHash("sha256").update(svg).digest("hex").slice(0, 12);
  return { contents: new Resvg(svg).render().asPng(), version, width, height };
}

export async function publishDeepDives(out, catalog, existing) {
  const urls = [base];
  const links = [];
  for (const track of catalog.tracks) {
    const first = existing.get(track.start);
    if (!first) throw new Error(`Study path has no published starting article: ${track.start}`);
    links.push(`<li><a href="${track.path}"><strong>${esc(track.title)}</strong></a><p>${esc(track.description)}</p></li>`);
    const ordered = track.lessons.map((lesson, i) => `<li><p>Level ${lesson.level} · ${levelNames[i]}</p>
      <h2 class="h3"><a href="${lesson.path}">${esc(lesson.title)}</a></h2><p>${esc(lesson.description)}</p></li>`).join("");
    await out(track.path.slice(1), page({ title: track.title, path: track.path, topic: track.topic, description: track.description, body:
      `<section class="section mesh"><div class="publication-wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="${base}">Deep dives</a></nav>
      <h1 class="h-display">${esc(track.title)}</h1><p class="lede field-intro">${esc(track.description)}</p></div></section>
      <section class="publication-wrap case-library"><p><a href="/${track.start}/">Start with the overview · ${esc(first.title)}</a></p>
      <ol class="depth-list">${ordered}</ol></section>` }));
    urls.push(track.path);
    for (const [index, lesson] of track.lessons.entries()) {
      const asset = `assets/deep-dives/${track.id}-${lesson.slug}.png`;
      const dataPath = lesson.path + "chart.csv";
      const plot = chart(lesson, track.color);
      const alt = `${lesson.metric} (${lesson.unit}). ${lesson.points.map(point => `${point.label}: ${number(point.number)}`).join("; ")}.`;
      await out(asset, plot.contents);
      await out(dataPath.slice(1), csv([["label", "chart_value", "unit", "example_input", "provenance"],
        ...lesson.points.map(point => [point.label, point.number, lesson.unit, point.raw, "illustrative worked example"])]));
      const { marked, headings } = makeRenderer();
      const copy = headingAnchors(marked.parse(lesson.markdown));
      const prior = track.lessons[index - 1];
      const next = track.lessons[index + 1];
      await out(lesson.path.slice(1), page({ title: lesson.title, description: lesson.description, path: lesson.path,
        type: "article", topic: track.topic, ogImage: `/${asset}?v=${plot.version}`, imageWidth: plot.width, imageHeight: plot.height, imageAlt: alt,
        body: `<article class="article"><div class="reading-layout"><header class="article-head">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="${base}">Deep dives</a><span aria-hidden="true">/</span><a href="${track.path}">${esc(track.title)}</a></nav>
          <p class="eyebrow">Level ${lesson.level} · ${levelNames[index]}</p><h1 class="h1">${esc(lesson.title)}</h1><p class="lede field-intro">${esc(lesson.description)}</p>
          </header><div class="article-hero depth-chart"><img src="/${asset}?v=${plot.version}" width="${plot.width}" height="${plot.height}" alt="${esc(alt)}" fetchpriority="high" decoding="async"></div>
          <div class="reader-aside">${tableOfContents(headings)}</div>
          <div class="article-copy"><p class="case-notice">The chart uses illustrative inputs. It is a worked example.</p>
          <details class="depth-chart-data"><summary>Chart values and units</summary><ul>${lesson.points.map(point => `<li>${esc(point.label)} · ${number(point.number)} ${esc(lesson.unit)}</li>`).join("")}</ul>
          <a href="${dataPath}" download>Download the chart data (CSV)</a></details>
          <div class="prose">${copy}<h2>Sources</h2><ul>${lesson.references.map(([name, url]) => `<li><a href="${esc(url)}">${esc(name)}</a></li>`).join("")}</ul></div>
          <nav class="series-box depth-nav" aria-label="Study path navigation"><ul class="series-list">
            <li><a href="${prior?.path || "/" + track.start + "/"}">${prior ? `Previous · Level ${prior.level} · ${esc(prior.title)}` : "Previous · " + esc(first.title)}</a></li>
            <li><a href="${track.path}">All levels in ${esc(track.title)}</a></li>
            ${next ? `<li><a href="${next.path}">Next · Level ${next.level} · ${esc(next.title)}</a></li>` : ""}
          </ul></nav></div></div></article>`
      }));
      urls.push(lesson.path);
    }
  }
  await out("deep-dives", page({ title: "Engineering deep dives", description: "Study paths with progressively deeper explanations, worked charts and source references.", path: base,
    body: `<section class="section mesh"><div class="publication-wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/insights/">Insights</a></nav>
    <h1 class="h-display">Engineering deep dives</h1><p class="lede field-intro">Start with an overview. Then work the numbers at level 2, build the model at level 3, and test an engineering decision at level 4.</p></div></section>
    <section class="publication-wrap case-library"><ul class="depth-list depth-grid">${links.join("")}</ul></section>` }));
  return urls;
}

export async function depthAudit(catalog, live) {
  const rows = [["source", "source_lines_scanned", "prose_paragraphs", "numeric_claim_cues", "absolute_claim_cues", "study_paths", "inline_lesson", "match_excerpt"]];
  const record = (path, body, raw, tracks) => {
    if (!tracks?.length) throw new Error(`No reviewed study path mapping for ${path}`);
    const links = depthLinks(tracks, body);
    const paragraphs = lex.lexer(body).filter(token => token.type === "paragraph");
    const proseLines = paragraphs.flatMap(token => token.raw.trim().split("\n"));
    const numeric = proseLines.filter(line => /\d(?:\.\d+)?\s*(?:%|×|ms\b|seconds\b|times faster\b)/i.test(line)).length;
    const absolute = proseLines.filter(line => /\b(?:guarantees?|always|never|impossible|everyone)\b/i.test(line)).length;
    rows.push([path, raw.trimEnd().split("\n").length, paragraphs.length, numeric, absolute, tracks.map(t => t.id).join(" | "), links.match?.lesson.path || "", links.match?.match.raw.trim().replace(/\s+/g, " ").slice(0, 140) || ""]);
  };
  for (const article of live.filter(article => article.date <= "2026-11-23")) {
    const path = `content/${article.section}/${article.slug}.md`;
    const raw = await readFile(path, "utf8");
    record(path, parseFront(raw).body, raw, catalog.sources.get(article.slug));
  }
  for (const group of ["architecture-audit", "legacy-modernisation", "ai-into-production", "team-enablement"]) {
    const path = `content/case-studies/${group}.md`;
    const raw = await readFile(path, "utf8");
    for (const block of raw.split(/^## /m).slice(1)) {
      const slug = block.match(/^@meta (\S+)/m)?.[1];
      const body = block.split("\n").slice(1).filter(line => !line.startsWith("@")).join("\n").replace(/^### /gm, "## ");
      record(`${path}#${slug}`, body, block, catalog.caseSources.get(slug));
    }
  }
  return csv(rows);
}
