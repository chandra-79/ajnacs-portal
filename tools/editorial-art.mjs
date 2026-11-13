/* Article artwork is an illustration of named concepts in the article, rather
   than a random geometric texture. No numbers in these illustrations are data. */
import { readFileSync } from 'node:fs';
import { parseFront } from './lib.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const rules = [
  ['accessibility', /accessibility/, ['Keyboard', 'Screen reader', 'Focus', 'Contrast', 'Accessibility', 'Semantic']],
  ['backup', /backup|restore/, ['Backup', 'Restore', 'Recovery', 'Retention', 'Verification', 'Storage']],
  ['locale', /internationalization|localization/, ['Locale', 'Translation', 'Messages', 'Unicode', 'Language', 'Interface']],
  ['energy', /green-software|carbon/, ['Energy', 'Carbon', 'Utilization', 'Efficiency', 'Compute', 'Hardware']],
  ['fabric', /infiniband|ethernet|roce|iwarp|rdma|hpc-network|training-cluster-network/, ['Ethernet', 'InfiniBand', 'RDMA', 'GPU', 'fabric', 'switch', 'topology']],
  ['retrieval', /\brag\b|retrieval|vector-database|knowledge-base|fine-tuning-vs-rag/, ['Retrieval', 'Documents', 'Embeddings', 'Context', 'Generation', 'Citations', 'RAG']],
  ['cache', /cach|redis|varnish|cdn-strategy/, ['Cache', 'Origin', 'TTL', 'Invalidation', 'ETag', 'Redis', 'Varnish', 'CDN']],
  ['identity', /oauth|oidc|sso|scim|identity|authoriz|rbac|abac|iam-|access-control|zero-trust/, ['Identity', 'Policy', 'Access', 'Tokens', 'Roles', 'Permissions', 'OAuth', 'OIDC', 'SSO']],
  ['index', /indexing|query-plan|\bexplain\b|slowest-query|postgresql-performance|window-functions|duckdb/, ['Query', 'Index', 'Planner', 'B-tree', 'Scan', 'SQL', 'EXPLAIN', 'Analytics']],
  ['experiment', /ab-testing|a\/b testing|experimentation/, ['Experiment', 'Control', 'Variant', 'Outcomes', 'Statistics', 'Hypothesis']],
  ['pagination', /paginat|cursor|offset/, ['Client', 'Cursor', 'Page', 'Offset', 'Keyset', 'Consistency']],
  ['throttle', /rate-limit|queueing-theory|load-shedding|capacity-planning/, ['Requests', 'Queue', 'Capacity', 'Limits', 'Headroom', 'Throughput', 'Tokens']],
  ['virtualization', /multipass|virtual-machine|hypervisor/, ['Ubuntu', 'Virtual machine', 'Cloud-init', 'Image', 'Host', 'Instance']],
  ['hashring', /consistent-hash/, ['Hash', 'Keys', 'Nodes', 'Ring', 'Distribution', 'Partition']],
  ['sharding', /database-sharding/, ['Shard', 'Key', 'Partition', 'Routing', 'Database', 'Resharding']],
  ['time', /time-clocks/, ['Time', 'Clock', 'Causality', 'Logical', 'Ordering', 'Timestamp']],
  ['consensus', /raft|consensus|quorum|consistent-hash|replication|sharding|distributed-lock/, ['Leader', 'Replica', 'Quorum', 'Partition', 'Hash', 'Replication', 'Shards']],
  ['transaction', /transaction|saga-pattern|payment|outbox|idempotency/, ['Request', 'Transaction', 'Commit', 'Retry', 'Outbox', 'Payment', 'Idempotency']],
  ['quantum', /quantum/, ['Qubit', 'Quantum', 'Classical', 'Readiness', 'Cryptography', 'Migration']],
  ['migration', /migrat|strangler|repatriation|moderniz|rewrite|legacy/, ['Current', 'Transition', 'Target', 'Migration', 'Legacy', 'Cutover', 'Rollback']],
  ['security', /security|hardening|secrets|tls-|certificate|privacy|fraud|supply-chain|selinux|apparmor|firewall|ssh|prompt-injection/, ['Boundary', 'Controls', 'Verification', 'Secrets', 'Trust', 'Policy', 'Security']],
  ['cost', /finops|cost|billing|savings|reserved-instance|commitment|cloud-bill|pricing|gpu-fleet|unit-economics|private-cloud-economics|egress-surprise/, ['Usage', 'Allocation', 'Ownership', 'Cost', 'Budget', 'Commitment', 'Utilization']],
  ['incident', /incident|detection|on-call|postmortem|post-mortem|mttr|outage|failure|disaster-recovery|dr-plan|runbook|chaos|resilien/, ['Detect', 'Respond', 'Recover', 'Incident', 'Runbook', 'Resilience', 'Learning']],
  ['telemetry', /observab|monitor|tracing|sampling|logging|metrics|slo|error-budget|ebpf|strace|performance|profil|benchmark|vitals|disk-io/, ['Signals', 'Context', 'Diagnosis', 'Logs', 'Metrics', 'Traces', 'Latency', 'Profiling']],
  ['model', /\bai\b|\bml\b|llm|neural|machine-learning|mlops|model|feature-store|feature-engineering|prompt/, ['Data', 'Model', 'Evaluation', 'Inference', 'Context', 'Training', 'Deployment']],
  ['stream', /kafka|flink|stream|data-pipeline|batch|etl|data-contract|data-quality|lakehouse|data-mesh|change-data|data-ownership|event-driven|jms|weblogic-jms/, ['Source', 'Processing', 'Consumer', 'Schema', 'Events', 'Pipeline', 'Contract']],
  ['database', /database|postgres|mongodb|sqlite|dynamodb|orm-|sql-|schema|storage/, ['Application', 'Data', 'Storage', 'Schema', 'Query', 'Records', 'Database']],
  ['container', /docker|container|namespace|cgroup|kubernetes|helm|operators/, ['Workload', 'Runtime', 'Host', 'Container', 'Pod', 'Cluster', 'Namespace']],
  ['network', /network|dns|vpc|load-balanc|reverse-proxy|nginx|service-mesh|tcp|http3|quic\b|warp|websocket|grpc/, ['Client', 'Network', 'Service', 'DNS', 'Routing', 'Connection', 'Proxy']],
  ['delivery', /deploy|gitops|ci-cd|trunk-based|feature-flag|release|pipeline|orchestrat|workflow|webhook|notification|email-deliverability|sre-toil/, ['Source', 'Delivery', 'Operation', 'Build', 'Release', 'Rollback', 'Workflow']],
  ['api', /api|sdk|fastapi|graphql|twelve-factor|session-management|error-handling|file-upload/, ['Client', 'Contract', 'Service', 'Request', 'Response', 'Schema', 'SDK']],
  ['platform', /platform|self-service|paved-road|golden-path|developer-experience|inner-loop/, ['Developer', 'Platform', 'Feedback', 'Self-service', 'Golden path', 'Product', 'Adoption']],
  ['governance', /governan|policy|audit|compliance|decision-record|well-architected|production-readiness|due-diligence|build-vs-buy|review/, ['Decision', 'Evidence', 'Action', 'Policy', 'Review', 'Ownership', 'Trade-offs']],
  ['compute', /operating-system|os-|jvm|graal|virtual-thread|memory|cpu|gpu|process|concurrency|hardware|compression/, ['Application', 'Runtime', 'System', 'Memory', 'Process', 'Thread', 'Kernel']],
  ['code', /python|java|typescript|programming|prog-lang|code|testing|test-|shell|bash|webassembly|astro|language|debug|monorepo/, ['Source', 'Feedback', 'Change', 'Code', 'Tests', 'Types', 'Build']],
  ['architecture', /architect|monolith|microservice|bounded-context|hexagonal|system-design|abstraction|boundaries|cloud-native|multi-cloud|hybrid-cloud|serverless|cloud-hosted/, ['Context', 'Boundary', 'Trade-off', 'System', 'Team', 'Service', 'Architecture']],
  ['people', /team|engineer|leader|hiring|mentorship|feedback|collaborat|meeting|career|technical|learning|writing|knowledge|retros|estimat|velocity|context-switch|onboarding|generalist|vendor/, ['People', 'Practice', 'Learning', 'Team', 'Feedback', 'Decision', 'Work']],
];

