---
title: "Vector Databases in Production: What the Benchmarks Don't Tell You"
description: "Evaluate vector retrieval with eligible-result recall, filtering and index behavior, then test relevance, latency and recovery on a synthetic corpus."
date: 2027-03-10
tags: ["Data Engineering", "AI & MLOps", "Cloud Architecture"]
format: article
---

Vector database benchmarks measure ANN search latency and recall under controlled conditions. They do not measure what happens when you need to filter by metadata, handle multi-tenant data isolation, recover from a node failure at 2am, or explain to your security team how data-at-rest encryption works.

The benchmark leader is not always the right choice. Here's how to think through the decision.

## What a vector database actually needs to do

Before comparing options, be specific about requirements. Most production RAG and semantic search applications need:

- **High-recall ANN search**: find the K most semantically similar vectors quickly. This is what benchmarks measure. The acceptable recall/latency trade must be measured for the workload.
- **Metadata filtering**: "find the 10 most similar documents to this query that are from the last 30 days and belong to this tenant." Pre-filtering vs post-filtering behavior varies significantly between databases and matters for recall accuracy.
- **Hybrid search**: combine dense vector search with sparse keyword search (BM25). Critical for queries with specific terminology or proper nouns that embedding similarity handles poorly.
- **Multi-tenancy**: isolating one customer's vectors from another's. Can be implemented at the collection level, the namespace level, or via metadata filters. Security implications differ.
- **Updates and deletes**: vectors change. Documents get updated. Users delete their data. Not all vector databases handle high-write workloads well.
- **Operational manageability**: backups, restores, monitoring, scaling, upgrades. Often the least-documented dimension.

## The options and where they fit

**pgvector (PostgreSQL extension)**

The case for it: if you're already running PostgreSQL, pgvector adds vector search without adding infrastructure. Existing PostgreSQL operations can be reused, with extension, index and restore behavior verified. Evaluate it when keeping vector data alongside existing PostgreSQL data simplifies the operating model.

HNSW index support was added in pgvector 0.5.0, which closed the performance gap with dedicated databases significantly. The query syntax is natural SQL:

```sql
SELECT id, content, 1 - (embedding <=> $1) AS similarity
FROM documents
WHERE tenant_id = $2
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY embedding <=> $1
LIMIT 10;
```

The metadata filtering integrates with standard SQL WHERE clauses — no separate filter language to learn. Capacity depends on dimensions, filters, indexes, hardware and concurrency; compare candidates with a representative workload.

**Qdrant**

Strong performance, written in Rust, excellent metadata filtering via a flexible payload system. The payload filtering happens during ANN search rather than post-retrieval, with workload-dependent recall that still needs measurement.

Docker deployment is simple; the managed cloud option (Qdrant Cloud) is available if you prefer not to manage it. The API is clean and the client libraries are well-maintained. Evaluate Qdrant when its filtering, deployment and operations model match the requirements.

The operational consideration: it's a relatively young project. The community is active and development is fast, but the operational history is shorter than Elasticsearch or PostgreSQL.

**Weaviate**

Strong hybrid search (BM25 + vector) built in as a first-class feature. Schema-first design with GraphQL API. Good module ecosystem for auto-vectorization (embed text at write time using a configured model). Native multi-tenancy support.

The GraphQL API is opinionated — developers who prefer REST or gRPC find it adds friction. The schema definition is more verbose than alternatives. The multi-tenancy implementation (each tenant gets isolated storage) is well-suited for SaaS applications with data isolation requirements.

**Pinecone**

Managed infrastructure, with application governance and service operations still required. Performance and availability are handled by the vendor. The serverless tier (pay per query, no idle cost) is cost-effective for variable-traffic workloads.

The constraints: data leaves your infrastructure (a consideration for regulated industries), the query language is limited compared to self-hosted alternatives, and the cost model at high sustained throughput can be significant. Vendor lock-in is real — migration requires a tested export/import path; re-embedding is needed only if the representation changes or existing vectors cannot be recovered.

Right for: teams that want to move fast without managing infrastructure, or workloads with bursty traffic where serverless pricing is favorable.

**Elasticsearch / OpenSearch**

