---
title: "Cache Stampedes: The Thundering Herd and the Four Ways to Stop It"
description: "Compare request coalescing, stale serving and early refresh, then calculate origin load and test the cold-cache failure path."
date: 2028-08-21
tags: ["Caching", "Performance", "Programming", "Distributed Systems", "Reliability"]
format: article
---

Every cache is a bet that the expensive computation behind it won't be asked for very often — and the cache stampede is that bet's failure mode: a popular key expires, and in the window before anyone repopulates it, *every* concurrent request for that key misses simultaneously and executes the expensive path in parallel — a thousand identical queries hitting a database sized for one per TTL. The pathology compounds itself: the origin, suddenly overloaded, slows; slow recomputation widens the miss window; more requests pile into the gap (the utilization-curve explosion, self-inflicted); and the system discovers that its cache wasn't an optimization — it was load-bearing capacity, and its expiry semantics were an outage scheduler. The variants share the shape: the *deploy stampede* (cold caches fleet-wide after a restart), the *midnight stampede* (synchronized TTLs from batch-loaded keys expiring together), and the *celebrity-key stampede* (one hot key whose recomputation is expensive — the hot-partition problem's caching cousin).

## The four mechanisms, and what each actually solves

**Request coalescing (single-flight)** — the direct fix: when a key misses, *one* request wins the right to recompute (an atomic lock/claim on the key — the compare-and-swap idiom); everyone else waits briefly for the winner's result or serves stale meanwhile. This converts N simultaneous recomputations into one, which is a major reduction in redundant work, with failure and waiting behavior still to design — per process trivially (the in-process single-flight primitives), across a fleet with a shared claim in the cache tier itself (with the lock-TTL-and-fencing honesty from distributed-locking practice: the winner that dies mid-recompute must not wedge the key — claim expiry sized to recompute time, and the waiting strategy decided: brief block, serve-stale, or fail-fast per the request's tier). The subtlety worth designing: coalescing turns one slow recompute into *everyone's* latency — which is why it pairs with the next mechanism rather than replacing it.

**Stale-while-revalidate** — the availability fix: expiry stops meaning "unavailable" and starts meaning "refresh opportunistically" — the stale value serves instantly while one background refresh (coalesced, per above) updates it. This is the HTTP-caching directive generalized into application caches (soft-TTL/hard-TTL two-tier expiry: within soft, serve fresh; between soft and hard, serve stale and refresh async; past hard, the value is genuinely gone and coalescing carries the load), and it can hide refresh latency when the permitted stale window is sufficient — the staleness budget made explicit and spent deliberately, per every derived-data discipline. For most read-heavy systems this is the single highest-value cache upgrade available: many refreshes can avoid blocking users, subject to hard expiry and failure policy.

