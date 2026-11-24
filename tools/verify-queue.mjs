/* Validate editorial coverage without making scheduled pages public. */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { parseFront } from './lib.mjs';
import { conceptCatalog, conceptSvg } from './concept-figures.mjs';

const groups = ['ai', 'cloud', 'data', 'software', 'leadership'];
const assignments = (await Promise.all(groups.map(async group => JSON.parse(await readFile(`docs/queue-expansion/${group}.json`, 'utf8'))))).flat();
const manifest = JSON.parse(await readFile('content/manifest.json', 'utf8'));
const bySlug = new Map(manifest.map(article => [article.slug, article]));
const figures = conceptCatalog();
const paths = new Set(JSON.parse(await readFile('content/deep-dives/index.json', 'utf8')).map(track => track.id));
const countWords = body => (body.match(/[\p{L}\p{N}_]+(?:[-’'][\p{L}\p{N}_]+)*/gu) || []).length;
const failures = [], coverage = [];

for (const original of assignments) {
  const raw = await readFile(`content/${original.section}/${original.slug}.md`, 'utf8');
  const parsed = parseFront(raw), current = bySlug.get(original.slug);
  if (!parsed || !current || current.date !== original.date || parsed.fm.date !== original.date) failures.push(`${original.slug}: scheduled date or identity changed`);
  const words = countWords(parsed?.body || ''), ratio = words / original.baselineBodyWords;
  const figure = figures.get(original.slug);
  const references = [...new Set([...raw.matchAll(/\]\((https:\/\/[^\s)]+)/g)].map(match => match[1]))];
  if (figure && ratio < 2) failures.push(`${original.slug}: ${words} words is below the ${2 * original.baselineBodyWords} minimum`);
  if (figure && references.length < 2) failures.push(`${original.slug}: fewer than two explicit primary reference links`);
  coverage.push({ slug: original.slug, date: original.date, before: original.baselineBodyWords, after: words, ratio: Number(ratio.toFixed(3)), figure: figure?.kind || 'pending', references: references.length, complete: !!figure && ratio >= 2 && references.length >= 2 });
}

for (const [slug, figure] of figures) {
  const article = bySlug.get(slug);
  // A writer may be preparing a note before the manifest integration step.
  if (!article && !process.argv.includes('--drafts')) failures.push(`${slug}: figure has no article in the manifest`);
  if (!Array.isArray(figure.studyPaths)) failures.push(`${slug}: reviewed study path list is missing`);
  else for (const id of figure.studyPaths) if (!paths.has(id)) failures.push(`${slug}: unknown study path ${id}`);
  const svg = conceptSvg(figure);
  if (/NaN|Infinity/.test(svg) || !svg.includes('viewBox="0 0 1280 720"')) failures.push(`${slug}: chart did not render finite geometry`);
  if (process.argv.includes('--assets')) {
    for (const file of [`assets/covers/${slug}.svg`, `assets/og/articles/${slug}.png`]) {
      try { await access(file); } catch { failures.push(`${slug}: missing prepared image ${file}`); }
    }
  }
}

const complete = coverage.filter(row => row.complete);
const pending = coverage.filter(row => !row.complete);
if (process.argv.includes('--complete') && pending.length) failures.push(`${pending.length} scheduled drafts remain incomplete`);
if (process.argv.includes('--write-report')) {
  await mkdir('docs/queue-expansion', { recursive: true });
  const csvCell = value => `"${String(value).replaceAll('"', '""')}"`;
  const keys = ['slug', 'date', 'before', 'after', 'ratio', 'figure', 'references', 'complete'];
  await writeFile('docs/queue-expansion/coverage.csv', [keys.join(','), ...coverage.map(row => keys.map(key => csvCell(row[key])).join(','))].join('\n') + '\n');
}
console.log(`Scheduled draft coverage: ${complete.length}/${assignments.length} expanded, illustrated and referenced; ${pending.length} pending.`);
console.log(`Body words in completed drafts: ${complete.reduce((sum, row) => sum + row.before, 0)} → ${complete.reduce((sum, row) => sum + row.after, 0)}.`);
console.log(`Concept figures prepared in source: ${figures.size}. Existing publication dates preserved.`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
