---
title: "ORMs Without the Holy War: What Object-Relational Mapping Buys, Costs, and Leaks"
description: "The ORM debate recycles every few years while production systems quietly need the same answers — where mapping helps, where it hides the queries that hurt, the N+1 and lazy-loading physics, and the layered data-access architecture that uses ORMs without being used by them."
date: 2027-12-08
tags: ["Programming", "Data Engineering", "Architecture", "Performance"]
format: article
---

The ORM argument is one of engineering's great recurring weather systems — "ORMs are the Vietnam of computer science" versus "writing SQL by hand is artisanal waste" — and like most holy wars it persists because both sides are describing real experiences with different workloads. The productive reframe: an ORM is a *leaky abstraction with a known leak profile*, superb within a specific envelope and predictably costly outside it, and the engineering skill is not choosing a side but knowing the envelope, plugging the leaks, and architecting so the choice stays local rather than load-bearing.

## What the mapping layer genuinely buys

Inside its envelope — **entity-shaped CRUD and the object graph's routine traversals** — the ORM's value is real and compounding: the mechanical mapping (rows to objects, relations to references) that hand-rolled data layers reimplement badly and inconsistently; **change tracking and unit-of-work semantics** (the session that knows what changed and flushes it transactionally — the pattern underneath Hibernate/JPA, SQLAlchemy, EF Core — which correctly implemented by hand is a small framework anyway); migrations integrated with the model (the schema-evolution toolchain, with the expand/contract disciplines still yours to apply); parameterization by default (the SQL-injection class largely retired where ORMs are used idiomatically — a security dividend that predates every other argument); and — underrated — **typed queries against a typed model** (tooling that can check model references, depending on the language and query API, per the typed-boundary disciplines; string-SQL refactors are grep-and-pray, criteria/LINQ-style refactors are tooling operations). For a service dominated by routine entity operations, an ORM can reduce repetitive mapping work. Compare that benefit with its transaction, loading, and debugging costs for the actual workload.

## The leak profile: where the abstraction bills you

The costs are equally well-characterized, and they share a root: **the ORM makes queries invisible, and invisible queries are unowned queries.** The canonical leaks: **N+1** (the object-graph traversal that fires a query per element — the ORM's defining failure mode, born of lazy loading meeting a loop; the fix is *fetch strategy as a per-use-case decision* — eager joins/`selectinload`-style batching declared at the query site, never global eagerness, which trades N+1 for cartesian explosions), **lazy-loading beyond the session** (the detached entity that either throws or, worse, silently re-queries — session/transaction boundaries are architecture, and the ORM makes them easy to blur; the request-scoped-session discipline from the FastAPI/hexagonal patterns exists exactly here), **the hydration tax** (materializing ten thousand entities with change tracking to compute a sum the database would have returned in one aggregate row — the ORM envelope ends where *set-shaped* work begins: aggregations, bulk updates, reporting, and window functions need set-oriented queries, whether expressed through ORM APIs, a query builder, or SQL, and every mature ORM provides the escape hatch to run it), and **chatty flushing and identity-map surprises** (the "why did this innocuous read trigger twelve UPDATEs" genre — auto-flush semantics are learnable, and unlearned they're a production mystery generator). None of these is an argument against ORMs; all are arguments against *unsupervised* ORMs.

The supervision toolkit is the standard observability discipline pointed one layer down: **query logging in development with N+1 detection** (the per-request query count assertion in tests — "this endpoint issues ≤ 4 queries" — is the cheapest regression gate in data access), APM/OTel spans per statement (the slow-query workload analysis from database practice needs the *actual SQL*, and the ORM's generated queries are exactly what you must read — the plan-reading skill applies to queries you didn't write), and code review that treats fetch strategy as a first-class concern (the "what does this traversal cost at N=10,000?" question, per the envelope math).

## The architecture that keeps the choice local

