---
title: "Large Language Models: What They Are, How They Are Built, and What They Cannot Do"
description: "Transformers, attention, pretraining, fine-tuning, RLHF — the architecture and training pipeline behind GPT, Claude, Llama, and every other modern LLM, explained for engineers who need to use and evaluate these systems."
date: 2026-10-21
tags: ["AI & MLOps", "Enterprise AI", "Fundamentals"]
series: "AI, ML, LLMs, and Neural Networks: A Practitioner's Introduction"
seriesOrder: 3
format: article
---

Large language models are the most consequential technology development in AI since the GPU made deep learning practical. Understanding their architecture, their training process, and their limitations is essential for any engineer building on top of them — because the limitations are architectural, not incidental, and they shape what is safe and unsafe to build.

## What to measure

**Useful answers out of all attempts.** Have a reviewer score 100 representative prompts using a fixed rubric. If 82 pass, 12 give unsupported answers and 6 abstain, report all three outcomes. An 82% pass rate on this prompt set does not describe performance on other tasks.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The Transformer: The Architecture That Changed Everything

Every major language model — GPT, Claude, Llama, Gemini, Mistral — is built on the transformer architecture, introduced in the 2017 paper "Attention Is All You Need" by Vaswani et al.

The transformer's key innovation: the **attention mechanism**, which mixes information from allowed positions. In dense causal attention a position can attend to itself and earlier positions. Local or sparse attention uses narrower patterns. Earlier architectures (RNNs, LSTMs) processed sequences left-to-right, making it difficult to connect information that was far apart in the sequence. Attention removes the distance constraint.

**How attention works conceptually**: for each token, attention computes a weighted combination of value vectors from the permitted positions, where the weights reflect how relevant each token is to understanding the current one. "The bank by the river was steep" — when computing the representation of "bank," attention assigns high weight to "river" (suggesting geographic bank, not financial bank) and lower weight to "steep."

The transformer has two main components:
- **Encoder**: reads the input and builds contextualised representations (used in BERT and similar models for classification, named entity recognition, etc.)
- **Decoder**: generates output tokens one at a time, using earlier output positions and, in an encoder–decoder model, encoder output. A decoder-only model uses a single causal stream

GPT, Claude, and most modern LLMs are decoder-only transformers.

## Pretraining: What LLMs Actually Learn

LLMs are pretrained on massive text corpora — trillions of tokens of web text, books, code, and scientific papers. The training objective is simple: predict the next token.

Given "The capital of France is", the model should predict "Paris" with high probability. Given "Paris", it should predict reasonable continuations. This objective, applied at scale, forces the model to learn grammar, factual knowledge, reasoning patterns, code syntax, and cultural context — because all of these are predictive of what comes next in human text.

The result is a model with broad world knowledge and language capability encoded in its billions of parameters.

**Scale matters dramatically**: GPT-2 (2019, 1.5B parameters) could write coherent paragraphs. GPT-3 (2020, 175B parameters) could follow instructions, translate languages, and write working code. Later proprietary models improved on selected evaluations. Compare published tasks, controls, and contamination checks. The GPT-4 report does not publish its parameter count.

## Fine-Tuning and RLHF: From Predictor to Assistant

A pretrained LLM predicts next tokens — it does not reliably follow instructions, maintain safe behaviour, or produce helpful responses. Two additional training stages address this:

**Instruction fine-tuning**: the pretrained model is further trained on a dataset of instruction-response pairs. "Write a Python function that..." → example correct response. This teaches the model to follow instructions rather than just complete text.

**RLHF (Reinforcement Learning from Human Feedback)**: human raters evaluate model outputs for helpfulness, harmlessness, and honesty. A reward model is trained to predict human preferences. The LLM is then fine-tuned using reinforcement learning to maximise the reward model's score. This is the technique that produced the leap from GPT-3 to ChatGPT in terms of usability.

## What LLMs Cannot Do: The Architectural Limits

Understanding limitations is more important than understanding capabilities for production decision-making.

**LLMs do not have knowledge of events after their training cutoff.** The model's knowledge is frozen at the point its training data was collected. This is why retrieval-augmented generation (RAG) exists — to provide up-to-date information at inference time.

**LLMs confabulate (hallucinate).** The model generates the most plausible next tokens. When the correct answer is not well-represented in training data, the model generates a plausible-sounding but incorrect answer confidently. This is not a bug — it is the architecture operating as designed. It means LLM outputs in factual domains require verification.

**LLMs are not search engines.** They do not retrieve information from a database; they synthesise text based on patterns learned during training. Two queries about the same fact may produce different answers.

**LLMs have context window limits.** They can only attend to a fixed number of tokens at once (context window). Check context and output limits for the exact deployed model and API. Beyond the context window, the model cannot access information.

**LLMs do not reason in the way humans do.** Explicit intermediate steps can help on some tasks, while generated explanations can misrepresent why an answer was produced. Verify the answer and any claimed intermediate results. It can fail at simple logical tasks that require consistent rule application.

**LLMs do not have persistent memory.** Each conversation starts fresh. The model does not remember previous conversations unless that history is explicitly included in the context window.

These limitations are architectural, not temporary. Building production systems on LLMs requires designing around them, not hoping they do not apply.
