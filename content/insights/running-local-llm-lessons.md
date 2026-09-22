---
title: "Running LLMs Locally: What Six Months of Daily Use Actually Taught Me"
description: "I started running local LLMs as a cost experiment. It became a privacy practice, a performance benchmark, and an education in what language models actually need to function well. Here's the honest version of what I found."
date: 2025-06-05
tags: ["Enterprise AI", "Emerging Technology"]
format: article
---

I started running LLMs locally because I was spending more than I expected on API calls. That's the honest origin — cost, not principle. What I discovered over the following six months changed how I think about AI infrastructure for enterprise environments more broadly.

The short version: local LLMs are genuinely useful for a specific set of tasks, the tooling has matured considerably, and the enterprise case for on-premises model hosting is stronger than most cloud-first conversations acknowledge.

## The Tooling That Actually Works

**Ollama** is where most people should start. It handles model downloads, quantisation selection, and an OpenAI-compatible API endpoint that means your existing integrations often just work with a URL swap. The developer experience is clean:

```bash
ollama pull llama3.2
ollama run llama3.2
```

You're talking to a model in 60 seconds. The Ollama API exposes `/api/chat` and `/api/generate` endpoints compatible enough with OpenAI's spec that tools like Continue (VS Code extension for AI coding assistance) connect without modification.

**LM Studio** is the right choice if you want a GUI and want to experiment with models from Hugging Face without writing anything. It handles quantised model downloads (GGUF format), has a built-in chat interface, and exposes a local API server. For non-technical stakeholders who want to evaluate local models, LM Studio lowers the barrier considerably.

**Jan** is an open-source alternative to LM Studio worth watching. Lighter footprint, active development, and a clean interface. Not as mature as LM Studio but improving quickly.

For production-style deployments where you need inference server semantics — batching, concurrent requests, metrics — **llama.cpp server** or **vLLM** (if you have a GPU) are the serious options. Llama.cpp's server mode serves a subset of the OpenAI API and handles multiple concurrent users reasonably well on CPU-only hardware.

## What Hardware You Actually Need

The honest answer: less than the internet will tell you, but more than you might have.

Apple Silicon is the standout story here. The unified memory architecture means the M-series chips can use all installed RAM as GPU memory, which allows running larger models than any similarly-priced discrete GPU setup. A MacBook Pro M3 Max with 96 GB RAM can run a 70B parameter model at 4-bit quantisation at usable speeds — 15–25 tokens per second, which is slower than a hosted API but fast enough for interactive use.

On x86 hardware without a GPU, expect 3–8 tokens per second for 7B models and slower still for larger ones. This is workable for batch tasks (summarisation, classification over documents) but frustrating for interactive conversation. If you're serious about x86 CPU inference, 64 GB RAM minimum and a recent-generation processor with AVX-512 support materially improves throughput.

GPU acceleration via CUDA or ROCm brings the experience much closer to hosted API response times. An NVIDIA RTX 4090 with 24 GB VRAM handles 13B parameter models at 4-bit quantisation at 80–100 tokens per second — essentially indistinguishable from a hosted API in terms of latency.

## The Models Worth Running Locally

Not every model is worth the weight. My practical shortlist as of mid-2026:

**Llama 3.2 (3B and 8B)** — excellent performance-to-size ratio, strong instruction following, genuinely useful for coding assistance and document tasks on modest hardware.

**Mistral 7B and Mistral Nemo** — fast, capable, and surprisingly good at structured output tasks. The Nemo variant has a 128K context window, which changes what you can do with long documents locally.

**Qwen2.5 (7B and 14B)** — strong multilingual capability and notably good coding performance. If your work involves multiple languages, Qwen outperforms the Llama family here.

**Phi-4** — Microsoft's small model series punches well above its parameter count for reasoning tasks. Excellent choice when you need capability on constrained hardware.

**DeepSeek-R1 distillations** — if you need chain-of-thought reasoning locally, the distilled versions of DeepSeek-R1 (7B and 14B) bring reasoning capability to consumer hardware that didn't exist 12 months ago.

## The Enterprise Case That's Being Underweighted

The privacy argument is obvious — data that doesn't leave your network can't be logged, trained on, or breached at the provider level. But there are stronger enterprise arguments that get less attention.

**Air-gapped environments.** Classified or sensitive networks can't reach commercial AI APIs. Local inference is not optional — it's the only path. The same applies to operational technology networks in critical infrastructure.

**Latency-sensitive agentic workflows.** When you're running multi-step agentic processes — code review, document analysis pipelines, evaluation loops — API call latency compounds. Local inference at 50+ tokens per second, even for a smaller model, can deliver end-to-end pipeline performance that beats a larger hosted model with network overhead.

**Cost at scale.** The break-even calculation depends on usage patterns, but organizations running more than 10 million tokens per day against commercial APIs are typically at a scale where dedicated inference infrastructure pays for itself within 12–18 months.

## What Local LLMs Still Can't Do Well

Honesty requires balance. Local models lag hosted frontier models on:

- Complex multi-step reasoning (though this gap is closing rapidly)
- Reliable tool use and function calling at production quality
- Multimodal tasks — vision models locally are capable but behind GPT-4V and Claude 3
- Context windows beyond 128K without significant memory investment

The right framing is not "local vs. cloud" but "which tasks warrant local and which warrant cloud." Routine, high-volume, latency-sensitive tasks with data sensitivity concerns → local. Novel, complex reasoning tasks where quality is the primary constraint → cloud. Most organizations need both.

*Running local inference in production or evaluating it for an enterprise use case? I'm interested in comparing notes — [get in touch](/contact).*
