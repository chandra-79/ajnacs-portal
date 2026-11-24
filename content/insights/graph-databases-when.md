---
title: "Graph Databases: When Relationships Are the Workload (and When They're Just Joins)"
description: "Compare graph traversal with relational queries, calculate branching growth, and evaluate graph adoption against a representative workload."
date: 2027-03-15
tags: ["Data Engineering", "Graph", "Architecture", "AI Adoption"]
format: article
---

Graph databases occupy a perennial hype-and-neglect cycle: periodically declared the future of all data (relationships are everywhere!), then quietly shelved when the pilot discovers that most "graph problems" were three joins wearing a trench coat. Both halves of the cycle miss the same distinction, which is the entire selection criterion: **relational databases handle relationships fine when you know the shape of the question; graph databases are candidates when traversal paths are central to the workload.** Knowing which side of that line your workload lives on is worth more than any benchmark.

## The line, precisely

SQL joins are static: a query names its tables and join conditions in advance — "customers and their orders and those orders' items" is three joins, known at write time, and the relational engine (with the index disciplines) executes it superbly. The questions that break this model share a signature — *the traversal depth varies or relationship paths are central to the question*: "is this new account connected to any known-fraud account within five hops, through any combination of shared devices, addresses, and payment instruments?"; "what's the full blast radius if this service fails?" (the dependency-graph traversals under every impact analysis); "can this user reach this resource through any chain of group memberships and role inheritances?" (the access-path analysis from IAM practice — the privilege-escalation-path tooling is a graph query engine in a security costume); "how are these two entities related at all?" (the shortest-path question underneath investigation tools). Expressing variable-depth traversal in SQL means recursive CTEs — possible, and legitimately fine for modest cases — but performance diverges structurally: a relational engine answers "who are Alice's connections' connections" through recursive joins and available indexes, while a native graph store answers by *pointer-chasing from Alice* — cost proportional to the subgraph actually touched, not the dataset size (adjacency-oriented storage can make local edge access efficient, while branching still increases total work). When traversals are deep, branching, and local, the performance difference must be measured on the same query semantics; when they're shallow and fixed, it's irrelevant and the relational estate's operational maturity wins by default.

## The model and the ecosystem, briefly

