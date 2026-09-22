---
title: "The Strangler Fig in Practice: Incremental Legacy Replacement That Actually Finishes"
description: "Everyone cites the strangler pattern; few finish a strangulation. The facade and routing mechanics, the data-migration sequencing that makes or breaks it, the organizational funding model, and the anti-patterns that leave estates half-strangled forever."
date: 2025-03-11
tags: ["Legacy Modernization", "Architecture", "Distributed Systems", "Engineering Practice", "Technical Debt"]
format: article
---

The strangler fig pattern — grow the new system around the old, route traffic incrementally, retire the legacy when nothing calls it — has won the argument against the big-bang rewrite so thoroughly that citing it is now table stakes in every modernization deck. What the decks omit is the base rate: most strangulations stall. The industry is full of estates running *both* systems indefinitely — the legacy not retired, the new system not complete, integration complexity doubled, the worst of both worlds achieved and institutionalized. The pattern works; it's the practice that fails, and it fails in knowable places.

## The mechanics: facade, routing, and the seam catalog

The load-bearing component is the **facade** — the interception layer (API gateway, reverse proxy, or an explicit anti-corruption layer) through which *all* consumers reach the capability being replaced. Its jobs: route each request to legacy or new by rule (per endpoint, per tenant, per percentage — the progressive-delivery machinery applied to migration), translate between old and new contracts so consumers never care which side answered, and *measure* — per-route traffic, error deltas, latency comparisons between the systems. No facade, no strangulation: if consumers call the legacy directly through a dozen undocumented paths (the ODBC connection from finance, the file drop, the shared database read — the integration archaeology from migration practice), step zero is herding every path through the interception point, and it's often a project of its own. Budget it honestly; it's also where half the discovery value lives.

Increment selection is the next craft: strangle along **business capability seams, not technical layers** ("customer address management," not "the DAO tier"), choosing early increments for *decoupling feasibility* (bounded data, few callers) and *learning value*, not executive visibility. Each increment should reach *full* retirement — traffic at 100%, legacy code path deleted, data ownership transferred — before declaring victory, because a fleet of 80%-migrated capabilities is precisely the both-systems-forever trap.

## Data is the boss fight (again)

Routing requests is easy; the schism is the data. While a capability straddles systems, its state needs a coherence strategy, and the options are the familiar distributed-data toolkit applied with migration-specific sequencing: **legacy-owns, new-reads** (the new system reads via CDC-fed projections or APIs while writes stay legacy — the safe starting posture, and CDC's killer use case: the legacy publishes changes without being modified); then **dual-write windows** managed with the same care as any expand/contract migration (idempotent writes, drift detection via reconciliation jobs — the discipline that catches the divergence *before* the cutover instead of after); then **ownership transfer** per data domain — the moment the new system becomes the writer and the legacy becomes the reader (or is severed) — which is the *real* migration milestone, the one worth ceremony. The strangler estates that stall almost always stalled here: traffic moved, data ownership didn't, and now every schema decision requires two teams and a treaty. Sequence data ownership transfer *into* each increment's definition of done, not into a mythical "phase 3."

Throughout: the reconciliation loop (compare, alarm, repair) runs continuously between the systems — treating divergence as a monitored SLO rather than an assumed impossibility — and shadow traffic (mirror to the new system, compare answers, serve from legacy) is the strangler's best verification tool, converting "we think the new implementation matches" into measured agreement rates before a single user depends on it.

## The organizational mechanics decide the outcome

The pattern's failure modes are mostly funding and incentive failures wearing technical costumes:

**The strangulation must be funded as a *program with an end state*, not a tax on feature teams.** "Migrate as you touch" (opportunistic-only strangulation) asymptotes at the 60% of the system that features regularly touch — the untouched 40% remains legacy forever, and it's disproportionately the risky, undocumented part. Working models pair opportunistic migration (touch it, move it) with a funded backbone team driving the increments features won't reach, tracked against a public burn-down of capabilities-remaining.

**The legacy freeze must be real.** Every feature added to the legacy during migration widens the gap the new system must close — the classic race condition where the target moves faster than the migration. The governance that works: new capabilities land in the new system *by default*, legacy changes require exception review, and the exception list is visible enough to embarrass.

**Retirement is a deliverable with an owner.** Decommissioning — the license terminated, the servers gone, the data archived per retention policy, the integrations formally cut over — is unglamorous work that no one volunteers for, and its absence is why "migrated" systems keep costing money for years. Put retirement line-items in the plan with dates and names; celebrate deletions with the same energy as launches (the cultural signal that finishing matters).

**And measure the honest metric:** percentage of *traffic* served by the new system, percentage of *data domains* owned by it, and *legacy run-cost trending to zero* — not "services built," which measures construction rather than strangulation. A dashboard where legacy cost hasn't moved in three quarters is a program review, not a status update.

## When the strangler is wrong

Completeness demands the counter-cases: **small systems** (a bounded system rewritable in a quarter doesn't need a two-year incremental scaffold — the pattern's overhead only pays above a size threshold); **doomed capabilities** (don't strangle what should be retired outright or bought — the build-vs-buy question precedes the migration question); and **the un-seamable monolith** (systems whose internals resist capability boundaries — shared mutable state everywhere — sometimes need an internal decoupling investment *first*, or an honest acceptance that replacement will be chunkier than the pattern's ideal). The pattern is a strategy for *managing risk over a long replacement*, and where the replacement isn't long or the risk isn't high, simpler plans win.

The strangler fig's real lesson was never the routing trick — it's that **legacy replacement is a delivery program with all the disciplines that implies**: incremental value, measured progress, funded completion, and an explicit definition of done that includes the funeral. Estates that adopt the pattern's diagram without those disciplines get the pattern's namesake outcome in the wrong direction — two systems, intertwined, both alive, forever. Estates that adopt the disciplines finish — and finishing, in legacy modernization, is the entire point.
