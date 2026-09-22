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

The common mistake: treating rehost as a permanent strategy rather than a temporary staging point. A rehosted application costs more than an on-premises equivalent (no cloud-native efficiencies) and provides few cloud benefits. It's a step, not a destination.

**Replatform (lift, tinker, and shift)**: make minor optimizations to take advantage of cloud without changing the core architecture. Move from self-managed MySQL to RDS, from on-premises load balancers to ALB/NLB, from a managed file server to S3.

This is the strategy with the best effort-to-value ratio for most applications. You get managed services (reduced operational overhead, automatic failover, managed patches) with limited rework risk. The application code doesn't change; the infrastructure layer is modernised.

**Refactor (re-architect)**: change the application's architecture to take full advantage of cloud-native capabilities. Decompose a monolith into microservices, introduce event-driven patterns, adopt serverless for appropriate components.

This is the highest-effort and highest-value strategy. It's appropriate for core business applications with long lifespans where the architectural constraints are actively limiting business capability. It requires product investment, not just engineering effort.

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

**Treating cloud migration and application modernisation as the same project**: these are different work with different timelines. Attempting to refactor a monolith while migrating it to the cloud simultaneously doubles risk. Replatform first, stabilise in the cloud, then refactor with the improved operational capabilities available.

*Working through a cloud migration strategy or portfolio assessment? [Happy to compare approaches and sequencing decisions.](/contact)*
