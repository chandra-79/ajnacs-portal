/* Rasterise the mark into the icon set.

   This is not part of `build`: it needs a browser, and the icons only change
   when the mark does. It is run by hand after editing tools/mark.mjs, and
   `verify` fails if it has not been - the mark's shading was rewritten once
   and images/ajna-mark.svg, the favicon and the touch icons all stayed on
   the old drawing while the cache-busting version in every page's <head>
   moved to match the new one. Everything below is generated from
   markFile(), so there is one drawing and no hand-kept copies of it.

   There is no rsvg or imagemagick here. Chrome's own --screenshot does the
   job and needs nothing installed, which is why this is a dozen short
   browser runs rather than a DevTools session. */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFile, readFile, copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { markFile } from "./mark.mjs";

const run = promisify(execFile);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ICO_SIZES = [16, 32, 48, 64, 128, 256];

const work = await mkdtemp(join(tmpdir(), "ajna-icons-"));

async function shoot(html, w, h, name) {
  const page = join(work, `${name}.html`), out = join(work, `${name}.png`);
  await writeFile(page, html);
  await run(CHROME, [
    "--headless", "--disable-gpu", "--hide-scrollbars",
    `--screenshot=${out}`, `--window-size=${w},${h}`,
    "--default-background-color=00000000",
    "file://" + page,
  ]).catch((e) => { if (!e.code) throw e; });   // Chrome exits non-zero on harmless mac policy warnings
  return readFile(out);
}

/* The bare mark on nothing, for the favicon and the SVG icon. */
const bare = (size) =>
  `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${markFile(size)}`;

/* iOS composites transparency onto black, so the touch icon gets its own
   ground and breathing room rather than being the bare mark. */
const padded = (size, pad, bg) =>
  `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0}`
  + `body{width:${size}px;height:${size}px;background:${bg};display:grid;place-items:center}svg{display:block}</style>`
  + markFile(size - pad * 2);

const pngs = [];
for (const s of ICO_SIZES) pngs.push([s, await shoot(bare(s), s, s, `m${s}`)]);

/* ICO is a directory of images, and every entry here is a PNG - read by
   every browser since IE11, and a tenth of the size of the same icon as
   bitmaps. 256 is written as 0, which is how the format says 256. */
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
const dir = Buffer.alloc(16 * pngs.length);
let offset = header.length + dir.length;
pngs.forEach(([size, png], i) => {
  const e = i * 16;
  dir.writeUInt8(size >= 256 ? 0 : size, e);
  dir.writeUInt8(size >= 256 ? 0 : size, e + 1);
  dir.writeUInt16LE(1, e + 4);
  dir.writeUInt16LE(32, e + 6);
  dir.writeUInt32LE(png.length, e + 8);
  dir.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
const ico = Buffer.concat([header, dir, ...pngs.map(([, p]) => p)]);

await mkdir("images", { recursive: true });
await writeFile("images/ajna-mark.svg", markFile(512));
await writeFile("images/favicon.ico", ico);
await writeFile("images/apple-touch-icon.png", await shoot(padded(180, 26, "#ffffff"), 180, 180, "touch"));
await writeFile("images/icon-512.png", await shoot(padded(512, 74, "#ffffff"), 512, 512, "i512"));
await writeFile("favicon.png", pngs.find(([s]) => s === 32)[1]);
await copyFile("images/favicon.ico", "favicon.ico");

/* The stamp verify reads. If the mark moves and this script is not re-run,
   the build fails rather than shipping a stale icon under a fresh version. */
await writeFile("images/.mark-hash", createHash("sha256").update(markFile(512)).digest("hex") + "\n");
await rm(work, { recursive: true, force: true });

console.log(`icons: ico ${ICO_SIZES.join("/")} (${ico.length}b), ajna-mark.svg, apple-touch-icon, icon-512, favicon.png`);
