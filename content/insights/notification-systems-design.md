---
title: "Notification Systems: The Architecture Behind 'Just Send Them a Message'"
description: "Notifications are a full distributed pipeline wearing a feature's costume — channel orchestration, preference and quiet-hours logic, batching and digests, deduplication across retries, and the engagement feedback loop that separates signal from spam."
date: 2028-03-22
tags: ["Programming", "Architecture", "Distributed Systems", "Product Engineering", "SaaS"]
format: article
---

"Send the user a notification" is the feature request that most reliably hides a platform underneath: what starts as an email call in a request handler becomes — one product year later — a system spanning four channels (email, push, SMS, in-app), preference matrices, quiet hours across time zones, digest batching, retry semantics per provider, deduplication across retries, and the analytics that answer whether any of it works. Teams that build it incrementally-by-accident accumulate the notification spaghetti every mature codebase recognizes: sends scattered across services, preferences checked sometimes, the duplicate-notification bug that surfaces quarterly, and no single answer to "what did we send this user and why?" The alternative is recognizing the platform early — because its architecture is well-converged.

## The pipeline shape: decouple intent from delivery

The foundational split: **producers emit notification *intents*** (domain events with semantic type — `order_shipped`, `mention_received` — and payload references, never rendered content or channel decisions), and a **central notification service owns everything after**: eligibility, preferences, channel selection, rendering, and delivery. The decoupling does what decoupling always does — producers stay simple and consistent (one event, fired from the outbox per the dual-write disciplines), while the cross-cutting policy (the preference logic, the compliance rules, the rate governance) lives once instead of per-callsite. The pipeline stages, each with its discipline:

