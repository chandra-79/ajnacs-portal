---
title: "JSONB in Postgres: Hybrid Modeling Without Rebuilding MongoDB Badly"
description: "Choose relational columns and JSONB deliberately, compare indexing options, and test schema constraints and candidate-row reduction."
date: 2028-05-31
tags: ["Data Engineering", "Programming", "Data Modeling"]
format: article
---

The relational-versus-document argument quietly lost its subject: Postgres (and its peers) absorbed the document model — JSONB with real indexing, a full path-query language, and transactional semantics — which moved the decision from "which database" to **"which columns."** That's a better decision to have, and a subtler one: the hybrid model done well gets relational integrity where structure is stable and document flexibility where it isn't; done lazily, it produces the worst artifact in modern data modeling — the relational database cosplaying as a document store, with neither the constraints of the former nor the ergonomics of the latter, and a `data` column nobody can explain.

## The placement rule: structure by stability and query shape

The honest criteria for what belongs in JSONB versus columns: **query and constraint participation** — fields with stable types and heavy query or constraint participation are strong candidates for typed columns, because columns are where the relational engine's whole value proposition lives: statistics for the planner (the estimate-accuracy machinery from query-plan practice sees into columns and mostly guesses at JSONB paths), constraint enforcement, and cheap indexing. **Genuine schema variance** belongs in JSONB — the payload shapes that differ per integration (parsed webhook payloads from delivery practice; preserve the original bytes separately when signature verification or exact replay needs them, because JSONB normalizes representation and discards duplicate object keys), per-tenant custom fields (the multi-tenancy extensibility problem, solved without the EAV anti-pattern or per-tenant DDL), sparse attribute sets (the product catalog where each category carries different specs — the classic legitimate case), and the audit/event payloads whose *shape* is historical fact rather than current contract. The tell for misplacement in each direction: a JSONB path appearing in every WHERE clause is a column wearing a costume (promote it); a table with forty mostly-null typed columns per category is JSONB wearing a schema (demote the variant tail).

The hybrid idiom that captures most healthy designs: **stable spine, flexible limbs** — identity, relationships, money, status, and timestamps as columns with full constraint treatment; the variant descriptive payload as one JSONB column beside them. And the promotion path kept cheap: **generated columns** extracting hot JSONB paths into real (indexed, statistics-bearing) columns — the mechanism that makes "we now query this field constantly" an explicit schema migration rather than a wholesale redesign, and the expand/contract discipline's best friend at this layer.

## The toolkit: indexing and querying without folklore

The operational knowledge that separates working hybrids from slow ones: **GIN indexes** are the JSONB workhorse — supporting containment (`@>`) and existence queries across the document — with the sizing caveat that a whole-document GIN on large payloads is a write-amplification and space cost (the index-cost accounting from indexing practice applies with interest; the `jsonb_path_ops` variant trades query flexibility for a substantially smaller index, and is a candidate when its supported operators match the query workload). **Expression indexes on specific paths** (`(data->>'customer_ref')`) serve the equality/range lookups on known-hot fields at ordinary B-tree cost — and pair with the generated-column promotion when the field graduates to constraint-participation. **The planner honesty problem**: JSONB path selectivity is largely opaque to statistics, so plans against document predicates lean on defaults — the practical responses are the promotion path above for anything plan-sensitive, and the plan-reading discipline pointed at any query mixing JSONB predicates with joins (the misestimate-driven nested-loop disaster has a documented JSONB variant). **Query ergonomics**: the path language (`jsonb_path_query`, the `->`/`->>`/`#>>` operator family) covers extraction and filtering; lateral joins plus `jsonb_array_elements` un-nest arrays into relational shape for aggregation (the window-function world composes from there); and updates use `jsonb_set`-style surgical mutation — with the transactional note that a JSONB update creates a new row version and can incur substantial value and index rewrite costs (the MVCC row-rewrite economics from performance practice: hot, frequently-mutated subfields in a large document are a write-amplification pattern arguing for promotion to columns or a separate narrow table).

