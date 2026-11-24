---
title: "API Pagination Done Right: Offsets, Cursors, and the Consistency You're Promising"
description: "Pagination looks like a solved problem until page 40,000 times out or a deleted row shifts everyone's results. Offset vs cursor mechanics, the keyset queries underneath, sync endpoints as pagination's grown-up sibling, and the contract clients actually need."
date: 2028-01-12
tags: ["API Design", "Programming", "Data Engineering", "Performance", "Distributed Systems"]
format: article
---

Pagination is the API design decision most teams make by copying whatever their framework scaffolds — `?page=3&per_page=50` — and most regret at scale in two predictable ways: the database query behind page 40,000 melts (offset pagination's dirty secret), and clients discover items skipped or duplicated as concurrent writes shift the pages under them (the consistency problem nobody documented). Pagination is really two contracts in one — a *performance* contract with your database and a *consistency* contract with your clients — and getting both right is a page of knowledge that saves a redesign.

## Offset pagination: fine until it isn't

`LIMIT 50 OFFSET 200000` reads as "jump to page 4,001" and executes as "**produce and discard 200,000 rows**, then return 50" — offset is a skip-counter, not an address, and the database must walk everything skipped (index or not) to know where page 4,001 begins. The skipped-result work grows with depth; deep pages become the slow queries that dominate the total-time profile (the workload-analysis lens finds them fast), and the crawler that walks your catalog back-to-front becomes an accidental load test of exactly the worst case.

The consistency flaw is subtler and bites shallower: pages are defined by *position*, and positions shift. A row inserted (or deleted) ahead of a client's progress renumbers everything behind it — the client paging through sees an item twice, or never (the row that slid from page 6's tail to page 7's head between requests, or vice versa). For some browsing interfaces this may be tolerable; for anything *synchronizing* — the export job, the integration walking all records — it's silent data loss wearing a 200 status.

Offset's legitimate niche survives: shallow, human-facing, jump-to-page-N interfaces (admin tables, search results where nobody visits page 400 and Google's own results famously don't go much deeper) — with a documented depth cap (choose and document a depth limit based on measured query cost), which converts the melt-down case into a 400 and an invitation to use the real mechanism.

## Cursor pagination: position as value, not count

The grown-up pattern: each page returns an **opaque cursor** encoding *where the page ended* — not "you've seen 200,000 rows" but "the last row was (created_at=…, id=…)". The next request says "continue after this point," and the database executes a **keyset query**: `WHERE (created_at, id) > (?, ?) ORDER BY created_at, id LIMIT 50` — an index seek to the exact position plus a scan of 50 rows, without scanning every earlier result position when the index and query support it. Total cost still depends on the seek, filters, visibility and access pattern. The implementation rules that make it sound: **the sort key must be unique and stable** (hence the tiebreaker id appended to any non-unique ordering — ties without a tiebreaker cause skips or repeats at page boundaries, the classic keyset bug), **the composite index must match the sort** (the equality-then-range index design rules, serving pagination), and **the cursor should be opaque and signed/versioned** (it's serialized implementation detail; clients that parse it will couple to your index choices — the API-evolution discipline says encode and version the token, authenticate it when integrity matters, encrypt it if its contents require confidentiality, and preserve authorization checks independently).

Consistency improves structurally: cursors anchor to *values*, so inserts and deletes elsewhere don't shift the client's position — positional shifts are avoided for a stable ordered set, while mutable filters and sort keys still need an explicit contract. What cursors *don't* promise is a snapshot: rows modified after you passed them are missed, rows behind your cursor reflect their latest state — the pagination equivalent of read-committed, and the honest thing to document. (True snapshot pagination — consistent as-of-a-moment iteration — requires versioned storage or explicit snapshot tokens, and it's the moment to ask whether the client's actual need is the next section's pattern instead.) The ergonomic trade: no random access ("jump to page 37" has no meaning), which is why real designs often pair a capped-offset mode for humans with cursor mode for machines — two documented modes for two audiences beats one mode failing both.

## The sync endpoint: what deep pagination usually wanted to be

The consumer paging through *everything, repeatedly* — the nightly integration, the search-index rebuilder, the mobile app refreshing local state — isn't paginating; it's **replicating**, and pagination is a bad replication protocol. The pattern that serves the need honestly: a **changes/sync endpoint** — "give me everything modified since cursor/timestamp T, including deletions (tombstones), in a stable order, page by cursor within that" — turning the full re-walk into an incremental delta feed (the CDC insight, surfaced as API design; the webhook-reconciliation loop's pull-side twin). Every API whose access logs show clients re-walking the full collection on a schedule is being asked for this endpoint in the least efficient possible dialect. Design notes: monotonic, indexed change-markers (an `updated_at` with an index, or a change position with documented commit/visibility semantics), tombstones retained for a documented horizon (the deletion-propagation lesson), and idempotent consumption assumed (at-least-once weather, as everywhere).

## The contract details clients actually depend on

The remaining craft is documentation-as-interface: return the cursor *and* an explicit `has_more`/next-link (clients guessing "short page means done" break on filtered queries — an API may return an empty page with `has_more: true` under its documented filtering or pagination semantics); put page-size limits in writing with server-side clamps (the unbounded `per_page=100000` is a self-service DoS, per the rate-limiting disciplines — and cost-aware limits should count page size); document the ordering guarantee precisely ("descending by creation, stable" — because clients build merge logic on it); version cursors so a schema change invalidates them gracefully (a clear 400 "cursor expired, restart" beats silently wrong continuation); and state the consistency class in the docs — positional (offset), value-anchored (cursor), or snapshot/delta (sync) — because the client engineer deciding whether they can trust a full walk is making a correctness decision with your paragraph, or without it.

The summary that fits in a design review: offset for shallow human browsing with a depth cap; keyset cursors — unique sort key, matching index, opaque token — as the default for everything programmatic; a sync/changes endpoint the moment any client's real job is replication; and the consistency promise written down in every case. Pagination is one of those small interfaces where the cheap version and the correct version diverge invisibly at first and expensively later — and where a page of discipline, applied on day one, is the difference between an API that scales with its consumers and one that teaches them, incident by incident, exactly how it was scaffolded.

## Define membership as well as ordering

A stable order does not define which records belong in a traversal. The request may filter by tenant, status, time range, permissions, or a search term. Bind the cursor to those parameters so it cannot accidentally resume a different query. Recheck authorisation on every page; possession of a cursor is not permission to read the underlying records.

A signed token protects integrity when implemented correctly, but signing does not conceal its contents. Base64 encoding is not encryption. Avoid placing sensitive data in a client-visible cursor merely because the token is opaque to the documented API. If confidentiality is required, use an appropriate protected representation or a server-side continuation identifier with a defined lifetime.

Version the token format and define what happens when it expires or becomes incompatible. Return a clear, documented error that lets a client restart safely. Do not silently interpret an old token under a different sort order. A valid-looking continuation that skips records is more damaging than an explicit restart requirement.

## A worked keyset example

Imagine a synthetic collection ordered by ascending `(created_at, id)`, with page size three. The first page ends at timestamp 10:00 and identifier 103. Two records share that timestamp, so the identifier is the tiebreaker. The next query must continue strictly after the complete pair, not merely after the timestamp. Otherwise records sharing the boundary timestamp can be omitted.

For a separate work-count model, assume 10,000 ordered rows and a page size of fifty. Retrieving the first page by offset requires producing fifty result positions. Retrieving the page beginning after 9,000 positions requires producing and skipping 9,000 plus returning fifty, or 9,050 positions. A suitable keyset query aims to seek to the boundary and return fifty rows, excluding the seek and other query work from this simplified count.

The chart compares fifty and 9,050 produced result positions for the two offset depths. It is not a database latency benchmark and does not claim keyset access has constant total cost. Index height, filters, visibility checks, joins, storage access, and cache state affect actual work. Use the model to choose measurements, then inspect representative execution plans.

## Mutations reveal the consistency contract

Between two pages, insert a record before the cursor, delete one already returned, update a sort key across the cursor boundary, and change a record so it newly matches the filter. Predict the results under the documented policy. A keyset cursor avoids positional shifting for a stable ordered set, but mutable membership and sort values can still cause omissions or repeats.

If the client requires a complete as-of-time export, offer a snapshot or asynchronous export mechanism with explicit retention and resource limits. Holding a database transaction open across an arbitrary number of slow client requests can retain resources and interfere with maintenance. A server-side export can control that lifecycle more safely, but it still needs an access and expiry policy.

Returning a high-water mark can bound some traversals when the data model supports it. It does not automatically solve updates to existing rows or backfilled identifiers. State exactly what the marker represents: creation sequence, committed change position, event offset, or timestamp. These are different notions of progress.

## A change feed needs more than updated_at

A timestamp can collide, be assigned before commit, or be changed by a backfill. A sequence allocated before transaction commit can also become visible out of allocation order. If a consumer advances beyond a marker while an earlier transaction is still uncommitted, it may miss that later-visible change unless the protocol accounts for it.

Use a change mechanism with a documented visibility and ordering contract, or design an overlap-and-deduplicate strategy whose limits are explicit. Deletions need tombstones or an equivalent mechanism. If a client falls behind the retention horizon, tell it to perform a full resynchronisation rather than returning a misleading empty delta.

Keep the initial snapshot and subsequent change position coordinated. Otherwise a change occurring between the snapshot and feed subscription can fall into a gap, or appear in both. Duplicate delivery is often manageable with stable identities; silent gaps are much harder to repair. Test the handoff under concurrent writes rather than only against a static fixture.

## A practical pagination test harness

Generate a small fixture with deliberate timestamp ties, multiple tenants, missing optional values, and records at the filter boundary. Walk every page and compare the collected identifiers with an expected set under a frozen dataset. Assert deterministic order, no duplicate identifiers, and correct termination. Then run the mutation cases separately, using the contract to define expected behaviour.

Test empty results, a page exactly at the limit, a final short page, an invalid token, an expired token, and a token reused with another filter or tenant. If the protocol allows an empty page with a continuation token, ensure the client follows the token rather than terminating on item count. Bound repeated continuations so a faulty server cannot make the client loop indefinitely.

For performance, test both shallow and deep traversal with realistic filter selectivity. A query that returns fifty rows may inspect far more candidates when most are rejected by a filter. Measure database time, rows examined where available, transferred bytes, and response size. Keep page-size limits tied to workload evidence and resource budgets rather than a universal page number.

## Document how clients should recover

Provide a short client algorithm that stores progress only after processing the page according to its own durability rule. If processing fails halfway through, the client should be able to replay the page without duplicating irreversible effects. Pagination does not supply exactly-once processing for downstream work.

Explain whether a cursor can be reused, whether traversal direction can change, and whether counts are exact, approximate, or absent. An exact total count may be expensive and may describe a different moment from the page itself. If users need a progress indicator, decide whether an approximate count is sufficient and label it accordingly.

The API review is complete when the provider and a client author can agree on the same answers to mutation, expiry, restart, and authorisation cases. A fast query is necessary for a good pagination interface, but it is only one part of the contract.

## Further reading and source boundaries

- [PostgreSQL: LIMIT and OFFSET](https://www.postgresql.org/docs/16/queries-limit.html)
- [PostgreSQL: transaction isolation](https://www.postgresql.org/docs/16/transaction-iso.html)
- [PostgreSQL: row constructor comparisons](https://www.postgresql.org/docs/16/functions-comparisons.html)
