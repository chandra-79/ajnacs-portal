/* Page-specific social previews. Every route uses its own actual subject,
   rather than the old shared architecture-writing template. */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import { subjectDirection, editorialArtwork } from './editorial-art.mjs';
import { colorFor } from './visuals.mjs';

export function siteImagePath(urlPath,title='',description='',topic=null) {
  const key=urlPath==='/'?'home':urlPath.replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase();
  const version=title?'?v='+createHash('sha256').update(pageImageSvg(urlPath,title,description,topic)).digest('hex').slice(0,12):'';
  return `/assets/og/pages/${key}.png${version}`;
}
const pageSubjects={
  '/': ['Architecture, AI & enablement','architecture','architecture',['Architecture','Enterprise AI','Team enablement']],
  '/services/': ['Engineering services','architecture','architecture',['Modernisation','AI & MLOps','Technical training']],
  '/about/': ['An engineering partner','people','people',['Chandra Lanka','Delivery experience','Shared practice']],
  '/contact/': ['Start a conversation','conversation','conversation',['Your system','Your constraint','An engineering reply']],
  '/privacy/': ['Privacy & your information','security','security',['Enquiry information','Limited use','Your privacy']],
  '/terms/': ['Terms of use','governance','governance',['Website terms','Content use','Responsibilities']],
  '/404.html': ['Find your way back','journey','journey',['Missing page','Home','Browse insights']],
  '/insights/': ['Engineering, written down','library','library',['Production experience','Architecture','Trade-offs']],
  '/notes/': ['Notes on a technical life','reading','reading',['Career','Craft','Personal writing']],
  '/series/': ['Longer arcs, in order','library','library',['Engineering series','Ordered chapters','Read in sequence']],
  '/topics/': ['Browse by subject','library','library',['Architecture','Cloud & AI','Security & practice']],
};
export function pageImageDirection(urlPath,title,description='',topic=null) {
  const slug='page-'+(urlPath==='/'?'home':urlPath.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,''));
  const tags=topic?[topic]:['Architecture'];
  const base=subjectDirection({slug,title,text:description,tags,section:'site'});
  const chosen=pageSubjects[urlPath];
  return chosen?{...base,subject:chosen[0],layout:chosen[1],scene:chosen[2],terms:chosen[3],description:`Original illustration for Ajna's ${title} page: ${chosen[3].join(', ')}.`}:base;
}
export function pageImageSvg(urlPath,title,description='',topic=null) {
  const d=pageImageDirection(urlPath,title,description,topic),[c1,c2]=colorFor(topic?[topic]:[]);
  return editorialArtwork(d,{w:1200,h:630,c1,c2,id:'social-'+d.slug}).replace(/var\(--[\w-]+,\s*(#[0-9a-fA-F]+)\)/g,'$1');
}
export async function buildPageImage(urlPath,title,description='',topic=null) {
  const file=siteImagePath(urlPath).slice(1),svg=pageImageSvg(urlPath,title,description,topic);
  const hash=createHash('sha256').update(svg).digest('hex');
  await mkdir('assets/og/pages',{recursive:true});
  const cache='assets/og/pages/sources.json';let records={};
  try{records=JSON.parse(await readFile(cache,'utf8'));}catch{}
  let exists=true;try{await access(file);}catch{exists=false;}
  if(records[urlPath]?.hash!==hash||!exists){
    await writeFile(file,new Resvg(svg,{background:'#f2f6fb',font:{loadSystemFonts:true,defaultFontFamily:'Arial'}}).render().asPng());
  }
  records[urlPath]={file,hash,title,description,topic,direction:pageImageDirection(urlPath,title,description,topic)};
  await writeFile(cache,JSON.stringify(Object.fromEntries(Object.entries(records).sort(([a],[b])=>a.localeCompare(b))),null,2)+'\n');
}
