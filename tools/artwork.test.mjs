import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { articleDirection, compositionFor } from './editorial-art.mjs';
import { artwork } from './visuals.mjs';
import { publicationDate } from './publication.mjs';
import { coverArt, hasLocalCover, photoFor } from './covers.mjs';
import { noteCover } from './note-covers.mjs';
import { conceptFor } from './concept-figures.mjs';
import { loadServiceLibrary, servicePath } from './service-library.mjs';

const articles = JSON.parse(readFileSync(new URL('../content/manifest.json', import.meta.url), 'utf8'));

test('published and scheduled articles all have source-specific artwork and descriptions', () => {
  const keys = new Set();
  const images = new Set();
  for (const article of articles) {
    const key = `${article.section}/${article.slug}`;
    assert.ok(!keys.has(key), `duplicate publishing path: ${key}`);
    keys.add(key);
    const concept = conceptFor(article.slug);
    const direction = concept || articleDirection(article.slug);
    assert.ok(direction, `missing artwork: ${key}`);
    if (concept) assert.ok(concept.alt.length >= 20 && concept.method.length >= 30, `missing explanation: ${key}`);
    else {
      assert.ok(direction.subject.trim().length >= 3, `empty subject: ${key}`);
      assert.ok(direction.description.includes(direction.title));
    }
    const svg = concept ? coverArt(article.slug, 1200, 630) : artwork(article.slug, article.tags, { w: 1200, h: 380, title: article.title, calm: article.section === 'notes' });
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

test('art direction uses eight structurally different subject-led composition families',()=>{
  const families=new Set(articles.map(a=>compositionFor(articleDirection(a.slug))));
  assert.equal(families.size,8);
  for(const family of families){
    const a=articles.find(a=>compositionFor(articleDirection(a.slug))===family);
    assert.ok(artwork(a.slug,a.tags).includes(`data-composition="${family}"`));
  }
});

test('the software engineering capability shows API/backend work rather than a shell terminal',()=>{
 const svg=artwork('service-software-engineering',['Engineering Leadership'],{title:'Software engineering'});
 assert.ok(svg.includes('data-subject-detail="service-api"'));
 assert.ok(svg.includes('JSON response')&&svg.includes('Validate'));
 assert.ok(svg.includes('data-composition="process-strip"'));
 assert.ok(!svg.includes('$ command'));
});

test('every editorial content card and row carries a genuine subject thumbnail',()=>{
  const pages=['index.html','insights/index.html','services/index.html','contact/index.html','case-studies/index.html','topics/index.html','series/index.html','notes/index.html'];
  const selectors=['svc-card','feature','quote','topic-tile','card','case','note-row','feature-post'];
  let checked=0;
  for(const file of pages){
    const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
    const starts=[...html.matchAll(/<(?:div|article|a|figure)\b[^>]*class="([^"]+)"[^>]*>/g)].filter(m=>m[1].split(' ').some(c=>selectors.includes(c)));
    for(const m of starts){
      const end=html.slice(m.index).search(/<(?:h[1-6]|strong|blockquote|time)\b/);
      const beforeHeading=html.slice(m.index,end>0?m.index+end:m.index+3000);
      const image=beforeHeading.match(/<img[^>]+src="(\/assets\/services\/[^"?]+)(?:\?[^"]*)?"[^>]+alt="([^"]+)"/);
      if(image){
        const svg=readFileSync(new URL('..'+image[1],import.meta.url),'utf8');
        assert.match(svg,/data-article-art="service-[^"]+"/);
        assert.ok(image[2].length>=20,`${file}: service thumbnail needs meaningful alternative text`);
      }else assert.ok(beforeHeading.includes('data-article-art='),`${file}: ${m[1]} has no subject thumbnail`);
      checked++;
    }
    if(file==='index.html')for(const m of html.matchAll(/<li><div class="content-thumbnail">/g))checked++;
  }
  assert.ok(checked>=140,'the complete editorial-card templates were checked');
});

test('all 72 service pages advertise distinct source figures and correctly versioned raster previews', async () => {
  const services=await loadServiceLibrary(), images=new Set();
  let checked=0;
  for(const service of services)for(const item of [null,...service.useCases]){
    const stem=`assets/services/${service.id}/${item?.id || 'methodology'}`;
    const svg=readFileSync(new URL(`../${stem}.svg`,import.meta.url),'utf8');
    const png=readFileSync(new URL(`../${stem}-social.png`,import.meta.url));
    const svgHash=createHash('sha256').update(svg).digest('hex').slice(0,12);
    const pngHash=createHash('sha256').update(png).digest('hex').slice(0,12);
    const route=servicePath(service.id,item?.id);
    const html=readFileSync(new URL(`..${route}index.html`,import.meta.url),'utf8');
    assert.match(svg,new RegExp(`data-article-art="${(item?.figure || service.figure).slug}"`));
    assert.match(svg,/font-family="Inter, sans-serif"/);
    assert.doesNotMatch(svg,/<script|<foreignObject|<image/);
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png.readUInt32BE(16),1200);
    assert.equal(png.readUInt32BE(20),630);
    assert.ok(!images.has(pngHash),`Reused service preview ${route}`);
    images.add(pngHash);
    assert.ok(html.includes(`src="/${stem}.svg?v=${svgHash}"`),`Stale service hero ${route}`);
    assert.ok(html.includes(`content="https://ajnacs.com/${stem}-social.png?v=${pngHash}"`),`Stale service social preview ${route}`);
    assert.match(html,/property="og:image:type" content="image\/png"/);
    checked++;
  }
  assert.equal(checked,72);
});

for(const [slug,scene,detail]of [
 ['c4-model-architecture-diagrams','architecture','c4'],
 ['dimensional-modeling-star-schema','database','star-schema'],
 ['graph-databases-when','database','graph'],
 ['probabilistic-data-structures','database','bloom'],
 ['context-switching-cost','people','interruptions'],
 ['search-infrastructure-elasticsearch','index','inverted-index'],
 ['sql-window-functions-analytics','database','window'],
 ['llm-security-prompt-injection','security','sc-untrusted-context'],
 ['llm-rag-production-architecture','retrieval',undefined],
 ['async-first-collaboration','people','async-collaboration'],
 ['ab-testing-experimentation-platform','experiment',undefined],
 ['slowest-query-system','index',undefined],
 ['cloud-native-vs-cloud-hosted','architecture','native-hosted'],
 ['multi-cloud-vs-hybrid-cloud','architecture','multi-hybrid'],
 ['multipass-local-vm-development','virtualization','guest-vms'],
])test(`${slug} avoids a misleading broad-category illustration`,()=>{
 const d=articleDirection(slug);assert.ok(d,slug);assert.equal(d.scene,scene);assert.equal(d.detail,detail);
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
    const svg=article.date <= publicationDate() || conceptFor(article.slug) || hasLocalCover(article.slug) ? coverArt(article.slug, 1200, 630) : artwork(article.slug,article.tags,{w:1200,h:630,title:article.title,calm:article.section==='notes'})
      .replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]+)\)/g,'$1');
    assert.equal(sources[article.slug],createHash('sha256').update(svg).digest('hex'),`outdated preview for ${article.slug}`);
  }
});

