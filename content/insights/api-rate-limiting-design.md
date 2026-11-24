---
title: "Rate Limiting by Design: Algorithms, Placement, and the Client Contract"
description: "Compare token buckets and sliding windows, place admission controls, define tenant fairness and publish a client contract with bounded retries."
date: 2027-01-15
tags: ["API Design", "Programming", "Reliability", "Distributed Systems", "Architecture"]
format: article
---

Rate limiting has a humble reputation — a config line on the gateway, a 429 in the docs — that undersells what it actually is: the mechanism by which a shared service stays alive under the aggregate enthusiasm of its clients. Retry loops and excessive concurrency are reasons to inspect admission control alongside capacity, timeouts, and dependency behavior. And like most protective mechanisms, it's a *contract* problem as much as an infrastructure one: limits that clients can't observe, predict, or respond to don't shape behavior — they just convert overload into mystery errors.

Here's the design space, from algorithm to organizational policy.

## Algorithms: know what you're actually promising

The choice of algorithm is a choice about what "N requests per minute" *means*, and the differences bite at the edges:

**Fixed window** (counter resets each minute) is trivially cheap and has the famous boundary flaw: a client can send N requests at 11:59:59 and N more at 12:00:01 — double the intended rate across the boundary. Useful for some coarse quotas, but account for the boundary burst when using it to protect capacity.

**Sliding window** (log or, more practically, the weighted two-window approximation) avoids a hard reset boundary; an exact event log and a weighted approximation have different memory costs and accuracy. Benchmark the chosen representation at the expected key cardinality.

**Token bucket** — tokens drip in at rate R, each request spends one, bucket caps at burst size B — is the workhorse when you want to *permit bursts while bounding sustained rate*, which matches how real clients behave (bursty by nature, steady on average). The queue-based **leaky-bucket shaper** enforces smooth outflow — the right shape when the protected resource genuinely can't absorb bursts (a fragile downstream, a per-connection database).

The practical guidance: token bucket (rate + burst) for client-facing quotas because its two parameters map to the two things you actually want to say ("100/sec sustained, bursts to 500"); sliding window when simplicity wins; and **concurrency limits as a separate, complementary control** — "no more than 20 in-flight requests" protects against slow-request pileups that per-second rates miss entirely (a steady admitted rate of 10/sec with a mean 30-second residence time implies about 300 concurrent requests under stable conditions — within rate, far past reasonable).

## Placement: limits are a layered defense, not a gateway checkbox

Where limits live determines what they can protect. The edge/gateway layer handles the volumetric and the unauthenticated — per-IP caps, bot pressure, the blunt instruments — and it's where the *first* limit belongs because work rejected at the edge avoids downstream execution but still consumes edge resources. Per-client authenticated quotas (the API-key/tenant tier) live at the gateway or API layer, where identity is known. But the layer teams skip is the one that saves them: **internal service-to-service limits and backpressure**. An external limit of 1,000/sec means little if an internal fan-out multiplies each request into 30 downstream calls; the mesh/client layer needs its own budgets (and the queue-depth-based shedding covered under SLO practice) so that overload degrades the system in the order you designed rather than at the weakest internal seam. Distributed enforcement brings the classic consistency trade: coordinated counters (for example, Redis with an atomic admission operation, subject to network and failover behavior) versus node-local approximations with periodic sync (cheaper, slightly leaky, usually fine). Pay for exactness on the expensive limits (billing-tier quotas), accept approximation on the protective ones — the acceptable overshoot depends on the protected resource.

One subtlety with outsized incident relevance: **cost-aware limiting**. Requests aren't equal — the search that scans a year is not the GET by ID — and pure request-count limits invite the pathology where clients optimize into fewer, monstrous requests. Weighted quotas (points per request class, as GraphQL cost analysis and the better REST APIs do) align the limit with the resource it exists to protect.

## The client contract: 429 is an interface, design it

The response side is where rate limiting becomes API design. The contract that produces well-behaved clients: **429** for a rate-limit policy rejection, or 503 for temporary service unavailability with **Retry-After** set honestly, plus clearly documented quota information supported by your implementation so clients can *pace themselves before* hitting the wall rather than discovering it by bouncing off. Document limits per plan/tier in the API docs like the interface elements they are, and version changes to them like breaking changes — because to a client integration, they are.

