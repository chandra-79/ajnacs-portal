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

## Describe what fills memory while the model is running

Start with the weight file and measure what happens when the runtime loads it. A hypothetical 8-billion-parameter model at exactly four bits per parameter would need about 4 GB for the raw packed parameter values. A real quantized file may store metadata, scales, and some weights at higher precision. The runtime can create additional buffers and may keep different portions in CPU and accelerator memory. A 4 GB file therefore cannot establish that a system with 4 GB free will run the workload.

The attention key-value cache is another part of the budget. For a standard cache that holds both key and value tensors for each layer and active position, a rough per-sequence estimate is two times the layer count, key-value head count, head dimension, bytes per element, and cached token count. In an illustrative model with 32 layers, eight key-value heads of dimension 128 and two-byte elements, the estimate is 128 KiB per token. At 8,192 tokens that becomes 1 GiB. Four independent such sequences would need about 4 GiB just for those uncompressed caches. That example omits pad and block overhead, model weights and temporary allocations. Multimodal inputs, sliding-window attention, cache sharing, and cache quantization can change the result.

Cap maximum prompt length and concurrency based on observed peak memory rather than a successful short chat. Test a full-length prompt with two other independent sessions open, and notice whether the machine swaps or pauses. Some runtime metrics track accelerator allocations and omit host memory. On a shared-memory machine, compare system pressure as well as process figures. The [Hugging Face cache guide](https://huggingface.co/docs/transformers/en/kv_cache) explains several ways runtimes can trade memory, flexibility and speed when retaining attention state.

## Measure an interactive request in stages

Use representative task fixtures, such as a short question over one paragraph and an extraction over a full design note. Record the actual prompt and output token counts. Record model and quantization revisions, chat template, runtime version, device selection, threads, and any prefix caching. If the same prefix is reused during repeated tests, keep a separate cold result for a first-time user. Report warm results only when the workload actually has warm sessions.

Split elapsed time into queueing, tokenization and prefill, first displayed token, and generation after that token. Reserve a separate category for tool use and any review or retry. A faster reported decode rate can still make for a slower interaction when a model spends longer on the prompt. Use a monotonic clock on the client for perceived latency and save runtime metrics to explain it. Capture medians and tails with the sample size and concurrency level. In a small trial include per-run times, since a percentile based on a handful of samples adds little confidence.

For illustration, compare a runtime that spends one second until its first visible token then emits the remaining 119 tokens at 20 per second, with another that spends 3.5 seconds then emits them at 35 per second. Their simplified end-to-end times are roughly 6.95 and 6.9 seconds. The first looks more responsive from the start. Long outputs can favor the second on these assumptions. Keep a fixed evaluation cap, because a verbose answer can make an otherwise fast runtime look slower when both tasks produced equally useful work.

## Run the privacy test across the whole path

List which process reads prompts, where they are written and how the outputs are delivered. A local application can still send data to a search or telemetry service, and logs and crash reports can retain excerpts on the machine. Review shell history, snapshots, model and cache directories and any tools enabled by the assistant. Where you need an offline workflow, run representative tasks with egress disabled in the environment you control, and note which features fail without network access. Confirm model files and dependencies are available through the approved provisioning path before blocking updates.

Check the listener address and who can reach the model API. An API intended for one workstation should not be accessible from a broad network by accident. If another user needs access, arrange authentication, rate limits and memory isolation as part of operating the service. Keep privileges scoped for any retrieval or code tools. The model’s local location does not confer authority to access every directory on the machine. Record data provenance and license terms for model weights, adapters and relevant datasets as part of a deployable configuration.

## Benchmark the result your team needs

For an illustrative ten-minute trial, run ten short extractions and ten complex decisions. Review the exact factual fields and required evidence. Count missing values, unsupported values and results that needed a second call. Compute elapsed and reviewer costs for accepted outcomes with rejected work still in the total cost. The local model that completes more tokens can lose if its extractions need more manual correction. The larger model can lose when it queues long prompts and slows a shared machine for other work.

Pick the smallest configuration that clears the task rubric and keeps enough headroom for realistic concurrency. Test what you will do when it cannot finish, whether that means scheduling batch work later, reducing context while retaining critical evidence, or sending the request through an approved separate workflow. A practical evaluation ends with a stable run configuration and a documented fallback that serves the team on the busiest day.

Record load time from a cold process separately from the warm runs and include any model eviction. A machine used for editing and inference can have the same average tokens per second in two setups while one causes long pauses whenever the model must be loaded again.
