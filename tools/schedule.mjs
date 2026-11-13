/* Keep published history and the future slot set; prioritize dated snapshots. */
import { readFile, writeFile } from 'node:fs/promises';
import { distributeSchedule, publicationDate } from './publication.mjs';
const file = 'content/manifest.json';
const manifest = JSON.parse(await readFile(file, 'utf8'));
const ranking = JSON.parse(await readFile('content/ranking.json', 'utf8'));
const today = publicationDate();
const next = distributeSchedule(manifest, { today, ranking });
if (process.argv.includes('--check')) {
  if (JSON.stringify(manifest) !== JSON.stringify(next)) {
    console.error('The editorial calendar needs reconciliation. Run npm run schedule.');
    process.exitCode = 1;
  }
} else {
  await writeFile(file, JSON.stringify(next, null, 2) + '\n');
}
const published = next.filter(article => article.date <= today);
const future = next.filter(article => article.date > today).sort((a,b) => a.date.localeCompare(b.date));
console.log(`As of ${today} (America/New_York): ${published.length} published; ${future.length} scheduled.`);
console.log('Cadence: one article per Monday, Wednesday or Friday; published history and future slot set preserved, dated snapshots first, chapters ordered.');
console.log(`Next: ${future[0]?.date || 'none'}; last: ${future.at(-1)?.date || 'none'}.`);
