---
title: "Designing for Failure: Resilience Patterns That Actually Hold in Production"
description: "Circuit breakers, bulkheads, retry logic, chaos engineering — the resilience patterns that genuinely reduce MTTR and the ones that look good on architecture diagrams but fail when things get real."
date: 2026-01-07
tags: ["Cloud Architecture", "Infrastructure", "Observability"]
format: article
---

Something shifts in how you think about system design after you've been in enough production incidents. You stop trying to prevent all failure and start designing for recovery. The question changes from "how do we make sure this never breaks" to "when this breaks — and it will — how fast do we get back?"

Here are the patterns I've found worth investing in, and a few that sound better in theory than they perform under pressure.

## What to measure

**Load amplified by retries.** At 1,000 original requests/s, an average of 0.25 retries per original request adds 250 requests/s. Track original-request outcomes and attempts at the same boundary. Check how many layers retry before raising any retry budget.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [Google’s SRE Workbook, Implementing SLOs](https://sre.google/workbook/implementing-slos/).

## The circuit breaker — useful, but often implemented wrong

The circuit breaker pattern (from Michael Nygard's *Release It!*) is one of the most widely referenced resilience patterns, and one of the most frequently misconfigured.

The idea: track failure rates for calls to a downstream service. When failures exceed a threshold, "open" the circuit and stop making calls — return a fast failure instead of waiting for timeouts. After a reset period, allow limited calls through to test if the downstream has recovered.

Where it breaks down in practice: teams set thresholds too high (the circuit never trips until the damage is done), or the fallback for an open circuit isn't designed (an exception is thrown instead of graceful degradation), or the circuit opens and the team doesn't know because there's no alerting on state changes.

A circuit breaker that opens without alerting is worse than no circuit breaker — it silently degrades service without anyone knowing why.

**What makes it work:** aggressive thresholds, tested fallback paths, and monitoring on circuit state. If your circuit breaker has never opened in production, you probably haven't tested it.

## Bulkheads — the most underused pattern

Named after the watertight compartments in a ship's hull. If one compartment floods, the others remain intact.

In software: isolate resources (thread pools, connection pools, process boundaries) so that failure in one part of the system doesn't cascade into others.

The most common failure mode I've seen: a single shared database connection pool. One slow query (or one database under load) backs up the connection pool, all queries queue waiting for connections, the entire application grinds to a halt — including endpoints that don't touch the slow part of the database.

Bulkheads fix this by giving critical paths their own resource pools. Your user authentication endpoint has its own connection pool. Your analytics queries have theirs. When analytics are slow, authentication keeps working.

This requires more configuration upfront and more resource allocation. It's worth it for anything on a critical path.

## Retry logic — helpful and dangerous

Retrying failed requests is reasonable. Retrying without care causes thundering herd problems that make outages worse.

The pattern that causes problems: naive retries with fixed delays. A downstream service fails. All clients retry simultaneously after 1 second. The downstream — which was just recovering — gets hit with a spike of concurrent retries and fails again. Loop repeats.

**Exponential backoff with jitter** breaks the synchronisation. Each retry waits exponentially longer, plus a random component that spreads retries across time rather than synchronising them. This is the implementation AWS, Google, and Azure all recommend in their SDKs, and it's the implementation most internal code gets wrong.

```python
import random
import time

def retry_with_backoff(func, max_retries=3, base_delay=1.0):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)
```

Also: retries are only safe for idempotent operations. Don't retry a payment initiation. Do retry a GET request or an idempotent PUT.

## Timeouts — the most basic thing that's most often misconfigured

Every external call your application makes should have a timeout. This sounds obvious. In practice, I've found database connections without timeouts, HTTP clients using default settings that allow indefinite waits, and third-party SDK calls that can block a thread forever.

A hung thread waiting for a timeout that never comes is a resource leak. Enough of them and your application stops processing new requests.

**Default timeouts are almost always wrong.** Cloud SDKs often default to no timeout or to very long timeouts. Set explicit values based on your SLO requirements and what's operationally acceptable. A user waiting more than 5 seconds for a response is already having a bad experience — there's no reason for your database timeout to be 30 seconds.

The tricky part: timeouts need to be set at every layer. A 5-second HTTP timeout at the load balancer doesn't help if your application server waits 30 seconds for a database response before responding to the load balancer. Model the full call chain.

## Graceful degradation — the gap between theory and practice

The principle: when a non-critical dependency is unavailable, the system should continue functioning with reduced capability rather than failing entirely.

In practice: teams add the circuit breaker, implement the fallback — and the fallback path is a stub that was written in 10 minutes and never tested. It throws a NullPointerException, or returns an empty object that downstream code wasn't written to handle, or logs an error message and returns a 500.

Graceful degradation requires treating the degraded path as a first-class concern:
- Write the fallback code with the same care as the happy path
- Test the fallback explicitly — including in staging under load
- Monitor the degraded state so you know when you're running in it

The systems that handle failures elegantly aren't the ones with the most sophisticated patterns — they're the ones where the degraded paths are actually used in drills and tested regularly.

## Chaos engineering — valuable, but start small

Netflix's Chaos Monkey made chaos engineering famous, and the concept is sound: intentionally introduce failures in controlled ways to verify your resilience assumptions before production does it for you.

Where teams go wrong: they either don't do it at all ("we'll do it when things are more stable" — they never are), or they jump straight to large-scale chaos experiments on production systems before they've built the observability to understand what they're seeing.

A better starting point: chaos in staging, against known failure modes. Kill one instance and verify load balancing redistributes correctly. Delay one dependency and verify circuit breakers trip and fallbacks engage. Fill a disk and verify log rotation is working. These simple experiments surface surprising gaps.

Grow to production experiments only when your monitoring is good enough to detect anomalies quickly and your team has practiced the response.

## What actually moves the needle on MTTR

The resilience patterns above matter. But in practice, when I've seen MTTR improve meaningfully, it almost never came from one pattern landing well. It came from three operational investments happening together:

**Observability first** — Prometheus + Grafana + distributed tracing with OpenTelemetry, set up before anything else. You cannot recover fast from something you cannot see.

**Runbooks for the top failure modes** — documented, tested, and actually maintained. When an incident happens at 3am, the engineer on call should be following a tested procedure, not doing diagnosis from a blank state. Runbooks that are six months out of date are worse than no runbooks — they create false confidence.

**Narrow auto-remediation** — specific scripts that restart a specific service when a specific metric crosses a specific threshold, triggered by alerting rules. Not general "fix anything" automation, which fails unpredictably. The scope has to match the confidence level.

The patterns are the architecture. The operational discipline — the runbooks, the drills, the regular review cycles — is what makes them work under pressure.

*What's your current MTTR, and what's the biggest contributor to it? [I'd like to hear.](/about/)*

## Allocate the end-to-end deadline before adding retries

Begin with the deadline at the boundary customers experience. Then reserve time for local admission, connecting to a dependency, the dependency's work, a response, and any fallback. Bound each attempt using the remaining deadline. A connection timeout measures something different from time waiting for a pooled connection or reading the full response. Instrument those phases separately. If the caller abandons a request, use cancellation where the protocol and dependency support it, and check whether actual work stops. Closing a socket or future can still leave a remote write executing. Treat uncertain completion as a business state that the next request can resolve rather than assuming the work rolled back.

Here is an illustrative 800 ms budget. Reserve 100 ms for admission and serialization and 100 ms for response processing or a small fallback. The dependency path gets 600 ms. An initial attempt capped at 240 ms, a pause of at most 80 ms, and a second attempt capped at 240 ms use at most 560 ms inside that path. The 40 ms remainder covers observed scheduling variation only if the bound remains true under load. If a queued operation has already consumed 300 ms more than expected, a second attempt has no useful time left. Do not launch it merely because a library allows two tries. Propagate the deadline to downstream work rather than allowing every hop to start its own full timer.

Identify requests by a stable operation reference when a repeat may be appropriate. The client can lose a response after the server commits. A repeat then needs the recorded result or an explicit indication that the first operation is still being resolved. Keep operation state for an agreed retry horizon and bind reuse to the same intent. Where the provider has no supported method to reconcile uncertain completion, prefer an operator-visible pending outcome over another blind attempt. Do not retry all exceptions. A permanent validation error and a temporary throttling response have different meanings. Observe what the dependency actually recommends for overload, including any retry guidance, and compare it with the time left.

## Test the retry budget at the dependency rather than one client

An application may look cheap on paper while its service mesh, SDK, and job runner add independent attempts. List every place an operation can be repeated. In a simple illustrative chain of three layers where each may send three total attempts, a failure below all of them can lead to up to 27 calls for one original request. Moving retry ownership to one layer with three total attempts caps that modeled worst case at three, assuming the other layers really do stop repeating. Verify this in a controlled exercise. Record request identifiers at ingress, attempt identifiers at the dependency, and outcomes attributed to the original request.

The useful limit is shared across active requests. Suppose a dependency can sustain 1,200 attempts a second in a failed mode and new work already creates 1,100 attempts a second. An additional retry budget of 200 a second would demand 1,300, beyond the measured envelope. Even a limit of 100 leaves no margin for variability. An illustrative allowance of 50 attempts a second places the modeled total at 1,150. Verify that it is responsive to the change in offered load. A token bucket can support a brief burst, but a refilled pool on every replica can still produce a large aggregate burst when the service scales out. Stagger replenishment or use a policy whose fleet-wide bound is known. Test at peak concurrency and record both original and retried success.

Choose jitter relative to the intended delay envelope. Adding a small random amount to a large common delay can still cluster attempts. Give the policy an upper bound tied to the original deadline. Check actual timing when many clients receive the same failure or throttling response. Sampling only one client's attempts cannot establish coordination across a fleet. Retain a separate count of outcomes that improved after retry and the extra work caused. If the positive outcomes are few while queueing and errors grow elsewhere, reduce the budget or eliminate that retry.

## Design a bulkhead that survives a shared downstream constraint

Separate concurrency at the point where work competes, such as a queue, executor, connection pool, or tenant admission boundary. Two independent client pools can still overwhelm one storage service. Reserve capacity for the critical operation at the shared boundary or make its dependency separate. Use bounded queues, because the worker count alone says nothing about how many pending operations occupy memory or how long customers wait. A request refused promptly at a safe boundary often creates less work than a request accepted, delayed beyond its useful lifetime, and retried.

For a worked scenario, imagine a checkout service needs 30 database connections at peak and report generation uses a pool of 60 against a database tested for 75 active connections with the chosen mix. Providing both their requested limits allows 90 active connections. A bulkhead that reserves 30 for checkout and caps reporting at 40 limits their total to 70 and leaves five for operational or incidental work if the database and product mix permit it. This is an example allocation, not a tuning rule. Verify using a mixed workload that report contention does not increase checkout lock waits or storage latency even when connection counts remain within bounds. Some resources, including shared row locks or I/O queues, do not correspond directly to the connection quota.

## Rehearse a partial fallback as a real customer workflow

Choose a promised minimum outcome for each degraded state. A cached shipment status may be useful if it carries its observation time and customers can still complete critical writes. An outdated eligibility or price decision may instead require a blocked or pending outcome with a clear next step. Define a staleness limit, what happens on a cache miss, and how authorization rules remain enforced. An error that returns a response without the primary payload may still be a failed operation. Track degraded successes separately so the system does not appear healthy simply because a fallback returns a successful HTTP status.

In rehearsal, slow a single authorized dependency rather than dropping all traffic by default. Verify the circuit's metrics, the protected bandwidth, and the user-facing outcome. Test the transition back with a small set of probes using known-safe requests. If recovery briefly restores throughput before the dependency becomes saturated again, expand slowly and observe both sides of the boundary. Limit the number of half-open probes across clients so they do not become a new load spike. Abort the exercise if the fallback begins changing data outside its scope or if the escalations needed to stop it are unavailable.

Complete the review with a prioritized list of observed failure behaviors. Record time to first degraded response, share of requests correctly served at the minimum capability, dependency attempts, queued work at the end of the test, and recovery time. Repeat with warmer and colder caches if the fallback depends on freshness. A successful test on one dependency does not establish safe behavior for a correlated outage. Rehearse combinations only after the team can explain and safely stop the individual tests.

[AWS guidance on timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) and [Google SRE guidance on cascading failures](https://sre.google/sre-book/addressing-cascading-failures/)

For a difficult design review, ask the upstream and downstream teams to describe the same deadline and attempt count from their respective logs. If one team reports original operations and the other reports individual attempts, put both numbers on the page before setting a policy. If the upstream measures only completed responses, include operations that ended before any reply. Compare cancellation evidence with the dependency's completed work. That exercise often explains why one service reports a reduction in timeouts while the database continues doing work for departed customers. Keep a list of boundary cases where it is not yet possible to prove an outcome, such as a write with an interrupted response and no status query. Fixing that interface may improve resilience more than an additional circuit rule, because responders can distinguish late success from work that genuinely needs another attempt.
