/* Exhaustive browser geometry review of all prepared article compositions. */
import {createRequire}from'node:module';
import {readFile,writeFile,mkdir,readdir}from'node:fs/promises';
import{fileURLToPath}from'node:url';
import path from'node:path';
import{artwork}from'./visuals.mjs';
import{pageImageSvg}from'./site-images.mjs';
const{chromium}=createRequire(process.env.AJNA_PLAYWRIGHT_PACKAGE||fileURLToPath(new URL('../../../InfiScroller/package.json',import.meta.url)))('playwright');
const out=process.env.AJNA_IMAGE_QA_OUTPUT||'output/playwright/image-geometry';await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('content/manifest.json','utf8')),pages=JSON.parse(await readFile('assets/og/pages/sources.json','utf8'));
const figures=manifest.flatMap(a=>[[640,360],[1200,380]].map(([w,h])=>artwork(a.slug,a.tags,{w,h})));
for(const [url,p]of Object.entries(pages))figures.push(pageImageSvg(url,p.title,p.description,p.topic));
const walk=async dir=>{const files=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['node_modules','assets','content','images','tools','docs','output'].includes(e.name))continue;const file=path.join(dir,e.name);if(e.isDirectory())files.push(...await walk(file));else if(e.name.endsWith('.html'))files.push(file);}return files;};
for(const file of await walk('.')){const content=await readFile(file,'utf8');for(const m of content.matchAll(/<svg\b[\s\S]*?<\/svg>/g))if(m[0].includes('data-article-art='))figures.push(m[0]);}
const distinct=[...new Set(figures)];
const html='<!doctype html><meta charset="utf8"><style>body{margin:0;background:#ddd}svg{display:block;margin-bottom:12px;max-width:100%}</style>'+distinct.join('');
await writeFile(path.join(out,'all-compositions.html'),html);
const browser=await chromium.launch({headless:true});let result;
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.setContent(html,{timeout:60000});
 result=await page.evaluate(()=>{
  const clipped=[],overlapping=[],svgs=[...document.querySelectorAll('svg')];
  for(const svg of svgs){
   const v=svg.viewBox.baseVal,boxes=[];
   for(const text of svg.querySelectorAll('text')){
    const p=text.getBBox(),a=svg.getScreenCTM().inverse().multiply(text.getScreenCTM());
    const b={x:p.x*a.a+a.e,y:p.y*a.d+a.f,w:p.width*a.a,h:p.height*a.d,text:text.textContent};
    if(b.x< -1||b.y< -1||b.x+b.w>v.width+1||b.y+b.h>v.height+1)clipped.push({slug:svg.dataset.articleArt,composition:svg.dataset.composition,size:v.width+'×'+v.height,...b});
    for(const old of boxes){const w=Math.min(b.x+b.w,old.x+old.w)-Math.max(b.x,old.x),h=Math.min(b.y+b.h,old.y+old.h)-Math.max(b.y,old.y);if(w>3&&h>3)overlapping.push({slug:svg.dataset.articleArt,size:v.width+'×'+v.height,text:[old.text,b.text],intersection:{w,h}});}
    boxes.push(b);
   }
  }
  return {images:svgs.length,clipped,overlapping};
 });
}finally{await browser.close();}
await writeFile(path.join(out,'geometry.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(result.clipped.length||result.overlapping.length)process.exitCode=1;
