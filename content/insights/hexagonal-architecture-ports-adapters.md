---
title: "Hexagonal Architecture in Practice: Contracts at the Boundary"
description: "Design ports and adapters around business semantics, test adapter behaviour, and weigh the cost of added indirection."
date: 2027-09-20
tags: ["Architecture", "Engineering Practice", "Programming", "Domain-Driven Design"]
format: article
---

Hexagonal architecture, clean architecture, onion architecture — the family of concentric diagrams that dominates architecture blogs — are related approaches with overlapping goals, but different descriptions and emphases. One important shared concern is **dependency direction.** Business logic sits at the center; infrastructure (databases, HTTP, queues, third-party APIs) sits at the edge; and *all source-code dependencies point inward* — the domain defines interfaces (*ports*) for what it needs, and infrastructure supplies implementations (*adapters*) that plug in from outside. The domain never imports the framework; the framework imports the domain. That inversion is useful, while the original ports-and-adapters pattern also emphasises interchangeable driving and driven interactions. What the diagrams don't tell you is when it pays, what it costs, and how it degenerates in practice — which is where the engineering judgment lives.

## What the inversion actually buys

**Testability is the headline benefit, and it's real.** When the pricing logic depends on a `PaymentGateway` port rather than on the Stripe SDK, the test suite exercises the domain's actual complexity — the rules, the edge cases, the state machines — with in-memory fakes, at unit-test speed, with no containers and no mocks-of-mocks. This is precisely the fakes-over-mocks, test-behavior-not-choreography discipline from testing practice, made structurally cheap: the architecture *manufactures* the seams that good tests need. A potential benefit worth measuring is — the combinatorial business-rule testing that would be prohibitive through HTTP-and-database becomes routine, and the slower integration tier shrinks to verifying the adapters themselves (does the Postgres repository actually round-trip? does the Stripe adapter map errors correctly?) — the pyramid shape, produced by the dependency structure rather than by exhortation.

**Deferability and swap-ability are the quieter benefits.** The domain-first structure lets teams build and validate business logic before infrastructure choices harden ("we'll decide Kafka-vs-SQS in month two; the port is `EventPublisher` either way"), and it makes the genuinely-swapped things swappable — not the database (nobody swaps Postgres for Mongo on a Tuesday, and selling hexagonal on that fantasy discredits it) but the things that *actually* churn: payment providers, email vendors, the legacy system being strangled behind an adapter (an anti-corruption layer can be implemented through an adapter, although its semantic translation responsibility is a separate design concern), the notification channel that marketing changes quarterly. And the framework-independence has one honest cash-out: framework *upgrades* (the Spring Boot 2→3, the breaking SDK bump) touch adapters instead of business logic, which can reduce the scope of some migrations, although changed semantics may still affect the core — the modernization economics, improved structurally.

**Legibility is the underrated benefit:** in a well-kept hexagonal codebase, the domain layer reads as *the business* — a new engineer (or, increasingly relevantly, an AI assistant being asked to modify billing rules) can find and reason about the rules without wading through HTTP plumbing and ORM annotations, because the rules live in one place with one vocabulary. The bounded-context discipline gets its natural code shape: the context's model at the center, its published contracts and translations at the edge.

## What it costs, and how it degenerates

