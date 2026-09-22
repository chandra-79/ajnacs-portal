# ajnacs.com

The website for Ajna Consulting Services. Static HTML and CSS, published by
GitHub Pages from `main` on the custom domain **ajnacs.com**.

The site itself has **no framework, no CDN and no runtime dependencies**. The
generator that produces it is local tooling and never ships.

## Layout

```
content/          markdown source + manifest.json (the publishing queue)
tools/            the generator — runs locally or in CI, output is committed
assets/css|js     hand-authored stylesheet and a single progressive-enhancement script
insights/ notes/  generated article pages
series/ topics/   generated index pages
images/           logo and favicon
```

## Working on it

```sh
npm install          # installs `marked`, used only by the generator
npm run build        # regenerate every page from content/
npm test             # verify the result before committing
python3 -m http.server 8797   # preview at http://127.0.0.1:8797
```

`npm run build` is not optional after editing anything under `content/` or
`tools/`. CI fails a push whose committed HTML does not match what the
generator produces.

## Publishing cadence

Articles are not all live. `content/manifest.json` gives every article a date,
and the generator only emits articles whose date has arrived. Everything later
stays in the repository as markdown and produces no page.

A scheduled workflow (`.github/workflows/deploy.yml`) rebuilds Mon/Wed/Fri and
commits whatever has come due. Because Pages publishes from the branch, that
commit *is* the deployment — no manual step.

To change the cadence, edit the schedule in `tools/schedule.mjs` and re-run:

```sh
node tools/ingest.mjs    # re-read source markdown, normalise, remap dates
node tools/rank.mjs      # score articles for launch relevance
node tools/schedule.mjs  # assign published/queued dates
npm run build
```

To bring one article forward, set its `date` in `content/manifest.json` to
today or earlier and rebuild.

## Where the writing came from

The articles are Chandra Lanka's own, carried over from a personal Astro site.
The ingest step drops PhD coursework entries, holds anything marked `draft`,
normalises frontmatter, derives missing descriptions **from the article's own
opening sentence** rather than generating new copy, demotes body-level `H1`s so
heading order is correct, and consolidates the tag list.

Personal essays live under `/notes/` with their own styling, deliberately kept
out of the Insights feed and off the homepage.

## Attribution

Articles are original. The `References & further reading` block on an article is
generated from `tools/references.mjs`, which links **only** projects the article
already names, and only to that project's own documentation. Every URL in that
file was checked before it was added. Nothing is attributed to a source the
author did not mention.

Third-party logos previously stored in `images/` were removed: they were not
displayed anywhere on the site, and they included corporate marks and a state
insignia that had not been cleared for use. They remain in git history; purging
them from history would need a rewrite and a force push.

## Forms

The contact form posts to Formspree over `fetch`, so the visitor stays on the
page. It carries a honeypot field, uses `novalidate` so validation messages are
ours rather than the browser's, and reports failure instead of showing a false
success — which the previous `mailto:` version did.

## Accessibility

Skip link, landmark regions, labelled controls, visible focus rings, live
regions where content actually changes, `prefers-reduced-motion` and
`forced-colors` support. `npm test` checks the ones that can be checked
statically.
