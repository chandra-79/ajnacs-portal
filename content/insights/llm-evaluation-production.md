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

**Build your own evaluation dataset.** Public benchmarks measure general capability across tasks. Your use case has specific characteristics — domain vocabulary, user intents, expected output format, edge cases — that general benchmarks do not capture. Build 200-500 test cases from real or realistic examples in your domain. Include common cases, edge cases, and adversarial inputs.

**Define what "good" means before looking at model outputs.** The most common evaluation mistake: examining model outputs first and then deciding evaluation criteria. This is reverse-engineering criteria to justify the answer you liked, not evaluation. Define success criteria first: accuracy threshold, coverage of required response elements, format compliance, hallucination rate, refusal rate for appropriate/inappropriate requests.

**Automated metrics where applicable, human evaluation where not.** For structured tasks (classification, extraction, SQL generation), automated metrics work well — exact match, F1, execution success rate. For open-ended generation (summarization, Q&A, reasoning), automated metrics correlate poorly with actual quality. Use human evaluation for a sample; use LLM-as-judge for larger scale (a capable model evaluating outputs against a rubric scales better than pure human review).

**Test the full pipeline, not just the model.** If your application uses RAG, the evaluation should test the complete system: retrieval quality (are the right chunks being retrieved?), augmentation (is the retrieved context being used effectively?), and generation (is the output accurate and well-formed?). A model that scores well with ideal context may fail in production if retrieval quality is poor.

**Red team adversarial inputs.** What happens when a user tries to jailbreak the system? Requests the model to ignore its instructions? Provides false context to get a different answer? Testing adversarial inputs before deployment reveals failure modes that benign test cases miss.

## Selecting between models

A practical comparison process:

1. Define 3-5 evaluation scenarios that cover the primary use cases
2. Build test datasets for each scenario (50-100 examples each)
3. Run each candidate model against the test data with identical prompts
4. Score outputs against defined criteria (automated where possible, human evaluation otherwise)
5. Measure latency and cost per request for each model
6. Build a cost-quality trade-off matrix: model A is 20% cheaper and 8% less accurate; is that an acceptable trade for this use case?

The cost-quality trade-off is a business decision, not a technical one. Bring the data to the decision-maker rather than making the choice on their behalf.

## Production monitoring

A model that passed pre-deployment evaluation can still degrade. Reasons: the distribution of user inputs shifts, the retrieval quality changes, the model provider updates the underlying model version, or edge cases appear at production volume that were not in the test set.

**Evaluation in production (online evaluation)**: sample a percentage of production requests (1-5%) and evaluate them with an automated rubric or LLM-as-judge. Aggregate scores over a rolling 7-day window. Alert when the score drops below a threshold.

**User feedback signals**: thumbs up/down, regeneration requests, explicit corrections. These are noisy but free and often the first signal of quality degradation. A sudden increase in regeneration rate on a specific feature warrants investigation.

**Hallucination monitoring**: for RAG systems, track whether model responses are grounded in the retrieved context or making claims not supported by the retrieved documents. Consistency checks (does the response contradict the source material?) can be automated.

**Output quality by segment**: monitor evaluation metrics broken down by use case, user segment, or query type. Aggregate quality may hold while quality for a specific important use case degrades.

## The evaluation debt problem

Teams under delivery pressure skip rigorous pre-deployment evaluation and plan to "monitor it in production." Production monitoring catches degradation from a known baseline but does not establish whether the baseline was good. If you never measured quality at deployment, you cannot tell whether a change in user satisfaction is due to model behavior or other factors.

Build evaluation into the deployment process, not as optional overhead.

*Setting up an LLM evaluation framework or auditing a deployed system's quality? The right metrics depend heavily on the specific use case. [Happy to think through the approach.](/contact)*
