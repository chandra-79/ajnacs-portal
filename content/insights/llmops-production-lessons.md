---
title: "LLMOps in Production: Operating Generative AI at Enterprise Scale"
description: "Operate LLM applications with versioned prompts, bounded costs, privacy-aware telemetry, task evaluations and tested responses to failure."
date: 2027-08-27
tags: ["Enterprise AI", "AI & MLOps", "Observability", "Cloud Architecture"]
format: article
---

An LLM feature can reach staging before its team has defined quality monitoring, versioning, cost controls and recovery. Those gaps create hard-to-reproduce failures and make changes difficult to assess.

The following operating practices make those responsibilities explicit.

## The Observability Gap

Traditional application observability — latency, error rate, throughput — is necessary but insufficient about an LLM-integrated system. You can have perfect p99 latency and a system that's producing harmful, incorrect, or off-brand outputs at a significant rate.

The observability layer for LLM production systems needs to track:

**Input/output logging**: appropriate request and response metadata, with controlled content sampling, with model version, token counts, latency, and a unique request ID. This is the foundation for debugging, cost analysis, and safety review. It requires privacy review — you may not be able to log raw user inputs depending on data classification.

**Output quality signals**: automated evaluation of completions against quality rubrics. This can be another LLM acting as a judge, a classifier, or a set of rule-based checks (length, format compliance, prohibited content). Use continuous operational telemetry and quality sampling appropriate to volume and risk.

**Token budget tracking**: per-user, per-feature, and per-session token consumption. LLM costs scale with usage in ways that can be surprising — a feature that seems cheap in testing can become your largest cloud cost item in production if prompt design is inefficient or users interact with it longer than expected.

**Model version tracking**: when you upgrade a model (or a model provider updates their base model), you need to know which model version produced which outputs. This matters for debugging regressions and for compliance documentation.

## Prompt Engineering Is Engineering

A common mistake in LLM system design: treating prompt design as a one-time task rather than a software engineering practice.

Prompts are code. They should be:
- Stored in version control
- Tested against a representative set of inputs
- Reviewed before deployment
- Versioned alongside model versions
- Monitored for performance drift

Prompt changes that look minor can have significant effects on output quality. "Add a sentence to the system prompt" is a deployment event, not a configuration tweak.

The teams doing this well maintain a prompt evaluation harness: a set of representative inputs with expected output characteristics, run automatically against every prompt change. The signal is relative — "this version produces better outputs on our test set than the previous version" — not absolute, because LLM output is probabilistic.

## Context Window Management

