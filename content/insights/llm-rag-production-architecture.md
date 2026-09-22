---
title: "RAG in Production: The Architecture Decisions That Separate Working Systems from Demos"
description: "Retrieval-Augmented Generation demos are easy. Production RAG systems that answer accurately, handle edge cases, and stay within cost budgets are not. Here's the architecture that works at scale — chunking, embedding, retrieval, reranking, and the failure modes to design around."
date: 2026-05-25
tags: ["AI & MLOps", "Architecture", "Cloud Architecture"]
format: article
---

A RAG demo takes an afternoon. You split some documents, embed them, put them in a vector database, and retrieve the top-K chunks for each query. The LLM generates an answer that's impressively relevant.

The problems emerge when you try to make this work reliably: questions that require reasoning across multiple documents, queries that retrieve the wrong chunks because embedding similarity doesn't capture semantic relevance well enough, answers that are confidently wrong because the retrieved context doesn't contain the answer but the LLM generates one anyway, and cost spirals from large context windows.

Here's the architecture that handles these problems.

## Document processing: chunking is not trivial

The quality of retrieval is determined largely by how you chunk documents. The goal: chunks that are semantically coherent (contain a complete thought), small enough to be retrievable precisely, and large enough to contain enough context for the LLM to generate an accurate answer.

**Fixed-size chunking** (512 tokens, 50-token overlap) is the simplest approach and works reasonably well for uniform prose. The overlap prevents context loss at chunk boundaries.

**Semantic chunking** splits on natural semantic boundaries — paragraphs, sections, sentences that end a complete thought — rather than at a fixed token count. Better for documents with clear structure (technical documentation, legal contracts, policy documents).

**Hierarchical chunking** maintains both small chunks (for precise retrieval) and larger parent chunks (for context in the answer). Retrieve small chunks; return the parent chunk to the LLM. This is sometimes called the "small-to-big" retrieval pattern.

**Structured document handling**: PDFs are not uniformly text. Tables, figures, headers, and footnotes need explicit handling. A PDF chunker that preserves table structure (rather than rendering it as text and losing the relational structure) produces significantly better retrieval quality for documents with tabular data.

For each chunk, store rich metadata: source document, page number, section heading, document type, last updated date. Metadata filtering — "retrieve only from documents updated in the last 6 months" — requires this metadata to be stored alongside the embedding.

## Embedding: model selection and fine-tuning

The embedding model converts text to a vector representation. The quality of the embedding determines how well semantically similar content maps to nearby vectors.

**`text-embedding-3-large`** (OpenAI) and **`embed-english-v3.0`** (Cohere) are strong general-purpose embeddings with good performance on retrieval benchmarks. **`all-mpnet-base-v2`** (Sentence Transformers) is a strong open-source option for on-premises or cost-sensitive deployments.

For domain-specific content (legal documents, medical records, financial filings), fine-tuning an embedding model on domain examples improves retrieval quality significantly. The fine-tuning dataset: pairs of (query, relevant document chunk) and (query, irrelevant chunk) — positive and negative pairs that teach the model what "semantically similar" means in your domain.

**Embedding dimensions**: larger dimensions (3072 for text-embedding-3-large) capture more semantic nuance; smaller dimensions (768 for many open-source models) are cheaper to store and query. For most use cases, the dimension reduction techniques (Matryoshka representation learning) available in newer models provide good performance at reduced dimensionality.

## Vector database and retrieval

**ANN (Approximate Nearest Neighbour) search** is what vector databases do: given a query vector, find the K most similar vectors. The approximate part is important — exact nearest neighbour search at scale is computationally expensive; ANN algorithms (HNSW, IVF-PQ) trade a small accuracy cost for large speed gains.

Options:
- **Pinecone**: managed, simple API, good performance, costs money at scale
- **Weaviate**: open-source with managed option, hybrid search (vector + BM25), strong schema support
- **Qdrant**: open-source, Rust-based, excellent performance, good metadata filtering
- **pgvector**: PostgreSQL extension; if you're already on PostgreSQL, good enough for smaller scales without adding infrastructure
- **ChromaDB**: simple, good for development and smaller deployments

**Hybrid search** (combining dense vector search with sparse keyword search like BM25) consistently outperforms pure vector search on most benchmarks. Queries with specific terminology, product codes, or proper nouns often aren't well-handled by vector similarity alone; keyword matching fills the gap. Reciprocal Rank Fusion (RRF) is the standard method for combining the two result sets.

## Reranking: the step that most demos skip

The top-K results from vector search are retrieved by embedding similarity, which is a proxy for relevance — not a direct measure. A reranker scores the actual query-document pair using a more expensive cross-encoder model that can consider both the query and the document together.

The typical pattern:
1. Vector search retrieves top 20 candidates (cheap, fast)
2. Reranker scores each of the 20 candidates against the query (expensive, slower)
3. Top 5 reranked results are passed to the LLM

Reranking adds latency (100-300ms typically) but significantly improves answer quality by filtering out chunks that are topically related to the query but don't actually answer it.

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

RAGAS is an open-source evaluation framework that automates these metrics. Building a 100-200 question evaluation set with known correct answers before deploying is the minimum gate for production readiness.

*Building a RAG system or debugging one that's not performing well in production? [Happy to compare implementations.](/contact)*
