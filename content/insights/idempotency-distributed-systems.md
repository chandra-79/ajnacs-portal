---
title: "Idempotency in Distributed Systems: The Property That Makes Retries Safe"
description: "Every distributed system retries, and every retry is a potential duplicate. Idempotency keys, exactly-once myths, the outbox pattern, and how to design APIs and consumers that survive at-least-once delivery — the discipline underneath reliable systems."
date: 2027-03-26
tags: ["Distributed Systems", "Programming", "API Design", "Reliability", "Architecture"]
format: article
---

Here is the situation every distributed system eventually faces: a client sends "charge the customer $500," the network hiccups, and no response arrives. Did the charge happen? The client cannot know — and both available moves are wrong. Retry, and maybe charge twice. Don't retry, and maybe the customer got their order for free. This is not an edge case; it's the fundamental condition of communicating over an unreliable network, and it requires an explicit recovery design. **Making the operation safe to repeat** supports bounded retries; durable operation status and reconciliation can also resolve uncertainty. That property is idempotency, and it's less a technique than a design discipline that touches APIs, databases, queues, and organizational habits.

## Why "exactly-once delivery" won't save you

Delivery and processing guarantees are scoped to a protocol and failure model. Some systems provide exactly-once processing within a transactional boundary; external side effects still need an explicit design. A lost response can leave a caller uncertain whether an effect committed. Idempotent handling, durable operation status, and reconciliation can make recovery from that uncertainty safe. Do not assume that a broker guarantee automatically covers a payment provider, email service, or another database.

Duplicates don't even require infrastructure failure: users double-click, mobile apps retry on flaky radios, load balancers resend after timeouts, queue consumers crash after processing but before acknowledging (the canonical duplicate generator), and your own retry middleware does exactly what you configured it to do.

## The workhorse: idempotency keys

For APIs performing non-idempotent operations (payments, orders, provisioning — anything where "do it twice" differs from "do it once"), the standard pattern is the **idempotency key**: the *client* generates a unique key per logical operation (a UUID minted when the user hits "pay," not per HTTP attempt — the distinction is the whole point), sends it in a header, and retries with the *same* key. The server, per key: first sight → process, store the result keyed by the idempotency key, return it; repeat sight → return the stored result without re-executing; concurrent sight (the race where attempt two arrives while attempt one is mid-flight) → block or reject with "in progress," which requires the key check to be an atomic reserve (unique-constraint insert), not a read-then-act.

The implementation details that separate working versions from incident generators: the key store needs a **TTL matched to realistic retry horizons** (chosen from the supported retry horizon, business uniqueness requirements, and storage policy); the stored response must include *failures that shouldn't re-execute* (a definitive card decline should replay as a decline, not re-attempt the charge); and key acceptance should validate the request body hash, so a client bug that reuses a key with different payloads gets an error instead of silently receiving someone else's stored result.

HTTP defines idempotent method semantics that implementations must preserve — GET, PUT, and DELETE are *specified* idempotent (PUT "set state to X" repeats harmlessly; contrast POST "append X") — which is why "can this be a PUT with a client-chosen resource ID?" is the first design question. A client-chosen resource identifier can support idempotent creation, but the server must implement uniqueness, authorization, and concurrency semantics correctly; changing the HTTP verb alone provides no such implementation.

## The database side: natural idempotency beats bookkeeping