Established operational tooling, well-understood at scale, existing teams often already know it. The kNN search implementation is solid. Hybrid search is available via reciprocal rank fusion.

The tradeoff: Elasticsearch was not designed as a vector database. Index build time should be measured against alternatives using equivalent data and configuration. The JVM heap sizing and GC tuning that Elasticsearch requires is operational complexity that pure vector databases avoid. But if your organization already runs Elasticsearch for full-text search and you're adding semantic search as a capability, using the existing infrastructure is defensible.

## Metadata filtering: the critical difference

Pre-filtering (filter candidates before ANN search) vs post-filtering (ANN search, then filter results) produces different recall under high-selectivity filters.

Post-filtering: retrieve top-K from ANN, then apply the filter. If the filter removes most results (high selectivity), recall drops significantly — you get fewer than K results even though qualifying vectors exist.

Pre-filtering: filter the index to qualifying vectors first, then run ANN on that subset. Recall depends on the engine's filtered-search strategy, candidate exploration and exact-fallback behavior.

The practical implication: if your application regularly queries with filters that select a small fraction of the total index (e.g., "vectors from this user" in a multi-tenant system with thousands of users), verify how your chosen database handles high-selectivity filtering. Qdrant's payload filtering and Weaviate's multi-tenancy are explicitly designed for this. Post-filtering implementations (including some pgvector query patterns) can produce poor recall.

## The operational question

The technical capabilities converge. The operational differences persist.

Questions worth answering before committing:

- How is backup and restore tested? What's the recovery time for a full restore?
- How does the database behave when the ANN index is being rebuilt? Can it serve queries during reindex?
- What does monitoring look like? Is there native Prometheus/OpenTelemetry support?
- How are schema or configuration changes applied in production without downtime?
- What is the upgrade path between major versions?

These questions have good answers for PostgreSQL/pgvector (years of operational practice), reasonable answers for Qdrant and Weaviate (active development, documented procedures), and service-specific answers that must be checked for the selected managed offering.

*Choosing or migrating a vector database for a production AI application? The right answer depends heavily on your existing stack and operational model. [Happy to think through the specific trade-offs.](/contact/)*

## Define recall against an exact filtered reference

An approximate nearest-neighbor index trades some retrieval completeness for resource and latency benefits. Evaluate it against an exact search over the same eligible population using the same distance metric. For a tenant-restricted query, the reference set must contain only records that tenant is authorized to access. Comparing filtered approximate results with unfiltered exact results measures a different problem.

ANN recall and semantic relevance are different metrics. Recall@k asks how many of the exact nearest neighbors were recovered. A nearest neighbor can still be unhelpful for the user's question because the embedding model, chunking or corpus is poor. Maintain human relevance judgments or task-level evaluation alongside index recall. A system can have perfect ANN recall and still produce unsupported answers.

### A hypothetical recall comparison

Take five fixed queries, each with ten exact eligible nearest neighbors. There are fifty reference neighbor positions across the query set. Configuration A recovers thirty-five, giving micro-averaged recall@10 of 35/50=70 percent. Configuration B recovers forty-five, giving 90 percent; configuration C recovers forty-eight, giving 96 percent. The chart shows these invented recall values.

These are not vendor benchmark results and do not imply a latency ordering. Record latency, memory, build time and update throughput separately for a real experiment. Preserve the query set, corpus snapshot, embedding model, distance metric, filters and index parameters. If some queries have fewer than ten eligible records, define the denominator consistently rather than silently treating them as full ten-neighbor cases.

## Filter behavior is more nuanced than two labels

Products combine filtering, index traversal, exact fallback and iterative candidate expansion in different ways. A “pre-filter” label does not guarantee exact recall, and a “post-filter” path need not remain limited to one fixed candidate set. The current pgvector documentation describes iterative index scans that can search further until enough qualifying results are found or a configured limit is reached. Test the deployed version and query plan.

Evaluate filters selecting broad, narrow and empty populations. Include correlated filters, such as one tenant containing semantically similar documents, and many small tenants sharing an index. Check result count and recall separately: returning ten records does not prove they are the correct nearest ten, while returning fewer than ten may be legitimate when fewer eligible records exist.

