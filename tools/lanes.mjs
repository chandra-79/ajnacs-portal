
export const lanes = [
  {
    id: "reliability",
    title: "Reliability & Observability",
    short: "Reliability",
    description: "Measure operational work, find the signal in production, and recover faster.",
    subtopics: ["SRE toil", "Observability", "Incident response", "Capacity and performance"],
    pathTitle: "Build a reliability practice",
    accent: "#2f65aa",
    artSummary: "Operational signals can reveal one decision worth acting on.",
    starter: ["sre-toil-reduction", "mttr-reduction-playbook", "chaos-engineering-practices"],
    reasons: [
      "Measure recurring operational work and decide what to automate.",
      "Use incident evidence to decide where recovery time can improve.",
      "Test a reliability assumption before an incident does."
    ],
    exercise: { label: "Work an error-budget exercise", description: "Set a service objective and make a decision with the remaining budget.", url: "/deep-dives/reliability/" }
  },
  {
    id: "platform-delivery",
    title: "Platform & Delivery",
    short: "Platform & Delivery",
    description: "Build a paved road from a team's first deployment to steady production releases.",
    subtopics: ["Platform engineering", "Developer experience", "CI/CD", "Containers and Kubernetes"],
    pathTitle: "Design a path to production",
    accent: "#237a75",
    artSummary: "A dependable delivery path makes each stage visible and recoverable.",
    starter: ["platform-engineering-idp-2026", "platform-eng-idp-design", "platform-eng-self-service", "platform-eng-observability", "platform-eng-measuring-success"],
    reasons: [
      "Measure the onboarding path to a qualifying first deployment.",
      "Translate the bottlenecks into platform capabilities and golden paths.",
      "Give teams self-service capabilities with operational limits.",
      "Make visibility a default property of every team’s deployments.",
      "Check whether your platform changes the engineering outcomes you care about."
    ],
    exercise: { label: "Measure a first deployment", description: "Work through an onboarding path and decide what to measure.", url: "/deep-dives/platform/" }
  },
  {
    id: "cloud-finops",
    title: "Cloud & FinOps",
    short: "Cloud & FinOps",
    description: "Connect cloud design, operating choices, and cost per business outcome.",
    subtopics: ["Unit economics", "Cost allocation", "Cloud architecture", "Commitment decisions"],
    pathTitle: "Make cloud cost measurable",
    accent: "#976229",
    artSummary: "A cost model links each layer of spend to a unit of work.",
    starter: ["cloud-unit-economics", "finops-anomaly-detection", "finops-chargeback-maturity"],
    reasons: [
      "Give infrastructure spend a meaningful denominator.",
      "Put anomaly checks around the cost baseline you just established.",
      "Assign ownership so teams can act on the signals in their cost data."
    ],
    exercise: { label: "Work a cloud unit-cost model", description: "Test how a change in service volume affects the cost of delivering one order.", url: "/deep-dives/finops/" }
  },
  {
    id: "systems-architecture",
    title: "Systems Architecture",
    short: "Systems Architecture",
    description: "Design distributed systems, choose tradeoffs, and modernize systems in place.",
    subtopics: ["System design", "Modernization", "Data stores", "Network architecture"],
    pathTitle: "Make architecture tradeoffs",
    accent: "#5f56a1",
    artSummary: "Connected system parts make dependencies and decisions visible.",
    starter: ["system-design-patterns-backend", "back-of-envelope-system-design", "database-replication-patterns"],
    reasons: [
      "Select the architecture shape that fits the workload.",
      "Check the design against back-of-envelope estimates.",
      "Decide how the system copies state and what may become stale."
    ],
    exercise: { label: "Test a migration decision", description: "Compare dependency order, dual running, and cutover evidence.", url: "/deep-dives/migration/" }
  },
  {
    id: "ai-data",
    title: "AI & Data Engineering",
    short: "AI & Data",
    description: "Deliver models, retrieval, and data pipelines with evidence that they work.",
    subtopics: ["MLOps", "LLMs and retrieval", "Evaluation", "Data platforms"],
    pathTitle: "Take AI into production",
    accent: "#21758c",
    artSummary: "Data, models, and evaluation form a traceable pipeline.",
    starter: ["aiml-production-ai", "prompt-engineering-production", "mlops-pipelines-azure-sagemaker"],
    reasons: [
      "Identify what production AI needs beyond a prototype.",
      "Define prompts and evaluations that can be maintained in production.",
      "Turn the design into a repeatable model delivery pipeline."
    ],
    exercise: { label: "Design an evaluation", description: "Work with an example evaluation set and make a release decision.", url: "/deep-dives/ai-evaluation/" }
  },
  {
    id: "security-identity",
    title: "Security & Identity",
    short: "Security & Identity",
    description: "Harden workloads and make identities and software supply chains auditable.",
    subtopics: ["Workload security", "Software supply chain", "Identity and permissions"],
    pathTitle: "Secure the deployment stack",
    accent: "#a64946",
    artSummary: "Nested boundaries distinguish access requests from trusted workloads.",
    starter: ["kubernetes-security-hardening", "containers-security", "supply-chain-security-sbom"],
    reasons: [
      "Establish the workload and cluster controls that matter most.",
      "Trace which container design choices affect the workload boundary.",
      "Check how dependencies reach the release and how you can audit them."
    ],
    exercise: { label: "Inspect a cloud permission audit", description: "See how an engineering team separated actual access from intended policy.", url: "/case-studies/architecture-audit/cloud-permission-audit/" }
  },
  {
    id: "software-engineering",
    title: "Software Engineering",
    short: "Software Engineering",
    description: "Make practical decisions about code, tests, runtimes, and engineering teams.",
    subtopics: ["Testing", "Languages and runtimes", "Linux", "Engineering practice"],
    pathTitle: "Build maintainable services",
    accent: "#50764b",
    artSummary: "Separate tests and modules keep changes local and easy to check.",
    starter: ["python-packaging-dependency-management", "java-testing-cloud-microservices", "python-async-production"],
    reasons: [
      "Start with a reproducible dependency environment.",
      "Decide which tests should protect a cloud service in CI.",
      "Consider where asynchronous execution changes runtime behavior."
    ],
    exercise: { label: "Work through engineering practice", description: "Use practical examples to make the connection between engineering decisions and learning.", url: "/deep-dives/learning/" }
  }
];

