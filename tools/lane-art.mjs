// Each illustration uses a 100-by-100 stage inside a shared 16:9 frame.
function part(kind, x, y, width, height) {
  return '<span class="lane-art__part lane-art__' + kind + '" style="--x:' +
    x + '%;--y:' + y + '%;--w:' + width + '%;--h:' + height + '%"></span>';
}

function parts(items) {
  return items.map(([kind, ...bounds]) => part(kind, ...bounds)).join('');
}

const illustrations = {
  reliability: [
    ['monitor', 9, 11, 82, 74],
    ['baseline', 16, 71, 67, 2],
    ['threshold', 16, 32, 67, 1],
    ['bar', 20, 57, 7, 14], ['bar', 30, 51, 7, 20],
    ['bar', 40, 55, 7, 16], ['bar-alert', 50, 23, 7, 48],
    ['bar', 60, 45, 7, 26], ['bar', 70, 53, 7, 18],
    ['beacon', 51, 14, 5, 5]
  ],
  platform: [
    ['pipeline-bed', 2, 29, 96, 48],
    ['rail', 15, 48, 69, 3],
    ['delivery-step', 7, 32, 19, 35], ['delivery-step', 40, 32, 19, 35], ['stage-verified', 73, 32, 19, 35],
    ['arrow', 30, 44, 6, 10], ['arrow', 63, 44, 6, 10],
    ['milestone', 14, 15, 5, 5], ['milestone', 47, 15, 5, 5], ['milestone-live', 80, 15, 5, 5]
  ],
  finops: [
    ['cost-bed', 10, 66, 81, 17],
    ['cost-column', 14, 52, 14, 17], ['cost-column', 32, 42, 14, 27], ['cost-column', 50, 29, 14, 40],
    ['cost-column-accent', 68, 16, 14, 53],
    ['cost-cap', 14, 48, 14, 5], ['cost-cap', 32, 38, 14, 5], ['cost-cap', 50, 25, 14, 5],
    ['cost-cap-accent', 68, 12, 14, 5],
    ['cost-step', 14, 77, 14, 2], ['cost-step', 32, 77, 14, 2], ['cost-step', 50, 77, 14, 2],
    ['cost-step-accent', 68, 77, 14, 2]
  ],
  systems: [
    ['systems-bed', 5, 14, 90, 72],
    ['route', 16, 45, 68, 2], ['route', 49, 32, 2, 14],
    ['route', 16, 45, 2, 13], ['route', 49, 45, 2, 13], ['route', 82, 45, 2, 13],
    ['router', 40, 16, 20, 18],
    ['service', 8, 55, 18, 20], ['service', 41, 55, 18, 20], ['service', 74, 55, 18, 20],
    ['route-joint', 47.5, 41.5, 5, 8]
  ],
  ai: [
    ['tensor-bed', 13, 64, 74, 20],
    ['rail', 12, 53, 76, 3],
    ['dataset', 5, 34, 17, 32], ['dataset', 9, 29, 17, 32], ['dataset-front', 13, 24, 17, 32],
    ['tensor-shadow', 35, 26, 29, 44], ['tensor', 41, 18, 27, 42],
    ['score', 76, 27, 17, 41], ['score-mark', 80, 43, 9, 12],
    ['arrow', 31, 48, 6, 12], ['arrow', 68, 48, 6, 12]
  ],
  security: [
    ['boundary', 24, 10, 52, 77], ['boundary-inner', 31, 20, 38, 57], ['boundary-core', 39, 30, 22, 37],
    ['rail', 12, 47, 27, 3], ['rail', 61, 47, 26, 3],
    ['credential', 6, 34, 15, 29], ['verified', 79, 34, 15, 29],
    ['gate', 22, 41, 5, 16], ['gate', 72, 41, 5, 16],
    ['key-head', 47, 37, 6, 13], ['key-neck', 48.5, 46, 3, 13]
  ],
  software: [
    ['editor-back', 16, 20, 57, 62], ['editor', 7, 11, 57, 62],
    ['editor-dots', 12, 17, 14, 5], ['code', 13, 29, 29, 3], ['code-muted', 20, 38, 33, 3],
    ['code', 20, 47, 24, 3], ['code-muted', 20, 56, 30, 3], ['code', 13, 65, 15, 3],
    ['test', 66, 21, 26, 13], ['test', 66, 40, 26, 13], ['test', 66, 59, 26, 13]
  ],
  portal: [
    ['atlas-bed', 11, 16, 78, 69], ['atlas-top', 8, 9, 78, 69],
    ['atlas-route', 26, 47, 48, 2], ['atlas-route', 49, 30, 2, 38],
    ['atlas-route', 28, 34, 2, 14], ['atlas-route', 69, 34, 2, 14],
    ['atlas-card-blue', 17, 20, 23, 21], ['atlas-card-teal', 58, 20, 23, 21],
    ['atlas-card-gold', 37, 52, 24, 19], ['atlas-junction', 46, 42, 7, 12],
    ['atlas-mark', 11, 73, 4, 7], ['atlas-mark', 82, 13, 4, 7]
  ]
};

function render(id, hero) {
  return '<div class="lane-art' + (hero ? ' lane-art--hero' : '') + '" data-lane-art="' +
    id + '" aria-hidden="true"><span class="lane-art__stage">' + parts(illustrations[id]) + '</span></div>';
}

const illustratedLanes = {
  'platform-delivery': 'platform',
  'cloud-finops': 'finops',
  'systems-architecture': 'systems',
  'ai-data': 'ai',
  'security-identity': 'security',
  'software-engineering': 'software'
};

export function laneArt(id, { hero = false } = {}) {
  const diagram = Object.hasOwn(illustratedLanes, id) ? illustratedLanes[id] : id;
  if (!Object.hasOwn(illustrations, diagram) || diagram === 'portal') return '';
  return render(diagram, hero);
}

export function portalArt() {
  return render('portal', true);
}