The strategic move mirrors hexagonal practice: **data access behind an owned boundary** (repositories/data-access modules in the domain's vocabulary), with the ORM as *an implementation detail inside it* — which yields the layered policy that ends the holy war locally: ORM entities for the transactional aggregate tier (where unit-of-work earns its keep), **query-builder or raw SQL for the set-shaped tier** (reports, dashboards, bulk operations — through the same boundary, returning purpose-shaped read models rather than entities, per the CQRS-lite instinct: reads and writes have different shapes, and forcing reports through the entity graph is the hydration tax as architecture), and the mapping kept honest by the classic warning — *don't let the ORM model become the domain model by default* (the entity-as-domain-object shortcut couples business logic to persistence shape; fine for CRUD services, costly exactly where the domain is rich, per the bounded-context and hexagonal judgments). The lighter-weight middle deserves its mention: the micro-ORM/data-mapper tier (row-to-object mapping without change tracking) is the right envelope for services that want typed results without the session machinery — the spectrum has more points than the debate admits.

The closing calibration: ORM-versus-SQL was never the decision — *which tool for which query shape, behind which boundary, with what visibility* is, and it's decided per use case by engineers who can read both the generated SQL and its plan. Teams that hold both skills use the ORM where it compounds (the aggregate tier, safely, tersely) and SQL where it's honest (the set tier, measurably), instrument the seam, and stop having the argument — which, as with most holy wars, was always a proxy for the unexamined workload underneath.

## The abstraction does not choose the transaction

An ORM can track objects and generate statements, but the business operation still needs an explicit transaction boundary. Loading an order, checking its state, and updating it are not automatically safe against concurrent writers merely because they occur in one method. Identify the invariant, the database isolation level, and the conflict-handling strategy. Optimistic version checks, constraints, locks, and serializable transactions solve different parts of that problem.

A session is also not necessarily the same thing as one database transaction or one connection. Frameworks can begin transactions implicitly, flush changes before queries, expire objects after commit, or release and reacquire connections. Read the chosen ORM's lifecycle rules and make them visible in the data-access layer. Otherwise a harmless-looking property access can issue a query after the intended authorization or transaction scope has ended.

Keep sessions local to the intended unit of work. SQLAlchemy's mutable Session and AsyncSession are not objects to share indiscriminately across concurrent threads or tasks. A connection pool manages reusable connections; it does not make one session's pending state safe for unrelated requests. Tests should include cancellation and rollback so a failed request cannot leave state that affects the next one.

## A hypothetical fetch-strategy comparison

Suppose a fictional report lists 25 orders, each with four line items. The report needs all 100 line items. Lazy-loading each order's collection creates one order query plus 25 collection queries, or 26 statements. A compatible select-in strategy can use one order query and one query for all relevant line items, or two statements in this small fixture. A joined strategy can use one statement returning 100 joined rows.

The chart compares 26, two, and one statement. It does not establish that the one-statement plan is fastest. The join repeats order columns across line-item rows, while the two-query strategy separates the row shapes. Larger collections, parameter limits, relationship complexity, and database behavior can change the number of batches and the cost. Record result bytes, rows, latency, and object allocations alongside the statement count.

Adding another one-to-many relationship can multiply joined rows. If every order also has three independent tags, an uncomplicated join across both collections can produce 25 × 4 × 3 = 300 rows before the ORM reconstructs objects. That is why globally eager-loading every relationship is not a reliable cure for N+1 behavior. Choose fetch strategy for the specific output and cardinalities.

## A practical query-review lab

Create a local database containing the 25-order fixture, then add a larger skewed fixture with one order containing many more line items than the others. Implement the same read model using lazy access, an explicit loading strategy, and a projection selecting only the fields the view needs. Keep the response semantics identical so a smaller output is not mistaken for a faster equivalent implementation.

Capture generated SQL and bound-parameter shapes without logging secrets. Count statements for the complete operation, including serialization. Many N+1 defects appear when a response serializer walks relationships after the main query has completed. Run the database's plan inspection against representative queries and data, checking indexes, estimated versus actual rows, and expensive sorts or joins.

For a read-only experiment, a plan tool with execution statistics can be useful. Be careful with commands that actually execute writes: wrapping a mutation in a rollback does not undo every possible external side effect or sequence allocation. Use an isolated fixture for write-plan experiments. Preserve the schema, index definitions, data generator, ORM version, and exact loader configuration with the result.

Add a regression check for the intended query growth pattern. A fixed upper bound can catch accidental per-row loading for a bounded page, but a brittle assertion of exactly two queries may fail during a legitimate schema change. Test several page sizes and explain the acceptable relationship between result count and database work. Pair the test with correctness checks for missing relationships, empty collections, and tenant filtering.

## Set operations and bulk writes have different semantics

A database aggregate can avoid transferring thousands of rows to application memory. Some ORMs and query builders express aggregates, window functions, and bulk updates directly; raw SQL is an option, not a prerequisite for all set-shaped work. Choose an interface that preserves parameterization and makes the actual query reviewable.

Bulk operations may bypass entity-level hooks, validation, or in-memory change tracking depending on the ORM and method. If a business rule lives only in an object callback, a bulk update can violate it. Prefer database constraints for invariants the database must always protect, and document which application rules apply to batch paths. Refresh or expire affected session state according to the ORM's rules before reading it again.

For concurrent edits, demonstrate the conflict rather than assuming the mapper prevents it. Have two transactions read the same version, change different values, and attempt to commit. Decide whether the desired behavior is rejection, merge, serialization, or a domain-specific operation. If retrying is required, retry the whole relevant transaction with bounded attempts and ensure external side effects are not repeated unsafely.

## Keep portability claims honest

An ORM can reduce dependence on a database's syntax, but it does not erase differences in isolation, locking, indexes, JSON semantics, collations, or generated identifiers. A query that runs on two databases can still produce different performance or edge-case behavior. Treat database migration as a tested change, not a connection-string edit promised by the mapping layer.

Similarly, parameter binding protects values, not arbitrary SQL fragments or identifiers assembled from user input. Sorting by a user-selected field needs an allowlist or safe query-construction mechanism. Raw escape hatches deserve the same authorization and parameterization review as hand-written SQL elsewhere. A typed model does not prove that a caller is allowed to access the rows it represents.

The resulting architecture can be modest: a small data-access module, explicit transaction ownership, reviewable queries, and purpose-shaped read models. Add repository abstractions where they clarify responsibilities, not merely to hide every database feature. The evidence for a good choice is correct behavior and predictable work for the real use case, with a clear way to inspect and change it.

## Further reading and source boundaries

- [SQLAlchemy: relationship loading](https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html)
- [SQLAlchemy: session lifecycle](https://docs.sqlalchemy.org/en/20/orm/session_basics.html)
- [PostgreSQL: transaction isolation](https://www.postgresql.org/docs/16/transaction-iso.html)
- [PostgreSQL: using EXPLAIN](https://www.postgresql.org/docs/16/using-explain.html)
