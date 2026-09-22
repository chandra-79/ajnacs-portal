/* The Ajna mark: a four-colour diamond cut by a single light source.
   The four hues are the ones the original logo was built from, pulled off
   full saturation so they hold on white, on navy, and in CMYK.

   Geometry is generated — every petal is the same triangle under a different
   rotation — so the colours always meet cleanly and the file stays small.

   The petals are separate groups with their angle passed in as a custom
   property rather than a transform attribute, because a CSS transform would
   overwrite the attribute outright. That is what lets the mark bloom: the
   stylesheet composes each petal's own rotation with a push outward. */

export const MARK_COLOURS = ["#E8402A", "#F5A623", "#17A05E", "#2B57E8"]; // red, amber, green, blue
export const MARK_INK = "#0B1226";

const C = 50, R = 46;
const TRI = `M ${C} ${C - R} L ${C + R} ${C} L ${C} ${C} Z`;
const CUT = `M ${C} ${C - R} L ${C} ${C} L ${C + R} ${C}`;
/* Prising the four petals apart leaves a hole in the middle, and a symmetric
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
  const g = `lit-${uid}`;
  const spin = (a) => still
    ? `transform="rotate(${a} ${C} ${C})"`
    : `class="am-petal" style="--a:${a}deg"`;
  const petals = [0, 90, 180, 270].map((a, i) =>
    `<g ${spin(a)}>`
    + `<path d="${TRI}" fill="${MARK_COLOURS[i]}"/>`
    + `<path d="${TRI}" fill="url(#${g})"/>`
    + `<path d="${CUT}" stroke="#000" stroke-width="1" opacity=".16" fill="none"/>`
    + `</g>`).join("");
  const inner = still ? "" : [
    ...[45, 135, 225, 315].map((a, i) =>
      `<g class="am-leaf am-leaf-b" style="--a:${a}deg"><path d="${LEAF_SHORT}" fill="${MARK_COLOURS[(i + 2) % 4]}" opacity=".62"/></g>`),
    ...[0, 90, 180, 270].map((a, i) =>
      `<g class="am-leaf" style="--a:${a}deg"><path d="${LEAF_LONG}" fill="${MARK_COLOURS[i]}" opacity=".9"/></g>`),
  ].join("");

  return `<svg class="ajna-mark${still ? " is-still" : ""}" viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" ${
    title ? `role="img" aria-label="${title}"` : 'aria-hidden="true" focusable="false"'}>`
    /* userSpaceOnUse so one light falls across the whole mark instead of each
       petal carrying its own ramp, which would read as a pinwheel. */
    + `<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="8" y1="8" x2="92" y2="92">`
    + `<stop offset="0" stop-color="#fff" stop-opacity=".30"/>`
    + `<stop offset=".45" stop-color="#fff" stop-opacity="0"/>`
    + `<stop offset=".55" stop-color="#000" stop-opacity="0"/>`
    + `<stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient></defs>`
    + inner
    + `<g class="am-bud">${petals}</g>`
    + `<circle class="am-core" cx="${C}" cy="${C}" r="6" fill="${ink}"/>`
    + `</svg>`;
}

/* Standalone file: a real ink colour, an xmlns, and no moving parts. */
export function markFile(size = 512) {
  return mark({ size, uid: "f", ink: MARK_INK, title: "Ajna Consulting Services", still: true })
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
}
