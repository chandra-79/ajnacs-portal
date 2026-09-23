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
/* A stable number from a string, used where a draw order must not consume
   the PRNG — picking a motif, nudging a hue. */
function hashOf(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

/* Topic colour, nudged a few degrees per article. Twenty-four Cloud
   Architecture pieces in one grid were twenty-four identical teals; a small
   shift keeps the topic recognisable while stopping the wall of sameness. */
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  let hh = 0;
  if (d) {
    if (mx === r) hh = ((g - b) / d) % 6; else if (mx === g) hh = (b - r) / d + 2; else hh = (r - g) / d + 4;
    hh *= 60; if (hh < 0) hh += 360;
  }
  return [hh, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l];
}
function hslToHex(hh, s, l) {
  hh = ((hh % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = l - c / 2;
  const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(hh / 60) % 6];
  const to = (v) => Math.round(Math.min(1, Math.max(0, v + m)) * 255).toString(16).padStart(2, "0");
  return "#" + to(seg[0]) + to(seg[1]) + to(seg[2]);
}
function nudge(hex, dh, dl) {
  const [hh, s, l] = hexToHsl(hex);
  return hslToHex(hh + dh, Math.min(1, s * 1.02), Math.min(0.82, Math.max(0.18, l + dl)));
}

const W = 640, H = 360;
const f1 = (n) => Number(n.toFixed(1));

/* Fifteen motifs, each a different way of drawing "system". They all take the
   canvas they are handed: the heroes are 1200 wide and the cards 640, and a
   motif that drew to a fixed 640 left half a hero empty. */

function motifNodes({ r, c1, c2, w, h }) {
  const n = 10 + Math.floor(r() * 7);
  const mode = Math.floor(r() * 3);
  const mx = w * 0.09, my = h * 0.13;
  const pts = [];
  if (mode === 1) {                                   // ring
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.4, rr = R * (0.66 + r() * 0.4);
      pts.push({ x: cx + Math.cos(a) * rr * (w / Math.min(w, h)) * 0.72, y: cy + Math.sin(a) * rr });
    }
  } else if (mode === 2) {                            // two clusters
    for (let i = 0; i < n; i++)
      pts.push({ x: (i < n / 2 ? w * 0.29 : w * 0.71) + (r() - 0.5) * w * 0.28, y: my + r() * (h - my * 2) });
  } else {                                            // scatter
    for (let i = 0; i < n; i++) pts.push({ x: mx + r() * (w - mx * 2), y: my + r() * (h - my * 2) });
  }
  // Anchor the extremes. Left to itself the scatter clusters mid-frame and a
  // 1200-wide hero ends up with bare margins.
  pts.sort((a, b) => a.x - b.x);
  pts[0].x = mx * (0.6 + r() * 0.5);
  pts[pts.length - 1].x = w - mx * (0.6 + r() * 0.5);
  const reach = Math.min(w, h) * (0.4 + r() * 0.26) * (mode === 2 ? 1.5 : 1);
  let edges = "";
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < reach)
        edges += `<line x1="${f1(pts[i].x)}" y1="${f1(pts[i].y)}" x2="${f1(pts[j].x)}" y2="${f1(pts[j].y)}" stroke="${c1}" stroke-opacity=".3" stroke-width="1.4"/>`;
    }
  const nodes = pts.map((p, i) =>
    `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(4.5 + (i % 3) * 3.5)}" fill="${i % 2 ? c2 : c1}" fill-opacity=".88"/>`).join("");
  return edges + nodes;
}

