---
title: "HTTP Caching, Correctly: Cache-Control, ETags, and the Headers That Run the Web"
description: "The web's caching layer is a distributed system you configure with five headers — and most APIs and sites configure it by accident. Freshness vs validation, the immutable-asset pattern, stale-while-revalidate, CDN cache keys, and the private-data footguns."
date: 2028-05-01
tags: ["Web Performance", "HTTP", "Performance", "API Design", "CDN"]
format: article
---

Between your origin and every user sits a volunteer distributed cache of planetary scale — browser caches, corporate proxies, CDN edges — that will store and serve your responses according to rules you declare in a handful of headers. Most teams declare those rules by framework default and cargo cult, which produces the twin failure modes seen everywhere: assets that *could* be cached forever getting refetched on every visit (performance left on the table), and responses that must *never* be shared getting cached somewhere surprising (the private-data-in-shared-cache incident genre). HTTP caching is a small, learnable contract — five headers and two mental models — that runs a shocking fraction of the web's performance.

## The two models: freshness and validation

**Freshness** answers "may this be served without asking the origin?" — `Cache-Control: max-age=3600` grants an hour of serve-from-cache autonomy; a suitable cache may reuse a fresh response under the applicable request and response rules, avoiding an origin request while lookup and network costs can remain; after it, the response is *stale*, not deleted — which is where the second model begins. **Validation** answers "is my stale copy still good?" — the origin sends a validator with the response (**ETag**, an opaque representation validator, or `Last-Modified`), and the client's revalidation request carries it back (`If-None-Match`); the origin answers either **304 Not Modified** (headers only, no body — the cheap answer that says "your copy stands") or a fresh 200. The composite is the machine: fresh → serve locally; stale → revalidate cheaply; changed → transfer fully. Most caching misconfiguration is using one model where the other belongs — long `max-age` on mutable content (the "why is the old version still showing" ticket) or zero caching with no validators on stable content (full re-transfers of unchanged bytes forever).

## Common patterns to evaluate

**Immutable fingerprinted assets** — the web-performance workhorse: build pipelines emit content-hashed filenames (`app.3f2ab1.js`), served with `Cache-Control: public, max-age=31536000, immutable` — allow long-lived reuse, *because the URL changes when the content does*; the HTML that references them carries the short leash instead. This pattern (versioned-URL-plus-immutable) is the static half of every framework's deployment story and the reason "cache invalidation is hard" mostly stopped applying to assets: you don't invalidate — you address.

**HTML and API responses** — the mutable tier: short-or-zero freshness with validators (`no-cache` means *always revalidate*, not *never store* — the misreading that costs teams 304s they could have had; *never store* is `no-store`), and the modern refinement that CDNs made standard: **`stale-while-revalidate`** — permit serving a stale response within the directive's stated window while attempting background revalidation where supported — which buys cache-hit latency with bounded staleness (a declared staleness budget, per the derived-data honesty rules), and its sibling `stale-if-error` (stale beats 500 — the graceful-degradation posture in one directive).

**The API-specific dividend:** ETags on API responses do double duty — the caching 304s, and **optimistic concurrency** via `If-Match` on writes (the lost-update guard from pagination-and-session practice — same validator, second job). Conditional requests are the API's cheapest bandwidth and consistency tool, and most APIs ship neither.

## The shared-cache layer: keys, variance, and the private-data rule

CDN and proxy caching adds the questions browsers don't ask: **What's the cache key?** — based on the method and target URI, with implementation-specific rules and variation handling, which means everything that *changes the response* must either be in the URL or declared via **`Vary`** (the header that says "the response depends on Accept-Encoding / Accept-Language / this-custom-header") — and every `Vary` dimension multiplies cache fragmentation (Vary on `Cookie` or `User-Agent` is effectively "don't cache" wearing a technical costume; the compression negotiation from compression practice rides `Vary: Accept-Encoding` as the one universal, well-supported case). CDN-level cache-key configuration (which query params matter, which headers, normalized how) is where hit rates are won: unnormalized keys (`?utm_source=...` fragmenting the cache per marketing campaign) are the classic silent hit-rate killer, findable in one afternoon of CDN analytics.

**The private-data rule** deserves its own paragraph because its failures make headlines: `Cache-Control: private` (private caches only, not necessarily only a browser) versus `public` (shared caches welcome) helps express the distinction between "cached on the user's device" and "cached on infrastructure that serves other users" — and sensitive personalized responses need a deliberate private-cache or no-store policy that the CDN respects; shared caching of authenticated responses is only appropriate under explicit HTTP rules and a reviewed authorization-aware design. The incident pattern is depressingly stable: a caching layer added in front of an app that assumed no shared cache, session-authenticated pages cached publicly, user A served user B's account page. Every response containing personal data needs its cache policy *reviewed as a security control* (the privacy-engineering lens), and the edge configuration audited against it — because default CDN behaviors on ambiguous headers vary, and ambiguity at this boundary is exposure.

**Purge is the escape hatch, not the strategy:** CDN invalidation APIs (purge-by-URL, by tag/surrogate-key — the tagging pattern that lets "purge everything about product 123" be one call) handle the *exceptional* update; architectures that rely on purge for routine correctness have chosen the hardest consistency model available (distributed invalidation) when addressing (fingerprints) or short-TTL-plus-SWR would have deleted the problem. The placement mirrors every derived-store discipline: the cache is a projection; design for rebuild-by-expiry first, targeted invalidation second, and never for "we'll purge and hope."

