/* One-time ingest: read the portfolio's markdown, drop what we are not
   publishing, normalise frontmatter, remap dates, and write clean source
   into ./content. Run locally; its output is committed. */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const SRC = "/Users/chandra/WorkSpace/chandralanka-portfolio/src/content";
const OUT = "content";

// Tag consolidation: 198 tags, 81 used once. Map to a working taxonomy.
const TAG_MAP = {
  "AI": "Enterprise AI", "AI & MLOps": "AI & MLOps", "Enterprise AI": "Enterprise AI",
  "Machine Learning": "AI & MLOps", "MLOps": "AI & MLOps", "LLMs": "Enterprise AI",
  "GenAI": "Enterprise AI", "Generative AI": "Enterprise AI",
  "Cloud": "Cloud Architecture", "Cloud Architecture": "Cloud Architecture",
  "Cloud Native": "Cloud Architecture", "AWS": "Cloud Architecture",
  "Azure": "Cloud Architecture", "GCP": "Cloud Architecture", "Multi-Cloud": "Cloud Architecture",
  "Architecture": "Architecture", "Enterprise Architecture": "Architecture",
  "Software Architecture": "Architecture", "System Design": "Architecture",
  "Distributed Systems": "Distributed Systems", "Microservices": "Distributed Systems",
  "Event-Driven": "Distributed Systems", "Kafka": "Distributed Systems",
  "DevSecOps": "DevSecOps", "Security": "Security", "Zero Trust": "Security",
  "IAM": "Security", "AppSec": "Security", "Cybersecurity": "Security",
  "DevOps": "Platform Engineering", "Platform Engineering": "Platform Engineering",
  "SRE": "Reliability", "Reliability": "Reliability", "Observability": "Observability",
  "Monitoring": "Observability", "Performance": "Performance",
  "FinOps": "FinOps", "Cost Optimization": "FinOps",
  "Data": "Data Engineering", "Data Engineering": "Data Engineering",
  "Data & Databases": "Data Engineering", "Database": "Data Engineering",
  "Databases": "Data Engineering", "PostgreSQL": "Data Engineering", "SQL": "Data Engineering",
  "Kubernetes": "Containers", "Containers": "Containers", "Docker": "Containers",
  "Engineering Leadership": "Engineering Leadership", "Leadership": "Engineering Leadership",
  "Management": "Engineering Leadership", "Teams": "Engineering Leadership",
  "Career": "Career", "Careers": "Career",
  "Programming": "Programming", "Backend": "Programming", "Frontend": "Programming",
  "Languages": "Programming", "Testing": "Programming",
  "Linux": "Systems", "Operating Systems": "Systems", "Networking": "Systems",
  "Infrastructure": "Infrastructure", "IaC": "Infrastructure", "Terraform": "Infrastructure",
  "SDLC": "Engineering Practice", "Engineering Practice": "Engineering Practice",
  "Learn": "Fundamentals", "Fundamentals": "Fundamentals", "Tutorial": "Fundamentals",
};
const normTag = (t) => TAG_MAP[t] || t;

