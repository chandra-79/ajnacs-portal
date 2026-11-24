---
title: "The Modular Monolith: Enforced Boundaries in One Deployment"
description: "Define module ownership, data access and transaction rules before deciding which boundaries need separate services."
date: 2028-03-20
tags: ["Architecture", "Distributed Systems", "Engineering Practice", "Java"]
format: article
---

The industry's architecture pendulum has completed a full arc: the monolith declared legacy, the microservices decade with its distributed-systems tax paid in full (the network hops, the sagas, the eventual consistency, the operational surface — every chapter of this series that exists because a function call became an HTTP request), and now the correction — not back to the big ball of mud, but to the **modular monolith**: one deployable, internally partitioned into modules with enforced boundaries and explicit contracts. The insight the arc taught: most of microservices' *promised* benefits (team autonomy, bounded contexts, independent reasoning) come from the *boundaries*, not from the network between them — and some boundaries can be enforced through language or build checks, with design and maintenance costs, without buying the distributed-systems problem set.

## What modularity actually requires (folders are not it)

Packages alone do not establish useful module boundaries. The difference is enforcement, and the requirements mirror the bounded-context discipline compiled inward: **modules own their domain and hide their internals** (a module exposes a deliberate public API — a facade of operations and published events — and internal access is constrained by the language, module system and automated checks available; the strength of enforcement must be tested rather than assumed from folder layout), **modules communicate through contracts** (direct calls only via the public API; asynchronous coupling via in-process domain events — the event patterns from integration practice, minus the broker — which keeps modules ignorant of their consumers and makes the eventual service-extraction story real rather than aspirational), **and modules own their data** — the make-or-break rule: each module's tables are private (separate schemas as the physical hint), cross-module data access goes through the owning module's API, and **no cross-module joins** — because the shared-database free-for-all is precisely the coupling that made the legacy monolith unrefactorable, and a modular monolith with promiscuous joins is the old architecture wearing a new diagram (the database is where modularity dies first, quietly, one convenient JOIN at a time).

The enforcement layer is what separates architecture from aspiration, and it's now cheap: dependency rules as build-breaking checks (ArchUnit-class tests, the import-linting from fitness-function practice — "module internals are inaccessible outside the module, allowed dependencies are declared, cycles are forbidden" as CI assertions), the platform-level module systems where the ecosystem provides them (Spring Modulith's verification and per-module integration testing in the JVM world; workspace/package boundaries with lint enforcement in the TypeScript and Python worlds per the monorepo tooling), and the module-dependency graph reviewed like the architecture artifact it is — acyclic, shallow, with the dependency direction following the domain's grain.

## What you keep, what you defer, what you still owe

The dividends over distributed services, stated plainly: **transactions work** (the cross-module invariant that microservices handles with a saga is a database transaction here — the entire compensation-and-idempotency apparatus deferred until a boundary actually crosses a network), **calls are calls** (no transport timeout is needed for a direct function call, though process crashes, asynchronous work and external dependencies still require failure design — the resilience engineering scoped to the system's real edges), **one deployable** (the deployment, observability, and on-call surface of a single service — the operational economics that let a small platform team serve many product teams), and **refactoring across boundaries is an IDE operation** (the boundary drawn wrong — the discovery every architecture makes — can be easier to revise than a published remote contract, depending on data and consumer dependencies; this is the modular monolith's underrated superpower: *cheap boundary revision while you learn the domain*, which is exactly when boundaries are least certain).

