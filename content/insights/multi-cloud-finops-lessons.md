---
title: "FinOps Lessons from Running Multi-Cloud at Scale"
description: "Hard-won lessons from architecting multi-cloud platforms across Azure, AWS, OCI, and GCP — and the FinOps practices that actually reduce spend."
date: 2027-05-28
tags: ["FinOps", "Cloud Architecture"]
format: article
---

Cloud costs have a way of drifting higher than anyone planned — not because of bad decisions, but because the structural patterns that make shipping fast tend to quietly push cost-to-run upward. I've seen this across a few Azure, AWS, OCI, and GCP projects, including ones I was part of setting up.

These are the lessons that have actually made a difference — from my experience, not from theory. Take what's useful, ignore what doesn't fit your context.

## Lesson 1: Tag Discipline Is a FinOps Foundation

You cannot optimize what you cannot attribute. Before any cost-reduction initiative, implement a mandatory tagging policy:

- `env` — production / staging / dev / sandbox
- `team` — owning team or cost center
- `workload` — application or service name
- `criticality` — tier-1 / tier-2 / tier-3

Enforce tags at provisioning time via policy-as-code (Azure Policy, AWS SCPs, OCI Governance). Retroactive tagging is expensive and incomplete.

## Lesson 2: Reserved Capacity Is Not Savings Until You Measure Utilization

Reserved instances (RIs) and savings plans look like wins on procurement reports. They are only wins if utilization is above 75%. I've inherited environments where RIs were purchased for services that were migrated six months later — those commitments became pure waste.

**Rule:** Analyze 90 days of actual consumption before committing to any RI or savings plan. Review RI utilization quarterly.

## Lesson 3: Serverless Is Not Free

The economics of serverless (Azure Functions, AWS Lambda) work well for bursty, low-duration workloads. They become expensive fast for:

- Long-running operations (>15 minutes on Lambda)
- High-frequency, short-duration invocations with significant cold-start overhead
- Workloads with predictable, sustained throughput (containers or VMs are cheaper here)

Model cost at the architecture stage, not after deployment.

## Lesson 4: Data Transfer Costs Are the Hidden Killer

Compute discounts dominate FinOps conversations. Data egress charges are where enterprises quietly overspend. Watch for:

- **Cross-region replication** — necessary for DR, expensive if not right-sized
- **Internet egress** — LLM token volumes, video streaming, large data exports
- **AZ-to-AZ traffic** — often overlooked; keep services in the same AZ unless HA requires otherwise

On one healthcare platform, data transfer was 23% of the total cloud bill. Consolidating services within availability zones and using a CDN for static assets cut it to 9%.

## Lesson 5: FinOps Is a Discipline, Not a Project

The most sustainable cost reductions I've seen come from teams that treat FinOps as an ongoing practice:

- **Weekly cost anomaly reviews** with automated alerting (AWS Cost Anomaly Detection, Azure Cost Alerts)
- **Monthly unit economics** — cost per transaction, cost per active user, cost per API call
- **Engineering accountability** — each squad owns their cloud spend with visibility dashboards
- **Quarterly architecture reviews** to sunset over-provisioned resources and migrate to cheaper service tiers

FinOps teams that run a one-time optimization project and move on will see costs creep back to baseline within two quarters.

## The pattern that repeats

Every time I've worked through a FinOps programme properly — meaning: tagging enforced, RI coverage reviewed, data egress monitored, teams seeing their own spend — meaningful cost reduction happens within the first quarter. It's not from a single dramatic change. It's from twenty small ones that were invisible when nobody was watching.

The technical work is straightforward. The organizational change — getting engineering teams to own cost as a first-class metric rather than someone else's problem — is where most programmes either succeed or quietly stall.

---

*Building a multi-cloud strategy or FinOps program? [Let's discuss.](/contact)*