And because clients are the other half of the protocol: your own SDKs should ship the correct behavior — **exponential backoff with jitter, honoring Retry-After, budget-capped retries** — because the retry storm that takes services down is usually written by well-meaning integrators defaulting to `while (true) retry()`. Every retry guide in your docs is cheap insurance; jitter reduces retry synchronization, but does not guarantee an absence of bursts; combine it with admission limits and a bounded retry budget.

Inside the house, the mirror-image discipline: services calling *others'* rate-limited APIs need client-side limiters (respect the budget proactively), circuit breakers (stop hammering what's failing), and — for work that can wait — queues that smooth bursts into sustainable drain rates. The most elegant rate-limit compliance is an architecture that doesn't need to exceed them.

## Fairness, tiers, and the operational loop

Multi-tenant reality adds the dimension naive limits miss: a global limit with no per-tenant partitioning means one noisy tenant consumes the whole budget and the 429s land on everyone — the *fairness* failure that turns one customer's bug into every customer's outage. Per-tenant buckets are the floor; weighted fair queuing (or simply tiered buckets by plan) where contention is real; and isolation of the pathological (the tenant whose traffic pattern is abusive gets shunted to a quarantine pool, not allowed to define everyone's experience).

Operationally, treat limits as living capacity policy: **derive them from measured capacity** (load-test-informed, with the limit set below the melt point, leaving headroom for the unlimited internal traffic and the failure-mode math), **alert on approach** (a tenant at 85% sustained is a conversation, not a 429 — often literally a sales conversation about the next tier), **record rejection counts and appropriately protected sampled diagnostic logs** (rate-limit telemetry is product analytics: who needs a higher tier, which endpoint's limit is mis-set, where the next capacity investment goes), and **review quarterly** against actual capacity evolution, because limits set in 2024 against 2024's database are quietly wrong in either direction by 2026.

The summary: pick the algorithm that says what you mean (usually token bucket), enforce in layers with the edge first and the internal seams not forgotten, weight by cost where requests differ, make the 429 a well-documented interface with honest headers, partition by tenant before one client can starve the rest — and operate the whole thing as capacity policy with a feedback loop. Done this way, rate limiting stops being the thing clients complain about and becomes the reason the API they're integrating against is still up.

## Work the admission arithmetic before choosing a datastore

Consider a fictional export API. This is a design exercise, not a measurement from a customer deployment. Its tenant bucket holds 40 tokens and refills at 10 tokens per second. A normal lookup costs one token; an export costs five. An empty bucket therefore admits ten lookups per second in steady conditions, or two exports, or a mixture with the same weighted cost. The weights are a policy approximation to resource consumption, not an assertion that every export costs exactly five times every lookup.

Start with a full bucket. At time zero, eight export requests consume all 40 tokens. At time one second, ten tokens have returned, so two more exports can be admitted. At time two, another two can enter. The chart shows accepted export counts of eight, two, and two at these three instants. Over a continuously busy interval of length T seconds, a correctly implemented initially full bucket admits at most B + R × T tokens, subject to boundary convention. It does not promise that any particular one-second window contains only ten tokens of work.

Now add the missing resource: an export takes an illustrative four seconds while holding a scarce worker. Eight simultaneous exports need eight workers before the next refill happens. If the service allocates only six workers to this tenant, the token bucket alone permits an unsafe burst. A separate six-in-flight control must reject, defer, or queue the seventh and eighth exports. State whether rejected admission consumes tokens; otherwise clients cannot predict the behavior and operators cannot reconcile the counters.

A bounded queue changes the contract again. If ten jobs wait behind six running jobs, queue time counts toward the user's deadline even if the worker has not started. Estimate the upper bound under a chosen job-duration assumption, then test a slow-job distribution. Do not calculate a precise completion promise from the average duration when a few exports take minutes. Rate, concurrency, queue capacity, maximum execution time, and deadline belong on the same worksheet.

## A small deterministic limiter lab

Implement a token-bucket model using an injected clock, so the test never depends on a real sleep. Store tokens, last-refill time, rate, and capacity. On each attempt, calculate elapsed time, refill with the smaller of capacity or existing tokens plus elapsed × rate, then compare against the request's cost. Advance the last-refill timestamp consistently even on rejection. For one process, a monotonic clock avoids wall-clock corrections changing elapsed time; a distributed design needs a deliberate shared-time or ownership strategy.

Write assertions for the example above: eight exports accepted at zero, a ninth rejected, two accepted at one second, and no token balance above 40 after a long idle period. Add a request whose cost exceeds capacity: it can never succeed under this policy, so returning an endlessly repeated retry hint is misleading. Give it a permanent validation response or a distinct execution path. Test fractional refill with fixed-point arithmetic or carefully specified rounding so the implementation does not create or destroy a growing number of tokens.

Then run simultaneous attempts against the actual storage implementation. Reading the balance, deciding, and writing separately is a race: two callers can both spend the same last token. The refill-and-spend transition must be atomic for the chosen key. If expiry is involved, counter creation and expiry must not leave immortal keys after a process failure. Redis documents this class of race in its counter examples; atomic execution still does not remove network delays, failover behavior, or durability choices.

Finally, terminate the limiter connection during admission. This is a product decision, not just an exception handler. A fail-open policy may preserve access while risking overload. A fail-closed policy protects a dependency while turning the limiter into an availability dependency. A third option is a conservative local emergency budget with an explicitly bounded duration. Exercise the selected mode and measure how quickly operators can identify that it has activated.

## Fairness has several denominators

A per-IP rule can penalize unrelated users behind one corporate gateway while allowing a distributed abusive client to spread traffic across addresses. A tenant rule can protect tenants from one another while allowing one integration within a tenant to monopolize its allocation. An endpoint rule can protect expensive search while making a cheap health request share an inappropriate quota. Write the identity hierarchy before allocating a bucket: source network, credential, tenant, operation class, and global resource are different scopes.

The authentication path needs protection too. An unauthenticated attacker must not be able to force unlimited expensive credential validation merely because tenant identity is not yet available. Conversely, creating a fresh key for every arbitrary header value can exhaust the limiter's own memory. Bound key cardinality, reject malformed identifiers early, and set retention appropriate to inactive identities. Avoid exposing credential material in logs or metric labels.

Weighted requests require measurement after admission. A query estimated at five units might become expensive because its cardinality changed. Cap inputs, constrain execution time, and compare estimated weight with observed resource use. A rate limiter should not become the only defense against an unbounded query. Changes to weights need client communication because an unchanged request rate can suddenly exceed the same advertised allowance.

## Make the response actionable without promising a reservation

A 429 response indicates too many requests under a server-defined policy. It does not inherently identify whether the relevant scope is a user, credential, tenant, or group of servers. Say which public policy was reached without revealing sensitive implementation detail. Retry-After can be an HTTP date or a delay in seconds; test client behavior for both if the API uses both. A hint is not a reservation: competing traffic may consume capacity before the client returns.

The SDK should combine the hint with a total retry deadline and a maximum attempt count. For writes, retry only with the service's documented idempotency mechanism or another safe protocol. Repeating a charge creation because its first response was lost is a different problem from repeating a rejected read. Distinguish admission rejection from an operation whose outcome is unknown, and make that distinction observable to clients.

Document the actual rate-limit field names and semantics implemented by your gateway. Do not label a vendor-specific header as a universal standard or imply that a reset timestamp means all layers will admit a request at that instant. A response may have passed one bucket and failed another. Versioned documentation should state the limiting scope, burst allowance, operation weights, and whether rejected attempts count.

## Review the limiter as an operating dependency

Collect admitted and rejected work by bounded operation class and plan, queue delay, in-flight work, limiter latency, and degraded-mode activation. Sample detailed rejection logs when volumes are large; logging every rejected request can itself amplify an attack. Keep enough protected diagnostic context to investigate a tenant report without turning high-cardinality identity into an unbounded monitoring bill.

For the acceptance exercise, combine a well-behaved tenant, a bursty tenant, and a slow expensive tenant in a fixed workload. Verify the expected bucket arithmetic and then check the outcome that matters: the well-behaved tenant still completes within its service objective. Repeat with one gateway unavailable and with the counter store unavailable. Publish offered load, accepted weighted work, failures, latency distribution, and the exact fallback policy. Those results support a capacity decision; a raw requests-per-second chart alone does not.

## Primary references

- [HTTP 429 semantics](https://www.rfc-editor.org/rfc/rfc6585.html)
- [HTTP Retry-After semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [Redis counter and rate limiter examples](https://redis.io/docs/latest/commands/incr/)
