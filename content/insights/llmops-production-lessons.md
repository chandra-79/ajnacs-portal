---
title: "LLMOps in Production: Lessons From Shipping Generative AI at Enterprise Scale"
description: "The gap between an LLM demo and a production LLM system is substantial. Here's what the operationalisation actually requires — and the failure modes nobody documented in advance."
date: 2026-02-23
tags: ["Enterprise AI", "AI & MLOps", "Observability", "Cloud Architecture"]
format: article
---

Every organization I'm working with right now has at least one LLM-integrated feature in production or staging. Most of them shipped faster than they built the operational infrastructure to support. That gap shows up reliably — in cost overruns, in hard-to-reproduce bugs, in outputs that degrade quietly without anyone noticing until a user escalates.

Here's what LLMOps in production actually requires, based on what I've seen work and what hasn't.

## The Observability Gap

Traditional application observability — latency, error rate, throughput — tells you almost nothing useful about an LLM-integrated system. You can have perfect p99 latency and a system that's producing harmful, incorrect, or off-brand outputs at a significant rate.

The observability layer for LLM production systems needs to track:

**Input/output logging**: every prompt, every completion, with model version, token counts, latency, and a unique request ID. This is the foundation for debugging, cost analysis, and safety review. It requires privacy review — you may not be able to log raw user inputs depending on data classification.

**Output quality signals**: automated evaluation of completions against quality rubrics. This can be another LLM acting as a judge, a classifier, or a set of rule-based checks (length, format compliance, prohibited content). The key is continuous monitoring, not periodic sampling.

**Token budget tracking**: per-user, per-feature, and per-session token consumption. LLM costs scale with usage in ways that can be surprising — a feature that seems cheap in testing can become your largest cloud cost item in production if prompt design is inefficient or users interact with it longer than expected.

**Model version tracking**: when you upgrade a model (or a model provider updates their base model), you need to know which model version produced which outputs. This matters for debugging regressions and for compliance documentation.

## Prompt Engineering Is Engineering

The most common mistake I see in LLM system design: treating prompt design as a one-time task rather than a software engineering practice.

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
- Latency that scales linearly with context length

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

**Output tokens are more expensive than input tokens** on most providers. Features that generate long outputs (summaries, reports, emails) have higher per-request costs than features that generate short outputs (classifications, entity extractions).

**Latency and cost are correlated**: longer context and longer outputs take more time and cost more. Optimising for cost usually improves latency, and vice versa.

Build a unit economics model for your LLM features before production launch. Cost per request × expected request volume should be a number your engineering and product leads have seen and agreed to.

---

*Building LLM-integrated features for enterprise production? [Happy to compare notes on what's worked.](/contact)*
