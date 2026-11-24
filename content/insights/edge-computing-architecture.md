---
title: "Edge Computing Architecture: What Actually Belongs at the Edge"
description: "Between the CDN and the region sits a growing compute tier — edge functions, edge data, and the IoT/industrial edge. What workloads genuinely benefit, the data-consistency physics that constrain them, and a placement framework for the edge era."
date: 2029-05-18
tags: ["Cloud Architecture", "Edge Computing", "Architecture", "Performance", "Distributed Systems"]
format: article
---

"Edge computing" suffers from naming inflation — the term covers everything from a CDN rewriting headers, to serverless functions in 300 cities, to a ruggedized server rack on a factory floor, to inference chips in cameras. The architectures, constraints, and vendors barely overlap; what unites them is one idea: **moving compute toward the data source or the user, because some combination of latency, bandwidth, autonomy, or regulation makes the round trip to a cloud region unacceptable.** The architecture skill is knowing which of those four forces is actually in play — because "edge" adopted for fashion rather than physics is distributed-systems complexity purchased for nothing.

## The tiers, sorted

**The CDN-edge (hundreds of PoPs, milliseconds from users):** edge functions (Cloudflare Workers-class isolates, Lambda@Edge-class functions) executing per-request logic where TLS terminates. Runtime startup, execution budgets, and state capabilities vary by product and plan. Request manipulation is a common use, and some platforms also support substantial application hosting and stateful coordination.

**The regional/metro edge (closer sites with path-dependent latency):** carrier and hyperscaler extensions (Local Zones-class, 5G-integrated compute) for workloads needing real servers closer than the region — game servers, real-time media, regulated in-country processing where no full region exists.

**The on-premises/industrial edge (your sites, designed for local operation):** gateways and micro-datacenters at factories, hospitals, ships, and stores — where the drivers are less latency than **bandwidth economics** (a vision system generating terabytes daily that the uplink can't carry — filter/infer locally, ship summaries), **autonomy** (the production line must not stop when the WAN does), and **data gravity/regulation** (footage, patient data, sovereign constraints).

**The device edge:** inference on cameras, sensors, vehicles — the extreme of the same logic.

Different tiers, one recurring pattern: **the edge processes, the center consolidates.** Raw signal → local decision + compressed truth upward. Architectures that try to make the edge a *peer* of the center (full application stacks, full data replicas everywhere) inherit the multi-writer distributed-data problem at maximum difficulty; architectures that make the edge a *filter and fast-path* keep the complexity proportional to the benefit.

## What actually belongs at the CDN-edge

The proven residents of the request-path edge, in rough order of value density: **authentication and session validation** (verify the JWT, reject the unauthenticated, route the personalized — before paying the origin round trip); **routing and experimentation** (A/B assignment, canary steering, geo/compliance routing — decisions that are cheap, per-request, and latency-visible); **personalization of cached content** (the cache-plus-edge-assembly pattern: cache the expensive shared page, inject the user-specific fragment at the edge — recovering CDN economics for "personalized" pages); **API shaping** (header hygiene, bot filtering, rate limiting at the front door, response transformation for device classes); and increasingly **rendering** (edge-rendered frameworks executing the view layer close to users, with data fetched from regional backends).

What keeps *not* belonging there, despite annual vendor pushes: heavy business logic that needs the database anyway (moving compute to the edge while the data stays in us-east-1 just relocates your latency from user→compute to compute→data — often a net loss), and transactions whose coordination remains remote (below). The test for any edge-function candidate: *does this decision depend only on the request plus small, replicable-to-everywhere state?* If yes, it's an edge natural. If it needs authoritative, mutable state, identify where that state is coordinated and measure the complete read/write path. Supported stateful edge services can be appropriate, but their placement, consistency and failure semantics must match the operation.

**Edge data** is the frontier where this boundary is being renegotiated: globally-replicated config/flag stores (small, read-heavy, eventually-consistent — ideal), edge caches with regional write-back, and the growing family of edge-replicated databases (read replicas everywhere, writes forwarded to a primary region — good for read-latency, unchanged for writes). The physics, though, doesn't renegotiate: wide-area consensus has coordination and availability costs; adding sites does not remove them, so **writes at the edge are either forwarded (latency preserved for reads only), partitioned (each datum homed somewhere), or conflict-resolved (CRDT-class semantics for the data shapes that tolerate them)** — the same trilemma as multi-region, multiplied by two orders of magnitude of sites. Design reads-at-edge/writes-at-home first; earn anything fancier.

## The industrial edge: a fleet problem, not a server problem

The on-prem edge's defining challenge isn't the workload — it's **operating thousands of small sites with no on-site engineers**. The disciplines that decide success: **GitOps-style fleet management** (declared desired state per site-class, agents converging, drift visible centrally — the same reconciliation model as Kubernetes estates, and lightweight Kubernetes distributions are one possible substrate); **zero-touch provisioning and recovery** (a site must be installable by whoever signs for the box, and recoverable through tested remote or local procedures, with hardware service and site visits included in the operating model); **offline-first semantics** (queue-and-forward for upstream data with local buffering sized for realistic WAN outages, local operation continuing meanwhile — the store must sell things during the ISP's bad day); **physical-world security** (the box can be stolen: disk encryption, hardware-rooted identity, per-site credentials with tight blast radius, and the assumption that any single site may be hostile); and **observability designed for disconnection** (site-local dashboards for the on-site tech, compressed telemetry upward, and central alerting that distinguishes "site offline" from "site unhappy").

