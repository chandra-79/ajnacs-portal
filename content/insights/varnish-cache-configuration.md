---
title: "Varnish Cache Configuration: A Practical Guide to VCL and Caching Strategy"
description: "Varnish is a powerful HTTP accelerator, but the configuration language (VCL) has a steep learning curve. Here's how to configure Varnish for real workloads — including cache key design, TTL strategy, authentication handling, and ESI for partial caching."
date: 2026-05-22
tags: ["CDN & Caching", "Infrastructure", "Architecture"]
format: article
---

Varnish Cache sits in front of your web servers and caches responses in memory. For content-heavy sites with high read traffic, a correctly configured Varnish instance absorbs most of the load that would otherwise hit your application servers. The challenge is "correctly configured" — Varnish's Varnish Configuration Language (VCL) is C-like and the default behavior needs adjustment for most real workloads.

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
<esi:include src="/content/article-body" ttl="3600" />
```

Varnish assembles the final response by fetching and caching each included fragment independently. The article body is cached for an hour; the user header fragment is not cached (or cached briefly). The result: most of the page comes from cache; only the personalised fragment hits the backend.

## Purging cached content

When content changes, you need to invalidate the cached version. Varnish provides several mechanisms:

**BAN**: mark all cached objects matching an expression as invalid

```bash
varnishadm ban req.url ~ ^/blog/new-post
```

**Surrogate keys / cache tags**: a more precise purging mechanism. Your backend sends a header like `Xkey: product-123 category-electronics` with the response. Varnish stores this and supports purging all objects tagged with a specific key:

```vcl
sub vcl_backend_response {
    if (beresp.http.Xkey) {
        set beresp.http.Xkey = beresp.http.Xkey;
    }
}

// Purge by tag (requires the xkey VMOD)
sub vcl_recv {
    if (req.method == "PURGE") {
        if (req.http.Xkey-Purge) {
            ban("obj.http.Xkey ~ " + req.http.Xkey-Purge);
        }
    }
}
```

**Instant purge**: send a `PURGE` request for a specific URL:

```bash
curl -X PURGE http://varnish-host/blog/specific-post
```

In production, restrict purge requests to trusted internal IPs.

## Monitoring what Varnish is doing

`varnishstat` shows real-time statistics: cache hit ratio, request rate, backend health. The metric to watch first: `cache_hit / (cache_hit + cache_miss)`. A well-configured Varnish instance handling content workloads should have a hit ratio above 90%.

`varnishlog` shows request-level logs with the cache decision for each request. Essential for debugging why specific requests aren't being cached.

*Tuning a Varnish configuration or designing a caching strategy for a high-traffic site? [Happy to work through the specifics.](/contact)*