The **property graph** — nodes and directed edges, both carrying key-value properties, both typed/labeled — is the model that won the market (RDF/SPARQL persists in formal-ontology and linked-data niches, with real strengths where standards-based knowledge representation is the actual requirement). Query languages converged on pattern-matching syntax (Cypher-style path matching, alongside the distinct ISO **GQL** graph-query standard — the first new ISO database-language standard since SQL, which signals the category's institutional arrival; SQL itself grew property-graph-query extensions, the databases-absorbing-features pattern as ever). The engine landscape sorts by the usual axes: native graph stores (Neo4j-lineage), cloud-managed services, multi-model databases with graph layers, and the analytics-scale tier (graph algorithms — PageRank, community detection, centrality — run batch-style over warehouse data, which for many "graph insights" use cases is the honest answer: you needed graph *algorithms*, not a graph *database*, and the distinction is operational: OLTP-style traversal serving versus periodic analytical computation).

**The AI current re-energizing the category:** knowledge graphs as grounding infrastructure for LLM systems — **GraphRAG**-style architectures that can use entity relationships, graph-derived summaries and vector retrieval in different combinations. They are candidates for multi-hop questions or corpus-level synthesis that a simple nearest-neighbor retrieval pipeline may answer poorly, and providing a structured retrieval substrate whose evidence quality and access controls still require evaluation. The context-engineering frame applies directly: a curated knowledge graph is a machine-legible model of *what the organization knows*, and the graph query is a precision retrieval tool in the context-assembly pipeline. This is one motivation for evaluating graph retrieval — and it inherits all the curation economics of any knowledge system (the graph is a *derived, governed* artifact with pipelines, ownership, and staleness SLOs, per every derived-store discipline).

## The adoption traps

The failure modes are consistent enough to enumerate: **the everything-graph** ("all data is connected, let's put it all in the graph" — the graph as primary operational store for CRUD-shaped workloads buys you traversal power you don't use and gives up the relational/document ecosystems' maturity where you needed it; the polyglot placement rule applies — graph for the traversal-shaped slice, fed from systems of record via the CDC rails), **modeling by naïveté** (graph modeling has its own grain-declaration discipline: what's a node versus a property, which relationships are edges versus attributes, and — the classic — the **supernode problem**: the celebrity account or mega-hub entity with millions of edges that turns every traversal through it into a table scan wearing graph clothes; the mitigations — relationship partitioning, hub-type redesign — are the hot-partition playbook, again), **write-scale surprise** (many graph stores' strengths are read-traversal; high-volume ingest needs the same batching-and-backpressure engineering as any pipeline, and distributed graph partitioning remains genuinely hard — cross-partition traversals reintroduce the network hops that index-free adjacency was supposed to delete; sharding a graph is a research area wearing a product sticker, so size the single-machine story honestly first), and **the skills cliff** (Cypher is learnable in days, graph modeling requires domain knowledge and deliberate practice — budget the ramp, and keep the first use case narrow and traversal-obviously-shaped).

The placement summary: reach for a graph database when variable-depth traversal is the query shape (fraud, access paths, dependencies, investigations, recommendations-by-path), when relationship metadata is rich and first-class, or when a governed knowledge graph is grounding your AI systems; stay relational (with recursive CTEs for the occasional excursion) when hops are fixed and shallow; and run graph *algorithms* analytically over warehouse data when the need is periodic insight rather than serving. The relationships were always in your data — the question is only whether the paths through them are your workload or your trench coat.

## Bound the traversal before choosing a storage engine

Variable-depth traversal can be useful in a graph database, but depth alone does not guarantee a performance advantage. Branching factor, cycles, edge types, starting-node selectivity and the requested result all determine work. Returning every possible path can be exponentially more expensive than answering whether any qualifying path exists. Define the question precisely before comparing query languages.

A relational recursive CTE can traverse an adjacency table using suitable indexes; it does not necessarily scan whole tables at every hop. A native graph engine can also explore a very large subgraph. Both need a good starting point and bounded search. Compare the same semantics, including duplicate-path handling and cycle rules, rather than a poorly indexed SQL query against a carefully tuned graph query.

### A hypothetical branching calculation

In a tree-shaped synthetic graph where each node has three new children, depth one contains three reachable nodes, depth two contains nine, depth three contains twenty-seven and depth four contains eighty-one. The cumulative nonroot population through depth four is 3+9+27+81=120. The chart shows the per-depth counts. The fourth hop does not cost the same as the first merely because adjacency lookup is efficient.

Real graphs have shared neighbors, cycles and uneven degree, so these values are not a benchmark. They illustrate the need to limit relationship types, depth and result cardinality. A supernode with a million neighbors can dominate even a shallow query. Record degree distributions and evaluate the actual high-degree cases before claiming that local traversal is cheap.

## Model evidence, identity and time

In a dependency graph, distinguish a service, a deployed instance and a version. An edge meaning “calls” should specify direction, environment, observation source and validity interval. A historical trace showing one call is not necessarily proof of a permanent dependency. A manually declared edge and an observed runtime edge can coexist if their provenance is explicit.

Entity resolution is part of correctness. Two records with similar names may represent different services, and one service may have several aliases. Preserve source identifiers and the mapping decision rather than merging by display label alone. Incorrect identity merges can create false paths that look convincing in a visualization. Graphs make relationships visible; they do not make those relationships true.

Temporal questions need temporal edges or snapshots. “Who can access this resource now?” differs from “Who could access it when the incident happened?” Model grants, revocations and group membership intervals accordingly. A current graph cannot reconstruct past authorization unless the relevant history was retained.

## Query semantics must match the decision

For reachability, specify whether relationships are directed, whether repeated nodes are allowed and whether the query seeks any path, the shortest path or all paths. A shortest path by hop count is not necessarily the least-cost path when edges have weights. A graph algorithm must use the intended weight definition, including restrictions on negative weights where relevant.

Authorization analysis needs particular care. A path through group memberships may indicate potential access, but actual permission can depend on deny rules, conditions, resource scope and runtime context. Do not treat simple reachability as a complete policy evaluator unless the graph model faithfully implements those semantics. Validate against known allow and deny cases from the authoritative system.

Fraud connections also require interpretation. Shared addresses or devices can be legitimate, especially in households or shared networks. A connected component is evidence for investigation, not automatic proof of wrongdoing. Keep explanatory context and avoid overstating association as causation in automated decisions or published case studies.

## GraphRAG adds an extraction and evaluation problem

A graph built from documents can support retrieval across entities and relationships, but extracted edges may be wrong or incomplete. Keep links from nodes and edges to source passages, record extraction versions and distinguish direct statements from inferred relationships. A generated community summary is another derived artifact that needs evaluation and refresh.

Compare graph-based retrieval with lexical, vector and hybrid baselines on a representative question set. Include questions requiring local facts, multi-document synthesis and no available answer. Evaluate source support and answer correctness, not only whether the graph returns an attractive path. A graph does not inherently prevent hallucination, and its indexing cost can be substantial.

Access controls must apply to retrieved evidence and derived summaries. A summary combining restricted documents can disclose information even if the final citation list hides the source. Test permissions at the graph construction and query boundaries, and define how deletions propagate to edges, indexes and summaries. Freshness and authorization are part of retrieval quality.

### A comparison lab

Create a small dependency fixture containing a chain, a diamond-shaped shared dependency, a cycle, a disconnected service and a high-degree hub. Implement bounded reachability in a relational adjacency table and a graph store. Verify identical expected node sets before timing either implementation. Add an index on the starting identifier and inspect execution plans in both engines.

Then ask for all paths and observe the increase in work relative to returning distinct reachable nodes. Add a maximum depth and relationship-type filter. Record latency, visited or intermediate rows, memory and result count. The exercise should reveal which query shape benefits from the chosen engine and which becomes expensive regardless of storage model.

## Operate the graph as a maintained product

Define ingestion lag, failed-edge handling, duplicate detection and deletion semantics. If the graph is derived from a transactional source, retain a rebuild procedure and reconcile a known source interval. A graph that cannot be rebuilt reliably can become an undocumented second source of truth.

The adoption record should state the query family, the measured advantage, the modeling obligations and the fallback if ingestion is stale. Keep the first scope narrow enough to operate. A graph database earns its place when it makes a necessary relationship workload correct, understandable and performant within a measured budget—not simply because the underlying data contains connections.

### Figure methodology

Synthetic acyclic tree has branching factor 3 and no shared descendants. Nodes at depth d equal 3^d:3,9,27,81; total through depth 4 is 120 excluding root. Real graphs have cycles, skew and overlap; this is not a database benchmark.

| Worked observation | nodes at depth |
| --- | ---: |
| Depth 1 | 3 |
| Depth 2 | 9 |
| Depth 3 | 27 |
| Depth 4 | 81 |

## Primary references and further study

- [Neo4j query tuning guidance](https://neo4j.com/docs/cypher-manual/current/planning-and-tuning/query-tuning/)
- [PostgreSQL recursive queries and cycle handling](https://www.postgresql.org/docs/current/queries-with.html)
- [Microsoft GraphRAG documentation](https://microsoft.github.io/graphrag/)