Metadata schema matters too. A nested filter requiring two conditions on the same array element differs from two independent conditions satisfied by different elements. Use the product's explicit nested semantics where needed and add adversarial fixtures. Authorization filters must be enforced by trusted server logic or database policy, not accepted unchecked from a client request.

## Estimate storage before comparing instance sizes

For a simple raw-vector estimate, one million vectors with 768 float32 components require 1,000,000×768×4=3,072,000,000 bytes, approximately 2.86 GiB before row overhead, metadata, index structures, replicas and backups. HNSW adds graph structures and runtime memory requirements; compression changes precision and resource use. Use actual stored and resident sizes rather than equating raw vector bytes with the complete deployment footprint.

Measure build and rebuild time with the corpus size and insertion order documented. A system that meets search latency only after a long offline build needs a workable update and recovery plan. Test deletes, replacement embeddings and sustained ingestion while queries run. Tombstones or fragmentation can affect performance, so include a maintenance interval in longer tests.

## Keep embedding versions separate

Vectors from different embedding models or incompatible preprocessing pipelines generally should not be mixed in one distance space. Record model identifier, dimensions, normalization, chunking version and source revision with each vector. A document edit can require deletion of old chunks and insertion of new ones; stable document identifiers alone do not remove stale chunk records.

A model migration can use a new index or collection, backfill the corpus, evaluate relevance and then switch queries. Maintain a rollback path during the overlap. Re-embedding is required when changing the embedding representation, but changing database vendors does not inherently require re-embedding if the existing vectors and metadata can be exported in a compatible form. Test portability before committing to a service.

## Security and recovery need explicit verification

Namespace, collection and row-filter designs provide different operational boundaries. Verify authentication, authorization, backup access and deletion behavior for the actual configuration. Existing PostgreSQL controls may be reusable with pgvector, but extension versions, index rebuilds and resource contention still need testing. A managed service transfers some infrastructure work to the provider; it does not remove application access control, backup planning or incident response.

Restore a representative backup into a separate environment and run the fixed evaluation set. Check vector counts, metadata, permissions and recall after recovery. If an index can be rebuilt from source vectors, measure the rebuild time as part of recovery time rather than treating the source export as instantly searchable. Record how long deleted or restricted data can remain in backups under the retention policy.

### A production-selection worksheet

Choose two candidates that fit the team's operating model. Load the same corpus and run the same filtered query set at a controlled arrival rate. Report p50 and p95 latency, timeout rate, recall, resource use and ingest lag. Repeat with a hot tenant, a restrictive permission filter and concurrent updates. Avoid tuning one candidate extensively while leaving the other at defaults without saying so.

Add a failure case: restart a node or interrupt an indexing job in a disposable environment. Verify query behavior, recovery and operator steps. Compare total cost using dated prices and the measured workload, including replicas, backups, transfer and embedding generation where relevant. Product choice should follow this evidence rather than a fixed “millions of vectors” cutoff.

## Evaluate the complete retrieval workflow

Hybrid retrieval can improve exact-term queries, but fusion and reranking need their own evaluation. Keep lexical and vector candidate sets, fusion parameters and reranker versions reproducible. Test proper names, codes, ambiguous terms and questions with no answer in the corpus. A high-scoring passage is not proof that it supports the final answer.

Publish the methodology and limitations with any performance chart. Distinguish synthetic fixtures from measured deployments and avoid turning a local benchmark into a universal product ranking. The durable selection criteria are correct eligible results, useful relevance, predictable operations and a recoverable data lifecycle.

### Figure methodology

Synthetic five-query set has ten exact eligible neighbors per query,50 total reference positions. Configurations recover 35,45 and 48, giving 70%,90%,96% micro-averaged recall@10. Same corpus, filters and distance are assumed; no latency or vendor ranking is claimed.

| Worked observation | percent recall at 10 |
| --- | ---: |
| Configuration A | 70 |
| Configuration B | 90 |
| Configuration C | 96 |

## Primary references and further study

- [pgvector indexing, filtering and iterative scans](https://github.com/pgvector/pgvector)
- [Qdrant filtering and nested semantics](https://qdrant.tech/documentation/search/filtering/)
- [PostgreSQL backup approaches](https://www.postgresql.org/docs/current/backup.html)