const laneById = new Map(lanes.map(lane => [lane.id, lane]));

export function lanePath(lane) {
  return "/learn/" + (typeof lane === "string" ? lane : lane.id) + "/";
}

const laneBySeries = new Map([
  ["AI, ML, LLMs, and Neural Networks: A Practitioner's Introduction", "ai-data"],
  ["Containerization from the Ground Up", "platform-delivery"],
  ["DevSecOps Pipeline", "security-identity"],
  ["FinOps from Zero to Production", "cloud-finops"],
  ["Getting Started with Programming Languages", "software-engineering"],
  ["Linux: A Complete Practical Course", "software-engineering"],
  ["Operating Systems for Engineers", "software-engineering"],
  ["Platform Engineering: From Concept to Internal Developer Platform", "platform-delivery"]
]);

const editedLaneLists = {
  reliability: [
    "observability-opentelemetry-2026", "structured-logging-practices", "trace-sampling-strategies",
    "capacity-planning-engineering", "queueing-theory-for-engineers", "designing-for-failure-resilience-patterns",
    "distributed-tracing-adoption", "quick-take-distributed-tracing-adoption", "observability-distributed-systems",
    "incident-culture-blameless", "incident-communication", "quick-take-incident-communication",
    "reliable-batch-jobs", "performance-issue-only-in-production", "quick-take-performance-only-in-production"
  ],
  "platform-delivery": [
    "deployment-strategies-blue-green-canary", "containers-kubernetes-fundamentals",
    "kubernetes-operators-custom-resources", "service-mesh-istio-linkerd",
    "platform-team-internal-product", "platform-abstraction-cost", "quick-take-platform-abstraction-cost",
    "kubernetes-for-small-teams", "quick-take-kubernetes-small-teams"
  ],
  "cloud-finops": [
    "serverless-vs-containers-2026", "azure-well-architected-framework", "oci-architect-associate-guide",
    "cloud-migration-common-failures", "cloud-landing-zone-design", "azure-landing-zone-design"
  ],
  "systems-architecture": [
    "database-migration-strategies", "database-indexing-explained", "database-transactions-isolation-levels",
    "zero-downtime-database-migrations", "database-migration-nobody-tested", "quick-take-database-migration-nobody-tested",
    "postgresql-performance-tuning", "postgresql-at-scale", "postgres-mvcc-vacuum-explained",
    "oracle-db-performance-tuning", "redis-production-patterns", "enterprise-caching-architecture",
    "multi-region-architecture-patterns", "strangler-fig-legacy-migration", "multi-tenancy-isolation-models",
    "weblogic-domains-clusters-explained", "weblogic-jms-production-configuration", "weblogic-performance-tuning",
    "weblogic-to-cloud-migration", "event-driven-architecture", "event-sourcing-cqrs",
    "api-design-enterprise", "api-gateway-patterns", "c4-model-architecture-diagrams", "modular-monolith-architecture",
    "architecture-decision-records", "architecture-decision-records-guide", "quick-take-architecture-decision-records",
    "api-versioning-regrets", "quick-take-api-versioning-regrets", "nginx-reverse-proxy-load-balancing"
  ],
  "ai-data": [
    "ai-training-cluster-networking", "quick-take-ethernet-vs-infiniband", "ai-coding-assistants-comparison-2026",
    "ai-cost-management-production", "snowflake-architecture-patterns"
  ],
  "security-identity": [
    "k8s-networking-cni", "weblogic-security-hardening", "cloud-security-is-configuration",
    "quick-take-cloud-security-is-configuration", "compliance-automation-cloud", "compliance-audit-nobody-prepared",
    "quick-take-compliance-audit", "quick-take-security-shift-left", "shift-left-security-patterns",
    "security-left-is-not-security-free", "llm-security-prompt-injection"
  ],
  "software-engineering": ["compression-selection-guide"]
};
const explicitLane = new Map(lanes.flatMap(lane => [...lane.starter, ...editedLaneLists[lane.id]]
  .map(slug => [slug, lane.id])));

