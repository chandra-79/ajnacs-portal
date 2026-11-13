import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { articleDirection } from './editorial-art.mjs';
import { artwork } from './visuals.mjs';

const articles = JSON.parse(readFileSync(new URL('../content/manifest.json', import.meta.url), 'utf8'));

test('published and scheduled articles all have source-specific artwork and descriptions', () => {
  const keys = new Set();
  const images = new Set();
  for (const article of articles) {
    const key = `${article.section}/${article.slug}`;
    assert.ok(!keys.has(key), `duplicate publishing path: ${key}`);
    keys.add(key);
    const direction = articleDirection(article.slug);
    assert.ok(direction, `missing artwork: ${key}`);
    assert.ok(direction.subject.trim().length >= 3, `empty subject: ${key}`);
    assert.ok(direction.description.includes(direction.title));
    const svg = artwork(article.slug, article.tags, { w: 1200, h: 380, title: article.title, calm: article.section === 'notes' });
    assert.ok(svg.includes(`data-article-art="${article.slug}"`));
    assert.ok(svg.includes('aria-label="'));
    assert.ok(!svg.includes('<image') && !svg.includes('<script'));
    assert.ok(!images.has(svg), `reused article image: ${key}`);
    images.add(svg);
  }
});

for (const [slug, scene] of [
  ['api-pagination-patterns', 'pagination'], ['ethernet-vs-infiniband-networking-2026', 'fabric'],
  ['enterprise-caching-architecture', 'cache'], ['llm-rag-production-architecture', 'retrieval'],
  ['cloud-iam-least-privilege', 'identity'], ['database-indexing-explained', 'index'],
  ['raft-consensus-explained', 'consensus'], ['containers-production-dockerfiles', 'container'],
  ['finops-tagging-policy', 'cost'], ['quantum-computing-race-2025', 'quantum'],
  ['on-reading', 'reading'], ['on-moving-countries', 'journey'],
  ['running-local-llm-lessons', 'model'], ['oci-architect-associate-guide', 'architecture'],
  ['platform-eng-idp-design', 'platform'], ['python-async-production', 'code'],
  ['structured-logging-practices', 'telemetry'], ['multipass-local-vm-development', 'virtualization'],
  ['quick-take-hiring-for-potential', 'people'], ['quick-take-sprint-velocity', 'people'],
  ['quick-take-architecture-review-changes-nothing', 'governance'], ['http3-quic-explained','network'],
  ['accessibility-engineering-practice','accessibility'], ['backup-strategies-that-restore','backup'],
  ['green-software-engineering','energy'], ['internationalization-engineering','locale'],
  ['consistent-hashing-explained','hashring'], ['time-clocks-distributed-systems','time'],
]) test(`${slug} depicts its actual subject`, () => assert.equal(articleDirection(slug).scene, scene));

test('card and hero clipping identifiers cannot collide across sizes or similar slugs', () => {
  const ids = new Set();
  for (const slug of ['api-design-enterprise', 'api-design-principles']) {
    for (const [w,h] of [[640,360], [1200,380]]) {
      const svg = artwork(slug, [], { w,h });
      const id = svg.match(/<clipPath id="([^"]+)"/)[1];
      assert.ok(!ids.has(id));
      ids.add(id);
      assert.ok(svg.includes(`url(#${id})`));
    }
  }
});

test('every published and planned article has a real 1200 by 630 social preview', () => {
  const sources=JSON.parse(readFileSync(new URL('../assets/og/articles/sources.json',import.meta.url),'utf8'));
  assert.equal(Object.keys(sources).length,articles.length);
  for(const article of articles) {
    assert.match(sources[article.slug],/^[a-f0-9]{64}$/);
    const bytes=readFileSync(new URL(`../assets/og/articles/${article.slug}.png`,import.meta.url));
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.equal(bytes.readUInt32BE(16),1200);
    assert.equal(bytes.readUInt32BE(20),630);
    assert.ok(bytes.length>1000,`empty preview for ${article.slug}`);
    const svg=artwork(article.slug,article.tags,{w:1200,h:630,title:article.title,calm:article.section==='notes'})
      .replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]+)\)/g,'$1');
    assert.equal(sources[article.slug],createHash('sha256').update(svg).digest('hex'),`outdated preview for ${article.slug}`);
  }
});
