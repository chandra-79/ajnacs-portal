---
title: "Evaluating LLMs in Production: Beyond Vibes and Benchmark Scores"
description: "Selecting and monitoring LLMs based on benchmark scores and gut feeling leads to production surprises. A systematic evaluation framework tied to your specific use cases produces decisions you can justify and systems you can monitor."
date: 2027-04-28
tags: ["AI & MLOps", "Enterprise AI"]
format: article
---

LLM evaluation is hard in a specific way: there is no single ground truth for "is this a good response?" A model that scores well on MMLU may perform poorly on your domain. A model that your engineers rate highly in manual review may show different behavior at scale when users interact with it differently than testers did.

The evaluation practices that hold up separate pre-deployment evaluation (does this model fit this use case?) from production monitoring (is the deployed model behaving as expected?).

## Pre-deployment evaluation

**Build your own evaluation dataset.** Public benchmarks measure general capability across tasks. Your use case has specific characteristics — domain vocabulary, user intents, expected output format, edge cases — that general benchmarks do not capture. Choose a justified number of test cases from real or realistic examples in your domain. Include common cases, edge cases, and adversarial inputs.

**Define what "good" means before looking at model outputs.** The most common evaluation mistake: examining model outputs first and then deciding evaluation criteria. This is reverse-engineering criteria to justify the answer you liked, not evaluation. Define success criteria first: accuracy threshold, coverage of required response elements, format compliance, hallucination rate, refusal rate for appropriate/inappropriate requests.

**Automated metrics where applicable, human evaluation where not.** For structured tasks (classification, extraction, SQL generation), automated metrics work well — exact match, F1, execution success rate. For open-ended generation (summarization, Q&A, reasoning), automated metrics require validation against the specific quality rubric. Use human evaluation for a sample; use LLM-as-judge for larger scale (a capable model evaluating outputs against a rubric scales better than pure human review).

**Test the full pipeline, not just the model.** If your application uses RAG, the evaluation should test the complete system: retrieval quality (are the right chunks being retrieved?), augmentation (is the retrieved context being used effectively?), and generation (is the output accurate and well-formed?). A model that scores well with ideal context may fail in production if retrieval quality is poor.

**Red team adversarial inputs.** What happens when a user tries to jailbreak the system? Requests the model to ignore its instructions? Provides false context to get a different answer? Testing adversarial inputs before deployment reveals failure modes that benign test cases miss.

## Selecting between models

A practical comparison process:

1. Define 3-5 evaluation scenarios that cover the primary use cases
2. Build test datasets for each scenario (50-100 examples each)
3. Run each candidate with documented prompts; distinguish fixed-prompt comparison from equally budgeted configuration tuning
4. Score outputs against defined criteria (automated where possible, human evaluation otherwise)
5. Measure latency and cost per request for each model
6. Build a cost-quality trade-off matrix: model A is 20% cheaper and 8% less accurate; is that an acceptable trade for this use case?

The cost-quality trade-off is a business decision, not a technical one. Bring the data to the decision-maker rather than making the choice on their behalf.

## Production monitoring

A model that passed pre-deployment evaluation can still degrade. Reasons: the distribution of user inputs shifts, the retrieval quality changes, the model provider updates the underlying model version, or edge cases appear at production volume that were not in the test set.

**Evaluation in production (online evaluation)**: sample production requests using a rate justified by volume, risk and subgroup coverage and evaluate them with an automated rubric or LLM-as-judge. Aggregate scores over a declared window suited to the workload. Alert when the score drops below a threshold.

**User feedback signals**: thumbs up/down, regeneration requests, explicit corrections. These are noisy but free and often the first signal of quality degradation. A sudden increase in regeneration rate on a specific feature warrants investigation.

**Hallucination monitoring**: for RAG systems, track whether model responses are grounded in the retrieved context or making claims not supported by the retrieved documents. Consistency checks (does the response contradict the source material?) can be automated.

**Output quality by segment**: monitor evaluation metrics broken down by use case, user segment, or query type. Aggregate quality may hold while quality for a specific important use case degrades.

## The evaluation debt problem

Teams under delivery pressure skip rigorous pre-deployment evaluation and plan to "monitor it in production." Production monitoring catches degradation from a known baseline but does not establish whether the baseline was good. If you never measured quality at deployment, you cannot tell whether a change in user satisfaction is due to model behavior or other factors.

