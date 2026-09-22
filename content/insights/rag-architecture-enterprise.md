---
title: "RAG Architecture for Enterprise Knowledge Bases: What Works, What Doesn't"
description: "Retrieval-Augmented Generation sounds simple — retrieve relevant documents, pass them to an LLM, get better answers. The implementation decisions that make it work in production are less obvious."
date: 2025-06-02
tags: ["AI & MLOps", "Architecture", "Enterprise AI"]
format: article
---

RAG — Retrieval-Augmented Generation — has become the go-to architecture for enterprise LLM applications where you need the model to answer questions about internal knowledge: documents, policies, technical documentation, historical records.

The basic concept is genuinely simple. The implementation that actually works in production is less so.

---

## The basic architecture and where people assume it's simpler than it is

```
Query → Embed query → Search vector store → Retrieve relevant chunks
     → Build prompt with retrieved context → LLM → Answer
```

In a weekend prototype, this works reasonably well. In a production system with real users, real documents, and real expectations, the gaps appear quickly.

**Gap 1: Chunking is not trivial.** How you split documents into chunks for embedding dramatically affects retrieval quality. Fixed-size chunking (every 512 tokens) is simple but loses semantic boundaries. A paragraph about one topic gets cut in half; the two halves don't retrieve together. Better approaches: sentence-level chunking, paragraph-level chunking with overlap, or recursive character splitting that respects document structure.

**Gap 2: Embedding quality varies enormously.** Not all embedding models are equal for enterprise text. A model trained on general web text may not handle technical jargon, internal acronyms, or domain-specific language well. Test embedding quality on your actual document corpus before committing to a model.

**Gap 3: Retrieval is a ranking problem.** The top-k chunks retrieved by cosine similarity aren't necessarily the top-k chunks a human would select as most relevant. Hybrid search (combining dense vector similarity with sparse keyword matching via BM25) consistently outperforms pure vector search on mixed query types. This is worth implementing from the start.

---

## Document processing: the part that breaks first

Before anything reaches the vector store, documents need to be processed. This sounds like a solved problem. It isn't.

**PDF extraction** is the first casualty. Enterprise documents are often scanned PDFs, two-column layouts, tables, or PDFs with images of text rather than selectable text. Basic PDF extraction libraries miss table content, confuse column order, and produce garbled text from complex layouts. For enterprise-quality RAG, you need OCR on scanned content and structure-aware extraction that understands tables and figures.

**Different document types need different handling.** A legal contract, a technical specification, and an FAQ have different semantic structures. A FAQ is a list of question-answer pairs — chunking it as continuous text loses the pairing. A contract has sections, clauses, and cross-references that matter for retrieval. Treating all document types identically degrades quality.

**Metadata matters.** Each chunk should carry metadata: source document, section, date created, author, document type. This metadata enables filtered retrieval (only search documents from the last 12 months, only search the legal category) and source citation in responses.

---

## The vector store decision

The main options in enterprise context:

**pgvector** — PostgreSQL extension that adds vector similarity search. If you're already on Postgres, this is the lowest-overhead starting point. It works well at moderate scale (millions of documents) without introducing a new infrastructure dependency.

**Pinecone** — managed vector database, well-suited for teams that don't want to manage infrastructure. Good performance, straightforward API, proprietary. Costs accumulate at scale.

**Weaviate** — open source, supports hybrid search (vector + keyword) natively, can be self-hosted or used as a managed service. Good choice if hybrid search is important from the start.

**Qdrant** — open source, high performance, good filtering capabilities. Strong choice for self-hosted deployments with complex filtering requirements.

**Azure AI Search / AWS OpenSearch** — cloud-native options that integrate well into their respective ecosystems, support hybrid search, and avoid introducing a separate database.

For most enterprise starting points: pgvector if you're on Postgres, cloud-native option if you're not. Introduce a purpose-built vector database when you have a specific reason to.

---

## What makes responses actually reliable

The gap between a demo that impresses and a system that users trust is mostly about two things: answer quality and attribution.

**Prompt engineering matters more than most people plan for.** The system prompt for a RAG system — how you instruct the LLM to use the retrieved context, what to say when context is insufficient, how to handle contradictory sources — determines the quality of responses more than the retrieval does. This requires iteration on real queries and real documents, not just testing on clean examples.

**Citation is non-negotiable for enterprise use.** If the system says "the policy on X is Y," users need to be able to verify that against the source document. Return citations with every answer — document name, section, and ideally a link to the source. Without citations, users either trust blindly or don't trust at all. Neither is useful.

**Handle "I don't know" gracefully.** When retrieved context doesn't contain relevant information for a query, the LLM should say so — not hallucinate an answer. This requires explicit instruction in the system prompt and testing on queries you expect to fail. The failure mode where the system confidently generates an answer not supported by the retrieved context is the one that damages user trust irreparably.

---

## A production-ready pipeline

What I'd suggest as a starting architecture that's actually robust:

1. **Document ingestion**: extract text (with OCR for scanned content), parse structure, extract metadata
2. **Chunking**: paragraph-level with overlap, preserving section context in chunk metadata
3. **Embedding**: generate embeddings using a model validated on your document types
4. **Storage**: vector store with metadata filtering, paired with a document store for full text retrieval
5. **Query pipeline**: hybrid search (vector + BM25), re-ranking of results, context assembly with source metadata
6. **LLM layer**: system prompt with explicit instructions on citation, uncertainty handling, and scope
7. **Evaluation**: regular automated evaluation against a test set of known query-answer pairs
8. **Monitoring**: tracking answer quality signals (user feedback, citation accuracy checks)

Steps 7 and 8 are what most implementations skip. They're why most implementations degrade undetected over time.

---

RAG is genuinely one of the most useful patterns for making LLMs work on enterprise knowledge — but the gap between a prototype and a production system that users actually rely on is significant. The architecture is the easy part. The document processing, evaluation discipline, and monitoring are where the real work is.

*Building a RAG system or evaluating your current one? [Happy to talk through the specifics.](/about)*
