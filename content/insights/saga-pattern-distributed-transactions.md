---
title: "The Saga Pattern: Distributed Transactions Without Two-Phase Commit"
description: "Model visible intermediate states, compensations and unknown outcomes across services, using a synthetic payment-and-refund workflow."
date: 2027-07-02
tags: ["Distributed Systems", "Programming", "Architecture", "Reliability"]
format: article
---

Somewhere in every microservices migration there's a moment of quiet horror: the monolith's `@Transactional` method — reserve inventory, charge payment, create shipment, all-or-nothing, courtesy of the database — now spans three services and three databases, and the comfortable ACID guarantee has simply left the building. Two-phase commit across participating systems is possible, but its coordination and failure-recovery requirements may not suit a service boundary (blocking protocols, coordinator availability, locks held across network calls — the reasons XA never conquered the internet); what the industry converged on instead is the **saga**: a sequence of local transactions, each committed immediately, with **compensating actions** to semantically undo completed steps when a later step fails.

That one sentence hides most of a design discipline. Here's the rest of it.

## The core trade: atomicity out, compensation in

A saga decomposes "reserve → charge → ship" into local transactions that each commit for real. If the charge fails after the reservation committed, nothing rolls back — instead the saga runs the reservation's *compensation* (release the hold). Three properties follow, and they're the ones teams must design for rather than discover:

**Intermediate states are visible.** Between steps, the system is legitimately in "reserved but not yet charged" — other transactions can observe it. This isn't a bug to hide; it's a state to *model*: explicit statuses (PENDING_PAYMENT, not a boolean), and downstream consumers that understand them. The lost isolation of ACID is repaid with explicitness.

**Compensation is semantic undo, not rollback.** You can't un-send an email or un-charge without a refund record; compensation creates a *new* action that counteracts (refund, release, cancel), and the business — not just the engineers — must agree on what counteracting means (does cancellation after shipment mean return-label workflow? that's a product decision wearing an architecture costume). The design heuristic that saves the most pain: **order the steps so the hardest-to-compensate step goes last.** Charging money is easier to compensate than shipping goods; put shipment after payment, and generally sort by reversibility — the *pivot* step (the one after which there's no going back) should be as late as possible, and later steps need an explicit completion or exception strategy; permanent failures may require business intervention.

**Every step and every compensation must be idempotent and retryable** — sagas live on at-least-once message delivery, so the whole idempotency discipline (keys, dedup, absolute-state updates) is a prerequisite, not an optional extra. A saga built on non-idempotent steps is a duplicate-payment generator with orchestration.

## Orchestration vs choreography: the real decision

**Choreography** — each service reacts to the previous service's events (OrderCreated → payment service charges → PaymentCompleted → shipping ships) — has no central process coordinator but retains coupling through event semantics, and reads beautifully at three steps. Its failure mode is emergent complexity: at six steps with two failure paths each, *no single place knows what the workflow is* — the process exists only as an implicit graph across event handlers, discovered by archaeology during incidents ("what happens if payment succeeds but the shipment event was never consumed?" — nobody knows, let's find out in production). Cyclic event dependencies and workflow changes that require coordinating deployments across four teams round out the pathology.

