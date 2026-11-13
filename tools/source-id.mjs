/* Distinct source articles must never overwrite one another after import. */
export function importedSlug(article, baseSlug, collisions, prior) {
  const known = [...prior.values()].find(record =>
    record.sourceCollection === article.coll && record.sourceFile === article.file);
  if (known) return known.slug;
  if (!collisions.has(baseSlug)) return baseSlug;
  const existing = prior.get(baseSlug);
  if (existing?.title === article.fm.title) return baseSlug;
  return `${baseSlug}-${article.coll === 'blog' ? 'guide' : article.coll}`;
}
