---
title: "AI Cost Management in Production: Controlling Token Spend Without Degrading Quality"
description: "LLM API costs scale with usage in ways that surprise teams used to fixed infrastructure pricing. Here's how to build cost visibility, set sensible ceilings, and optimize prompt design without breaking the features that depend on it."
date: 2025-12-16
tags: ["AI & MLOps", "FinOps", "Enterprise AI"]
format: article
---

The first month an LLM-powered feature goes to production is usually fine. The second month, after you've seen the invoice, is when cost management conversations start. The problem is that by then the patterns are already set — prompt sizes, model selection, caching decisions — and changing them means regression-testing features that users are now depending on.

Getting cost management right before production is much cheaper than retrofitting it after.

## What to measure

**Cost per successful AI task.** Divide inference, retrieval and retry spend by tasks that pass the acceptance check. At $720 for 12,000 attempts with 9,000 accepted outputs, the cost is $0.08 per accepted task. Report the acceptance rate (75%) alongside the cost so a cheaper model cannot win by failing more tasks.

*Illustrative measurement. Any numbers in this example are hypothetical.*

For context, 98% of respondents in the [2026 State of FinOps report](https://data.finops.org/) reported managing or planning to manage AI spend. The survey describes FinOps practitioners; it does not measure savings from prompt or model changes.

## Why LLM costs are different from infrastructure costs

Infrastructure costs are predictable within a narrow range. An EC2 instance costs X per hour; scaling out doubles the cost. The relationship is linear and auditable.

LLM costs are proportional to token consumption, which is a function of prompt size, response size, model selection, and request volume — all of which can change independently. A feature that works fine at 100 requests per day has completely different cost characteristics at 100,000 requests per day, and the prompt design choices made at low volume may be expensive at scale.

The variables that matter:

**Input tokens**: the system prompt, conversation history, retrieved context (for RAG), and the user's message. System prompts are often large and repeated on every request — a 2,000-token system prompt sent 1 million times per month is 2 billion input tokens.

**Output tokens** contribute a separate charge on many APIs. Use your current model and region’s output price and track response length by feature.

**Model selection** changes both price and the rate of acceptable responses. Compare total cost per accepted result at the same evaluation bar.

**Caching** can reduce charges for eligible repeated input. Measure cache-hit rate and include cache write, read and storage charges where applicable.

## Building cost visibility

You cannot manage what you cannot see. Before optimizing, instrument:

```python
import time
from dataclasses import dataclass

@dataclass
class LLMCallMetrics:
    feature: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    cached: bool

def track_llm_call(feature: str, response, start_time: float) -> LLMCallMetrics:
    usage = response.usage  # OpenAI Chat Completions usage schema
    prompt_details = getattr(usage, "prompt_tokens_details", None)
    cached_input_tokens = getattr(prompt_details, "cached_tokens", 0) or 0
    return LLMCallMetrics(
        feature=feature,
        model=response.model,
        input_tokens=usage.prompt_tokens,
        output_tokens=usage.completion_tokens,
        latency_ms=(time.time() - start_time) * 1000,
        cached=cached_input_tokens > 0,
    )
```

Aggregate this by feature, time window, and user segment. The metrics you want:

- Cost per feature per day (which features are expensive?)
- Cost per user per month (is cost growing proportionally with users?)
- Average tokens per request by feature (are prompts bloated?)
- Cache hit rate (is caching configured correctly?)
- Model distribution (are expensive models used where cheaper ones would work?)

## Prompt optimization for cost

Prompt size is not correlated with output quality beyond a point. Several patterns inflate prompts unnecessarily:

**Over-specified system prompts**: instructions that cover every edge case, including ones that never occur. Audit your system prompts — instructions that handle cases that account for less than 1% of traffic can often be moved to a specialized prompt or removed.

**Verbose few-shot examples**: 5-example few-shot prompts where 2 examples produce equivalent results. Test with fewer examples before assuming you need all of them.

**Conversation history without summarization**: passing the full conversation history to every request. For long conversations, summarize earlier turns into a compact representation and include the full text only for the last 2-3 turns.

**Retrieved context without ranking**: RAG implementations that retrieve 10 chunks and pass all 10 regardless of relevance. Reranking and passing only the top 3-4 high-confidence chunks reduces input tokens significantly with minimal quality degradation.

A 30% reduction in average input token count on a feature processing 500,000 requests per month is not a minor optimization.

## Model routing

Not every task requires the most capable model. A classification task with a small label set, a simple extraction from structured text, or a straightforward summarization with clear requirements can often be handled by a smaller model.

```python
def select_model(task_type: str, complexity_score: float) -> str:
    if task_type == "classification" and complexity_score < 0.4:
        return "gpt-4o-mini"
    elif task_type == "extraction" and complexity_score < 0.6:
        return "gpt-4o-mini"
    elif task_type == "generation" and complexity_score > 0.8:
        return "gpt-4o"
    else:
        return "gpt-4o-mini"  # default to cheaper model; escalate if needed
```

The complexity score can be derived from input characteristics: length, presence of specialized terminology, ambiguity signals from a lightweight pre-classifier.

The escalation pattern is also useful: attempt with the cheaper model, check output confidence or quality signals, retry with the more capable model if needed. Measure the actual share of requests that pass without escalation on your workload before projecting savings.

## Caching strategies

**Prompt caching**: providers have different eligibility, minimum prefix length, routing, lifetimes and billing. Keep reusable prefix material stable where appropriate. Check the exact model and connector instructions in the [OpenAI prompt caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) and [Anthropic prompt caching guide](https://platform.claude.com/docs/en/build-with-claude/prompt-caching). Measure cache-read costs and hit rates from usage records.

**Semantic caching**: for queries that are semantically similar but not identical, cache the response and return it for queries within a similarity threshold. GPTCache and Zep are common implementations. Effective for FAQ-style features where many users ask essentially the same question with different wording. Requires careful threshold tuning — too aggressive and you return incorrect responses for queries that seem similar but aren't.

**Response caching**: for deterministic or near-deterministic prompts (exact same input always produces the same output), standard cache with TTL. Works well for content generation features where input is structured and outputs are expected to be stable.

## Setting and enforcing cost ceilings

Monthly surprises are preventable. The mechanisms:

**Per-feature budgets**: set token budget limits in the application layer, not just at the API account level. A feature that exceeds its daily token budget degrades gracefully (cached responses, simplified fallback) rather than continuing to accumulate cost.

**User-level rate limiting**: for user-facing features, rate limit both requests per minute and tokens per day per user. This prevents both abuse and unexpectedly expensive usage patterns.

**Enforced spend limits**: confirm whether your provider’s budget setting alerts or blocks calls. Where you need a hard ceiling, enforce a separate limit in your own gateway and verify what happens at that ceiling.

**Anomaly alerts**: alert when any feature's daily token spend is more than 2x its 7-day average. Cost spikes are usually symptoms of bugs (infinite loops, runaway retries, prompt injection), not organic growth.

*Building LLM-powered features and working through the cost architecture? The decisions made before launch are much cheaper to change than the ones discovered post-invoice. [Happy to compare approaches.](/contact/)*

## Decide which completed task belongs in the cost denominator

For a document assistant, the unit might be a request with a cited answer accepted by a reviewer. For an agent that changes records, it could be a completed transaction with the required approval and verification. Register all admitted tasks with a stable identifier, and record a final state when they reach a fixed observation deadline. Track escalations, abandonment, timeouts and rework. Define what qualifies an output as accepted before collecting treatment data. If the population is mixed, publish a few stable work types separately and keep a combined result for capacity planning. [FinOps Foundation unit economics](https://www.finops.org/framework/capabilities/unit-economics/)

Consider a fictional run of 1,000 requests evaluated within 24 hours. The current route generates 900 accepted answers and the candidate generates 890. Count all model calls, additional retrieval, and foreground tool actions, including unsuccessful requests. In this example they total $52 on the current route and $36 on the candidate. The same cost model includes human review at $0.20 for each completed check. The current route uses 100 reviews and the candidate uses 200. Fully attributed costs are $72 and $76, or $0.080 and approximately $0.085 per accepted answer. The direct provider-related cost drops about 31%, while cost per accepted answer including review rises about 7% before rounding. These figures are a deliberately simplified illustration, with no implication about live prices or quality.

The same candidate also loses ten accepted answers. If your contract requires 90% acceptance of admitted requests, the baseline exactly meets it and the candidate falls short. Decide how to handle pending tasks at the cutoff. Report that category explicitly and leave its partial costs in the run. A budget owner needs to see the result before deciding whether to reduce prompt size, change retrieval, adjust the route, or fund more human review.

## Normalize usage without losing provider meaning

Keep raw usage in a restricted receipt store and write a normalized ledger for routine operations. A useful record includes the task and attempt IDs, provider, model version, API interface, region or deployment where available, and a pricing table version. Track input, output, applicable cache categories, and separately billed tools or storage. Use minor currency units with sufficient precision or exact decimal arithmetic and round only when appropriate for reporting. Preserve the provider request ID to trace corrections or a timeout with an uncertain billing outcome.

Caching fields require provider-aware handling. For OpenAI Chat Completions, cached tokens are a nested detail of prompt token usage. For the Responses API, that detail is nested under input token usage. The cached portion already belongs to the total input count, so subtract it when deriving the uncached token count for pricing. In Anthropic's Messages usage breakdown, cache-read tokens and cache-creation tokens are separate from its ordinary input token count. Include each category exactly once and check current price rules for the affected model and cache mode. [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) · [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

Replay sanitized provider responses in the accounting test suite. Include a cache miss, a partial hit, a new cache write where supported, a stream that disconnects before a final usage event and a successful retry. Report requests with incomplete usage separately. Join provider exports to your task ledger at the most detailed supported grain. Compare modeled and billed charges for a closed window, then document unexplained variance by category. Budget controls need a conservative bound when exact amounts become available only after the provider reports them.

## Test routing alongside quality and workload mix

A replay corpus is most useful when it includes cases with expensive and risky failure modes, even if they are uncommon under ordinary traffic. Compare both routes on the same tasks and apply the same rubric. Freeze the model, prompt and retrieval configuration for each run. Include citations that appear plausible but point at the wrong source, stale records, contradictory context, instructions embedded inside documents, and cases where the appropriate action is to defer. Give judges the expected evidence and hide route identity when practical. Measure serious mistakes separately from average preference ratings. [NIST Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1)

Report the sample size, route selection condition, acceptance rule and cost breakdown. Compare results by task type and document complexity before rolling out a new fallback. If the cheap route escalates more often during a new document release, the escalation rate in your synthetic evaluation may understate the production cost. A narrow live canary with an agreed quality gate helps identify this shift. Switch back to the previous configuration when severe defects cross the decision rule, even if provider charges have fallen.

## Control commitments before concurrent calls start

A monthly alert depends on how fast invoice data arrives. For a per-request limit, use an application ledger that reserves an upper bound before each paid action. Estimate an upper bound from maximum permitted input, output, tool calls and fallback count. Deduct or reserve atomically against the account and service budgets so concurrent tasks cannot each assume the same balance is available. Settle completed work against actual usage and retain a pending entry for ambiguous provider timeout or stream termination until you can reconcile it. A limit that silently releases pending charges can authorize additional spend while an earlier attempt is still active.

Test the fallback as a full path. If a cheaper route can consume $0.04 before escalating to one capped at $0.18, reserve up to $0.22 for the pair if both might run. A remaining balance of $0.20 should trigger a pre-agreed restriction, such as a support queue or a bounded route permitted for that task. Use stable internal IDs across retries and keep an individual attempt ID for each provider call. A user-facing explanation can state the available next step without leaking internal provider details.

## Establish boundaries for caching and cost review

Version the shared prompt prefix and record its cache behavior alongside model version and workload. Keep volatile inputs outside the shared prefix where the selected API supports that layout. Scope any application cache to the authorization boundary for the retrieved documents and include prompt and source revisions in the key. Enforce current access before returning cached material. When permissions change, test that a former reader cannot retrieve a previously cached answer through a shared application path. Provider prompt caching has its own behavior, so review the offered retention and data handling for the chosen configuration. [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) · [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

Review accepted outputs, unresolved tasks, p95 latency, escalation, and cost per accepted task together. Use a review cadence that matches the provider export and the pace of releases. Keep one accountable owner for the backtest and another to approve any change in quality gates. When a new team or feature joins the system, verify its allocation key and run it through the admission and settlement tests. A model price change should update the receipt calculation reproducibly, with earlier reports keeping their original pricing version.

Publish cost findings with the observation period, usage categories, prices used, task rubric, and any missing export dimensions. Track how many responses were judged by a person, an automated check, or both. Readers should be able to tell which part of a reported gain comes from a lower price and which part depends on a change to the work being done.