The audit worth running this quarter, because it can reveal correctness and efficiency issues: pull the CDN hit-rate report by content type; check the top misses for unnormalized keys and missing freshness headers; grep the API responses for absent ETags; confirm every authenticated route's `Cache-Control` says what the security model needs; and verify the asset pipeline emits immutable fingerprints. Five headers, two models, one afternoon — and the planetary cache you were already renting starts working for you at the rate it always could.

## Write a policy per representation

Start with the information being served, not a global header copied into every route. A public, versioned image has different freshness needs from an account page or a rapidly changing operational status. Record who may reuse the representation, how old it may be, whether revalidation is supported, and what should happen when the origin is unavailable.

A cache key identifies a representation under the cache's rules. Method, target URI, and selected request fields can matter, and a CDN may add configuration-specific behaviour. Query-parameter normalisation is safe only when the removed parameter truly does not affect the response. Ignoring a tenant, locale, or authorisation-related input can mix representations that must remain separate.

`Vary` tells a compliant cache which request fields influenced selection, but it does not repair an origin that returns the wrong user's data or a CDN rule that deliberately ignores the relevant dimension. Test the complete edge-to-origin path with distinct synthetic accounts. Do not rely on a single header inspection as proof of isolation.

## A hypothetical transfer-budget example

Assume an unchanged public document has a 200 KiB body and is requested 100 times. With no reuse or validation, body transfer totals 20,000 KiB. In a simplified validation scenario, the first request transfers 200 KiB and the next ninety-nine receive 304 responses with no body, so body transfer remains 200 KiB. The chart compares body bytes only.

This is not a measured CDN saving. Request and response headers, TLS and transport overhead, cache eviction, and origin computation are excluded. Revalidation still involves a request and can require work to determine whether the representation changed. A 304 reduces body transfer; it does not automatically mean zero latency or zero origin cost.

A fresh shared-cache hit can avoid an origin request, while a browser hit may avoid the network path entirely. Those outcomes have different latency and observability characteristics. Report browser reuse, edge hit rate, origin request rate, and bytes transferred as separate measures rather than treating every cache hit as equivalent.

## Validators must describe the selected content

An ETag is an opaque validator chosen by the server, not necessarily a hash of the response body. Its strength matters. Weak validators can support some cache validation uses but do not satisfy strong comparison where required, such as `If-Match`. If the representation varies by language or content encoding, ensure validator handling is consistent with the selected representation and the HTTP semantics.

For a concurrent-edit API, a client can send `If-Match` with a suitable validator to request an update only if the current representation still matches. The server must enforce the condition together with the state change. Checking the tag and then writing in a separate unprotected step leaves a race. A conditional header is a contract the application must implement correctly, not a lock supplied by the network.

Test two editors reading the same version, one successfully writing, and the other attempting a stale update. Verify the precondition-failure response and the client's recovery path. Do not silently overwrite the first edit. If the API intentionally merges changes, describe that policy separately from validator-based rejection.

## Staleness is a product decision

Serving stale content during revalidation can improve availability and response time when the content tolerates it. It can be inappropriate for an access revocation, a sensitive account state, or a value whose age changes the decision a user makes. Set the allowed age based on the information's meaning and label freshness where useful.

`stale-while-revalidate` and `stale-if-error` are extensions with defined conditions and support requirements. They do not force every intermediary to behave identically. Test the actual cache implementation, including what happens when the stale window expires, revalidation fails, or an object is evicted. A directive is not a guarantee that a cached copy exists when you need it.

For fingerprinted assets, keep older files available long enough for cached HTML and open tabs that still reference them. Deleting every prior asset at deployment can break a perfectly valid cached page. A rollback also needs its referenced assets. Content-addressed naming simplifies updates, but retention remains part of the deployment contract.

## A cache-isolation and correctness lab

Use a test origin behind the same cache configuration intended for deployment. Create a public document with a stable validator and a private synthetic account response. Fetch the public document twice, change it, then repeat conditional requests. Inspect status, cache-control fields, validator changes, body content, and cache-specific diagnostics where available.

Next use two accounts with different harmless profile values. Request the same path in alternating order and verify that neither receives the other's response. Repeat after logout and after changing a relevant request header. Include redirects and error responses, since a cache policy attached only to successful responses can leave surprising gaps.

Test a deployment with old HTML referencing old fingerprinted assets. Confirm that the assets remain retrievable. Then exercise any purge mechanism and verify its scope and eventual effect. If correctness requires rapid invalidation, document the actual guarantee and failure response rather than assuming every edge updates instantly.

## Measure improvement without hiding risk

A higher hit rate is not always better. Accidentally caching personalised responses can produce an excellent hit rate and a serious correctness failure. Likewise, a long freshness window can improve latency while showing obsolete content. Pair performance metrics with representation-isolation tests and the stated freshness policy.

The review record should contain the route class, cache key, permitted audience, freshness budget, validator behaviour, invalidation or update mechanism, and test evidence. That is enough to make a caching change understandable to the next engineer. The goal is predictable reuse of the correct representation, with measurable benefits and explicit limits.

## Further reading and source boundaries

- [RFC 9111: HTTP caching](https://www.rfc-editor.org/rfc/rfc9111.html)
- [RFC 9110: validators and conditional requests](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 5861: stale cache-control extensions](https://www.rfc-editor.org/rfc/rfc5861.html)
- [RFC 8246: immutable responses](https://www.rfc-editor.org/rfc/rfc8246.html)
