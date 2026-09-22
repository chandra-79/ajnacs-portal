---
title: "Rate Limiting by Design: Algorithms, Placement, and the Client Contract"
description: "Rate limiting is the API's immune system — and most implementations are a config value someone guessed. Token buckets vs sliding windows, where limits belong in the stack, multi-tenant fairness, and the response contract that makes clients behave."
date: 2027-01-15
tags: ["API Design", "Programming", "Reliability", "Distributed Systems", "Architecture"]
format: article
---

Rate limiting has a humble reputation — a config line on the gateway, a 429 in the docs — that undersells what it actually is: the mechanism by which a shared service stays alive under the aggregate enthusiasm of its clients. Every capacity incident that begins "one integration started retrying in a loop" or "a batch job hit the API with 50 concurrent workers" is a rate-limiting design gap wearing an operational costume. And like most protective mechanisms, it's a *contract* problem as much as an infrastructure one: limits that clients can't observe, predict, or respond to don't shape behavior — they just convert overload into mystery errors.

Here's the design space, from algorithm to organizational policy.

## Algorithms: know what you're actually promising

The choice of algorithm is a choice about what "N requests per minute" *means*, and the differences bite at the edges:

**Fixed window** (counter resets each minute) is trivially cheap and has the famous boundary flaw: a client can send N requests at 11:59:59 and N more at 12:00:01 — double the intended rate across the boundary. Fine for coarse abuse control; wrong where the limit protects real capacity.

**Sliding window** (log or, more practically, the weighted two-window approximation) fixes the boundary at modest cost and is the sensible default for per-client API quotas: smooth enforcement, no burst-at-the-boundary artifact, cheap enough to run in Redis for millions of keys.

**Token bucket** — tokens drip in at rate R, each request spends one, bucket caps at burst size B — is the workhorse when you want to *permit bursts while bounding sustained rate*, which matches how real clients behave (bursty by nature, steady on average). Its cousin the **leaky bucket** enforces smooth outflow — the right shape when the protected resource genuinely can't absorb bursts (a fragile downstream, a per-connection database).

The practical guidance: token bucket (rate + burst) for client-facing quotas because its two parameters map to the two things you actually want to say ("100/sec sustained, bursts to 500"); sliding window when simplicity wins; and **concurrency limits as a separate, complementary control** — "no more than 20 in-flight requests" protects against slow-request pileups that per-second rates miss entirely (a client sending 10/sec of 30-second requests is 300 concurrent — within rate, far past reasonable).

## Placement: limits are a layered defense, not a gateway checkbox

Where limits live determines what they can protect. The edge/gateway layer handles the volumetric and the unauthenticated — per-IP caps, bot pressure, the blunt instruments — and it's where the *first* limit belongs because work rejected at the edge costs almost nothing. Per-client authenticated quotas (the API-key/tenant tier) live at the gateway or API layer, where identity is known. But the layer teams skip is the one that saves them: **internal service-to-service limits and backpressure**. An external limit of 1,000/sec means little if an internal fan-out multiplies each request into 30 downstream calls; the mesh/client layer needs its own budgets (and the queue-depth-based shedding covered under SLO practice) so that overload degrades the system in the order you designed rather than at the weakest internal seam. Distributed enforcement brings the classic consistency trade: exact global counters (central Redis with atomic operations — the standard pattern, microsecond-cheap with Lua/atomic increments) versus node-local approximations with periodic sync (cheaper, slightly leaky, usually fine). Pay for exactness on the expensive limits (billing-tier quotas), accept approximation on the protective ones — a limit that's 3% permeable still stops the stampede.

One subtlety with outsized incident relevance: **cost-aware limiting**. Requests aren't equal — the search that scans a year is not the GET by ID — and pure request-count limits invite the pathology where clients optimize into fewer, monstrous requests. Weighted quotas (points per request class, as GraphQL cost analysis and the better REST APIs do) align the limit with the resource it exists to protect.

## The client contract: 429 is an interface, design it

The response side is where rate limiting becomes API design. The contract that produces well-behaved clients: **429** (or 503 for "we're degraded, everyone back off" — the distinction is meaningful: 429 says *you*, 503 says *us*) with **Retry-After** set honestly, plus the rate-limit headers (limit/remaining/reset — now on an IETF standards track; use the standard names as they settle) so clients can *pace themselves before* hitting the wall rather than discovering it by bouncing off. Document limits per plan/tier in the API docs like the interface elements they are, and version changes to them like breaking changes — because to a client integration, they are.

And because clients are the other half of the protocol: your own SDKs should ship the correct behavior — **exponential backoff with jitter, honoring Retry-After, budget-capped retries** — because the retry storm that takes services down is usually written by well-meaning integrators defaulting to `while (true) retry()`. Every retry guide in your docs is cheap insurance; the *jitter* specifically is what prevents synchronized-thundering-herd recovery, and it's the piece naive implementations always omit.

Inside the house, the mirror-image discipline: services calling *others'* rate-limited APIs need client-side limiters (respect the budget proactively), circuit breakers (stop hammering what's failing), and — for work that can wait — queues that smooth bursts into sustainable drain rates. The most elegant rate-limit compliance is an architecture that doesn't need to exceed them.

## Fairness, tiers, and the operational loop

Multi-tenant reality adds the dimension naive limits miss: a global limit with no per-tenant partitioning means one noisy tenant consumes the whole budget and the 429s land on everyone — the *fairness* failure that turns one customer's bug into every customer's outage. Per-tenant buckets are the floor; weighted fair queuing (or simply tiered buckets by plan) where contention is real; and isolation of the pathological (the tenant whose traffic pattern is abusive gets shunted to a quarantine pool, not allowed to define everyone's experience).

Operationally, treat limits as living capacity policy: **derive them from measured capacity** (load-test-informed, with the limit set below the melt point, leaving headroom for the unlimited internal traffic and the failure-mode math), **alert on approach** (a tenant at 85% sustained is a conversation, not a 429 — often literally a sales conversation about the next tier), **log every rejection with identity** (rate-limit telemetry is product analytics: who needs a higher tier, which endpoint's limit is mis-set, where the next capacity investment goes), and **review quarterly** against actual capacity evolution, because limits set in 2024 against 2024's database are quietly wrong in either direction by 2026.

The summary: pick the algorithm that says what you mean (usually token bucket), enforce in layers with the edge first and the internal seams not forgotten, weight by cost where requests differ, make the 429 a well-documented interface with honest headers, partition by tenant before one client can starve the rest — and operate the whole thing as capacity policy with a feedback loop. Done this way, rate limiting stops being the thing clients complain about and becomes the reason the API they're integrating against is still up.