function motifLayers({ r, c1, c2, w, h }) {
  const n = 3 + Math.floor(r() * 3);
  const mode = Math.floor(r() * 3);
  const gap = h * 0.055, bh = (h * 0.7 - gap * (n - 1)) / n, top = h * 0.15;
  let out = "";
  for (let i = 0; i < n; i++) {
    const y = top + i * (bh + gap);
    let bw, x;
    if (mode === 0) { bw = w * (0.4 + i * 0.1); x = (w - bw) / 2; }
    else if (mode === 1) { bw = w * (0.8 - i * 0.1); x = w * 0.1 + i * w * 0.05; }
    else { bw = w * 0.56; x = (w - bw) / 2 + (i - (n - 1) / 2) * w * 0.07; }
    out += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(bw)}" height="${f1(bh)}" rx="${f1(Math.min(9, bh / 3))}"
      fill="${i % 2 ? c1 : c2}" fill-opacity="${(0.15 + i * 0.12).toFixed(2)}"
      stroke="${c1}" stroke-opacity=".45" stroke-width="1.2"/>`;
    if (mode !== 2 && i < n - 1)
      out += `<line x1="${f1(w / 2)}" y1="${f1(y + bh)}" x2="${f1(w / 2)}" y2="${f1(y + bh + gap)}" stroke="${c1}" stroke-opacity=".38" stroke-width="1.4"/>`;
  }
  return out;
}

function motifFlow({ r, c1, c2, id, w, h }) {
  const cols = 3 + Math.floor(r() * 3), rows = 2 + Math.floor(r() * 2);
  const bw = w * 0.105, bh = Math.min(h * 0.16, 36);
  const gx = (w - bw * cols) / (cols + 1), gy = (h - bh * rows) / (rows + 1);
  const spine = Math.floor(r() * rows);   // one row always runs end to end
  let out = "";
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const x = gx + j * (bw + gx), y = gy + i * (bh + gy);
    if (i === spine || r() > 0.3) {
      out += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(bw)}" height="${f1(bh)}" rx="7" fill="${c1}" fill-opacity="${(0.12 + r() * 0.48).toFixed(2)}" stroke="${c2}" stroke-opacity=".5" stroke-width="1.1"/>`;
      if (j < cols - 1 && (i === spine || r() > 0.34))
        out += `<path d="M${f1(x + bw)} ${f1(y + bh / 2)} H${f1(x + bw + gx - 4)}" stroke="${c1}" stroke-opacity=".38" stroke-width="1.3" fill="none" marker-end="url(#ah${id})"/>`;
    }
  }
  return out;
}

function motifWave({ r, c1, c2, w, h }) {
  const n = 3 + Math.floor(r() * 4);
  const band = r() > 0.55;
  const span = h * 0.74, top = h * 0.14;
  let out = "";
  if (band) out += `<rect x="0" y="${f1(top + span * 0.34)}" width="${w}" height="${f1(span * 0.3)}" fill="${c2}" fill-opacity=".07"/>`;
  for (let k = 0; k < n; k++) {
    const amp = span * (0.07 + r() * 0.15), off = top + span * ((k + 0.6) / (n + 0.2));
    const freq = w / (5 + r() * 7), ph = r() * 6.28;
    let d = `M0 ${f1(off)}`;
    for (let x = 0; x <= w; x += Math.max(8, w / 52))
      d += ` L${f1(x)} ${f1(off + Math.sin(x / freq + ph) * amp)}`;
    d += ` L${w} ${f1(off + Math.sin(w / freq + ph) * amp)}`;
    out += `<path d="${d}" fill="none" stroke="${k % 2 ? c2 : c1}" stroke-opacity="${(0.48 - k * 0.055).toFixed(2)}" stroke-width="${(2.2 - k * 0.2).toFixed(1)}" stroke-linecap="round"/>`;
  }
  return out;
}

function motifGrid({ r, c1, c2, w, h }) {
  const cell = 30 + Math.floor(r() * 22), gap = 5 + Math.floor(r() * 6);
  const rx = r() > 0.5 ? 5 : 1, fill = 0.42 + r() * 0.26;
  const cols = Math.floor((w - gap) / (cell + gap)), rows = Math.floor((h - gap) / (cell + gap));
  const ox = (w - (cols * (cell + gap) - gap)) / 2, oy = (h - (rows * (cell + gap) - gap)) / 2;
  let out = "";
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const v = r();
    if (v > 1 - fill)
      out += `<rect x="${f1(ox + j * (cell + gap))}" y="${f1(oy + i * (cell + gap))}" width="${cell}" height="${f1(cell * 0.78)}" rx="${rx}" fill="${v > 0.88 ? c2 : c1}" fill-opacity="${(v * 0.7).toFixed(2)}"/>`;
  }
  return out;
}