The honest tax: **indirection and ceremony.** Every boundary adds interfaces, mapping code (domain objects ↔ persistence models ↔ API DTOs — the triple-model separation from API-design practice, now with a fourth mapping layer if you're careless), and navigational hops that make "where does this actually happen?" a two-jump question. For a service that's genuinely CRUD — forms over data, no rules to speak of — full hexagonal ceremony is architecture cosplay: the domain layer is empty, the ports mirror the repositories one-to-one, and every feature costs four files to change one behavior. The framework-integrated shortcut (the Rails/Django/Spring-Data idiom) ships the same outcome faster, and choosing it *knowingly* for the supporting-subdomain services is exactly the core-vs-context calibration: **spend the architecture where the domain is rich; spend the shortcut where it isn't.**

The degeneration patterns to catch in review: **the incoherent center** (business rules scattered across adapters and services with no clear ownership; a procedural application core can be valid when its responsibilities and invariants are explicit), **the leaky port** (interfaces that mirror their implementation's vocabulary — a port taking a `MongoFilter` or returning the vendor SDK's types has inverted nothing; ports must be written in the *domain's* language, which is the actual skill), **mapping fatigue** (teams that respond to the DTO tax by sharing one model across all layers — quietly re-coupling persistence, domain, and API shapes, and rediscovering why schema migrations now break API clients), and **abstraction-in-advance** (a port with exactly one adapter, forever, for a dependency that will never vary — sometimes right for testability alone, but worth the explicit question, because YAGNI applies to hexagons too).

## Adopting it without the religion

The pragmatic playbook: **apply it per-context, not per-company** (the estate has rich cores and boring edges; match the pattern to the subdomain), **start with the two boundaries that pay immediately** (domain-vs-persistence and domain-vs-external-services — the HTTP layer can stay thin-controller-conventional without much loss), **enforce the dependency rule mechanically** (the architecture fitness functions from governance practice — import-direction linting is cheap and catches the drift that review misses; a rule that isn't machine-checked erodes one convenient import at a time), **let the domain own its language** (the review question for every port: could a domain expert read this interface aloud and nod?), and **keep the adapters honest with contract tests** (the fake used by a thousand unit tests must behave like the real adapter — the verify-the-fake discipline, or the whole edifice tests a fiction). For existing systems, the migration is incremental and follows the strangler logic: carve the domain out of the transaction scripts one capability at a time, introducing ports where the tests hurt most — the pattern earns adoption by making the next feature cheaper, not by a big-bang restructure.

The summary judgment, two decades in: hexagonal architecture is not how all software should be built — it can be a useful choice for software with *rich, tested, long-lived business logic*, and the enterprise has more of that than the CRUD-shaped hype cycles admit. Hold the dependency rule where the domain deserves it, relax it where it doesn't, lint the boundary either way — and the reward is the rarest property in legacy systems: a core you can still read, test, and change at year ten, wearing whatever infrastructure that decade demands.

## Choose a boundary with observable semantics

Consider a fictional refund application. Its core rule determines whether an order is eligible and how much can be refunded. An HTTP adapter parses the request, an application operation coordinates the decision, a repository supplies the relevant order state, and a payment adapter requests the external refund. The useful boundary is the behaviour each participant promises, not the number of folders in the repository.

A port named `RefundGateway` might accept an operation identifier, amount, currency, and payment reference. Its result should distinguish accepted, rejected, and uncertain outcomes if the provider can time out after accepting work. Returning only true or false would hide the most important recovery case. A domain-friendly interface must preserve necessary uncertainty rather than simplify it away.

A fake implementation should express those outcomes deliberately. It can return a known acceptance, a business rejection, or an ambiguous response for a test fixture. It should not pretend that every remote call is instant, reliable, and reversible. The purpose of isolation is to test the application's decision logic precisely, not to erase the dependency's difficult semantics.

## A hypothetical test-effort comparison

Imagine 300 business-rule cases, each taking an assumed 20 milliseconds when run through an isolated application boundary. Their serial execution totals six seconds. If the same cases each took an assumed 200 milliseconds through a full HTTP-and-database fixture, serial time would be sixty seconds. The chart compares those arithmetic totals.

These are illustrative assumptions, not measured framework benchmarks or evidence that hexagonal architecture always makes tests ten times faster. Setup sharing, parallelism, fixture design, runtime warm-up, and the actual rule complexity affect real results. The comparison identifies a possible benefit to measure: broad rule coverage without repeatedly paying unrelated infrastructure costs.

Keep a smaller but meaningful adapter test suite. The repository adapter must exercise the real database's transactions, constraints, and query semantics. The payment adapter must verify request mapping, authentication handling, response translation, and retry-related behaviour against an appropriate test environment or contract. Fast core tests and slower boundary tests answer different questions; one cannot replace the other.

## Transactions cross logical boundaries carefully

Moving persistence behind an interface does not decide where a transaction begins and ends. A business operation that reads an order, checks its refundable amount, and records a refund may need one atomic local transaction. If each repository method opens an unrelated transaction, concurrent requests can violate the rule despite clean dependency arrows.

Decide whether the application service controls a unit of work, the repository exposes a domain-specific atomic operation, or another explicit transaction abstraction is appropriate. Avoid leaking a database session everywhere merely to make transaction composition possible. At the same time, do not hide consistency requirements behind a generic `save` method that cannot express the needed guarantee.

The external payment action cannot casually join the local database transaction. It may require a state machine, durable intent, provider idempotency, and reconciliation. An adapter changes how the application reaches the provider; it does not make the distributed operation atomic. This is where architecture diagrams must be accompanied by a failure-flow explanation.

## Avoid interfaces that merely rename a vendor SDK

If a port returns a vendor's request object or accepts its query builder, the core still depends on that vendor's model. Translate the information into the application's vocabulary where that separation is valuable. Preserve identifiers and error details needed for support without exposing the entire SDK surface.

Do not create an interface for every class automatically. A pure calculation may already be easy to test without indirection. A stable internal helper may not need multiple implementations. Introduce a port when it marks a meaningful boundary: external effects, nondeterministic time, persistence, identity, or a replaceable delivery mechanism. Record the reason so later maintainers can judge whether the abstraction still earns its cost.

One adapter can be sufficient when the boundary enables a useful test or protects an important dependency direction. Conversely, having three adapters does not prove the port is well designed if callers still branch on vendor-specific behaviour. Count observable responsibilities, not implementations, when reviewing the design.

## A migration exercise for an existing service

Choose one rule currently buried inside a controller or framework callback. Write a characterisation test for its intended input and output, then identify the external effects it needs. Extract the rule into an application operation without changing its behaviour. Keep the HTTP route stable so the migration can be reviewed as an internal restructuring.

Replace one external effect with a port and provide both the current adapter and a test implementation. Run the same behavioural contract against both where feasible. Include missing records, duplicate requests, unsupported currency, and an uncertain downstream result. Do not stop at the successful fixture; the error mapping is often where a fake diverges from reality.

Add a narrow dependency check that prevents the core package from importing the selected infrastructure package. Test that the rule detects a deliberate violation, then remove that violation. Avoid a vast rule set that freezes incidental package organisation. Architecture checks are most useful when they protect a specific design decision people can explain.

## Review outcomes rather than folder symmetry

After a small change, ask how many business rules can be tested without infrastructure, which adapter contracts remain unverified, and whether a framework upgrade touches core semantics. Also record the added mapping and navigation cost. A successful boundary reduces uncertainty or change effort enough to justify that cost.

The design can remain procedural inside the core if that suits the domain. Ports and adapters do not require a particular object-oriented style, and a rich entity model is not mandatory for every application. What matters is that the application exposes coherent operations and does not accidentally entangle its essential rules with external technology. The original pattern's testing and interaction goals are a useful guide; a perfect hexagon is not an acceptance criterion.

## Further reading and source boundaries

- [Alistair Cockburn: original ports-and-adapters article](https://alistair.cockburn.us/hexagonal-architecture)
- [ArchUnit: dependency and architecture checks](https://www.archunit.org/userguide/html/000_Index.html)
- [Chris Richardson: transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