What you still owe: the module boundaries demand the same design rigor as service boundaries (the context-mapping work doesn't disappear — it just gets a cheaper implementation), the build-and-test economics need the graph-aware tooling as the codebase grows (affected-module testing per the monorepo disciplines, or the build times quietly reinstate the coupling), and the *organizational* pressure that birthed microservices — many teams needing independent deploy cadences — remains real and is the honest exit criterion: **extract a module to a service when a specific, named force demands it** (a team's deploy cadence genuinely blocked, a component's scaling profile divergent by an order of magnitude, a runtime/language requirement, a fault-isolation mandate) — and the modular monolith's payoff is that extraction is now surgery on a defined organ rather than archaeology in a shared body: the module's API becomes the service contract, its events go onto the broker, its schema detaches with it (the strangler mechanics, pre-staged by years of boundary discipline).

The closing calibration: the modular monolith is not a compromise position — it is a useful starting option for many systems when its deployment and isolation limits fit, with distribution as the deliberate exception purchased per boundary when a force justifies it (the same workload-shaped placement logic as every chapter: the envelope math, applied to architecture). The industry's decade of distributed pain bought one durable lesson, and this is its architecture: **boundaries are the asset; the network is a cost** — draw the boundaries always, pay the network only where it earns its bill.

## Start from one business capability

In a fictional subscription application, billing, account management, and notifications are candidate modules. Billing owns invoice calculation and payment state; account management owns the customer account lifecycle; notifications owns delivery preferences and message attempts. The module names are useful only if ownership and allowed interactions are explicit.

Choose one use case, such as issuing an invoice, and list every table and public operation it touches. If the billing module directly modifies account preferences and notification delivery rows, the dependency diagram understates the coupling. Introduce an operation or event that communicates the business intent, then decide which participant owns each state transition.

Do not assume every cross-module transaction is a defect. A shared transactional database can enforce a genuine invariant across modules when the design deliberately permits it. That choice creates coupling that should be documented. If future extraction is a serious goal, identify how the invariant would change across a process boundary rather than promising that the current transaction will migrate unchanged.

## A hypothetical boundary-cleanup ledger

Suppose a small dependency audit finds eighteen imports of another module's internal classes. A first refactoring removes thirteen by introducing a public account-summary operation, leaving five. A second replaces the remaining persistence-type dependencies with explicit values, leaving zero. The chart records eighteen, five, and zero violations in this invented exercise.

Zero flagged imports means the chosen static rule passes. It does not prove complete modularity. Reflection, shared database access, configuration, global state, and runtime event dependencies may remain outside that rule. Keep the rule's scope in the report and pair it with a data-access review.

Measure the behavioural consequence as well. Can billing change an internal representation without altering notification code? Can its tests construct the necessary account state through a supported interface? If the public facade merely exposes every internal method unchanged, the import count improves while the conceptual coupling remains.

## In-process events still need a lifecycle

An event published inside one application may be handled synchronously, asynchronously, before commit, or after commit depending on the mechanism. Those choices change exception handling and durability. A synchronous listener failure can affect the caller; an asynchronous listener may fail after the caller has already returned success.

For a notification triggered by invoice creation, decide whether delivery intent must survive a process crash. An in-memory event alone may be insufficient. Persisted publication or an outbox-style mechanism can be appropriate when the effect is required. The absence of a network hop does not remove the need to account for crashes between state changes.

Test the listener failure and restart path in a disposable application. Verify whether the invoice remains, whether the notification is retried, and whether duplicate attempts are safe. A clean module graph cannot answer those runtime questions by itself.

## Keep read access deliberate

Operational reporting may need information from several modules. Options include composed queries through public interfaces, a dedicated projection, or an explicitly governed reporting view. Each has costs in latency, freshness, and coupling. A blanket ban on all joins can push teams toward slower, less reliable workarounds if the actual requirement is not considered.

If a reporting view reads private tables, treat it as a published contract with ownership and migration obligations. If a projection is asynchronous, document its lag and reconciliation mechanism. If application code composes several module calls, avoid creating an in-process equivalent of an N-plus-one query pattern. Measure the workload before selecting the boundary implementation.

## A practical modularisation exercise

Choose a change that crosses two existing packages. Identify the smallest public operation the caller needs and write a behavioural test around it. Move implementation details behind that operation, then add a dependency rule preventing new direct access. Keep the initial rule narrow enough that a developer can understand and repair a violation.

Run tests for the changed module and relevant integration paths. Deliberately introduce one forbidden import to confirm the rule detects it, then remove the violation. Review data access separately and inspect any shared transaction. Do not turn a package rename into a large rewrite with no observable benefit.

Finally, document extraction criteria for this specific module: independent scaling, security isolation, a different runtime, or release coordination that the current deployment cannot address economically. Include the new obligations extraction would introduce, such as deadlines, duplicate handling, remote authorisation, and data migration. Modularity can make extraction more understandable, but it does not make those obligations disappear.

The resulting architecture can remain one deployable for a long time. Its success is visible in understandable ownership, testable contracts, and changes that stay within their intended scope. Separate services are an option when a concrete requirement earns their operating cost, not a graduation ceremony for a healthy monolith.

## Further reading and source boundaries

- [Spring Modulith: structure verification](https://docs.spring.io/spring-modulith/reference/verification.html)
- [ArchUnit: dependency checks](https://www.archunit.org/userguide/html/000_Index.html)
- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
