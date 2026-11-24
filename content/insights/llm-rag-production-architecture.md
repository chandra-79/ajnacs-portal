---
title: "RAG in Production: The Architecture Decisions That Separate Working Systems from Demos"
description: "Retrieval-Augmented Generation demos are easy. Production RAG systems that answer accurately, handle edge cases, and stay within cost budgets are not. Here's the architecture that works at scale — chunking, embedding, retrieval, reranking, and the failure modes to design around."
date: 2026-12-18
tags: ["AI & MLOps", "Architecture", "Cloud Architecture"]
format: article
---

A RAG demo takes an afternoon. You split some documents, embed them, put them in a vector database, and retrieve the top-K chunks for each query. The LLM generates an answer that's impressively relevant.

The problems emerge when you try to make this work reliably: questions that require reasoning across multiple documents, queries that retrieve the wrong chunks because embedding similarity doesn't capture semantic relevance well enough, answers that are confidently wrong because the retrieved context doesn't contain the answer but the LLM generates one anyway, and cost spirals from large context windows.

Here's the architecture that handles these problems.

## Document processing: chunking is not trivial

The quality of retrieval is determined largely by how you chunk documents. The goal: chunks that are semantically coherent (contain a complete thought), small enough to be retrievable precisely, and large enough to contain enough context for the LLM to generate an accurate answer.

**Fixed-size chunking** (512 tokens, 50-token overlap) is the simplest approach and works reasonably well for uniform prose. Overlap can reduce boundary losses but does not guarantee that every needed relationship is preserved.

**Semantic chunking** splits on natural semantic boundaries — paragraphs, sections, sentences that end a complete thought — rather than at a fixed token count. Better for documents with clear structure (technical documentation, legal contracts, policy documents).

**Hierarchical chunking** maintains both small chunks (for precise retrieval) and larger parent chunks (for context in the answer). Retrieve small chunks; return the parent chunk to the LLM. This is sometimes called the "small-to-big" retrieval pattern.

**Structured document handling**: PDFs are not uniformly text. Tables, figures, headers, and footnotes need explicit handling. A PDF chunker that preserves table structure (rather than rendering it as text and losing the relational structure) produces significantly better retrieval quality for documents with tabular data.

For each chunk, store rich metadata: source document, page number, section heading, document type, last updated date. Metadata filtering — "retrieve only from documents updated in the last 6 months" — requires this metadata to be stored alongside the embedding.

## Embedding: model selection and fine-tuning

The embedding model converts text to a vector representation. The quality of the embedding determines how well semantically similar content maps to nearby vectors.

Choose an embedding model by evaluating the corpus language, terminology, access filters and deployment constraints. A published benchmark is a starting point, not proof of performance on internal questions.

For domain-specific content (legal documents, medical records, financial filings), fine-tuning an embedding model can improve retrieval quality when representative labelled pairs support it. The fine-tuning dataset: pairs of (query, relevant document chunk) and (query, irrelevant chunk) — positive and negative pairs that teach the model what "semantically similar" means in your domain.

**Embedding dimensions**: dimension affects storage and computation; higher dimension does not by itself guarantee better task quality. Some embedding models are trained to support reduced-dimensional representations, including Matryoshka-style approaches. Verify support and compare retrieval quality, storage and latency at each chosen dimension; arbitrary truncation of an embedding is not the same technique.

## Vector database and retrieval

**ANN (Approximate Nearest Neighbour) search** is what vector databases do: given a query vector, find the K most similar vectors. The approximate part is important — exact nearest neighbour search at scale is computationally expensive; ANN algorithms (HNSW, IVF-PQ) trade a small accuracy cost for large speed gains.

Compare retrieval stores on filtering correctness, update visibility, recovery, latency and operational ownership.

**Hybrid search** (combining dense vector search with sparse keyword search like BM25) can improve retrieval on mixed lexical and semantic questions, but should be tested against simpler baselines. Queries with specific terminology, product codes, or proper nouns often aren't well-handled by vector similarity alone; keyword matching fills the gap. Reciprocal Rank Fusion (RRF) is the standard method for combining the two result sets.

