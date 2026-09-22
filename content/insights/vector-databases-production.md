---
title: "Vector Databases in Production: What the Benchmarks Don't Tell You"
description: "Pgvector, Pinecone, Weaviate, Qdrant — each has strong benchmark numbers. The decision that matters is which one fits your operational model, data volume, and query patterns. Here's what actually differentiates them at production scale."
date: 2026-09-11
tags: ["Data Engineering", "AI & MLOps", "Cloud Architecture"]
format: article
---

Vector database benchmarks measure ANN search latency and recall under controlled conditions. They do not measure what happens when you need to filter by metadata, handle multi-tenant data isolation, recover from a node failure at 2am, or explain to your security team how data-at-rest encryption works.

The benchmark leader is not always the right choice. Here's how to think through the decision.

## What a vector database actually needs to do

Before comparing options, be specific about requirements. Most production RAG and semantic search applications need:

- **High-recall ANN search**: find the K most semantically similar vectors quickly. This is what benchmarks measure. Every serious vector database does this reasonably well.
- **Metadata filtering**: "find the 10 most similar documents to this query that are from the last 30 days and belong to this tenant." Pre-filtering vs post-filtering behavior varies significantly between databases and matters for recall accuracy.
- **Hybrid search**: combine dense vector search with sparse keyword search (BM25). Critical for queries with specific terminology or proper nouns that embedding similarity handles poorly.
- **Multi-tenancy**: isolating one customer's vectors from another's. Can be implemented at the collection level, the namespace level, or via metadata filters. Security implications differ.
- **Updates and deletes**: vectors change. Documents get updated. Users delete their data. Not all vector databases handle high-write workloads well.
- **Operational manageability**: backups, restores, monitoring, scaling, upgrades. Often the least-documented dimension.

## The options and where they fit

**pgvector (PostgreSQL extension)**

The case for it: if you're already running PostgreSQL, pgvector adds vector search without adding infrastructure. Your existing backup, monitoring, and access control setup covers it automatically. For workloads under 1-2 million vectors where you don't need cutting-edge ANN performance, it's frequently the right answer.

HNSW index support was added in pgvector 0.5.0, which closed the performance gap with dedicated databases significantly. The query syntax is natural SQL:

```sql
SELECT id, content, 1 - (embedding <=> $1) AS similarity
FROM documents
WHERE tenant_id = $2
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY embedding <=> $1
LIMIT 10;
```

The metadata filtering integrates with standard SQL WHERE clauses — no separate filter language to learn. The limitation: at very large scales (tens of millions of vectors, high concurrent query rates), dedicated databases outperform pgvector.

**Qdrant**

Strong performance, written in Rust, excellent metadata filtering via a flexible payload system. The payload filtering happens during ANN search rather than post-retrieval, which maintains recall accuracy under filtered conditions.

Docker deployment is simple; the managed cloud option (Qdrant Cloud) is available if you prefer not to manage it. The API is clean and the client libraries are well-maintained. For new projects that have outgrown pgvector's scale limits, Qdrant is a strong default.

The operational consideration: it's a relatively young project. The community is active and development is fast, but the operational history is shorter than Elasticsearch or PostgreSQL.

**Weaviate**

Strong hybrid search (BM25 + vector) built in as a first-class feature. Schema-first design with GraphQL API. Good module ecosystem for auto-vectorization (embed text at write time using a configured model). Native multi-tenancy support.

The GraphQL API is opinionated — developers who prefer REST or gRPC find it adds friction. The schema definition is more verbose than alternatives. The multi-tenancy implementation (each tenant gets isolated storage) is well-suited for SaaS applications with data isolation requirements.

**Pinecone**

Fully managed, no operational overhead. Performance and availability are handled by the vendor. The serverless tier (pay per query, no idle cost) is cost-effective for variable-traffic workloads.

The constraints: data leaves your infrastructure (a consideration for regulated industries), the query language is limited compared to self-hosted alternatives, and the cost model at high sustained throughput can be significant. Vendor lock-in is real — migrating off Pinecone requires re-embedding and reinserting data.

Right for: teams that want to move fast without managing infrastructure, or workloads with bursty traffic where serverless pricing is favorable.

**Elasticsearch / OpenSearch**

Established operational tooling, well-understood at scale, existing teams often already know it. The kNN search implementation is solid. Hybrid search is available via reciprocal rank fusion.

The tradeoff: Elasticsearch was not designed as a vector database. Index build times for large HNSW indexes are longer than dedicated alternatives. The JVM heap sizing and GC tuning that Elasticsearch requires is operational complexity that pure vector databases avoid. But if your organization already runs Elasticsearch for full-text search and you're adding semantic search as a capability, using the existing infrastructure is defensible.

## Metadata filtering: the critical difference

Pre-filtering (filter candidates before ANN search) vs post-filtering (ANN search, then filter results) produces different recall under high-selectivity filters.

Post-filtering: retrieve top-K from ANN, then apply the filter. If the filter removes most results (high selectivity), recall drops significantly — you get fewer than K results even though qualifying vectors exist.

Pre-filtering: filter the index to qualifying vectors first, then run ANN on that subset. Recall is maintained under high-selectivity filters, but index pruning degrades ANN accuracy if the filtered subset is small.

The practical implication: if your application regularly queries with filters that select a small fraction of the total index (e.g., "vectors from this user" in a multi-tenant system with thousands of users), verify how your chosen database handles high-selectivity filtering. Qdrant's payload filtering and Weaviate's multi-tenancy are explicitly designed for this. Post-filtering implementations (including some pgvector query patterns) can produce poor recall.

## The operational question

The technical capabilities converge. The operational differences persist.

Questions worth answering before committing:

- How is backup and restore tested? What's the recovery time for a full restore?
- How does the database behave when the ANN index is being rebuilt? Can it serve queries during reindex?
- What does monitoring look like? Is there native Prometheus/OpenTelemetry support?
- How are schema or configuration changes applied in production without downtime?
- What is the upgrade path between major versions?

These questions have good answers for PostgreSQL/pgvector (years of operational practice), reasonable answers for Qdrant and Weaviate (active development, documented procedures), and vendor-opaque answers for fully managed services like Pinecone.

*Choosing or migrating a vector database for a production AI application? The right answer depends heavily on your existing stack and operational model. [Happy to think through the specific trade-offs.](/contact)*
