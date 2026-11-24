---
title: "RAG Needs Evidence Coverage and Answer Validation"
description: "Retrieval-Augmented Generation gives LLMs access to current, relevant information. It does not improve their ability to reason over that information accurately. Understanding the boundary is essential for scoping RAG applications."
date: 2028-06-30
tags: ["Enterprise AI", "Emerging Technology"]
format: article
---

RAG is a useful architecture for supplying external evidence to a language-model application. The gap between what teams expect RAG to solve and what it actually solves is responsible for a class of RAG applications that disappoint in production.

## What RAG actually does

RAG consists of two operations: retrieval and generation.

Retrieval: given a user's query, find the most relevant documents or passages from a knowledge base using semantic search (typically vector similarity). The retrieved passages are included in the prompt context.

Generation: the LLM produces an answer based on the prompt and the retrieved context.

RAG's contribution is the retrieval step. It gives the model access to information that was not in its training data — recent documents, proprietary knowledge, current facts. Without RAG, the model answers from its parametric knowledge, which is static and may be outdated.

## What RAG does not do

Retrieval can improve a system's ability to answer by supplying missing evidence, but it does not guarantee correct reasoning over that evidence. If the question requires multi-step logical reasoning — drawing inferences, combining information from multiple sources, identifying what is implied but not stated — RAG surfaces the relevant context, but the model must still reason over it.

The final result depends on the model, task framing, evidence selection, and application logic. Evaluate the complete system rather than treating retrieval as a guarantee.

**Hallucination within retrieved context.** Even with accurate, relevant documents in the context, models sometimes generate statements that are not supported by the retrieved text or that contradict it. Relevant retrieved evidence can reduce some unsupported answers under a tested configuration, but retrieval can also introduce irrelevant or misleading material. Measure factual support and abstention rather than assuming hallucinations must decrease.

**Multi-hop reasoning.** A question that requires combining fact A from document 1 with fact B from document 2 to derive conclusion C — where C is not stated in either document — requires genuine inference. The system must retrieve both relevant documents and correctly combine them. Either evidence coverage or synthesis can fail.

**Numerical and logical precision.** LLMs are unreliable for precise calculations, logical proofs, and structured inference. Providing numerical data via RAG does not make the model reliably accurate at arithmetic.

## Scoping RAG applications correctly

RAG is excellent for: factual question answering where the answer is directly stated in source documents, document summarization, customer support where the correct answer is in a knowledge base, content generation based on specific reference material.

RAG is insufficient for: complex multi-step reasoning, precise calculations, logical inference not explicitly stated in sources. Some such tasks benefit from deterministic tools, structured queries, or specialized models, each with its own validation requirements.

Know the boundary before you design the system.

## Design a question that exposes incomplete evidence

Imagine a hypothetical policy corpus with a standard travel rule, a regional exception, and a later correction. The user asks whether a particular trip is reimbursable. Retrieving only the standard rule can produce a fluent answer that is wrong for the region. Retrieving all three documents can still fail if the application does not identify the effective version and the relevant exception.

Build a small test set that distinguishes direct lookup, cross-document synthesis, and questions with no supported answer. In an illustrative 90-case set, each category contains 30 questions. The system succeeds on 27 direct lookups, 18 synthesis questions, and 21 unsupported-question cases where it appropriately declines. The chart shows 90%, 60%, and 70% respectively. The categories use different success criteria, which must be stated beside the result.

## Choose retrieval methods for the evidence shape

A product identifier may need exact lexical matching. A paraphrased question may benefit from semantic retrieval. A policy decision may need metadata filtering by jurisdiction and effective date before ranking. A question about all exceptions may require exhaustive enumeration over a bounded collection rather than a top-k search. These are different retrieval tasks, and one similarity index need not be the right mechanism for all of them.

Keep the source record attached to the passage. Titles, headings, effective dates, and document relationships can matter more than another few sentences of nearby text. Avoid cutting an exception away from the rule it modifies merely because a fixed token boundary falls between them. Test chunking decisions with questions that depend on those relationships.

## Add deterministic work where appropriate

When the answer requires a sum, percentage, or date calculation, extract validated inputs and use a deterministic calculation component. Preserve the inputs and result so a reviewer can reproduce the answer. A tool result is still data that needs validation and a clear interpretation; adding a calculator does not make an unsupported assumption correct.

For the lab, construct the three policy documents and ten questions by hand. Include one question that cannot be answered from them. Record expected evidence before running the model. Compare retrieved passages with that expectation, then evaluate the final answer separately. Change the query or chunking only after identifying which stage failed.

The worksheet should distinguish missing source, wrong version, irrelevant retrieval, insufficient coverage, unsupported inference, and invalid arithmetic. Track refusal and coverage alongside correctness. A system that declines every difficult question may be safe within a narrow boundary but still fail the intended product requirement. The practical goal is an explicit supported scope, evidence that the retrieval covers that scope, and an honest path for questions beyond it.

## Sources and further study

- [Lewis et al. — Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [Karpukhin et al. — Dense Passage Retrieval](https://arxiv.org/abs/2004.04906)
