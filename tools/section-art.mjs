import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const directory = new URL("../content/section-art/", import.meta.url);
const descriptions = JSON.parse(readFileSync(new URL("descriptions.json", directory), "utf8"));

export function fitCover(svg, width, height) {
  if (!/^<svg\b/.test(svg)) throw new Error("Expected an SVG cover");
  const fitted = svg.replace(/^<svg\b[^>]*>/, start => start
    .replace(/\s(?:width|height|preserveAspectRatio)="[^"]*"/g, "")
    .replace(/>$/, ' width="100%" height="100%" preserveAspectRatio="xMidYMid slice">'));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${fitted}</svg>`;
}

export function sectionCover(slug) {
  const alt = Object.hasOwn(descriptions, slug) ? descriptions[slug] : null;
  if (!/^[a-z0-9-]+$/.test(slug) || typeof alt !== "string" || !alt.trim()) {
    throw new Error(`Missing editorial cover description for ${slug}`);
  }
  const source = readFileSync(new URL(`${slug}.svg`, directory), "utf8");
  const svg = fitCover(source, 1280, 720).replace("<svg ", `<svg data-article-art="${slug}" `);
  return {
    alt, svg,
    socialSvg: fitCover(source, 1200, 630),
    version: createHash("sha256").update(svg).digest("hex").slice(0, 12),
  };
}
