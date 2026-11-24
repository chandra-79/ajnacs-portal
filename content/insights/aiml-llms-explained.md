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

## Trace the path from text to a completion

A model sees token identifiers arranged in a sequence. A word, punctuation mark, or portion of a word can map to different numbers of tokens depending on the tokenizer and context. For a chat request, the client generally encodes message roles in a model-specific template and may add a marker that starts the assistant’s turn. Two interfaces that show the same conversation to a person can produce different token sequences. [Hugging Face’s chat template documentation](https://huggingface.co/docs/transformers/chat_templating) explains how roles and special tokens are rendered for a particular checkpoint. Use that checkpoint’s tokenizer and template when you reproduce an issue.

A decoder’s forward pass finishes with logits over its vocabulary. A decoding policy selects a token and appends it to the context. Sampling at a lower temperature concentrates probability on tokens already preferred by the model. That can reduce some types of variation. It does not verify whether the claim was true. A stop sequence or generation limit can cut off the answer before a quotation or code block closes. Treat such responses as incomplete if the application requires a complete object.

In an illustrative budget, suppose a model accepts 8,192 tokens in total and the application reserves 768 for output. With 1,024 allocated to system instructions and recent conversation, up to 6,400 remain for evidence and the question. That arithmetic holds only if the provider counts tokens that way and the actual template fits the allocation. Measure the serialized request with the correct tokenizer. Some APIs document separate input and generation limits or include extra tokens under different accounting rules.

## Read attention as information mixing rather than a citation

In the original [Transformer paper](https://arxiv.org/abs/1706.03762), attention compares a query with keys, then uses the resulting weights to mix associated values. A causal decoder applies a mask so that a position cannot use future tokens. Position information and other neural layers contribute to the model’s representation. A heatmap from one head is a view of part of that calculation. If a model gives a citation, examine whether the supporting passage actually entails the relevant claim. Bright attention on a word or passage is not proof that the answer was derived faithfully from it.

Many decoder runtimes cache keys and values for prior positions. This avoids recreating those particular representations each time another token is generated. The cache comes with a memory cost that grows with active context, depending on the attention architecture, precision and runtime. Long prompts can affect the wait until the first token even when the final answer is short. Distinguish that delay from the speed of generating subsequent tokens. See [Hugging Face’s cache guide](https://huggingface.co/docs/transformers/en/kv_cache) for the memory and implementation trade-offs of available cache strategies.

## Keep training objectives separate from application guarantees

Next-token prediction rewards answers that are likely under the training objective. Instruction tuning can help the model recognize a request and format a response. Preference training can favor some answers over others as judged by a feedback process. These layers can make the same basic architecture more useful in a dialogue. Their objectives are still proxies. A polished answer can misrepresent evidence, and a concise refusal can be preferable for a question the available information cannot answer.

The term “cutoff” concerns the information available to a checkpoint through its training and updates. A deployed assistant can also receive facts through an application, tool or history store. For each evaluation run, list which information arrived through which route. Ask about an event absent from the static fixture, then supply an authoritative excerpt with the event and see whether it changes the answer. This tests the application’s use of provided context without speculating about what the weights secretly memorized. Save the retrieved evidence separately from model output.

## Compare two model choices on one frozen workflow

Pick a workload with answers you can verify, such as extracting a delivery window from synthetic purchase orders. Require a date, time zone and source passage. Include missing windows, ambiguous locale formats and dates shown in an unrelated attachment. Test a base model and an instruction-tuned model using their correct templates. Preserve the document set, intended output contract, provider options and acceptance rubric. If you change both the model and the context retrieval method at once, describe the conclusion as a comparison of two application bundles.

Imagine 80 fictional documents. One configuration returns 66 useful answers, eight unsupported answers and six justified abstentions. Another returns 68 useful answers, five unsupported answers and seven justified abstentions. The two extra useful answers are an observed change of 2.5 percentage points. Decide whether the drop in unsupported answers matters more than the small increase in coverage. Compare paired failures and check whether the change fixes time zones or only easier dates. Measure completion time including any second attempt and human review. Customers need a useful, verifiable result, not only a slower or faster token stream.

Keep a model and tokenizer revision with each result. Re-run the same fixture after a model, retrieval or template change. Repeat stochastic generations if the application needs consistency. Retain invalid or incomplete completions in the denominator. Once a test case guides repeated tuning, create an independently held-out set for the release decision so the original fixture can remain a regression test.

Decide which response fields must survive a provider change and check them with the same parser. A date represented differently may still satisfy the user task after normalization, while a date attached to the wrong order should fail independently of text similarity.
