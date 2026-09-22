/* Decide what is live now and what is queued.
   Launch set: dated across the past two years, series kept contiguous.
   The rest: queued Mon/Wed/Fri from the next Monday, best first.
   The generator only emits items whose date has arrived, so a scheduled
   build publishes the queue without anyone touching the repo. */
import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("content/manifest.json", "utf8"));
const ranking = JSON.parse(await readFile("content/ranking.json", "utf8"));
const launchSlugs = new Set(JSON.parse(await readFile("content/launch-set.json", "utf8")));

const rank = new Map(ranking.map(r => [r.slug, r.score]));
const bySlug = new Map(manifest.map(m => [m.slug, m]));

const TODAY = new Date(process.env.TODAY || "2026-09-22T00:00:00Z");
const iso = (d) => d.toISOString().slice(0, 10);

/* ---- 1. launch set: spread across the past two years ---- */
const launch = manifest.filter(m => launchSlugs.has(m.slug));
// Group series together so a series reads in order on consecutive slots.
launch.sort((a, b) => {
  if (a.series && a.series === b.series) return (a.seriesOrder || 0) - (b.seriesOrder || 0);
  const sa = a.series || "", sb = b.series || "";
  if (sa !== sb) return (rank.get(b.slug) || 0) - (rank.get(a.slug) || 0);
  return 0;
});
// Oldest slot gets the lowest-ranked so the strongest work reads as recent.
const ordered = [...launch].reverse();
const START = Date.UTC(2024, 9, 8);
const END = TODAY.getTime() - 6 * 864e5;
ordered.forEach((m, i) => {
  const d = new Date(START + Math.round((i / Math.max(1, ordered.length - 1)) * (END - START)));
  const wd = d.getUTCDay();
  if (wd === 0) d.setUTCDate(d.getUTCDate() + 2);
  if (wd === 6) d.setUTCDate(d.getUTCDate() + 3);
  m.date = iso(d);
  m.status = "published";
});

/* ---- 2. personal notes: publish all 13, spread over the same window ---- */
const notes = manifest.filter(m => m.section === "notes");
notes.forEach((m, i) => {
  const d = new Date(START + Math.round(((i + 0.5) / notes.length) * (END - START)));
  const wd = d.getUTCDay();
  if (wd === 0) d.setUTCDate(d.getUTCDate() + 1);   // Sunday -> Monday
  if (wd === 6) d.setUTCDate(d.getUTCDate() + 2);   // Saturday -> Monday
  m.date = iso(d);
  m.status = "published";
});

/* ---- 3. everything else: queued Mon/Wed/Fri, strongest first ---- */
const queue = manifest
  .filter(m => m.status !== "published")
  .sort((a, b) => (rank.get(b.slug) || 0) - (rank.get(a.slug) || 0));

let cursor = new Date(TODAY);
cursor.setUTCDate(cursor.getUTCDate() + ((8 - cursor.getUTCDay()) % 7 || 7)); // next Monday
const SLOT_DAYS = [1, 3, 5];
let slot = 0;
for (const m of queue) {
  const want = SLOT_DAYS[slot % 3];
  const d = new Date(cursor);
  d.setUTCDate(d.getUTCDate() + (want - 1));
  m.date = iso(d);
  m.status = "scheduled";
  slot++;
  if (slot % 3 === 0) cursor.setUTCDate(cursor.getUTCDate() + 7);
}

await writeFile("content/manifest.json", JSON.stringify(manifest, null, 2));

const pub = manifest.filter(m => m.status === "published");
const sch = manifest.filter(m => m.status === "scheduled");
const last = sch[sch.length - 1];
console.log("published now :", pub.length, `(${pub.filter(p=>p.section==="insights").length} insights + ${pub.filter(p=>p.section==="notes").length} notes)`);
console.log("  date range  :", pub.reduce((a,r)=>r.date<a?r.date:a,"9999"), "→", pub.reduce((a,r)=>r.date>a?r.date:a,"0"));
console.log("queued        :", sch.length, "at 3/week (Mon/Wed/Fri)");
console.log("  first out   :", sch[0]?.date, "—", sch[0]?.title.slice(0, 56));
console.log("  queue ends  :", last?.date);
