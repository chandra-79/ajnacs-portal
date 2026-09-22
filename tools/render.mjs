/* Markdown -> HTML, plus the figure work that makes articles worth looking at. */
import { Marked } from "marked";
import { esc } from "./lib.mjs";

const slugifyHeading = (s) => s.toLowerCase().replace(/<[^>]+>/g, "")
  .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);

export function makeRenderer() {
  const m = new Marked({ gfm: true, breaks: false });
  const headings = [];
  m.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slugifyHeading(text);
        if (depth === 2) headings.push({ id, text: text.replace(/<[^>]+>/g, "") });
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

/* ---- pull-out figures ---------------------------------------------------
   Many articles carry hard numbers in prose. Surfacing two or three as a
   figure gives the reader something to look at and remember. We only ever
   show numbers the author already wrote. */
export function extractStats(body) {
  // Pull out whole sentences that carry a hard figure. Using the author's own
  // sentence — rather than splitting it into a label and a number — is the only
  // way to keep it accurate and readable. Anything ambiguous is skipped.
  const out = [];
  const seen = new Set();

  const clean = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s*\|.*$/gm, "")
    .replace(/^#{1,6} .*$/gm, "")
    .replace(/^\s*[-*]\s+/gm, "");

  const sentences = clean.split(/(?<=[.!?])\s+|\n{2,}/);
  const VALUE = /\b\d{1,4}(?:\.\d+)?\s?(?:%|x\b|ms\b|GB\b|TB\b|QPS\b|req\/s|rps\b|hours?\b|minutes?\b|weeks?\b)/;

  for (const raw of sentences) {
    if (out.length >= 2) break;
    const sentence = raw.replace(/\s+/g, " ").replace(/[*_`>#[\]]/g, "").trim();
    if (sentence.length < 48 || sentence.length > 215) continue;
    if (!/[.!?]$/.test(sentence)) continue;              // must be complete
    const m = VALUE.exec(sentence);
    if (!m) continue;
    const key = m[0];
    if (seen.has(key)) continue;
    if (/^(100\s?%|0\s?%|1x)$/.test(key.trim())) continue;
    if (/^[a-z]/.test(sentence)) continue;               // mid-sentence fragment
    if (/:\s/.test(sentence)) continue;                  // list fragment glued together
    if (/^(Below|Above|Under|Over|Between|Around|Roughly|About)\b/i.test(sentence)) continue;
    if (/&lt;|&gt;/.test(sentence)) continue;             // comparison markup reads badly
    if (/\b(e\.g|i\.e)\b/i.test(sentence)) continue;
    seen.add(key);
    out.push({ sentence, value: key });
  }
  return out;
}

/* A quiet pull-quote. The sentence is the author's; we only enlarge the figure. */
export function statStrip(stats) {
  if (!stats.length) return "";
  const s = stats[0];
  const html = esc(s.sentence).replace(
    esc(s.value),
    `<b>${esc(s.value)}</b>`
  );
  return `<aside class="keyfig">
  <p class="keyfig-label">Key figure</p>
  <p class="keyfig-text">${html}</p>
</aside>`;
}

export function barChart() { return ""; }   // superseded by the pull-quote above

/* Insert a figure after the first H2 so the page is not a wall of text. */
export function injectAfterFirstH2(html, block) {
  if (!block) return html;
  const i = html.indexOf("</h2>");
  if (i === -1) return block + html;
  return html.slice(0, i + 5) + "\n" + block + html.slice(i + 5);
}

export function tableOfContents(headings) {
  if (headings.length < 3) return "";
  return `<nav class="toc" aria-label="On this page">
  <p class="toc-title">On this page</p>
  <ol>${headings.map(h => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol>
</nav>`;
}
