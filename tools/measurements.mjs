import { esc } from "./lib.mjs";

export function metricValue(value) {
  const parts = value.split("/");
  if (!/^\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?$/.test(value) ||
      parts.some(part => !Number.isFinite(Number(part))) ||
      (parts.length === 2 && (Number(parts[1]) <= 0 || Number(parts[0]) > Number(parts[1])))) {
    throw new Error(`Invalid simulated value: ${value}`);
  }
  return parts.length === 2 ? 100 * Number(parts[0]) / Number(parts[1]) : Number(parts[0]);
}

export function csv(rows) {
  return rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n";
}

export function evidence(title, metrics, labels = ["Baseline", "Pilot"], origin = "Simulated figures") {
  const format = number => number.toLocaleString("en-US", { maximumFractionDigits: 6 });
  const series = metrics.map(([label, unit, ...values]) => {
    const max = unit === "%" ? 100 : Math.max(...values.map(metricValue)) || 1;
    return `<li class="case-metric">
      <h3>${esc(label)} <small>${esc(unit)}</small></h3>
      <ul class="chart-rows">${values.map((raw, index) => `<li><span>${esc(labels[index])}</span>
        <span class="chart-bar" aria-hidden="true"><i style="--bar-width:${100 * metricValue(raw) / max}%"></i></span>
        <strong>${format(metricValue(raw))}${unit === "%" ? "%" : ""}${raw.includes("/") ? ` <small>(${esc(raw)})</small>` : ""}</strong></li>`).join("")}</ul>
    </li>`;
  }).join("");
  return `<figure class="field-chart case-chart">
    <figcaption>${esc(title)} <span>${esc(origin)}</span></figcaption>
    <ul class="case-metrics">${series}</ul>
  </figure>`;
}

export function deliveryFlow(stages, heading = "Technical workflow") {
  return `<figure class="delivery-flow">
    <figcaption>${esc(heading)}</figcaption>
    <ol>${stages.map(stage => `<li>${esc(stage)}</li>`).join("")}</ol>
  </figure>`;
}
