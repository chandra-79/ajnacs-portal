---
title: "Real-Time Architecture: WebSockets, SSE, and Recoverable State"
description: "Choosing between WebSockets, Server-Sent Events, and polling is the easy part. The hard parts are what long-lived connections do to load balancing, deployment, scaling, and state — the operational architecture of real-time systems."
date: 2027-07-14
tags: ["Programming", "Distributed Systems", "API Design", "Performance", "Architecture"]
format: article
---

Real-time features — live dashboards, collaborative editing, chat, notifications, streaming AI responses — all begin with the same innocent-sounding decision ("WebSockets or something else?") and all eventually discover the same truth: the transport choice is the smallest part of the problem. **Long-lived connections invert the assumptions your entire HTTP infrastructure was built on** — statelessness, short requests, cheap retries, load balancing by request — and the real architecture work is managing that inversion. Here's the full picture, transport first, then the parts that actually fill the incident channel.

## The transport decision, briskly

**Server-Sent Events (SSE)** — one-directional server→client streaming over plain HTTP. The browser API supports reconnection and a last-event identifier; the server must implement retention and replay. Proxy buffering and idle timeouts still require testing. If your feature is *the server pushing updates* — feeds, notifications, dashboards, LLM token streaming (SSE is the de facto standard for AI streaming responses for exactly these reasons) — SSE does the job with a fraction of WebSockets' operational surface. It's the most underused tool in this space; the reflex that skips it costs teams real complexity.

**WebSockets** — full bidirectional messaging over a persistent connection. The right tool when clients genuinely *send* at interactive frequency: chat, collaborative editing, multiplayer state, terminal sessions. The cost: a distinct protocol lifecycle (an opening handshake, ping/pong keepalives, close semantics) that infrastructure must explicitly support — intermediaries must support the selected handshake and connection lifetime; HTTP/1.1 Upgrade and HTTP/2 or HTTP/3 extended CONNECT have different requirements, and it steps outside the HTTP toolbox (standard auth middleware, caching, per-request observability all need re-plumbing).

**Long polling** survives as the compatibility fallback under restrictive middleboxes, and **WebTransport** is the emerging HTTP/3-based option for the low-latency frontier — but a useful starting comparison is simpler than the option list suggests: *SSE for push, WebSockets for genuine bidirectionality, and a managed real-time service when you'd rather buy the following sections than build them.*

## What long-lived connections break

**Load balancing stops balancing.** Requests distribute per-arrival; connections distribute per-*connect* and then stay put — so a restarted server rejoins the pool empty while its former connections pile onto survivors, and a scale-up adds capacity that receives only *new* connections. Real-time fleets need a balancing policy tested against connection and message load; least-connections is one option, but can misrepresent unequal connection workloads, and more importantly **connection draining and rebalancing as designed behaviors**: servers that can tell clients "reconnect elsewhere" gracefully, and clients built to comply.

**Deployment becomes a disconnection event.** A replacement of a connection-holding process eventually ends its connections — at fleet scale, a rolling restart is a self-inflicted reconnection storm. The disciplines: graceful shutdown with generous drain windows (stop accepting, notify clients, drain over minutes), deploy waves sized against reconnect capacity, and — architecturally — **keeping connection-holding servers thin and rarely-deployed**: a gateway tier that holds sockets and forwards messages, with business logic behind it deploying freely, decouples release velocity from connection stability. This tier split can reduce routine reconnect work, at the cost of another service boundary and routing responsibility.

**Reconnection is a stampede generator.** Any blip — a load balancer failover, a network hiccup, that deploy — sends thousands of clients reconnecting *simultaneously*, each performing a handshake and auth and state resync far more expensive than a steady-state message. Clients must reconnect with **exponential backoff and jitter** (the retry-storm discipline, now on the client side), and servers must treat resync as a first-class cheap path: which brings up the real boss fight.

