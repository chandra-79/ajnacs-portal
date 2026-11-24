---
title: "Webhooks Done Right: Designing Reliable Delivery on Both Sides of the POST"
description: "Webhooks are the duct tape of system integration — simple to start, treacherous at scale. Provider-side delivery architecture, consumer-side hardening, signature verification, and the reconciliation loop that saves you when events go missing."
date: 2028-01-24
tags: ["API Design", "Programming", "Distributed Systems", "Integration", "Reliability"]
format: article
---

Webhooks won the integration world by being the simplest possible idea — "when something happens, I'll POST you some JSON" — and that simplicity is honest right up until real money flows through them. Then the questions arrive: what happens when the consumer is down for an hour? When the same event arrives twice? When an attacker figures out the endpoint URL? When events arrive out of order, or not at all, and two systems quietly disagree about reality? Every mature webhook implementation is an answer to those questions; every immature one is scheduled to learn them one incident at a time.

Here's the design on both sides of the POST.

## Provider side: delivery is a queue problem, not an HTTP call

The foundational mistake providers make is firing webhooks *inline* — the business transaction commits and, in the same request path, an HTTP call goes out to whatever URL the customer registered. Now your checkout latency includes your customer's server performance, a slow consumer back-pressures your core flow, and a crash between commit and POST silently drops the event. The correct shape: **the business transaction writes an event via the transactional outbox; a separate delivery subsystem — a queue with workers — owns getting it to subscribers.** Delivery becomes an asynchronous, retryable, observable job, decoupled from the transaction that spawned it, and the core flow does not wait for the subscriber endpoint when the outbox is committed locally.

