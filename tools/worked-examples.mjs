import { readFile } from "node:fs/promises";
import { esc } from "./lib.mjs";
import { csv, deliveryFlow, evidence, metricValue } from "./measurements.mjs";

export async function readWorkedExamples() {
  const rows = (await readFile("content/worked-examples.txt", "utf8")).split("\n");
  const examples = new Map();
  for (const raw of rows.map(line => line.trim()).filter(line => line && !line.startsWith("#"))) {
    const fields = raw.split("|").map(part => part.trim());
    const [slug, lead, plan, label, unit, labelA, rawA, labelB, rawB, method, stages] = fields;
    if (fields.length !== 11 || fields.some(part => !part) || examples.has(slug) ||
        (unit !== "%" && [rawA, rawB].some(value => value.includes("/")))) {
      throw new Error(`Invalid worked example: ${slug}`);
    }
    const metrics = [[label, unit, rawA, rawB]];
    const labels = [labelA, labelB];
    const flow = stages.split(" > ");
    if (flow.length < 3 || flow.some(stage => !stage)) throw new Error(`Invalid workflow: ${slug}`);
    examples.set(slug, { lead, plan, method, labels, metrics, flow });
  }
  return examples;
}

export function examplesCsv(examples) {
  return csv([
    ["slug", "metric", "unit", "scenario", "raw_input", "chart_value", "data_origin", "method"],
    ...[...examples.entries()].flatMap(([slug, example]) =>
      example.metrics.flatMap(([metric, unit, ...raw]) => raw.map((value, index) => [
        slug, metric, unit, example.labels[index], value, metricValue(value), "synthetic", example.method,
      ]))),
  ]);
}

export function workedExample(example, personal = false) {
  return `<section class="field-worksheet worked-example" aria-labelledby="worked-example">
    <h2 id="worked-example">${personal ? "Try it yourself" : "Worked example"}</h2>
    <p class="case-notice">${personal ? "The exercise uses fictional numbers." : "This scenario and its results are illustrative."}</p>
    ${personal ? `<p>${esc(example.lead)}</p>` : ""}
    <p>${esc(example.plan)}</p>
    ${deliveryFlow(example.flow, personal ? "Exercise sequence" : "Execution sequence")}
    ${evidence("Example comparison", example.metrics, example.labels)}
    <h3>Method and limits</h3>
    <p>${esc(example.method)}</p>
    <a href="/field-guides/worked-examples.csv" download>Download the worked figures (CSV)</a>
  </section>`;
}