**Message delivery during disconnection.** A client that was offline for 40 seconds missed messages; a client that reconnected to a *different server* missed whatever the old server had queued locally. Real-time systems need an answer to "what did I miss?" — and the robust one is the same shape everywhere: **sequence numbers per stream/channel, server-side retention of a recent window (a log, a Redis stream, a ring buffer), and resume-from-cursor on reconnect**, with a fallback to full state resync when the gap exceeds retention. Systems that skip this ship a UI that silently loses messages, discovered one confused user at a time. (Notice the shape: it's the log-vs-queue insight again — real-time delivery is an optimization over a resumable stream, exactly as webhooks are an optimization over a reconcilable API.)

## The state problem: who's connected where, and who gets what

At one server, "broadcast to room X" is a loop. At N servers, connection state is *sharded by accident of connection*, and message routing becomes the defining problem: user A on server 3 sends to a room whose members sit on servers 1, 4, and 9. The standard answer is a **pub/sub backplane** — Redis pub/sub tier for modest scale, Kafka-class or purpose-built brokers beyond — with servers subscribing to the channels their connections care about and fanning out locally. The design points that determine whether it scales: **subscription granularity** (per-user channels multiply broker load; per-room aggregates it; hierarchical topics balance), **presence** ("who's online" is distributed state with TTL-heartbeat semantics — a lease-based, eventually consistent design is often appropriate, while stronger coordination may be justified for particular semantics), and **fan-out amplification** (one message to a 50k-subscriber channel is 50k sends — big-room broadcast wants dedicated paths and batching, not the same machinery as 1:1 chat).

Above it all, the delivery semantics selected for the application: dedupe by message ID client-side, make handlers idempotent, and design ordering per-channel (sequence numbers again) rather than globally.

## The operational rim, and the buy option

Run real-time tiers with their own vitals — concurrent connections per node, connect/disconnect rates (the stampede detector), message latency end-to-end (inject-to-deliver, not just server processing), backplane lag, and per-channel fan-out cost. Capacity-plan on *memory and file descriptors per connection* (the usual binding constraints — connection capacity depends on per-connection state, runtime, workload, and operating-system limits) and on *reconnect throughput* (the constraint that actually fails during incidents). Test the ugly paths deliberately: kill a node and watch the stampede, deploy under load, partition the backplane.

And weigh the buy option honestly: managed real-time platforms (the Pusher/Ably tier, cloud pub/sub-over-WebSocket services) sell precisely the hard parts — global connection fleets, resume semantics, presence, fan-out — and compare their total cost with the staffing and operating cost of a custom implementation. The build case strengthens with scale, latency specificity, and data-locality constraints; just make it a case, not a reflex.

The compact summary: pick SSE unless you need true bidirectionality; split the socket-holding gateway from the logic tier; make reconnection resumable with sequences and retention windows; route via a pub/sub backplane with deliberate channel granularity; treat presence as leased, eventually-consistent state; capacity-plan for the stampede, not the steady state — and remember throughout that a real-time system is just a distributed log with impatient subscribers, which means every discipline from the messaging world applies, plus a dial tone.

## Separate live delivery from the recoverable record

A fictional order-status dashboard makes the requirements concrete. Users need new states within a second while connected, but a temporarily offline browser must eventually show the current state. They do not need to observe every transient progress animation. A collaborative editor has a different requirement: operations must merge according to its editing model, not merely arrive quickly. Select the delivery contract before selecting the transport.

Assign an event identifier within a defined stream, such as one account's order feed. A reconnect request presents its last applied identifier. The server authorizes the subscription, checks whether that position remains in retained history, and either replays subsequent events or asks the client to obtain a fresh snapshot. The snapshot needs a position that defines where replay begins. Without that relationship, an update between snapshot creation and subscription can be missed, or applied twice in the wrong order.

For SSE, the browser's last-event identifier supports this exchange but does not create a replay store. For WebSockets, define an equivalent application message. Neither transport makes database state and event publication atomic. If a state change commits and the publisher crashes before emitting its event, a live connection cannot repair the missing publication. Consider a transactional outbox or a reconciliation path appropriate to the data store, then test that failure boundary independently of socket connectivity.

## Size fan-out and slow consumers explicitly

Use the following synthetic workload for the chart. A channel publishes two messages per second, each with a 500-byte application payload. With 100 subscribers, payload fan-out is 100,000 bytes per second; with 1,000, it is 1,000,000; with 5,000, it is 5,000,000. The chart expresses these as 0.1, 1, and 5 decimal megabytes per second. Protocol framing, TLS, compression, broker traffic, acknowledgments, and retransmissions are excluded. These are planning inputs, not measured capacities.

The cost grows with delivered copies, not just published events. A gateway serving many subscribers might serialize a common payload once, but it still maintains connection state and writes to each recipient. A subscriber consuming only 200 bytes per second cannot keep up with a 1,000-byte-per-second stream. Its queue grows by approximately 800 bytes per second before overhead. An unbounded per-client buffer turns a temporarily slow browser into server memory growth.

Choose a slow-consumer policy by event meaning. Replace older cursor positions with the newest position when intermediate values are disposable. Disconnect and resume from a durable position when every event matters. Bound queue bytes as well as message count, because one large message can dominate memory. Explain when the client should show a stale-data indicator instead of a misleadingly live screen.

## Rehearse reconnect as a separate workload

Imagine 6,000 clients disconnected by a failed gateway. Uniformly spreading their first retry over 30 seconds produces an expected 200 initial attempts per second, not a guarantee of exactly 200 in each second. Random clustering and repeated failures still create bursts. Each attempt may require authentication, subscription reconstruction, and replay. Benchmark that path separately from the cheap steady-state heartbeat.

Backoff should have a cap and jitter, and a successful connection should not immediately erase all caution if it repeatedly fails during startup. Resume retention must cover the disruption the product claims to tolerate. If history lasts ten minutes and a browser returns after an hour, a snapshot path is necessary. Rate-limit replay so recovering clients do not starve already connected clients, and show recovery progress when rebuilding state is noticeable.

A rolling deployment needs a bounded drain period, not an infinite wait for every connection to close naturally. Stop admitting new connections to the draining instance, advertise an appropriate reconnect behavior, and retain enough capacity elsewhere for the moving population. Compare graceful replacement with sudden termination: the sudden case is the actual resilience requirement, while the graceful case reduces routine disruption.

## A protocol test worksheet

Build a small service with one stream and a deterministic sequence of 20 events. Record the identifiers the client applies, not just the frames the server sends. Disconnect after event eight, publish events nine through twelve, then reconnect. Verify that the final client state matches applying all 20 events once in order. Deliberately repeat event twelve and ensure the application effect is not duplicated. The deduplication store or cursor must survive the lifecycle your product promises, including page reload if necessary.

Next expire the replay position before reconnecting. Confirm that the client receives an explicit resynchronization response and obtains a consistent snapshot. Test a snapshot arriving while new events continue. If order is per stream, do not assert global order across independent streams. If clients can send commands, include a command identifier and reconcile its result after the connection drops before the acknowledgment; sending it again blindly can repeat a side effect.

Run the same tests through the actual reverse proxy. Check buffering, idle timeouts, maximum message size, maximum connection duration, and deployment behavior. A local localhost demonstration does not test an intermediary that buffers SSE until a threshold or closes an otherwise idle connection. Heartbeats can keep a path active, but overly frequent heartbeats across many clients become a workload of their own.

## Security continues after the handshake

An authenticated connection is not permission to subscribe to every channel forever. Validate the requested resource and tenant for each subscription and relevant command. Decide how logout, account suspension, role changes, and token expiry affect an already open connection. A periodic reauthorization or revocation mechanism needs a tested upper bound; otherwise removing access may leave a live stream active far longer than intended.

For browser WebSockets, validate origins according to the application's trust model. Cookies may accompany a handshake, so relying only on cookie possession can create cross-origin risks. Do not put reusable credentials into URLs that may enter logs. SSE's native EventSource interface has authentication constraints that differ from a general fetch request; choose a supported cookie or token design and assess its consequences. TLS protects transport confidentiality but does not authorize a channel.

## Decide what the managed service must prove

A managed service evaluation should use the same failure worksheet. Ask which delivery guarantees apply to live connections, retained history, and reconnect separately. Measure latency from committed application state to rendered client state; provider ingress latency is only one segment. Check history retention, regional placement, export paths, payload limits, and the cost of fan-out and reconnect traffic.

The resulting architecture record should name the stream boundary, ordering scope, duplication behavior, replay window, snapshot protocol, slow-consumer policy, authorization lifecycle, and deployment drain limit. A transport diagram is incomplete until those state transitions are described. With them, a reader can test whether the feature remains correct when the connection is no longer real-time.

## Primary references

- [WebSocket protocol specification](https://www.rfc-editor.org/rfc/rfc6455.html)
- [HTML Server-Sent Events standard](https://html.spec.whatwg.org/multipage/server-sent-events.html)

- [WebSockets over HTTP/2, RFC 8441](https://www.rfc-editor.org/rfc/rfc8441.html)
- [WebSockets over HTTP/3, RFC 9220](https://www.rfc-editor.org/rfc/rfc9220.html)