// Specific skills outrank broad descriptors such as Architecture or Engineering Leadership.
const tagWeights = {
  reliability: {
    Observability: 10, Reliability: 8, "Incident Management": 11, "On-Call": 11, Resilience: 7, "Disaster Recovery": 7,
    "Capacity Planning": 8, Debugging: 4, Profiling: 5, Metrics: 5, "Web Performance": 6, Performance: 4, Autoscaling: 5
  },
  "platform-delivery": {
    "Platform Engineering": 10, "CI/CD": 11, Deployment: 10, "Infrastructure as Code": 10, GitOps: 10,
    Helm: 10, Containers: 7, DevSecOps: 5, "Developer Experience": 5, "Developer Tools": 4, Infrastructure: 3,
    "Feature Flags": 6, Automation: 4, "Team Topologies": 4, "Service Mesh": 8
  },
  "cloud-finops": {
    FinOps: 13, "Cost Optimisation": 12, "Cloud Architecture": 3, "Cloud Migration": 7, OCI: 8,
    Certifications: 2, Sustainability: 6, Infrastructure: 2, Autoscaling: 2
  },
  "systems-architecture": {
    Architecture: 3, "Distributed Systems": 8, "API Design": 7, "Legacy Modernization": 10, Modernization: 9,
    "Domain-Driven Design": 8, Middleware: 9, WebLogic: 9, Consensus: 10, Protocols: 7, Caching: 7,
    "CDN & Caching": 8, CDN: 8, "Edge Computing": 6, Storage: 5, Systems: 4, Scalability: 8, "Technical Debt": 3,
    "Quantum Computing": 11, "Emerging Technology": 4, HPC: 7, Integration: 5, Messaging: 8, Redis: 8,
    MongoDB: 8, NoSQL: 8, Oracle: 8, "Data Modeling": 5, "Stream Processing": 6, DNS: 7, GraphQL: 7
  },
  "ai-data": {
    "AI & MLOps": 13, "Enterprise AI": 12, "AI Adoption": 12, LLM: 12, "Data Engineering": 9,
    "Data Quality": 10, Analytics: 8, Experimentation: 9, Statistics: 9, Fraud: 7, "Stream Processing": 6,
    Search: 7, Elasticsearch: 7, "Data Modeling": 7, Graph: 6
  },
  "security-identity": {
    Security: 12, "Supply Chain Security": 14, Identity: 14, "Policy-as-Code": 10, Cryptography: 12,
    "Detection Engineering": 12, TLS: 10, Privacy: 8, Compliance: 5, DevSecOps: 3, Governance: 3,
    "Shadow IT": 4
  },
  "software-engineering": {
    Programming: 7, "Software Engineering": 7, "Engineering Practice": 6, "Engineering Leadership": 2,
    "Product Engineering": 5, Java: 10, Python: 10, JVM: 10, GraalVM: 10, "Quality Engineering": 9,
    "Code Review": 9, Algorithms: 7, "Type Safety": 10, TypeScript: 10, Async: 8, Concurrency: 8,
    "Spring Boot": 7, FastAPI: 7, WebAssembly: 6, Documentation: 5, Accessibility: 8,
    "Developer Experience": 3, Career: 4, Communication: 5, "Remote Work": 5, Agile: 5,
    "Project Management": 5, Fundamentals: 1
  }
};

