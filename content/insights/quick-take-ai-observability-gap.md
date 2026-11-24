---
title: "LLM Observability: What to Instrument in Your AI Pipeline"
description: "Design traces, quality samples, and actionable alerts without collecting more sensitive content than the investigation requires."
date: 2028-04-19
tags: ["Enterprise AI", "Observability"]
format: article
---

LLM observability should help an authorized operator answer a specific question about a specific outcome. Did the request fail because a source was missing, a permission was wrong, the model timed out, or the answer misused valid evidence? A dashboard that reports only request latency cannot answer all of those questions. A log containing every private prompt creates a different problem.

Begin with an evidence design: which identifiers, versions, timings, and sampled outcomes are necessary to diagnose the service? Define access and retention before collecting sensitive content. Raw input and output logging is a choice requiring justification, not a universal prerequisite for production AI.

## Trace the request across component boundaries

Use a request identifier to connect authorization, retrieval, generation, tool use, validation, and response delivery. Record model and prompt versions, source revisions, and the route selected. If the answer came from a cache, record the cache decision and freshness information. These fields explain behavior that a model name alone cannot explain.

Separate retrieval latency from generation latency and time spent waiting for admission. Streaming introduces additional measures: time to first useful token and time to a complete validated answer. A rapid first token can coexist with a slow or unusable completion. Choose the user-facing service objective deliberately.

## Give quality signals their own definitions

A thumbs-up is user feedback, not a verified factuality label. A user may approve a fluent but incorrect answer or reject a correct answer that is inconvenient. Implicit signals, such as copying text, also need interpretation. Use them to select questions for investigation and to understand the workflow, while maintaining a separate evaluation process for factual support and task completion.

A model-based judge can help scale review after calibration against human judgments. Record its version and rubric. Do not let the judge's score silently become the definition of truth. Include examples where the judge disagrees with a subject-matter reviewer and inspect whether the rubric or the judge needs correction.

## Work through the sampling arithmetic

A fictional service produces 20,000 eligible answers in a week. A random review sample contains 400 answers, of which 24 fail the support rubric: 6%. A separate sample of 80 complaints contains 36 failures: 45%. The chart shows those two rates. They describe different selection processes and should not be pooled as a representative 60/480 traffic estimate.

The random sample still has uncertainty. Important low-volume task types may be barely represented, so use a documented stratified sample when needed and apply appropriate weighting for an overall estimate. Keep the raw counts beside percentages. A change from two failures to four in a tiny slice deserves investigation but may not support a precise trend claim.

## Keep operational alerts actionable

Use fast operational signals for immediate service failures: authorization errors, unavailable dependencies, timeouts, rejected requests, and a growing queue. Quality labels often arrive later and require a different response. A weekly quality review should not be disguised as a real-time alert if the underlying evidence is not available in real time.

Attach an owner and a response to each alert. For example, an index update associated with missing citations may be paused while the previous snapshot remains available. A token-budget breach may trigger a bounded fallback. A permission failure should not be repaired by giving the service broader access simply to restore the success rate.

## Test whether the trace supports an investigation

Create a small synthetic incident set. One request uses an obsolete source, one retrieves a document the user cannot access, one times out before generation, and one returns a valid-looking but incorrect calculation. Give the traces to another engineer and ask them to distinguish the cases. Missing identifiers or ambiguous timings become concrete instrumentation work.

Also test retention and access. Confirm that people investigating operational errors do not automatically gain access to all source content. Prefer references, hashes, redacted fields, and tightly controlled sampled payloads where they meet the diagnostic requirement. The appropriate design depends on the task and data sensitivity.

The worksheet lists the question an operator needs to answer, the required telemetry, collection rule, retention, access role, and response owner. OpenTelemetry's generative-AI conventions can help standardize naming, but pin the version and inspect changes before updating instrumentation. The system becomes easier to operate when a trace explains what happened and a quality sample explains how its conclusions were selected.

Keep sampling decisions visible in incident reports. If a trace was retained because it exceeded a latency threshold, it cannot be treated as a random example of normal traffic. Record the selection rule alongside the trace so that an investigator can distinguish a useful diagnostic sample from a representative quality estimate.

## Sources and further study

- [OpenTelemetry — Generative AI semantic conventions](https://github.com/open-telemetry/semantic-conventions-genai)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
