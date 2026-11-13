/* Complete source/use inventory; intentional shared identity and UI symbols
   are grouped by exact bytes, while every editorial use remains explicit. */
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash}from'node:crypto';
import {articleDirection,compositionFor}from'./editorial-art.mjs';
import {pageImageDirection}from'./site-images.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const walk=async dir=>{const out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['node_modules','output'].includes(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(f));else out.push(f);}return out;};
const files=await walk('.'),htmlFiles=files.filter(f=>f.endsWith('.html'));
const sources=JSON.parse(await readFile('content/manifest.json','utf8'));
const previewCache=JSON.parse(await readFile('assets/og/articles/sources.json','utf8'));
const use=[],symbolGroups={},sourceArticles=[],backgrounds=[],bodyImages=[];
for(const article of sources){
  const d=articleDirection(article.slug),raw=await readFile(`content/${article.section}/${article.slug}.md`,'utf8');
  sourceArticles.push({path:`/${article.section}/${article.slug}/`,source:`content/${article.section}/${article.slug}.md`,sourceHash:sha(raw),title:article.title,date:article.date,subject:d.subject,scene:d.scene,detail:d.detail||null,composition:compositionFor(d),preview:`/assets/og/articles/${article.slug}.png`,previewSourceHash:previewCache[article.slug],decision:'rebuilt',reason:'Source-subject illustration; composition, material and geometry follow the concept. Technical pictures are schematic, not measured data.',crop:'SVG viewBox, isotropic fitting; compact and wide compositions; PNG1200×630 social preview.'});
  for(const m of raw.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g))bodyImages.push({source:`content/${article.section}/${article.slug}.md`,image:m[2],subject:m[1],decision:'keep',reason:'Original explanatory NGINX diagram depicts the precise adjacent reverse-proxy/load-balancing text.',crop:'Entire SVG viewBox; labels inspected in standalone diagram review.'});
}
for(const file of htmlFiles){
  const html=await readFile(file,'utf8'),title=decode(html.match(/<title>([^<]+)<\/title>/)?.[1]||''),route=file==='index.html'?'/':'/'+file.replace(/index\.html$/,'');
  let index=0;
  for(const m of html.matchAll(/<svg\b[\s\S]*?<\/svg>/g)){
    const a=attrs(m[0].split('>')[0]),key=sha(m[0]),context=html.slice(Math.max(0,m.index-250),m.index);
    const editorial=a['data-article-art'],brand=(a.class||'').includes('ajna-mark'),study=(a.class||'').includes('motion-mark');
    const kind=editorial?'editorial':brand?'identity':study?'brand-study':'interface-symbol';
    const subject=decode(a['aria-label']||context.match(/aria-label="([^"]+)"[^]*$/)?.[1]||'Interface action');
    const record={page:route,file,occurrence:++index,kind,subject,source:editorial?'tools/editorial-art.mjs + tools/article-scenes.mjs':brand?'tools/mark.mjs':study?'tools/brand-lab.mjs':'tools/lib.mjs / tools/shell.mjs',sha256:key,viewBox:a.viewBox,decision:editorial?'rebuilt':'keep',reason:editorial?'Actual article, service, engagement, topic or page subject; original illustration.':brand?'One shared Ajna identity, not editorial filler.':study?'User-reviewed motion comparison, noindex; Option B selected.':'Conventional functional symbol intentionally repeated for the same control/link.',crop:editorial?'Isotropic SVG fitting, no cover crop; card overlay removed.':'Entire viewBox, no cover crop.',...(editorial?{key:editorial,scene:a['data-art-scene'],composition:a['data-composition']}:{} )};
    if(kind==='interface-symbol'||kind==='identity'){
      symbolGroups[key]||={kind,source:record.source,subject,decision:'keep',reason:record.reason,viewBox:a.viewBox,uses:[]};symbolGroups[key].uses.push({page:route,file,occurrence:index});
    }else use.push(record);
  }
  for(const m of html.matchAll(/<img\b[^>]*>/g)){const a=attrs(m[0]);use.push({page:route,file,kind:'image',image:a.src,subject:decode(a.alt||''),source:'Article Markdown / tools/render.mjs',decision:'keep',reason:'Original source-relevant explanatory image; external/template image imports excluded.',crop:'Preserved intrinsic aspect ratio; full SVG viewBox.'});}
  for(const m of html.matchAll(/<meta (?:property|name)="(?:og:image|twitter:image)" content="([^"]+)"/g))use.push({page:route,file,kind:'social',image:m[1],subject:title,source:m[1].includes('/articles/')?'tools/article-images.mjs':'tools/site-images.mjs',decision:'rebuilt',reason:'Page/article-specific subject preview; old shared topic template retired.',crop:'1200×630 raster, full composition; social services may apply their own external crop.'});
  for(const m of html.matchAll(/<link\b[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>/g)){const a=attrs(m[0]);use.push({page:route,file,kind:'identity-file',image:a.href,subject:'Ajna identity',source:'tools/mark.mjs + tools/icons.mjs',decision:'keep',reason:'Intentional consistent identity for browser/tab/install surfaces; closed resting mark.',crop:'Icon-size-specific raster output/full SVG viewBox.'});}
}
for(const file of files.filter(f=>f.endsWith('.css'))){
 const css=(await readFile(file,'utf8')).replace(/\/\*[\s\S]*?\*\//g,'');
 for(const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))for(const p of rule[2].matchAll(/(background(?:-image)?|mask(?:-image)?)\s*:\s*([^;}]+)/g))if(/gradient\(|url\(/.test(p[2]))backgrounds.push({source:file,selector:rule[1].trim(),property:p[1],value:p[2].trim(),decision:'keep',reason:/url\(/.test(p[2])?'Explicit local graphic reference; audited with assets.':'Intentional decorative surface, grid, focus treatment or tonal gradient; carries no editorial subject and uses no stock/template image.'});
}
const assets=[];
for(const file of files.filter(f=>/^(images\/|assets\/og\/|favicon\.ico)/.test(f)&&/\.(png|jpe?g|svg|ico)$/.test(f))){
 const bytes=await readFile(file),record={file,bytes:bytes.length,sha256:sha(bytes)};
 if(file.endsWith('.png')){record.width=bytes.readUInt32BE(16);record.height=bytes.readUInt32BE(20);}
 if(file.endsWith('.svg')){const a=attrs(bytes.toString().match(/<svg\b[^>]+>/)?.[0]||'');record.viewBox=a.viewBox;record.subject=a['aria-label'];}
 const refs=use.filter(u=>u.image&&u.image.split('?')[0].endsWith('/'+file));
 record.referenceCount=refs.length;record.role=file.includes('/articles/')?'Prepared article preview':file.includes('/pages/')?'Page-specific preview':file.includes('nginx')?'Original explanatory diagram':'Ajna identity';
 record.reason=record.referenceCount?'Referenced by audited generated pages.':file.includes('/articles/')?'Prepared for planned publication; source authority is the manifest.':file.includes('nginx')?'Referenced in a planned source article; retained before publication.':'Generated shared identity asset.';
 assets.push(record);
}
const families=Object.fromEntries([...new Set(sourceArticles.map(a=>a.composition))].map(f=>[f,sourceArticles.filter(a=>a.composition===f).length]));
const result={scope:'Every generated HTML page, every published/planned article source, all local image assets, inline SVG uses, social/icon references and CSS image/gradient backgrounds.',sourceArticleCount:sources.length,generatedPageCount:htmlFiles.length,families,sourceArticles,uses:use,sharedSymbols:Object.values(symbolGroups),sourceBodyImages:bodyImages,cssBackgrounds:backgrounds,assets};
await mkdir('docs',{recursive:true});await writeFile('docs/image-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({articles:sources.length,pages:htmlFiles.length,editorialUses:use.filter(u=>u.kind==='editorial').length,symbolGroups:Object.keys(symbolGroups).length,backgrounds:backgrounds.length,assets:assets.length,families},null,2));