Build evaluation into the deployment process, not as optional overhead.

*Setting up an LLM evaluation framework or auditing a deployed system's quality? The right metrics depend heavily on the specific use case. [Happy to think through the approach.](/contact)*

## Use paired cases and explicit failure categories

A useful comparison runs both candidates on the same task cases and inspects where their outcomes differ. An aggregate percentage can conceal whether the new configuration solves previously hard cases or merely shifts errors between user groups. Keep case identifiers, rubric version and output artifacts so reviewers can trace each score to evidence.

For grounded answers, distinguish incorrect facts, missing required facts, unsupported claims, wrong citations and inappropriate refusal. For structured extraction, distinguish valid shape from correct values. For tool use, distinguish proposed actions from committed effects. These categories can overlap, so define whether a chart counts cases, claims or events before interpreting totals.

## Worked example: the same average can conceal a tradeoff

Consider a synthetic set of 120 questions: 90 ordinary questions and 30 questions requiring a policy exception. Candidate A answers 81 ordinary and 24 exception questions correctly, totaling 105. Candidate B answers 86 ordinary and 19 exception questions correctly, also totaling 105. Both score 105/120, or 87.5%, overall.

The chart shows the four subgroup counts. Ordinary accuracy rises from 81/90, or 90%, to 86/90, approximately 95.6%. Exception accuracy falls from 24/30, or 80%, to 19/30, approximately 63.3%. Choosing B solely because its answers look smoother would ignore a material regression on the subgroup that may carry the greatest consequence.

These numbers are hypothetical. They demonstrate a scoring problem, not statistical evidence about any model. Review the paired disagreements and repeat on additional held-out cases before generalizing. If exception questions are rare in production, a stratified evaluation is still useful, but its overall average does not estimate production accuracy unless the sampling weights reflect production prevalence.

## Calibrate automated judges

An LLM judge can apply a rubric at scale but can also favor verbose answers, share errors with the evaluated model or respond to irrelevant formatting. Create a human-reviewed calibration subset containing both strong and weak answers. Check agreement by failure category, not only a single correlation across all scores.

Blind candidate identities where possible and vary presentation order when comparing two outputs. Ask for a concise evidence-based assessment tied to the rubric, not an uncheckable confidence number. Treat disagreement between judge and reviewer as information about either the rubric or the judge. Do not automatically declare the human wrong because the model supplies a fluent explanation.

For high-consequence errors, deterministic checks and specialist review may be necessary. An execution-success metric for generated SQL does not prove the query answered the right question or respected access boundaries. A test suite for generated code can miss a requirement absent from the tests. State what each measurement establishes and what remains unmeasured.

## A practical evaluation worksheet

Create a case table with task type, source evidence, expected disposition, critical constraints and subgroup. Keep a development set for prompt iteration and a separate release set that is not repeatedly inspected during tuning. Add new production failures to a regression collection without silently replacing the original holdout.

For each candidate, record model and configuration identifiers, retrieval snapshot, prompt version, latency, cost and outcome by category. Run more than one sample when stochastic variation matters, and avoid treating repeated outputs from the same case as independent user tasks. Report both case-level variability and run-to-run variability where relevant.

Before evaluation, specify release conditions such as no regression on authorization checks, acceptable coverage of exception cases and a latency ceiling. The exact thresholds depend on the product; copying a universal percentage would be arbitrary. A configuration that passes average quality but fails a critical constraint should receive a narrow deployment scope or remain blocked.

## Monitor after release without confusing samples

Random production samples estimate routine behavior more directly than complaint-driven samples. Complaints are valuable for discovering severe and unusual failures but overrepresent dissatisfied users. Keep these streams separate and record inclusion rules. A fixed sampling percentage is not automatically sufficient for rare errors or low-volume segments.

Delayed labels need a maturity window. If a task outcome becomes known after two weeks, do not compare this morning's incomplete labels with last month's fully observed cohort. Track label coverage and corrections, and preserve the prediction as originally issued. Updating the prediction after the outcome is known would corrupt the evaluation record.

Finally, connect an alert to an action. An observed subgroup regression may call for routing those tasks to a reviewed fallback while investigation continues. A provider outage calls for availability handling, not model retraining. The evaluation system is useful when its distinctions lead to specific operational decisions rather than a dashboard of scores nobody knows how to interpret.

## Sources and further study

- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Lewis et al. — Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
