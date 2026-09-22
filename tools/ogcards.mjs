/* Social preview cards.

   These were emitted as SVG and referenced as og:image. Two problems: the
   build wrote them to foo.svg/index.html so the URL answered 301 text/html,
   and no major platform — Facebook, LinkedIn, X, Slack, iMessage — renders
   SVG for og:image anyway. Both meant every share of this site showed no
   image at all.

   They are PNG now, and one per topic rather than one per article. The set
   of topics is fixed, so the scheduled publisher never has to rasterise
   anything: an article that goes live in 2028 already has its card. The
   article's own title is carried by og:title, which every platform renders
   as text beside the image.

   They are JPEG, not PNG: the card is mostly a smooth gradient, which is
   what JPEG is good at and PNG is not. Measured on one card — PNG 341KB,
   a 128-colour PNG 104KB but with the mark crushed to 27 distinct colours,
   JPEG q88 39KB with 2,827. */
import { colorFor } from "./visuals.mjs";
import { mark } from "./mark.mjs";
import { PRIMARY_TOPICS } from "./lib.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function ogCardFor(topic) {
  const [c1, c2] = colorFor(topic ? [topic] : []);
  const label = topic || "Engineering, written down";
  const size = label.length > 26 ? 52 : label.length > 18 ? 62 : 72;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111a35"/><stop offset="1" stop-color="#0a1020"/>
    </linearGradient>
    <radialGradient id="h" cx="0.82" cy="0.1" r="0.8">
      <stop offset="0" stop-color="${c1}" stop-opacity=".55"/>
      <stop offset="1" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="i" cx="0.06" cy="1" r="0.7">
      <stop offset="0" stop-color="${c2}" stop-opacity=".40"/>
      <stop offset="1" stop-color="${c2}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#h)"/>
  <rect width="1200" height="630" fill="url(#i)"/>
  <g transform="translate(86 78)">${mark({ size: 74, uid: "og", ink: "#eaf0ff", still: true })}</g>
  <text x="178" y="118" font-family="Georgia,serif" font-size="46" fill="#ffffff">Ajna</text>
  <text x="272" y="118" font-family="Montserrat,Helvetica,Arial,sans-serif" font-size="21"
        font-weight="700" letter-spacing="1.4" fill="#93a7d0">CONSULTING SERVICES</text>
  <text x="86" y="${330 + (size > 60 ? 0 : 14)}" font-family="Montserrat,Helvetica,Arial,sans-serif"
        font-size="${size}" font-weight="800" letter-spacing="-1.4" fill="#ffffff">${esc(label)}</text>
  <rect x="86" y="${372 + (size > 60 ? 0 : 14)}" width="88" height="6" rx="3" fill="${c1}"/>
  <text x="86" y="${438 + (size > 60 ? 0 : 14)}" font-family="Inter,Helvetica,Arial,sans-serif"
        font-size="25" fill="#aebbd8">Architecture decisions, production failures,</text>
  <text x="86" y="${474 + (size > 60 ? 0 : 14)}" font-family="Inter,Helvetica,Arial,sans-serif"
        font-size="25" fill="#aebbd8">and the trade-offs behind them.</text>
  <text x="86" y="560" font-family="Montserrat,Helvetica,Arial,sans-serif" font-size="19"
        font-weight="700" letter-spacing="2" fill="#6f83ab">AJNACS.COM</text>
</svg>`;
}

export async function ogTopics() {
  const { readFile } = await import("node:fs/promises");
  const manifest = JSON.parse(await readFile("content/manifest.json", "utf8"));
  const { primaryTopic } = await import("./lib.mjs");
  const found = new Set(manifest.map(m => primaryTopic(m.tags)).filter(Boolean));
  for (const t of PRIMARY_TOPICS) found.add(t);
  return ["", ...[...found].sort()];
}
export const ogSlug = (topic) =>
  topic ? topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "default";
