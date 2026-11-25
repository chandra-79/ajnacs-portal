import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { renderEditorialPng } from "./raster-art.mjs";

const artwork = new URL("../content/case-art/", import.meta.url);
const descriptions = JSON.parse(await readFile(new URL("descriptions.json", artwork), "utf8"));
const width = 960;
const height = 540;

export async function caseIllustration(out, { slug }) {
  if (!/^[a-z0-9-]+$/.test(slug) || !Object.hasOwn(descriptions, slug) || !descriptions[slug].trim()) {
    throw new Error(`Missing case cover description for ${slug}`);
  }
  const svg = await readFile(new URL(`${slug}.svg`, artwork), "utf8");
  const contents = renderEditorialPng(svg);
  if (contents.readUInt32BE(16) !== width || contents.readUInt32BE(20) !== height) {
    throw new Error(`Wrong case cover dimensions for ${slug}`);
  }

  const path = `assets/cases/${slug}.png`;
  const version = createHash("sha256").update(contents).digest("hex").slice(0, 12);
  await out(path, contents);
  return { src: `/${path}?v=${version}`, description: descriptions[slug], width, height };
}
