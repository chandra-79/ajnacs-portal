---
title: "Error Handling as API Design: Problem Details and Safe Recovery"
description: "Define stable problem types, actionable validation feedback, safe retry rules and evidence for ambiguous outcomes."
date: 2027-10-29
tags: ["API Design", "Programming", "Reliability", "Developer Experience", "Distributed Systems"]
format: article
---

Read any API's documentation and you'll find the success cases lovingly specified — every field, every example — while the errors get a table of status codes and a shrug. Then read the client code consuming that API: half of it is error handling, written by inference, guesswork, and bitter experience. Errors are not the exception path of an API; they're **half its behavioral surface**, the half that determines whether integrations degrade gracefully or catastrophically — and designing them deserves the same contract discipline as the happy path, because the client engineer at 2 AM is reading your error body, and what they find there decides how long their incident lasts.

## The transport layer: status codes and problem details

HTTP status codes carry less information than folklore assigns them, and the discipline is using them for what they *do* reliably signal — the coarse routing of client behavior: **4xx identifies a client-error status family, with recovery depending on the specific condition** (400 malformed, 401 authenticate, 403 authorized-no, 404 absent, 409 conflict; failed conditional-request preconditions commonly use 412, 422 semantically invalid, 429 slow down — with the rate-limit headers), **5xx identifies a server-error status family, but does not by itself make retrying safe** (500 unknown, 502/504 upstream trouble, 503 overloaded — with Retry-After, per the load-shedding contract). The classic sins are miscategorizations that break client retry logic: validation failures returned as 500s (clients retry the unretryable, uselessly, at volume), downstream timeouts returned as 400s (clients abandon the retryable), and the everything-is-200-with-an-error-body pattern (which blinds every piece of HTTP-aware infrastructure — proxies, monitors, the SLI math from observability practice — and forces every client into bespoke parsing before it can even triage).

The body, meanwhile, finally has a standard worth adopting: **RFC 9457 problem details** — `application/problem+json` with `type` (a URI identifying the error kind — your machine-readable taxonomy), `title`, `status`, `detail` (human-readable specifics), `instance`, and extension fields. The interoperability is nice; the real value is that adopting it forces the design work the shrug-table skipped: enumerating your error *types* as stable, documented identifiers that clients can switch on — which is the actual contract. The house rules that make it work: **error types are API surface** (versioned, documented, never renamed casually — clients build logic on them, per every API-evolution discipline), **one shape everywhere** (the multi-team API where auth errors, validation errors, and business errors arrive in three formats is the developer-experience failure the gateway should be normalizing), and **validation errors carry the field map** (an `errors` extension array with per-field paths and codes — the difference between a form that highlights the bad input and one that says "invalid request" while the user guesses).

## The semantic layer: what clients actually need to know

Strip away formats and a consuming client needs four facts about any failure, and your error design succeeds exactly insofar as it answers them mechanically: **Is it my fault or yours?** (the 4xx/5xx axis, honestly applied). **Can I retry — and how?** (the retryability contract: explicit, per error type, with Retry-After where applicable — because the client's retry policy *is* your load profile during incidents, per the retry-storm physics; an API that doesn't distinguish "terminal decline" from "transient failure" trains its clients to retry payments, which is how idempotency-key omissions become double charges). **What exactly was wrong?** (the field-level detail, the violated constraint, the conflicting resource — specificity here is measured in support tickets that don't get filed). **What do I tell my user / my logs?** (a stable error code for programmatic handling, a human message that is *not* the internal exception — the stack trace in the response body is simultaneously a security finding, per every hardening checklist, and an admission that the error path was never designed; internal detail belongs in your logs, joined by the correlation ID that *does* belong in the response, so the support conversation can connect the user's screenshot to your traces in one hop).

That correlation-ID habit deserves its sentence of emphasis: every error response carrying the request/trace ID (the structured-logging context, surfaced) converts "customer says it failed sometime yesterday" from an archaeology sprint into a lookup — the single cheapest debuggability investment in the API layer.

## The internal disciplines that make the contract keepable

The external contract is only as good as the internal error architecture beneath it: **map at the boundary, once** (domain exceptions translated to problem-details in one exception-handling layer — the hexagonal edge doing its job — rather than per-endpoint improvisation; this is where the one-shape-everywhere rule is enforced structurally), **preserve useful error categories at the source** (internal error types carrying enough context for the operation boundary to decide safe recovery, so the boundary mapping and the retry middleware and the circuit-breaker logic all read one classification instead of re-deriving it — the same taxonomy serving the API, the queue consumers' dead-letter decisions, and the alert routing), **preserve the cause chain internally** (wrapped errors with context accumulating toward the boundary — then *truncated* at it, per the leak rule), and **treat error rates as the product metric they are** (per-type error dashboards — a spike in `validation_failed` after a client's deploy is *their* incident surfaced in *your* telemetry, and the good-API-citizen move is alerting that supports asking them; a rising `conflict` rate is a concurrency lesson arriving, per the isolation-levels curriculum). And test the error paths with the same seriousness as success paths — the contract tests that assert error shape and code per scenario are the ones that catch the framework upgrade quietly changing your 422s to 400s, which is a breaking change that no happy-path suite will ever see.

