---
title: "Speed at Scale: Enterprise Caching for OLTP and OLAP Workloads"
description: "A practical guide to multi-tier caching architecture — how to design caching layers that absorb the majority of read load, handle traffic spikes without crashing, and maintain the cache hit ratios that separate resilient systems from fragile ones."
date: 2024-11-01
tags: ["Data Engineering", "Architecture", "Performance", "Infrastructure"]
format: article
---

In most enterprise systems I've worked on, the database is the first thing that breaks under load. Not because the database is bad — but because everything hits it directly, and disks are slow.

Caching is the answer, but "add Redis" isn't a strategy. Here's how to think about multi-tier caching properly, and what actually matters in production.

## What to measure

**Cache-miss amplification.** If 1,000 requests for an expired key reach origin and a single-flight mechanism reduces origin fills to one, the test shows a 1,000-to-1 reduction in fills for that key. Repeat with many hot keys and verify that callers’ tail latency stays within budget.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Why caching matters more than most people plan for

The numbers are stark:

- **Cold database query:** 120ms average response
- **Optimized database query:** 45ms  
- **Redis distributed cache:** 2.5ms  
- **Application local cache:** 0.5ms  
- **CDN/Edge cache:** 15ms (but only for cacheable content)

That's a 50x difference between a Redis hit and a cold DB call. At scale, that gap determines whether your system survives a traffic spike or buckles.

## The multi-tier caching model

```
Client → CDN/Edge → App Server → Distributed Cache → Database
```

Each layer has a specific job:

| Layer | Technology | What it caches |
|---|---|---|
| **Client** | Browser localStorage, Service Worker | Static assets, user preferences |
| **CDN / Edge** | Cloudflare, AWS CloudFront | HTML, JS, CSS, images, API responses |
| **App Server** | In-process local cache (Caffeine, Guava) | Session data, frequently read config |
| **Distributed Cache** | Redis, Memcached | Shared application state, hot DB results |
| **Database** | Query cache, buffer pool | Index pages, frequently accessed rows |

The key insight: the distributed cache layer (Redis) is your most important investment. It sits between your application and your database and absorbs the volume that would otherwise hammer disk I/O.

## OLTP vs OLAP — different workloads, different strategies

Transactional and analytical workloads have fundamentally different caching needs.

### OLTP (Transactional) — e-commerce, banking APIs, user sessions

**Cache-Aside (Lazy Loading):**  
Application checks the cache first. On a miss, fetch from the database and populate the cache. Simple, battle-tested, works well when data access patterns are unpredictable.

```python
def get_user(user_id):
    cached = redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)
    
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    redis.setex(f"user:{user_id}", 3600, json.dumps(user))
    return user
```

**Write-Through:**  
Write to cache and database simultaneously. Ensures cache consistency at the cost of slightly higher write latency. Right choice when data freshness matters.

### OLAP (Analytical) — BI dashboards, monthly reports, aggregations

**Query Result Caching:**  
Store the output of expensive `GROUP BY` and aggregation queries. A monthly revenue report that takes 8 seconds to compute can be cached for 24 hours with no user-visible impact.

**TTL Tiers:**  
- Real-time dashboards: 60-second TTL
- Hourly reports: 1-hour TTL  
- Historical/daily reports: 24-hour TTL

The temptation in OLAP is to cache everything forever. Resist it — stale analytical data causes trust problems that are harder to fix than latency.

## The Thundering Herd problem

This is the failure mode that takes down systems at scale.

Without caching, a traffic spike translates 1:1 to database load. On Black Friday, your 1000 requests/second becomes 1000 database queries/second. The database saturates, response times climb, users retry, load doubles, the database crashes.

With a Read-Through cache strategy:
- The cache absorbs 90%+ of read volume
- The database sees a small, stable fraction of incoming traffic
- Even at 5x normal traffic, the database stays in the safe zone

The data: in a simulated traffic spike from 500 req/s to 4800 req/s, a properly cached system kept database CPU below 25%. Without caching, the same spike would push it past 100%.

## The metric that matters: Cache Hit Ratio

Everything else is secondary to this number.

**Target: 90%+**

A 92% hit ratio means 92 out of every 100 requests return from cache — fast, cheap, no disk I/O. Only 8 requests touch the database.

Below 80%, your caching strategy probably needs rethinking. The most common causes:

1. **TTL too short** — data expires before users access it again
2. **Key design is wrong** — too many unique cache keys, not enough reuse
3. **Cache too small** — eviction is happening before data is accessed again
4. **Warm-up not done** — cold start after a deployment or restart

Monitor this metric in production. It's a leading indicator — a dropping hit ratio often predicts an upcoming incident before anything else does.

## Hot data and the Pareto Principle

In almost every system I've looked at, roughly 20% of the data accounts for 80% of the access requests. This is the "hot data" segment.

Caching is most effective when you identify this segment deliberately rather than caching everything and hoping for the best.

Practical approach:
1. Add access counters to your key reads (or query slow query logs)
2. Identify your top 20% most-requested keys
3. Pre-warm your Redis cache with this hot set on deployment
4. Set longer TTLs for hot keys, shorter TTLs for cold ones

This is how you get from a 70% hit ratio to 92%+.

## Things I've learned from production issues

**Don't cache without a TTL.** Memory fills up, the cache becomes stale, and you'll have a confusing incident where users see outdated data for hours.

**Test your cache-miss path.** The sad path — when the cache is cold, wrong, or expired — needs to handle gracefully. If your app can't run without a warm cache, that's a fragility you'll regret.

