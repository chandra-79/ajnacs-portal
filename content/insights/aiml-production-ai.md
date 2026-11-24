---
title: "Putting AI in Production: What Enterprise AI Deployment Actually Requires"
description: "Model serving, latency, cost, monitoring, governance, and the operational discipline that separates a proof of concept from an AI system that runs reliably at enterprise scale."
date: 2026-08-11
tags: ["AI & MLOps", "Enterprise AI", "Fundamentals"]
series: "AI, ML, LLMs, and Neural Networks: A Practitioner's Introduction"
seriesOrder: 5
format: article
---

Moving an AI model from a Jupyter notebook to production is not primarily a technical challenge — it is an operational and organisational challenge. The model that produces impressive demos requires latency budgets, cost management, monitoring, access controls, and reliability engineering before it is a production system. This lesson covers what that operational work actually involves.

## What to measure

**Quality at production latency.** Count responses that pass your evaluation rubric and meet the latency objective. If 920 of 1,000 traffic-representative requests do both, the joint pass rate is 92%. Keep quality failures, timeouts and failed fallbacks visible as separate counts.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Model Serving: The Inference Infrastructure

Inference (using the model to make predictions) in production is different from inference in development:

- **Latency requirements**: a user-facing application may require < 500ms end-to-end. A batch analytics job may tolerate hours.
- **Throughput requirements**: a popular application serves hundreds of requests per second simultaneously.
- **Cost at scale**: At an illustrative $0.01 per 1,000 input tokens, 10 million daily requests of 2,000 input tokens cost $200,000 a day and $6 million over 30 days before output or other charges.

**Self-hosted models**: for cost-sensitive or privacy-sensitive workloads, running open-weight models (Llama, Mistral, Qwen) on your own GPU infrastructure can reduce per-result costs at sufficient utilisation and acceptable quality, while adding infrastructure and operational work. Typical serving stack: vLLM or TGI (Text Generation Inference) running on NVIDIA A100s or H100s.

**API-based models**: OpenAI, Anthropic, Google — managed inference with no infrastructure overhead but higher per-token cost and data residency considerations.

**Hybrid**: use API-based models for low-volume, high-quality use cases; self-hosted models for high-volume, cost-sensitive workloads.

## Latency Optimisation

```python
## Key levers for LLM latency:

## 1. Reduce prompt size
## Every token in = latency + cost
## Compress system prompts; don't include unnecessary context

## 2. Streaming responses
## Stream tokens as they are generated rather than waiting for completion
import anthropic

client = anthropic.Anthropic()
with client.messages.stream(
    model="claude-opus-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": user_message}],
) as stream:
    for text in stream.text_stream:
        yield text   # send to user immediately

## 3. Caching
## Cache embeddings and responses for repeated queries
## Semantic caching: cache responses for semantically similar queries
## (GPTCache, Momento, Redis with embedding-based lookup)

## 4. Parallel retrieval
## Run RAG retrieval in parallel with model warm-up
import asyncio

async def handle_request(query: str):
    retrieval_task = asyncio.create_task(retrieve_documents(query))
    # ... other prep work ...
    documents = await retrieval_task
```

## Cost Management at Scale

LLM costs are token costs. The inputs (prompt + context) and outputs (generated tokens) are both billed.

```python
## Cost estimation before you scale
input_tokens_per_request = 2000   # system prompt + context + user query
output_tokens_per_request = 500   # generated response
requests_per_day = 100_000

## Illustrative rates for the worksheet, independent of any provider price
input_cost_per_1k = 0.005
output_cost_per_1k = 0.015

daily_cost = (
    (input_tokens_per_request / 1000) * input_cost_per_1k +
    (output_tokens_per_request / 1000) * output_cost_per_1k
) * requests_per_day

monthly_cost = daily_cost * 30
print(f"Estimated monthly: ${monthly_cost:,.0f}")
## With these numbers: $52,500 over 30 days
```

**Cost reduction approaches**:
- Prompt compression (remove redundant context)
- Caching for repeated or similar queries
- Model tier selection (use a smaller, cheaper model for simpler tasks; route to expensive model only when needed)
- Self-hosted open-weight models for high-volume workloads
- Output length limits (set `max_tokens` aggressively for tasks where short answers are correct)

## Monitoring in Production

AI systems need a monitoring layer beyond standard application metrics:

**Output quality monitoring**:
- Sample a percentage of production responses for human review or automated evaluation
- Track distribution of response lengths (sudden changes indicate prompt or model changes)
- Monitor user feedback signals (thumbs up/down, regeneration requests, conversation abandonment)

**Provider updates and drift**: evaluate a provider version change as an upstream release. Separately monitor shifts in inputs and, where labels exist, changes in the relationship between inputs and outcomes.

**Hallucination detection**: for RAG systems, monitor whether responses cite documents that exist and whether cited content matches the document. Automated citation verification is achievable.

**Cost and latency dashboards**:
```
Track per-endpoint:
- p50, p95, p99 latency
- Token counts (input, output, total)
- Cost per request
- Error rate
- Cache hit rate
```

## Governance: The Non-Negotiable Foundation

Enterprise AI systems require governance that most PoC projects do not have:

**Data boundary definition**: what data can be sent to which model providers? Internal customer data may be prohibited from external API models under GDPR, HIPAA, or internal policy. Define this before building.

**Access controls**: not all users should have access to all AI capabilities. Role-based access at the AI API layer.

**Audit logging**: every LLM request and response should be logged with user identity, timestamp, and model version. Required for compliance in regulated industries.

**Content filtering**: input and output filtering for harmful content, PII exposure, and prompt injection attacks.

**Human review for high-stakes decisions**: AI systems that affect significant decisions (loan approvals, medical recommendations, legal analysis) require human review in the loop. Define the threshold and the review process before deployment.

**Model change management**: treat model version changes like software deployments. Test against your evaluation framework before promoting a new model version to production.

The AI systems that run reliably at enterprise scale are not the ones with the most capable models. They are the ones with the most complete operational discipline. The model is one component. The infrastructure, monitoring, and governance around it are what make the system production-ready.
