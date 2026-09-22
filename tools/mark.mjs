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
/* The four petals fill the diagonals, so opening them leaves a cross-shaped
   gap on the axes. The inner leaves point along those axes to fill it — put
   them on the diagonals instead and they simply hide underneath. */
const LEAF = `M ${C} ${C} Q ${C - 10} ${C - 18} ${C} ${C - 36} Q ${C + 10} ${C - 18} ${C} ${C} Z`;

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
  const inner = still ? "" : [0, 90, 180, 270].map((a, i) =>
    `<g class="am-leaf" style="--a:${a}deg"><path d="${LEAF}" fill="${MARK_COLOURS[1]}"/></g>`).join("");

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
    + petals
    + (still ? "" : `<circle class="am-heart" cx="${C}" cy="${C}" r="11" fill="${MARK_COLOURS[1]}"/>`)
    + `<circle class="am-core" cx="${C}" cy="${C}" r="6" fill="${ink}"/>`
    + `</svg>`;
}

/* Standalone file: a real ink colour, an xmlns, and no moving parts. */
export function markFile(size = 512) {
  return mark({ size, uid: "f", ink: MARK_INK, title: "Ajna Consulting Services", still: true })
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
}
