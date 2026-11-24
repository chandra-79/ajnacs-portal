---
title: "Microservices vs Monolith: Making the Decision That's Actually Right for Your Team"
description: "The microservices-vs-monolith debate has been settled in conference talks for years. On the ground, the right answer still depends on context that most frameworks ignore."
date: 2027-01-27
tags: ["Cloud Architecture", "Distributed Systems", "Software Engineering", "Programming"]
format: article
---

The microservices debate has been declared over several times. First microservices won (2015–2018). Then the monolith resurgence (the "modular monolith" discourse of 2019–2022). Then the nuanced middle ground that everyone says they've always believed.

The practical reality: the architecture decision is still context-dependent, and the factors that actually matter are rarely covered by the framework papers or the hot take threads.

Here's what I look at when this decision comes up.

## Start With the Team, Not the System

The most reliable predictor of microservices success isn't the technical characteristics of the system — it's the organizational characteristics of the team.

Microservices distribute deployment, operational ownership, and on-call responsibility across teams. This works well when:
- Teams are independently deploying multiple times per week
- Ownership of a service is clear and stable
- Each team has the operational capability to run what they deploy
- Communication overhead between teams is lower than the benefit of independence

It works poorly when:
- You have a small team (under 10 engineers) where coordination overhead costs more than independence gains
- Ownership is unclear or shared across teams
- The operational burden of running many services is concentrated in one platform team
- Cross-service changes are frequent and require coordinated deployments

The second condition — cross-service changes requiring coordinated deployments — is the clearest signal of a distributed monolith. If you're deploying service A, B, and C together because a change to A requires simultaneous changes to B and C, you have the operational cost of microservices without the benefit.

## The Modular Monolith Is Often the Right Middle Ground

A well-structured monolith with clear module boundaries is not a compromise position. For many organizations and workloads, it's the correct architecture:

- Single deployment unit reduces operational complexity dramatically
- Module boundaries enforce separation of concerns without network boundaries
- Refactoring across modules is a code change, not a service migration
- Local function calls vs. network calls means no distributed systems failure modes

The failure mode of monoliths is architectural decay: module boundaries erode, coupling accumulates, and the system becomes genuinely hard to change. This is a discipline problem, not an architectural inevitability. A monolith with enforced module boundaries (via build system rules, package-level visibility constraints, or architectural fitness functions) can maintain separation without the operational overhead of services.

When to extract a service from a monolith: when a component has genuinely different scaling requirements, different deployment cadences, different team ownership, or different runtime requirements than the rest of the system. Not because the module is large, not because it would be "cleaner" as a service.

## The Distributed Systems Tax

Every service boundary introduces distributed systems complexity that didn't exist before:
- Network calls that can fail, timeout, or return partial results
- Consistency challenges across service boundaries
- Distributed tracing requirement to diagnose multi-service failures
- Service discovery, load balancing, and health checking
- Independent deployability requirements (backward-compatible API changes)

This complexity is a real cost. It's worth paying when the independence benefit exceeds it. It's not worth paying for clean architecture reasons alone.

The teams A possible failure pattern is suffer most from microservices are those that decomposed early, before they had traffic to justify the operational complexity, and before they understood their domain well enough to draw service boundaries that didn't cut across natural seams.

## When Microservices Are Clearly Right

- **Fundamentally different scaling requirements**: a document rendering service that needs to scale to 100x during batch periods, independent of the rest of the system
- **Different technology requirements**: a compute-intensive ML inference service needs GPU compute, while the rest of the system runs on standard compute — separate deployment makes sense
- **Different deployment cadences and team ownership**: a payment processing service with its own security review, compliance requirements, and on-call team
- **Autonomous team velocity as a primary requirement**: at genuinely large scale (hundreds of engineers), the coordination overhead of a shared codebase becomes a real constraint on shipping speed

The common thread is specificity. "Microservices because modern architecture" is not a reason. "Microservices because this specific component has these specific characteristics that make independence valuable" is.

## The Migration Direction

One practical note: starting with a modular monolith and extracting services when the need becomes clear is significantly easier than building microservices that you later need to consolidate.

Extraction is surgical — you identify the service boundary, extract the code, add the network boundary, migrate consumers. Consolidation is messy — you're unwinding distributed systems assumptions, reconciling data models, and merging deployment pipelines.

If you're making this decision for a new system: default to a well-structured monolith. Extract services when you can articulate a specific reason that justifies the operational cost. The system will be easier to build, easier to operate, and easier to evolve.