function motifBars({ r, c1, c2, w, h }) {
  const n = 7 + Math.floor(r() * 6);
  const sorted = r() > 0.55, base = h * 0.84, top = h * 0.12;
  let vs = Array.from({ length: n }, () => 0.18 + r() * 0.82);
  if (sorted) vs = vs.sort((a, b) => b - a);
  const slot = (w * 0.86) / n, bw = slot * 0.58, ox = w * 0.08 + (slot - bw) / 2;
  let out = `<line x1="${f1(w * 0.05)}" y1="${f1(base)}" x2="${f1(w * 0.95)}" y2="${f1(base)}" stroke="${c1}" stroke-opacity=".4" stroke-width="1.4"/>`;
  vs.forEach((v, i) => {
    const bh = (base - top) * v;
    out += `<rect x="${f1(ox + i * slot)}" y="${f1(base - bh)}" width="${f1(bw)}" height="${f1(bh)}" rx="${f1(Math.min(6, bw / 3))}" fill="${i % 3 === 0 ? c2 : c1}" fill-opacity="${(0.3 + v * 0.5).toFixed(2)}"/>`;
  });
  return out;
}

/* Rings and satellites: rounds, replicas, quorums — anything that circles a
   centre rather than flowing through it. */
function motifOrbits({ r, c1, c2, w, h }) {
  const cx = w * (0.44 + r() * 0.12), cy = h * 0.52;
  const RX = w * 0.46, RY = h * 0.42;
  const rings = 3 + Math.floor(r() * 3);
  let out = `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(RY * 0.12)}" fill="${c2}" fill-opacity=".75"/>`;
  for (let i = 1; i <= rings; i++) {
    const t = 0.26 + (i / rings) * 0.74, wob = 0.86 + r() * 0.28;
    const rx = RX * t, ry = RY * t * wob;
    out += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="none" stroke="${c1}" stroke-opacity="${(0.42 - i * 0.03).toFixed(2)}" stroke-width="1.4"/>`;
    const sats = 1 + Math.floor(r() * 3);
    for (let s = 0; s < sats; s++) {
      const a = r() * 6.28;
      out += `<circle cx="${f1(cx + Math.cos(a) * rx)}" cy="${f1(cy + Math.sin(a) * ry)}" r="${f1(3.5 + r() * 4)}" fill="${s % 2 ? c2 : c1}" fill-opacity=".82"/>`;
    }
  }
  return out;
}

/* A hierarchy that branches left to right: taxonomies, dependency trees,
   decisions that fan out. */
function motifTree({ r, c1, c2, w, h }) {
  const depth = 3 + Math.floor(r() * 2);
  const stepX = (w * 0.82) / depth;
  let out = "";
  let level = [{ x: w * 0.1, y: h / 2 }];
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (const p of level) {
      const kids = d === 0 ? 2 + Math.floor(r() * 2) : (r() > 0.32 ? 2 : 1);
      const spread = (h * 0.78) / Math.pow(2.1, d + 1);
      for (let k = 0; k < kids; k++) {
        const y = Math.min(h * 0.92, Math.max(h * 0.08, p.y + (k - (kids - 1) / 2) * spread));
        const x = p.x + stepX;
        out += `<path d="M${f1(p.x)} ${f1(p.y)} C${f1(p.x + stepX * 0.5)} ${f1(p.y)}, ${f1(x - stepX * 0.5)} ${f1(y)}, ${f1(x)} ${f1(y)}" fill="none" stroke="${c1}" stroke-opacity="${(0.4 - d * 0.06).toFixed(2)}" stroke-width="1.4"/>`;
        next.push({ x, y });
      }
    }
    level = next.slice(0, 12);
  }
  for (const p of level) out += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="4.5" fill="${c2}" fill-opacity=".8"/>`;
  out += `<circle cx="${f1(w * 0.1)}" cy="${f1(h / 2)}" r="7" fill="${c1}" fill-opacity=".9"/>`;
  return out;
}

/* Bands of varying width crossing the frame: volume moving from one place to
   another — ingest to store, spend to team. */
function motifRibbons({ r, c1, c2, w, h }) {
  const n = 3 + Math.floor(r() * 3);
  let out = "", y = h * 0.14;
  for (let i = 0; i < n && y < h * 0.9; i++) {
    const tw = h * (0.05 + r() * 0.13), drop = (r() - 0.45) * h * 0.4;
    const y2 = Math.min(h * 0.86, Math.max(h * 0.08, y + drop));
    out += `<path d="M0 ${f1(y)} C${f1(w * 0.38)} ${f1(y)}, ${f1(w * 0.62)} ${f1(y2)}, ${w} ${f1(y2)} L${w} ${f1(y2 + tw)} C${f1(w * 0.62)} ${f1(y2 + tw)}, ${f1(w * 0.38)} ${f1(y + tw)}, 0 ${f1(y + tw)} Z"
      fill="${i % 2 ? c2 : c1}" fill-opacity="${(0.12 + r() * 0.2).toFixed(2)}"/>`;
    y += tw + h * 0.045;
  }
  return out;
}

/* Lanes and segments: phases, migrations, rollouts — work laid against time. */
function motifTimeline({ r, c1, c2, w, h }) {
  const lanes = 3 + Math.floor(r() * 3);
  const lh = (h * 0.72) / lanes, top = h * 0.14;
  let out = "";
  for (let i = 0; i < lanes; i++) {
    const y = top + i * lh + lh * 0.18, bh = lh * 0.5;
    out += `<line x1="${f1(w * 0.05)}" y1="${f1(y + bh / 2)}" x2="${f1(w * 0.95)}" y2="${f1(y + bh / 2)}" stroke="${c1}" stroke-opacity=".2" stroke-width="1"/>`;
    let x = w * (0.06 + r() * 0.16);
    while (x < w * 0.9) {
      const sw = w * (0.08 + r() * 0.2);
      out += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.min(sw, w * 0.92 - x))}" height="${f1(bh)}" rx="${f1(bh / 2)}" fill="${i % 2 ? c1 : c2}" fill-opacity="${(0.25 + r() * 0.45).toFixed(2)}"/>`;
      x += sw + w * (0.03 + r() * 0.12);
    }
  }
  return out;
}

