---
title: "CDN Strategy: Choosing the Right Approach for Your Architecture"
description: "CDN selection is more than picking the fastest network. Origin configuration, cache invalidation, edge compute capabilities, and the overlap between your CDN and your cloud provider's services all affect the right choice. Here's how to think through it."
date: 2025-03-13
tags: ["CDN & Caching", "Cloud Architecture", "Infrastructure"]
format: article
---

A CDN solves a simple problem — content is faster when it's closer to the user — in increasingly complex ways. Modern CDNs aren't just caches; they're the place where TLS terminates, where bot traffic is filtered, where geolocation routing happens, where edge compute runs, and where rate limiting is enforced. The CDN decision has more surface area than most teams realise when they first evaluate it.

## The fundamental decision: cloud-native CDN vs. specialist CDN

Cloud providers offer CDN services that integrate tightly with their other services:
- **AWS CloudFront**: integrates with S3, ALB, Lambda@Edge, and AWS WAF. Origin access control for S3 buckets. The natural choice if you're deeply invested in AWS.
- **Azure Front Door**: integrates with Azure services, includes WAF, load balancing, and health probes. Supports global load distribution across Azure origins.
- **GCP Cloud CDN**: integrates with Cloud Load Balancing and Cloud Storage. Simple to configure for GCP workloads.

Specialist CDNs (Cloudflare, Fastly, Akamai) bring:
- Larger, more distributed PoP networks (Cloudflare has 300+ locations; CloudFront has ~600 PoPs but not all have full cache capability)
- More mature edge compute platforms (Cloudflare Workers, Fastly Compute)
- More advanced security and bot management
- Configuration that's independent of your cloud provider

The choice is rarely "cloud CDN vs. specialist CDN" — it's often both. Cloudflare in front of AWS, with CloudFront for specific workloads, is a common production configuration.

## Cache configuration decisions that matter

**What to cache**: any publicly accessible content that changes less frequently than your cache TTL, and any content that's served at high volume. Static assets (CSS, JS, images) with long TTLs. API responses for publicly accessible data with shorter TTLs.

**What not to cache at the CDN**: authenticated responses (responses that are specific to a logged-in user), responses containing session data, payment and checkout flows. The CDN should skip caching these and pass directly to origin.

**Origin caching headers**: CDNs respect `Cache-Control` headers from origin. `Cache-Control: public, max-age=86400, s-maxage=3600` — `max-age` applies to browser caches, `s-maxage` applies to CDN caches. Use `s-maxage` to set longer CDN cache times while keeping browser cache shorter (so users see fresh content after a CDN cache hit expires).

**Stale-while-revalidate**: `Cache-Control: max-age=60, stale-while-revalidate=600` — serve the cached object for up to 60 seconds, then revalidate in the background. For up to 600 additional seconds, serve the stale object while waiting for the background refresh. This improves perceived performance by eliminating cache misses.

## Cache invalidation: the hard part

CDN cache invalidation is one of the "two hard problems" in computer science for a reason. A file cached at 300 PoPs needs to be invalidated at all 300 PoPs. Approaches:

**Versioned URLs**: `app.a3b8f2.js` instead of `app.js`. The content is immutable by construction — when the file changes, the URL changes. No cache invalidation needed; the old URL simply expires naturally. This is the right approach for build artifacts and static assets.

**Surrogate keys / cache tags**: attach metadata to cached objects that allows bulk invalidation. Cloudflare's Cache Tags, Fastly's Surrogate-Key header, and Akamai's Edge-Control header all support this pattern. Tag all product page variants with `product-{id}` — when a product is updated, invalidate all objects with that tag. Faster and more precise than path-based invalidation.

**Path-based purge**: invalidate `https://cdn.example.com/api/products/*`. Works for hierarchical URL structures. Slower than surrogate keys for large invalidation jobs.

**Wildcard purge / full cache purge**: use as a last resort. A full CDN cache purge sends all traffic to origin until the cache repopulates — this is a self-inflicted origin overload.

## Edge compute: where it makes sense

CDN edge compute runs your code at PoPs rather than in your origin datacenter. The use cases where it provides genuine value:

- **A/B testing**: split traffic at the edge without a round-trip to origin. Cloudflare Workers or Lambda@Edge intercept the request, assign a variant, and route accordingly.
- **Request transformation**: rewrite URLs, add/strip headers, modify request bodies before they reach origin.
- **Authentication at the edge**: verify JWTs and block unauthenticated requests before they consume origin resources.
- **Personalisation via cookie**: redirect users to locale-specific content based on cookies or geolocation without an origin round-trip.
- **Synthetic responses**: return responses for common cases (redirects, health checks, static error pages) without hitting origin at all.

Edge compute is constrained: CPU time limits, limited memory, no persistent connections to databases. It's for logic that can be expressed as a short, stateless function. Attempts to do more than this — maintaining state, complex business logic, database queries — run into the constraints and should stay at origin.

## Performance measurement: what matters and what's noise

**TTFB from origin**: the latency from CDN edge to your origin. This is what the CDN can't fix — if your origin is slow, the CDN only helps for cache hits.

**Cache hit ratio**: what percentage of requests are served from cache. Below 70% suggests something is preventing caching (too many uncacheable parameters, too many authenticated paths, TTLs too short).

**Time to First Byte (TTFB) measured at edge**: includes the CDN processing time and, for misses, the origin round-trip. This is the metric end users experience.

**Real User Monitoring (RUM)**: synthetic tests from monitoring locations don't capture the geographic distribution of your actual users. RUM data from user browsers, aggregated by geography, shows where performance is actually poor.

*Working through CDN selection or configuration for a specific architecture? The trade-offs vary a lot by workload. [Happy to compare notes.](/contact)*