The closing reframe: an API's errors are its behavior under the conditions that matter most — contention, overload, bad input, partial failure — which is to say, the conditions every other discipline in this series exists to manage. Design them as a first-class contract (stable types, honest retryability, field-level specificity, correlation IDs, one shape), and your API composes into resilient systems; leave them as the shrug table, and every consumer rebuilds the missing contract by trial, error, and incident — at their expense first, and eventually at yours.

## Separate a rejected request from an uncertain outcome

A request can fail before any effect occurs, after an effect commits, or while the caller cannot tell which happened. Those states require different recovery behaviour. An invalid amount can be corrected and resubmitted. A lost response after an accepted transfer requires lookup or idempotent replay, not a new operation identifier and blind retry.

HTTP status alone cannot encode that full distinction. A 429 response can invite a delayed retry, even though it is a 4xx status. A 500 response does not establish that no side effect occurred. A client receiving no HTTP response has even less information. Document recovery at the operation and problem-type level, including the idempotency and reconciliation mechanism.

For a fictional export API, a validation failure means no export was created. An accepted export returns a stable job identifier. If the creation response is lost, a client reuses the same idempotency key and can retrieve the same job. A later processing failure is represented on the job resource. This separates submission transport failure from asynchronous job outcome.

## A hypothetical retry-amplification example

Assume 100 original requests encounter a transient dependency outage. A policy allowing two retries per original request can generate up to 300 attempts: 100 first attempts plus 200 retries. If only twenty requests are eligible for one safe retry, the corresponding maximum is 120 attempts. The chart compares those upper bounds.

The numbers are synthetic and do not establish which policy is correct. A narrower retry policy can reduce load while also reducing recovery opportunities if it classifies failures incorrectly. The decision needs the operation's semantics, remaining deadline, observed failure modes, and the dependency's capacity. Backoff and jitter spread attempts; they do not make an unsafe operation safe to repeat.

Track original operations and attempts separately. A dashboard showing 300 requests without identifying retry traffic can mislead capacity analysis. Likewise, a successful third attempt should not hide the latency and load incurred by the first two. Record the final user outcome alongside attempt-level observations.

## Make problem types stable and messages changeable

Clients should branch on a documented machine identifier, not an English sentence. Human-readable detail can change for clarity or localisation. A problem type should explain the condition, expected status, relevant extension fields, and recovery guidance. Keep the actual HTTP status consistent with the response's semantics; the problem body's status member does not replace the transport status.

A validation extension can identify field paths and stable constraint codes. Avoid echoing a secret value, authentication token, or an entire rejected document. A message such as “the supplied credential is invalid” can be sufficient even when internal diagnostics know more. Account enumeration and authorisation boundaries may require deliberately limited detail.

An `instance` identifier or request correlation value can help support investigation, but it should not itself grant access to internal logs. Treat externally supplied correlation identifiers as untrusted input: constrain length and format, and avoid letting them inject log structure. Generated identifiers should be non-sensitive and useful across the actual observability pipeline.

## Handle errors produced outside the application

A gateway can reject an oversized body before the application sees it. A load balancer can return an unavailable response. An identity layer can reject a token, and an upstream proxy can time out while the application continues. The API's effective error surface includes those components, not just the framework exception handler.

Where practical, align their documented shapes and headers. Where alignment is impossible, clients should still handle an unknown or non-JSON error safely. Do not assume every unsuccessful response can be parsed as problem JSON. Check content type and status, preserve a bounded diagnostic excerpt, and show an appropriate generic user message when the body is unexpected.

Distinguish errors that can be exposed from errors that must remain internal. A database constraint name may reveal implementation detail without helping the caller. Map it to the relevant business conflict while retaining the cause internally. Avoid converting every exception into the same successful status or swallowing the original cause so completely that investigation becomes impossible.

## A contract test matrix

For one state-changing operation, create fixtures for malformed JSON, a missing required field, an unauthenticated caller, an authenticated but unauthorised caller, a stale precondition, an exhausted quota, a downstream timeout, and an unexpected internal failure. For each, assert the status, content type, stable problem identifier, required headers, and absence of sensitive detail.

Then test recovery. Correct the validation input, refresh an expired credential through the documented flow, retry an eligible operation with the same key, and reconcile an ambiguous result. A schema-only test can confirm the error body's shape while leaving the client unable to recover. The behaviour after the error is part of the contract.

Include concurrent duplicate requests and a failure after the business transaction commits but before the response is delivered. These cases expose whether the API can distinguish duplicate completion from a new operation. Use a disposable environment and synthetic effects so the test cannot create real charges or notifications.

## Observe errors without confusing responsibility

A rise in validation failures may indicate a client deployment, changed server validation, malicious traffic, or incorrect documentation. The status family is not a complete assignment of blame. Segment by operation, problem type, client version where appropriate, and time window. Keep identifiers out of high-cardinality metric labels unless the monitoring design explicitly supports them.

Define which outcomes count toward the service's availability objective. Expected business rejections may be valid service responses, while an unexpected authentication outage is not merely normal client error. Publish the classification and review changes when API behaviour evolves. Otherwise an error-mapping change can improve a dashboard without improving the user experience.

End the design review by giving another engineer only the public error documentation and the fixture responses. Ask them to implement recovery without reading server code. The places where they have to guess are missing parts of the API. Filling those gaps is a concrete improvement in reliability and developer experience.

## Further reading and source boundaries

- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [RFC 9110: HTTP semantics and conditional requests](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 6585: additional HTTP status codes](https://www.rfc-editor.org/rfc/rfc6585.html)
