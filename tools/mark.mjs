/* The Ajna mark: a four-colour diamond cut by a single light source.
   The four hues are the ones the original logo was built from, pulled off
   full saturation so they hold on white, on navy, and in CMYK.

   Geometry is generated - every facet is the same triangle under a different
   rotation - so the colours always meet cleanly and the file stays small.

   Shading is per facet, not one ramp across the whole mark. A single
   diagonal gradient runs continuously over the seams, and a shape whose
   seams do not read is a flat shape: the four triangles looked painted on.
   Each facet now carries its own light, so the seams step, and the mark
   reads as a low four-sided solid seen from above.

   The facets are separate groups with their angle passed in as a custom
   property rather than a transform attribute, because a CSS transform would
   overwrite the attribute outright. That is what lets the mark bloom. */

export const MARK_COLOURS = ["#E8402A", "#F5A623", "#17A05E", "#2B57E8"]; // red, amber, green, blue
export const MARK_INK = "#0B1226";

const C = 50, R = 46;
const TRI = `M ${C} ${C - R} L ${C + R} ${C} L ${C} ${C} Z`;
const RIM = `M ${C} ${C - R} L ${C + R} ${C}`;          // the outer edge of a facet
const CUT = `M ${C} ${C - R} L ${C} ${C} L ${C + R} ${C}`;

/* Light falls from the top left. A facet's share of it is the dot product of
   its outward bisector with that direction, which puts the blue facet full
   in the light, the red and green ones edge on, and the amber one in shade.
   Positive lifts with white, negative sinks with black. */
const KEY = { 0: 0.07, 90: -0.12, 180: -0.05, 270: 0.3 };
const RIM_LIGHT = { 0: 0.34, 90: 0, 180: 0, 270: 0.46 };
const RIM_DARK = { 0: 0, 90: 0.16, 180: 0.1, 270: 0 };

/* The same light, on the ring. A leaf points away from the centre at its own
   angle, so how much of the light it takes is the dot product of that
   direction with the direction the light comes from: the leaves at the top
   left turn into it, the ones at the bottom right turn away. A flat tint per
   leaf rather than a gradient - eight gradients is a kilobyte of inline SVG
   on every page, and at forty pixels the tint is what reads anyway. */
const leafKey = (a) => {
  const r = (a * Math.PI) / 180;
  return 0.3 * Math.SQRT1_2 * (Math.cos(r) - Math.sin(r));
};

/* Prising the four facets apart leaves a hole in the middle, and a symmetric
   shape that opens a hole and closes it again reads as a mouth, not a
   flower. So the diamond never breaks: it shrinks to become the bud at the
   centre while eight leaves unfold from behind it. Nothing gapes, and the
   silhouette stays a flower the whole way through.

   Two rings of petals rather than eight identical ones: a long ring on the
   axes and a shorter, paler ring on the diagonals behind it. Eight the same
   reads as a compass rose. Rounded tips, because a pointed one reads as a
   spike however it is arranged. Tips stay inside the viewBox so nothing
   spills onto the wordmark beside it. */
const petal = (L, w) =>
  `M ${C} ${C} C ${C - w} ${C - L * 0.42}, ${C - w * 0.62} ${C - L * 0.86}, ${C} ${C - L}`
  + ` C ${C + w * 0.62} ${C - L * 0.86}, ${C + w} ${C - L * 0.42}, ${C} ${C} Z`;
const LEAF_LONG = petal(47, 15);
const LEAF_SHORT = petal(39, 14.5);

