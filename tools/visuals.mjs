/* Original semantic illustrations for articles, series and engagements.
   Geometry follows the actual subject; slugs only identify stable SVG clips. */
import { articleDirection, subjectDirection, editorialArtwork, EDITORIAL_LAYOUTS } from './editorial-art.mjs';

export const TOPIC_COLOR = {
  "Architecture":            ["#2f6fed", "#1b4fc4"],
  "Cloud Architecture":      ["#0d9488", "#0b7a70"],
  "Enterprise AI":           ["#6d4aff", "#5837e0"],
  "AI & MLOps":              ["#6d4aff", "#5837e0"],
  "Security":                ["#e0473a", "#c03a2e"],
  "DevSecOps":               ["#e0473a", "#c03a2e"],
  "FinOps":                  ["#e8a317", "#a9760a"],
  "Engineering Leadership":  ["#0e7490", "#0b5f77"],
  "Reliability":             ["#1e9e63", "#157a4c"],
  "Observability":           ["#1e9e63", "#157a4c"],
  "Distributed Systems":     ["#2f6fed", "#1b4fc4"],
  "Data Engineering":        ["#0891b2", "#076f87"],
  "Platform Engineering":    ["#7c3aed", "#5b21b6"],
  "Containers":              ["#0284c7", "#025f96"],
  "Performance":             ["#ea580c", "#b8450b"],
  "Programming":             ["#4f46e5", "#3730a3"],
  "Infrastructure":          ["#475569", "#334155"],
  "Fundamentals":            ["#0f766e", "#0b5852"],
};
export const colorFor = (tags = []) => {
  for (const t of tags) if (TOPIC_COLOR[t]) return TOPIC_COLOR[t];
  return ["#2f6fed", "#1b4fc4"];
};


function directionFor(slug,tags,calm,title) {
  return articleDirection(slug) || subjectDirection({
    slug, tags, title: title || slug.replaceAll('-', ' '), section: calm ? 'notes' : 'insights',
  });
}
export const SPECIFIC_TOPICS=[...Object.keys(TOPIC_COLOR),'API Design','Quantum Computing'];
export const MOTIF_COUNT=EDITORIAL_LAYOUTS.length;
export const motifNameFor=(tags,calm,title,slug)=>{const d=directionFor(slug,tags,calm,title);return d.detail||d.layout;};
export function motifReason(tags,calm,title='',slug='') {
  return { name:directionFor(slug,tags,calm,title).layout, why:articleDirection(slug) ? 'article-source' : 'subject' };
}
export function artwork(slug,tags,{w=640,h=360,calm=false,title=''}={}) {
  const [c1,c2]=colorFor(tags);
  const id=`art-${slug.replace(/[^a-z0-9]+/gi,'-')}-${w}-${h}`;
  return editorialArtwork(directionFor(slug,tags,calm,title),{w,h,c1,c2,id});
}