## Reranking: the step that most demos skip

The top-K results from vector search are retrieved by embedding similarity, which is a proxy for relevance — not a direct measure. A reranker scores the actual query-document pair using a more expensive cross-encoder model that can consider both the query and the document together.

The typical pattern:
1. Vector search retrieves top 20 candidates (cheap, fast)
2. Reranker scores each of the 20 candidates against the query (expensive, slower)
3. Top 5 reranked results are passed to the LLM

Reranking adds workload-dependent latency and may improve answer quality by filtering out chunks that are topically related to the query but don't actually answer it.

Cohere Rerank, `cross-encoder/ms-marco-MiniLM-L-6-v2` (open source), and Jina Reranker are common options.

## Handling the "I don't know" case

The most damaging failure mode in production RAG: the system answers confidently when the answer isn't in the corpus. This is hallucination, and users who trust the system for factual information will be misled.

Design for "I don't know" explicitly:
- Include a passage in the system prompt: "If the retrieved documents do not contain sufficient information to answer the question, say that you don't have enough information. Do not extrapolate or infer."
- Score retrieval confidence: if the top retrieved chunk has a similarity score below a threshold, treat this as a low-confidence retrieval and return "no relevant information found" rather than passing low-quality context to the LLM
- Include citations: ground every factual claim in a retrieved passage with a reference to the source chunk. Answers with citations are easier to verify and encourage the LLM to stay grounded in the retrieved context

## The evaluation framework you need before shipping

RAG systems need evaluation against a ground-truth dataset before production deployment. The evaluation metrics:

