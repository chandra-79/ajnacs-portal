import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { esc } from './lib.mjs';

const folder = new URL('../content/concept-figures/', import.meta.url);
let catalog;

export function validateConcept(figure) {
  if (!/^[a-z0-9-]+$/.test(figure.slug || '') || !['bar', 'line', 'flow'].includes(figure.kind)) throw new Error('Invalid concept figure identity');
  for (const field of ['title', 'method', 'alt', 'dataOrigin']) if (typeof figure[field] !== 'string' || !figure[field].trim()) throw new Error(`${figure.slug}: missing ${field}`);
  if (!['synthetic', 'conceptual'].includes(figure.dataOrigin)) throw new Error(`${figure.slug}: figures must declare their illustrative origin`);
  if (figure.kind === 'flow') {
    if (!Array.isArray(figure.steps) || figure.steps.length < 3 || figure.steps.length > 5 || figure.steps.some(step => !step.label || !step.detail)) throw new Error(`${figure.slug}: expected 3–5 described steps`);
  } else {
    if (!figure.unit || !Array.isArray(figure.points) || figure.points.length < 2 || figure.points.length > 6 || figure.points.some(point => !point.label || typeof point.value !== 'number' || !Number.isFinite(point.value) || point.value < 0)) throw new Error(`${figure.slug}: invalid chart values or units`);
    if (figure.dataOrigin !== 'synthetic') throw new Error(`${figure.slug}: numerical examples must be labelled synthetic`);
  }
  return figure;
}

export function conceptCatalog() {
  if (catalog) return catalog;
  catalog = new Map();
  if (!existsSync(folder)) return catalog;
  for (const file of readdirSync(folder).filter(file => file.endsWith('.json')).sort()) {
    const figure = validateConcept(JSON.parse(readFileSync(new URL(file, folder), 'utf8')));
    if (file !== `${figure.slug}.json` || catalog.has(figure.slug)) throw new Error(`Duplicate or misnamed concept figure: ${file}`);
    catalog.set(figure.slug, figure);
  }
  return catalog;
}

export const conceptFor = slug => conceptCatalog().get(slug);

function lines(text, limit) {
  const words = String(text).split(/\s+/), result = [''];
  for (const word of words) {
    const last = result.length - 1;
    if (result[last] && result[last].length + word.length + 1 > limit) result.push(word);
    else result[last] += (result[last] ? ' ' : '') + word;
  }
  return result;
}

