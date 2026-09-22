---
title: "Designing for Failure: Resilience Patterns That Actually Hold in Production"
description: "Circuit breakers, bulkheads, retry logic, chaos engineering — the resilience patterns that genuinely reduce MTTR and the ones that look good on architecture diagrams but fail when things get real."
date: 2025-05-08
tags: ["Cloud Architecture", "Infrastructure", "Observability"]
format: article
---

Something shifts in how you think about system design after you've been in enough production incidents. You stop trying to prevent all failure and start designing for recovery. The question changes from "how do we make sure this never breaks" to "when this breaks — and it will — how fast do we get back?"

Here are the patterns I've found worth investing in, and a few that sound better in theory than they perform under pressure.

---

## The circuit breaker — useful, but often implemented wrong

The circuit breaker pattern (from Michael Nygard's *Release It!*) is one of the most widely referenced resilience patterns, and one of the most frequently misconfigured.

The idea: track failure rates for calls to a downstream service. When failures exceed a threshold, "open" the circuit and stop making calls — return a fast failure instead of waiting for timeouts. After a reset period, allow limited calls through to test if the downstream has recovered.

Where it breaks down in practice: teams set thresholds too high (the circuit never trips until the damage is done), or the fallback for an open circuit isn't designed (an exception is thrown instead of graceful degradation), or the circuit opens and the team doesn't know because there's no alerting on state changes.

A circuit breaker that opens without alerting is worse than no circuit breaker — it silently degrades service without anyone knowing why.

**What makes it work:** aggressive thresholds, tested fallback paths, and monitoring on circuit state. If your circuit breaker has never opened in production, you probably haven't tested it.

---

## Bulkheads — the most underused pattern

Named after the watertight compartments in a ship's hull. If one compartment floods, the others remain intact.

In software: isolate resources (thread pools, connection pools, process boundaries) so that failure in one part of the system doesn't cascade into others.

The most common failure mode I've seen: a single shared database connection pool. One slow query (or one database under load) backs up the connection pool, all queries queue waiting for connections, the entire application grinds to a halt — including endpoints that don't touch the slow part of the database.

Bulkheads fix this by giving critical paths their own resource pools. Your user authentication endpoint has its own connection pool. Your analytics queries have theirs. When analytics are slow, authentication keeps working.

This requires more configuration upfront and more resource allocation. It's worth it for anything on a critical path.

---

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

---

## Timeouts — the most basic thing that's most often misconfigured

Every external call your application makes should have a timeout. This sounds obvious. In practice, I've found database connections without timeouts, HTTP clients using default settings that allow indefinite waits, and third-party SDK calls that can block a thread forever.

A hung thread waiting for a timeout that never comes is a resource leak. Enough of them and your application stops processing new requests.

**Default timeouts are almost always wrong.** Cloud SDKs often default to no timeout or to very long timeouts. Set explicit values based on your SLO requirements and what's operationally acceptable. A user waiting more than 5 seconds for a response is already having a bad experience — there's no reason for your database timeout to be 30 seconds.

The tricky part: timeouts need to be set at every layer. A 5-second HTTP timeout at the load balancer doesn't help if your application server waits 30 seconds for a database response before responding to the load balancer. Model the full call chain.

---

## Graceful degradation — the gap between theory and practice

The principle: when a non-critical dependency is unavailable, the system should continue functioning with reduced capability rather than failing entirely.

In practice: teams add the circuit breaker, implement the fallback — and the fallback path is a stub that was written in 10 minutes and never tested. It throws a NullPointerException, or returns an empty object that downstream code wasn't written to handle, or logs an error message and returns a 500.

Graceful degradation requires treating the degraded path as a first-class concern:
- Write the fallback code with the same care as the happy path
- Test the fallback explicitly — including in staging under load
- Monitor the degraded state so you know when you're running in it

The systems that handle failures elegantly aren't the ones with the most sophisticated patterns — they're the ones where the degraded paths are actually used in drills and tested regularly.

---

## Chaos engineering — valuable, but start small

Netflix's Chaos Monkey made chaos engineering famous, and the concept is sound: intentionally introduce failures in controlled ways to verify your resilience assumptions before production does it for you.

Where teams go wrong: they either don't do it at all ("we'll do it when things are more stable" — they never are), or they jump straight to large-scale chaos experiments on production systems before they've built the observability to understand what they're seeing.

A better starting point: chaos in staging, against known failure modes. Kill one instance and verify load balancing redistributes correctly. Delay one dependency and verify circuit breakers trip and fallbacks engage. Fill a disk and verify log rotation is working. These simple experiments surface surprising gaps.

Grow to production experiments only when your monitoring is good enough to detect anomalies quickly and your team has practiced the response.

---

## What actually moves the needle on MTTR

The resilience patterns above matter. But in practice, when I've seen MTTR improve meaningfully, it almost never came from one pattern landing well. It came from three operational investments happening together:

**Observability first** — Prometheus + Grafana + distributed tracing with OpenTelemetry, set up before anything else. You cannot recover fast from something you cannot see.

**Runbooks for the top failure modes** — documented, tested, and actually maintained. When an incident happens at 3am, the engineer on call should be following a tested procedure, not doing diagnosis from a blank state. Runbooks that are six months out of date are worse than no runbooks — they create false confidence.

**Narrow auto-remediation** — specific scripts that restart a specific service when a specific metric crosses a specific threshold, triggered by alerting rules. Not general "fix anything" automation, which fails unpredictably. The scope has to match the confidence level.

The patterns are the architecture. The operational discipline — the runbooks, the drills, the regular review cycles — is what makes them work under pressure.

*What's your current MTTR, and what's the biggest contributor to it? [I'd like to hear.](/about)*
