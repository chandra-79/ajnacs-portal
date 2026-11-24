---
title: "Running LLMs Locally: What Six Months of Daily Use Actually Taught Me"
description: "I started running local LLMs as a cost experiment. It became a privacy practice, a performance benchmark, and an education in what language models actually need to function well. Here's the honest version of what I found."
date: 2025-06-05
tags: ["Enterprise AI", "Emerging Technology"]
format: article
---

I started running LLMs locally because I was spending more than I expected on API calls. That's the honest origin — cost, not principle. What I discovered over the following six months changed how I think about AI infrastructure for enterprise environments more broadly.

The short version: local LLMs are genuinely useful for a specific set of tasks, the tooling has matured considerably, and the enterprise case for on-premises model hosting is stronger than most cloud-first conversations acknowledge.

## What to measure

**Prefill, decode and working-set memory.** With the same prompt length, model and quantisation, record time to first token, generated tokens/s and peak resident memory. A 300-token completion at 30 tokens/s spends about 10 seconds decoding after prefill. Report context length and hardware with the result.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The Tooling That Actually Works

**Ollama** is where most people should start. It handles model downloads, quantisation selection, and an OpenAI-compatible API endpoint that means your existing integrations often just work with a URL swap. The developer experience is clean:

```bash
ollama pull llama3.2
ollama run llama3.2
```

The native Ollama API exposes `/api/chat` and `/api/generate`. Tools expecting an OpenAI-style API can use the supported [compatibility endpoints](https://docs.ollama.com/api/openai-compatibility) under `/v1/` and should verify the operations they need.

**LM Studio** is the right choice if you want a GUI and want to experiment with models from Hugging Face without writing anything. It handles quantised model downloads (GGUF format), has a built-in chat interface, and exposes a local API server. For non-technical stakeholders who want to evaluate local models, LM Studio lowers the barrier considerably.

**Jan** is an open-source alternative to LM Studio worth watching. Lighter footprint, active development, and a clean interface. Not as mature as LM Studio but improving quickly.

For production-style deployments where you need inference server semantics — batching, concurrent requests, metrics — **llama.cpp server** or **vLLM** (if you have a GPU) are the serious options. Llama.cpp's server mode serves a subset of the OpenAI API and handles multiple concurrent users reasonably well on CPU-only hardware.

## What Hardware You Actually Need

The honest answer: less than the internet will tell you, but more than you might have.

Apple Silicon shares memory across the CPU and GPU. Model weights compete for that memory with context cache, runtime buffers and other processes. Measure the expected context, prompt processing speed, time to first token and decode speed before sizing a machine.

CPU-only inference can be useful for batch or lower-volume workloads. Benchmark the exact model and quantisation against your response-time target. SIMD instruction support, memory bandwidth, thread count and runtime all affect the result.

GPU acceleration can change throughput and concurrency. Size memory for weights and the KV cache together, and verify the deployed runtime’s support for your hardware and operators.

## The Models Worth Running Locally

Not every model is worth the weight. My practical shortlist as of mid-2026:

**Llama 3.2 text models** are published at 1B and 3B. Llama 3.1 includes an 8B model. Compare the exact weights, context and license for the intended use.

**Mistral 7B and Mistral Nemo** — fast, capable, and surprisingly good at structured output tasks. The Nemo variant has a 128K context window, which changes what you can do with long documents locally.

**Qwen2.5 (7B and 14B)** — strong multilingual capability and notably good coding performance. If your work involves multiple languages, Qwen outperforms the Llama family here.

**Phi-4** — Microsoft's small model series punches well above its parameter count for reasoning tasks. Excellent choice when you need capability on constrained hardware.

**DeepSeek-R1 distillations** — if you need chain-of-thought reasoning locally, the distilled versions of DeepSeek-R1 (7B and 14B) bring reasoning capability to consumer hardware that didn't exist 12 months ago.

## The Enterprise Case That's Being Underweighted

The privacy argument is obvious — data that doesn't leave your network can't be logged, trained on, or breached at the provider level. But there are stronger enterprise arguments that get less attention.

**Air-gapped environments.** Classified or sensitive networks can't reach commercial AI APIs. Local inference is not optional — it's the only path. The same applies to operational technology networks in critical infrastructure.

**Multi-step workflows.** Time the whole run, including prompt processing, generation and system calls. A local runtime avoids the trip to the inference provider, while model speed, capacity and workflow quality still need testing.

**Cost at scale.** Estimate effective cost per accepted result across expected load. Include idle capacity, the host, maintenance and the quality effects of quantisation. A break-even point requires measured utilisation and quality, and depends on the alternative service price.

## What Local LLMs Still Can't Do Well

Honesty requires balance. Local models lag hosted frontier models on:

- Complex multi-step reasoning (though this gap is closing rapidly)
- Reliable tool use and function calling at production quality
- Multimodal tasks — vision models locally are capable but behind GPT-4V and Claude 3
- Context windows beyond 128K without significant memory investment

The right framing is not "local vs. cloud" but "which tasks warrant local and which warrant cloud." Routine, high-volume, latency-sensitive tasks with data sensitivity concerns → local. Novel, complex reasoning tasks where quality is the primary constraint → cloud. Most organizations need both.

*Running local inference in production or evaluating it for an enterprise use case? I'm interested in comparing notes — [get in touch](/contact/).*
