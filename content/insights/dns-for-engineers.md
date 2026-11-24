---
title: "DNS for Engineers: The System You Depend On Most and Debug Least"
description: "Trace authoritative and recursive answers, calculate cache lifetimes, and rehearse DNS changes with negative caching and connection reuse."
date: 2027-03-22
tags: ["Systems", "DNS", "Cloud Architecture", "Reliability"]
format: article
---

"It's always DNS" earned its place as the industry's favorite eye-roll because it encodes a real asymmetry: DNS sits under many service calls, database connections, webhooks and health checks — while being the layer engineers examine last and understand shallowest. The result is a system whose failures masquerade as everyone else's (mysterious timeouts, regional weirdness, deploys that "randomly" break connectivity) until someone finally runs `dig` and finds the answer that was always going to be there. The corrective is modest: one honest mental model, a handful of failure patterns, and some operational hygiene.

## The model: a distributed, cached, eventually-consistent database

Resolution is delegation: the resolver walks from root servers to TLD servers to your zone's **authoritative** servers, which hold the actual records. A recursive resolver can reuse cached delegation and answer information rather than walking the full path for every query, because every layer **caches** aggressively — the recursive resolver (your VPC's, your ISP's, a public one), the operating system, the language runtime, sometimes the application's connection pool. DNS is therefore an *eventually-consistent* system whose convergence is governed by **TTLs** — and whose behavior in practice is governed by how much of the path actually honors them.

