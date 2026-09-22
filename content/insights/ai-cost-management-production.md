---
title: "AI Cost Management in Production: Controlling Token Spend Without Degrading Quality"
description: "LLM API costs scale with usage in ways that surprise teams used to fixed infrastructure pricing. Here's how to build cost visibility, set sensible ceilings, and optimize prompt design without breaking the features that depend on it."
date: 2025-12-16
tags: ["AI & MLOps", "FinOps", "Enterprise AI"]
format: article
---

The first month an LLM-powered feature goes to production is usually fine. The second month, after you've seen the invoice, is when cost management conversations start. The problem is that by then the patterns are already set — prompt sizes, model selection, caching decisions — and changing them means regression-testing features that users are now depending on.

Getting cost management right before production is much cheaper than retrofitting it after.

## Why LLM costs are different from infrastructure costs

Infrastructure costs are predictable within a narrow range. An EC2 instance costs X per hour; scaling out doubles the cost. The relationship is linear and auditable.

LLM costs are proportional to token consumption, which is a function of prompt size, response size, model selection, and request volume — all of which can change independently. A feature that works fine at 100 requests per day has completely different cost characteristics at 100,000 requests per day, and the prompt design choices made at low volume may be expensive at scale.

The variables that matter:

**Input tokens**: the system prompt, conversation history, retrieved context (for RAG), and the user's message. System prompts are often large and repeated on every request — a 2,000-token system prompt sent 1 million times per month is 2 billion input tokens.

**Output tokens**: model response length. Output tokens are typically 2-4x more expensive per token than input tokens (GPT-4o pricing: $5/M input, $15/M output as of mid-2026). Long responses driven by instruction ("always explain your reasoning in detail") are expensive.

**Model selection**: GPT-4o costs roughly 10-15x more than GPT-4o-mini for the same token count. Most tasks don't require the flagship model.

**Caching**: prompt caching (available on Anthropic and OpenAI APIs) can reduce input token costs by 80-90% for repeated system prompts. Not using it for high-volume endpoints is leaving significant savings on the table.

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
    usage = response.usage
    return LLMCallMetrics(
        feature=feature,
        model=response.model,
        input_tokens=usage.prompt_tokens,
        output_tokens=usage.completion_tokens,
        latency_ms=(time.time() - start_time) * 1000,
        cached=getattr(usage, 'cached_tokens', 0) > 0,
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

The escalation pattern is also useful: attempt with the cheaper model, check output confidence or quality signals, retry with the more capable model if needed. For most workloads, 70-80% of requests succeed on the first attempt with the cheaper model.

## Caching strategies

**Prompt caching**: both OpenAI and Anthropic support caching the prefix of a prompt. If your system prompt is identical across requests (it should be), the first request pays full price and subsequent requests within the cache TTL pay a reduced rate. The requirement: the cached prefix must be at least 1,024 tokens (Anthropic) or 128 tokens (OpenAI). Structure your prompts so the static system prompt comes first.

**Semantic caching**: for queries that are semantically similar but not identical, cache the response and return it for queries within a similarity threshold. GPTCache and Zep are common implementations. Effective for FAQ-style features where many users ask essentially the same question with different wording. Requires careful threshold tuning — too aggressive and you return incorrect responses for queries that seem similar but aren't.

**Response caching**: for deterministic or near-deterministic prompts (exact same input always produces the same output), standard cache with TTL. Works well for content generation features where input is structured and outputs are expected to be stable.

## Setting and enforcing cost ceilings

Monthly surprises are preventable. The mechanisms:

**Per-feature budgets**: set token budget limits in the application layer, not just at the API account level. A feature that exceeds its daily token budget degrades gracefully (cached responses, simplified fallback) rather than continuing to accumulate cost.

**User-level rate limiting**: for user-facing features, rate limit both requests per minute and tokens per day per user. This prevents both abuse and unexpectedly expensive usage patterns.

**Account-level hard limits**: both OpenAI and Anthropic support hard monthly spend limits that stop all API calls when reached. This is a last-resort protection — you don't want to hit it in production. Set it at 150% of expected monthly spend and treat any month where it's approached as a signal that costs are out of control.

**Anomaly alerts**: alert when any feature's daily token spend is more than 2x its 7-day average. Cost spikes are usually symptoms of bugs (infinite loops, runaway retries, prompt injection), not organic growth.

*Building LLM-powered features and working through the cost architecture? The decisions made before launch are much cheaper to change than the ones discovered post-invoice. [Happy to compare approaches.](/contact)*
