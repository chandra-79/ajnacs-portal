---
title: "The Strangler Fig in Practice: Incremental Legacy Replacement That Actually Finishes"
description: "Everyone cites the strangler pattern; few finish a strangulation. The facade and routing mechanics, the data-migration sequencing that makes or breaks it, the organizational funding model, and the anti-patterns that leave estates half-strangled forever."
date: 2026-01-19
tags: ["Legacy Modernization", "Architecture", "Distributed Systems", "Engineering Practice", "Technical Debt"]
format: article
---

The strangler fig pattern — grow the new system around the old, route traffic incrementally, retire the legacy when nothing calls it — has won the argument against the big-bang rewrite so thoroughly that citing it is now table stakes in every modernization deck. What the decks omit is the base rate: most strangulations stall. The industry is full of estates running *both* systems indefinitely — the legacy not retired, the new system not complete, integration complexity doubled, the worst of both worlds achieved and institutionalized. The pattern works; it's the practice that fails, and it fails in knowable places.

## What to measure

**Traffic served by the new slice with equivalent outcomes.** If the new service handles 8,000 of 40,000 eligible requests, the migrated share is 20%. Compare correctness and tail latency with the original path under equivalent traffic, and rehearse a switchback that accounts for writes during the cutover.

*Illustrative measurement. Any numbers in this example are hypothetical.*

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

## Choose a migration slice that can be observed independently

Start with a precise behavior rather than a service name. Consider an illustrative customer-address change workflow. It receives a new address, validates it, records the effective date, updates a shipping projection, and sends a notice. The migration unit needs an owner for that behavior and a clear distinction between the source of truth and the downstream copies. A route called address might also be used to look up documents in a finance export, which would change the work substantially. Trace a small but representative sample from ingress to persisted state before drawing boundaries.

Create a seam register containing operations, entry points, owners, storage, side effects, and consumers. Include traffic that never reaches the obvious HTTP endpoint. A scheduled export may read a legacy table directly. A queue job may change an address after a delivery dispute. A support terminal may perform a privileged correction that normal customer traffic never exercises. Record where each route was observed and when. An empty access log for a working week is weak evidence about a month-end process. Confirm expected consumers with the owners of business cycles that have not occurred during monitoring.

Rank candidate slices by the cost of isolation and the usefulness of the result. A read-only address summary can prove that the facade can select a route and emit comparable outcomes. It does little to exercise write authority. A bounded write path with one durable owner might be the next slice. A single global route that changes tenant keys, addresses, invoices, and tax records in one transaction makes a poor early cut even if it carries a large share of requests. Favor a slice the team can retire after the experiment.

## Establish comparison rules before mirroring production work

Use a comparison contract that distinguishes a genuine business mismatch from representational noise. In the address example whitespace around a street label may be harmless, while an incorrect effective date can cause a delivery failure. Preserve meaningful null and empty values. Normalize timestamps to the agreed precision and only ignore fields whose differences are documented as acceptable. Settle how to compare asynchronous results and when to close the comparison window. A valid output that arrives six hours late may still fail the business contract.

Make the shadow execution side-effect-free. A shadow write must not send a customer notice, bill an account, or place a duplicate order. Use isolated data and suppress outbound work. Keep a stable operation identifier so the comparison job can associate the legacy and shadow outcomes. Store counts of matched, mismatched, delayed, and missing results instead of reporting a single agreement percentage without denominators. If comparison volumes are deliberately sampled, specify the eligible population and which classes are required to be covered. Give operators a way to inspect enough evidence to understand each mismatch while minimizing access to sensitive inputs.

Suppose 25,000 illustrative requests are eligible for comparison. The verifier finds 24,700 comparable outcomes, 20 material differences within them, and 300 missing or delayed shadow results. Agreement among comparable results is 24,680 divided by 24,700, approximately 99.92%. Fully verified agreement over all eligible requests is 24,680 divided by 25,000, or 98.72%. Neither percentage should be reported without the backlog and mismatch classes. If the missing results cluster on an older client version, a canary composed only of recent clients could miss the main defect.

## Transfer write authority one cohort at a time

Treat ownership as a time-bound decision with an enforceable boundary. While the original system owns the record, downstream services can use a projection fed by its committed changes. Verify how deletes, ordering, duplicate deliveries, and replay are handled. Compare projected state to the source at the same logical point rather than comparing today's source to yesterday's projection. If the transport can deliver an event more than once, use stable identifiers and update state idempotently. Test interruptions between application commits, relay sends, and broker acknowledgements.

Before making the new service authoritative, stop or drain the old writer for the cohort. Check the commit position and reconcile the affected records. Grant authority to the replacement and verify a new write through the real customer-facing contract. Establish how legacy readers receive subsequent changes. Keep a record of the handover epoch, the permitted writer, and the operation identifiers around it. If another path can still write the old record, route parity and successful probes cannot tell you which value will win.

Decide when switchback stops meaning a traffic change. Before the replacement accepts writes, shifting the route back may be reversible without data work. After new records or side effects exist only in the replacement, reverting the facade can hide those records or repeat those effects. A safe return might require fencing both writers, replaying the committed results, and verifying projections with both owners present. Give that process its own decision threshold and time estimate. Publish these distinctions to incident responders so an automated rollback procedure does not assume storage rollback is equally simple.

## Make retirement observable

Set a retirement condition when the slice is accepted. Confirm that facade traffic for the cohort reaches the intended owner, direct legacy usage stays at zero through the relevant business cycle, projected state agrees, and downstream consumers have signed off. For an external partner, include the date its last file was processed rather than relying on an API trace. Identify which old access, scheduled jobs, copies, and infrastructure leases can be removed. A quarter of stable application traffic does not authorize deletion of legally retained source data. Provide an archive location and prove that someone can retrieve a record using the supported procedure before removing online access.

For a worked milestone, suppose the new route serves 95% of requests but ownership has transferred for only five of ten cohorts. Report routing and ownership separately. The remaining 5% of traffic can have disproportionate operational cost if it controls high-risk records that require a separately staffed on-call rotation. Choose the next cohort for the ownership work it retires, not solely for the traffic percentage it adds. Close the original slice only after the remaining exception has a real owner, deadline, and evidence-based reason to exist.

Keep the facade's long-term disposition explicit. Some organizations retain it as a normal API boundary after migration. Others can retire it once registered consumers have moved. Both choices require monitoring, an owner, and a contract. Allowing a temporary translation layer to remain unowned simply moves the legacy maintenance problem out of the old repository.

[Azure Architecture Center guidance on the Strangler Fig pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig) and [AWS guidance on transactional outbox delivery](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)

Record which comparison failures were intentionally sampled out and which could not be evaluated. Preserving that difference helps later reviewers assess what the final agreement figure tells them.
