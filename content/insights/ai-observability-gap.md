---
title: "The difference between an AI demo and an AI product is observability"
description: "A demo works. You show it, it impresses, people want to deploy it."
date: 2029-05-02
tags: ["Enterprise AI", "Observability"]
format: note
derived: true
---

An AI service needs evidence about both execution and outcomes. Request counts, availability, and latency describe whether the machinery ran. They do not establish that an answer was supported, a classification was useful, or a tool action respected the user's intent. The observability design should make those questions investigable without turning logs into an uncontrolled copy of sensitive input.

## Trace the decisions that affect the answer

For a retrieval assistant, attach one request identifier to authorization, retrieval, reranking, generation, validation, and response delivery. Record versions of the model, prompt, index, and policy configuration. Store source identifiers and revision hashes where they are sufficient. Raw prompts and outputs need explicit access and retention decisions; collecting everything is not automatically the best diagnostic design.

A support complaint should lead to a reproducible request recipe. If the document was updated after the response, the investigator needs to distinguish the version the user sees now from the version the system retrieved then. If a cache served the answer, its key and freshness policy matter as much as the model version.

## Keep quality samples separate from traffic totals

Suppose a fictional service returns 10,000 answers in a week. Reviewers assess 200 randomly selected eligible answers and find 18 unsupported. That sample rate is 9%. They separately inspect 50 user-reported answers and find 30 unsupported, or 60%. Combining the samples into 48/250 = 19.2% would misrepresent the sampling process. The complaint sample was selected precisely because users suspected problems.

The chart shows the two sample rates with their different selection rules. Neither establishes the exact error rate for all traffic. Retain sample sizes, review criteria, and uncertainty with any production estimate. Report important task slices separately when the overall sample leaves them poorly represented.

## Connect signals to a response

Define who investigates an increase in unsupported answers and what they can change safely. A retrieval incident may call for freezing an index update. A serving incident may require traffic reduction or a fallback route. A missing-label problem may require better feedback capture rather than retraining.

For the exercise, create ten synthetic request traces and deliberately remove a source revision from two. Ask another engineer to identify the cause of a wrong answer using only the recorded evidence. The missing information becomes an instrumentation requirement. Then check whether that field can be stored as an identifier rather than sensitive text.

OpenTelemetry provides conventions for organizing generative-AI telemetry, while production-ML research supplies a broader testing perspective. Pin the convention version used by the implementation because telemetry schemas evolve. The goal is a trace an authorized responder can interpret, a quality sample whose selection is known, and an action that improves the service when those signals change.

## Sources and further study

- [OpenTelemetry — Generative AI semantic conventions](https://github.com/open-telemetry/semantic-conventions-genai)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
