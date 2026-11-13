/* Raster social previews use the same original subject artwork as the page.
   Future images are prepared now; publishing never depends on an image API. */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import { artwork } from './visuals.mjs';

export async function buildArticleImages(manifest) {
  const folder='assets/og/articles';
  await mkdir(folder,{recursive:true});
  let previous={};
  try { previous=JSON.parse(await readFile(`${folder}/sources.json`,'utf8')); } catch {}
  const hashes={};
  let rendered=0;
  for(const article of manifest) {
    const svg=artwork(article.slug,article.tags,{w:1200,h:630,title:article.title,calm:article.section==='notes'})
      .replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]+)\)/g,'$1');
    const hash=createHash('sha256').update(svg).digest('hex');
    hashes[article.slug]=hash;
    let exists=true;
    try { await access(`${folder}/${article.slug}.png`); } catch { exists=false; }
    if(previous[article.slug]===hash && exists) continue;
    const renderer=new Resvg(svg,{background:'#f2f6fb',font:{loadSystemFonts:true,defaultFontFamily:'Arial'}});
    await writeFile(`${folder}/${article.slug}.png`,renderer.render().asPng());
    rendered++;
  }
  await writeFile(`${folder}/sources.json`,JSON.stringify(hashes,null,2)+'\n');
  console.log(`article social images: ${manifest.length} prepared; ${rendered} rendered`);
}