/* Two axes and a cloud of points: comparisons, trade-offs, this against
   that. */
function motifScatter({ r, c1, c2, w, h }) {
  const x0 = w * 0.09, y0 = h * 0.86, x1 = w * 0.95, y1 = h * 0.1;
  let out = `<path d="M${f1(x0)} ${f1(y1)} V${f1(y0)} H${f1(x1)}" fill="none" stroke="${c1}" stroke-opacity=".38" stroke-width="1.3"/>`;
  const n = 14 + Math.floor(r() * 12), slope = 0.4 + r() * 0.8, noise = 0.1 + r() * 0.22;
  for (let i = 0; i < n; i++) {
    const t = r();
    const px = x0 + t * (x1 - x0) * 0.96;
    const py = y0 - ((t * slope + (r() - 0.5) * noise) * (y0 - y1));
    out += `<circle cx="${f1(px)}" cy="${f1(Math.min(y0 - 3, Math.max(y1, py)))}" r="${f1(3.5 + r() * 5)}" fill="${i % 4 === 0 ? c2 : c1}" fill-opacity="${(0.32 + r() * 0.45).toFixed(2)}"/>`;
  }
  return out;
}

/* Orthogonal traces and pads: the machine underneath — kernels, interconnect,
   bare metal. */
function motifCircuit({ r, c1, c2, w, h }) {
  const n = 5 + Math.floor(r() * 5), step = Math.max(18, h * 0.07);
  let out = "";
  for (let i = 0; i < n; i++) {
    let x = w * (0.04 + r() * 0.1), y = h * (0.12 + r() * 0.76);
    let d = `M${f1(x)} ${f1(y)}`;
    let guard = 0;
    while (x < w * 0.94 && guard++ < 12) {
      x = Math.min(w * 0.94, x + w * (0.08 + r() * 0.16));
      d += ` H${f1(x)}`;
      if (r() > 0.42) {
        y = Math.min(h * 0.9, Math.max(h * 0.1, y + (r() - 0.5) * step * 3));
        d += ` V${f1(y)}`;
      }
    }
    out += `<path d="${d}" fill="none" stroke="${i % 2 ? c2 : c1}" stroke-opacity="${(0.3 + r() * 0.28).toFixed(2)}" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>`;
    out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.6" fill="${c2}" fill-opacity=".7"/>`;
  }
  return out;
}

