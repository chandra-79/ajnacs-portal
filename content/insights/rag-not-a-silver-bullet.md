---
title: "RAG needs separate evidence for retrieval and answer quality"
description: "Separate missing documents, retrieval failures, and unsupported synthesis before changing your RAG architecture."
date: 2029-04-23
tags: ["Enterprise AI", "Emerging Technology"]
format: note
derived: true
---

Retrieval-augmented generation supplies selected external information to a model at request time. It can help a system answer questions about material outside the model's training data, but it does not guarantee correct retrieval, complete coverage, sound interpretation, or valid citations. Treat retrieval and answer generation as separate components with separate evidence.

## Diagnose where the answer became wrong

For a hypothetical policy assistant, preserve the question, the authorized document set, the retrieved passage identifiers, and the final answer. First ask whether an authoritative answer exists in that document set. Then ask whether retrieval found it. Finally ask whether the answer accurately used it. Without this separation, a team can spend weeks rewriting prompts for a problem caused by missing documents.

Consider 100 fictional questions with known answers in the approved corpus. Retrieval includes a sufficient passage for 80. The generator produces a supported answer for 72 of those 80. End-to-end supported answers are therefore 72 of 100. Even perfect generation on the same retrieved passages could reach at most 80 of 100 in this simplified exercise. The chart makes that ceiling visible; it is not a benchmark for real RAG systems.

## Handle absence carefully

A top-ranked passage is the best match among the searched candidates, not proof that it answers the question. A query about exceptions is especially demanding: failing to retrieve an exception does not prove that none exists. The application may need a structured policy database, an exhaustive search over a bounded collection, or escalation to a subject-matter expert.

Document access is another boundary. Apply authorization before supplying passages to the model, and account for permissions in caches. A citation that the user cannot open does not repair a disclosure that has already appeared in the answer. Retain document version and effective-date metadata so that an obsolete policy can be identified rather than merely ranked highly.

## Run a useful retrieval exercise

Build a worksheet with question, expected source, actual retrieved sources, sufficient-evidence judgment, answer support, and failure category. Include near-duplicate documents and questions with no supported answer. Compare a keyword baseline with the proposed retriever before adding more components. Domain identifiers and exact product names can behave differently from natural-language paraphrases.

Change one retrieval decision at a time: chunk boundary, filter, query rewrite, candidate count, or reranking. Track latency and the number of passages supplied as well as coverage. A longer context may add useful evidence, but it may also introduce contradictions and irrelevant detail. Check the specific model and corpus rather than assuming that more text is always better.

The original RAG and dense-passage-retrieval papers are useful foundations for understanding the architecture. Their benchmark results do not transfer automatically to an enterprise permission model or a policy corpus. The local evidence must establish that the information reached the model, that the answer used it correctly, and that unsupported questions receive an honest limitation.

## Sources and further study

- [Lewis et al. — Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [Karpukhin et al. — Dense Passage Retrieval](https://arxiv.org/abs/2004.04906)
