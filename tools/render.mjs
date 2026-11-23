/* Markdown -> HTML, plus the figure work that makes articles worth looking at. */
import { Marked } from "marked";
import { esc } from "./lib.mjs";

/* parseInline hands back HTML, so its text is already entity-encoded. The
   contents list escapes again on the way out, which turned &quot; into a
   literal &quot; on the page — so decode before storing the plain text. */
const unescapeEntities = (s) => s
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

const slugifyHeading = (s) => s.toLowerCase().replace(/<[^>]+>/g, "")
  .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);

export function makeRenderer() {
  const m = new Marked({ gfm: true, breaks: false });
  const headings = [];
  const usedIds = new Set();
  m.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const base = slugifyHeading(text) || 'section';
        let id = base;
        for (let suffix = 2; usedIds.has(id); suffix++) id = `${base}-${suffix}`;
        usedIds.add(id);
        if (depth === 2) headings.push({ id, text: unescapeEntities(text.replace(/<[^>]+>/g, "")) });
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      table(token) {
        const head = token.header.map(c => `<th>${this.parser.parseInline(c.tokens)}</th>`).join("");
        const rows = token.rows.map(r =>
          `<tr>${r.map(c => `<td>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`).join("");
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const ext = /^https?:\/\//.test(href) && !href.includes("ajnacs.com");
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${ext ? ' rel="noopener" target="_blank"' : ""}>${text}</a>`;
      },
      image({ href, title, text }) {
        return `<figure><img src="${esc(href)}" alt="${esc(text || "")}" loading="lazy" decoding="async">${title ? `<figcaption>${esc(title)}</figcaption>` : ""}</figure>`;
      },
    },
  });
  return { marked: m, headings };
}

/* A copyable link on every heading. Generated rather than scripted so it
   still works with JavaScript off, and hidden until hover so it stays out of
   the way of reading. */
export function headingAnchors(html) {
  return html.replace(/<(h[23]) id="([^"]+)">/g,
    (m, tag, id) => `<${tag} id="${id}"><a class="h-anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>`);
}

export function tableOfContents(headings) {
  if (headings.length < 3) return "";
  return `<nav class="toc" aria-label="On this page">
  <p class="toc-title">On this page</p>
  <ol>${headings.map(h => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol>
</nav>`;
}
