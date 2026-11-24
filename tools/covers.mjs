/* Warm, dimensional article covers. The subject illustration comes from the
   same source-specific drawing used by the original editorial system. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { articleDirection, editorialArtwork } from './editorial-art.mjs';
import { colorFor } from './visuals.mjs';
import { noteCover } from './note-covers.mjs';
import { leadCover } from './lead-covers.mjs';
import { esc } from './lib.mjs';
import { conceptFor, conceptSvg } from './concept-figures.mjs';

const photos = new Set([
  'sre-toil-reduction',
  'platform-engineering-idp-2026',
  'cloud-unit-economics',
  'ai-coding-assistants-comparison-2026',
  'serverless-vs-containers-2026',
]);

export function coverArt(slug, width = 1280, height = 720) {
  const concept = conceptFor(slug);
  if (concept) return conceptSvg(concept, width, height);
  const illustration = noteCover(slug, width, height) || leadCover(slug, width, height);
  if (illustration) return illustration.svg;
  const direction = articleDirection(slug);
  const [c1, c2] = colorFor(direction.tags);
  return editorialArtwork(direction, {
    w: width, h: height, c1, c2, id: `cover-${slug}`, cover: true,
  });
}

export function photoFor(slug) {
  if (!photos.has(slug)) return null;
  const alt = leadCover(slug, 1280, 720).alt;
  const path = `/assets/covers/photos/${slug}.jpg`;
  const small = `/assets/covers/photos/${slug}-640.jpg`;
  const version = Buffer.concat([readFileSync(`.${path}`),readFileSync(`.${small}`)]);
  const hash = createHash('sha256').update(version).digest('hex').slice(0,12);
  return { path: `${path}?v=${hash}`, small: `${small}?v=${hash}`, alt, width: 1280, height: 720 };
}

export function coverDescription(slug) {
  return conceptFor(slug)?.alt || noteCover(slug, 1280, 720)?.alt || leadCover(slug, 1280, 720)?.alt || articleDirection(slug)?.description || "";
}

export function coverFor(article, { hero = false, sizes = '(min-width: 800px) 420px, 100vw' } = {}) {
  const photo = photoFor(article.slug);
  const version = createHash('sha256').update(coverArt(article.slug)).digest('hex').slice(0, 12);
  const path = photo?.path || `/assets/covers/${article.slug}.svg?v=${version}`;
  const source = photo && ` srcset="${photo.small} 640w, ${photo.path} 1280w" sizes="${sizes}"`;
  return `<img data-article-art="${esc(article.slug)}" src="${path}"${source || ''} width="1280" height="720" alt="${hero ? esc(photo?.alt || coverDescription(article.slug)) : ''}" decoding="async" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}
