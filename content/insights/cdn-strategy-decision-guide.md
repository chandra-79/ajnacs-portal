---
title: "CDN Strategy: Choosing the Right Approach for Your Architecture"
description: "CDN selection is more than picking the fastest network. Origin configuration, cache invalidation, edge compute capabilities, and the overlap between your CDN and your cloud provider's services all affect the right choice. Here's how to think through it."
date: 2025-03-13
tags: ["CDN & Caching", "Cloud Architecture", "Infrastructure"]
format: article
---

A CDN solves a simple problem — content is faster when it's closer to the user — in increasingly complex ways. Modern CDNs aren't just caches; they're the place where TLS terminates, where bot traffic is filtered, where geolocation routing happens, where edge compute runs, and where rate limiting is enforced. The CDN decision has more surface area than most teams realise when they first evaluate it.

## What to measure

**Requests and bytes reaching origin.** If 8,000 of 10,000 cache-eligible requests hit, request hit rate is 80%. Count bytes separately because the 2,000 misses may carry most of the payload. Break out first requests after expiry or purge to show how the origin behaves when the cache is cold.

*Illustrative measurement. Any numbers in this example are hypothetical.*

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

**Origin caching headers**: for a public, non-personalised response, `Cache-Control: public, max-age=60, s-maxage=300` allows a private cache to use the 60-second freshness lifetime and tells a shared cache to use 300 seconds. The shared cache directive overrides `max-age` for that cache. Eligibility, cache keys and revalidation still matter. Test the actual CDN policy and response headers. See [RFC 9111, section 5.2.2.10](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.10).

**Stale-while-revalidate**: `Cache-Control: max-age=60, stale-while-revalidate=600` gives a supporting cache permission to serve the response while stale, for up to 600 seconds beyond its freshness lifetime, while it attempts revalidation. Use it where that age is acceptable and confirm support. See [RFC 5861](https://www.rfc-editor.org/rfc/rfc5861).

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

*Working through CDN selection or configuration for a specific architecture? The trade-offs vary a lot by workload. [Happy to compare notes.](/contact/)*

## Define which requests can share a response

Write a short cache contract for each response family. List the resource owner, maximum acceptable age, visibility and the inputs that change the representation. A public product image may vary by transformation and media type. A catalogue page may vary by locale and currency. A private account page can change with session and entitlements. Shared caching rules should follow those boundaries. Test the actual response seen by a second independent client to verify that the platform policy, origin assumptions and edge code agree.

HTTP defines `Vary` for selecting a stored response based on fields in the request. Managed delivery services can require explicit cache-key configuration for inputs even when the origin sends `Vary`. Include dimensions that change the response and establish how they are normalised. An uncontrolled campaign query parameter may create a distinct cached object on every request. Conversely, discarding an input that changes rendered content can show a response for the wrong variant. Any plan to share a response to an authenticated request requires explicit semantics that permit shared caching and an auditable boundary for personalisation. For ordinary account data, verify a bypass or an appropriate private response and a separate path from the truly public resources. [HTTP Caching, RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html) · [CloudFront cache-policy reference](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cache-key-understand-cache-policy.html)

Start with a short matrix of anonymous locale pairs, encodings and URL parameters. Include requests without optional inputs and requests that supply unexpected values. Use known distinct responses in a fixture so collisions are visible. Add a cold first request, a warm request, a conditional validation using an entity tag, and a content revision that invalidates the prior response. Record the representative response body, status, freshness, and whether the CDN forwarded a request. Checking only a CDN hit header cannot tell you whether a hit was useful.

## Separate request and byte ratios from origin pressure

For an illustrative ten-minute measurement, assume an edge receives 100,000 eligible cache requests. It serves 90,000 without contacting the origin. Request offload is 90% under that definition. If deliveries total 200 GB and those requests serve 140 GB, byte offload is 70%. This pattern could occur if large files miss more often than popular icons. Compute byte offload with the same byte measurement point and report excluded traffic and conditional responses separately. A revalidation that receives no representation body still makes work for the origin. Distinguish request and traffic offload so the cost model can account for both.

Look at the distribution of the origin rate before celebrating an improved daily ratio. In that same window, suppose 6,000 of the 10,000 forwarded requests arrive within 30 seconds after a content refresh. Those 30 seconds average 200 requests per second. The full window averages about 16.7 origin requests per second. Size and test the origin with the peak, distinguishing concurrent validations from full-body misses and checking the most expensive keys. Measure at the step that actually reaches your application. An intermediate shield may absorb multiple edge requests, making edge miss rate a poor origin-capacity estimator.

## Test freshness, errors and invalidation as one policy

Set browser and shared-cache lifetimes independently when the representation calls for it. For example, with `max-age=60, s-maxage=600`, the browser can regard the response as fresh for one minute and the shared cache for ten minutes under HTTP’s freshness rules. This example assumes the response is eligible to store and no vendor setting overrides it. Verify the effect of purge on each layer. A successful CDN purge may leave copy already cached by customers until its browser lifetime expires. A content-addressed asset URL simplifies rollback by making an asset revision explicit. [HTTP Caching, RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html)

Decide class by class where stale responses are acceptable. An older image may be tolerable during a brief revalidation. A response that authorises access or states the final price of a transaction needs its own correctness boundary. `stale-while-revalidate` permits serving a stale response inside its stated window while validation takes place. It does not create a stored object on the first miss or guarantee that validation succeeds. Rehearse expiry with traffic, expiry while idle, validation failure and an isolated cold deployment. Keep a dated data sample that makes a stale response identifiable without needing the edge logs. [HTTP stale extensions, RFC 5861](https://www.rfc-editor.org/rfc/rfc5861.html)

## Compare the actual user paths

When evaluating a provider or switching policy, keep the origin version, content family and measurement definition fixed. Report client time to first byte and full transfer separately. Compare regions, device and network groups, and cached and uncached requests. Include error and timeout counts at the client, because a latency chart of successes can look better simply by excluding failed work. Run matched probes on the same request path as a check on geographic differences, and complement them with browser measurements for the actual reader mix.

Use a limited experiment with a rollback rule tied to response correctness, error rate, latency and origin saturation. Record cache warm-up separately. A switch may otherwise compare a cold CDN with a warm one, or overload the origin during what appears to be a minor traffic move. Keep validation and purge times with the published results, along with object mix and routing scope. That record gives readers a way to evaluate whether the measured improvement is likely to carry over to their workloads.

Budget the experiment over an agreed window using actual cost dimensions. In a simple illustrative model, avoiding 12 TB of origin transfer at an assumed $0.03 per GB saves $360 using decimal units. This estimate excludes requests, shield traffic and CDN delivery. If annual commitments or bundled usage make marginal origin transfer free during the window, the same traffic reduction yields no direct transfer savings. Keep the observed traffic separate from quoted rate assumptions and check the result against the bill. Reduced origin saturation can justify a policy even when the billing benefit is small.
