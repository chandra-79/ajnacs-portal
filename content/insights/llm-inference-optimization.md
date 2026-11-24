---
title: "LLM Inference Optimization: The Levers Behind Latency, Throughput, and the Bill"
description: "Serving large language models is a systems problem wearing an AI costume — KV caches, continuous batching, quantization, speculative decoding, and routing. What each lever buys, what it costs in quality, and how to think about the serving stack."
date: 2027-02-12
tags: ["AI Adoption", "LLM", "Performance", "Cloud Architecture", "AI & MLOps"]
format: article
---

Once an organization moves past the API-only phase of LLM adoption — whether for cost, latency, data governance, or fine-tuned models — it inherits a serving problem with unusual physics: a workload whose bottleneck depends on batch size, model architecture and request lengths, whose per-request state grows with conversation length, and whose cost per token can vary by an order of magnitude based on decisions that have nothing to do with the model's weights. Inference optimization is where AI infrastructure budgets are won or lost, and the levers are more knowable than the vendor fog suggests.

## The shape of the workload: two phases, different physics

For the autoregressive Transformer serving model considered here, prompt processing and token generation have different performance characteristics. **Prefill** processes prompt tokens with substantial parallelism and is often compute-intensive, although actual utilization depends on workload and implementation. **Decode** then produces output one token at a time, each step using model weights and accumulated attention state, with access patterns depending on the architecture — this phase can be memory-bandwidth-bound at small batch sizes, while larger batches and different architectures change the bottleneck. The accumulated attention state is the **KV cache**, and it is the hidden protagonist of inference economics: for a conventional full-attention cache at fixed architecture and precision, its storage grows approximately linearly with retained tokens per request; sliding-window and other cache designs change this relationship — long contexts don't just cost prompt-processing time, they *occupy the memory that determines how many requests can run concurrently*.

Two user-facing metrics fall out: **time-to-first-token** (including queueing and prefill — what makes chat feel responsive) and **inter-token latency/tokens-per-second** (decode speed — what makes streaming feel fluid). Optimizations trade differently against each, so knowing which one your product actually needs is the first decision.

## The serving-layer levers (biggest first)

**Continuous batching** is the foundational one, and it's why purpose-built servers (vLLM, TensorRT-LLM, TGI, SGLang) exist: because dense-model decoding can amortize weight access across a batch, batching can amortize weight reads, although cache traffic, compute and latency still grow. Naive batching waits for the batch to fill and finish together; continuous batching admits and retires requests *per decoding step*, keeping the GPU saturated with whatever's in flight. Measure the benefit against the actual concurrency and length distribution.

**PagedAttention and KV-cache management** — vLLM's signature contribution — treats KV memory like an OS treats RAM: paged, non-contiguous, shared where possible (identical prompt prefixes across requests share pages). The practical yields: far less memory fragmentation (so bigger effective batches) and **prefix caching**, which is the sleeper win for enterprise workloads — an identical eligible prompt prefix can reuse cached state while its entry remains available, reducing repeated prefill work; eviction, routing, configuration and changed prefixes can remove the hit. Stable shared prefixes can improve cache reuse in compatible systems. Measure memory cost, hit behavior, tenant isolation and end-to-end latency; this does not remove decode work or make reuse free.

**Quantization** shrinks weights (and increasingly KV caches) to lower precision — options include 8-bit formats and more aggressive 4-bit weight formats that reduce weight storage and may accelerate bandwidth-bound decoding, with real-but-often-acceptable quality cost that *must be evaluated on your tasks, not on leaderboard perplexity* — quality effects are task-specific, so structured extraction, reasoning and summarization should each be evaluated. The strategic payoff is usually not "same model, cheaper" but "bigger model per GPU": compare candidate model and precision combinations on the intended task.

**Speculative decoding** attacks decode latency directly: a small draft model (or self-drafting head, Medusa/EAGLE-style) proposes several tokens; the big model verifies them in one parallel pass — accepted tokens arrive at draft speed with distribution preservation for exact algorithms under their assumptions; speedup depends on acceptance rate and overhead. It costs GPU memory for the draft and engineering for the pairing, which is why it's the second-wave optimization after batching and quantization are in place.