function parse(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return null;
  const [, fmText, body] = m;
  const fm = {};
  for (const line of fmText.split(/\r?\n/)) {
    const kv = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let [, k, v] = kv;
    v = v.trim();
    if (/^\[.*\]$/.test(v)) fm[k] = [...v.matchAll(/"([^"]*)"|'([^']*)'/g)].map(x => x[1] ?? x[2]);
    else fm[k] = v.replace(/^["']|["']$/g, "");
  }
  return { fm, body: body.trim() };
}

// The author's own opening sentence is the best description: it is already a
// declarative claim, and it keeps their voice instead of inventing new copy.
function deriveDescription(body) {
  const plain = body
    .replace(/^#{1,6} .*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*[-*>|]\s.*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
  const para = plain.split(/\n\s*\n/).find(p => p.trim().length > 60) || plain;
  const text = para.replace(/\s+/g, " ").trim();
  // Abbreviations must not be mistaken for sentence ends.
  const protectedText = text.replace(/\b(e\.g|i\.e|etc|vs|Dr|Mr|Ms|Inc|Ltd|No|Fig|approx)\./gi, m => m.replace(".", "\u0001"));
  const sentences = (protectedText.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [protectedText])
    .map(x => x.replace(/\u0001/g, ".").trim());

  // Prefer whole sentences that fit; never cut a word in half.
  let out = "";
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > 190) break;
    out = next;
    if (out.length >= 100) break;
  }
  if (!out) {
    const first = sentences[0] || text;
    if (first.length <= 190) out = first;
    else {
      const cut = first.slice(0, 187);
      out = cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\u2014-]+$/, "") + "\u2026";
    }
  }
  // Balance a stray opening quote left by a truncated quotation.
  const dq = (out.match(/"/g) || []).length;
  if (dq % 2 === 1) out = out.replace(/\s*"[^"]*$/, "").replace(/[,;:]$/, "") + "\u2026";
  return out.trim();
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

async function collect(dir) {
  const out = [];
  for (const name of await readdir(path.join(SRC, dir))) {
    if (!/\.mdx?$/.test(name)) continue;
    const raw = await readFile(path.join(SRC, dir, name), "utf8");
    const p = parse(raw);
    if (!p) { console.warn("unparseable:", dir, name); continue; }
    out.push({ ...p, file: name, coll: dir });
  }
  return out;
}

const all = [
  ...await collect("blog"),
  ...await collect("thoughts"),
  ...await collect("personal"),
];   // phd is deliberately excluded

const kept = all.filter(a => String(a.fm.draft) !== "true");
const heldDrafts = all.filter(a => String(a.fm.draft) === "true");

// ── Date remap: Oct 2024 → Sep 2026, preserving original relative order ──
kept.sort((a, b) => String(a.fm.pubDate).localeCompare(String(b.fm.pubDate)));
const START = Date.UTC(2024, 9, 1), END = Date.UTC(2026, 8, 20);
const span = END - START;
// Series must stay contiguous and in order; sort them together by seriesOrder.
const seriesSeen = new Map();
kept.forEach((a, i) => {
  const t = START + Math.round((i / Math.max(1, kept.length - 1)) * span);
  const d = new Date(t);
  // nudge off weekends so the archive reads like a working cadence
  const day = d.getUTCDay();
  if (day === 0) d.setUTCDate(d.getUTCDate() + 1);
  if (day === 6) d.setUTCDate(d.getUTCDate() + 2);
  a.newDate = d.toISOString().slice(0, 10);
  if (a.fm.series) {
    if (!seriesSeen.has(a.fm.series)) seriesSeen.set(a.fm.series, []);
    seriesSeen.get(a.fm.series).push(a);
  }
});
// Re-order each series by seriesOrder while keeping its assigned date slots.
for (const [, items] of seriesSeen) {
  const slots = items.map(x => x.newDate).sort();
  items.sort((a, b) => Number(a.fm.seriesOrder || 0) - Number(b.fm.seriesOrder || 0));
  items.forEach((a, i) => { a.newDate = slots[i]; });
}

let wroteDesc = 0, fixedH1 = 0;
const manifest = [];
for (const a of kept) {
  const isNote = a.coll === "personal";
  const section = isNote ? "notes" : "insights";
  let body = a.body;
  // A body-level H1 duplicates the page title and breaks heading order.
  if (/^#\s/m.test(body)) { body = body.replace(/^#\s+(.*)$/gm, "## $1"); fixedH1++; }
  let description = (a.fm.description || "").trim();
  let derived = false;
  if (!description) { description = deriveDescription(body); derived = true; wroteDesc++; }
  const tags = [...new Set((a.fm.tags || []).map(normTag))];
  const slug = slugify(a.file.replace(/\.mdx?$/, ""));
  const rec = {
    slug, section,
    title: a.fm.title || "",
    description,
    derived,
    date: a.newDate,
    originalDate: a.fm.pubDate,
    tags,
    series: a.fm.series || null,
    seriesOrder: a.fm.seriesOrder ? Number(a.fm.seriesOrder) : null,
    words: body.split(/\s+/).length,
    format: body.split(/\s+/).length < 250 ? "note" : "article",
  };
  manifest.push(rec);
  const fm = [
    "---",
    `title: ${JSON.stringify(rec.title)}`,
    `description: ${JSON.stringify(rec.description)}`,
    `date: ${rec.date}`,
    `tags: [${rec.tags.map(t => JSON.stringify(t)).join(", ")}]`,
    rec.series ? `series: ${JSON.stringify(rec.series)}` : null,
    rec.seriesOrder ? `seriesOrder: ${rec.seriesOrder}` : null,
    `format: ${rec.format}`,
    rec.derived ? "derived: true" : null,
    "---",
  ].filter(Boolean).join("\n");
  await mkdir(path.join(OUT, section), { recursive: true });
  await writeFile(path.join(OUT, section, `${slug}.md`), `${fm}\n\n${body}\n`, "utf8");
}

await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
await writeFile(path.join(OUT, "held-drafts.txt"),
  heldDrafts.map(d => `${d.coll}/${d.file}  —  ${d.fm.title}`).join("\n") + "\n");

const bySection = manifest.reduce((m, r) => (m[r.section] = (m[r.section] || 0) + 1, m), {});
const byFormat = manifest.reduce((m, r) => (m[r.format] = (m[r.format] || 0) + 1, m), {});
const tagCount = new Set(manifest.flatMap(r => r.tags)).size;
console.log("ingested:", manifest.length, bySection, byFormat);
console.log("held drafts:", heldDrafts.length, "| phd excluded:", (await collect("phd")).length);
console.log("descriptions derived:", wroteDesc, "| H1s demoted:", fixedH1);
console.log("unique tags after consolidation:", tagCount);
console.log("date range:", manifest.reduce((a,r)=>r.date<a?r.date:a,"9999"), "→", manifest.reduce((a,r)=>r.date>a?r.date:a,"0"));
console.log("series:", new Set(manifest.filter(r=>r.series).map(r=>r.series)).size);
