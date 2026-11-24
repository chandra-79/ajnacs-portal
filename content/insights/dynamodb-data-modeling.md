---
title: "DynamoDB Data Modeling: Designing for Access Patterns Instead of Entities"
description: "Model DynamoDB access patterns, partition keys and indexes, then test capacity, conditional writes and hot-key behavior."
date: 2027-04-02
tags: ["Data Engineering", "NoSQL", "Cloud Architecture", "Architecture"]
format: article
---

DynamoDB-style modeling breaks relational engineers in a specific, predictable way: they design entities and relationships first (as trained), then discover the query they need is impossible without a full-table scan, then blame the database. The inversion the Dynamo family demands — and rewards with scalable managed access within documented limits and workload-dependent behavior — is total: **you cannot model the data until you have enumerated the questions.** Relational modeling normalizes entities and lets the optimizer answer arbitrary queries later; Dynamo modeling starts from the access patterns and shapes the table so *each important question has a bounded key-based access path* — because that's the only kind of question the engine answers well, and that constraint is precisely what makes its scaling promises keepable.

## The physics: partitions, keys, and why scans are a lie

The mental model that explains every rule: a table is a managed key-value and document database whose partition keys guide data distribution. The **partition key** determines the item collection and guides physical placement; the optional **sort key** orders items within that logical collection and enables range queries. A logical item collection and a physical storage partition are not interchangeable terms. Everything the engine does cheaply follows: get-by-full-key (one item), query-by-partition-key (one logical item collection, a sorted range — `begins_with`, `between`, forward/backward, limited) — and everything it does badly follows too: cross-partition questions (scans touch *every* partition and are priced and paced accordingly — frequent broad scans require explicit cost and latency justification, while bounded administrative or analytical scans can be legitimate), and hot keys (table or index capacity and per-physical-partition limits both matter; adaptive capacity can redistribute capacity or placement, but cannot make one hot item unbounded — the whale-tenant problem from every multi-tenant discipline, here as a hard physical limit; the mitigations — key salting/sharding hot items, caching in front — are the consistent-hashing skew playbook verbatim).

Item collections (one partition key, many sort-keyed items) are the unit of cheap relational-ish behavior: "give me this customer's recent orders" is a key-bounded query *if* orders share the customer's partition-key value. Adaptive capacity may split a collection by sort-key ranges when permitted; local secondary indexes constrain that splitting — which is the design insight the whole discipline builds on.

## Single-table design: pre-joined answers, not entity purity

The famous (and famously confusing) pattern — many entity types in one table with generic `PK`/`SK` attributes — is not aesthetic minimalism; it's **materializing joins at write time**. The relational join ("customer with their orders and addresses") becomes a *layout decision*: store the customer item at `PK=CUST#123, SK=PROFILE`, orders at `PK=CUST#123, SK=ORDER#2026-07-01#...`, addresses at `SK=ADDR#...` — and the "join" is one partition query returning heterogeneous items the application assembles. The sort key becomes a compositional instrument (entity-type prefixes for selective `begins_with`, timestamps for chronology, hierarchical paths for drill-down — the composite-index design rules, played on one string), and item-type discriminator attributes keep the zoo legible.

The honest costs, because single-table design gets sold with too much mystique: the model is **write-time-committed to its questions** (a new access pattern that doesn't fit the key structure is a migration or an index — the schema-on-write of questions, not just fields), the table is **illegible without documentation** (the access-pattern catalog — every question, mapped to its key expression — *is* the schema; maintaining it is non-optional, and its absence is why inherited Dynamo tables feel like archaeology), and **broad analytical workloads often benefit from a separate derived store** (the answer to "sum revenue by region by month" is the CDC-style stream out to the warehouse — the derived-store discipline; Dynamo serves the application's known questions, the lakehouse serves the unknown ones). Modern practice has also relaxed the "single table" absolutism: the real principle is *model item collections around access patterns* — whether that lands in one table or a few is secondary; the anti-pattern was never table count, it was entity-per-table normalization with application-side joins.

## GSIs: every index is a materialized question