## The fleet-level levers

Above a single server, the levers change name. **Model routing**: not every request deserves the flagship — classifiers or heuristics steering traffic between a small/fast and large/smart tier can reduce cost when their routing errors and fallback overhead remain acceptable. **Disaggregated prefill/decode** — separating the compute-bound and bandwidth-bound phases onto different hardware pools, available in some serving architectures — smooths latency under mixed workloads (long-prompt requests stop stalling everyone's decode). **Autoscaling with honest cold-start math**: measure model readiness time and decide whether the product can tolerate cold starts. **And caching above the model entirely**: exact-match and semantic response caches, plus "did this need a model at all?" review — the cheapest token is the one never generated.

For self-hosting decisions, the capacity arithmetic worth internalizing: a 70B-class model at 8-bit wants ~70+ GB for weights alone before KV — the batch size (thus the economics) lives in whatever memory remains, which is why quantization and cache paging translate directly into cost-per-token, and why long-context features must be priced as *memory products*, not marketing checkboxes.

## The operating discipline

Three habits separate teams that optimize from teams that thrash. **Measure the product metric, not the benchmark**: tokens/sec on synthetic 128-token prompts may poorly predict your 6k-prompt, streaming, bursty reality — load-test with production-shaped traffic (prompt/output length distributions matter more than QPS). **Hold a quality-evaluation gate**: every serving change — quantization tier, speculative pairing, even server version bumps — runs the task-specific eval suite before rollout, because inference optimizations fail *silently*, as slightly worse answers rather than errors. **And publish cost-per-request by route**: the number that turns optimization from an infrastructure hobby into a product conversation — once product managers can see that each route has an explicit cost and measured quality result, the roadmap has a way of optimizing itself.

The meta-point for architecture leaders: inference is a systems discipline — batching, caching, memory management, routing — where the AI-specific parts are narrower than they look. The teams that serve models well are the ones that recognized the shape early: it's the same performance engineering craft the industry already knows, pointed at a workload whose constraint can shift between computation, memory and scheduling, and whose measurements must represent the deployment rather than a favorable demonstration.

## Put the service objective ahead of the benchmark

Define the response the user needs. Interactive chat might care about first-token delay and pauses during streaming. A batch extraction pipeline may care about completion before a deadline and cost per accepted document. A coding workflow may require a complete, validated patch before any output is useful. Optimizing tokens per second can improve one of these experiences and worsen another.

Time to first token includes admission, queueing, preprocessing, prefill and delivery overhead; it is not simply kernel prefill time. Likewise, end-to-end latency includes the full output length. Publish both request latency and output-length distributions. If a configuration generates longer answers, its higher total token throughput can conceal slower completion and extra review work.

Capacity tests should use an offered arrival schedule independent of server completion. A client that waits for each response before sending the next request reduces its own load when the server slows, concealing overload. Record arrival, admission, first token and completion timestamps. Count rejected and timed-out requests rather than removing them from latency calculations without explanation.

## Worked example: memory available to the KV cache

Consider an intentionally simplified model with 32 transformer layers, eight key/value heads per layer, head dimension 128 and two bytes per cached value. Both keys and values are stored, so the approximate cache footprint per token per request is 2 × 32 × 8 × 128 × 2 = 131,072 bytes, or 128 KiB. This formula assumes a conventional attention cache and excludes allocator overhead and implementation-specific metadata.

At 2,048 cached tokens, one request needs 256 MiB. At 4,096 tokens it needs 512 MiB, and at 8,192 tokens it needs 1,024 MiB. The chart shows those three memory estimates. These are synthetic architecture inputs, not specifications for a named model. Models with different attention layouts, cache precision or sliding-window behavior require different calculations.

Suppose a device has 16 GiB left after weights, runtime workspaces and other reservations. Dividing that space by the three cache estimates gives theoretical maxima of 64, 32 and 16 simultaneous requests respectively. Those are upper bounds from memory alone. Output growth, scheduling, fragmentation and compute capacity can reduce feasible concurrency. Keeping no margin risks admitting requests that cannot finish when their caches grow.

Quantizing weights can free memory, but weight precision and cache precision are independent choices. A four-bit weight format does not imply a four-bit cache. Conversion scales, metadata and unsupported operations also make actual memory larger than parameter-count arithmetic suggests. Use estimated memory to design the test and measured peak memory to validate it.

## Evaluate each optimization against its mechanism

Continuous batching can improve device occupancy by admitting new work as other sequences finish. Its benefit depends on request lengths, concurrency and the scheduler. Larger batches can raise throughput while worsening per-request latency. Find the highest offered load that meets the acceptance criteria rather than choosing the batch size that makes a throughput graph largest.

Prefix caching helps when requests share a reusable prefix and the cache remains resident. A constantly changing timestamp or user-specific value near the start can defeat reuse. Cache hit rate needs a documented denominator: eligible requests, reused tokens or all requests are different measures. Shared caches must preserve isolation between tenants and should not reveal private content through unsafe keying or output reuse.

Speculative decoding depends on how cheaply the draft is produced and how often the target accepts it. Exact sampling algorithms can preserve the target distribution under their stated conditions, but approximate variants and implementation choices need separate evaluation. Test the exact deployed configuration. A fast draft that rarely agrees with the target can add work instead of removing it.

Routing needs an error budget of its own. A small model that handles ordinary requests well may fail on a rare exception that the router cannot recognize. Evaluate the combined router-plus-model system, including fallback behavior and additional latency. Compare cost per accepted outcome rather than assuming that every call to a smaller model is a saving once retries and escalation are included.

## A practical serving experiment

Prepare synthetic requests in three input-length buckets and two output-length buckets. Include some repeated prefixes and some unique prefixes. Keep the mix fixed across configurations and record tokenizer, model revision, server version, hardware, precision, sampling parameters and cache settings. Publish the workload generator or a description sufficient to reproduce its distributions without exposing production prompts.

Warm up the service separately from the measured interval, then run both steady traffic and a controlled burst. Repeat the run enough to observe variability. Report offered requests per second, completed requests per second, errors, first-token percentiles, end-to-end percentiles and peak device memory. A single average does not describe the tail, and a tail percentile computed from a tiny sample deserves explicit caution.

Run the task-quality evaluation alongside performance testing. For extraction, verify record correctness; for code, run relevant tests and review changed behavior; for grounded answers, assess evidence support. Quantization can preserve average quality while damaging a small task subgroup. Keep subgroup results visible and reject configurations that violate critical acceptance criteria even if their overall score improves.

The decision worksheet should state one change, its expected mechanism, the measured effect, quality failures and rollback steps. For example, "enable prefix reuse for a stable public instruction block" is testable. "Make inference faster" is not. Repeating an experiment after every unrelated change is expensive, but rerunning it when model, scheduler, precision or workload shape changes is necessary to preserve the conclusion.

## Operational limits after rollout

Scale-up timing should come from measured readiness: provisioning, image pull, weight load, runtime initialization and a successful warmup request. Some small models start quickly; large distributed models may take much longer. Scale-to-zero can be appropriate for a product that tolerates this delay, regardless of whether it is labelled development or production.

During overload, bound queue length and tell callers whether retrying is appropriate. Unlimited queueing trades visible rejection for latency that violates the product contract. Separate a request cancelled by its caller from one still consuming compute after disconnection, and propagate cancellation where supported. Otherwise abandoned requests can occupy the capacity needed by active users.

Finally, report the unit that connects serving to value: accepted extraction, completed assisted task or qualified response within the objective. Keep raw token and GPU metrics for diagnosis, but make the business denominator explicit. That prevents a technically impressive optimization from being mistaken for a useful product improvement.

## Sources and further study

- [vLLM — Paged attention design](https://docs.vllm.ai/en/latest/design/paged_attention/)
- [Leviathan et al. — Fast inference via speculative decoding](https://arxiv.org/abs/2211.17192)
- [NVIDIA — DCGM feature and profiling overview](https://docs.nvidia.com/datacenter/dcgm/latest/user-guide/feature-overview.html)

- [vLLM: automatic prefix caching and its limits](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/)
