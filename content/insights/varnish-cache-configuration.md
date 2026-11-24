---
title: "Varnish Cache Configuration: A Practical Guide to VCL and Caching Strategy"
description: "Varnish is a powerful HTTP accelerator, but the configuration language (VCL) has a steep learning curve. Here's how to configure Varnish for real workloads — including cache key design, TTL strategy, authentication handling, and ESI for partial caching."
date: 2025-03-04
tags: ["CDN & Caching", "Infrastructure", "Architecture"]
format: article
---

Varnish Cache sits in front of your web servers and caches responses in memory. For content-heavy sites with high read traffic, a correctly configured Varnish instance absorbs most of the load that would otherwise hit your application servers. The challenge is "correctly configured" — Varnish's Varnish Configuration Language (VCL) is C-like and the default behavior needs adjustment for most real workloads.

## What to measure

**Avoided origin work by route.** If a cacheable route receives 50,000 requests and Varnish serves 40,000 from cache, request hit rate is 80%. Break out hit-for-pass, grace and revalidation according to the actual counters so origin load is not inferred from one number.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The VCL request lifecycle

Understanding Varnish means understanding its state machine. A request goes through several subroutines:

- `vcl_recv`: request arrives; decide whether to cache, pass to backend, or return an error
- `vcl_hash`: compute the cache lookup key
- `vcl_hit`: cache hit; decide whether to use the cached response
- `vcl_miss`: cache miss; decide whether to fetch from backend
- `vcl_backend_response`: backend responds; decide whether to cache the response
- `vcl_deliver`: send response to client

You override behavior by adding logic to these subroutines in your VCL file.

## The minimum config that makes Varnish useful

Default Varnish won't cache requests with cookies. Since most modern applications set cookies, this means nothing gets cached by default. The first VCL customisation: strip cookies for assets that don't need them.

```vcl
sub vcl_recv {
    // Strip cookies for static assets
    if (req.url ~ "\.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|svg)$") {
        unset req.http.Cookie;
    }
    
    // Strip cookies for public pages that don't personalise based on session
    if (req.url ~ "^/blog/" || req.url ~ "^/about") {
        unset req.http.Cookie;
    }
}
```

With cookies stripped, Varnish will serve these from cache for all users.

## Cache key design

The default cache key is `Host` + `URL`. For most applications this is correct, but some workloads need adjustment.

**Vary headers**: if your application serves different content based on `Accept-Encoding` or `Accept-Language`, the `Vary` response header tells Varnish to cache separate versions per value. A `Vary: Accept-Encoding` header means Varnish caches both the gzip and non-gzip versions of each URL separately. Too many Vary headers fragment the cache and reduce hit rates.

**Normalise query strings**: URLs with different query parameter orderings are cached separately by default. `?sort=name&page=2` and `?page=2&sort=name` produce different cache entries. Normalise query strings to increase cache hits:

```vcl
sub vcl_recv {
    // Sort query string parameters for consistent cache keys
    set req.url = regsuball(req.url, "([?&])utm_[^&]+&?", "\1");  // strip UTM params
    set req.url = regsub(req.url, "(\?[^#]+)#.*$", "\1");  // strip fragment
}
```

## TTL strategy

Varnish caches based on the `Cache-Control` header from your backend. If your backend sends `Cache-Control: max-age=300`, Varnish caches for 5 minutes. If the backend doesn't send a caching header, Varnish uses its `default_ttl` (120 seconds by default).

In `vcl_backend_response`, you can override or extend TTLs:

```vcl
sub vcl_backend_response {
    // Cache 404s briefly — prevents cache stampede on missing assets
    if (beresp.status == 404) {
        set beresp.ttl = 30s;
    }
    
    // Never cache 5xx errors
    if (beresp.status >= 500) {
        set beresp.uncacheable = true;
        return (deliver);
    }
    
    // Extend TTL for slow-changing content from backend
    if (bereq.url ~ "^/api/product-catalogue") {
        set beresp.ttl = 600s;
        set beresp.grace = 120s;  // serve stale for 2 minutes if backend is down
    }
}
```

**Grace mode** is underused and valuable. `beresp.grace = 120s` tells Varnish: "if the cached object is expired but the backend is slow or unavailable, serve the stale object for up to 2 minutes". This prevents users from seeing errors during backend restarts or traffic spikes.

## Handling authenticated content

Content behind authentication should not be served from cache to unauthenticated users. The standard approach:

```vcl
sub vcl_recv {
    // Pass authenticated requests directly to backend
    if (req.http.Authorization || req.http.Cookie ~ "session=") {
        return (pass);
    }
}
```

`return (pass)` sends the request to the backend without caching the response and without serving from cache. The backend handles authentication; Varnish is bypassed for these requests.

For applications with a mix of public and personalised content on the same page, Edge Side Includes (ESI) allow caching the public parts:

```vcl
sub vcl_backend_response {
    set beresp.do_esi = true;  // enable ESI processing
}
```

Your backend includes ESI tags in the HTML:
```html
<esi:include src="/api/user-header" />
<esi:include src="/content/article-body" />
```

