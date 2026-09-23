/* A large, still rendering of the mark for close inspection: the resting
   diamond, the bloom it opens into, and the lockup. Nothing here ships -
   .preview/ is ignored - it exists so the logo can be looked at big.

   The two states are baked out of the live mark rather than redrawn, by
   replacing the classes the stylesheet animates with the transforms it
   would compose. A preview that redraws the geometry is a preview of a
   second logo. */
import { writeFile } from "node:fs/promises";
import { mark, MARK_INK } from "../tools/mark.mjs";

const one = (uid) => mark({ size: 100, uid, ink: MARK_INK }).replace(/^<svg[^>]*>|<\/svg>$/g, "");

/* At rest: every facet at its own angle, leaves folded away to nothing. */
const atRest = (uid) => one(uid)
  .replace(/class="am-petal" style="--a:(-?\d+)deg"/g, 'transform="rotate($1 50 50)"')
  .replace(/<g class="am-leaf[^"]*" style="--a:-?\d+deg">.*?<\/g>/g, "");

/* Open: the diamond shrunk and turned to become the bud, eight leaves
   unfolded from behind it, core drawn back. */
const open = (uid) => one(uid)
  .replace(/class="am-petal" style="--a:(-?\d+)deg"/g, 'transform="rotate($1 50 50)"')
  .replace(/<g class="(am-leaf[^"]*)" style="--a:(-?\d+)deg">/g, '<g transform="rotate($2 50 50)">')
  .replace(/<g class="am-bud">/, '<g transform="translate(50 50) scale(.44) translate(-50 -50)">')
  .replace(/<g class="am-core">/, '<g transform="translate(50 50) scale(.48) translate(-50 -50)">');

const place = (inner, x, y, size) =>
  `<g transform="translate(${x} ${y}) scale(${size / 100})">${inner}</g>`;

const W = 1680, H = 1120;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ajna Consulting Services mark, at rest and open">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Quintessential&amp;family=Inter:wght@400;600&amp;display=swap');
  .lbl{font:600 17px Inter,system-ui,sans-serif;fill:#5f6b86;letter-spacing:.09em;text-transform:uppercase}
  .note{font:400 16px Inter,system-ui,sans-serif;fill:#8a93a8}
  .wm{font:400 84px Quintessential,Georgia,serif;fill:${MARK_INK}}
  .rule{stroke:#e4e7ee;stroke-width:1}
</style>
<rect width="${W}" height="${H}" fill="#ffffff"/>

<text class="lbl" x="120" y="96">At rest</text>
<text class="note" x="120" y="128">Four facets, one light from the top left. The seams step, so the solid reads.</text>
${place(atRest("a"), 120, 168, 620)}

<text class="lbl" x="940" y="96">Open</text>
<text class="note" x="940" y="128">On hover and on keyboard focus. Eight leaves unfold from behind the diamond; on the page the mark also turns.</text>
${place(open("b"), 940, 168, 620)}

<line class="rule" x1="120" y1="880" x2="${W - 120}" y2="880"/>
<text class="lbl" x="120" y="932">Lockup, and the mark at the sizes it is actually used</text>
${place(atRest("c"), 120, 968, 104)}
<text class="wm" x="252" y="1052">Ajna Consulting Services</text>
${place(atRest("d"), 1180, 992, 64)}
${place(atRest("e"), 1270, 1004, 40)}
${place(atRest("f"), 1332, 1012, 24)}
${place(atRest("g"), 1372, 1016, 16)}
</svg>
`;
await writeFile(new URL("./logo-large.svg", import.meta.url), svg);
console.log("wrote .preview/logo-large.svg");
