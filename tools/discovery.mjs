export const featuredCollections = [
  { slug: 'platform-engineering-idp-2026', label: 'Platform engineering', description: 'Build a self-service platform and measure whether teams use it.' },
  { slug: 'sre-toil-reduction', label: 'Site reliability', description: 'Measure operational toil and calculate the payback for automation.' },
  { slug: 'cloud-unit-economics', label: 'Cloud cost', description: 'Calculate cloud spend per order, request or other business outcome.' },
];

export function topicPath(topic, hubs) {
  if (!hubs.has(topic)) return `/insights/?topic=${encodeURIComponent(topic)}`;
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/topics/${slug}/`;
}

export function relatedArticles(article, candidates) {
  return candidates.flatMap(other => {
    if (other.slug === article.slug) return [];
    const shared = article.tags.filter(tag => other.tags.includes(tag)).length;
    const score = shared + (article.series && other.series === article.series ? 4 : 0);
    return score > 0 ? [{ other, score }] : [];
  }).sort((a,b) => b.score - a.score || b.other.date.localeCompare(a.other.date) || a.other.slug.localeCompare(b.other.slug))
    .slice(0,3).map(({ other }) => other);
}

export function robotsPolicy(siteUrl) {
  const trainingAndArchives = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'];
  return `# Public pages are available for indexing and search referrals.\nUser-agent: *\nAllow: /\nDisallow: /content/\nDisallow: /tools/\nDisallow: /docs/\nDisallow: /brand-lab/\n\n# Training and dataset collection. Search-specific crawlers remain eligible.\n${trainingAndArchives.map(agent => `User-agent: ${agent}`).join('\n')}\nDisallow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
