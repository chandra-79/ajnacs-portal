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

**API-based models** move inference infrastructure to a provider. The application still owns service integration, reliability and access controls. Compare observed charges, data residency and service limits for the intended workload.

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

**Audit logging** records enough information to trace a decision to the applicable model, policy and authorised actor. Set requirements for collecting or retaining personal identifiers, prompts and responses with the data owner and compliance team for the specific use case.

**Content filtering**: input and output filtering for harmful content, PII exposure, and prompt injection attacks.

**Human review for high-stakes decisions**: AI systems that affect significant decisions (loan approvals, medical recommendations, legal analysis) require human review in the loop. Define the threshold and the review process before deployment.

**Model change management**: treat model version changes like software deployments. Test against your evaluation framework before promoting a new model version to production.

The AI systems that run reliably at enterprise scale are not the ones with the most capable models. They are the ones with the most complete operational discipline. The model is one component. The infrastructure, monitoring, and governance around it are what make the system production-ready.

## Give the service an end-to-end deadline

Start with the moment a user acts and the moment the useful outcome is available. A streaming interface can show text before a request finishes. Track time to first visible token, time to final validated response, and time to first usable outcome, which may be a complete citation or approval card. Assign separate budgets for authentication, retrieval, queue wait, model execution, and validation. Carry an absolute deadline into every service call and cancel work when it expires where supported. A retry can use the remaining deadline only if there is time to deliver the result and the failure class merits a retry. Where an external provider keeps working after cancellation, include that residual usage in cost and capacity measurements. [Google SRE on deadlines and overload](https://sre.google/sre-book/addressing-cascading-failures/).

Take an illustrative service completing 80 requests per second at a measured mean time in system of 0.75 seconds during a stable interval. Little’s Law gives about 60 requests in flight on average, including queueing inside the measured boundary. If sustained mean time rises to two seconds at the same completed rate, the average is about 160 in flight. This calculation estimates occupancy. Set queue and concurrency limits from load tests with realistic prompt sizes, arrival bursts and third-party throttles. Measure latency over attempted traffic with timeouts identified. Watching only completed requests can make the service appear faster precisely when the slowest requests are being dropped.

For self-hosting, separate prefill and decode throughput because a long input and a long output stress the runtime differently. Experimental replay should include realistic simultaneous streams, the usual input-size distribution and a long-document slice. Record peak decode and prefill resource use, effective throughput at the acceptable tail latency, and time from initially cold capacity to ready. For a managed API, run a comparable test with per-account rate limits and dependencies in place. A capacity plan needs the service level each option can sustain when one replica or region is unavailable and demand stays high.

## Measure cost against accepted work

Use completed outcomes that pass the same quality gate as the denominator. Suppose an illustrative endpoint processes 20,000 requests for $300 of model and serving cost. If 18,000 produce acceptable results inside the objective, the recorded cost per accepted result is about 1.67 cents. At the same volume, an alternative costing $250 with 13,000 accepted results spends about 1.92 cents per result. Include retries, fallback calls, reserved or idle capacity, orchestration, and review effort in the boundary when comparing production alternatives. Use observed charges and outcome labels for a public performance claim.

Report the resource and outcome distribution by route. A short support lookup routed to a dedicated model may have lower cost and response time than a broad diagnostic task even if both land on one endpoint. Compare each route with its own baseline and show how a shift in traffic mix contributed to the aggregate. Measure the share of requests eligible for caching, and scope caches by effective permissions, relevant data version and answer expiry. Invalidate a cached result when its approved source changes. Requests served from cache belong in the same quality audit as fresh requests.

## Decide how the system pauses and recovers

Create service outcomes for complete, deferred, upstream unavailable, and invalid. A user-facing source assistant can return eligible references when generation misses the deadline, while a workflow needing validated fields can stage the record for manual review. Declare which response counts toward the service objective. For a write, persist the intended action and its idempotency key, then reconcile uncertain acknowledgements before making another attempt. Train operators to distinguish a model degradation from a queue backlog or a permission outage. All three can show up as increased deferral.

Review prompt, model and retrieval changes together at release, and version the artifacts required for a coherent rollback. Gather operational measures immediately and report verified quality with its label delay. For example, a two-day human review window means fresh serving metrics can decide an abrupt rollback while quality reports should indicate which cohorts have completed review. Sample high-impact outcomes more heavily and retain their slice denominators. Split changes in what customers ask from changes in service quality within the same task category. An increase in long-document requests may explain a latency shift while leaving a separate cited-answer regression unresolved.

Define per-use-case retention and review controls with the data owner. Log outcome codes, bounded counts, timing, model version and request identifiers where those fields provide enough traceability. Treat full prompts and responses as separately governed records that may contain confidential material. Restrict collection and retention to what the use case requires, with explicit authorization for access and deletion. For governance or legal claims, confirm the applicable obligations for the jurisdiction, data and workflow. Operators need a written path to escalate, restrict a route and restore the previous approved configuration. [NIST Generative AI Profile](https://doi.org/10.6028/NIST.AI.600-1).

Test the loss of a dependency with representative traffic. Lower one upstream quota or pause one inference replica and confirm that queues remain bounded. Then restore capacity and record how long accepted work takes to return to the objective. Report old requests that outlive their deadlines and any retries still arriving during recovery. The result gives on-call staff a reference interval they can compare against an actual incident.
