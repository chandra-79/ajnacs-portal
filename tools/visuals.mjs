/* Generated artwork.
   Every article gets its own picture, drawn from its slug so the same article
   always looks the same, and coloured by its topic. These are inline SVG:
   no photo stock, no external requests, and they follow light/dark themes. */

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

const MOTIFS = [motifNodes, motifLayers, motifFlow, motifWave, motifGrid, motifBars];

export function artwork(slug, tags, { w = W, h = H, calm = false } = {}) {
  const r = seeded(slug);
  const [c1, c2] = colorFor(tags);
  // Personal essays get the quieter motifs; charts and grids read as data and
  // sit oddly above reflective writing.
  const pool = calm ? [motifWave, motifLayers] : MOTIFS;
  const motif = pool[Math.floor(r() * pool.length)];
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

/* A larger, text-bearing card for social previews. */
export function ogCard(title, topic, tags) {
  const [c1, c2] = colorFor(tags);
  const r = seeded(title);
  const words = String(title).split(/\s+/);
  const lines = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 30) { lines.push(cur.trim()); cur = w; } else cur += " " + w;
    if (lines.length === 3) break;
  }
  if (cur.trim() && lines.length < 3) lines.push(cur.trim());
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="ahog" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" fill="${c1}" fill-opacity=".5"/>
    </marker>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a1020"/><stop offset="1" stop-color="#16203a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g opacity=".34" transform="translate(690,150) scale(1.35)">${MOTIFS[Math.floor(r() * MOTIFS.length)](seeded(title + "x"), c1, c2, "og")}</g>
  <rect x="0" y="0" width="1200" height="8" fill="${c1}"/>
  <text x="78" y="128" font-family="Montserrat,sans-serif" font-size="25" font-weight="800" fill="${c1}" letter-spacing="3.4">${esc(String(topic || "INSIGHTS").toUpperCase())}</text>
  ${lines.map((l, i) => `<text x="78" y="${228 + i * 74}" font-family="Montserrat,sans-serif" font-size="58" font-weight="800" fill="#ffffff" letter-spacing="-1.4">${esc(l)}</text>`).join("\n  ")}
  <text x="78" y="556" font-family="Inter,sans-serif" font-size="27" fill="#9fb0d0">ajnacs.com</text>
  <text x="1122" y="556" text-anchor="end" font-family="Montserrat,sans-serif" font-size="27" font-weight="700" fill="#ffffff">Ajna Consulting</text>
</svg>`;
}