The TTL truths that explain most confusion: **caches serve until expiry, so a record change propagates as a decaying wave, not an event** — after you flip a record with a 300s TTL, clients converge over minutes *at best*; **cache policies differ** — resolvers that clamp or extend TTLs, OSes and JVMs with their own cache policies (inspect your runtime's `networkaddress.cache.ttl` story), and applications holding connections that never re-resolve at all (the pooled connection to a decommissioned IP is a failover classic: DNS updated perfectly, nothing reconnected — connection-lifetime policies and re-resolution on failure are the application-layer half of every DNS-based failover design); and **plan the pre-change window** — drop the TTL *one full old-TTL period before* the migration, verify convergence, make the change, then restore. Retain a rollback and overlap window appropriate to the observed clients.

## DNS as infrastructure layer: routing, failover, discovery

Modern DNS providers turned the phone book into a control plane, and using it well means knowing what each capability actually promises:

**Health-checked failover and routing policies** (weighted, latency-based, geo) make DNS the coarse-grained traffic-steering layer — the right tool for region-level failover and gradual traffic migration, with its honest caveat baked in from the section above: DNS steering converges at cache speed, so recovery depends on TTLs, health checks and client behavior; anycast and load-balancer layers have different detection and convergence mechanisms (the division of labor from multi-region practice). Design both, and don't ask DNS for what its physics can't give.

**Service discovery inside platforms** — Kubernetes runs on DNS (service names resolved through the cluster DNS path), which makes cluster DNS (CoreDNS) a tier-zero dependency with its own capacity and failure story: ndots-driven query amplification (the classic — every unqualified lookup fanning into multiple search-domain attempts, multiplying cluster DNS load), conntrack races dropping UDP lookups under load, and the mitigations (node-local DNS caching where justified, sensible ndots, FQDNs in hot paths) that should be evaluated against measured query volume and the platform configuration.

**CNAME/alias mechanics at the apex,** split-horizon zones (internal names invisible externally — and the audit question of what your internal zone *leaks* about your architecture when it isn't), and the provider-alias records that bend the CNAME-at-apex rule — the small standards knowledge that prevents the small standing mistakes.

## The failure patterns behind "it's always DNS"

The genre has recurring plots, each with a real mechanism: **the expired domain or botched registrar change** (organizational failure, technical blast radius — domain expiry monitoring is the cheapest insurance in infrastructure); **the DNSSEC validation failure** (signing correctly is safety; re-signing/rotation done wrong is self-inflicted invisibility — validating resolvers can reject bogus data and return a failure; if you run DNSSEC, automate the key ceremonies and monitor validation externally); **the resolver capacity event** (the VPC resolver's per-ENI query limits, the overwhelmed on-prem BIND — resolution *slowness* that manifests as everything-slowness, because every connection setup now carries a stalled lookup; per-instance caching and query-volume dashboards are the fixes); **the negative-cache trap** (NXDOMAIN answers are cached too — query a name *before* creating it, and clients keep saying it doesn't exist for the negative TTL; the "we created the record, why doesn't it resolve" mystery, solved); and **the delegation drift** (NS records at the parent disagreeing with the zone — works-until-it-doesn't behavior that surfaces on resolver-behavior differences). None of these is exotic; all reward the same reflex — *check resolution explicitly, from the affected vantage point, before debugging the application:* `dig` at the authoritative server (is the record right at source?), then through the resolver path (what's cached where?), comparing vantage points (is this global or local?). Minutes, not hours, once the reflex exists.

## The hygiene checklist

What mature estates do about all of the above: **DNS records live in infrastructure-as-code** (reviewed, versioned, revertible — console-edited DNS is how typos take down products, and how nobody knows what changed at 14:32); **monitoring watches resolution externally** (synthetic queries from multiple vantage points against your critical names, alerting on wrong-or-slow answers, plus domain/DNSSEC expiry checks — DNS monitoring from *inside* your own network shares fate with what it monitors); **TTL policy is deliberate** (choose values against query load and recovery objectives for records that participate in failover and migration; longer on the stable; and *documented*, so the next engineer knows which records are steering wheels); **resolver architecture is designed, not inherited** (per-host/node caching, redundant recursive paths, and awareness of every cloud resolver limit in the request path); and **the runtime layer is audited once per stack** — connection-pool re-resolution behavior, language-level DNS caching, container base-image resolver quirks — because the story of most DNS failovers-that-didn't is written in the application layer, not the zone file.

DNS's whole job is to be forgettable, and everything above serves that goal: model it as a cached eventually-consistent database, respect the TTL wave, use it for the steering it's good at, learn the five failure plots, and codify the hygiene. Done, the eye-roll retires — not because it stops being DNS, but because when it is, the investigation follows observable evidence.

## Worked migration: why lowering a TTL does not rewrite caches

Take a hypothetical A record with an old TTL of 3,600 seconds. At 09:00 the authoritative zone changes the TTL to 300 seconds while keeping the same address. Resolver A fetched the previous record at 08:59: its cached copy can remain valid until 09:59. Resolver B fetches at 09:01 and receives the new 300-second TTL. At 09:05, A still has 3,240 seconds remaining while B has 60 seconds remaining. Both can be behaving correctly. The authority cannot reach into A's existing cache and shorten the earlier lifetime.

The figure compares those remaining lifetimes at one observation time. It is a synthetic calculation, not a claim about how many users have migrated. If the address changes at 10:00, a resolver that fetched the reduced TTL just before the change may still serve the old address for almost another five minutes. A persistent application connection can remain on the old server longer still, even after its resolver would return the new address. Keep the old endpoint able to serve or redirect requests during the measured transition and drain connections deliberately.

This plan also needs a failure branch. A resolver implementing serve-stale can return previously cached information when fresh authoritative resolution is unavailable, under its configured policy. That behavior is a resilience mechanism documented in RFC 8767, not simply a resolver lying. If the old address is immediately reassigned to an unrelated system, stale answers become more consequential. Address ownership and retirement policy belong in the migration checklist alongside TTL values.

## Read the response before changing the record

DNS troubleshooting should distinguish a response code from a network timeout. NXDOMAIN means the queried name does not exist according to the answer; NOERROR with no records of the requested type is a different result. SERVFAIL can reflect validation or upstream resolution problems and is not proof that the name is absent. A timeout may mean the query or reply was lost, a server did not respond, or a local policy blocked it. Treat these as separate observations rather than combining them into a generic DNS error rate.

Negative caching has its own lifetime rules. An authoritative negative response carries SOA information used to establish the cache duration. Creating the name afterwards does not invalidate a negative response already held elsewhere. In a staging zone, query a deliberately absent name, create it, and observe both the authoritative answer and the recursive answer until they agree. Record the negative TTL actually returned instead of assuming that the new A record's TTL controls the earlier NXDOMAIN cache entry.

A useful incident record contains the exact query name, query type, responding server, response code, flags, answer set, remaining TTL and elapsed query time. Keep A and AAAA results separate. IPv4 working does not establish that the IPv6 path works; a client may select addresses differently from a command-line diagnostic. Include the application's configured resolver and search list, not merely the resolver used by the engineer's laptop.

## A reproducible diagnostic worksheet

Use an owned test domain and substitute its actual authoritative server and resolver addresses in these commands. A direct authoritative query checks the source view; it does not reproduce recursive resolution or prove that DNSSEC validates. A TCP query is useful when comparing transport behavior, particularly with large replies or truncation. Do not assume that opening UDP port 53 alone is a complete DNS firewall policy.

```sh
dig @AUTHORITATIVE_IP service.example.test A +norecurse
dig @RESOLVER_IP service.example.test A
dig @RESOLVER_IP service.example.test AAAA
dig @RESOLVER_IP service.example.test A +tcp
dig @RESOLVER_IP absent.example.test A
```

The reserved example name above is a placeholder, not an operational endpoint. Run equivalent queries from the affected workload network and from an independent permitted vantage point. Compare results before flushing caches: clearing the evidence can hide the fault and make a temporary recovery look like a diagnosed cause. If one resolver differs, inspect its delegation path, forwarding policy, cache state and validation status before changing public records.

For a Kubernetes workload, capture the pod's resolver configuration and the fully qualified name sent on the wire. A search list and ndots setting can cause additional queries for a name that looks complete to a human. A trailing dot can make a diagnostic name absolute, but changing application configuration requires testing its URL, TLS and library behavior. Node-local caching can reduce central query load; it also introduces another component whose capacity, cache policy and failure behavior need observation.

## Make failover success measurable

Define success as successful application operations against the intended destination, not just a correct answer from one DNS server. Measure the authoritative change time, the distribution of resolver answers, new connection destinations, and the final requests received by the old service. A low authoritative TTL does not imply an equally low recovery time because health-check detection, routing decisions, resolver caches, connection reuse and application retries contribute separately.

For the worksheet, assign an owner to each stage and record a maximum acceptable delay grounded in the service objective. Do not add arbitrary delays and report them as measured recovery. Run a rehearsal using a harmless test endpoint and collect actual timestamps. Include a resolver outage, an unavailable authoritative server and a client with a long-lived connection. Restoration must include any temporary firewall or resolver configuration introduced by the exercise.

Finally, keep DNSSEC, encrypted DNS transport and authoritative access control conceptually separate. DNSSEC authenticates DNS data under its trust chain; it does not encrypt the lookup. Encrypted transport protects a connection to a resolver but does not guarantee that every answer is correct. Zone-edit permissions protect the control plane. A professional runbook identifies which layer failed, who can fix it, and how success is independently checked. That precision turns DNS from a catch-all explanation into a testable dependency.

### Figure methodology

Synthetic observation at 09:05: resolver A fetched a 3,600-second TTL at 08:59, leaving 3,600 - 360 = 3,240 seconds. Resolver B fetched a 300-second TTL at 09:01, leaving 300 - 240 = 60 seconds. This excludes serve-stale and application connection reuse.

| Worked observation | seconds remaining |
| --- | ---: |
| Resolver A at 09:05 | 3240 |
| Resolver B at 09:05 | 60 |

## Primary references and further study

- [IETF: DNS implementation and specification](https://www.rfc-editor.org/rfc/rfc1035.html)
- [IETF: negative caching of DNS queries](https://www.rfc-editor.org/rfc/rfc2308.html)
- [IETF: DNS serve-stale](https://www.rfc-editor.org/rfc/rfc8767.html)
- [IETF: DNS transport over TCP](https://www.rfc-editor.org/rfc/rfc7766.html)