## The placement framework

For any workload, walk the four forces honestly: **Latency** — is there a user-experience or control-loop requirement that a regional round trip genuinely violates (measure it; test whether a claimed sub-ten-millisecond requirement applies to the complete operation)? **Bandwidth** — does moving the computation cost less than moving the data? **Autonomy** — what must keep working during a WAN partition, and what's the honest cost of it not? **Sovereignty** — does law or contract pin the data's location? If none of these requirements justifies distributed placement, use a regional deployment as the comparison baseline and assess its operating simplicity, cost and recovery behavior. Workloads scoring on one or more get placed at the *shallowest* tier that satisfies the requirement, with state design (reads distributed, writes homed, truth consolidated centrally) as the first architectural decision, not the last.

The strategic through-line: the edge is not the new cloud — it's the cloud growing a latency-and-locality gradient, and the winning architectures treat it as exactly that: a placement spectrum with physics-driven rules, rather than a destination with a slogan. Put the request-path quick wins at the CDN-edge, the physics-mandated workloads at the industrial edge, keep authoritative state consolidated, operate the fleet declaratively — and let every other workload enjoy the regional cloud's boring, centralized comforts. The edge rewards necessity and punishes fashion, with interest.

## Start with a complete latency path

A fictional product page currently needs 80 milliseconds of client-to-region round-trip time and 20 milliseconds of regional processing. In an intentionally simplified sequential model, its response takes 100 milliseconds. Moving rendering to a nearby edge with a ten-millisecond client round trip does not guarantee a ten-millisecond response: if rendering still calls the regional database, that remote dependency remains in the critical path. Measure the complete transaction, including connection reuse and cache behavior.

For the chart, compare three synthetic paths. A regional request costs 80 milliseconds of network time plus 20 processing, totaling 100. An edge request answered from locally available state costs 10 plus five, totaling 15. An edge request that also performs an 80-millisecond regional dependency call costs 10 plus five plus 80 plus 20, totaling 115. These are teaching inputs, not vendor benchmarks; real paths may overlap work, use different routing, or reuse connections.

The placement decision follows the dependency graph. A cached public document, a locally verifiable token, and an inventory reservation have different consistency requirements. The reservation may benefit from placing its authoritative partition near the dominant workload, but it cannot be made simultaneously local to every participant merely by adding execution sites. Identify which operation must coordinate and which can tolerate an older or derived view.

## State the meaning of an offline decision

Consider a fictional store that must continue accepting a limited set of transactions during a WAN outage. It needs a local policy describing what it may decide independently: which products, which spending limits, which payment modes, and which inventory claims. A queue of offline writes does not decide whether those writes remain valid when other sites also act. Define conflict handling before allowing disconnected operations.

Some data merges naturally: independent telemetry records can carry unique identifiers and be uploaded later. Other data has a scarce-resource invariant: two sites cannot both promise the final unit of stock without a reservation or explicit overcommit policy. A conflict-resolution algorithm can merge representations while still violating the business rule. Review the invariant, not just the database feature name.

