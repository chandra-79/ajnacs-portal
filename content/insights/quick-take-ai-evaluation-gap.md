---
title: "Why AI Systems Need Automated Evals Before They Go Live"
description: "Build task-specific release evaluations, inspect important slices, and connect production sampling to a clear review process."
date: 2028-03-29
tags: ["AI & MLOps", "Enterprise AI"]
format: article
---

Software engineering has spent decades building automated test infrastructure — unit tests, integration tests, end-to-end tests, regression suites. The discipline is imperfect and inconsistently applied, but it exists. When you change a function, the test suite tells you whether you broke something.

An AI release process that relies only on hand-picked demonstrations leaves gaps that support tickets may reveal later. Automated checks and structured review can expose some of those gaps before release.

This is the evaluation gap.

## What AI evaluation actually requires

A useful AI evaluation framework has four components:

**Representative test sets.** Not the examples you used during development — those are biased toward cases you thought to consider. You need a sample of actual production inputs, including the weird ones, the edge cases, the user queries that made you wince when you read them. If you do not have production traffic yet, synthetic examples can exercise anticipated edge cases, while their coverage of future traffic remains uncertain.

**Quality metrics that match the task.** For classification, accuracy and F1 on a held-out set. For generation (summaries, answers, code), you need either human evaluation or reference-based metrics (ROUGE or BLEU for limited text-overlap properties, which do not by themselves establish factual correctness, or increasingly, LLM-as-judge for open-ended tasks). The choice of metric has to match what "good" means for your specific application.

**Regression detection on model changes.** Every time you update a model, fine-tune, change a prompt, or modify a retrieval pipeline — the evaluation suite runs. A model version that improves average quality but degrades a specific user segment should be caught before it ships, not discovered three weeks later.

**Production sampling.** A random sample of live outputs, evaluated on a schedule. This catches drift: degradation caused not by a code change but by changes in the distribution of inputs, the knowledge base, or the model's underlying behavior.

## Why teams skip it

Eval infrastructure takes time to build and is invisible to stakeholders. Shipping the feature is visible. The feature ships, the eval infrastructure is planned for the next sprint, and the next sprint has different priorities.

The result is that the AI system's QA layer is the users. That is not acceptable for any other category of software. It should not be acceptable here.

The effort depends on the task, labels, and consequences. Evaluation frameworks can support the workflow, but they do not define correctness for the team. The cost of not building it is discovering your model degraded in production and having no way to know when it started or what caused it.

## Build a release comparison that can reveal trade-offs

A hypothetical answer assistant has 80 ordinary questions and 20 questions that should be declined because the source is missing or unauthorized. Version A answers 68 ordinary questions correctly and declines 18 of the restricted questions appropriately. Version B answers 74 ordinary questions correctly but declines only 12 restricted questions appropriately. Both achieve 86 satisfactory outcomes out of 100 if the categories are simply added.

The chart shows the restricted-question results: 18 and 12. The equal overall total would hide a material change in the system's boundary behavior. The figures are synthetic and the examples are intentionally small. In a real release decision, examine the individual failures and increase the sample where uncertainty or consequence warrants it.

## Write the rubric before looking at the candidate

For each task, specify facts that must be present, unsupported claims that must be absent, and the circumstances that require abstention. Distinguish a helpful limitation from an unnecessary refusal. A model can appear more accurate by refusing many answerable questions, so report both correctness and coverage.

Use human reviewers to calibrate the rubric on an initial sample. Have two reviewers assess some overlapping cases and inspect disagreements. Disagreement may reveal an ambiguous task definition rather than a poor reviewer. Keep the rubric revision with the evaluation results so that a changed scoring rule is not mistaken for an improved model.

## Add automation where the property is observable

Code can validate a schema, enforce a numerical range, check that a cited source identifier exists, or compare a classification with a known label. Those checks are stronger than asking a second model to judge the same mechanical property. Factual support and nuanced task usefulness may still require human assessment or a calibrated judge.

If an LLM judge is used, supply a narrow criterion and test it against human-labeled examples. Include verbose wrong answers, concise correct answers, and answers containing attempts to influence the judge. Keep the judge configuration stable during a release comparison. A change in the judge can move the score while the application remains unchanged.

For the lab, create a CSV with case ID, slice, expected facts, permitted sources, candidate answer, automatic checks, and reviewer decision. Run two application versions against the same cases. Present a matrix of improvements, regressions, unchanged passes, and unchanged failures. This paired view directs attention to the cases the change actually affected.

After release, sample traffic under a documented selection rule and add newly discovered failure patterns to a later evaluation version. Avoid evaluating only complaints or only enthusiastic users. The offline suite and production sampling answer complementary questions: whether a known requirement regressed and whether the real task distribution has moved beyond the suite's coverage.

## Sources and further study

- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