## The discipline line: schema-on-write lives in the application now

JSONB's real risk is governance, not performance: the JSONB type enforces a valid representation but does not infer the application's document schema. CHECK constraints and supported validation mechanisms can enforce selected rules in the database, while application validation still needs to cover all write paths. Shape requirements must be made explicit wherever they are enforced. The engineered version imports the contract disciplines wholesale: **validation at every write path** (the Pydantic/Zod-class schema-at-the-boundary rule — nothing enters the JSONB column unvalidated, because the column will happily store the typo'd field name forever), **versioned payload schemas** (a `schema_version` key inside the document, with the migration story for old versions decided — lazy-upgrade-on-read or backfill, per the data-migration playbook — because five years of accumulated shapes without versioning is the archaeology that makes teams swear off the whole approach), **shape monitoring as data quality** (the profiling checks from data-quality practice pointed at key-frequency and type-consistency across the column — drift between what the application writes and what analysts assume is the silent breakage genre), and — where the invariant is strong enough — **check constraints on JSONB** (Postgres can enforce structural rules against the document; used sparingly, it's the belt to the application's suspenders for the fields that must exist). The analytics seam completes the picture: JSONB columns flow into the lakehouse via the CDC rails like everything else, but the *flattening decision* (which paths become warehouse columns) should track the same promotion logic — the dimensional model wants typed attributes, and "we'll parse the JSON in every dashboard query" is the modeling debt from warehouse practice, imported.

The closing calibration: JSONB earned its place by making the document-vs-relational war unnecessary — but the peace terms matter. Spine in columns, variance in documents, hot paths promoted via generated columns, GIN where containment is the shape, validation and versioning at the write boundary, and the promotion/demotion review run periodically like the modeling decision it is. The flexibility was never free; it was *relocated* — and the teams that know where it went are the ones whose hybrid schemas are still legible at year five.

## A catalog design that makes the trade testable

Consider a hypothetical equipment catalog with a stable product identity and variable manufacturer specifications. An account owns each product; a stock keeping unit must be unique within that account; price is a decimal value in an explicitly recorded currency. Those fields participate in business rules independently of a product's descriptive shape. Keep them in typed columns. A camera's sensor dimensions and a router's port counts can occupy a specification document, provided the ingestion boundary validates the relevant category and version.

This is not a universal argument against JSONB constraints. PostgreSQL supports expression indexes and check constraints over document expressions, so a frequently queried path does not mechanically require a new column. Promotion is a choice about clarity, statistics, operational cost and ownership. It still requires a migration: adding a generated column, building an index and adjusting consumers have locking, storage and rollout consequences. Rehearse those changes against the deployed PostgreSQL version and actual table size.

A starting schema makes the boundary explicit:

```sql
CREATE TABLE catalog_item (
  tenant_id bigint NOT NULL,
  sku text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  currency char(3) NOT NULL,
  category text NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  specs jsonb NOT NULL CHECK (jsonb_typeof(specs) = 'object'),
  PRIMARY KEY (tenant_id, sku)
);
CREATE INDEX catalog_brand_lookup
  ON catalog_item (tenant_id, (specs->>'brand'));
```

This validates only an outer object, not every category-specific rule. It deliberately does not pretend that a three-character currency value proves membership in a currency registry. Application validation must reject unsupported categories, malformed units and unknown versions. If the same field must be enforced across independent write clients, add a database rule or expose a controlled write interface rather than relying on one client library.

### An illustrative indexing experiment

Suppose a fixture contains 100,000 products. Exactly 1,000 products belong to the tenant in the query, and 100 of those match a selected brand. A full relation scan can examine 100,000 candidate rows. Restricting to the tenant leaves 1,000 candidates; a combined tenant-and-brand lookup logically narrows the candidate set to 100. The figure displays these constructed candidate counts, not measured execution times or a promise about a particular planner. PostgreSQL may select a sequential or bitmap scan depending on table size, visibility, correlation and selectivity.

The useful question is whether the chosen access path improves the production operation enough to justify its maintenance. Record `EXPLAIN (ANALYZE, BUFFERS)` on a safe fixture before and after the candidate index. Repeat with a common brand, an absent brand and a tenant much larger than the median. Track actual rows, estimates, buffers, elapsed time and index size. A result that looks excellent for a rare brand may be poor for a common one. Preserve raw plans alongside the schema and data-generation instructions.

For containment queries, choose GIN operator classes from the exact operators being used. The default `jsonb_ops` and `jsonb_path_ops` support different operator sets and indexing behavior; `jsonb_path_ops` does not support the key-existence operators. An index that is smaller on one dataset is not automatically the right default for another query family. Test representative documents, including empty nested objects, because the indexed representation affects what can be searched efficiently.

## Missing values, types and money

Distinguish an absent JSON key, the JSON literal `null`, an empty string and SQL `NULL`. The text extraction operator can make some distinctions disappear if downstream code treats every missing result alike. A contract should define which states are valid. Avoid silently coercing the string `"unknown"` into zero or interpreting a missing measurement as a negative result. Record units with measurements; a numeric value of 12 is not a usable physical specification without its unit and meaning.

Casting an extracted value also introduces an error boundary. A query that casts `specs->>'port_count'` to an integer can fail if any selected document contains arbitrary text. Validate before storage or use a migration that inventories malformed rows before adding a generated cast. Keep a quarantine count and a correction owner. Updating a predicate to ignore invalid rows may restore a dashboard while hiding a data-quality incident.

JSONB normalizes documents and does not preserve object key order, whitespace or duplicate object keys as an exact original byte sequence. If a signed webhook must later be verified, store the required original payload bytes separately with the signature metadata. JSONB is useful for querying an interpreted representation; it is not a substitute for the original signed message.

## Mutation, concurrency and operational boundaries

Changing one nested field creates a new row version and can increase WAL and index maintenance. The database does not provide independent row locks for each nested JSON property. Two workers editing different properties of the same row can still contend, and a read-modify-write operation performed outside a guarded transaction can overwrite another worker's change. Use atomic database expressions or an explicit version check where the application needs optimistic concurrency. Test the conflict path, including retry behavior, rather than only a successful single-worker update.

Keep high-frequency counters or operational state in a narrow table when that reduces contention and write amplification. Conversely, splitting every descriptive attribute into a separate relation can make reads unnecessarily complicated. The boundary should follow observed access patterns and enforceable invariants, not a preference for a storage label.

### Worksheet: deciding whether to promote a field

Choose one JSON path and document its owner, type, valid range, null semantics, query frequency and update frequency. List every consumer and every invariant involving that field. Capture a baseline plan and representative write throughput. Compare three alternatives: leave the document alone, add an expression index, or promote the value into an explicitly managed column. Estimate index bytes and backfill duration from a representative sample, then test with production-like skew.

Define a rollback before running the migration. Preserve compatibility while old and new application versions overlap; decide which representation is authoritative if both exist. Verify that replication and analytical flattening retain the same meaning. The decision is complete when query improvement, write cost, consistency checks and ownership are recorded together, not when the new index merely finishes building.

### Figure methodology

Synthetic catalog: 100,000 rows, 1,000 in one tenant, 100 matching that tenant and brand. Counts describe logical candidates, not observed execution time, index visits or universal planner behavior.

| Worked observation | candidate rows |
| --- | ---: |
| Whole catalog | 100000 |
| Selected tenant | 1000 |
| Tenant and brand | 100 |

## Primary references and further study

- [PostgreSQL JSON types and indexing](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL expression indexes](https://www.postgresql.org/docs/current/indexes-expressional.html)
- [Reading execution plans](https://www.postgresql.org/docs/current/using-explain.html)