**Orchestration** — a coordinator (the order service's saga component, or a workflow engine) explicitly commands each step and tracks state — makes the process *visible*: one place defines the sequence, the failure branches, the timeouts; one place answers "where is order 12345 stuck." The cost is the coordinator itself: a component to keep available, and a temptation toward the god-service that accumulates business logic that belongs in the steps.

A practical selection heuristic: **choreography for short, stable, genuinely decoupled reactions (two-three steps, rarely changing); orchestration for anything with real failure branches, sequencing rules, or more than a handful of steps** — which in practice means most business-critical sagas. And in the current era, "orchestration" increasingly means a **durable-execution engine** (Temporal-class platforms, or the cloud workflow services): the saga written as ordinary-looking code whose state survives crashes, with retries, timers, and history built in. These engines absorbed the hardest incidental complexity of sagas (state persistence, replay, visibility) and can reduce orchestration work; a small explicit state machine can still be appropriate when its recovery and operational requirements are understood.

## The failure-handling design (where sagas earn their keep)

The happy path of any saga is trivial; the product is the failure matrix. For each step: *retryable failure* (network blip, 503 — retry with backoff and idempotency), *business rejection* (insufficient funds — trigger compensation chain backward), *timeout/unknown outcome* (the charge call timed out: did it happen? — query or reconcile before deciding; this is where the idempotency key becomes the saga's best friend), and *compensation failure* — the one that separates serious designs from diagrams, because a failed refund can't just log-and-forget. The standard answer: compensations use bounded automated retries and explicit unresolved states; they can fail permanently or need a business decision, and past a retry budget they escalate to a **human task queue with full context**, because at the bottom of every distributed transaction discipline is a small, honest operations workflow for the cases automation couldn't close. Budget for it existing; the estates that pretend it won't need staffing get the same queue anyway, in the form of support tickets.

Cross-cutting requirements that make the matrix survivable: **saga state must be observable** (a queryable "where is this transaction, what's completed, what's pending" — durable-execution platforms provide history and visibility features that still need business-facing configuration; hand-rolled versions must build it), **every message carries the saga/correlation ID** end-to-end so tracing works, and **dashboards count stuck sagas by age and step** — a saga stuck 48 hours at "awaiting shipment confirmation" is an incident whether or not anything paged.

## When not to saga

The pattern has a gravitational pull that deserves resistance. Before reaching for it: **can the boundary move instead?** If two services transact together constantly, they may be one service wearing a network boundary — redrawing the boundary restores ACID and deletes the saga entirely, and it's the right answer more often than microservices pride admits. **Can the workflow tolerate eventual consistency without coordination?** Plenty of "transactions" are really pipelines where downstream steps just need to happen eventually (outbox + consumers, no compensation logic needed, because nothing ever "fails backward"). The saga is specifically for *multi-step processes whose acceptable eventual outcomes and compensations span genuine ownership boundaries* — where it's not optional, it's just the truth of the domain made explicit.

Which is the closing reframe worth carrying into design reviews: sagas don't add complexity to distributed transactions — they *reveal* the complexity that was always there, hidden when a local transaction boundary is incorrectly assumed to include external money movement and fulfillment. The monolith let you not think about partial failure; the saga makes the thinking mandatory and visible. Done well — steps ordered by reversibility, everything idempotent, orchestrated where it's complex, observable always, with a human escape hatch — it's less a pattern than the honest shape of the business process itself.

## Model the business state before drawing service arrows

A saga is useful when a business process crosses genuine ownership boundaries and cannot rely on one atomic transaction. It does not turn that process into an ACID transaction. The design task is to define acceptable intermediate states, eventual outcomes and obligations to users. An order marked payment pending should not be displayed as fully paid merely because the workflow has accepted a command. Likewise, a cancellation request is not the same as a completed refund.

Use a hypothetical order for 120 currency units. The service reserves inventory, requests a payment authorization, captures the payment, and only then requests shipment. Authorization, capture and settlement are distinct provider states; a design must use the actual provider's semantics rather than treating them all as charge. If shipment cannot be created after capture, the business may choose to refund and release the inventory reservation. That is a compensating process with its own possible delays and failures.

The figure follows the customer's net captured amount in the simplified example: zero after inventory reservation, 120 after capture, 120 while a refund is requested but not confirmed, and zero after the full refund is confirmed. The net amount is confirmed captures minus confirmed refunds. The example ignores fees, currency conversion and settlement timing. It demonstrates why setting an internal status to refunded before the provider confirms the refund misrepresents the customer's financial state.

## Write a failure matrix for every irreversible boundary

For the payment request, distinguish a definitive business rejection from an unavailable network and an unknown outcome. A timeout after sending the request may mean that the provider accepted it but the response was lost. Retrying with a new operation identifier risks another payment. Query the known payment object or retry under the provider's documented idempotency key. Keep the order in an explicit uncertain state until the evidence supports a transition.

For shipment, distinguish reserving a label from handing goods to a carrier. Cancelling a label can be possible while recalling a dispatched parcel may require a different business workflow. Compensation must reflect these real boundaries. The order of steps can reduce risk, but no universal rule says that everything after a pivot can always be retried until success. A permanent rejection may require an alternative fulfillment path or a human decision.

For each compensation, record its precondition, effect, idempotency key, observable completion signal, retry policy and escalation owner. A refund can be rejected or remain pending; an inventory release can race with reservation expiry or reassignment. Retrying without limit is not a complete recovery strategy. The process needs a durable unresolved state, an age-based alert and a manual procedure that preserves the same identifiers and audit trail.

## Keep state transitions conditional

Represent the workflow as explicit states with allowed transitions, not a bag of booleans. A cancellation arriving while capture is in flight must be reconciled with the eventual capture outcome. A late success event must not blindly move an already compensated order back to fulfilled. Use version checks or transactional state transitions so two handlers cannot independently advance incompatible branches from the same prior state.

An illustrative state table could include reserved, payment uncertain, captured, shipment pending, compensation pending, completed and manually reviewed. Each row should name what the user sees and which actions remain allowed. Some transitions require more than one local record; update those records transactionally within their owning service. Publish resulting events through an outbox or equivalent mechanism so committed state changes are not lost between a database write and message publication.

Competing sagas also interact through shared resources. Two orders can each be internally well orchestrated and still oversell the same stock if inventory reservation lacks an invariant. The inventory service needs its own atomic reservation rule and expiry policy. A saga's observability does not supply isolation between sagas. This is why local constraints and service boundaries matter as much as the orchestration graph.

## A deterministic failure-injection lab

Build fake inventory, payment and shipment endpoints with a durable operation log. Use one stable order identifier and separate stable identifiers for each forward action and compensation. The fake payment endpoint should be able to accept a capture but drop its response. The fake shipment endpoint should be able to reject a request permanently. The fake refund endpoint should be able to return pending before later confirming success.

Run the happy path first and assert the expected final state. Then inject the lost capture response and restart the orchestrator before it records the result. Recovery should discover or safely retry the original payment, not create another one. Next reject shipment after capture and verify that the order remains compensation pending until both the refund and inventory release have reached their required outcomes. Deliver each success notification twice and in a different order to test idempotency and stale-event handling.

Finally, stop the compensation worker and advance the test clock past the configured operational deadline. Verify that an alert and a review task contain the order, payment, inventory and shipment identifiers and the last known facts. Resume the worker and ensure that automated recovery does not conflict with a human action taken in the meantime. A manual resolution should itself be a recorded state transition, not an untracked database edit.

## Choose orchestration by visibility and change needs

Choreography can work when reactions are independent and the event contracts are stable. It still creates semantic coupling through those events. Orchestration makes the process definition and pending decisions explicit, but the coordinator must not absorb every domain rule. Inventory owns reservation correctness; payments owns payment interpretation; the orchestrator owns the progression and recovery policy across those boundaries.

A durable workflow platform can provide histories, timers and retry machinery, but it does not design compensation or guarantee that the business will make progress. A small explicit state machine can also be appropriate when its persistence, recovery and operational needs are manageable. Choose based on process lifetime, event volume, failure branches, team ownership and the cost of operating the chosen system. Avoid declaring either approach universally modern or obsolete.

The acceptance worksheet should include completed orders, failed orders, unknown outcomes, pending compensations and oldest unresolved age. Do not improve the completion percentage by excluding difficult cases from the denominator. For the hypothetical 120-unit order, the exit criterion is agreement between the local state and the confirmed external obligations, including any remaining refund or fulfillment task. This is a more honest measure of success than a workflow engine reporting that its final activity returned.

### Figure methodology

Synthetic order value is 120 currency units. Net captured amount = confirmed captures minus confirmed refunds. A pending refund is not subtracted until confirmed. Fees, settlement timing, partial refunds and exchange rates are excluded; this is not customer evidence.

| Worked observation | currency units net captured |
| --- | ---: |
| Inventory reserved | 0 |
| Payment captured | 120 |
| Refund pending | 120 |
| Refund confirmed | 0 |

## Primary references and further study

- [AWS: saga orchestration pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html)
- [Microsoft: compensating transaction pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction)
- [Stripe: idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [AWS: transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