- **Retrieval recall**: what fraction of relevant documents are in the retrieved set?
- **Retrieval precision**: what fraction of the retrieved set is relevant?
- **Answer faithfulness**: is the generated answer grounded in the retrieved context? (Automated check: does the answer's claims appear in the retrieved chunks?)
- **Answer relevance**: does the answer address the question that was asked?

RAGAS is an open-source evaluation framework that automates these metrics. Choose evaluation size and coverage from the task, risk and uncertainty rather than a universal minimum count.

*Building a RAG system or debugging one that's not performing well in production? [Happy to compare implementations.](/contact)*

## Treat the index as a derived release artifact

A production retrieval index should be reproducible from source documents, parsing rules, chunking configuration and embedding version. Keep those inputs identifiable. If an engineer cannot explain which corpus produced an index, a regression becomes difficult to diagnose and a deletion request becomes difficult to verify. The index is an optimized representation, not the source of truth.

Publish changes through a controlled path. Ingest and validate new documents, build or update the candidate index, run retrieval and answer tests, then expose the change. For large collections, incremental updates may be necessary, but they still need version and failure tracking. A partially indexed document should not appear as a complete, authoritative source without a known policy.

The release boundary includes authorization metadata. Changing a document's access label can be more consequential than changing its text. Test that revoked access is reflected in retrieval, cached answers and citation resolution. A snapshot used for evaluation should represent the same permission semantics as the deployed system.

## Worked example: approximate search recall and latency

Consider a synthetic benchmark of 200 queries. For each query, an exact-search baseline identifies one reference nearest neighbor within the permitted corpus. A fast approximate configuration returns that neighbor for 170 queries and has a median retrieval latency of 20 milliseconds. A more thorough configuration returns it for 190 queries at 35 milliseconds. Exact search returns all 200 by definition of this comparison and has a median latency of 80 milliseconds.

The chart displays reference-neighbor recovery counts of 170, 190 and 200. Their recall values are 85%, 95% and 100% against this exact-neighbor reference. Moving from the fast to thorough setting gains twenty recovered neighbors, or ten percentage points, for fifteen additional milliseconds in the invented median timing. The chart does not plot latency because mixing milliseconds and query counts on one scale would be misleading.

This is not answer relevance. The nearest vector can still point to an unhelpful passage, and the exact-search reference itself is not a human relevance judgment. Evaluate semantic usefulness with independently labelled evidence after measuring approximate-index recall. Keeping these two evaluations separate prevents a system with perfect nearest-neighbor recovery from being mistaken for a perfect knowledge assistant.

The timings and counts are hypothetical. A reproducible real benchmark would publish corpus size, vector dimension, index parameters, filter selectivity, hardware, cache state and request concurrency. Report tail latency and failures as well as medians. A low median under an unloaded test says little about a busy service with restrictive tenant filters.

## Tune the pipeline one stage at a time

First verify source extraction and labels. Then compare chunking and retrieval with a fixed generator. Next test reranking against the same candidate pool. Finally evaluate answer generation with the selected evidence. This ordering makes it easier to identify whether a change improves the intended stage or merely compensates for another defect.

Increasing the number of retrieved chunks can improve evidence coverage while reducing answer quality through distraction or context overflow. Plot quality against the candidate and context budgets instead of selecting a large value by intuition. Preserve complete clauses and relevant exceptions when trimming. A tokenizer limit should not silently cut the source halfway through the sentence containing a qualification.

Reranking adds another dependency and an opportunity for failure. Define whether the system falls back to the original ranking, returns fewer results or declines to answer when the reranker is unavailable. Evaluate that fallback separately. A slower but more relevant reranker may be appropriate for a research tool and unsuitable for a strict interactive deadline; the product objective decides.

## Calibrate abstention rather than trusting a similarity score

Similarity scores depend on the embedding model, normalization and retrieval method. A fixed threshold copied from another system has no universal interpretation as confidence. Use labelled answerable and unanswerable questions to evaluate the relationship between score, evidence sufficiency and answer correctness. A high score can reflect topical similarity without the required fact.

Separate no evidence, conflicting evidence and inaccessible evidence. These states should produce different explanations or next steps where appropriate. Do not reveal restricted document details when explaining an access-limited result. A safe response can state that the available authorized sources are insufficient without confirming the existence of a hidden record.

Evaluate false abstentions as well as unsupported answers. A system that refuses every difficult question may appear safe but provide little value. Choose the operating tradeoff according to task consequence, and retain a route for readers to inspect sources or ask a narrower question. The goal is grounded usefulness rather than a superficially high refusal score.

## A practical index-migration lab

Create a small synthetic corpus containing duplicated passages, exact identifiers, paraphrases and two versions of one policy. Build two retrieval configurations with distinct version identifiers. Prepare questions whose required evidence is known before testing. Use exact search as a diagnostic baseline for index approximation, and human relevance labels for the application-level comparison.

Change the embedding model or chunking rule in the candidate configuration. Rebuild its vectors rather than mixing incompatible representations in one collection. Compare retrieved identifiers, relevant evidence coverage, supported answers, latency and index size. Keep the old index available until the candidate passes the chosen acceptance criteria.

The worksheet should record corpus snapshot, parser version, chunk rule, embedding revision, index settings, access filter and query identifier. Add expected and observed evidence, generation outcome and any missing citation. A reviewer should be able to trace a poor answer back to a source or transformation without guessing which release was active.

Then simulate a failed update midway through ingestion. Verify that the application either continues using the previous consistent release or clearly identifies the partial state according to the design. Test rollback and deletion propagation. These operations are as central to production reliability as the retrieval score from a static benchmark.

## Publish a useful methodology

A quality chart should explain who wrote the questions, how answerability was judged, which sources were eligible and how disagreements were resolved. State whether the evaluation corpus was used during tuning. Separate synthetic examples from production observations, and avoid presenting a small internal test as a general ranking of vendors or models.

Include the limits of the system's knowledge. If the corpus covers one department or only approved documents, readers need that scope to interpret an answer. A citation interface and a clear uncertainty path make the assistant a navigable entry point into evidence rather than an opaque replacement for it.

The production architecture is successful when its behavior can be inspected and improved stage by stage. Reproducible indexing, explicit permissions, measured retrieval and grounded answers create that path. More components are useful only when they solve a demonstrated failure and remain operable when a dependency changes.

## Sources and further study

- [Lewis et al. — Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [Karpukhin et al. — Dense Passage Retrieval](https://arxiv.org/abs/2004.04906)
- [Liu et al. — Lost in the Middle](https://arxiv.org/abs/2307.03172)

- [Kusupati et al.: Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147)
