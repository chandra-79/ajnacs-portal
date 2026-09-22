/* References.
   We only ever link something the article already names, and only to that
   project's own primary source. Nothing here is invented, and no claim is
   attributed to a source the author did not mention. Every URL below was
   checked before it was added. */
import { esc } from "./lib.mjs";

export const SOURCES = [
  // framework / research
  [/\bDORA\b|\bState of DevOps\b|\bfour key metrics\b/i, "DORA — DevOps Research and Assessment", "https://dora.dev/", "The four delivery metrics and the research behind them."],
  [/\bSPACE framework\b/i, "The SPACE of Developer Productivity", "https://queue.acm.org/detail.cfm?id=3454124", "ACM Queue, Forsgren et al."],
  // CNCF / platform
  [/\bBackstage\b/i, "Backstage", "https://backstage.io/", "Open-source developer portal, now a CNCF project."],
  [/\bCNCF\b|Cloud Native Computing Foundation/i, "Cloud Native Computing Foundation", "https://www.cncf.io/", "Project landscape and graduation status."],
  [/\bKubernetes\b/i, "Kubernetes documentation", "https://kubernetes.io/docs/", "Primary reference for the concepts used here."],
  [/\bOpenTelemetry\b/i, "OpenTelemetry", "https://opentelemetry.io/docs/", "Specification and language SDKs."],
  [/\bPrometheus\b/i, "Prometheus", "https://prometheus.io/docs/", "Query language and operational guidance."],
  [/\bTerraform\b/i, "Terraform documentation", "https://developer.hashicorp.com/terraform/docs", "Language and provider reference."],
  [/\bArgo ?CD\b/i, "Argo CD", "https://argo-cd.readthedocs.io/", "GitOps continuous delivery for Kubernetes."],
  [/\bOpenPolicyAgent\b|\bOPA\b|\bRego\b/i, "Open Policy Agent", "https://www.openpolicyagent.org/docs/", "Policy engine and the Rego language."],
  // data
  [/\bPostgreSQL\b|\bPostgres\b/i, "PostgreSQL documentation", "https://www.postgresql.org/docs/current/", "Configuration and planner behaviour."],
  [/\bApache Kafka\b|\bKafka\b/i, "Apache Kafka documentation", "https://kafka.apache.org/documentation/", "Partitioning, consumer groups and delivery semantics."],
  [/\bApache Spark\b|\bSpark\b/i, "Apache Spark", "https://spark.apache.org/docs/latest/", "Execution model and tuning."],
  [/\bRedis\b/i, "Redis documentation", "https://redis.io/docs/latest/", "Data types, persistence and eviction."],
  [/\bVarnish\b/i, "Varnish Cache", "https://varnish-cache.org/docs/", "VCL reference and caching behaviour."],
  [/\bClickHouse\b/i, "ClickHouse", "https://clickhouse.com/docs", "Columnar storage and query execution."],
  // security
  [/\bOWASP\b/i, "OWASP", "https://owasp.org/", "Application security guidance and the Top 10."],
  [/\bNIST\b/i, "NIST Computer Security Resource Center", "https://csrc.nist.gov/", "Standards and special publications."],
  [/\bSLSA\b/i, "SLSA", "https://slsa.dev/", "Supply-chain levels for software artifacts."],
  [/\bSigstore\b|\bcosign\b/i, "Sigstore", "https://www.sigstore.dev/", "Signing and verification for artifacts."],
  [/\bCIS Benchmark/i, "CIS Benchmarks", "https://www.cisecurity.org/cis-benchmarks", "Hardening baselines."],
  // cloud / finops
  [/\bFinOps Foundation\b|\bFinOps\b/i, "FinOps Foundation", "https://www.finops.org/", "Framework, capabilities and terminology."],
  [/\bWell-Architected\b/i, "AWS Well-Architected Framework", "https://aws.amazon.com/architecture/well-architected/", "Pillars and review process."],
  // ai
  [/\bPyTorch\b/i, "PyTorch", "https://pytorch.org/docs/stable/", "Reference for the APIs discussed."],
  [/\bHugging Face\b/i, "Hugging Face", "https://huggingface.co/docs", "Model and dataset hubs."],
  [/\bOWASP Top 10 for LLM|\bLLM Top 10\b/i, "OWASP Top 10 for LLM Applications", "https://owasp.org/www-project-top-10-for-large-language-model-applications/", "Prompt injection and related risks."],
  // oracle / middleware
  [/\bWebLogic\b/i, "Oracle WebLogic Server documentation", "https://docs.oracle.com/en/middleware/fusion-middleware/weblogic-server/", "Work managers, pools and tuning."],
];

export function referencesFor(body, { max = 5 } = {}) {
  const hits = [];
  const seen = new Set();
  for (const [re, name, url, note] of SOURCES) {
    if (hits.length >= max) break;
    if (seen.has(url)) continue;
    if (re.test(body)) { hits.push({ name, url, note }); seen.add(url); }
  }
  return hits;
}

export function referencesBlock(refs) {
  if (!refs.length) return "";
  return `<aside class="refs" aria-labelledby="refs-h">
  <h2 id="refs-h" class="refs-title">References &amp; further reading</h2>
  <p class="refs-note">Primary sources for the tools and frameworks named above.</p>
  <ul>
${refs.map(r => `    <li><a href="${esc(r.url)}" rel="noopener nofollow" target="_blank">${esc(r.name)}</a><span>${esc(r.note)}</span></li>`).join("\n")}
  </ul>
</aside>`;
}
