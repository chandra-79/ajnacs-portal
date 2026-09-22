/* Hand-drawn figures for articles that name one.

   The three nginx figures that came over with the prose were the same
   matplotlib sketch three times, with the outer node labels clipped off both
   edges and the bottom row running past the canvas. These are redrawn in the
   site's own palette, sized to their own content, and shipped as SVG — a few
   hundred bytes each instead of 160KB of broken raster. */
import { writeFile } from "node:fs/promises";

const INK = "#16203a", MUTE = "#5f6b86", LINE = "#c9d2e4";
const BLUE = "#2f6fed", TEAL = "#0d9488", AMBER = "#e8a317";

/* Boxes, not circles: a label sets the width, so nothing can be clipped. */
const box = (x, y, w, h, label, sub, tone) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${tone}18" stroke="${tone}" stroke-width="1.5"/>
  <text x="${x + w / 2}" y="${y + (sub ? h / 2 - 3 : h / 2 + 5)}" text-anchor="middle"
        font-family="Montserrat,system-ui,sans-serif" font-size="14" font-weight="700" fill="${INK}">${label}</text>
  ${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 16}" text-anchor="middle"
        font-family="Inter,system-ui,sans-serif" font-size="11.5" fill="${MUTE}">${sub}</text>` : ""}`;

const arrow = (x1, y1, x2, y2, label) => `
  <path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${LINE}" stroke-width="2" marker-end="url(#a)"/>
  ${label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle"
        font-family="JetBrains Mono,monospace" font-size="10.5" fill="${MUTE}">${label}</text>` : ""}`;

const frame = (w, h, title, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">
  <defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="${LINE}"/></marker></defs>
  <rect width="${w}" height="${h}" rx="12" fill="#ffffff"/>
  <text x="26" y="34" font-family="Montserrat,system-ui,sans-serif" font-size="13" font-weight="800"
        letter-spacing="1.6" fill="${MUTE}">${title.toUpperCase()}</text>
  ${inner}
</svg>`;

/* 1 — reverse proxy: one backend, the point being that the client never
   reaches it directly. */
const reverseProxy = frame(860, 260, "NGINX as a reverse proxy", `
  ${box(40, 92, 170, 76, "Client", "browser, API caller", BLUE)}
  ${arrow(216, 130, 336, 130, "request")}
  ${box(342, 92, 176, 76, "NGINX", "listens on :443", TEAL)}
  ${arrow(524, 130, 644, 130, "proxy_pass")}
  ${box(650, 92, 176, 76, "Application", "127.0.0.1:8080", AMBER)}
  <text x="430" y="212" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${MUTE}">
    The application is never addressable from outside. TLS, timeouts and headers terminate at NGINX.</text>`);

/* 2 — load balancing: the fan-out is the whole point, so three backends. */
const loadBalancing = frame(860, 340, "NGINX load balancing", `
  ${box(40, 140, 160, 72, "Client", null, BLUE)}
  ${arrow(206, 176, 320, 176)}
  ${box(326, 140, 186, 72, "NGINX", "upstream app", TEAL)}
  ${arrow(518, 160, 640, 96)}
  ${arrow(518, 176, 640, 176)}
  ${arrow(518, 192, 640, 256)}
  ${box(646, 62, 176, 68, "app-1", "10.0.1.11:8080", AMBER)}
  ${box(646, 142, 176, 68, "app-2", "10.0.1.12:8080", AMBER)}
  ${box(646, 222, 176, 68, "app-3", "10.0.1.13:8080", AMBER)}
  <text x="430" y="312" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${MUTE}">
    Default is round robin. A backend that fails its health check is taken out of rotation.</text>`);

/* 3 — the two roles together, which is what the article's third figure is
   actually for. */
const architecture = frame(860, 360, "Both roles in one server block", `
  ${box(40, 152, 150, 72, "Clients", null, BLUE)}
  ${arrow(196, 188, 306, 188, "https")}
  <rect x="312" y="108" width="200" height="160" rx="9" fill="${TEAL}18" stroke="${TEAL}" stroke-width="1.5"/>
  <text x="412" y="134" text-anchor="middle" font-family="Montserrat,system-ui,sans-serif"
        font-size="14" font-weight="700" fill="${INK}">NGINX</text>
  <text x="412" y="160" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11.5" fill="${MUTE}">TLS termination</text>
  <text x="412" y="180" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11.5" fill="${MUTE}">static files</text>
  <text x="412" y="200" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11.5" fill="${MUTE}">reverse proxy</text>
  <text x="412" y="220" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11.5" fill="${MUTE}">load balancing</text>
  <text x="412" y="240" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11.5" fill="${MUTE}">rate limiting</text>
  ${arrow(518, 168, 640, 122)}
  ${arrow(518, 208, 640, 254)}
  ${box(646, 88, 176, 68, "app-1", null, AMBER)}
  ${box(646, 220, 176, 68, "app-2", null, AMBER)}
  <text x="430" y="332" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="12" fill="${MUTE}">
    One process handles the edge concerns so the application does not have to.</text>`);

for (const [name, svg] of [["nginx-reverse-proxy", reverseProxy],
                           ["nginx-load-balancing", loadBalancing],
                           ["nginx-architecture", architecture]]) {
  await writeFile(`images/${name}.svg`, svg);
  console.log("drew", name, svg.length, "bytes");
}
