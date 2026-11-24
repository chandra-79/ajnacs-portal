/* Refresh reviewed metadata; never reassign the authoritative publishing dates. */
import { readFile, writeFile } from 'node:fs/promises';
import { parseFront } from './lib.mjs';
import { conceptFor } from './concept-figures.mjs';

const manifestPath = 'content/manifest.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const words = body => (body.match(/[\p{L}\p{N}_]+(?:[-’'][\p{L}\p{N}_]+)*/gu) || []).length;
const reviewDate = '2026-11-24';
let changed = 0;

if (!process.argv.includes('--notes-only')) {
  const assignments = (await Promise.all(['ai', 'cloud', 'data', 'software', 'leadership'].map(async group => JSON.parse(await readFile(`docs/queue-expansion/${group}.json`, 'utf8'))))).flat();
  const bySlug = new Map(manifest.map(article => [article.slug, article]));
  for (const original of assignments) {
    const current = bySlug.get(original.slug);
    if (!current || current.date !== original.date) throw new Error(`Publishing date changed: ${original.slug}`);
    const path = `content/${current.section}/${current.slug}.md`, raw = await readFile(path, 'utf8');
    const { fm, body } = parseFront(raw);
    if (!conceptFor(current.slug) || words(body) < original.baselineBodyWords * 2) continue;
    Object.assign(current, { title: fm.title, description: fm.description, tags: fm.tags, derived: fm.derived === true || fm.derived === "true", format: fm.format || "article", words: words(body), queueRevision: reviewDate });
    // Older imports retained a superseded date in Markdown after rescheduling.
    // The manifest remains authoritative; synchronize the source, not the queue.
    if (fm.date !== current.date) await writeFile(path, raw.replace(/^date:[^\r\n]*$/m, `date: ${current.date}`));
    changed++;
  }
}

let newNotes = [];
for (const name of ['new-notes', 'additional-notes']) {
  try { newNotes.push(...JSON.parse(await readFile(`docs/queue-expansion/${name}.json`, 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
for (const note of newNotes) {
  const path = `content/notes/${note.slug}.md`, raw = await readFile(path, 'utf8');
  const { fm, body } = parseFront(raw);
  if (fm.date !== reviewDate || !fm.title || !fm.description || !Array.isArray(fm.tags) || !fm.tags.length || words(body) < 900 || !conceptFor(note.slug)) throw new Error(`New note is incomplete: ${note.slug}`);
  const metadata = { slug: note.slug, section: 'notes', title: fm.title, description: fm.description, derived: false, date: fm.date, status: 'published', originalDate: fm.date, tags: fm.tags, series: null, seriesOrder: null, words: words(body), format: fm.format || 'article', queueRevision: reviewDate };
  const index = manifest.findIndex(article => article.slug === note.slug);
  if (index >= 0) {
    if (manifest[index].section !== 'notes' || manifest[index].date !== fm.date) throw new Error(`Existing article identity conflict: ${note.slug}`);
    manifest[index] = metadata;
  } else manifest.push(metadata);
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Refreshed ${changed} expanded drafts and ${newNotes.length} personal notes. Existing publication dates preserved.`);