const tagLayout = new Map([
  ['FinOps', 'cost'], ['Security', 'security'], ['DevSecOps', 'delivery'],
  ['Observability', 'telemetry'], ['Reliability', 'incident'], ['Performance', 'telemetry'],
  ['Containers', 'container'], ['Data Engineering', 'stream'], ['Infrastructure', 'compute'],
  ['Enterprise AI', 'model'], ['AI & MLOps', 'model'], ['Platform Engineering', 'platform'],
  ['Cloud Architecture', 'architecture'], ['Architecture', 'architecture'], ['Distributed Systems', 'consensus'],
  ['Programming', 'code'], ['Engineering Leadership', 'people'],
]);

let articles;
function catalog() {
  if (articles) return articles;
  const manifest = JSON.parse(readFileSync(new URL('../content/manifest.json', import.meta.url), 'utf8'));
  articles = new Map();
  for (const article of manifest) {
    const text = readFileSync(new URL(`../content/${article.section}/${article.slug}.md`, import.meta.url), 'utf8');
    const sourceTitle = parseFront(text)?.fm.title || article.title;
    articles.set(article.slug, { ...article, title: sourceTitle, text });
  }
  return articles;
}

export function articleDirection(slug) {
  const article = catalog().get(slug);
  if (!article) return null;
  return subjectDirection(article);
}