The strongest implementations make the *operation itself* idempotent rather than wrapping bookkeeping around a fragile one. The toolkit: **unique constraints as the enforcement of "at most one"** (one payment row per idempotency key, one account per email — let the database's atomicity be the arbiter, and inspect the matching operation state and payload before deciding whether to replay, wait, or reject); **absolute state over relative mutation** (set a version-guarded state where appropriate, while preserving ledger and concurrency semantics; a stale absolute balance can overwrite newer work, which may be idempotent as a repeated assignment yet still incorrect because it overwrites newer state); **conditional updates as guards** (`UPDATE ... WHERE status = 'pending'` — zero affected rows can mean an absent row, a prior transition, or an unexpected state; inspect the contract before responding); and upserts (`INSERT ... ON CONFLICT DO NOTHING/UPDATE`) for the create-or-update shape. A useful heuristic for reviews: any SQL containing `+=`-style arithmetic or any handler whose effect depends on how many times it runs is a duplicate-sensitivity finding.

## Queues and the outbox: idempotency's other half

Message consumers live under at-least-once redelivery, so **every consumer must tolerate duplicates** — that's not a nice-to-have, it's the contract. The patterns: absolute-state consumers still need ordering or version checks to prevent stale overwrites; consumers with side effects need **dedup via processed-message IDs** (an `inbox` table with a unique constraint on message ID, checked *in the same transaction* as the business effect — dedup in Redis while the effect commits to Postgres reintroduces the race across two systems); and Kafka-style transactional processing covers the within-Kafka case while external side effects still need their own idempotency.

The producer side has its own classic: the **dual-write problem** — service commits to its database, then crashes before publishing the event (or vice versa), leaving the two systems permanently disagreeing. The standard fix is the **transactional outbox**: write the business change *and* the outgoing event to an `outbox` table in one transaction, with a relay (CDC or poller) publishing from the table afterward. The relay can retry publication, subject to durable storage and operational recovery — duplicates again, by design — which downstream consumers absorb because they followed the previous paragraph. Notice the shape of the whole system: *nobody* eliminates duplicates; every layer generates them under failure and every layer tolerates them on receipt. That's what a correct distributed system actually looks like.

## Making it organizational

Idempotency can fail at a boundary between teams — the service that added retries (client team, Tuesday) calling the endpoint that charges twice (platform team, unaware). The countermeasures are cheap and procedural: **retry policy and idempotency guarantees are documented per endpoint** as part of the API contract (if an endpoint isn't safe to retry, its docs must say so, and its client SDK must not); **duplicate-delivery tests belong in the standard suite** — fire every event twice at every consumer in CI and assert single effect, which catches regressions the happy path never will; and chaos-style **retry storms in load testing**, because the concurrent-duplicate race only shows up under contention. Teams that adopt "every handler assumes it will see every message at least twice" as a review norm can reduce duplicate-effect failures when the implementation and tests cover the relevant boundaries — and the payments-shaped ones they stop having are the expensive kind.

A lost response creates uncertainty at the caller; it does not make the final operation state permanently unknowable. Safe repeated effects, durable status, and reconciliation provide complementary recovery mechanisms. Define which boundary each mechanism covers and test its crash windows. Retries still consume capacity, and retention expiry or an external side effect can change the guarantee. A documented design is more useful than a blanket promise that every repeated request is harmless.

## Define the logical operation and its scope

An idempotency key identifies one intended operation, not one network attempt. Generate it before the first attempt and persist it where the client can recover it after a crash. A retry that creates a new key is a new operation from the server's perspective. Conversely, reusing one key for several intended purchases can suppress legitimate work. The client and server need a shared definition of what the key represents.

Scope the key to the authenticated tenant or account and the relevant operation. A globally unique-looking value does not remove the need for authorization. One tenant must not retrieve another tenant's stored response by guessing or reusing its key. Store a canonical representation or hash of the relevant request fields and reject a conflicting reuse according to the API contract.

Decide which differences matter. A tracing header should not necessarily make two requests different, while amount, currency, recipient, and business operation usually do. Canonicalization must preserve semantic distinctions, including units and optional values. Document the rule and test it rather than hashing an arbitrary serialized object whose field order may vary.

## Worked example: attempts versus business effects

Imagine one hundred hypothetical logical orders, each with a stable unique key. Twenty clients retry once after losing a response, so the service receives 120 attempts. If reservation and business-state handling are correct, the database contains 100 orders, not 120. The chart compares 120 attempts with 100 business effects. Twenty duplicate attempts were handled, representing one sixth of all attempts, approximately 16.7%.

The numbers are synthetic and do not establish a real duplicate rate. They assume the repeated attempts use the same scope and payload and occur within the supported retention window. If a client reuses a key after its record expires, the server may treat it as a new operation unless another business constraint prevents duplication. Retention policy is therefore part of the externally visible guarantee.

Measure attempts, distinct keys, completed operations, in-progress responses, conflicts, and recovery failures separately. A high deduplication count may reflect a network problem or an overly aggressive retry policy. Idempotency can contain the effect while the underlying reliability issue still deserves attention. Do not interpret successful deduplication as evidence that retries are free.

## Make reservation and effect atomic where possible

A read-then-write check is vulnerable to concurrent requests: both can observe that the key is absent and perform the effect. A unique constraint can arbitrate reservation, but the transaction design determines what happens after reservation. If the key is committed as in-progress and the worker crashes, a recovery process must decide whether and how to resume. A permanently stuck reservation is safer than duplication in some systems, but it is still a failed operation.

When the business effect and idempotency record share a database, a transaction can commit them together. Store enough result information to answer a retry consistently. If the operation fails before any effect commits, define whether a later attempt can retry the work. If it fails after a durable partial effect, return or expose that state rather than blindly starting over.

External side effects require another boundary. A local transaction cannot atomically include an arbitrary payment provider or email service. Use the downstream service's idempotency capability where available, preserve the downstream operation identifier, and reconcile uncertain outcomes. If no such capability exists, define the residual risk and a recovery workflow. A local “processed” flag alone cannot prove that the external effect happened exactly once.

## HTTP semantics do not eliminate implementation work

HTTP defines idempotence in terms of the intended effect of repeated identical requests, not identical response bodies or an absence of logging. A repeated DELETE may return a different status after the resource is gone while preserving the intended state. A server can still violate the semantics through a faulty implementation. Choosing PUT does not automatically create a database uniqueness constraint or protect an external side effect.

GET should not be used for an operation that intentionally changes business state. Clients, caches, crawlers, and intermediaries make assumptions based on method semantics. A link that triggers a purchase or deletion can be invoked unexpectedly. Use the appropriate method and still implement authentication, authorization, concurrency, and replay behavior.

Conditional requests or version checks can prevent stale updates. Setting an absolute value is not always safe merely because repeating it produces the same value. An older balance snapshot can overwrite a newer legitimate transaction. For financial state, a ledger and carefully defined transaction semantics are usually more appropriate than casually replacing the current balance with a prior event's value.

## Retention, response replay, and privacy

Choose a retention window from the maximum supported retry and replay horizon, then state what happens after expiry. Long retention consumes storage and may retain sensitive response data. Store the minimum information required to recognize the operation and reconstruct an authorized response. An idempotency table should follow the same access, retention, and backup controls as the business records it references.

Provider contracts differ in whether failures are replayed, retried, or resumed. Stripe's documented behavior, for example, distinguishes API versions. Do not copy one provider's twenty-four-hour convention or failure caching rule into every API without deciding whether it matches the operation. A definitive business rejection, a validation error before execution, and an uncertain infrastructure failure are different states.

A client receiving an in-progress response needs a documented next step: retry after a bounded delay, poll an operation resource, or wait for a completion event. Avoid letting many concurrent retries hold expensive locks or connections. A stable status endpoint can reduce pressure while preserving a way to learn the outcome.

## A concurrency and crash lab

Use a disposable database and an operation that inserts a synthetic order. Add a unique constraint on tenant and idempotency key, and make the order effect and completed-result record part of a deliberate transaction design. Send the same request concurrently from several workers. Verify one order, a consistent result, and no unhandled race that leaves the key permanently unusable.

Inject failures at distinct points: before reservation, after reservation, before effect commit, after commit but before the response, and during response replay. Record the expected state for each point. A test that only sends the request twice sequentially misses the race and crash windows that make the problem difficult. Include a different payload with the same key and a different tenant with an identical key value.

Test expiry using a controlled clock or short test retention. Verify that the documented post-expiry behavior occurs and that a durable business uniqueness rule still protects operations that must never duplicate. Simulate a downstream timeout where the external effect may already have committed. The test should force the recovery path to consult the stored operation identity or authoritative status rather than guess.

## Keep retries bounded even when effects are safe

Repeated requests still consume CPU, database capacity, network connections, and rate-limit budget. Apply backoff, jitter, and an overall deadline suited to the operation. Distinguish a retryable transport failure from a permanent validation or authorization failure. A client that retries a forbidden operation forever is not made correct by server-side deduplication.

Publish the contract beside the endpoint: key scope, payload matching, retention, concurrent behavior, response semantics, and recovery route. Review changes to retry policy with the service owner because a new retry layer can multiply load. The practical outcome is not certainty that networks never lose responses. It is a system that can recover from an ambiguous response without duplicating the intended business effect or hiding an unresolved partial operation.

## Sources and further reading

- [IETF · HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [PostgreSQL · Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Stripe · Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Chris Richardson · Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
