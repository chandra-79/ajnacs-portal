---
title: "Cloud Migration Strategy: Applying the 6 Rs Beyond the Whiteboard"
description: "Rehost, Replatform, Refactor, Repurchase, Retire, Retain — the 6 Rs framework is well-known. Less discussed is how to apply it at portfolio scale, sequence workloads correctly, and avoid the migration anti-patterns that create more work than they solve."
date: 2027-07-16
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
---

The 6 Rs migration framework (originally Gartner's 5 Rs, extended by various practitioners) is one of those concepts that's genuinely useful as a thinking tool and genuinely misapplied in practice. The misapplication: applying it to individual workloads in isolation without a portfolio-level view, which produces a backlog with no coherent sequencing and no relationship between migration effort and business outcome.

Here's how to make it work.

## The 6 Rs in practice

**Rehost (lift and shift)**: move the application as-is to cloud infrastructure. No code changes; run the same VMs in EC2 or Azure VMs instead of on-premises.

Where it's valid: applications with tight timelines (data centre exit, lease expiration), applications that are candidates for retirement in 1-2 years, or as a first move to get the workload under cloud-native management tooling before a second-wave optimization.

The common mistake: treating rehost as a permanent strategy rather than a temporary staging point. A rehost preserves many application characteristics, while total cost and benefits depend on the operating model. It can be an intermediate step or a justified longer-term choice for the workload.

**Replatform (lift, tinker, and shift)**: make minor optimizations to take advantage of cloud without changing the core architecture. Move from self-managed MySQL to RDS, from on-premises load balancers to ALB/NLB, from a file service to an alternative with equivalent required semantics; object storage may require application redesign.

Its effort-to-value ratio depends on compatibility, operating responsibilities and the selected managed services. You get managed services (reduced operational overhead, automatic failover, managed patches) with limited rework risk. The application may need limited changes for connectivity, authentication or service semantics while the infrastructure layer changes.

**Refactor (re-architect)**: change the application's architecture to take full advantage of cloud-native capabilities. Decompose a monolith into microservices, introduce event-driven patterns, adopt serverless for appropriate components.

This can require substantial effort and deliver value when the architecture constrains a justified business capability; neither cost nor value is universally highest. It's appropriate for core business applications with long lifespans where the architectural constraints are actively limiting business capability. It requires product investment, not just engineering effort.

**Repurchase (replace)**: move to a SaaS alternative. Replace a self-hosted CRM with Salesforce, a self-hosted email server with Google Workspace, a self-hosted ITSM tool with ServiceNow.

Often the right decision when the application is commodity functionality that isn't a differentiator and the self-hosted version consumes maintenance effort without competitive benefit.

**Retire**: decommission the application. More applications belong in this category than most portfolio reviews suggest.

**Retain**: keep on-premises for now. Regulatory requirements, recent capital investment, applications with on-premises dependencies that can't migrate, or applications with a defined end-of-life that doesn't justify migration effort.

## The portfolio view: why workload-by-workload decisions fail

Evaluating each application independently produces a backlog with no sequencing logic. The result: migrations start based on team availability and application complexity rather than business value, and the portfolio is partially migrated indefinitely as higher-priority initiatives compete for the same engineering capacity.

The portfolio view adds two dimensions:

**Business value**: how does this application connect to revenue, cost, or risk? An application that runs a core business process has different priority than one that generates a report used monthly by one analyst.

**Migration complexity**: how hard is this to move? An application with many on-premises dependencies, undocumented integrations, and no test coverage is harder than a stateless web application with documented APIs.

Plotting applications on a 2×2 (business value × migration complexity) creates natural priority groupings:
- High value, low complexity: migrate first — quick wins that demonstrate progress
- High value, high complexity: plan carefully, sequence after foundational migrations
- Low value, low complexity: retire or repurchase — don't spend migration effort on these
- Low value, high complexity: strong retire/retain candidates; rarely worth the migration investment

## Wave planning: sequencing that creates optionality

Migrations succeed when they're organised into waves that build on each other. The foundational wave is not the most visible applications — it's the shared infrastructure that everything else depends on:

**Wave 0 (foundation)**: cloud network design (VPC/VNet structure, connectivity back to on-premises), identity and directory services federation (SSO, Active Directory replication), security baselines (GuardDuty/Defender, centralised logging, Config/Policy), and landing zone deployment.

Teams that skip Wave 0 and start migrating workloads directly spend months retrofitting security and networking controls onto applications that were migrated without them.

**Wave 1 (proof of value)**: 3-5 applications chosen to demonstrate the migration process end-to-end. These should be relatively low-risk (dev/test environments, internal tools) but representative enough to validate the approach for more critical workloads.

**Wave 2+ (scaling)**: the portfolio of production workloads, sequenced by business value and dependency. Applications with shared dependencies migrate together or in dependency order.

## The anti-patterns that create more work

**Migrating without a target architecture**: "move it to the cloud" without a clear target state produces a series of ad-hoc decisions that create technical debt in the new environment. The target architecture doesn't need to be detailed for every application, but the pattern for each major application type (web application, batch job, data pipeline, messaging system) should be defined before migration starts.

**Migrating test and production separately**: migrating the test environment and validating the migration approach, then migrating production using a different approach (because the test migration "taught us a better way"), produces unnecessary rework. Define the migration runbook on non-critical workloads; apply it to production.

**Rehosting applications that should be retired**: an application with 3 users and a clear sunset date doesn't need a cloud migration. The migration effort, plus the ongoing cloud costs, plus eventual decommissioning, is more total effort than just retiring it now. Be honest in the portfolio review about what should be retired.

**Treating cloud migration and application modernisation as the same project**: these are different work with different timelines. Combining a refactor with migration can compound uncertainty and change the recovery path; no universal risk multiplier is established. Replatform first, stabilise in the cloud, then refactor with the improved operational capabilities available.

*Working through a cloud migration strategy or portfolio assessment? [Happy to compare approaches and sequencing decisions.](/contact)*

## Use the Rs as decisions, not a sequence every application must follow

Migration taxonomies vary. AWS's current large-migration guidance uses seven Rs, adding relocate to the six categories discussed here. The useful work is not memorizing a count; it is recording the intended change, the business reason and the evidence required to approve it. An application can also use different strategies for different components, such as retaining a database temporarily while replacing a reporting interface.

A rehost can be a durable choice when the workload's remaining life, risk or requirements justify it. Refactoring is not automatically the highest-value choice, and replatforming is not guaranteed to preserve every line of application code. A file system and object storage have different semantics, for example, so replacing one with the other may require material redesign. Evaluate actual compatibility rather than assigning a favorable label to the move.

## Build a portfolio with dependencies and decision confidence

For each workload, record its owner, users, business events, data stores, upstream and downstream dependencies, support state, recovery requirements and proposed strategy. Add a confidence field identifying which facts have been observed and which are assumptions. A low-traffic application can still be essential for a quarterly or annual process; a short observation window is weak evidence for retirement.

Consider a hypothetical portfolio of 30 applications. Initial review proposes eight rehosts, seven replatforms, five refactors, four replacements, three retirements and three retained applications. These categories total thirty and are mutually exclusive for the initial portfolio view. They are planning choices, not a benchmark for how a real organization should distribute its estate. Component-level plans can later be more detailed.

Suppose the first wave contains four rehosts and two replatforms. Estimated hands-on work is twelve days for each rehost and twenty for each replatform, giving 4 × 12 + 2 × 20 = 88 engineer-days. Add a twenty-day shared foundation and ten-day contingency to obtain 118 days of modeled effort. Calendar duration depends on staffing, dependencies and waiting; six engineers do not automatically complete it in one-sixth of the time.

The chart shows the portfolio categories, while the wave calculation demonstrates a separate effort model. Keep those two denominators distinct. A wave with fewer applications may consume more effort if its data or dependency changes are harder.

## Sequence by a tested dependency boundary

Choose a representative, bounded workload for the pilot. A trivial isolated application can prove account creation while teaching little about the shared database or identity path that dominates later risk. Include enough complexity to exercise the intended migration pattern without exposing the most critical business process first.

Map connections across the source and target boundary. Record latency sensitivity, authentication, allowed network paths, data transfer and failure behavior. A migrated application that repeatedly calls a retained database may have a different latency and availability profile from the final target architecture. Measure that intermediate state instead of assuming it is harmless because it is temporary.

For a lab, replay synthetic business transactions through the hybrid arrangement. Include a slow dependency, a duplicate request and a temporary loss of connectivity. Verify correctness, bounded retries and completion deadlines. Retain transaction identifiers so missing work can be reconciled after cutover.

## Plan the write transition and exit evidence

A cutover plan must identify which system owns writes at each point. If both old and new systems accept updates, define conflict handling or prevent concurrent ownership. A traffic rollback is not necessarily a data rollback. Mark the point where reversing routing would require reconciliation rather than simply returning to the old endpoint.

Exercise an early abort before new writes and a later failure after the target has accepted work. Record recovery duration, accepted and committed records, duplicate handling and manual decisions. Do not promise zero data loss without evidence for the chosen consistency and recovery mechanism.

Retirement also requires a plan. Verify users and dependencies, preserve required records, revoke identities, remove scheduled jobs and update monitoring and billing. A low CPU reading is not enough to authorize decommissioning. Obtain the accountable owner's decision and retain the evidence supporting it.

## Separate investment outcomes from movement milestones

Report relocation, operational readiness and modernization outcomes separately. A workload being reachable in the cloud proves a limited milestone. The receiving team still needs access, restore procedures, observability and a supported deployment path. A modernization investment should be measured against the capability it purchases, such as a lower cost per completed order or a shorter safe deployment process.

Review the strategy when new evidence changes the constraints. A pilot may reveal an incompatible extension, a hidden integration or an uneconomic data-transfer pattern. Updating the decision is better than forcing the workload through its original category to preserve a dashboard target. Keep the earlier assumption and the observed reason for the change so later waves benefit from the evidence.

One useful final check is the decommission boundary. A migration that leaves duplicate databases, unused links and broad temporary identities running indefinitely has not completed its operating transition. List the resources to remove, the evidence that permits removal and the owner authorized to act. Keep retention and rollback requirements explicit so cleanup does not erase needed records. Reconcile the final inventory and cost model after the agreed stabilization period, documenting deliberate residual dependencies instead of hiding them as unfinished housekeeping.

| Observation | Value (applications) |
| --- | ---: |
| Rehost | 8 |
| Replatform | 7 |
| Refactor | 5 |
| Replace | 4 |
| Retire | 3 |
| Retain | 3 |

**Figure method.** Synthetic initial portfolio: 8+7+5+4+3+3=30. Separate first-wave effort=4×12+2×20+20 foundation+10 contingency=118 engineer-days. Neither mix nor effort is a benchmark.

## Further reading

- [AWS migration strategies](https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html)
- [AWS architectural review](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Azure landing-zone planning](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
