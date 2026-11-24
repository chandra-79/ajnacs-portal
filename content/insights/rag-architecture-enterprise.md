---
title: "RAG Architecture for Enterprise Knowledge Bases: What Works, What Doesn't"
description: "Retrieval-Augmented Generation sounds simple — retrieve relevant documents, pass them to an LLM, get better answers. The implementation decisions that make it work in production are less obvious."
date: 2026-12-30
tags: ["AI & MLOps", "Architecture", "Enterprise AI"]
format: article
---

RAG — Retrieval-Augmented Generation — has become the go-to architecture for enterprise LLM applications where you need the model to answer questions about internal knowledge: documents, policies, technical documentation, historical records.

The basic concept is simple. The implementation that actually works in production is less so.

## The basic architecture and where people assume it's simpler than it is

```
Query → Embed query → Search vector store → Retrieve relevant chunks
     → Build prompt with retrieved context → LLM → Answer
```

In a weekend prototype, this works reasonably well. In a production system with real users, real documents, and real expectations, the gaps appear quickly.

**Gap 1: Chunking is not trivial.** How you split documents into chunks for embedding dramatically affects retrieval quality. Fixed-size chunking (every 512 tokens) is simple but loses semantic boundaries. A paragraph about one topic gets cut in half; the two halves don't retrieve together. Better approaches: sentence-level chunking, paragraph-level chunking with overlap, or recursive character splitting that respects document structure.

**Gap 2: Embedding quality varies enormously.** Not all embedding models are equal for enterprise text. A model trained on general web text may not handle technical jargon, internal acronyms, or domain-specific language well. Test embedding quality on your actual document corpus before committing to a model.

**Gap 3: Retrieval is a ranking problem.** The top-k chunks retrieved by cosine similarity aren't necessarily the top-k chunks a human would select as most relevant. Hybrid search combines dense similarity with lexical matching such as BM25. Compare it with simpler baselines on the actual question mix; gains are workload-dependent.

## Document processing: the part that breaks first

Before anything reaches the vector store, documents need to be processed. This sounds like a solved problem. It isn't.

**PDF extraction** is the first casualty. Enterprise documents are often scanned PDFs, two-column layouts, tables, or PDFs with images of text rather than selectable text. Basic PDF extraction libraries miss table content, confuse column order, and produce garbled text from complex layouts. For enterprise-quality RAG, you need OCR on scanned content and structure-aware extraction that understands tables and figures.

**Different document types need different handling.** A legal contract, a technical specification, and an FAQ have different semantic structures. A FAQ is a list of question-answer pairs — chunking it as continuous text loses the pairing. A contract has sections, clauses, and cross-references that matter for retrieval. Treating all document types identically can lose important structure; compare extraction and chunking quality by source type.

**Metadata matters.** Each chunk should carry metadata: source document, section, date created, author, document type. This metadata enables filtered retrieval (only search documents from the last 12 months, only search the legal category) and source citation in responses.

## The retrieval store decision

Choose a store by measured retrieval, filtering, update and operating requirements. Existing database capabilities may be sufficient; a separate retrieval service should solve a demonstrated requirement rather than follow a default product list.

## What makes responses actually reliable

The gap between a demo that impresses and a system that users trust is mostly about two things: answer quality and attribution.

**Prompt engineering matters more than most people plan for.** The system prompt for a RAG system — how you instruct the LLM to use the retrieved context, what to say when context is insufficient, how to handle contradictory sources — affects answer behavior alongside retrieval quality. This requires iteration on real queries and real documents, not just testing on clean examples.

**Citation is non-negotiable for enterprise use.** If the system says "the policy on X is Y," users need to be able to verify that against the source document. Return citations with every answer — document name, section, and ideally a link to the source. Citations give readers a route to inspect evidence, but the application must verify that each source exists, is accessible to that reader and supports the associated claim. Neither is useful.

**Handle "I don't know" gracefully.** When retrieved context doesn't contain relevant information for a query, the LLM should say so — not hallucinate an answer. This requires explicit instruction in the system prompt and testing on queries you expect to fail. The failure mode where the system confidently generates an answer not supported by the retrieved context is the one that damages user trust irreparably.

## A production-ready pipeline

A starting architecture to evaluate:

1. **Document ingestion**: extract text (with OCR for scanned content), parse structure, extract metadata
2. **Chunking**: paragraph-level with overlap, preserving section context in chunk metadata
3. **Embedding**: generate embeddings using a model validated on your document types
4. **Storage**: vector store with metadata filtering, paired with a document store for full text retrieval
5. **Query pipeline**: hybrid search (vector + BM25), re-ranking of results, context assembly with source metadata
6. **LLM layer**: system prompt with explicit instructions on citation, uncertainty handling, and scope
7. **Evaluation**: regular automated evaluation against a test set of known query-answer pairs
8. **Monitoring**: tracking answer quality signals (user feedback, citation accuracy checks)

If steps 7 and 8 are omitted, changes in retrieval and answer quality can remain undetected; ownership and a review cadence make those changes observable.

RAG is a useful pattern for making LLMs work on enterprise knowledge — but the gap between a prototype and a production system that users actually rely on is significant. The architecture is the easy part. The document processing, evaluation discipline, and monitoring are where the real work is.

*Building a RAG system or evaluating your current one? [Happy to talk through the specifics.](/about)*

## Establish the document contract first

A knowledge base needs rules for which source is authoritative, which version applies and who may read it. A polished answer cannot resolve an undocumented conflict between two policies. Before indexing, identify document owners, effective dates, replacement relationships and access labels. Keep drafts separate from approved material unless the product explicitly supports searching drafts with clear status.

