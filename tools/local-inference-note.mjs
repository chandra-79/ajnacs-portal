import { readFile } from "node:fs/promises";
import { esc } from "./lib.mjs";
import { evidence } from "./measurements.mjs";

const csvPath = "content/measurements/local-inference.csv";
const labPath = "tools/run-local-inference-lab.py";

export async function localInferenceNote() {
  const data = await readFile(csvPath, "utf8");
  const [header, ...records] = data.trim().split("\n");
  const groups = new Map();
  for (const record of records) {
    const [model, run, milliseconds, evaluations, throughput, build] = record.split(",");
    if (!model || ![run, milliseconds, evaluations, throughput].every(value => Number(value) > 0) || !build) {
      throw new Error("Malformed local inference observation");
    }
    if (!groups.has(model)) groups.set(model, []);
    groups.get(model).push(Number(throughput));
  }
  if (!header.endsWith("llama_cpp_build") || groups.size !== 2 || [...groups.values()].some(runs => runs.length !== 3)) {
    throw new Error("Expected three inference observations per model");
  }

  const labels = [...groups.keys()];
  const values = [...groups.values()].map(speeds => String(speeds.sort((a, b) => a - b)[1]));
  return {
    data, script: await readFile(labPath, "utf8"),
    html: `<section class="field-worksheet" aria-labelledby="local-run">
  <h2 id="local-run">A measured CPU-only inference run</h2>
  <p>We ran the same short prompt three times per model on one Apple Silicon machine using CPU-only llama.cpp, three threads and a 2,048-token context. These are local lab measurements.</p>
  ${evidence("Median decoder throughput", [["Decode throughput", "tokens/s", ...values]], labels, "Measured in Ajna's local lab")}
  <h3>How to reproduce it</h3>
  <p>The script alternates the two weight files over three runs. It requests 64 generated tokens at temperature zero. The chart uses the median of the runner’s reported evaluation throughput across 63 timed decode steps per run. The CSV retains timings, token counts and the runner build.</p>
  <ul>
    <li><a href="/field-guides/data/local-inference.csv" download>Download the six observations (CSV)</a></li>
    <li><a href="/field-guides/data/run-local-inference-lab.py" download>Download the Python runner</a></li>
  </ul>
  <p>Tokenisers and weight formats differ. The run measures decoding on one short prompt with one model loaded at a time. It does not measure answer quality, first-token latency, memory, GPU acceleration or multi-user capacity.</p>
  <pre><code>${esc("python3 run-local-inference-lab.py /path/to/gemma.gguf /path/to/qwen.gguf results.csv")}</code></pre>
</section>`,
  };
}