test('published pages advertise the exact preview version, dimensions and content type',()=>{
  const articleHashes=JSON.parse(readFileSync(new URL('../assets/og/articles/sources.json',import.meta.url),'utf8'));
  const pageHashes=JSON.parse(readFileSync(new URL('../assets/og/pages/sources.json',import.meta.url),'utf8'));
  for(const a of articles.filter(a=>a.date<=publicationDate())){
    const html=readFileSync(new URL(`../${a.section}/${a.slug}/index.html`,import.meta.url),'utf8');
    const photo = photoFor(a.slug);
    const versioned = photo?.path || `/assets/og/articles/${a.slug}.png?v=${articleHashes[a.slug].slice(0,12)}`;
    assert.ok(html.includes(versioned));
    assert.ok(html.includes(`property="og:image:type" content="image/${photo ? 'jpeg' : 'png'}"`));
    assert.ok(html.includes(`property="og:image:width" content="${photo?.width || 1200}"`));
    assert.ok(html.includes(`property="og:image:height" content="${photo?.height || 630}"`));
    const hero = html.match(/<div class="article-hero"[^>]*>([^<]*<img[^>]+>)/)?.[1];
    assert.ok(hero?.includes('fetchpriority="high"'), a.slug);
    if (photo) assert.ok(hero.includes(photo.small));
    else assert.ok(readFileSync(new URL(`../assets/covers/${a.slug}.svg`,import.meta.url),'utf8') === coverArt(a.slug));
  }
  for(const [url,p]of Object.entries(pageHashes)){
    const file=url==='/'?'index.html':url.endsWith('/')?url.slice(1)+'index.html':url.slice(1);
    const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
    assert.ok(html.includes('/'+p.file+'?v='+p.hash.slice(0,12)),`stale page preview ${url}`);
    assert.ok(html.includes('property="og:image:type" content="image/png"'));
  }
});


test('each case study uses its own full-bleed composition', () => {
  const html = readFileSync(new URL('../case-studies/index.html', import.meta.url), 'utf8');
  const artwork = [...html.matchAll(/<div class="case-art">(<svg[\s\S]*?<\/svg>)/g)];
  const slugs = ['architecture-audit', 'legacy-modernisation', 'ai-into-production', 'team-enablement'];
  assert.equal(artwork.length, slugs.length);
  for (const [index, slug] of slugs.entries()) {
    assert.ok(artwork[index][1].includes(`data-article-art="${slug}"`));
    assert.match(artwork[index][1], /role="img" aria-label="[^"]+"/);
    assert.match(artwork[index][1], /viewBox="0 0 640 360"/);
  }
});

test('The Notes refresh gives each original essay its own composition on the list and the article', () => {
  const index = readFileSync(new URL('../notes/index.html', import.meta.url), 'utf8');
  const drawings = new Set();
  for (const { slug } of articles.filter(article => article.section === 'notes' && article.date <= '2026-11-23' && article.date <= publicationDate())) {
    const cover = noteCover(slug, 1280, 720);
    assert.ok(cover?.alt, `missing custom essay cover: ${slug}`);
    const drawing = cover.svg.split('</title>')[1];
    assert.ok(!drawings.has(drawing), `duplicate essay image: ${slug}`);
    drawings.add(drawing);
    assert.doesNotMatch(cover.svg, /data-composition|id="paper"|linearGradient/);
    const version = createHash('sha256').update(cover.svg).digest('hex').slice(0, 12);
    const src = `/assets/covers/${slug}.svg?v=${version}`;
    const page = readFileSync(new URL(`../notes/${slug}/index.html`, import.meta.url), 'utf8');
    assert.ok(index.includes(src) && page.includes(src));
  }
});
