/* Generated artwork.
   Every article gets its own picture, drawn from its slug so the same article
   always looks the same, and coloured by its topic. These are inline SVG:
   no photo stock, no external requests, and they follow light/dark themes. */
import { primaryTopic } from "./lib.mjs";

export const TOPIC_COLOR = {
  "Architecture":            ["#2f6fed", "#1b4fc4"],
  "Cloud Architecture":      ["#0d9488", "#0b7a70"],
  "Enterprise AI":           ["#6d4aff", "#5837e0"],
  "AI & MLOps":              ["#6d4aff", "#5837e0"],
  "Security":                ["#e0473a", "#c03a2e"],
  "DevSecOps":               ["#e0473a", "#c03a2e"],
  "FinOps":                  ["#e8a317", "#a9760a"],
  "Engineering Leadership":  ["#0e7490", "#0b5f77"],
  "Reliability":             ["#1e9e63", "#157a4c"],
  "Observability":           ["#1e9e63", "#157a4c"],
  "Distributed Systems":     ["#2f6fed", "#1b4fc4"],
  "Data Engineering":        ["#0891b2", "#076f87"],
  "Platform Engineering":    ["#7c3aed", "#5b21b6"],
  "Containers":              ["#0284c7", "#025f96"],
  "Performance":             ["#ea580c", "#b8450b"],
  "Programming":             ["#4f46e5", "#3730a3"],
  "Infrastructure":          ["#475569", "#334155"],
  "Fundamentals":            ["#0f766e", "#0b5852"],
};
export const colorFor = (tags = []) => {
  for (const t of tags) if (TOPIC_COLOR[t]) return TOPIC_COLOR[t];
  return ["#2f6fed", "#1b4fc4"];
};

/* deterministic PRNG from a string, so artwork is stable across rebuilds */
function seeded(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return () => { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
}

const W = 640, H = 360;

/* Six motifs, each a different way of drawing "system". Chosen by seed. */
function motifNodes(r, c1, c2) {
  const pts = Array.from({ length: 13 }, () => ({ x: 56 + r() * (W - 112), y: 48 + r() * (H - 96) }));
  let edges = "";
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 168) edges += `<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}" x2="${pts[j].x.toFixed(1)}" y2="${pts[j].y.toFixed(1)}" stroke="${c1}" stroke-opacity=".28" stroke-width="1.4"/>`;
    }
  const nodes = pts.map((p, i) => {
    const rad = 5 + (i % 3) * 3.5;
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${rad}" fill="${i % 2 ? c2 : c1}" fill-opacity=".9"/>`;
  }).join("");
  return edges + nodes;
}

function motifLayers(r, c1, c2) {
  let out = "";
  const n = 4;
  for (let i = 0; i < n; i++) {
    const y = 78 + i * 56, w = 300 - i * 34, x = (W - w) / 2 + (r() - .5) * 40;
    out += `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="34" rx="8"
      fill="${i % 2 ? c1 : c2}" fill-opacity="${(0.16 + i * 0.13).toFixed(2)}"
      stroke="${c1}" stroke-opacity=".45" stroke-width="1.2"/>`;
    if (i < n - 1) out += `<line x1="${W / 2}" y1="${y + 34}" x2="${W / 2}" y2="${y + 56}" stroke="${c1}" stroke-opacity=".4" stroke-width="1.4"/>`;
  }
  return out;
}

function motifFlow(r, c1, c2, id = "") {
  const rows = 3, cols = 4; let out = "";
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const x = 86 + j * 126, y = 92 + i * 64;
    if (r() > .32) {
      out += `<rect x="${x}" y="${y}" width="66" height="32" rx="7" fill="${c1}" fill-opacity="${(0.12 + r() * 0.5).toFixed(2)}" stroke="${c2}" stroke-opacity=".5" stroke-width="1.1"/>`;
      if (j < cols - 1 && r() > .38)
        out += `<path d="M${x + 66} ${y + 16} H${x + 126}" stroke="${c1}" stroke-opacity=".38" stroke-width="1.3" marker-end="url(#ah${id})"/>`;
    }
  }
  return out;
}