**Redis isn't free.** Memory is finite. Get your eviction policy right (`allkeys-lru` is usually the right default for a cache-only Redis instance). Monitor memory usage. Set `maxmemory`.

**Cache invalidation is still hard.** The classic joke exists for a reason. When your source data changes, your cache needs to know. Write-through helps. Event-driven invalidation (publishing a cache-bust event on data changes) is more robust at scale.

The 95% database load reduction that caching enables isn't magic — it's the compound effect of designing the right layers, choosing the right strategies per workload type, and monitoring the hit ratio religiously. The architecture isn't complicated. The discipline is.

*Questions about caching design for a specific workload? [Get in touch](/about/).*

## Allocate freshness across the entire request path

Give each value a source of truth, an allowed age and a consequence if that age is exceeded. A search result might tolerate a slightly older projection. A permissions decision and the final amount charged to a customer need fresh decisions from the appropriate authority. A dashboard needs a stated reporting version so the figures in its components agree. These choices determine which layers can cache a response, which identity and version belong in its key, and where to check correctness.

In a multilevel design, copying an object from one cache to another can restart its lifetime. Suppose an item can be 110 seconds old at a distributed-cache hit, and a local cache stores that response for a fresh 60 seconds. A local response could then be almost 170 seconds old. This illustrative bound ignores any age already accumulated upstream. Carry an origin version or an authoritative expiry when the local layer needs to honour a common freshness budget. Verify the record age at the application response, not only the TTL of each copy.

Within application caches, keep keys tied to the values that actually affect the data, including access scope where relevant. In analytical workloads, also identify dataset version, reporting time zone, filters and semantic-model version. A cached February close can remain intentionally stable even after March data arrives, but corrections to February should have a defined publication path. Check which data can be served while a source temporarily fails and which requests should be deferred. [Azure Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)

## Decide whether a refresh protects the hot path

Measure the amount of work a miss creates. A request may fan out to several database queries, and miss costs can be concentrated in a few expensive reports. Consider an illustrative run where cache A serves 9,500 of 10,000 requests from storage. The 500 misses cause one database call each. Cache B serves 9,800, but its 200 misses cause ten calls each. Cache B has a better request hit ratio and generates four times as many calls. Compare origin concurrency, query cost and successful requests within the latency budget before choosing which behaviour to optimise.

Coalesce concurrent fills for the same key when the origin can compute one result for the waiting group. Add a deadline for waiters and a distinct policy if the fill fails. A group that immediately starts individual fills on timeout recreates the original overload. Bound the number of refreshes across different keys as well. Read deadlines matter because a cache hit can still be slow when a caller queues behind a hot lock or a busy shard. In a controlled rehearsal, test one viral key, a diverse miss workload and a simultaneous wave of expiry. [AWS guidance on caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)

A stale response can relieve pressure if the product accepts the age. Keep a fixed upper bound and a reliable way to observe when data crosses it. An unpublished revision should never become eligible merely because the cache is degraded. For operations requiring fresh access checks or durable confirmations, consider explicit deferral or a targeted call to the authoritative store within its capacity budget. Version the eligibility rules alongside the endpoint and verify them using a fixture with different known revisions.

## Rehearse the race between an update and an old fill

A dual write to a cache and database has separate failure points. A cache-aside reader can also capture an old version before a writer commits, then restore that old entry after the writer invalidates the key. Walk through that ordering in a two-client test. In a version-aware design, the cached record carries the source revision and a fill older than a known invalidation cannot replace a fresher value. A versioned key or a freshness check at the authoritative source can be more practical when updates must be observed immediately.

For a durable invalidation feed, record an event alongside the database change so there is a recoverable record of what to invalidate. Consumers still need to handle duplicated or out-of-order notifications and rebuild state after an interruption. Capture the oldest unprocessed invalidation and the percentage of changes observed within the stated time. Keep a bounded recovery method for lost events. If a full flush would exceed validated origin capacity, operate the recovery in phases and observe how long affected users see the earlier value.

## Publish the capacity and correctness envelope

Run controlled tests with a warm cache, newly invalidated content, unavailable cache and a recovering origin. Record logical requests, attempts, origin work by query family, cache age at delivery, errors and end-user latency. Run the analysis by tenant size and by endpoint. An acceptable aggregate may hide events where a small customer receives an older response or a report consumes most origin concurrency. Use simulated identities and fixtures for publication. Apply production traffic distributions only where the data can be summarised safely.

In a hypothetical example, a database has been tested at 240 affordable fills per second while an empty cache would generate 800. An improvement that reduces the burst to 300 still exceeds that budget by 60. Document which workloads are admitted, which are deferred and what observation allows the team to expand traffic. Include both a traffic chart and a short timeline of recovery, with exact sample window, arrival pattern and capacity assumptions. Readers should be able to understand why a hit-rate target does not establish resilient behaviour.

Revisit the design when products change their freshness commitments or the database becomes faster. Removing or bypassing one cache for a low-volume path can simplify correctness and reduce incident load. Measure maintenance time, stale-response investigations and memory or storage cost alongside the latency and traffic saved. The selected cache tier should pay for its own failure modes.

For a workload where correctness depends on a dated snapshot, record both the dataset revision and the result-cache key that produced the report. This lets another engineer distinguish an intentionally pinned result from a refresh failure. If cost drives the decision, count cache infrastructure and origin work over the same interval and state which charges are marginal.