/* A quiet baseline with spikes through a threshold: incidents, anomalies,
   the thing you get paged about. */
function motifPulse({ r, c1, c2, w, h }) {
  const mid = h * 0.6, thr = h * 0.3;
  let out = `<path d="M0 ${f1(thr)} H${w}" stroke="${c2}" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="6 6" fill="none"/>`;
  const step = w / (34 + Math.floor(r() * 24));
  let d = `M0 ${f1(mid)}`;
  for (let x = step; x <= w; x += step) {
    const v = r();
    const y = v > 0.88 ? thr - (h * 0.14) * r() : v > 0.7 ? mid - (mid - thr) * (0.3 + r() * 0.5) : mid - (r() - 0.5) * h * 0.07;
    d += ` L${f1(x)} ${f1(Math.max(h * 0.06, y))}`;
  }
  out += `<path d="${d}" fill="none" stroke="${c1}" stroke-opacity=".62" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
  return out;
}

/* A tessellation, partly filled: cells, tenants, regions, zones — many of the
   same thing, some of them lit. */
function motifLattice({ r, c1, c2, w, h }) {
  const s = 26 + r() * 16;
  const dx = s * 1.5, dy = s * Math.sqrt(3);
  let out = "";
  for (let row = -1; row * dy * 0.5 < h + dy; row++) {
    for (let col = -1; col * dx < w + dx; col++) {
      const cx = col * dx, cy = row * dy * 0.5 + (col % 2 ? dy / 2 : 0);
      const v = r();
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 3) * k;
        return `${f1(cx + Math.cos(a) * s * 0.92)},${f1(cy + Math.sin(a) * s * 0.92)}`;
      }).join(" ");
      out += v > 0.72
        ? `<polygon points="${pts}" fill="${v > 0.9 ? c2 : c1}" fill-opacity="${(0.3 + v * 0.42).toFixed(2)}"/>`
        : `<polygon points="${pts}" fill="none" stroke="${c1}" stroke-opacity=".22" stroke-width="1"/>`;
    }
  }
  return out;
}

/* Nothing diagrammatic: soft overlapping fields. For writing that is not
   about a system, where a node graph or a bar chart is just decoration
   wearing a lab coat. */
function motifField({ r, c1, c2, w, h }) {
  let out = "";
  for (let i = 0; i < 5; i++) {
    const cx = w * 0.14 + r() * w * 0.72, cy = h * 0.17 + r() * h * 0.66;
    const rx = w * (0.14 + r() * 0.24), ry = h * (0.14 + r() * 0.26);
    out += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}"
      fill="${i % 2 ? c2 : c1}" fill-opacity="${(0.07 + r() * 0.09).toFixed(3)}"
      transform="rotate(${(r() * 60 - 30).toFixed(1)} ${f1(cx)} ${f1(cy)})"/>`;
  }
  for (let k = 0; k < 3; k++) {
    const off = h * (0.25 + k * 0.25), amp = h * (0.04 + r() * 0.05), ph = r() * 6.28;
    let d = `M0 ${f1(off)}`;
    for (let x = 0; x <= w; x += Math.max(12, w / 30)) d += ` L${f1(x)} ${f1(off + Math.sin(x / (w / 4.2) + ph) * amp)}`;
    d += ` L${w} ${f1(off + Math.sin(w / (w / 4.2) + ph) * amp)}`;
    out += `<path d="${d}" fill="none" stroke="${c1}" stroke-opacity="${(0.16 - k * 0.04).toFixed(2)}" stroke-width="1.6"/>`;
  }
  return out;
}

/* The motif is chosen by subject, not by seed. A seeded pick gave a personal
   essay about saying no a four-stage pipeline diagram, which is decoration
   pretending to be information.

   Two passes, because tags alone are too blunt. "DevSecOps" sits on both a
   piece about Dockerfile layer caching and one about container networking,
   and those want different pictures. So read what the article is actually
   called first, then fall back to its tags. */
