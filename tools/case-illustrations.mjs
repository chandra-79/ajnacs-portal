import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { editorialArtwork } from "./editorial-art.mjs";
import { colorFor } from "./visuals.mjs";

// Every case has its own art direction. The images illustrate mechanisms.
// Measured or simulated values belong in the labelled chart below each case.
const scenes = {
  "checkout-timeout-budget": ["telemetry", "traces", "Checkout spans branch from a request, highlighting the dependency on the critical path."],
  "queue-age-investigation": ["delivery", "message-queue", "Envelopes wait in a queue between admission and delivery."],
  "on-call-toil-baseline": ["people", "action-loop", "A loop connects reflection, a chosen action and a change in on-call practice."],
  "postgres-tenant-query-plan": ["index", null, "A query moves through a planner to the index and data it will read."],
  "recovery-restore-test": ["backup", null, "Backup data travels through a restore and verification workflow."],
  "order-unit-cost-audit": ["cost", null, "A cloud billing illustration connects resource use to cost allocation."],
  "kubernetes-capacity-audit": ["throttle", null, "A capacity illustration shows requests against constrained service headroom."],
  "cloud-permission-audit": ["identity", "permissions", "A permission matrix shows distinct grants rather than a shared role."],
  "order-status-strangler": ["migration", null, "A migration illustration shows a gradual move from the legacy route to a new one."],
  "committed-order-events": ["stream", "event-log", "An event log connects stored changes to downstream processing."],
  "parallel-ledger-reconciliation": ["database", "row-versions", "A row-version illustration makes different revisions of records visible for comparison."],
  "blue-green-rollback-gate": ["delivery", "blue-green", "A switch routes traffic between blue and green releases."],
  "api-contract-retirement": ["api", "versions", "Versioned clients and contracts illustrate a period when old and new routes coexist."],
  "regional-failover-fencing": ["architecture", "regions", "Services are grouped by region to show the boundary crossed during failover."],
  "nightly-batch-watermark": ["stream", null, "A stream of records moves from an input source through processing to an output."],
  "self-service-provisioning-pilot": ["platform", null, "A platform sits between a service developer and the deployment infrastructure."],
  "grounded-policy-assistant": ["retrieval", null, "A question is connected to retrieved evidence before an answer is prepared."],
  "approval-before-record-change": ["model", "tool-boundary", "An agent reaches a resource through a defined tool and permission boundary."],
  "model-registry-canary": ["model", "model-lifecycle", "Model data, training, evaluation and deployment form a loop with feedback."],
  "retrieval-permission-refresh": ["security", "ai-review", "A review gate stands between AI processing and approved access."],
  "selective-classification-threshold": ["model", "evaluation", "Three panels show a task, an output and a review step."],
  "time-aware-forecast-evaluation": ["model", "prediction", "Historical inputs feed a model that generates a prediction."],
  "batch-scoring-recovery": ["database", "warehouse", "Multiple data inputs are funnelled into a warehouse where downstream outputs can be checked."],
  "model-routing-unit-cost": ["experiment", "outcomes", "Alternative configurations are compared on measures of the work they produce."],
  "kubernetes-rollout-lab": ["container", "namespaces", "A cutaway shows separate workloads inside a shared container host."],
  "incident-command-drill": ["incident", null, "Distinct stages trace an incident from detection through response and recovery."],
  "trace-context-lab": ["telemetry", "signals", "Logs, metrics and traces are shown with different shapes and shared context."],
  "delivery-pipeline-lab": ["delivery", null, "An application moves from source through build and deploy stages."],
  "platform-onboarding-practice": ["people", "adoption", "A developer need is connected to the platform capability intended to serve it."],
  "architecture-decision-workshop": ["governance", "problem-fit", "Two panels compare the stated problem and the tool under consideration."],
  "cost-allocation-lab": ["database", "star-schema", "A central cost table is linked to dimensions used to explain ownership and usage."],
  "toil-handoff-lab": ["mentorship", "mentorship", "Two people work through a task together before independent practice."],
};

export async function caseIllustration(out, item, topic) {
  const [scene, detail, description] = scenes[item.slug] || [];
  if (!scene) throw new Error(`Missing subject artwork for ${item.slug}`);
  const [c1, c2] = colorFor([topic]);
  const slug = `case-${item.slug}`;
  const width = 960;
  const height = 540;
  const svg = editorialArtwork({ slug, scene, detail, description, section: "insights", subject: item.title, terms: [] }, {
    w: width, h: height, c1, c2, id: slug, cover: true,
  });
  const path = `assets/cases/${item.slug}.png`;
  const version = createHash("sha256").update(svg).digest("hex").slice(0, 12);
  await out(path, new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: "Arial" } }).render().asPng());
  const src = `/${path}?v=${version}`;
  return { src, description, width, height };
}