*Working through a microservices architecture decision or a monolith migration? [Compare the design and operating trade-offs.](/contact)*

## Make the operating contract explicit

A service boundary is useful when it gives a team a coherent responsibility that can change and operate with manageable coordination. A codebase split across repositories does not create that independence if every release still requires synchronized database changes and deployment. Begin with the business capability, data ownership and failure boundary, then decide whether a process boundary improves the situation.

Distributed calls add failure modes that local calls do not have. A request can time out after the remote side has committed a change. Two services can disagree about the current state. A deployment can leave incompatible versions running together. A design therefore needs deadlines, idempotency, compatibility and recovery behavior. These are engineering costs, not an argument that every system should remain a single process.

A modular monolith can be a deliberate intermediate architecture. Separate modules and ownership inside one deployable unit, prevent uncontrolled cross-module data access and observe where change coordination actually becomes expensive. Extract a service when the operational or organizational gain is identifiable. Keep the ability to reverse an unsuccessful extraction by limiting the new service's scope and documenting how data and calls would be reintegrated.

## Use an extraction experiment to test the boundary

Choose a capability with a clear owner and a small enough interface to reverse. Record the changes that currently force coordination with other modules or teams. After extraction, measure whether those changes can actually be released independently. If every release still requires a shared database migration and synchronized deployment, the process boundary may have added network failure modes without delivering the intended autonomy.

Keep a ledger of remote interactions introduced by the extraction. For each call, record timeout, retry, authentication, authorization and compatibility behavior. For each event, record ordering, duplication and recovery assumptions. A synchronous request that becomes an asynchronous workflow may improve availability while changing the user's completion semantics. Describe that product change explicitly rather than treating it as an implementation detail.

Test the data transition with a bounded cohort. During migration, two components may temporarily need to read or write the same business fact. Decide which is authoritative and how divergence is detected. Avoid permanent dual writes without a reconciliation strategy. A successful happy-path test does not prove that the two copies remain consistent when one update fails.

The decision record should include the cost of keeping the new service: its deployment pipeline, telemetry, on-call route, dependency upgrades and recovery procedure. Compare those costs with the coordination or scaling problem the extraction was intended to solve. The result can support further extraction, a narrower service boundary or reintegration. Each is a valid engineering outcome when it follows the observed behavior.

Keep the extraction hypothesis explicit: identify the specific coordination, scaling or failure-isolation improvement that would justify maintaining the new service.

Recheck the chosen boundary after the pilot exposes actual deployment and recovery dependencies.

## Work through an illustrative scenario

A hypothetical checkout request makes four sequential remote calls. Their budget allocations are 40, 60, 80 and 20 milliseconds, totaling 200 milliseconds before other work. These are configured allowances, not independently measured p95 values. Adding the four allowances is valid for this sequential budget; adding four p95 measurements would not establish the checkout p95. The chart helps the team discuss where the request budget is spent before extracting another service.

| Observation | Value (milliseconds) |
| --- | ---: |
| Inventory allowance | 40 |
| Pricing allowance | 60 |
| Payment allowance | 80 |
| Order-write allowance | 20 |

**Calculation and limits.** Synthetic sequential timeout allocation totaling 200 milliseconds. Values are design allowances, not latency percentiles or benchmark observations. Network overhead and local work need their own budget, and parallel branches use critical-path analysis.

## Build the evidence worksheet

**Business boundary.** Name the capability, owner and data whose changes the service controls.

**Coordination cost.** Record which releases currently require another team and whether a service boundary would reduce that dependency.

**Call contract.** Specify deadline, idempotency and error behavior for each remote operation.

**Data ownership.** State which service writes each business fact and how other services obtain a consistent enough view.

**Compatibility window.** Support the intended overlap of old and new clients during rollout and rollback.

**Operational ownership.** Confirm who monitors, supports, restores and pays for the independently deployed service.

## Rehearse the failure boundary

1. **Time out after a write.** Verify the caller can discover the outcome or retry without duplicating the business effect.

2. **Deploy versions out of order.** Check the contract across the supported compatibility window.

3. **Lose one dependency.** Measure which business capabilities remain available and which fail explicitly.

4. **Reverse the extraction.** Sketch the data and routing steps needed to reintegrate the capability if its operating cost exceeds the benefit.

## Sources for the mechanisms

- [Google SRE handling overload](https://sre.google/sre-book/handling-overload/)
- [AWS architectural trade-offs](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
