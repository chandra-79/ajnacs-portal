/* The Ajna mark: a four-colour diamond cut by a single light source.
   The four hues are the ones the original logo was built from, pulled off
   full saturation so they hold on white, on navy, and in CMYK.
   Geometry is generated — every quadrant is one triangle under a rotation —
   so the colours always meet cleanly and the file stays small. */

export const MARK_COLOURS = ["#E8402A", "#F5A623", "#17A05E", "#2B57E8"]; // red, amber, green, blue
export const MARK_INK = "#0B1226";

const C = 50, R = 46;
const TRI = `M ${C} ${C - R} L ${C + R} ${C} L ${C} ${C} Z`;
const quads = (fn) => [0, 90, 180, 270]
  .map((a, i) => `<g transform="rotate(${a} ${C} ${C})">${fn(i)}</g>`).join("");

/* `uid` keeps gradient ids unique when several marks share one document.
   `ink` is the centre; passing currentColor lets it follow the theme. */
export function mark({ size = 40, uid = "m", ink = "currentColor", title = "" } = {}) {
  const g = `lit-${uid}`;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" ${
    title ? `role="img" aria-label="${title}"` : 'aria-hidden="true" focusable="false"'}>`
    + `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="#fff" stop-opacity=".30"/>`
    + `<stop offset=".45" stop-color="#fff" stop-opacity="0"/>`
    + `<stop offset=".55" stop-color="#000" stop-opacity="0"/>`
    + `<stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient></defs>`
    + quads(i => `<path d="${TRI}" fill="${MARK_COLOURS[i]}"/>`)
    + `<path d="M ${C} ${C - R} L ${C + R} ${C} L ${C} ${C + R} L ${C - R} ${C} Z" fill="url(#${g})"/>`
    + quads(() => `<path d="M ${C} ${C - R} L ${C} ${C} L ${C + R} ${C}" stroke="#000" stroke-width="1" opacity=".16" fill="none"/>`)
    + `<circle cx="${C}" cy="${C}" r="6" fill="${ink}"/>`
    + `</svg>`;
}

/* Standalone file: needs a real ink colour and an xmlns. */
export function markFile(size = 512) {
  return mark({ size, uid: "f", ink: MARK_INK, title: "Ajna Consulting Services" })
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
}
