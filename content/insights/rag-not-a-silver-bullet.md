---
title: "RAG solves the knowledge problem. It does not solve the reasoning problem."
description: "…"
date: 2029-04-23
tags: ["Enterprise AI", "Emerging Technology"]
format: note
derived: true
---

RAG is the right architecture when your problem is "the model doesn't have access to your proprietary data." It is not a solution for every AI quality problem, and treating it as one leads to architectures that are complex without being better.

What RAG fixes: the model's knowledge cutoff, access to your internal documents, and hallucinations about domain-specific facts it was never trained on. By grounding the model's responses in retrieved context, you reduce the gap between what the model says and what your documents actually contain.

What RAG doesn't fix: poor retrieval means the model reasons on wrong or irrelevant context, which can actually worsen output quality compared to no retrieval. Questions that require synthesis across many documents push against chunking limitations. Questions that require reasoning about absence — "are there any exceptions to this policy in our documentation?" — are poorly served by retrieval that only surfaces what's present.

The quality of a RAG system is largely the quality of its retrieval. Embedding model choice, chunking strategy, metadata filtering, re-ranking — these determine whether the model sees relevant context or noise. Most teams spend effort on the generation side and underinvest in the retrieval side.

The diagnostic question: is your problem "the model doesn't know X" or "the model reasons badly about X it does know"? RAG addresses the first. The second requires different interventions.
