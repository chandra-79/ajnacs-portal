---
title: "LLM Observability: What to Instrument in Your AI Pipeline"
description: "A guide to the instrumentation that separates an AI demo from a production system — and the tools that make it achievable without a large investment."
date: 2026-05-15
tags: ["Enterprise AI", "Observability"]
format: article
---

When you deploy a traditional web service, you instrument latency, error rates, and throughput. You set up dashboards. You configure alerts. You can answer, at any moment, whether the service is working and how well.

Most deployed AI systems cannot answer those questions for the AI layer specifically. Latency: covered. Errors: covered. Whether the model is producing high-quality outputs and whether quality has changed since last week: not covered.

This is the LLM observability gap.

## What needs to be instrumented

**Input and output logging with sampling.** Every LLM call should be logged — the prompt, the completion, the latency, the token count, and a session or user identifier. In high-volume systems, log a random 5–10% sample rather than everything. Without this, quality investigations are impossible; you cannot debug what you cannot observe.

**Quality scoring.** For every logged completion, attach a quality signal. This can be explicit (user thumbs up/down), implicit (user followed the suggestion vs. ignored it), or model-based (use a fast evaluator model to score outputs against a rubric). Imperfect signals are vastly more useful than no signal.

**Latency distributions, not just averages.** LLM latency has heavy tails. p99 and p99.9 latency are what users with the slow experience see. An average latency of 800ms can coexist with a p99 of 12 seconds. Report the tails.

**Retrieval quality for RAG systems.** If you are using retrieval-augmented generation, instrument the retrieval separately from the generation. Low-quality retrieval produces low-quality generation, and they fail differently. Track recall at k, relevance scores, and cases where no relevant documents were retrieved.

**Cost per query.** Token costs add up. Instrument input and output tokens per request and multiply by model pricing. A query that is 10x more expensive than average is usually a prompt structure problem, not a model problem.

## Tools that make this tractable

The LLM observability tooling ecosystem has matured considerably:

- **Langfuse** — open source, self-hostable, good SDK coverage, excellent for RAG tracing
- **Arize Phoenix** — strong on evaluation and dataset management
- **Helicone** — lightweight proxy-based approach, low integration effort
- **Weave (W&B)** — good if you are already using Weights & Biases for ML experiments

The integration effort for any of these is measured in hours, not weeks. The cost of not instrumenting is discovering your model degraded two months ago and having no data to explain when or why.

A demo shows the model working. Observability tells you if it is still working tomorrow.