Global Secondary Indexes answer the questions your primary key can't — "orders by status," "users by email" — by maintaining a *second copy* of (projected) data under a different key structure. Read them through the systems lens and the operational rules write themselves: a GSI is an **asynchronous, eventually-consistent replica** (read-after-write against a GSI is the replication-lag conversation again — design flows accordingly), it has **its own capacity and its own hot-partition physics** (a GSI keyed on `status` where 90% of items are `ACTIVE` has re-concentrated everything the base table's key spread out — low-cardinality GSI keys are the classic self-inflicted hotspot), and a **throttled GSI back-pressures base-table writes** (the index you added for one dashboard can brown out your write path — capacity-plan indexes like the tables they secretly are). Project only the attributes the question needs (indexes are priced by what they carry), and use the sparse-index trick deliberately: items missing the GSI key simply don't appear — a maintained sparse access path ("only items needing review") that replaces scan-and-filter with a tiny index.

## The judgment layer: when this model earns its constraints

Dynamo-style stores are the right answer when the workload matches the physics: **known, enumerable access patterns** whose scale and latency requirements can be validated against the configured service limits (the session store, the cart, the profile service, the IoT ingest, the multi-tenant SaaS backbone), operations tolerance for eventual consistency at the edges, and the serverless operational posture as a first-class virtue (managed infrastructure with capacity-mode, quota, recovery and replication choices that still require engineering). The wrong-fit signals are equally legible: **query flexibility as a requirement** (ad-hoc filters, evolving questions, rich search — that's Postgres with real indexes, or the search-engine tier, or both), **transactional breadth** (Dynamo's transactions exist but are bounded and priced; invariant-heavy domains with cross-entity constraints live more honestly at serializable-capable relational stores — the isolation-levels toolkit needs its tools), and **workloads where a relational model and existing operator experience provide a simpler fit** — below the scale where Dynamo's ceilings matter, a boring relational database answers every question you haven't thought of yet, which early products generate weekly (the premature-optimization judgment, applied to storage selection).

The transferable lesson outlasts the product: designing *from access patterns* — enumerating the questions, shaping storage so each is one cheap operation, and paying for flexibility only where you'll use it — is simply what data modeling looks like when the optimizer can't save you. Relational engineers who learn it report the strange side effect: their relational schemas get better too, because "what are the questions?" was always the right first question — SQL just let everyone postpone it.

## Write an access-pattern contract

For each application operation, record its partition-key condition, sort-key condition, required attributes, result bound, consistency requirement and expected rate. Include support and reconciliation workflows, not only the main request path. A query for one customer can still return enough items to require pagination; a key-based API is not an unlimited constant-time result operation.

A hypothetical order service needs to fetch one order, list a customer's recent orders and find orders awaiting dispatch. These may use a primary key and a secondary index with different item populations. Explain how each key is formed and escaped, how timestamps sort and how identifiers prevent collisions. A string prefix convention is an application schema that needs versioning and tests just as much as a relational column definition.

Single-table design can group related item types efficiently, but it is not mandatory. Separate tables can simplify permissions, retention or operational ownership. Compare the access paths and lifecycle requirements before choosing. The relevant success criterion is bounded, correct work under the expected distribution, not the smallest number of tables.

### A hypothetical filter-efficiency example

Suppose a query's key condition identifies 1,000 items, but a filter expression returns only twenty. The returned fraction is 20/1,000 =2 percent. If a better key or appropriate index condition identifies exactly the twenty required items, the evaluated candidate count falls from 1,000 to twenty, a fiftyfold reduction in this constructed example. The chart compares evaluated candidates and returned results.

These counts do not directly specify billed read units: item sizes, consistency mode, request boundaries and minimum charges matter. DynamoDB applies filter expressions after reading the matching key population, so filtering is not a substitute for a selective access path. A page can return few or no items and still include a continuation key. Iterate until the API indicates completion, not until the filtered result happens to be empty.

## Model hot keys and item collections

