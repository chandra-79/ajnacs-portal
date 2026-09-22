/* Rank articles for launch. The goal is commercial relevance to what Ajna CS
   actually sells, plus evidence of substance — not raw length. */
import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("content/manifest.json", "utf8"));

// What the firm sells, weighted. These mirror the service lines on the site.
const TOPIC_WEIGHT = {
  "Architecture": 10, "Cloud Architecture": 10, "Enterprise AI": 10, "AI & MLOps": 10,
  "Distributed Systems": 8, "DevSecOps": 8, "Security": 8, "FinOps": 9,
  "Platform Engineering": 8, "Observability": 7, "Reliability": 7,
  "Data Engineering": 7, "Infrastructure": 6, "Containers": 6, "Performance": 6,
  "Engineering Practice": 5, "API Design": 5, "Engineering Leadership": 5,
  "Programming": 3, "Fundamentals": 3, "Career": 1,
};

const score = (r, body) => {
  let s = 0;
  const reasons = [];

  const tw = Math.max(0, ...r.tags.map(t => TOPIC_WEIGHT[t] ?? 2));
  s += tw * 3;
  if (tw >= 9) reasons.push("core service line");

  // substance
  const h2 = (body.match(/^##\s/gm) || []).length;
  s += Math.min(h2, 8) * 2.2;
  if (h2 >= 5) reasons.push("well structured");

  if (r.words >= 900) { s += 9; reasons.push("in depth"); }
  else if (r.words >= 600) s += 5;
  else if (r.words < 300) s -= 8;

  // hard evidence reads as authority
  const pct = (body.match(/\b\d{1,3}(?:\.\d+)?%/g) || []).length;
  const nums = (body.match(/\b\d[\d,.]*\s?(ms|s\b|GB|TB|MB|req\/s|QPS|rps|x\b)/gi) || []).length;
  if (pct) { s += Math.min(pct, 5) * 1.8; reasons.push("concrete figures"); }
  if (nums) s += Math.min(nums, 5) * 1.2;

  if (/^\|/m.test(body)) { s += 4; reasons.push("comparison table"); }
  if (/^```/m.test(body)) { s += 3; reasons.push("worked example"); }

  // decision-shaped titles convert better for a consultancy
  if (/\b(when|why|how|vs\.?|versus|trade-?offs?|choosing|decision|actually|guide)\b/i.test(r.title)) {
    s += 5; reasons.push("decision guidance");
  }

  // a complete series is a strong asset
  if (r.series) { s += 7; reasons.push("part of a series"); }

  // things that age badly
  if (/\b20\d\d\b/.test(r.title)) { s -= 6; reasons.push("year in title (ages)"); }
  if (r.format === "note") s -= 12;

  return { s: Math.round(s * 10) / 10, reasons };
};

const rows = [];
for (const r of manifest) {
  if (r.section !== "insights") continue;
  const body = (await readFile(`content/${r.section}/${r.slug}.md`, "utf8")).split(/^---$/m).slice(2).join("---");
  const { s, reasons } = score(r, body);
  rows.push({ ...r, score: s, reasons });
}
rows.sort((a, b) => b.score - a.score);

// Keep the launch set varied: cap any single topic so it is not all one subject.
const LAUNCH = 60, CAP = 9;
const used = {}, launch = [];
for (const r of rows) {
  const t = r.tags.find(x => TOPIC_WEIGHT[x] >= 5) || r.tags[0] || "Other";
  if ((used[t] || 0) >= CAP) continue;
  used[t] = (used[t] || 0) + 1;
  launch.push(r);
  if (launch.length >= LAUNCH) break;
}

await writeFile("content/ranking.json", JSON.stringify(
  rows.map(r => ({ slug: r.slug, score: r.score, title: r.title, tags: r.tags, series: r.series, reasons: r.reasons })), null, 2));
await writeFile("content/launch-set.json", JSON.stringify(launch.map(r => r.slug), null, 2));

console.log("scored:", rows.length);
console.log("launch set:", launch.length, "| topic spread:", used);
console.log("\nTop 22 by score:");
launch.slice(0, 22).forEach((r, i) =>
  console.log(`${String(i + 1).padStart(2)}. [${String(r.score).padStart(5)}] ${r.title.slice(0, 74)}`));
console.log("\nScore range across all:", rows[0].score, "→", rows[rows.length - 1].score);
