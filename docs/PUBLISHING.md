# Ajna publishing and article artwork

The editorial calendar contains 521 distinct articles. As of 12 November 2026,
93 are published and 428 are planned. The planned queue uses separate Monday,
Wednesday and Friday dates, from 13 November 2026 through 6 August 2029.
Already-published dates and URLs are preserved. Planned series chapters use
their reserved dates in reading order.

Dated current/past-year headlines take the earliest future slots ahead of
evergreen posts. Early timely assignments stay anchored; displaced evergreen
posts take the freed later dates, so the overall slot set is unchanged. A
time-bound series chapter brings any unpublished prerequisites forward too.
The remaining chapters keep reading order. An editor can explicitly mark a
manifest item `timeSensitive: true` when freshness is not apparent in its title.

As of 12 November, the seven dated snapshots are now:

| Date | Snapshot |
| --- | --- |
| 13 November 2026 | Serverless versus containers, 2026 |
| 16 November 2026 | AI coding assistants, 2026 |
| 18 November 2026 | The quantum computing race, 2025 |
| 20 November 2026 | Platform engineering, 2026 |
| 23 November 2026 | Python packaging, 2026 |
| 25 November 2026 | Quantum computing quick take, 2025 |
| 27 November 2026 | Quantum computing reality check, 2025 |

These are scheduling changes; the snapshots' historical year labels and
article bodies are retained. None waits until 2028 or 2029.

`content/manifest.json` is the publishing authority. `npm run schedule` reconciles
status, validates paths, preserves history and assigns distinct free slots to
new or conflicting future entries. It is safe to repeat on the same day.
`npm run schedule:check` reports whether reconciliation is needed.

The site uses the America/New_York calendar. The scheduled workflow freezes
that date once, reconciles the queue, builds, verifies, commits due output and
explicitly requests a GitHub Pages build. The workflow runs at 06:17 UTC on
Monday, Wednesday and Friday; GitHub may delay scheduled runs. A source push
or workflow commit alone is not a deployment receipt.

For a reproducible preview, set `TODAY=YYYY-MM-DD` for schedule, build and test.
An invalid date fails instead of exposing the backlog. Future article HTML is
withheld; source Markdown and prepared image assets remain in this public
publishing repository.

Article, series and engagement artwork is generated from the subject and source
text by `tools/editorial-art.mjs`. Personal essays have separate illustrations
appropriate to their subjects. No random texture or stock photograph stands in
for the subject. Desktop heroes and compact mobile artwork share that direction.
Every article also has a raster social preview prepared in advance, so future
publication does not depend on an image service. `sources.json` identifies the
exact artwork input used for each cached preview.

Social preview URLs include the exact SVG input hash, so a rebuilt image has a
new share URL without requesting an external cache purge. `.nojekyll` tells
GitHub Pages to serve this generator's static output directly; source Markdown
is not processed by a second site generator.

The architecture decision record guide and short essay are separate works.
The guide is restored at `architecture-decision-records-guide`; the essay keeps
its original `architecture-decision-records` path. Import source identities
prevent a future import from overwriting one with the other.

Run `npm run build` and `npm test` before publication. The checks cover all
articles and previews, subject regressions, unique paths, future date spacing,
series ordering, UTC/local-date boundaries, local references, generated pages
and withholding future articles. Browser review additionally covers compact
and wide artwork, light/dark appearance and page overflow.

GitHub's token-to-Pages trigger limitation is documented in
[Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
