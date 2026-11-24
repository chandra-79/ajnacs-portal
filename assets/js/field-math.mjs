function amount(raw, label, { minimum = 0, integer = false } = {}) {
  const value = String(raw ?? "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error(`Enter a valid number for ${label}.`);
  const n = Number(value);
  if (!Number.isFinite(n) || n < minimum || (integer && !Number.isSafeInteger(n))) {
    throw new Error(`Check the value for ${label}.`);
  }
  return n;
}

const show = (n, decimals = 2) => n.toLocaleString("en-US", { maximumFractionDigits: decimals });

export function toil(values) {
  const capacity = amount(values.capacity, "available hours", { minimum: .01 });
  const weeks = amount(values.weeks, "weeks per window", { minimum: .01 });
  const before = amount(values.before, "baseline toil");
  const manual = amount(values.manual, "remaining manual toil");
  const maintenance = amount(values.maintenance, "automation upkeep");
  const build = amount(values.build, "implementation hours");
  const after = manual + maintenance;
  if (before > capacity || after > capacity) throw new Error("Work recorded in either window must fit within its available hours.");
  const saved = (before - after) / weeks;
  const payback = saved > 0 ? build / saved : null;
  return {
    chart: [before, after],
    result: `Baseline ${show(100 * before / capacity, 1)}% of capacity. Follow-up ${show(100 * after / capacity, 1)}% including upkeep. ${show(saved)} net hours released per week. ${payback === null ? "No payback at this rate." : `Simple payback ${show(payback, 1)} weeks.`}`,
  };
}

function cohort(raw, cutoff, label) {
  const attempts = String(raw ?? "").split(",").map(value => value.trim());
  if (!attempts.length || attempts.some(value => !value)) throw new Error(`Enter comma-separated observations for ${label}.`);
  const durations = attempts.filter(value => value.toLowerCase() !== "open")
    .map(value => amount(value, `${label} deployment duration`));
  if (durations.some(n => n > cutoff)) throw new Error("Use open for an attempt that missed the observation cutoff.");
  durations.sort((a, b) => a - b);
  const middle = Math.floor(durations.length / 2);
  const median = !durations.length ? null : durations.length % 2
    ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2;
  return { median, completed: durations.length, attempts: attempts.length };
}

export function onboarding(values) {
  const cutoff = amount(values.cutoff, "observation hours", { minimum: .01 });
  const ticket = cohort(values.ticket, cutoff, "ticket-based onboarding");
  const assisted = cohort(values.selfService, cutoff, "self-service onboarding");
  const summary = (label, group) => `${label}: ${group.completed}/${group.attempts} completed by ${show(cutoff)}h${group.median === null ? "; median unavailable." : `; median ${show(group.median)}h among completions.`}`;
  return { chart: [ticket.median, assisted.median], result: `${summary("Ticket-based", ticket)} ${summary("Self-service", assisted)}` };
}

export function unitCost(values) {
  const directA = amount(values.directA, "period A direct cost");
  const sharedA = amount(values.sharedA, "period A shared cost");
  const completedA = amount(values.completedA, "period A completed orders", { integer: true });
  const directB = amount(values.directB, "period B direct cost");
  const sharedB = amount(values.sharedB, "period B shared cost");
  const completedB = amount(values.completedB, "period B completed orders", { integer: true });
  const a = directA + sharedA;
  const b = directB + sharedB;
  const first = completedA ? a / completedA : null;
  const second = completedB ? b / completedB : null;
  const unit = value => value === null ? "unit cost unavailable" : `$${show(value, 6)} per order`;
  return { chart: [first, second], result: `Period A: $${show(a)} allocated cost, ${unit(first)}. Period B: $${show(b)} allocated cost, ${unit(second)}.` };
}

export const models = { toil, onboarding, unitCost };