Ingestion should preserve stable source identifiers and locations. A chunk needs enough context to be interpreted outside its original page, but also a reliable route back to that page. Tables may need header repetition, and a footnote can change the meaning of a nearby rule. Treat extraction quality as a testable transformation rather than assuming text output from a parser is faithful to the source.

Use a small representative corpus to compare extraction strategies. Include scanned pages, tables, short FAQs and long policy documents. Human review can establish whether critical clauses survive parsing and whether reading order is correct. This evidence is often more useful than comparing embedding models before the corpus itself is trustworthy.

## Worked example: separate retrieval from answer support

Imagine 150 synthetic questions about an invented internal handbook. One hundred twenty are answerable from the authorized corpus, and thirty deliberately have no supported answer. The retriever returns sufficient evidence for 96 of the 120 answerable questions. The generator produces a fully supported answer for 84 of those 96. For the thirty unanswerable questions, it correctly abstains on 24.

The chart shows 120 answerable cases, 96 with sufficient retrieved evidence, 84 supported answers and 24 correct abstentions. These are not disjoint categories. Retrieval coverage among answerable questions is 96/120, or 80%. Supported-answer coverage is 84/120, or 70%. Correct abstention is 24/30, or 80%, using a different denominator.

If the product defines success as a supported answer when answerable or a correct abstention otherwise, the total is 84 + 24 = 108 of 150, or 72%. That overall score should not replace the component metrics. Improving generation cannot fix the 24 answerable cases where necessary evidence never arrived. Increasing retrieval depth may help those cases but can also introduce distracting or conflicting passages.

These values are hypothetical. A real evaluation needs a documented answerability judgment and access scope for each question. A question may be answerable somewhere in the organization but unanswerable for the current user. The correct response must respect that user's authorized corpus rather than treating withheld information as a retrieval defect.

## Access control belongs before exposure

Filter by tenant and permissions before content enters the prompt. Recheck access when resolving source links, especially if document permissions can change after indexing. A citation should not become an indirect way to reveal the title or existence of a restricted document. Index metadata and answer caches need the same scrutiny as full text.

A shared cache must include the relevant access scope, or contain only material safe for all users sharing it. User identity alone may be insufficient if permissions change. Define invalidation when a document is revoked, replaced or deleted. A stale embedding or summary can preserve sensitive content even after the original file is removed.

Retrieved text remains untrusted input. A document can contain instructions that attempt to redirect the assistant. Separating instructions and evidence improves clarity but is not a complete security boundary. Restrict tools and enforce authorization in the surrounding application so a misleading passage cannot grant itself permission to perform an action.

## Design answers for verification

Citations need a claim-to-evidence relationship. A link to a vaguely related document is not support for the sentence beside it. In evaluation, check whether the cited passage actually entails or directly substantiates the claim, whether it is the right version and whether the reader can access it. Distinguish a quotation from a synthesis across sources.

When sources conflict, present the conflict with effective dates and ownership where available. A source-selection policy can prefer a current approved document over an obsolete draft, but the policy should be explicit and inspectable. Do not ask the model to silently decide which department's policy is authoritative based on writing style or semantic similarity.

Abstention should be useful. Explain what information is missing, identify the relevant source category and suggest a narrower question or responsible owner when known. Avoid inventing a contact or implying that no policy exists simply because retrieval failed. "The available sources do not establish this" is a more accurate statement than a universal claim about the organization's knowledge.

## A practical corpus and retrieval lab

Create twelve fictional handbook documents with two versions of one policy, a table containing an exception and a document restricted to a second tenant. Write twenty questions before implementing retrieval. Label the required source passages, expected answer and whether the current user may access the evidence.

Compare lexical search, dense retrieval and a combined strategy using the same corpus and candidate budget. Measure whether required evidence appears in the retrieved set. Then pass the selected evidence to a fixed generation configuration and evaluate support separately. This isolates retrieval quality from changes in model behavior.

The worksheet should contain question identifier, authorized corpus, required passages, retrieved passages, source versions, final claims, citations and disposition. Include one question whose exact product code is critical and another expressed as a paraphrase. These cases help reveal complementary strengths without assuming one retrieval method always wins.

Delete or revoke one source and rerun the affected questions. Confirm that the index, caches and displayed links reflect the change. Then restore a replacement version and check that answers use its effective date correctly. This lifecycle exercise often exposes operational gaps that a static question-answer benchmark misses.

## Choose storage from measured requirements

Evaluate filtering semantics, update visibility, backup and recovery, index build time, query latency and operational ownership. Approximate vector search introduces a recall tradeoff relative to exact search; measure it under the same filters used in production. An index that performs well without tenant filters may behave differently when a small authorized subset is selected.

Embedding changes require a migration plan. Vectors from different models or incompatible configurations should not be mixed as though their coordinates share meaning. Build a new index or versioned collection, validate it and switch traffic with a rollback path. Keep the source text and metadata sufficient to rebuild the index rather than treating embeddings as the authoritative document store.

## Operate the knowledge lifecycle

Monitor ingestion lag, failed extraction, stale documents, access-filter errors, retrieval coverage and answer support. A service returning fast answers can still be wrong because the latest policy never reached the index. Assign owners for source quality as well as application uptime; the software team cannot repair an undocumented policy conflict alone.

Publish the methodology behind quality claims: corpus scope, question sampling, answerability rules, review process and exclusions. A transparent evaluation helps readers understand what the system can reliably answer and when they should inspect the original source. That is the foundation of a useful enterprise knowledge service, beyond the initial demonstration of fluent text.

## Sources and further study

- [Lewis et al. — Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [Karpukhin et al. — Dense Passage Retrieval](https://arxiv.org/abs/2004.04906)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
