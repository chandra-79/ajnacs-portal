/* Warm, dimensional article covers. The subject illustration comes from the
   same source-specific drawing used by the original editorial system. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { articleDirection, articleDrawing, compositionFor } from './editorial-art.mjs';
import { esc } from './lib.mjs';

const photos = new Map(Object.entries({
  'sre-toil-reduction': 'A stopwatch and a robot sorting repetitive incident tickets',
  'platform-engineering-idp-2026': 'A paved route linking a developer workstation to a deployment platform with guardrails',
  'cloud-unit-economics': 'A scale balancing cloud spend against completed work',
  'ai-coding-assistants-comparison-2026': 'Three coding assistants submitting changes to the same review station',
  'serverless-vs-containers-2026': 'Intermittent jobs on a serverless platform beside a continuously running container fleet',
}));

const props = {
  'drafting-board': ['nodes', 'rack'],
  'process-strip': ['layers', 'package'],
  'technical-cutaway': ['rack', 'layers'],
  'narrative-landscape': ['beacon', 'package'],
  'instrument-panel': ['scope', 'nodes'],
  'symbolic-object': ['shield', 'beacon'],
  'paper-workbench': ['layers', 'scope'],
  'editorial-vignette': ['books', 'plant'],
};
const objects = {
  nodes: `<g fill="none" stroke="url(#mint)" stroke-width="12"><path d="M0-55l53-36v63l-53 57-50-35v-59z M-50-63l103 35M53-93L0 29"/></g><g fill="url(#blue)"><circle cy="-55" r="19"/><circle cx="53" cy="-93" r="16"/><circle cx="53" cy="-27" r="17"/><circle cy="29" r="17"/><circle cx="-50" cy="-64" r="17"/><circle cx="-50" cy="-7" r="17"/></g>`,
  rack: `<g transform="skewY(-12)"><rect x="-59" y="-120" width="129" height="150" rx="22" fill="url(#blue)"/><rect x="-50" y="-120" width="107" height="136" rx="14" fill="url(#cream)"/>${[-95,-57,-19].map(y=>`<rect x="-39" y="${y}" width="88" height="24" rx="7" fill="url(#blue)"/><circle cx="34" cy="${y+12}" r="5" fill="#a2ffdf"/>`).join('')}</g>`,
  layers: `${[26,-2,-31].map((y,i)=>`<path d="M-70 ${y-9}l70-30 72 21v15L0 ${y+29}l-70-20z" fill="url(#${['gold','mint','blue'][i]})" stroke="#fff8f1" stroke-opacity=".55" stroke-width="2"/>`).join('')}<path d="M-33-36l35-13 33 9-34 15z" fill="none" stroke="#d7e8ff" stroke-width="3"/>`,
  package: `<path d="M-62-59L4-93l67 14v77L2 32l-64-18z" fill="url(#gold)"/><path d="M-62-59L2-42l69-37L4-93z" fill="#ffde81"/><path d="M2-42v74L71-2v-77z" fill="#c78232"/><path d="M-29-77l33 10 29 8-9 9-33-9-34-10z" fill="#477cf1"/>`,
  beacon: `<ellipse cy="21" rx="58" ry="17" fill="url(#blue)"/><rect x="-38" y="-57" width="76" height="77" rx="32" fill="url(#gold)"/><path d="M-50-53l-17-13M-27-71l-8-20M27-71l8-20M52-52l17-13" stroke="#ffba32" stroke-width="7" stroke-linecap="round"/><path d="M-22-31q0-14 13-20" fill="none" stroke="#fff3c5" stroke-width="8" stroke-linecap="round"/>`,
  scope: `<g transform="skewY(-12)"><rect x="-65" y="-88" width="143" height="105" rx="17" fill="url(#blue)"/><rect x="-59" y="-83" width="125" height="85" rx="10" fill="#173465"/><path d="M-48-36h18l12-20 17 32 13-17 14 5h25" fill="none" stroke="#99ffe1" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="53" cy="8" r="4" fill="#ffcd56"/></g>`,
  shield: `<path d="M0-108l59 22v40q0 52-59 79-56-26-56-80v-39z" fill="url(#blue)" stroke="#accbff" stroke-width="3"/><path d="M-27-42l18 19 36-41" fill="none" stroke="#fff3cc" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
  books: `<g transform="skewY(-11)">${[-58,-26,6].map((y,i)=>`<rect x="-57" y="${y}" width="119" height="27" rx="7" fill="url(#${['blue','mint','gold'][i]})"/><rect x="-45" y="${y+6}" width="95" height="15" rx="4" fill="url(#cream)"/><path d="M-39 ${y+13}h77" stroke="#d8baa6"/>`).join('')}</g>`,
  plant: `<path d="M-31-19h62l-9 42h-44z" fill="url(#gold)"/><path d="M0-15v-63m0 29l-23-26m23 43l22-19" stroke="#397767" stroke-width="5"/><ellipse cx="-24" cy="-70" rx="13" ry="23" transform="rotate(-40 -24 -70)" fill="url(#mint)"/><ellipse cx="24" cy="-51" rx="14" ry="26" transform="rotate(45 24 -51)" fill="url(#mint)"/><ellipse cy="-91" rx="14" ry="25" fill="url(#mint)"/>`,
};
const gradient = (name, top, mid, bottom) => `<linearGradient id="${name}" x2="0.72" y2="1"><stop stop-color="${top}"/><stop offset=".46" stop-color="${mid}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;

export function coverArt(slug, width = 1280, height = 720) {
  const direction = articleDirection(slug);
  const family = compositionFor(direction);
  const stamp = createHash('sha256').update(slug).digest();
  const [left, right] = props[family];
  const side = (x,y,scale,item) => `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="55" rx="112" ry="35" fill="#71523e" opacity=".24" filter="url(#blur)"/><ellipse cy="29" rx="104" ry="45" fill="url(#cream)"/><ellipse cy="13" rx="104" ry="44" fill="#fff0df" stroke="#fff9ed" stroke-width="2"/><ellipse rx="68" ry="23" cy="15" fill="#7f6559" opacity=".16" filter="url(#blur)"/>${objects[item]}</g>`;
  const stage = articleDrawing(direction, '#1b4d9b', '#147e74');
  const drift = (stamp[0] % 5 - 2) * 7;
  const card = `<g transform="translate(214 146) skewY(${stamp[1]%2 ? -3 : 3})"><rect x="10" y="33" width="756" height="376" rx="42" fill="#54433a" opacity=".30" filter="url(#blur)"/><rect x="0" y="12" width="756" height="376" rx="42" fill="#194692"/><rect width="756" height="376" rx="42" fill="url(#blue)" stroke="#9bbdff" stroke-width="2"/><rect x="20" y="19" width="716" height="337" rx="30" fill="url(#cream)" stroke="#fff7ee" stroke-width="3"/><g transform="translate(29 36) scale(1.27)">${stage}</g><circle cx="378" cy="366" r="4" fill="#a6ffe4"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice"><title>${esc(direction.title)}</title><defs>
  ${gradient('blue','#9dc2ff','#4275df','#173365')}${gradient('mint','#bbf4da','#62c8ac','#257968')}${gradient('gold','#fff0a8','#ffc84d','#b7771b')}${gradient('cream','#fffaf0','#fae9db','#d8b498')}
  <radialGradient id="paper" cx=".47" cy=".34" r=".76"><stop stop-color="#fffaf1"/><stop offset="1" stop-color="#f5dec8"/></radialGradient><filter id="blur" x="-.4" y="-.8" width="1.8" height="2.6"><feGaussianBlur stdDeviation="15"/></filter></defs>
  <rect width="1280" height="720" fill="url(#paper)"/><ellipse cx="642" cy="548" rx="505" ry="82" fill="#80523a" opacity=".18" filter="url(#blur)"/>
  <path d="M190 486Q361 539 517 592T1042 469" fill="none" stroke="#d6b39a" stroke-width="30" stroke-linecap="round"/><path d="M190 479Q361 532 517 585T1042 462" fill="none" stroke="#97dbcb" stroke-width="19" stroke-linecap="round"/><path d="M190 476Q361 529 517 582T1042 459" fill="none" stroke="#e5fff1" stroke-width="5" stroke-linecap="round"/>
  ${side(1003,435+drift,1.13,right)}${card}${side(217,539-drift,1.02,left)}<g fill="url(#mint)"><ellipse cx="1002" cy="562" rx="27" ry="17"/><ellipse cx="1032" cy="574" rx="32" ry="21"/><ellipse cx="1070" cy="562" rx="24" ry="15"/></g></svg>`;
}

export function photoFor(slug) {
  const alt = photos.get(slug);
  if (!alt) return null;
  const path = `/assets/covers/photos/${slug}.jpg`;
  const small = `/assets/covers/photos/${slug}-640.jpg`;
  const version = Buffer.concat([readFileSync(`.${path}`),readFileSync(`.${small}`)]);
  const hash = createHash('sha256').update(version).digest('hex').slice(0,12);
  return { path: `${path}?v=${hash}`, small: `${small}?v=${hash}`, alt, width: 1280, height: 720 };
}

export function coverFor(article, { hero = false, sizes = '(min-width: 800px) 420px, 100vw' } = {}) {
  const photo = photoFor(article.slug);
  const path = photo?.path || `/assets/covers/${article.slug}.svg`;
  const source = photo && ` srcset="${photo.small} 640w, ${photo.path} 1280w" sizes="${sizes}"`;
  return `<img data-article-art="${esc(article.slug)}" src="${path}"${source || ''} width="1280" height="720" alt="${hero && photo ? esc(photo.alt) : ''}" decoding="async" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}
