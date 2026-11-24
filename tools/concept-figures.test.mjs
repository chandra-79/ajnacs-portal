import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conceptSvg, conceptCsv, conceptDetails, validateConcept } from './concept-figures.mjs';
import { renderEditorialPng } from './raster-art.mjs';

const figure = { slug: 'worked-unit-cost', kind: 'bar', title: 'Cost for a completed order', unit: 'USD per order', points: [{ label: 'Scenario A', value: .025 }, { label: 'Scenario B', value: .03 }], method: 'Divide 3000 USD by 120000 attempts or 100000 completed orders. Illustrative counts, with the same cost scope.', alt: 'A worked comparison of two denominators.', dataOrigin: 'synthetic', steps: [], studyPaths: ['finops'] };

test('decimal charts use their observed maximum and render deterministically at both image sizes', () => {
  const svg = conceptSvg(figure);
  assert.match(svg, /width="655"/);
  assert.doesNotMatch(svg, /NaN|Infinity/);
  const png = renderEditorialPng(svg);
  assert.equal(png.readUInt32BE(16), 1280); assert.equal(png.readUInt32BE(20), 720);
  assert.deepEqual(png, renderEditorialPng(svg));
  const social = renderEditorialPng(conceptSvg(figure, 1200, 630));
  assert.equal(social.readUInt32BE(16), 1200); assert.equal(social.readUInt32BE(20), 630);
});

test('zero-valued and line charts render valid geometry', () => {
  for (const kind of ['bar', 'line']) {
    const svg = conceptSvg({ ...figure, kind, points: figure.points.map(point => ({ ...point, value: 0 })) });
    assert.doesNotMatch(svg, /NaN|Infinity/);
    assert.ok(renderEditorialPng(svg).length > 1000);
  }
});

test('figure inputs cannot hide invalid values or invent an empirical data origin', () => {
  for (const value of [-1, Infinity, NaN, '12']) assert.throws(() => validateConcept({ ...figure, points: [{ label: 'A', value }, figure.points[1]] }), /invalid chart/);
  assert.throws(() => validateConcept({ ...figure, dataOrigin: 'customer measurement' }), /illustrative origin/);
  assert.throws(() => validateConcept({ ...figure, kind: 'flow', steps: [] }), /3–5/);
});

test('text alternatives, methodology and downloadable values share the same authored data', () => {
  const csv = conceptCsv(figure), html = conceptDetails(figure);
  assert.match(csv, /"Scenario A","0.025","USD per order","synthetic"/);
  assert.match(html, /Synthetic worked example/);
  assert.match(html, /0.025 USD per order/);
  assert.match(html, /Divide 3000 USD/);
  assert.match(html, /worked-unit-cost.csv/);
});

test('flow diagrams explain a model without implying quantitative results', () => {
  const flow = { ...figure, kind: 'flow', dataOrigin: 'conceptual', points: [], steps: [{ label: 'Observe', detail: 'Record the boundary.' }, { label: 'Test', detail: 'Try a small change.' }, { label: 'Review', detail: 'Check the outcome.' }] };
  const svg = conceptSvg(flow), html = conceptDetails(flow);
  assert.match(svg, /Conceptual model/); assert.match(html, /not measured customer results/);
  assert.doesNotMatch(html, /Download these/);
  assert.ok(renderEditorialPng(svg).length > 1000);
});

test('authored labels are escaped as text in SVG and HTML', () => {
  const amended = { ...figure, title: 'A < B & C', points: [{ label: '<script>alert(1)</script>', value: 1 }, figure.points[1]] };
  assert.doesNotMatch(conceptSvg(amended), /<script>/);
  assert.match(conceptDetails(amended), /&lt;script&gt;/);
});
