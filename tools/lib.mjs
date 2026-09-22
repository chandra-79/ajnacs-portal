/* Shared helpers for the generator. */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const SITE = {
  url: "https://ajnacs.com",
  name: "Ajna Consulting Services",
  short: "Ajna CS",
  tagline: "Enterprise architecture, AI & MLOps, and technical enablement.",
  email: "info@ajnacs.com",
  formspree: "https://formspree.io/f/mkjgrkal",
  youtube: "https://www.youtube.com/@TechKnowen",
  blog: "https://techknowen.com",
};

export const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const attr = (s = "") => esc(s);

export function parseFront(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let [, k, v] = kv;
    v = v.trim();
    if (/^\[.*\]$/.test(v)) fm[k] = [...v.matchAll(/"([^"]*)"/g)].map(x => x[1]);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) fm[k] = v;
    else fm[k] = v.replace(/^"|"$/g, "").replace(/\\"/g, '"');
  }
  return { fm, body: m[2] };
}

export async function loadCollection(dir) {
  const out = [];
  for (const name of (await readdir(dir)).filter(n => n.endsWith(".md"))) {
    const p = parseFront(await readFile(path.join(dir, name), "utf8"));
    if (!p) continue;
    out.push({ ...p, slug: name.replace(/\.md$/, "") });
  }
  return out;
}

export const fmtDate = (iso) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const readingTime = (words) => Math.max(1, Math.round(words / 225));

export const seriesSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/* The topics we surface in the filter UI. Everything else stays on the
   article but does not clutter the navigation. */
export const PRIMARY_TOPICS = [
  "Architecture", "Cloud Architecture", "Enterprise AI", "AI & MLOps",
  "Distributed Systems", "Data Engineering", "DevSecOps", "Security",
  "Platform Engineering", "Reliability", "Observability", "Performance",
  "FinOps", "Engineering Leadership", "Programming", "Infrastructure",
  "Containers", "Fundamentals", "Engineering Practice", "API Design",
];

export const primaryTopic = (tags = []) =>
  tags.find(t => PRIMARY_TOPICS.includes(t)) || tags[0] || "Insights";

export const icon = {
  arrow: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  sun: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>',
  moon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>',
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
};