The delivery subsystem's contract: **retries with exponential backoff and jitter** spread over a generous horizon (hours to days — consumers deploy, restart, and have bad afternoons; the standard is to keep trying with growing gaps, then park), **per-endpoint circuit breaking and isolation** (one customer's dead endpoint must not consume the worker pool that serves everyone else — per-destination queues or concurrency budgets), a **dead-letter state with visibility** (failed-past-budget deliveries land somewhere customers can *see* — a dashboard of failed deliveries with manual replay is table stakes for a serious webhook product), and **timeouts that are short and documented** (a few seconds; you're delivering a notification, not waiting for their processing).

Delivery semantics, stated honestly in your docs: **documented retries that may duplicate events, with ordering only where explicitly guaranteed.** A lost acknowledgement creates delivery ambiguity, and ordered delivery requires additional coordination and tradeoffs — so instead of promising what you can't, give consumers what they need to cope: **an event ID** (for dedup), **a timestamp/sequence per resource** (so they can detect and handle out-of-order), and — the underrated one — **event payloads that carry state, not just deltas**, or at minimum a fetch-back URL, so a consumer processing events out of order or after a gap can converge on the truth rather than replaying history in the wrong sequence.

**Sign everything.** The standard mechanism: HMAC over the payload (plus an authenticated timestamp to limit replay windows, alongside deduplication) with a per-endpoint secret, sent as a header; consumers verify before trusting a byte. Support secret rotation with an overlap window (send signatures under old and new during the transition), and version your signature scheme — this corner of the design has enough sharp edges that adopting an established convention or the emerging standard-webhooks patterns beats inventing your own.

## Consumer side: the endpoint is an ingestion system in miniature

The consumer's prime directive: **acknowledge fast, process async.** The handler that verifies the signature, persists the raw event, enqueues processing, and returns the agreed success status within the documented ingestion deadline has a clear acceptance boundary; the handler that processes inline — calling three services and a database before responding — is a timeout generator that turns the provider's retries into duplicate-processing pressure. Persisting sufficient event information supports recovery and diagnosis. Raw payload retention must follow the data-handling policy, with access controls, minimization, and expiry.

From there, the standard hardening set: **dedup on event ID** (the inbox-table discipline of idempotent consumption — retrying delivery means consumers must be prepared for duplicates), **tolerate disorder** (process events as "reconcile resource to current state" where possible — fetch-current-then-apply beats trusting the event's snapshot when sequence gaps appear), **verify signatures with constant-time comparison and reject stale timestamps**, and **validate the payload schema** before it touches business logic — the webhook endpoint is an unauthenticated-by-default, internet-facing input; treat it with API-gateway seriousness (rate limits, size caps, and no, the URL being "secret" is not authentication).

## The reconciliation loop: webhooks are an optimization, not the source of truth

The design principle that separates resilient integrations from fragile ones: **identify the authoritative state and recovery API for the integration.** Events get dropped — by bugs, by outages, by the dead-letter queue nobody watched — and systems whose state is *only* the sum of received webhooks drift from reality with no mechanism to notice. The countermeasure is a **periodic reconciliation job**: poll the provider's list/state APIs on a schedule (hourly, daily — proportional to drift tolerance), diff against local state, repair and *alert* on discrepancies, because each discrepancy deserves classification, including expected eventual consistency and local processing errors. Providers, symmetrically, should expose the APIs that make reconciliation cheap (list-events-since-cursor endpoints are gold) — and their own delivery dashboards should let a customer answer "what did you send me yesterday?" without a support ticket.

This loop also reframes the reliability budget sensibly: with reconciliation as the backstop, webhook delivery needs to be *good* (fast, high-percentage), not *perfect* — an honest division of labor that's cheaper on both sides than pretending HTTP POSTs constitute a durable replication protocol.

## The operational rim

Whichever side you're on, the observables that matter: delivery success rate and latency per endpoint (provider), events received/processed/deduped/failed per source (consumer), dead-letter depth with age alarms (both), and end-to-end lag from business event to consumer processing — the metric that catches the quietly-backed-up queue before the business notices its data is an hour stale. Providers additionally owe their customers self-service: endpoint management, secret rotation, delivery logs, manual replay, and a test-event button — the difference between a webhook *feature* and a webhook *product* is entirely in this tooling layer.

The summary, both directions: providers — outbox to queue, retry with backoff, isolate per endpoint, sign with rotation support, document the bounded retry and recovery contract, including possible duplicates, and provide IDs/sequences/fetch-backs; consumers — ack fast and process async, dedup, verify, tolerate disorder, and reconcile on a schedule because the truth lives in the API. None of it is exotic; all of it is the difference between the integration pattern that quietly runs your partner ecosystem and the one that generates a genre of incident reports titled "data mismatch investigation." The POST was always the easy part.

## Define acceptance separately from business completion

An HTTP success response should mean something precise. For an asynchronous consumer, it can mean that the event was authenticated, validated enough for ingestion, and durably recorded for later processing. It should not mean “we started an in-memory task and hope it finishes.” If the process crashes after acknowledging but before durable acceptance, the provider may have no reason to retry.

Choose the durable boundary explicitly. An inbox row and a processing task can be created in one local transaction, or a durable queue can serve as the acceptance point under a documented design. If the database write and queue publish are separate, examine the crash window between them. A periodic scanner of unprocessed inbox rows or an outbox can close that gap without requiring the request handler to complete the business workflow.

Document which status codes trigger retries and for how long. Provider behavior differs. A finite retry horizon does not guarantee that every event will eventually arrive during an indefinite outage. State retention, replay availability, and the recovery process after the horizon expires. Consumers need to know whether a manual replay uses the same event identifier and how signatures and timestamps are regenerated.

## Worked example: transport attempts and distinct events

Consider one thousand hypothetical distinct events. Nine hundred succeed on the first attempt. Of the remaining one hundred, eighty succeed on the second, fifteen on the third, and five remain undelivered after the configured budget. The chart shows 900,80,15, and 5 events by outcome category. Delivered distinct events total 995, giving 99.5% delivery within this synthetic budget.

The first three attempts generate 1,000 +100 +20 =1,120 HTTP attempts if every failed event reaches each successive attempt. That count includes the five still failing on the third attempt. It is different from the 995 delivered events and different again from the number of business effects applied by the consumer. A lost acknowledgement can cause an event already accepted by the consumer to appear unsuccessful to the provider.

These values are invented for explaining denominators. A real report should define success, retry horizon, cohort start time, and observation cutoff. Events still within their retry window should not be mixed with terminal failures. Report latency and oldest undelivered age alongside the percentage; a high eventual delivery rate can coexist with unacceptable business delay.

## Verify the exact signed representation

Signature schemes define the bytes to authenticate, often including the raw request body, timestamp, and event identifier. Parsing JSON and serializing it again can change whitespace or field order and invalidate the signature. Preserve the raw body as required by the provider's library or specification, enforce a size limit, and verify before trusting the event's business fields.

A timestamp check limits some replay opportunities only when the timestamp is included in the authenticated material and the consumer's clock is reasonably accurate. It does not remove the need for deduplication. Legitimate retries may arrive much later than the original event, with provider-specific signature timestamp behavior. Follow the documented scheme rather than inventing a stale-event rule that rejects valid delivery attempts.

Use the provider's maintained verification library when suitable and test secret rotation. An overlap period can permit old and new credentials while endpoints transition. Store secrets by endpoint and environment, restrict access, and avoid logging them. A successful signature proves knowledge of the signing secret or key; authorization still needs to bind the event to the expected account or tenant.

## Design outbound delivery against SSRF and noisy neighbors

A provider that accepts customer-configured webhook URLs is making outbound requests to destinations it does not fully control. Validate allowed schemes and destinations, protect cloud metadata and internal services, and handle DNS resolution and redirects according to a reviewed SSRF defense. A simple string check for localhost is insufficient when addresses can resolve or redirect elsewhere.

Isolate endpoint behavior with concurrency limits, timeouts, and fair scheduling. One subscriber that never responds should not occupy every worker. Bound response-body handling as well as request duration. A webhook sender generally needs a delivery outcome, not an unlimited response document. Record enough diagnostics for support without retaining sensitive response content unnecessarily.

Retry with backoff and jitter under a total budget. Respect documented retry hints when appropriate, but do not allow an endpoint to schedule unbounded work or bypass tenant limits. Expose terminal failures and replay controls with authorization and auditability. Replaying a large backlog can overload the consumer, so rate and scope the operation deliberately.

## Reconciliation depends on the business semantics

Fetching the provider's current resource state is useful when the consumer maintains a projection of that state. It is not sufficient for every event. A transient action, an audit requirement, or an ordered financial ledger may require event history rather than only the latest snapshot. Identify whether the authoritative source is a current-state API, an event log, or another business record.

Use cursors or stable pagination where the provider supports them. A list operation over changing data can otherwise miss or duplicate records between pages. Record the reconciliation checkpoint only after the corresponding local work is durable. Include a strategy for deleted resources and for records outside the normal retention window.

Classify discrepancies before repairing them. Expected eventual consistency, local processing failure, schema changes, and missing delivery require different responses. A repair should be idempotent and auditable. Avoid repeatedly overwriting a newer local decision with an older upstream snapshot; use version or ownership rules that reflect the actual business contract.

## A failure-injection lab

Build a local receiver using synthetic events and a durable inbox. Send the same signed event twice and verify one business effect. Send two different events for the same resource out of order and verify the chosen ordering or reconciliation rule. Change the payload while retaining an old signature and confirm rejection. Test a legitimate rotated secret during the overlap window.

Interrupt the receiver after persistence but before the response, then retry. The duplicate should be recognized without losing the original work. Interrupt the worker after the business transaction but before marking completion, and verify the effect remains safe on recovery. If those operations occur in different systems, document the compensating mechanism instead of pretending the test is atomic.

Finally simulate a prolonged outage that exhausts the retry budget. Verify the terminal state, alert, replay authorization, and reconciliation route. A complete webhook design is not demonstrated only by a fast successful POST. It is demonstrated by understandable behavior when acknowledgements are lost, events repeat, ordering changes, and a human needs to repair the integration safely.

## Sources and further reading

- [Stripe · Receiving webhooks](https://docs.stripe.com/webhooks)
- [Standard Webhooks · Specification](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)
- [Chris Richardson · Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