An edge site also needs a clock and identity model. Local timestamps may drift, so ordering by wall-clock time alone can be unreliable after a long disconnection. Use sequence identifiers or other ordering mechanisms appropriate to the workflow. Credentials may expire while offline; decide which operations continue under cached policy and which stop. The recovery process must handle both data backlog and renewed authorization.

## Size the offline buffer and the catch-up path

Use a separate synthetic worksheet: a gateway produces 200 kilobytes per second of retained records, using decimal units. A six-hour outage produces 200,000 × 21,600 = 4.32 billion bytes, or 4.32 GB, before indexes, metadata, filesystem overhead, and safety margin. Compression may reduce this, but plan from measured distributions and failure behavior rather than an optimistic compression ratio.

If upload capacity after reconnection is 500 kilobytes per second while new records continue arriving at 200, the net backlog drain rate is 300 kilobytes per second. Draining 4.32 GB takes 14,400 seconds, or four hours, under the constant-rate assumptions. A link that can merely match new arrivals never clears the backlog. Publish both outage coverage and catch-up duration; buffer size alone does not demonstrate recovery.

Define what happens when the buffer fills. Dropping oldest telemetry may be acceptable for one monitoring use and unacceptable for an audit record. Stopping acquisition may be safer than silently losing data for another process. Expose buffer age, bytes, and dropped-record counts locally and centrally when connected. A central dashboard that simply shows the last healthy status can hide a disconnected site approaching exhaustion.

## A disconnected-site lab

Build a disposable edge node and central collector using synthetic records with unique identifiers and sequence numbers. Generate a known count, disconnect the WAN path, continue generating, then reconnect with a constrained upload rate. Compare the final collector count and identifiers with the expected set. Test duplicate upload after a lost acknowledgment and ensure deduplication follows the retention and identifier rules.

Interrupt power or terminate the process during a write according to the test environment's capabilities. Verify the durability guarantee actually provided by the local storage and application acknowledgment. A record accepted into memory is different from one committed to durable media. Check how the system detects and repairs a partial file or transaction rather than assuming restart implies recovery.

Deploy a new version while the site is offline, then reconnect. Confirm whether it receives every intermediate update or only the current desired state, and whether its stored data remains readable. Test rollback with the new data format. A fleet update must respect compatibility across versions that may coexist for days or weeks, not just during a short centralized rolling deployment.

## Edge security includes possession of the machine

A site device may be physically accessible to people outside the central operations team. Per-device identity, disk encryption, secure boot where supported, restricted local interfaces, and revocation procedures address different threats. Encrypting a disk does not protect data already accessible to a running compromised process. A shared fleet credential can turn one stolen device into broad access, so scope credentials and limit what each site can reach.

Remote administration needs a recovery design that works when normal management connectivity fails. Some failures require a person, replacement media, or hardware service; pretending every device can recover by power cycling hides that cost. Document which faults are remotely recoverable, which require a local procedure, and how a replacement receives identity without copying a secret from the retired device.

Geographic execution also does not by itself establish compliance with a data-location requirement. Logs, backups, control-plane metadata, support access, and external dependencies may move data elsewhere. Treat legal and contractual interpretation as a separate review with the responsible specialists, and map the actual data flows they need to assess. Avoid claiming that an edge deployment is compliant solely because its request handler runs nearby.

## Choose the smallest justified distribution

For each candidate function, record the user or process requirement, measured regional behavior, authoritative state, tolerated staleness, disconnected behavior, and recovery burden. Then compare a regional design, a cache or CDN change, and the proposed edge design. A cache-control improvement may deliver the desired response time without introducing another write authority. A local control loop may genuinely require device-side execution.

The acceptance evidence should include normal and degraded operation, not just a warm-cache latency chart. Test an empty cache, a stale configuration, a region outage, an offline site, and a fleet update with mixed versions. Record the runtime's current limits and the application behavior when a limit is reached. Distribution is justified when the measured benefit and required autonomy outweigh the state and operating responsibilities it introduces.

## Primary references

- [Cloudflare Durable Objects and stateful coordination](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/)
- [Cloudflare Workers resource limits](https://developers.cloudflare.com/workers/platform/limits/)