const SUBJECT_HINTS = [
  [/\b(incidents?|outages?|postmortems?|anomal\w+|alerts?|paging|on-call|oncall|failures?|degrad\w+|error budget|burn rate|chaos)\b/, motifPulse],
  [/\b(inventor\w+|catalog\w*|tagging|polic\w+|governance|audit\w*|complian\w+|permissions?|hardening|secrets?|access control)\b/, motifGrid],
  [/\b(cost|costs|spend|spending|billing|pricing|budget|finops|savings|invoice|economics|chargeback|showback)\b/, motifBars],
  [/\b(latency|throughput|metrics?|monitor\w*|observab\w+|tracing|traces?|p99|slo|slos|uptime|benchmark\w*|profil\w+|performance)\b/, motifWave],
  [/\b(migrat\w+|roadmaps?|phases?|timelines?|rollouts?|adoption|journey|quarter\w*|sequencing|cutover)\b/, motifTimeline],
  [/\b(etl|elt|streaming|ingest\w*|warehouses?|lakehouses?|kafka|events?|batch|replay|throughput of data)\b/, motifRibbons],
  [/\b(pipelines?|workflows?|ci\/cd|cicd|deploy\w*|releases?|queues?|orchestrat\w+|approval\w*|automat\w+)\b/, motifFlow],
  [/\b(consensus|replicat\w+|quorum|raft|paxos|leader election|eventual\w*|shard\w+|partition\w+|multi-region|failover)\b/, motifOrbits],
  [/\b(network\w*|mesh|topolog\w+|routing|ingress|dns|bgp|load balanc\w+|peering|service discovery|microservices?|distributed|graph|dependenc\w+)\b/, motifNodes],
  [/\b(kernel|cpu|gpu|memory|silicon|firmware|bare ?metal|interconnect|bandwidth|hardware|io|syscalls?|drivers?)\b/, motifCircuit],
  [/\b(containers?|images?|dockerfiles?|layers?|namespaces?|cgroups?|stack|abstraction\w*|runtime|filesystems?|caching)\b/, motifLayers],
  [/\b(hierarch\w+|taxonom\w+|trees?|inheritance|decisions?|branch\w+|structures?|org chart|modul\w+|boundaries)\b/, motifTree],
  [/\b(multi-?tenan\w+|tenants?|regions?|zones?|cells?|fleets?|scal\w+ out|capacity|quotas?)\b/, motifLattice],
  // Last, because "X vs Y" describes how a piece is argued, not what it is
  // about. "Ethernet vs. InfiniBand" wants the fabric, not a scatter plot.
  [/\b(vs\.?|versus|compared?|comparison|trade-?offs?|choosing|which one|when to use|picking)\b/, motifScatter],
];

/* Tag fallback. By this point all we know is the domain, so any of the
   domain's defensible pictures will do — and picking one of three by slug is
   what stops twenty-four Cloud Architecture articles sharing one drawing.
   Order is most characteristic first: Containers outranks DevSecOps because a
   piece about image layers filed under both is about the layers. */
const MOTIF_PRIORITY = [
  ["FinOps",                [motifBars, motifRibbons, motifTimeline]],
  ["Observability",         [motifWave, motifPulse, motifScatter]],
  ["Reliability",           [motifPulse, motifWave, motifOrbits]],
  ["Performance",           [motifWave, motifScatter, motifBars]],
  ["Containers",            [motifLayers, motifLattice, motifCircuit]],
  ["Data Engineering",      [motifRibbons, motifFlow, motifTimeline]],
  ["Platform Engineering",  [motifFlow, motifLayers, motifTree]],
  ["API Design",            [motifFlow, motifTree, motifNodes]],
  ["DevSecOps",             [motifFlow, motifGrid, motifTimeline]],
  ["Programming",           [motifLayers, motifTree, motifCircuit]],
  ["Cloud Architecture",    [motifGrid, motifOrbits, motifLattice]],
  ["Infrastructure",        [motifCircuit, motifGrid, motifLattice]],
  ["Security",              [motifGrid, motifLattice, motifTree]],
  ["Distributed Systems",   [motifNodes, motifOrbits, motifLattice]],
  ["AI & MLOps",            [motifNodes, motifFlow, motifScatter]],
  ["Enterprise AI",         [motifNodes, motifRibbons, motifScatter]],
  ["Quantum Computing",     [motifOrbits, motifNodes, motifLattice]],
  ["Architecture",          [motifNodes, motifLayers, motifTree]],
];