**Eligibility and preference resolution** — the matrix of user preferences (per notification-type, per channel), account-level policy (the tenant admin's controls in B2B, per multi-tenancy practice), regulatory gates (marketing-versus-transactional classification with consent state — applicable policy requirements that make purpose and consent meaningful inputs, not merely routing keys), and **quiet hours in the user's timezone** (the time-handling disciplines, applied to courtesy — with the priority-override tier: the security alert ignores quiet hours; the weekly digest respects them). This stage's output is auditable: *why* did this notification go (or not go) to this user on this channel — the correlation-ID answerability from observability practice, which support will need weekly and compliance will need eventually.

**Aggregation and digests** — the anti-spam engineering: the burst of forty events ("someone liked your post" × 40) collapses into one notification via windowed batching (the stream-processing session-window machinery, pointed at attention), per-type digest policies (immediate / hourly rollup / daily digest — a *user preference*, resolved above), and the cross-channel escalation ladders (in-app first; push if unread in N minutes; email if still unread — the state machine that respects attention while defining escalation and acknowledging the limits of delivery evidence).

**Rendering and delivery** — templates per channel and locale (the i18n resource-layer disciplines — notification strings are the most-forgotten localization surface), channel adapters behind ports (the hexagonal seam: providers get swapped — the email-deliverability world, push services with their token-lifecycle churn, SMS with its per-country carrier physics and costs), each with the reliability kit: bounded provider retries with idempotency keys where supported, circuit breakers per provider, failover providers for the critical tier (warm, per the email-reputation warmup truths), and **dedup at the delivery edge** (the event-ID-keyed inbox-table discipline — because retrying pipeline stages can produce duplicate attempts, and "we retried the batch and re-pushed everyone" is this system's signature incident).

## The feedback loop: notifications are a trust budget

The operational half that separates platforms from pipelines: **delivery and engagement telemetry as first-class data** (per-channel delivery rates, open/click/dismiss rates *per notification type* — the funnel instrumentation that reveals the truth every product team eventually faces: some notification types may have low observed engagement, and ignored notifications are trust withdrawals — the alert-fatigue physics from on-call practice, applied to your users), **the engagement-driven governance** that follows (types with collapsing engagement get demoted to digests or retired — the deletion-as-celebrated-activity discipline; new types launch through a review gate that asks "does this earn interruption?", because every team wants to notify and the aggregate is spam), **frequency capping** as a platform guarantee (the per-user rate limit across all types — the fairness partition protecting the commons from any one team's enthusiasm), and **suppression hygiene shared across the estate** (bounces, unsubscribes, and dead push tokens honored centrally, per the email-suppression sacredness — the fastest way to damage deliverability estate-wide is one service that didn't check).

The operational rim mirrors every pipeline in this series: end-to-end latency SLOs per priority tier (the security alert's seconds versus the digest's hours — with burn-rate alerting on the critical lane), absence monitoring (the digest job that silently stopped is the batch-tier failure mode — dead-man's-switch it), per-provider cost dashboards (SMS spend is a line item that surprises — the FinOps unit economics, per notification type), and the load shape acknowledged in capacity planning (notifications are *bursty by construction* — the marketing send, the incident alerting everyone, the celebrity post — and the queue-and-throttle architecture absorbs what the synchronous version would have inflicted on providers and users alike, per the variance-tax math).

The closing calibration: notifications sit at the intersection of distributed reliability and human attention, and both halves are budgeted — stronger delivery objectives require engineering; the interruptions cost trust. Build the platform once (intents in, policy centralized, channels behind ports, dedup at the edge, telemetry closing the loop), govern the types like the shared resource they are, and the system earns the outcome that matters: users who *don't* turn everything off — which, in notification engineering, is what winning looks like.

## An intent needs identity, purpose, and expiry

A notification intent should identify the business event, recipient, notification type, event time, and relevant resource. Give it an explicit expiry or usefulness window where appropriate. A message about an order that has already been cancelled may be technically deliverable but misleading. A digest can omit stale entries; a security event may need a different retention and escalation policy.

Distinguish the business event from the notification instance and the channel attempt. One order-shipped event can legitimately notify two authorized recipients, and one recipient may have both an in-app record and an email. A deduplication key containing only the event ID could suppress a legitimate second recipient; one containing a newly generated attempt ID would fail to suppress retries. Define identity from the intended uniqueness rule.

Persist the decision evidence without copying unnecessary sensitive payloads. Record which policy version selected or suppressed a channel, which preference state was used, and whether the resource was still relevant. Render from appropriately authorized data, because the recipient's access may have changed since the original event. A queued export-ready notice must not reveal an artifact after the recipient loses access to it.

## A hypothetical attention-budget example

Consider 40 fictional activity events for one user during a ten-minute window. An immediate-send policy creates 40 notifications. A five-minute aggregation policy produces two digests if events occupy both windows. A daily digest policy creates one notification for that day's included events. The chart compares 40, two, and one sends under these explicit assumptions.

This is an illustration of message count, not proof that a digest improves engagement or that every event can be delayed. An urgent account-security change should not be folded into an ordinary activity digest solely to reduce volume. The aggregation key, window boundary, event eligibility, and maximum delay need a product decision. Count the events represented in each digest so a reader can inspect what was combined.

Cost and attention also differ by channel. One email can contain several updates; a push notification may truncate the same content; an in-app record can remain available without interrupting someone. Test the actual experience and user controls. A lower send count can still produce worse outcomes if it hides a time-sensitive action or makes the summary impossible to navigate.

## Preference changes race with queued work

Preferences are not static configuration. A user may unsubscribe after an intent is queued but before it is delivered. Decide which categories require checking current eligibility at send time and which policy changes invalidate already rendered messages. For optional notifications, a late preference check often prevents a stale queue from ignoring a recent choice. Preserve the reason for suppression so support can explain the result.

Quiet hours require a named time zone and a rule for changes. A scheduled send can cross a daylight-saving transition, and a user may update their time zone while the item waits. Recompute eligibility using the documented policy rather than treating an offset captured months earlier as a permanent location. Avoid inferring a user's schedule solely from an IP address.

Classification is a product and legal policy input, not a label an engineer can assign to bypass preferences. Separate essential account functions from optional promotional content, and have the responsible team define the applicable consent and opt-out rules. The architecture should enforce the agreed policy and preserve evidence; this guide does not determine jurisdiction-specific obligations.

## A delivery-state-machine lab

Build a local worker over synthetic intents with a fake provider adapter. Model pending, suppressed, ready, attempting, accepted, failed, and expired outcomes. Provider acceptance is a distinct stage from device receipt or human reading. A push service may retain an item until its time to live expires, and a device can be offline or have notifications disabled.

Inject failures at three boundaries: before the provider call, after provider acceptance but before the worker records it, and after recording acceptance but before acknowledging the queue item. The second boundary is the difficult one. A local deduplication row alone cannot atomically commit an independent provider's send. Use provider idempotency where supported and describe the residual ambiguity where it is not.

Replay the same intent twice and verify that the business uniqueness rule holds. Then issue two legitimate intents for different recipients and verify neither is suppressed accidentally. Change a preference while an item is delayed, expire another item, and remove the recipient's resource permission before rendering. Check that the resulting state and explanation match the policy.

Test webhook events out of order and more than once. A late “accepted” event should not erase evidence of a later permanent failure without a defined reconciliation rule. Keep provider identifiers and event timestamps while minimizing personal information in logs. A support view should reconstruct the timeline without requiring access to the private content of every message.

## Design escalation with uncertainty in mind

An unread indicator is usually a signal from a particular client or tracking mechanism, not proof that the person did not see a message. Escalating automatically from push to SMS because no read event appeared can create duplicates and cost without improving awareness. Define escalation triggers using the available evidence and the consequence of missed or repeated delivery.

For a critical notification, decide whether a human acknowledgement is required and what happens when it does not arrive. That is a different contract from “attempt an email.” The escalation system should have bounded retries, an overall deadline, and an operator-visible terminal state. A circuit breaker protects a failing provider; it does not guarantee delivery through a second provider that shares the same destination problem.

Measure intent-to-decision, queue age, attempt latency, provider acceptance, expiry, and suppression by reason. Separate expected suppression from operational failure. A notification service that honors opt-outs should not appear less reliable merely because it correctly sends fewer messages. Conversely, accepting every intent into a queue is not success when most expire before the first attempt.

Finally, rehearse a burst with reserved capacity for essential traffic and a bounded backlog for optional traffic. Protect the database and providers with admission controls. Publish the policy table and the state definitions alongside the dashboard so product, support, and engineering can interpret the same numbers. Reliability here means delivering the right message under an honest contract while respecting the recipient's choices.

## Further reading and source boundaries

- [IETF: Web Push protocol and time to live](https://www.rfc-editor.org/rfc/rfc8030.html)
- [Microservices.io: transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [Stripe: idempotent request semantics](https://docs.stripe.com/api/idempotent_requests)
- [Firebase: message lifespan](https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-lifespan)