const specificTags = new Set(
  Object.values(tagWeights).flatMap(weights => Object.entries(weights)
    .filter(([, weight]) => weight >= 6).map(([tag]) => tag))
);

export function laneFor(article) {
  if (article.section !== "insights") return null;
  const assigned = explicitLane.get(article.slug) || laneBySeries.get(article.series);
  if (assigned) return laneById.get(assigned);
  const ranked = lanes.map(lane => ({
    lane,
    score: article.tags.reduce((value, tag, index) =>
      value + (tagWeights[lane.id][tag] || 0) * (index === 0 ? 1.5 : 1), 0)
  })).sort((a, b) => b.score - a.score);
  return ranked[0].score > 0 ? ranked[0].lane : laneById.get("software-engineering");
}

const byDate = (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
const byChapter = (a, b) => a.seriesOrder - b.seriesOrder || a.slug.localeCompare(b.slug);

function sameTopics(article, other) {
  return article.tags.filter(tag => specificTags.has(tag) && other.tags.includes(tag));
}

function rankRelated(article, candidates) {
  return candidates.map(other => ({ other, score: sameTopics(article, other).length }))
    .sort((a, b) => b.score - a.score || byDate(a.other, b.other))
    .map(({ other }) => other);
}

const relatedPins = new Map([
  ["sre-toil-reduction", [
    ["observability-opentelemetry-2026", "Use telemetry to verify that automation actually reduces operational work."],
    ["trace-sampling-strategies", "Keep the incident traces that make recurring operational work easier to diagnose."]
  ]],
  ["platform-engineering-idp-2026", [
    ["deployment-strategies-blue-green-canary", "Choose a rollout model once a team has a dependable deployment path."],
    ["platform-eng-measuring-success", "Choose measures that show whether onboarding improves team delivery."]
  ]],
  ["cloud-unit-economics", [
    ["finops-tagging-policy", "Use allocation tags to build a defensible cost numerator."],
    ["kubernetes-cost-optimization", "Assign shared cluster costs when workload ownership is difficult to see."]
  ]]
]);

export function buildLaneDirectory(manifest, live) {
  const laneBySlug = new Map(manifest.filter(article => article.section === "insights")
    .map(article => [article.slug, laneFor(article)]));

  const liveInsights = live.filter(article => article.section === "insights" && laneBySlug.has(article.slug));
  const articles = new Map(liveInsights.map(article => [article.slug, article]));
  const liveByLane = new Map(lanes.map(lane => [lane.id, []]));
  const series = new Map();
  for (const article of liveInsights) {
    liveByLane.get(laneBySlug.get(article.slug).id).push(article);
    if (article.series) {
      if (!series.has(article.series)) series.set(article.series, []);
      series.get(article.series).push(article);
    }
  }
  for (const group of liveByLane.values()) group.sort(byDate);
  for (const group of series.values()) group.sort(byChapter);

  const starterReason = new Map(lanes.flatMap(lane => lane.starter
    .map((slug, index) => [slug, lane.reasons[index]])));
  const recommendation = (article, reason) => ({
    article, reason, lane: laneBySlug.get(article.slug)
  });

  const pathsByLane = new Map(lanes.map(lane => [lane.id, lane.starter
    .filter(slug => articles.has(slug))
    .map(slug => recommendation(articles.get(slug), starterReason.get(slug)))]));

  // Place live chapters together in reading order irrespective of their date
  // and map every article to its ordinal, so fallback follows the lane forward.
  const readingOrder = new Map(lanes.map(lane => {
    const starter = pathsByLane.get(lane.id).map(({ article }) => article);
    const ordered = [...starter, ...liveByLane.get(lane.id)];
    const included = new Set();
    const reading = [];
    for (const article of ordered) {
      const group = article.series ?
        series.get(article.series).filter(chapter => laneBySlug.get(chapter.slug).id === lane.id) : [article];
      for (const item of group) {
        if (included.has(item.slug)) continue;
        included.add(item.slug);
        reading.push(item);
      }
    }
    return [lane.id, reading];
  }));

  function adjacent(article, direction) {
    const chapters = series.get(article.series) || [];
    const position = chapters.findIndex(chapter => chapter.slug === article.slug);
    const chapter = position >= 0 ? chapters[position + direction] : null;
    if (chapter) {
      return {
        item: recommendation(chapter, starterReason.get(chapter.slug) ||
          (direction > 0 ? "Continue with the next published chapter in this series." : "Revisit the previous chapter in this series.")),
        fromSeries: true
      };
    }

    const lane = laneBySlug.get(article.slug);
    const reading = readingOrder.get(lane.id);
    const index = reading.findIndex(item => item.slug === article.slug);
    const candidates = direction > 0 ? reading.slice(index + 1) : reading.slice(0, index);
    const path = pathsByLane.get(lane.id);
    const step = path.findIndex(({ article: item }) => item.slug === article.slug);
    const direct = step >= 0 ? path[step + direction] : null;
    if (direct && candidates.includes(direct.article)) return { item: direct, fromSeries: false };

    const chosen = direction > 0 ? rankRelated(article, candidates)[0] : candidates.at(-1);
    const topics = chosen ? sameTopics(article, chosen) : [];
    const reason = topics.length ?
      "Continue with " + topics[0].toLowerCase() + " in another part of this topic." :
      "Explore another approach in " + lane.short + ".";
    return { item: chosen ? recommendation(chosen, starterReason.get(chosen.slug) || reason) : null, fromSeries: false };
  }

  function continuationFor(article) {
    if (!articles.has(article.slug) || article.section !== "insights") {
      return { next: null, previous: null, related: [], seriesNext: false };
    }
    const lane = laneBySlug.get(article.slug);
    const forward = adjacent(article, 1);
    const { item: previous } = adjacent(article, -1);
    const seen = new Set([article.slug, forward.item?.article.slug]);
    const pinned = (relatedPins.get(article.slug) || []).flatMap(([slug, reason]) => {
      if (!articles.has(slug) || seen.has(slug)) return [];
      seen.add(slug);
      return [recommendation(articles.get(slug), reason)];
    });
    const ranked = rankRelated(article, liveByLane.get(lane.id).filter(other => !seen.has(other.slug)))
      .slice(0, 2 - pinned.length)
      .map(other => {
        const shared = sameTopics(article, other)[0];
        const reason = shared ? "Another perspective on " + shared.toLowerCase() + "." : other.description;
        return recommendation(other, reason);
      });
    return { next: forward.item, previous, related: [...pinned, ...ranked], seriesNext: forward.fromSeries };
  }

  return { laneBySlug, liveByLane, pathsByLane, continuationFor };
}