**Probabilistic early refresh** — the elegant refinement: rather than everyone observing the same expiry instant, each request *near* expiry rolls a die weighted by recompute cost and time-remaining (the XFetch algorithm's insight), so refresh happens *before* expiry, probabilistically before expiry, without a strict guarantee of only one regeneration. Beautiful where it fits (uniform request streams over moderately hot keys); less load-bearing than the first two in practice, but worth knowing because it solves the problem with zero coordination — the recurring ideal.

**Jittered TTLs** — the synchronized-expiry fix: TTLs set as base ± random spread, so the ten thousand keys loaded by the 2 AM batch job don't expire as one wave (the variance-injection discipline from retry practice, applied to expiry — synchronized anything is self-inflicted burstiness, per the queueing math). Simple to implement where freshness permits, and worth checking when the graph shows periodic miss-rate spikes at suspiciously round intervals.

**And the deploy/cold-start case** gets its own answer, because stale serving cannot help an empty cache, while coalescing and admission control still can: warmup as a deployment step (the readiness-gate discipline — the instance that declares ready before its hot keys are loaded is volunteering for the stampede; pre-warm from the previous generation's key inventory or a snapshot, per the connection-draining patterns), and fleet-wide restarts staged so the cache tier never goes globally cold (the rolling-deploy logic, applied to cache state).

## Composition and the design review

The mechanisms compose into the standard mature stack: **jittered TTLs where their freshness bounds fit**, **soft/hard expiry with stale-while-revalidate on the read path** (the availability floor), **single-flight coalescing on every recompute** (the origin's protection — and note it protects against the cold-key case SWR can't), **probabilistic refresh where streams are smooth**, and **warmup in the deploy pipeline**. The review questions that catch the gaps early: *what happens when this key expires under peak concurrency?* (the answer "everyone recomputes" is the finding), *what's the blast radius of this cache being empty?* (if the answer is "the database dies," the cache is load-bearing capacity and deserves capacity-planning treatment — the origin sized for miss storms it will someday meet, or admission control in front of it per the load-shedding contract), and *which keys are hot enough to deserve the full stack?* (the celebrity keys get coalescing and SWR mandatorily; the long tail can live with jitter alone — the criticality tiering, at key granularity).

The closing frame: stampedes are the canonical example of this series' oldest lesson — the system that works at low concurrency and detonates under load, because a shared assumption (the cache is populated) failed *simultaneously for everyone* rather than gradually for some. The fixes are all variance-and-coordination engineering: desynchronize the expiries, coalesce the recomputes, decouple staleness from unavailability — twenty lines of library code in most stacks, versus the postmortem titled "database overload following cache expiry," which is among the most preventable documents in operations.

## Estimate the vulnerable miss window

A hot key's request rate and recomputation duration determine how many callers can enter an unprotected miss path. Suppose a hypothetical key receives 200 requests per second and takes 0.5 seconds to regenerate. Roughly 100 requests can arrive during that interval. If each independently calls the origin, the cache has converted one refresh into about one hundred concurrent attempts, assuming the first refresh does not finish sooner and requests arrive at a steady rate.

The chart compares that modeled uncoordinated count with two coalescing scopes. Ten application instances with one local single-flight per instance can still generate ten origin refreshes. A functioning shared single-flight claim can reduce the intended refresh count to one across the fleet. These are idealized counts; lease expiry, crashes and retries can produce more than one attempt. The claim must be described as a coordination mechanism with failure behavior, not an absolute exactly-one guarantee.

This arithmetic also explains feedback under overload. If origin latency rises from half a second to two seconds, the potential arrival population grows from one hundred to four hundred at the same request rate. Protecting the origin requires an admission budget even when caching normally works. A cache outage should have a defined degraded response rather than unrestricted fallback by every caller.

## Define freshness by data meaning

Stale-while-revalidate is appropriate only where bounded staleness is acceptable. A public article preview may tolerate an older value; a revoked permission, changing balance or inventory reservation may require a different policy. Set soft and hard expiry from the data contract, not from a generic cache library default. Include the age of the underlying source snapshot when calculating freshness; a recently cached old source value is still old data.

When a refresh fails, decide whether stale content can remain available and for how long. The HTTP stale-if-error and stale-while-revalidate directives describe different behaviors, and application caches need equally explicit rules. Do not reset the freshness clock merely because an error handler reinserted the same stale value. Preserve creation time, source version and last successful refresh separately.

Authorization and tenant identity belong in the cache key where they affect the result. A fast shared cache that returns one tenant's result to another is a correctness and access-control failure. Avoid caching a personalized response under a public key or storing secrets in a cache with broader access than the source. Cache invalidation needs to cover permission changes as well as data updates where required.

## Single-flight needs bounded waiting and safe release

A caller waiting for an in-flight refresh should have a deadline and a defined fallback. If the leader is canceled, determine whether the refresh continues for other waiters or is canceled with it. A background task should not inherit a request deadline accidentally if the design expects it to complete after that request ends. Conversely, abandoned refreshes should not run forever.

For a shared claim, use a unique ownership token and release only the claim still owned by that worker. A worker whose lease expired must not delete a newer worker's claim. If stale refreshes can overwrite newer data, use source versions or a fencing/compare-and-set mechanism at publication. Choosing a lease duration slightly above the average refresh time does not establish correctness under pauses or long-tail latency.

Keep claim acquisition failures distinct from cache misses. If the coordination service is unavailable, a naive fallback can recreate the stampede at precisely the worst moment. Use bounded origin concurrency, serve permitted stale content or reject according to the service contract. Test this path rather than assuming the cache and lock service never fail together.

## Jitter and early refresh solve different patterns

TTL jitter spreads expiry across many keys, but it does not eliminate simultaneous callers for one hot key. Choose a bounded distribution that cannot exceed the permitted maximum age. If a dataset must expire at a business deadline, jittering past that deadline may be incorrect; stagger refresh before the deadline instead.

Probabilistic early refresh reduces the probability of a synchronized expiry event without necessarily guaranteeing that exactly one caller refreshes. Several requests can independently decide to refresh, and a quiet key may receive no early request. Evaluate the algorithm's assumptions and combine it with coalescing when duplicate regeneration is expensive. It is a probabilistic load-control technique, not a replacement for an invariant that requires exclusive ownership.

Cold caches still benefit from single-flight and admission control even though stale data is unavailable. Warmup can reduce misses but should target a bounded hot set. Preloading every possible key can overload the origin before deployment is ready. Stage restarts, cap warmup concurrency and ensure that readiness does not wait forever on an optional cache fill.

### A stampede load-test worksheet

Use a disposable origin that records request count and can inject a controlled delay. Send a fixed-rate workload for one key, expire it and measure origin attempts, waiter count, response latency and error rate. Repeat with local coalescing, shared coalescing and stale serving. Verify response age and correctness, not only reduced origin traffic.

Then kill the refresh leader, delay it beyond the lease and make the cache unavailable. Add many keys with synchronized expiry and compare with jittered expiry. The expected result should state a maximum origin concurrency and a bounded user-visible behavior. If the test succeeds only when every dependency is healthy, it has not demonstrated resilience to a stampede.

## Monitor the protection mechanism

Track refresh attempts per logical refresh, coalesced waiters, refresh duration, stale-response age, claim failures and origin admission rejections. A high cache hit ratio can hide a severe hotspot affecting a small but important key. Segment by bounded key class or workload rather than exporting unbounded raw keys as metric labels.

Review whether the cache is still an optimization or has become necessary capacity. If the origin cannot serve the agreed degraded workload, document that dependency and provision the cache tier accordingly. The reliable design makes expiry, refresh failure and cold start ordinary bounded states rather than surprise load multipliers.

### Figure methodology

Synthetic 200 requests/s×0.5 s regeneration gives 100 arrivals in the miss window. Ten processes with local coalescing can produce 10 refreshes; a healthy shared claim targets 1. Assumes steady arrivals and no lease failure; not an exactly-once guarantee.

| Worked observation | refresh attempts |
| --- | ---: |
| No coalescing | 100 |
| 10 local single-flights | 10 |
| Shared single-flight | 1 |

## Primary references and further study

- [RFC 5861 stale response controls](https://www.rfc-editor.org/rfc/rfc5861.html)
- [Original probabilistic stampede-prevention paper](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf)