export function mark({ size = 40, uid = "m", ink = "currentColor", title = "", still = false } = {}) {
  const spin = (a) => still
    ? `transform="rotate(${a} ${C} ${C})"`
    : `class="am-petal" style="--a:${a}deg"`;

  /* The bevel runs from the crease at the centre out to the middle of the
     outer edge: dark where the facets meet, light where the solid turns
     over. Declared in the facet's own coordinates, so it rotates with the
     facet - unlike the key light, which must not. */
  const bevel = `bev-${uid}`;
  const defs = `<linearGradient id="${bevel}" gradientUnits="userSpaceOnUse" x1="${C}" y1="${C}" x2="73" y2="27">`
    + `<stop offset="0" stop-color="#000" stop-opacity=".13"/>`
    + `<stop offset=".55" stop-color="#000" stop-opacity="0"/>`
    + `<stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>`
    /* A sphere, not a dot: the core is the one round thing in the mark and
       a flat circle beside four shaded facets reads as a hole punched in it. */
    + `<radialGradient id="core-${uid}" cx=".34" cy=".3" r=".85">`
    + `<stop offset="0" stop-color="#fff" stop-opacity=".42"/>`
    + `<stop offset=".55" stop-color="#fff" stop-opacity="0"/>`
    + `<stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`;

  /* Every facet is the same triangle and every leaf the same outline, drawn
     three or four times over for colour, bevel and key light. Referencing
     one definition instead of repeating the path data keeps the inline mark
     - which ships in the header and the footer of every page - small. */
  const T = `t-${uid}`, E = `e-${uid}`, K = `k-${uid}`;
  const shapes = `<path id="${T}" d="${TRI}"/><path id="${E}" d="${RIM}"/><path id="${K}" d="${CUT}"/>`;

  const facets = [0, 90, 180, 270].map((a, i) => {
    const k = KEY[a];
    return `<g ${spin(a)}>`
      + `<use href="#${T}" fill="${MARK_COLOURS[i]}"/>`
      + `<use href="#${T}" fill="url(#${bevel})"/>`
      + (k ? `<use href="#${T}" fill="${k > 0 ? "#fff" : "#000"}" opacity="${Math.abs(k).toFixed(2)}"/>` : "")
      + (RIM_LIGHT[a] ? `<use href="#${E}" stroke="#fff" stroke-opacity="${RIM_LIGHT[a]}" stroke-width="1.6" stroke-linecap="round"/>` : "")
      + (RIM_DARK[a] ? `<use href="#${E}" stroke="#000" stroke-opacity="${RIM_DARK[a]}" stroke-width="1.6" stroke-linecap="round"/>` : "")
      + `<use href="#${K}" stroke="#000" stroke-width=".9" opacity=".2"/>`
      + `</g>`;
  }).join("");

  /* A roll across each leaf, plus the key light above, so the ring reads as
     eight surfaces at eight angles rather than eight flat cut-outs. */
  const leafShade = `lf-${uid}`;
  const leafDefs = `<linearGradient id="${leafShade}" gradientUnits="userSpaceOnUse" x1="${C - 15}" y1="${C - 20}" x2="${C + 15}" y2="${C - 20}">`
    + `<stop offset="0" stop-color="#fff" stop-opacity=".3"/>`
    + `<stop offset=".45" stop-color="#fff" stop-opacity="0"/>`
    + `<stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`;

  const LL = `ll-${uid}`, LS = `ls-${uid}`;
  const leafShapes = `<path id="${LL}" d="${LEAF_LONG}"/><path id="${LS}" d="${LEAF_SHORT}"/>`;

  const leaf = (ref, a, colour, op, cls) => {
    const k = leafKey(a);
    return `<g class="${cls}" style="--a:${a}deg">`
      + `<use href="#${ref}" fill="${colour}" opacity="${op}"/>`
      + `<use href="#${ref}" fill="url(#${leafShade})"/>`
      + (Math.abs(k) > 0.02
          ? `<use href="#${ref}" fill="${k > 0 ? "#fff" : "#000"}" opacity="${Math.abs(k).toFixed(2)}"/>` : "")
      + `</g>`;
  };

  const inner = still ? "" : [
    ...[45, 135, 225, 315].map((a, i) => leaf(LS, a, MARK_COLOURS[(i + 2) % 4], ".62", "am-leaf am-leaf-b")),
    ...[0, 90, 180, 270].map((a, i) => leaf(LL, a, MARK_COLOURS[i], ".9", "am-leaf")),
  ].join("");

  return `<svg class="ajna-mark${still ? " is-still" : ""}" viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" ${
    title ? `role="img" aria-label="${title}"` : 'aria-hidden="true" focusable="false"'}>`
    + `<defs>${shapes}${defs}${still ? "" : leafShapes + leafDefs}</defs>`
    + inner
    + `<g class="am-bud">${facets}</g>`
    + `<g class="am-core"><circle cx="${C}" cy="${C}" r="6" fill="${ink}"/>`
    + `<circle cx="${C}" cy="${C}" r="6" fill="url(#core-${uid})"/></g>`
    + `</svg>`;
}

/* Standalone file: a real ink colour, an xmlns, and no moving parts. */
export function markFile(size = 512) {
  return mark({ size, uid: "f", ink: MARK_INK, title: "Ajna Consulting Services", still: true })
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
}