/* Broad or human labels never appear above, deliberately. An article
   carrying only these, and saying nothing in its title about a system, gets
   the soft field rather than a diagram about nothing:
   Engineering Leadership, Engineering Practice, Fundamentals, Personal,
   Career, Learning, Mentorship, Moving, Music, Work. */

function motifFor(tags, calm, title = "", slug = "") {
  if (calm) return motifField;
  const text = String(title).toLowerCase();
  for (const [re, fn] of SUBJECT_HINTS) if (re.test(text)) return fn;
  const has = new Set(tags || []);
  for (const [topic, set] of MOTIF_PRIORITY)
    if (has.has(topic)) return set[hashOf(slug + "|" + topic) % set.length];
  return motifField;
}

const motifName = (fn) => fn.name.replace(/^motif/, "").toLowerCase();

export const motifNameFor = (tags, calm, title, slug) => motifName(motifFor(tags, calm, title, slug));

/* Says which rule chose the figure, so the build can check that a figure is
   only ever absent because there was nothing systemic to draw. */
export function motifReason(tags, calm, title = "", slug = "") {
  if (calm) return { name: "field", why: "note" };
  const text = String(title).toLowerCase();
  for (const [re, fn] of SUBJECT_HINTS) if (re.test(text)) return { name: motifName(fn), why: "title" };
  const has = new Set(tags || []);
  for (const [topic, set] of MOTIF_PRIORITY)
    if (has.has(topic)) return { name: motifName(set[hashOf(slug + "|" + topic) % set.length]), why: "tag:" + topic };
  return { name: "field", why: "no systemic subject" };
}

export const SPECIFIC_TOPICS = MOTIF_PRIORITY.map(([t]) => t);
export const MOTIF_COUNT = new Set([...SUBJECT_HINTS.map(([, f]) => f), ...MOTIF_PRIORITY.flatMap(([, s]) => s)]).size;

export function artwork(slug, tags, { w = W, h = H, calm = false, title = "" } = {}) {
  const r = seeded(slug);
  const k = hashOf(slug);
  const [b1, b2] = colorFor(tags);
  // A few degrees of hue either way, so a grid of one topic is not a grid of
  // one colour. The topic still reads; the wall of sameness does not.
  const dh = ((k % 21) - 10) * 0.9, dl = (((k >> 5) % 9) - 4) * 0.012;
  const c1 = nudge(b1, dh, dl), c2 = nudge(b2, dh, dl * 0.6);
  const motif = motifFor(tags, calm, title, slug);
  const id = slug.replace(/[^a-z0-9]/g, "").slice(0, 12) || "a";
  // Three grounds, picked per article for the same reason.
  const g = k % 3;
  const grad = g === 0
    ? `<linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}" stop-opacity=".10"/><stop offset="1" stop-color="${c2}" stop-opacity=".22"/></linearGradient>`
    : g === 1
    ? `<linearGradient id="bg${id}" x1="0" y1="1" x2="0.4" y2="0"><stop offset="0" stop-color="${c2}" stop-opacity=".20"/><stop offset="1" stop-color="${c1}" stop-opacity=".07"/></linearGradient>`
    : `<radialGradient id="bg${id}" cx="0.22" cy="0.16" r="1"><stop offset="0" stop-color="${c1}" stop-opacity=".21"/><stop offset="1" stop-color="${c2}" stop-opacity=".07"/></radialGradient>`;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs>
    ${grad}
    <marker id="ah${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0 0 L7 3.5 L0 7 z" fill="${c1}" fill-opacity=".5"/>
    </marker>
    <clipPath id="cp${id}"><rect width="${w}" height="${h}"/></clipPath>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg${id})"/>
  <g clip-path="url(#cp${id})">${motif({ r, c1, c2, id, w, h })}</g>
</svg>`;
}