function textBlock(text, x, y, { size = 24, limit = 38, weight = 400, fill = '#243651', anchor = 'start', leading = size * 1.3 } = {}) {
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines(text, limit).map((line, i) => `<tspan x="${x}" dy="${i ? leading : 0}">${esc(line)}</tspan>`).join('')}</text>`;
}

const valueLabel = value => new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(value);
const colors = ['#206c68', '#306cb3', '#986527', '#67529b', '#a34f4f', '#386550'];

// A fixed viewBox keeps labels intact in both social and article formats.
// All values are authored worked examples; this renderer does not invent data.
export function conceptSvg(figure, width = 1280, height = 720) {
  validateConcept(figure);
  const title = textBlock(figure.title, 62, 76, { size: 34, weight: 700, limit: 58 });
  const intro = figure.kind === 'flow' ? 'Conceptual model · Follow the reasoning' : `Illustrative inputs · ${figure.unit}`;
  let drawing = '';
  if (figure.kind === 'bar') {
    const max = Math.max(...figure.points.map(point => point.value)) || 1;
    const top = 211, span = 370, row = span / figure.points.length;
    const left = 390, chartWidth = 655;
    for (let tick = 0; tick <= 4; tick++) {
      const x = left + chartWidth * tick / 4;
      drawing += `<path d="M${x} 193V594" stroke="#dce4ed"/>${textBlock(valueLabel(max * tick / 4), x, 626, { size: 20, anchor: 'middle' })}`;
    }
    figure.points.forEach((point, i) => {
      const y = top + row * i;
      const middle = y + row / 2;
      drawing += textBlock(point.label, 352, middle + 8 - (lines(point.label, 22).length - 1) * 15, { size: 24, limit: 22, anchor: 'end' });
      const barWidth = point.value / max * chartWidth;
      const barHeight = Math.min(44, row - 18);
      drawing += `<rect x="${left}" y="${middle - barHeight / 2}" width="${barWidth}" height="${barHeight}" rx="7" fill="${colors[i]}"/>`;
      drawing += textBlock(valueLabel(point.value), left + barWidth + 13, middle + 8, { size: 23, weight: 600, limit: 20 });
    });
  } else if (figure.kind === 'line') {
    const max = Math.max(...figure.points.map(point => point.value)) || 1;
    const left = 145, top = 205, chartWidth = 995, chartHeight = 330;
    for (let tick = 0; tick <= 4; tick++) {
      const y = top + chartHeight - chartHeight * tick / 4;
      drawing += `<path d="M${left} ${y}H${left + chartWidth}" stroke="#dce4ed"/>${textBlock(valueLabel(max * tick / 4), left - 18, y + 7, { size: 20, anchor: 'end' })}`;
    }
    const coordinates = figure.points.map((point, i) => [left + chartWidth * i / (figure.points.length - 1), top + chartHeight - point.value / max * chartHeight]);
    drawing += `<polyline points="${coordinates.map(point => point.join(',')).join(' ')}" fill="none" stroke="#206c68" stroke-width="5" stroke-linejoin="round"/>`;
    coordinates.forEach(([x, y], i) => {
      drawing += `<circle cx="${x}" cy="${y}" r="8" fill="#206c68" stroke="#fff" stroke-width="3"/>`;
      drawing += textBlock(valueLabel(figure.points[i].value), x, y - 20, { size: 22, weight: 600, anchor: 'middle' });
      drawing += textBlock(figure.points[i].label, x, 574, { size: 21, limit: figure.points.length > 4 ? 14 : 23, anchor: 'middle' });
    });
  } else {
    const n = figure.steps.length, gap = 31, boxWidth = (1156 - gap * (n - 1)) / n;
    figure.steps.forEach((step, i) => {
      const x = 62 + (boxWidth + gap) * i;
      if (i) drawing += `<path d="M${x - gap + 4} 367H${x - 7}m-8 -7 8 7-8 7" fill="none" stroke="#7b899e" stroke-width="3"/>`;
      drawing += `<rect x="${x}" y="233" width="${boxWidth}" height="340" rx="18" fill="#fff" stroke="#dce4ed" stroke-width="2"/><rect x="${x}" y="233" width="${boxWidth}" height="8" rx="4" fill="${colors[i]}"/><circle cx="${x + 33}" cy="275" r="17" fill="${colors[i]}"/>`;
      drawing += textBlock(String(i + 1), x + 33, 282, { size: 19, weight: 700, fill: '#fff', anchor: 'middle' });
      drawing += textBlock(step.label, x + 20, 330, { size: 24, weight: 700, limit: Math.floor((boxWidth - 40) / 14) });
      const detailY = Math.max(415, 330 + (lines(step.label, Math.floor((boxWidth - 40) / 14)).length - 1) * 31.2 + 42);
      drawing += textBlock(step.detail, x + 20, detailY, { size: 21, limit: Math.floor((boxWidth - 40) / 11) });
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1280 720" data-article-art="${figure.slug}" role="img" aria-label="${esc(figure.alt)}"><rect x="-1280" y="-720" width="3840" height="2160" fill="#f3f6fa"/><g font-family="Inter, sans-serif">${title}${textBlock(intro, 62, 159, { size: 23, fill: '#64748b', limit: 85 })}${drawing}${textBlock('AJNA  /  Method, assumptions and values accompany the article.', 62, 682, { size: 19, fill: '#64748b', limit: 110 })}</g></svg>`;
}

export function conceptDetails(figure, { showFigure = false } = {}) {
  const flow = figure.kind === 'flow';
  const values = flow ? `<ol>${figure.steps.map(step => `<li><strong>${esc(step.label)}.</strong> ${esc(step.detail)}</li>`).join('')}</ol>`
    : `<ul>${figure.points.map(point => `<li>${esc(point.label)}: <strong>${esc(String(point.value))} ${esc(figure.unit)}</strong></li>`).join('')}</ul>`;
  const drawing = showFigure ? `<figure style="aspect-ratio:16/9;margin:1rem 0">${conceptSvg(figure, "100%", "100%")}</figure>` : "";
  return `<section class="concept-method" aria-labelledby="concept-method-title"><h2 id="concept-method-title">${flow ? 'How to use the diagram' : 'Chart methodology and values'}</h2><p class="case-notice">${flow ? 'Conceptual illustration. The sequence describes an approach, not measured customer results.' : 'Synthetic worked example. These figures illustrate the calculation; they are not customer results or industry benchmarks.'}</p><p>${esc(figure.method)}</p>${drawing}<details><summary>${flow ? 'Read the steps' : 'Read the chart values'}</summary>${values}</details>${flow ? '' : `<p><a href="/field-guides/examples/${figure.slug}.csv" download>Download these example values (CSV)</a></p>`}</section>`;
}

export function conceptCsv(figure) {
  const cell = text => `"${String(text).replaceAll('"', '""')}"`;
  return [['label', 'value', 'unit', 'data_origin', 'method'], ...figure.points.map(point => [point.label, point.value, figure.unit, 'synthetic', figure.method])].map(row => row.map(cell).join(',')).join('\n') + '\n';
}