Set each fragment’s freshness using its origin response headers and VCL. A personalised fragment must bypass shared caching. Treat the assembled response as personalised as well and verify it cannot be reused by a shared cache downstream. Start with two synthetic identities and test both request orders. See [Varnish ESI](https://www.varnish.org/docs/users-guide/esi/).

## Purging cached content

When content changes, you need to invalidate the cached version. Varnish provides several mechanisms:

**BAN**: mark all cached objects matching an expression as invalid

```bash
varnishadm ban req.url ~ ^/blog/new-post
```

**Surrogate keys or cache tags** let an authenticated publishing service invalidate all objects associated with a known key. Use a supported module or provider feature, validate keys against the publishing event, and keep invalidation endpoints off the public listener. Exercise tag and URL invalidation in an isolated Varnish instance and verify that unrelated content remains cached. See [Varnish purging](https://www.varnish.org/docs/users-guide/purging/).

## Monitoring what Varnish is doing

`varnishstat` shows real-time statistics: cache hit ratio, request rate, backend health. The metric to watch first: `cache_hit / (cache_hit + cache_miss)`. Break the ratio down by cacheability and route. Compare it to origin request volume and user-visible latency so a change in traffic mix is visible.

`varnishlog` shows request-level logs with the cache decision for each request. Essential for debugging why specific requests aren't being cached.

*Tuning a Varnish configuration or designing a caching strategy for a high-traffic site? [Happy to work through the specifics.](/contact/)*

## Put the origin and VCL under the same cache contract

Define policy by route family before writing a regular expression. For each family, document the owner, allowed methods, visibility, representation variants, tolerated age and the event that should invalidate stored content. Put cookie stripping behind a narrow allowlist of public representations that are demonstrably identical across sessions. A suffix alone says little about the meaning of a URL. Make the application return appropriate cache headers as well, so a route promoted out of the allowlist behaves predictably.

The built-in VCL still matters when a custom subroutine falls through without an explicit return. A response can remain uncacheable because of its own directives or cookies even if the request entered the cache flow. Preserve those safeguards when layering policy. In a test fixture, compare a public route for two independent clients and ensure the test is capable of detecting a difference by using a separate private route with deliberately distinct responses. Confirm both the observed body and whether the origin handled the request. [Varnish built-in VCL](https://www.varnish.org/docs/users-guide/vcl-built-in-code/)

Prefer a URL parser or well-scoped VMOD for normalization that needs to understand parameter structure. Test multiple values for the same parameter, URL encoding, case differences, sorting and the absence of optional parameters. Query parameters can be order-sensitive for some backends. Even a query-cleaning rule intended only to remove analytics data needs contract tests, including cases where the analytics parameter appears before, after or between representation parameters. Apply a different rule to URLs whose original form is part of an origin signature.

## Test expiry with representative timing

Grace specifies how long a stored response can remain available beyond its freshness lifetime, subject to the selected VCL and circumstances. Keep gives the cache additional opportunity to retain an expired object for a conditional backend request when a validator is available. An expired object that was evicted for storage pressure may be unavailable for either. Document the desired behaviour separately for healthy origin, busy origin and failed origin, then assert it in a harness that can control backend timing. [Varnish grace and keep](https://www.varnish.org/docs/users-guide/vcl-grace/)

Consider a public article with a 60-second fresh lifetime and 120 seconds of permitted grace. A test introduced after 75 seconds can check a request against an expired object within the configured window. Another introduced after 190 seconds tests a period beyond both allowances. Use a body with a revision marker, begin with a known warm object and record whether and when a backend fetch occurs. Repeat from cold storage and under concurrent requests. In Varnish, tests written for `varnishtest` can simulate clients, backends and response timing in a repeatable run. [Varnish test-file reference](https://www.varnish.org/docs/reference/vtc/)

Include negative responses in the policy. A public missing asset can justify a very brief stored 404, while a new product page undergoing publication may need a faster transition to the real response. Decide how to validate the transition from missing to present. Purges and bans may apply at a specific layer or point in a request path. Rehearse a control-plane action with two cache instances and check that both eventually serve the expected revision. Prefer self-contained versioned URLs for immutable assets, such as an image whose filename changes with its bytes.

## Keep fragment freshness independently testable

An assembled page can couple the public shell to several backend resources. Enumerate the independently fetched fragments and give each a cache policy at the fragment endpoint or in explicit VCL. An HTML attribute on an ESI include alone does not set the response freshness lifetime in Varnish. For a personalized fragment, use an explicit bypass and test controlled sessions with distinct expected output. When composition would require delicate propagation of user context, a separately fetched account panel can preserve the public shell and simplify verification. [Varnish Edge Side Includes](https://www.varnish.org/docs/users-guide/esi/)

Test missing and slow fragments against the publisher’s intended experience. A catalogue page might continue to work with recommendations omitted. An error on the asset that holds the main content could be required to show a controlled error instead. Measure first byte, completed transfers and correct visible output together. A header can already have been sent when a streamed include fails, so monitoring just the original HTTP status misses some of the customer-facing result. Limit and observe the number of backend fetches that one assembly can trigger.

## Count the requests that actually reach the origin

Suppose that 10,000 incoming requests reach a test cache over five minutes. Of those, 7,500 serve a fresh object without origin work, 800 serve stale content, 1,200 pass through and 500 are direct misses. During the window, suppose stale handling starts 160 additional refresh fetches. The hypothetical origin count is then 1,860, so 8,140 fetches were avoided relative to a one-origin-request-per-client baseline. This simplification assumes a workload without ESI, redirects or extra retries. A real deployment’s origin-side count, correlated by route and backend, handles those cases more reliably.

Keep the same labels at the edge and origin for a limited rollout. Compare origin rate and latency with response correctness, hit categories, evictions and memory pressure. Record concentrations by route and by newly invalidated content. The important decision may be to alter freshness for one high-cost response family instead of moving an instance-wide hit ratio. Keep the VCL version with the test runs so a later incident can be replayed against its exact policy.

Treat invalidation as a publishing permission. Restrict it to the service that changes the content, capture which revision triggered it and log what scope was affected. Define a completion check that requests the expected representation through the normal customer path. Broad invalidation can turn a quiet correctness change into a wave of origin traffic, so measure the recovery window in a limited environment. [Varnish purges and bans](https://www.varnish.org/docs/users-guide/purging/)
