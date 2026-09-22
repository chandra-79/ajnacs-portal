---
title: "Webhooks Done Right: Designing Reliable Delivery on Both Sides of the POST"
description: "Webhooks are the duct tape of system integration — simple to start, treacherous at scale. Provider-side delivery architecture, consumer-side hardening, signature verification, and the reconciliation loop that saves you when events go missing."
date: 2025-04-04
tags: ["API Design", "Programming", "Distributed Systems", "Integration", "Reliability"]
format: article
---

Webhooks won the integration world by being the simplest possible idea — "when something happens, I'll POST you some JSON" — and that simplicity is honest right up until real money flows through them. Then the questions arrive: what happens when the consumer is down for an hour? When the same event arrives twice? When an attacker figures out the endpoint URL? When events arrive out of order, or not at all, and two systems quietly disagree about reality? Every mature webhook implementation is an answer to those questions; every immature one is scheduled to learn them one incident at a time.

Here's the design on both sides of the POST.

## Provider side: delivery is a queue problem, not an HTTP call

The foundational mistake providers make is firing webhooks *inline* — the business transaction commits and, in the same request path, an HTTP call goes out to whatever URL the customer registered. Now your checkout latency includes your customer's server performance, a slow consumer back-pressures your core flow, and a crash between commit and POST silently drops the event. The correct shape: **the business transaction writes an event via the transactional outbox; a separate delivery subsystem — a queue with workers — owns getting it to subscribers.** Delivery becomes an asynchronous, retryable, observable job, decoupled from the transaction that spawned it, and the core flow never waits on anyone's endpoint.

The delivery subsystem's contract: **retries with exponential backoff and jitter** spread over a generous horizon (hours to days — consumers deploy, restart, and have bad afternoons; the standard is to keep trying with growing gaps, then park), **per-endpoint circuit breaking and isolation** (one customer's dead endpoint must not consume the worker pool that serves everyone else — per-destination queues or concurrency budgets), a **dead-letter state with visibility** (failed-past-budget deliveries land somewhere customers can *see* — a dashboard of failed deliveries with manual replay is table stakes for a serious webhook product), and **timeouts that are short and documented** (a few seconds; you're delivering a notification, not waiting for their processing).

Delivery semantics, stated honestly in your docs: **at-least-once, with no strict ordering.** Exactly-once over HTTP is fiction (a timeout after their 200 was sent means you retry a delivered event), and ordering guarantees across a retrying, parallel delivery system are prohibitively expensive — so instead of promising what you can't, give consumers what they need to cope: **an event ID** (for dedup), **a timestamp/sequence per resource** (so they can detect and handle out-of-order), and — the underrated one — **event payloads that carry state, not just deltas**, or at minimum a fetch-back URL, so a consumer processing events out of order or after a gap can converge on the truth rather than replaying history in the wrong sequence.

**Sign everything.** The standard mechanism: HMAC over the payload (plus a timestamp to kill replay) with a per-endpoint secret, sent as a header; consumers verify before trusting a byte. Support secret rotation with an overlap window (send signatures under old and new during the transition), and version your signature scheme — this corner of the design has enough sharp edges that adopting an established convention or the emerging standard-webhooks patterns beats inventing your own.

## Consumer side: the endpoint is an ingestion system in miniature

The consumer's prime directive: **acknowledge fast, process async.** The handler that verifies the signature, persists the raw event, enqueues processing, and returns 200 in tens of milliseconds is doing it right; the handler that processes inline — calling three services and a database before responding — is a timeout generator that turns the provider's retries into duplicate-processing pressure. Persist-then-process also gives you the raw-event archive that debugging ("what did they actually send us at 14:32?") will eventually require.

From there, the standard hardening set: **dedup on event ID** (the inbox-table discipline of idempotent consumption — at-least-once delivery makes duplicates a certainty, not a possibility), **tolerate disorder** (process events as "reconcile resource to current state" where possible — fetch-current-then-apply beats trusting the event's snapshot when sequence gaps appear), **verify signatures with constant-time comparison and reject stale timestamps**, and **validate the payload schema** before it touches business logic — the webhook endpoint is an unauthenticated-by-default, internet-facing input; treat it with API-gateway seriousness (rate limits, size caps, and no, the URL being "secret" is not authentication).

## The reconciliation loop: webhooks are an optimization, not the source of truth

The design principle that separates resilient integrations from fragile ones: **webhooks tell you when to look; the API tells you what's true.** Events get dropped — by bugs, by outages, by the dead-letter queue nobody watched — and systems whose state is *only* the sum of received webhooks drift from reality with no mechanism to notice. The countermeasure is a **periodic reconciliation job**: poll the provider's list/state APIs on a schedule (hourly, daily — proportional to drift tolerance), diff against local state, repair and *alert* on discrepancies, because each one is a delivery bug's fingerprint. Providers, symmetrically, should expose the APIs that make reconciliation cheap (list-events-since-cursor endpoints are gold) — and their own delivery dashboards should let a customer answer "what did you send me yesterday?" without a support ticket.

This loop also reframes the reliability budget sensibly: with reconciliation as the backstop, webhook delivery needs to be *good* (fast, high-percentage), not *perfect* — an honest division of labor that's cheaper on both sides than pretending HTTP POSTs constitute a durable replication protocol.

## The operational rim

Whichever side you're on, the observables that matter: delivery success rate and latency per endpoint (provider), events received/processed/deduped/failed per source (consumer), dead-letter depth with age alarms (both), and end-to-end lag from business event to consumer processing — the metric that catches the quietly-backed-up queue before the business notices its data is an hour stale. Providers additionally owe their customers self-service: endpoint management, secret rotation, delivery logs, manual replay, and a test-event button — the difference between a webhook *feature* and a webhook *product* is entirely in this tooling layer.

The summary, both directions: providers — outbox to queue, retry with backoff, isolate per endpoint, sign with rotation support, promise at-least-once and provide IDs/sequences/fetch-backs; consumers — ack fast and process async, dedup, verify, tolerate disorder, and reconcile on a schedule because the truth lives in the API. None of it is exotic; all of it is the difference between the integration pattern that quietly runs your partner ecosystem and the one that generates a genre of incident reports titled "data mismatch investigation." The POST was always the easy part.