export function subjectDirection(article) {
  const { slug } = article;
  article = { tags:[], section:'insights', text:article.title || '', ...article };
  const search = `${slug.replaceAll('-', ' ')} ${article.title}`.toLowerCase();
  const matches = (pattern, text) => new RegExp(`(?:^|[-\\s])(?:${pattern.source})`, 'i').test(text);
  let rule = rules.find(([, pattern]) => matches(pattern, slug));
  if (!rule) rule = rules.find(([, pattern]) => matches(pattern, search));
  if (!rule) {
    const layout = article.tags.map(t => tagLayout.get(t)).find(Boolean) || 'people';
    rule = rules.find(([name]) => name === layout);
  }
  const [layout, , concepts] = rule;
  const mentioned = concepts.filter(label => article.text.toLowerCase().includes(label.toLowerCase()));
  const headings = [...article.text.matchAll(/^#{2,3}\s+(.+)$/gm)]
    .map(match => match[1].replace(/[`*_]/g, '').split(/:\s| — /)[0])
    .filter(heading => heading.length > 3 && heading.length < 28);
  const terms = [...new Set([...mentioned, ...headings, ...article.tags])].slice(0, 3);
  const note = article.section === 'notes';
  let subject = article.title.split(/:\s| — /)[0].replace(/^Quick take:\s*/i, '');
  if (subject.length > 65) subject = slug.replace(/^quick-take-/, '').split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');
  return { slug, title: article.title, subject, layout: note ? 'field' : layout, scene: note ? noteScene(slug) : layout,
    terms, section: article.section,
    description: note ? `An editorial illustration for ${article.title}.` : `Conceptual illustration for ${article.title}: ${terms.join(', ')}.` };
}

function noteScene(slug) {
  if (/saying-no/.test(slug)) return 'boundaries';
  if (/feedback/.test(slug)) return 'conversation';
  if (/mentorship/.test(slug)) return 'mentorship';
  if (/work-life/.test(slug)) return 'balance';
  if (/deep-work/.test(slug)) return 'focus';
  if (/imposter/.test(slug)) return 'reflection';
  if (/twenty-five/.test(slug)) return 'experience';
  if (/conferences/.test(slug)) return 'conference';
  if (/far-from-home/.test(slug)) return 'home';
  if (/moving|countr|travel/.test(slug)) return 'journey';
  if (/knowledge/.test(slug)) return 'library';
  if (/reading|learning|writing/.test(slug)) return 'reading';
  if (/music/.test(slug)) return 'music';
  return 'reflection';
}

export const EDITORIAL_LAYOUTS = rules.map(([name]) => name);

const sceneLabels = {
  fabric: ['Compute', 'Network fabric', 'Compute'], network: ['Client', 'Network', 'Service'],
  cache: ['Application', 'Cache', 'Origin'], retrieval: ['Documents', 'Retrieval', 'Generation'],
  identity: ['Identity', 'Access policy', 'Resource'], security: ['Request', 'Trust boundary', 'Resource'],
  index: ['Query', 'Index structure', 'Storage'], container: ['Workload', 'Runtime', 'Host'],
  consensus: ['Replica', 'Leader', 'Replica'], quantum: ['Classical', 'Quantum state', 'Security'],
  telemetry: ['Signals', 'Investigation', 'Understanding'], cost: ['Usage', 'Allocation', 'Ownership'],
  migration: ['Current system', 'Transition', 'Target system'], incident: ['Detect', 'Protect', 'Learn'],
  experiment: ['Audience', 'Variants', 'Evaluation'], people: ['People', 'Shared practice', 'People'],
  platform: ['Developer', 'Platform', 'Developer'], architecture: ['Context', 'Boundaries', 'System'],
  compute: ['Application', 'Compute', 'Storage'], pagination: ['Page', 'Cursor', 'Next page'],
  throttle: ['Requests', 'Admission control', 'Service'], model: ['Data', 'Model', 'Evaluation'],
  stream: ['Source', 'Processing', 'Consumer'], database: ['Application', 'Database', 'Storage'],
  api: ['Client', 'Contract', 'Service'], delivery: ['Source', 'Package', 'Deployment'],
  transaction: ['Request', 'Transaction', 'Verification'], governance: ['Evidence', 'Review', 'Decision'],
  code: ['Source', 'Feedback', 'Change'],
  virtualization: ['Virtual machine', 'Hypervisor', 'Host'],
  accessibility: ['Keyboard', 'Semantics', 'Inclusive interface'], backup: ['Source', 'Backup', 'Restore'],
  locale: ['Languages', 'Messages', 'Interface'], energy: ['Compute', 'Efficiency', 'Environment'],
  hashring: ['Keys', 'Hash ring', 'Nodes'], sharding: ['Shard', 'Routing', 'Shard'],
  time: ['Physical clocks', 'Logical time', 'Ordering'],
};

// Deliberate subject glyphs. Coordinates use a 100 × 100 local drawing space.
const glyph = (kind, color) => {
  const shapes = {
    document: '<path d="M22 10h38l18 18v62H22z M60 10v20h18 M34 45h32 M34 58h32 M34 71h21"/>',
    database: '<ellipse cx="50" cy="24" rx="30" ry="12"/><path d="M20 24v52c0 16 60 16 60 0V24 M20 49c0 16 60 16 60 0 M20 74c0 16 60 16 60 0"/>',
    chip: '<rect x="24" y="24" width="52" height="52" rx="8"/><path d="M38 6v18m12-18v18M62 6v18M38 76v18m12-18v18m12-18v18M6 38h18M6 50h18M6 62h18m52-24h18M76 50h18M76 62h18"/><rect x="37" y="37" width="26" height="26" rx="4"/>',
    shield: '<path d="M50 9L83 22v27c0 22-17 35-33 43-16-8-33-21-33-43V22z M33 50l12 13 24-28"/>',
    cloud: '<path d="M26 75C0 75 4 39 27 39c-2-34 48-39 51-5 25-3 30 41 4 41z"/>',
    code: '<path d="M33 25L10 50l23 25m34-50l23 25-23 25M59 14L42 87"/>',
    people: '<circle cx="50" cy="28" r="15"/><path d="M19 88v-9a31 31 0 0162 0v9 M15 18a12 12 0 000 24M85 18a12 12 0 010 24M7 59a20 20 0 00-4 29m90-29a20 20 0 014 29"/>',
    gateway: '<path d="M18 88V12h64v76M38 30h24v58M6 88h88 M6 50h20m48 0h20 M20 44l7 6-7 6m61-12l-7 6 7 6"/>',
    search: '<circle cx="43" cy="41" r="27"/><path d="M63 63l27 27M30 41h26M43 28v26"/>',
    clock: '<circle cx="50" cy="50" r="37"/><path d="M50 25v28l19 11M50 13v7m37 30h-7M50 87v-7M13 50h7"/>',
    book: '<path d="M50 26C36 12 17 13 7 18v64c15-7 29-4 43 7 14-11 28-14 43-7V18c-10-5-29-6-43 8v63 M18 33c8-2 16 0 23 4m-23 9c8-2 16 0 23 4m18-13c7-4 15-6 23-4m-23 17c7-4 15-6 23-4"/>',
    flag: '<path d="M23 92V10m1 4c23-15 32 16 57 1v41c-25 15-34-16-57-1"/>',
    network: '<rect x="31" y="36" width="38" height="28" rx="5"/><path d="M10 12h20v16H10zM70 12h20v16H70zM10 75h20v16H10zM70 75h20v16H70zM20 28v12h11m38 0h11V28M20 75V60h11m38 0h11v15"/>',
    cache: '<path d="M23 12h54v77H23zM35 29h30m-30 15h30M42 58h19l-9 12h10L44 88l5-14H38z"/>',
    container: '<rect x="10" y="18" width="80" height="64" rx="6"/><path d="M26 28v44m16-44v44m16-44v44m16-44v44M10 67h80"/>',
    keyboard: '<rect x="6" y="23" width="88" height="56" rx="7"/><path d="M18 38h7m9 0h7m9 0h7m9 0h7m9 0h1M18 51h7m9 0h7m9 0h7m9 0h7m9 0h1M25 65h50"/>',
    leaf: '<path d="M18 81C-2 30 47 16 86 10c7 50-8 83-54 70M18 90L70 29M45 56V32m1 23h25"/>',
    globe: '<circle cx="50" cy="50" r="38"/><ellipse cx="50" cy="50" rx="17" ry="38"/><path d="M12 50h76M20 28h60M20 72h60"/>',
  };
  return `<g fill="none" stroke="${color}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${shapes[kind] || shapes.document}</g>`;
};

function sceneFor(layout, c1, c2) {
  const icon = (kind, x, y, scale = 1, color = c1) => `<g transform="translate(${x} ${y}) scale(${scale})">${glyph(kind, color)}</g>`;
  const line = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c1}" stroke-width="2" opacity=".48" fill="none"/>`;
  const node = (kind, x, y, scale = .7) => `<rect x="${x - 12}" y="${y - 12}" width="${100 * scale + 24}" height="${100 * scale + 24}" rx="18" fill="${c1}" fill-opacity=".055" stroke="${c1}" stroke-opacity=".18"/>${icon(kind,x,y,scale)}`;
  if(layout==='boundaries') return `<g fill="none" stroke="${c1}" stroke-width="3"><circle cx="280" cy="110" r="85"/><path d="M230 110h100M80 45h65m-65 30h65m280 80h65m-65 30h65"/></g>`;
  if(layout==='conversation') return `<g stroke="${c1}" stroke-width="3" fill="none"><path d="M55 24h210v95H125l-38 30v-30H55z"/><path d="M300 74h210v95h-32v29l-38-29H300z" stroke="${c2}"/><path d="M85 55h130m-130 28h90m225 26h130m-130 28h90"/></g>`;
  if(layout==='mentorship') return `${icon('people',70,45,.95)}${icon('book',238,55,.85,c2)}${icon('people',410,65,.7)}${line(172,100,225,100)}${line(335,100,400,100)}`;
  if(layout==='balance') return `<g fill="none" stroke="${c1}" stroke-width="3"><path d="M280 26v158m-60 0h120M120 65h320M120 65l-55 92h110zM440 65l-55 92h110z"/><circle cx="280" cy="64" r="9" fill="${c2}"/></g>`;
  if(layout==='focus') return `${icon('book',150,65,1.2)}<g fill="none" stroke="${c1}" stroke-width="3"><path d="M65 190h440M370 190V50l-65 35m-15 8l45-30 25 38-45 30z"/><path d="M306 126l-30 52m53-41l-7 41" stroke="${c2}" stroke-dasharray="4 6"/></g>`;
  if(layout==='experience') return `<g fill="none" stroke="${c1}" stroke-width="3"><path d="M45 113h465"/>${[70,175,280,385,490].map((x,i)=>`<circle cx="${x}" cy="113" r="${8+i*3}"/>`).join('')}<path d="M175 75V50h210v25m-105 75v45"/></g>${icon('book',248,145,.6,c2)}`;
  if(layout==='conference') return `<g fill="none" stroke="${c1}" stroke-width="3"><path d="M150 15h270v105H150zM200 153h170"/><circle cx="280" cy="60" r="15"/><path d="M250 110V95a30 30 0 0160 0v15"/>${[105,190,280,370,455].map(x=>`<circle cx="${x}" cy="180" r="15"/>`).join('')}</g>`;
  if(layout==='home') return `<g fill="none" stroke="${c1}" stroke-width="3"><path d="M160 10h240v195H160zM280 10v195M160 110h240M190 156l40 30 38-30m-68-56l28-35 29 35v27h-57z"/><circle cx="350" cy="56" r="16" stroke="${c2}"/></g>`;
  if(layout==='library') return `<g fill="none" stroke="${c1}" stroke-width="3"><path d="M80 180h410M95 160V40h48v120M155 160V20h48v140M215 160V55h48v105M300 160l-24-115 47-10 24 125M365 160V30h48v130M425 160V65h48v95"/><path d="M106 65h24m37-18h24m185 12h24" stroke="${c2}"/></g>`;
  if (['reading','reflection','journey','music'].includes(layout)) {
    if (layout === 'journey') return `${icon('cloud',50,28,.8)}${line(110,140,450,140)}<path d="M110 140Q235 30 450 140" fill="none" stroke="${c1}" stroke-width="2" stroke-dasharray="6 7"/>${icon('flag',30,100,.65)}${icon('people',420,95,.65,c2)}`;
    if (layout === 'music') return `<g stroke="${c1}" stroke-width="3" fill="none"><path d="M80 75h380M80 95h380M80 115h380M80 135h380M80 155h380M200 160V55l90-16v105"/><ellipse cx="184" cy="160" rx="16" ry="11"/><ellipse cx="274" cy="144" rx="16" ry="11"/></g>`;
    if(layout==='reflection') return `${icon('people',110,65,.9)}<g fill="none" stroke="${c1}" stroke-width="3"><ellipse cx="367" cy="92" rx="75" ry="85"/><path d="M367 177v27m-45 0h90"/></g>${icon('people',330,65,.75,c2)}`;
    return `${icon('book',195,30,1.55)}<path d="M90 174q50-45 91 0m180 0q50-45 91 0" fill="none" stroke="${c2}" opacity=".5" stroke-width="2"/>`;
  }
  if (layout === 'fabric' || layout === 'network') return `${node('chip',30,40)}${node('network',238,40)}${node('chip',446,40)}${[60,80,100].map(y => line(112,y,226,y)+line(320,y,434,y)).join('')}${icon('network',240,145,.55,c2)}`;
  if (layout === 'cache') return `${node('code',30,60)}${node('cache',238,60)}${node('database',446,60)}${line(112,95,226,95)}${line(320,95,434,95)}<path d="M275 48Q165-15 65 48" fill="none" stroke="${c2}" stroke-width="3" stroke-dasharray="7 5"/>`;
  if (layout === 'retrieval') return `${node('document',30,60)}${node('search',238,60)}${node('chip',446,60)}${line(112,95,226,95)}${line(320,95,434,95)}${icon('document',246,-20,.5,c2)}`;
  if (layout === 'identity' || layout === 'security') return `${node('people',30,60)}${icon('shield',225,17,1.1,c2)}${node('database',446,60)}${line(112,95,215,95)}${line(345,95,434,95)}<path d="M200 10v178M365 10v178" stroke="${c1}" opacity=".25" stroke-width="2" stroke-dasharray="5 7"/>`;
  if (layout === 'index') return `${icon('search',20,60,.75)}${line(110,95,225,95)}<g stroke="${c1}" fill="none" stroke-width="2"><path d="M265 45v35m0 0l-65 45m65-45v45m0-45l65 45"/><rect x="240" y="10" width="50" height="35" rx="6"/>${[175,240,305].map(x=>`<rect x="${x}" y="125" width="50" height="35" rx="6"/>`).join('')}</g>${line(367,95,433,95)}${icon('database',445,60,.75,c2)}`;
  if (layout === 'container' || layout === 'virtualization') return `<rect x="42" y="12" width="470" height="186" rx="22" stroke="${c1}" fill="${c1}" fill-opacity=".035"/>${[70,225,380].map(x=>icon('container',x,35,.86)).join('')}<path d="M65 150h426m-426 23h426" stroke="${c2}" stroke-width="8" opacity=".45"/>`;
  if (layout === 'consensus') return `${node('database',235,0)}${node('database',40,120)}${node('database',430,120)}${line(267,82,115,140)}${line(305,82,430,140)}${line(125,178,418,178)}`;
  if (layout === 'quantum') return `<g transform="translate(280 108)" fill="none" stroke="${c1}" stroke-width="2.5"><circle r="88"/><ellipse rx="88" ry="30"/><ellipse rx="30" ry="88"/><path d="M0 0L49-63M-110 0h220M0-110v220"/><circle cx="49" cy="-63" r="8" fill="${c2}"/></g>${icon('chip',45,75,.65)}${icon('shield',445,75,.65,c2)}`;
  if (layout === 'hashring') return `<circle cx="278" cy="105" r="83" fill="none" stroke="${c1}" stroke-width="3"/>${[0,1,2,3].map(i=>{const a=i*Math.PI/2;return `<circle cx="${278+Math.cos(a)*83}" cy="${105+Math.sin(a)*83}" r="12" fill="${c2}"/>`;}).join('')}${icon('document',30,65,.7)}${icon('database',450,65,.7)}${line(120,100,184,100)}${line(372,100,435,100)}`;
  if (layout === 'telemetry') return `<g fill="none" stroke-linecap="round"><path d="M35 155H520M35 24v131" stroke="${c1}" opacity=".3"/><path d="M45 126h55l22-54 24 78 25-49h60l22-59 25 84h80l25-35 22 35h95" stroke="${c1}" stroke-width="4"/><path d="M50 177h105m20 0h80m20 0h155m-210 22h90" stroke="${c2}" stroke-width="7" opacity=".65"/></g>`;
  if (layout === 'cost') return `${icon('document',40,45,1.15)}<g stroke="${c1}" fill="none" stroke-width="3"><path d="M225 48h250M225 86h170M225 124h210M225 162h125"/><circle cx="480" cy="162" r="26"/><path d="M469 162l8 8 15-18"/></g>`;
  if (layout === 'migration') return `${node('database',30,70)}${node('cloud',446,70)}<path d="M120 106C200-9 354-9 430 106M120 135C200 250 354 250 430 135" stroke="${c1}" stroke-width="3" fill="none"/><path d="M271 5l17 6-13 12m-1 183l-16-7 13-12" stroke="${c2}" stroke-width="3" fill="none"/>`;
  if (layout === 'incident') return `${icon('clock',30,50,.9)}${icon('shield',235,50,.9,c2)}${icon('book',440,50,.9)}<path d="M70 177h420" stroke="${c1}" stroke-width="3"/>${[75,280,485].map(x=>`<circle cx="${x}" cy="177" r="6" fill="${c1}"/>`).join('')}`;
  if (layout === 'experiment' || layout === 'comparison') return `${icon('people',20,67,.7)}${line(102,100,218,45)}${line(102,100,218,155)}${node('document',230,0)}${node('document',230,120)}${line(312,45,430,100)}${line(312,155,430,100)}${icon('search',445,67,.7,c2)}`;
  if (layout === 'people' || layout === 'platform') return `${icon('people',36,55,.95)}${icon(layout==='platform'?'gateway':'book',228,35,1.2,c2)}${icon('people',440,55,.95)}${line(137,100,213,100)}${line(365,100,430,100)}`;
  if (layout === 'architecture') return `<g fill="${c1}" fill-opacity=".04" stroke="${c1}" stroke-width="2"><rect x="28" y="10" width="500" height="190" rx="20"/><rect x="55" y="45" width="180" height="120" rx="12"/><rect x="325" y="45" width="175" height="120" rx="12"/><path d="M235 105h90"/></g>${icon('code',95,65,.75)}${icon('database',375,65,.75,c2)}`;
  if (layout === 'compute') return `${icon('code',30,55,.85)}${icon('chip',225,30,1.25,c2)}${icon('database',445,55,.85)}${line(125,100,213,100)}${line(362,100,432,100)}`;
  if (layout === 'pagination') return `${[50,205,360].map((x,i)=>`<g transform="translate(${x} ${20+i*12})">${glyph('document',i===1?c2:c1)}</g>`).join('')}<path d="M145 175h292m-12-8l12 8-12 8" fill="none" stroke="${c1}" stroke-width="3"/>`;
  if (layout === 'throttle') return `${icon('code',25,60,.85)}<path d="M190 20h160l-33 80v65h-94v-65z" fill="${c1}" fill-opacity=".08" stroke="${c1}" stroke-width="3"/>${[220,250,280,310].map(x=>`<circle cx="${x}" cy="45" r="7" fill="${c2}"/>`).join('')}${line(120,100,195,100)}${line(350,100,433,100)}${icon('gateway',445,60,.85,c2)}`;
  const kinds = {
    model:['document','chip','search'], stream:['database','gateway','database'], database:['code','database','database'],
    api:['code','document','gateway'], delivery:['code','container','cloud'], transaction:['document','database','shield'],
    governance:['document','search','flag'], code:['code','search','document'],
    accessibility:['keyboard','document','people'], backup:['database','database','database'],
    locale:['book','globe','code'], energy:['chip','leaf','cloud'],
    sharding:['database','gateway','database'], time:['clock','network','document'],
  }[layout] || ['document','search','flag'];
  return `${kinds.map((kind,i)=>node(kind,30+i*208,60)).join('')}${line(112,95,226,95)}${line(320,95,434,95)}`;
}

export function editorialArtwork(direction, { w, h, c1, c2, id }) {
  const wide = w / h > 2.3;
  const subject = direction.subject;
  const words = subject.split(' ');
  const lines = [];
  for (const word of words) {
    if (!lines.length || (lines.at(-1)+' '+word).length > (wide ? 32 : 31)) lines.push(word);
    else lines[lines.length-1] += ' '+word;
  }
  const headline = lines.slice(0, 3);
  const baseW = wide ? 1200 : 640;
  const baseH = wide ? 380 : 360;
  const labelY = wide ? 306 : 325;
  const drawX = wide ? 570 : 72;
  const drawY = wide ? 60 : 118;
  const drawScale = wide ? 1 : .88;
  const titleX = wide ? 66 : 40;
  const titleY = wide ? 132 : 43;
  const titleSize = wide ? 28 : 24;
  const roles = sceneLabels[direction.layout] || [];
  const ink = `var(--art-ink, ${c2})`;
  const labels = direction.section === 'notes' ? '' : roles.map((term,i)=>`<text x="${drawX+(68+i*208)*drawScale}" y="${labelY}" text-anchor="middle" font-size="${wide?17:21}" fill="${ink}" font-weight="600">${escape(term)}</text>`).join('');
  const concepts = wide && direction.section !== 'notes' ? direction.terms.map((term, i) => `<text x="${titleX}" y="${266+i*23}" font-size="15" fill="${ink}" opacity=".8">${escape(term)}</text>`).join('') : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(direction.description)}" preserveAspectRatio="xMidYMid meet" data-article-art="${escape(direction.slug)}" data-art-scene="${direction.scene}">
  <defs><clipPath id="cp${id}"><rect width="${w}" height="${h}" rx="18"/></clipPath></defs>
  <g clip-path="url(#cp${id})"><rect width="${w}" height="${h}" fill="${c1}" fill-opacity=".055"/>
  <g transform="scale(${w/baseW} ${h/baseH})" font-family="Inter,Arial,sans-serif">
    <path d="M24 ${baseH-24}H${baseW-24}" stroke="${c1}" stroke-opacity=".12"/>
    <text x="${titleX}" y="${wide?76:22}" font-size="${wide?13:11}" font-weight="700" letter-spacing="2" fill="${ink}">${direction.section === 'notes' ? 'A PERSONAL NOTE' : 'AJNA · '+escape(direction.layout.replaceAll('-',' ').toUpperCase())}</text>
    ${headline.map((line,i)=>`<text x="${titleX}" y="${titleY+i*(titleSize+8)}" font-size="${titleSize}" font-weight="650" fill="${ink}">${escape(line)}</text>`).join('')}
    ${concepts}
    <g transform="translate(${drawX} ${drawY}) scale(${drawScale})">${sceneFor(direction.scene,`var(--art-stroke, ${c1})`,`var(--art-accent, ${c2})`)}</g>
    ${labels}
  </g></g></svg>`.replace(/[ \t]+$/gm, '');
}
