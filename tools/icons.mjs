/* Rasterise the canonical mark with the same renderer used for previews. */
import { createHash } from "node:crypto";
import { writeFile, readFile, copyFile, mkdir, access } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
import { markFile } from "./mark.mjs";

const ICO_SIZES = [16, 32, 48, 64, 128, 256];
const source = markFile(512);
const stamp = createHash("sha256").update(source).digest("hex") + "\n";
const outputs = ["images/ajna-mark.svg", "images/favicon.ico", "images/apple-touch-icon.png",
  "images/icon-512.png", "favicon.png", "favicon.ico"];
const current = await Promise.all(outputs.map(file => access(file))).then(
  () => readFile("images/.mark-hash", "utf8"), () => ""
).catch(error => {
  if (error.code === "ENOENT") return "";
  throw error;
});

if (current !== stamp) {
  function raster(size, padding = 0) {
    const image = !padding ? markFile(size) : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#fff"/><g transform="translate(${padding} ${padding})">${markFile(size - padding * 2)}</g></svg>`;
    return new Resvg(image, { font: { loadSystemFonts: false } }).render().asPng();
  }
  const pngs = ICO_SIZES.map(size => [size, raster(size)]);
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
  await writeFile("images/apple-touch-icon.png", raster(180, 26));
  await writeFile("images/icon-512.png", raster(512, 74));
  await writeFile("favicon.png", pngs.find(([s]) => s === 32)[1]);
  await copyFile("images/favicon.ico", "favicon.ico");

  /* The stamp verify reads. If the mark moves and this script is not re-run,
     the build fails rather than shipping a stale icon under a fresh version. */
  await writeFile("images/.mark-hash", stamp);

  console.log(`icons: ico ${ICO_SIZES.join("/")} (${ico.length}b), ajna-mark.svg, apple-touch-icon, icon-512, favicon.png`);
}
