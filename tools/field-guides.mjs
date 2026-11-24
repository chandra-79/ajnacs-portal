import { esc } from "./lib.mjs";
import { models } from "../assets/js/field-math.mjs";

export const fieldGuides = [
  {
    slug: "sre-toil-reduction", key: "toil", name: "SRE toil",
    question: "Which recurring work is worth automating?",
    metric: "Operating effort per two-week window",
    axis: "hours", labels: ["Baseline toil", "Follow-up toil and upkeep"],
    inputs: [
      ["capacity", "Available engineering hours in each window", 120, ".01"],
      ["weeks", "Weeks in each window", 2, ".01"],
      ["before", "Baseline manual toil hours", 24, "0"],
      ["manual", "Follow-up manual toil hours", 9, "0"],
      ["maintenance", "Follow-up upkeep hours, separately logged", 2, "0"],
      ["build", "One-time implementation hours", 40, "0"],
    ],
    method: [
      "Compare two equal 14-day windows for the same team and production scope. Each has 120 available engineering hours. Count hands-on work, including manual retries and triage. Log automation upkeep separately from remaining manual toil.",
      "Add follow-up manual toil and upkeep to get 11 hours. Subtract from the 24-hour baseline and divide by two weeks to get 6.5 hours released per week. Divide 40 implementation hours by 6.5 for simple payback. A zero or negative release has no payback in this model.",
      "Check request volume, incident severity, service objectives, and transferred work before treating a change as durable. The chart omits one-time implementation effort from ongoing work and excludes novel incident investigation from toil.",
    ],
  },
  {
    slug: "platform-engineering-idp-2026", key: "onboarding", name: "Platform onboarding",
    question: "How long does a new service take to deploy with required checks?",
    metric: "Median elapsed time among successful deployments",
    axis: "hours", labels: ["Ticket-based", "Self-service"],
    inputs: [
      ["cutoff", "Observation time per attempt in hours", 72, ".01"],
      ["ticket", "Ticket-based deployment hours, or open", "10, 18, 20, 24, 30, 36, 42, 50, 60, open", "text"],
      ["selfService", "Self-service deployment hours, or open", "2, 3, 4, 5, 8, 11, 14, 20, open, open", "text"],
    ],
    method: [
      "Compare two synthetic cohorts of ten eligible new services. Start timing at an accepted onboarding request and stop at the first successful deployment to the same approved environment after the same policy checks have passed. Use elapsed time and a 72-hour observation window per attempt.",
      "Enter open for an attempt without a qualifying deployment by 72 hours. The ticket route completed nine of ten and the self-service route eight of ten. The medians are calculated among completed attempts only. Use both completion and latency in the decision. Open attempts remain in the completion denominator.",
      "Match or segment comparable workloads and teams in a real pilot. Track opt-outs, blocked checks and support effort. These examples cannot establish causality or predict your team's onboarding time.",
    ],
  },
  {
    slug: "cloud-unit-economics", key: "unitCost", name: "Cloud cost per unit",
    question: "Is the cloud cost of delivering an order rising or falling?",
    metric: "Effective cloud cost per completed order",
    axis: "USD", labels: ["Period A", "Period B"],
    inputs: [
      ["directA", "Period A direct effective cost in USD", 190, "0"],
      ["sharedA", "Period A allocated shared cost in USD", 50, "0"],
      ["completedA", "Period A unique completed orders", 1200, "0", "1"],
      ["directB", "Period B direct effective cost in USD", 216, "0"],
      ["sharedB", "Period B allocated shared cost in USD", 64, "0"],
      ["completedB", "Period B unique completed orders", 2000, "0", "1"],
    ],
    method: [
      "Compare two synthetic seven-day accounting windows for the same order service, currency and effective cost basis. Direct and allocated shared costs are disjoint. Shared costs use the same allocation rule in both windows. For example, allocate a gateway pool by each service's request share and check that allocated plus unallocated cost reconciles to the pool.",
      "Sum direct effective cost and the service's allocated shared cost. Divide by unique successfully completed orders attributed to the same windows. Retries and failed work still incur cost, but they cannot increase the completed-order denominator. Report unavailable when there are zero completions.",
      "The examples contain 1,500 and 2,600 total attempts, respectively, including retries. Attempt counts are context and are excluded from the metric. In production, review success rate and tail latency separately. Document taxes, credits, commitments, currencies and exclusions before comparing tenants or periods.",
    ],
  },
];

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function worksheetCsv(guide) {
  return [
    ["field", "definition", "example_value"],
    ...guide.inputs.map(([key, label, value]) => [key, label, value]),
  ].map(row => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function worksheet(guide) {
  const initial = Object.fromEntries(guide.inputs.map(([key, , value]) => [key, value]));
  const example = models[guide.key](initial);
  const chartMax = Math.max(...example.chart);
  const format = (value) => guide.axis === "USD" ? `$${value.toFixed(2)}` : `${value}h`;
  const rows = guide.labels.map((label, i) => {
    const value = example.chart[i];
    return `<li><span>${esc(label)}</span><span class="chart-bar" aria-hidden="true"><i style="--bar-width:${100 * value / chartMax}%"></i></span><strong>${format(value)}</strong></li>`;
  }).join("");
  const fields = guide.inputs.map(([key, label, value, min, step = "any"]) => {
    const input = min === "text" ? `<textarea name="${key}" rows="2" required>${esc(value)}</textarea>`
      : `<input type="number" name="${key}" min="${min}" step="${step}" value="${value}" required>`;
    return `<label>${esc(label)}${input}</label>`;
  }).join("");
  return `<section class="field-worksheet" aria-labelledby="measurement-worksheet">
  <h2 id="measurement-worksheet">Measurement worksheet</h2>
  <figure class="field-chart">
    <figcaption>${esc(guide.metric)} <span>Illustrative data · ${guide.axis}</span></figcaption>
    <ul class="chart-rows">${rows}</ul>
    <p class="muted">${esc(example.result)}</p>
  </figure>
  <details class="field-method" id="methodology" open>
    <summary>Methodology and limits</summary>
    ${guide.method.map(p => `<p>${esc(p)}</p>`).join("\n    ")}
  </details>
  <form data-field-worksheet="${guide.key}" hidden>
    <fieldset>
      <legend>Calculate with your own inputs</legend>
      <div class="field-inputs">${fields}</div>
    </fieldset>
    <div class="row"><button type="submit" class="btn">Calculate</button><button type="reset" class="btn btn-ghost">Reset example</button></div>
    <output aria-live="polite"></output>
  </form>
  <a href="/field-guides/${guide.slug}.csv" download>Download the worked inputs (CSV)</a>
</section>
<script type="module" src="/assets/js/field-worksheet.mjs"></script>`;
}