A logical partition key and a physical storage partition are not interchangeable concepts. DynamoDB manages physical partitions and adaptive behavior internally; application design should still avoid concentrating an unsustainable amount of traffic on one key or small key set. Test the largest tenant and busiest item, not just uniformly random keys.

Write sharding can spread a hot logical workload across several keys, but it changes reads. A recent-orders query may need multiple requests and a merge, and changing the shard count requires a migration strategy. Record how the reader discovers shard versions and how pagination works across them. A synthetic uniform hash distribution does not establish production balance when one item remains individually hot.

Caching can reduce repeated reads but introduces invalidation and staleness decisions. A cache does not safely solve a write hotspot or a strict uniqueness invariant by itself. Keep the source-of-truth operation and conditional update behavior explicit. Measure useful completed operations, throttled requests and retries separately so retry amplification is not mistaken for demand growth.

## Consistency is an operation-level choice

A global secondary index is maintained asynchronously and does not provide strongly consistent reads. An application that writes an order and immediately searches a GSI may not find it yet. For a read-after-write flow, return the known result or use an appropriate primary-table read path when the guarantee is required. Do not treat a missing index result as proof that the original write failed.

GSI keys are not inherently unique. If email uniqueness is a business invariant, a GSI lookup followed by a write is vulnerable to concurrent requests. Design a conditional reservation or transaction protocol with an explicit uniqueness item and test concurrent creation. The exact pattern depends on scope and lifecycle, including deletion and reassignment.

A sparse index includes only items with the required index-key attributes, which can efficiently represent a subset such as pending review. Maintaining that subset still costs writes and storage. Define which state transition adds or removes the key attributes and how a repair job detects drift. It is a materialized access path with operational obligations, not a free filtered view.

## Transactions and retries preserve invariants

DynamoDB supports conditional operations and bounded transactions. Evaluate the documented limits, isolation behavior and cost against the actual invariant. A relational database is not automatically required simply because several items must change, and a document/key-value product is not automatically suitable simply because the traffic is large.

For any mutation, define a stable operation identifier and handle uncertain responses. A timeout can occur after the service accepted a write. Retrying with a new identifier can create duplicate business effects. Use the supported idempotency mechanism or an application record with conditional semantics, and understand its retention period. External payments or notifications require their own boundary protocol even if the DynamoDB transaction is atomic.

### An adversarial modeling exercise

Build fixtures for one small customer, one very large customer, an order with many line items and a burst of updates to one status. Exercise every access pattern and record pages read, consumed capacity where available, throttles and end-to-end latency. Add a filter that rejects the entire first page and verify that pagination still reaches later matching items.

Simulate a delayed GSI update in the application test harness, a conditional-write conflict and a response lost after a successful mutation. Verify the user-visible behavior rather than only the SDK return shape. A local emulator can validate parts of application logic, but it does not prove managed-service partition behavior or production capacity. Run a bounded cloud test for those properties with an explicit budget.

## Evolve the model without losing the old path

A new access pattern may require a new index, derived collection or analytical export. Stage the new representation, backfill historical items, validate coverage and switch readers only when the required population is available. Keep the old path during the supported rollback window. Monitor index creation and ongoing write pressure rather than treating an index addition as metadata-only.

Publish the access-pattern catalog with the schema and infrastructure configuration. Include consistency, pagination and failure behavior for each operation. The model remains understandable when a new engineer can explain how an application question maps to bounded storage work and which assumptions would force that mapping to change.

### Figure methodology

Synthetic key condition selects 1,000 items and a filter returns 20, or 2%. A redesigned key/index condition selects 20, reducing candidate evaluation 50×. Actual read capacity depends on item size, consistency and request boundaries; this is not a billed-cost estimate.

| Worked observation | items |
| --- | ---: |
| Broad key candidates | 1000 |
| Returned after filter | 20 |
| Selective key candidates | 20 |

## Primary references and further study

- [DynamoDB modeling best practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-modeling-nosql.html)
- [DynamoDB query filter semantics](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.FilterExpression.html)
- [DynamoDB global secondary indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
- [DynamoDB adaptive capacity and item-collection splitting](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/burst-adaptive-capacity.html)