function motifWave(r, c1, c2) {
  let out = "";
  for (let k = 0; k < 5; k++) {
    const amp = 26 + r() * 40, off = 70 + k * 46, ph = r() * 6.28;
    let d = `M0 ${off}`;
    for (let x = 0; x <= W; x += 16) d += ` L${x} ${(off + Math.sin(x / 78 + ph) * amp).toFixed(1)}`;
    out += `<path d="${d}" fill="none" stroke="${k % 2 ? c2 : c1}" stroke-opacity="${(0.5 - k * 0.07).toFixed(2)}" stroke-width="${(2.2 - k * 0.25).toFixed(1)}" stroke-linecap="round"/>`;
  }
  return out;
}

function motifGrid(r, c1, c2) {
  let out = "";
  for (let i = 0; i < 9; i++) for (let j = 0; j < 15; j++) {
    const v = r();
    if (v > .62) out += `<rect x="${28 + j * 40}" y="${26 + i * 36}" width="28" height="24" rx="5" fill="${v > .86 ? c2 : c1}" fill-opacity="${(v * 0.75).toFixed(2)}"/>`;
  }
  return out;
}

function motifBars(r, c1, c2) {
  let out = "";
  const n = 9;
  for (let i = 0; i < n; i++) {
    const h = 34 + r() * 190, x = 72 + i * 56;
    out += `<rect x="${x}" y="${(H - 52 - h).toFixed(1)}" width="30" height="${h.toFixed(1)}" rx="6" fill="${i % 3 === 0 ? c2 : c1}" fill-opacity="${(0.32 + (h / 260) * 0.55).toFixed(2)}"/>`;
  }
  out += `<line x1="52" y1="${H - 52}" x2="${W - 40}" y2="${H - 52}" stroke="${c1}" stroke-opacity=".42" stroke-width="1.4"/>`;
  return out;
}

/* Nothing diagrammatic: soft overlapping fields. For writing that is not
   about a system, where a node graph or a bar chart is just decoration
   wearing a lab coat. */
function motifField(r, c1, c2) {
  let out = "";
  for (let i = 0; i < 5; i++) {
    const cx = 90 + r() * (W - 180), cy = 60 + r() * (H - 120);
    const rx = 90 + r() * 150, ry = 50 + r() * 90;
    out += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}"
      fill="${i % 2 ? c2 : c1}" fill-opacity="${(0.07 + r() * 0.09).toFixed(3)}"
      transform="rotate(${(r() * 60 - 30).toFixed(1)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
  }
  for (let k = 0; k < 3; k++) {
    const off = 90 + k * 90, amp = 14 + r() * 18, ph = r() * 6.28;
    let d = `M0 ${off}`;
    for (let x = 0; x <= W; x += 22) d += ` L${x} ${(off + Math.sin(x / 150 + ph) * amp).toFixed(1)}`;
    out += `<path d="${d}" fill="none" stroke="${c1}" stroke-opacity="${(0.16 - k * 0.04).toFixed(2)}" stroke-width="1.6"/>`;
  }
  return out;
}

/* The motif is chosen by subject, not by seed. A seeded pick gave a personal
   essay about saying no a four-stage pipeline diagram, which is decoration
   pretending to be information. The seed still varies the drawing within a
   motif, so two articles on one topic do not look identical.

   Resolution is by specificity, not by the article's primary tag. "Engineering
   Leadership" sits on 72 articles, plenty of which are as technical as
   anything on the site — a piece on self-service infrastructure and approval
   workflows is filed under it, and picking on the primary tag handed that a
   blank colour field. The most specific technical tag wins wherever there is
   one; the broad organisational labels never select a motif by themselves. */
/* Two passes, because tags alone are too blunt. "DevSecOps" sits on both a
   piece about Dockerfile layer caching and one about container networking,
   and those want different pictures. So read what the article is actually
   called first, then fall back to its tags.

   This is a heuristic and is meant to read as one: the point is that every
   figure has a defensible reason to be the figure it is. */
