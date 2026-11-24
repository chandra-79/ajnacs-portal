---
title: "Measure AI Productivity Without Losing the Workload Context"
description: "JIRA tickets closed and lines of code written are not productivity metrics. Here is what to measure when evaluating AI's impact on engineering output."
date: 2028-04-05
tags: ["AI & MLOps", "Enterprise AI", "Engineering Leadership"]
format: article
---

AI productivity measurement starts with a business and engineering question. Is the team completing a defined kind of work with less effort, shorter delay, better quality, or a better experience? Those outcomes can move in different directions. A single count of generated lines or accepted suggestions cannot stand in for all of them.

The appropriate comparison also depends on the decision. Selecting a tool for a small pilot requires less evidence than changing staffing or rewriting the delivery process around it. State what the study can support before choosing a convenient metric.

## Separate effort, elapsed time, and throughput

Person-hours measure effort. Lead time measures elapsed time through a defined workflow. Throughput counts completed units in a period. A reduction in implementation effort may not shorten lead time if the work still waits for a weekly review. A team may ship more small changes while delivering the same amount of user-visible capability.

Define the start and finish events. Commit-to-production time does not include all design and implementation work before the commit. It can be a useful delivery measure without being a complete productivity measure. Use a complementary effort sample when the hypothesis concerns coding or investigation time.

## Hold the quality requirement constant

An accepted change should meet the same functional, security, and maintainability requirements in both conditions. Track review findings and later defects. Define a failed deployment consistently with the team's operational process; do not impose an arbitrary universal 48-hour window and assume it captures every change-induced failure.

Review time needs interpretation. More review can indicate worse generated code, a larger patch, a more consequential change, or valuable mentoring. Record enough task context to investigate the movement. A lower review time is not necessarily an improvement if reviewers are checking less carefully.

## Work a complete example

Consider a fictional set of 20 comparable maintenance tasks. The baseline requires 60 hours of implementation, 15 hours of review, and five hours of correction: 80 hours. In an assisted condition, implementation takes 44 hours, review 21, and correction seven: 72 hours. The chart shows total observed effort, an eight-hour reduction or 10% under these assumptions.

Now include six hours spent setting up repository context and maintaining the assistant configuration during the trial. The assisted total becomes 78 hours, reducing the difference to two hours or 2.5%. Some setup may be one-time and some recurring. Report them separately rather than choosing whichever accounting boundary makes the result look strongest.

The numbers are synthetic. They illustrate how an implementation-only improvement can differ from a team-level result. A real experiment must also account for incomplete tasks and any work transferred to people outside the measured team.

## Reduce selection bias where practical

If developers choose when to use the tool, they may select easy tasks, unfamiliar tasks, or tasks they already expect to be difficult. That choice affects the comparison. Random assignment can help when feasible, while paired tasks or a crossover design may be useful in other settings. Each design has assumptions, including learning and carryover effects.

Record experience with the repository and the tool. An experienced maintainer working in familiar code may face a different trade-off from a new engineer using the assistant to discover interfaces. Published studies should be read with those conditions in mind. Results from one population are not a universal estimate for another.

## Include experience without confusing it with speed

Ask participants which tasks became easier, which suggestions required the most checking, and where the tool interrupted their thinking. Qualitative evidence can explain why measured effects differ between task classes. It also identifies benefits that a short timing trial misses, such as improved access to documentation or reduced repetitive work.

Keep the questions specific. A broad satisfaction score can coexist with no observed delivery improvement. That does not make the satisfaction signal worthless; it means the two signals answer different questions. Report them separately and explain the decision each informs.

The worksheet contains task class, allocation method, tool configuration, implementation effort, review effort, rework, setup, elapsed completion time, and acceptance outcome. Add follow-up observations after the code has been maintained. Preserve sample sizes and uncertainty, and avoid ranking individual engineers by the result.

A useful conclusion is bounded: the assistant helped a particular task class under specified controls, had uncertain value elsewhere, and needs another measurement period for maintenance effects. That is a stronger basis for action than a precise organization-wide percentage derived from a short trial with a changing task mix.

Before presenting savings, reconcile the task list with the study denominator. A task that was started and abandoned still consumed effort. Record why it was abandoned and whether the same acceptance rule applied in both conditions; silently dropping it can materially change a small trial.

## Sources and further study

- [Becker et al. — Early-2025 AI and experienced developer productivity](https://arxiv.org/abs/2507.09089)
- [DORA — 2024 research report and methodology](https://dora.dev/research/2024/dora-report/)