Large context windows (128K+ tokens in current frontier models) create a tempting engineering pattern: stuff everything into the context and let the model figure it out. This pattern produces:
- Unpredictable costs (token count directly determines cost)
- Degraded quality at very long contexts (models' effective attention is not uniform across the full window)
- Latency that depends on context length, batching, caching and implementation

Effective context management for production systems:

**Retrieval-augmented generation with controlled context**: retrieve the most relevant information for the specific query, not everything potentially relevant. The retrieval layer quality directly determines output quality — poor retrieval produces poor responses regardless of model capability.

**Structured context templates**: define exactly what information goes into the context, in what format, and in what order. Structured contexts are more predictable, cheaper to debug, and easier to optimise.

**Context compression**: for multi-turn conversations, previous turn summarisation rather than full history accumulation. The conversation history from turn 1 doesn't need to be in full detail by turn 20.

## Fallback and Degradation Design

LLM APIs fail. They return errors, they time out under load, they occasionally return nonsensical outputs. Production systems need explicit fallback behavior for each failure mode:

- **API timeout**: return a graceful error or cached response rather than hanging
- **Quality check failure**: route to human review or return a conservative fallback response rather than serving a low-quality output
- **Rate limit**: exponential backoff with jitter, with a user-facing "high demand" message rather than a raw error
- **Model unavailability**: failover to an alternative model or provider if the primary is unavailable

The fallback design question is the same one that applies to any external dependency: "what does graceful degradation look like?" Deciding this before the first production incident is significantly cheaper than deciding it during one.

## The Cost Model

LLM operating costs are different from traditional compute costs. A few things that catch teams off guard:

**Prompt tokens are not free**: system prompts with extensive instructions, few-shot examples, and retrieved context add up. A 2,000-token system prompt on every request at high volume costs more than most teams budget for.

**Price input, output and cached tokens separately using the selected provider's current contract.** Output-token prices can differ from input prices, but there is no universal multiplier or permanent provider-wide rule. Features that generate long outputs (summaries, reports, emails) have higher per-request costs than features that generate short outputs (classifications, entity extractions).

**Latency and cost are correlated**: longer context and longer outputs take more time and cost more. Optimising for cost usually improves latency, and vice versa.

Build a unit economics model for your LLM features before production launch. Cost per request × expected request volume should be a number your engineering and product leads have seen and agreed to.

*Building LLM-integrated features for enterprise production? [Discuss the operating requirements.](/contact)*

## Define a deployable configuration

An LLM application release includes more than a model name. Record the prompt template, tool definitions, retrieval configuration, source snapshot or index version, output schema, validation rules and fallback policy. If one of those changes, the behavior may change even when the provider's model identifier remains constant. Treat the compatible set as the unit of release and rollback.

A useful manifest also identifies which values are fixed and which can change at runtime. Current source documents may update independently of application code, while authorization policy should remain authoritative outside the model. Record enough provenance to reconstruct an answer without assuming that every retrieved document will still have the same content next week.

## Worked example: cost per accepted task

Imagine a synthetic batch of 500 requests. Configuration A costs $30 in model and supporting-service charges and yields 400 accepted outcomes. Configuration B costs $24 and yields 300 accepted outcomes. The chart shows the cost per accepted outcome: $30/400 = $0.075 for A and $24/300 = $0.080 for B.

B is 20% cheaper in total spend for the same 500 attempted requests, but its cost per accepted outcome is about 6.7% higher. Its acceptance rate is 60% rather than 80%. The cheaper request path therefore does not automatically produce a cheaper useful service. These invented values exclude human review and engineering costs; include them when they materially affect the decision.

The acceptance rubric must be fixed before comparing configurations. If B uses a weaker rubric or drops difficult requests before counting them, the denominator is not comparable. Keep attempted, completed, accepted and escalated counts. A request that times out or requires manual completion still consumes resources even if it never produces a polished final answer.

## Failure handling is part of the product contract

Different failures require different responses. A temporary provider error may permit a bounded retry. A structurally invalid response may permit one repair attempt. Missing evidence should lead to uncertainty or a narrower question. An authorization denial should not trigger a fallback that uses a more privileged identity. A single catch-all retry loop obscures these distinctions.

Set a total elapsed-time and attempt budget across the whole workflow. Three tools that each retry three times can create much more work than a reader expects from one request. Propagate cancellation when the user abandons the task, and record whether a downstream effect may already have committed. Retrying a generation is different from retrying an external mutation.

Fallback providers need prior evaluation and approved data boundaries. Failover can change output format, refusal behavior, token limits and logging terms. A provider that is suitable for public-text drafting may not be approved for internal records. Test the exact fallback route rather than assuming API compatibility implies equivalent behavior or governance.

## A practical release rehearsal

Build a small fixture containing twenty synthetic tasks: ten ordinary, five missing evidence and five requiring a tool or structured response. Save expected dispositions and critical constraints. Run the release candidate and the previous configuration against the same set, then inspect paired differences. The fixture is a regression exercise, not a substitute for a representative production evaluation.

Inject four failures: provider timeout, malformed response, retrieval outage and tool authorization denial. Confirm that each follows its documented path. Then roll back the release and verify that prompt, schema and retrieval settings return to a compatible configuration. A pointer to old model weights is insufficient if the rest of the application now expects a different contract.

The worksheet should contain request identifier, configuration manifest, evidence version, attempt count, final disposition, cost and committed effects. Have the on-call engineer use it to explain a failed task without assistance from the feature author. That rehearsal tests operational readiness more directly than a dashboard screenshot.

## Quality telemetry without indiscriminate capture

Record low-cardinality metrics for routine monitoring and controlled traces for investigation. Full prompts and completions can contain sensitive data; capture them only under an explicit purpose, access and retention policy. Hashes and source identifiers may help reconstruct a case, but they do not by themselves preserve the content needed for every investigation. Document the tradeoff.

Separate random quality samples from user complaints and incident-triggered traces. Complaint samples are excellent for finding severe defects but cannot estimate ordinary error prevalence without additional assumptions. Automated judges should be calibrated and versioned; changing the judge can alter the dashboard even when application behavior is unchanged.

Watch quality by task type and outcome, not only token volume. A higher abstention rate might reflect safer handling of missing evidence or a broken retrieval index. The operational interpretation depends on the paired evidence. Alerts should lead to a specific investigation path and an owner empowered to narrow or disable the feature.

## Keep the lifecycle manageable

Use a change log that describes user-visible behavior and the evidence behind the release decision. Avoid treating every prompt edit as equally risky, but require appropriate regression checks when it affects claims, tool use or output contracts. Lightweight review is still review when it asks the right question.

Retire stale configurations and revoke unused credentials. Preserve the artifacts needed for legitimate historical investigation while respecting retention requirements. The result is an LLM service that can be operated like other consequential software: its dependencies are known, changes are testable, failures are recoverable and its cost is connected to accepted work.

## Sources and further study

- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [OpenTelemetry — Generative AI semantic conventions](https://github.com/open-telemetry/semantic-conventions-genai)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