const SUBJECT_HINTS = [
  [/\b(cost|costs|spend|spending|billing|pricing|budget|finops|savings|invoice|economics|chargeback)\b/, motifBars],
  [/\b(latency|throughput|metrics?|monitor\w*|observab\w+|tracing|traces?|p99|slo|slos|uptime|benchmark\w*|profil\w+|performance)\b/, motifWave],
  [/\b(network\w*|mesh|topolog\w+|distributed|consensus|replicat\w+|clusters?|graph|dependenc\w+|microservices?)\b/, motifNodes],
  [/\b(pipelines?|workflows?|ci\/cd|cicd|deploy\w*|releases?|etl|streaming|queues?|orchestrat\w+|approval\w*|rollout\w*|migrations?)\b/, motifFlow],
  [/\b(containers?|images?|dockerfiles?|layers?|kernel|namespaces?|cgroups?|stack|abstraction\w*|runtime|filesystem)\b/, motifLayers],
  [/\b(inventor\w+|catalog\w*|tagging|taxonom\w+|polic\w+|governance|audit\w*|complian\w+|permissions?|hardening)\b/, motifGrid],
];

/* Tag fallback, most characteristic first. Containers outranks DevSecOps
   because a piece about image layers filed under both is about the layers. */
const MOTIF_PRIORITY = [
  ["FinOps", motifBars],
  ["Observability", motifWave],
  ["Reliability", motifWave],
  ["Performance", motifWave],
  ["Containers", motifLayers],
  ["Data Engineering", motifFlow],
  ["Platform Engineering", motifFlow],
  ["API Design", motifFlow],
  ["DevSecOps", motifFlow],
  ["Programming", motifLayers],
  ["Cloud Architecture", motifGrid],
  ["Infrastructure", motifGrid],
  ["Security", motifGrid],
  ["Distributed Systems", motifNodes],
  ["AI & MLOps", motifNodes],
  ["Enterprise AI", motifNodes],
  ["Quantum Computing", motifNodes],
  ["Architecture", motifNodes],
];

/* Broad or human labels. An article carrying only these, and saying nothing
   in its title about a system, gets the field rather than a diagram about
   nothing. */
const BROAD = new Set([
  "Engineering Leadership", "Engineering Practice", "Fundamentals",
  "Personal", "Career", "Learning", "Mentorship", "Moving", "Music", "Work",
]);

function motifFor(tags, calm, title = "") {
  if (calm) return motifField;
  const text = String(title).toLowerCase();
  for (const [re, fn] of SUBJECT_HINTS) if (re.test(text)) return fn;
  const has = new Set(tags || []);
  for (const [topic, fn] of MOTIF_PRIORITY) if (has.has(topic)) return fn;
  return motifField;
}

const motifName = (fn) => fn.name.replace(/^motif/, "").toLowerCase();

export const motifNameFor = (tags, calm, title) => motifName(motifFor(tags, calm, title));

/* Says which rule chose the figure, so the build can check that a figure is
   only ever absent because there was nothing systemic to draw. */
export function motifReason(tags, calm, title = "") {
  if (calm) return { name: "field", why: "note" };
  const text = String(title).toLowerCase();
  for (const [re, fn] of SUBJECT_HINTS) if (re.test(text)) return { name: motifName(fn), why: "title" };
  const has = new Set(tags || []);
  for (const [topic, fn] of MOTIF_PRIORITY) if (has.has(topic)) return { name: motifName(fn), why: "tag:" + topic };
  return { name: "field", why: "no systemic subject" };
}

export const SPECIFIC_TOPICS = MOTIF_PRIORITY.map(([t]) => t);

export function artwork(slug, tags, { w = W, h = H, calm = false, title = "" } = {}) {
  const r = seeded(slug);
  const [c1, c2] = colorFor(tags);
  // A personal note never gets a diagram; a technical article gets the one
  // that matches its subject, and anything unmapped falls back to the field
  // rather than to a diagram chosen at random.
  const motif = motifFor(tags, calm, title);
  const id = slug.replace(/[^a-z0-9]/g, "").slice(0, 12) || "a";
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}" stop-opacity=".10"/>
      <stop offset="1" stop-color="${c2}" stop-opacity=".22"/>
    </linearGradient>
    <marker id="ah${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" fill="${c1}" fill-opacity=".5"/>
    </marker>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg${id})"/>
  ${motif(r, c1, c2, id)}
</svg>`;
}

