---
title: "The Well-Architected Review: How to Run One That Actually Produces Improvements"
description: "AWS Well-Architected Reviews, Azure Architecture Reviews, and Google's architecture review frameworks all use the same pattern. Here's how to run a review that produces actionable findings rather than a list of best practices you already knew."
date: 2026-12-21
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
---

The AWS Well-Architected Framework is one of the most referenced documents in cloud architecture. Most teams have read it. Far fewer have run an actual Well-Architected Review — a structured review of a specific workload against the framework's pillars — and used it to drive concrete improvements.

A review that produces a generic list of best practices you already knew isn't useful. A review that surfaces specific gaps in a specific workload, ranked by risk, with concrete remediation plans — that's the version worth running.

## What a Well-Architected Review is

The AWS Well-Architected Framework organises architectural best practices across six pillars:
- **Operational Excellence**: how you run and monitor systems to deliver business value
- **Security**: how you protect information, systems, and assets
- **Reliability**: how a system recovers from failures and meets demands
- **Performance Efficiency**: how you use computing resources efficiently
- **Cost Optimisation**: how you avoid unnecessary costs
- **Sustainability**: how you minimise environmental impact

A Well-Architected Review is a structured interview and assessment against these pillars for a specific workload. AWS provides the Well-Architected Tool (a service in the console) that guides you through hundreds of questions across all six pillars and generates a report of findings with improvement recommendations.

Azure has the Azure Well-Architected Framework with similar pillars and an Azure Advisor that provides some automated assessment. GCP has the Architecture Framework. The concepts are consistent across providers; the specific tooling differs.

## Making it workload-specific, not generic

The most common mistake: trying to review everything at once, or treating the review as a general assessment of the organization's cloud maturity.

The right scope: one workload (a set of related resources that work together to deliver a business capability — a specific application, a data platform, a ML training pipeline). The questions become concrete: "does this workload have multi-AZ redundancy for its database?" rather than "do your databases use multi-AZ?" with no specific answer.

Before the review, define the workload precisely:
- What is the workload's business function?
- What are its components? (List the services: EC2 instances, RDS, ElastiCache, S3 buckets, Lambda functions, etc.)
- What are its SLOs? What would it mean for this workload to fail?
- Who owns it? Who needs to be in the review?

## Running the review

The AWS Well-Architected Tool walks through ~200 questions across the six pillars. Not all pillars are equally relevant to all workloads. A batch processing data pipeline has different reliability and performance concerns than a customer-facing API.

For each question, the answer is: Yes (the best practice is implemented), No (it isn't), and then optionally marking it as a risk if it's not implemented and the gap is significant.

The review should involve:
- The engineering team that owns the workload (who know the implementation)
- A representative from security or compliance (for the security pillar)
- A manager or product owner (for context on the business criticality)

90-120 minutes for the facilitated review of a medium-complexity workload. The tool generates a report at the end.

## Prioritising the findings

The report typically produces dozens of findings. Not all are equal.

Prioritisation criteria:
- **Blast radius**: what's the worst-case impact if this gap causes an incident? A single-point-of-failure in a customer-facing payment flow is higher priority than the same gap in a batch job.
- **Likelihood**: how likely is this gap to actually cause a problem? Missing backup on a rarely-changed configuration is lower likelihood than missing rate limiting on a public API endpoint.
- **Remediation cost**: how much effort is the fix? High-impact, low-effort fixes should happen immediately. High-impact, high-effort fixes need to be on the roadmap.

Score each finding and sort. The top 5-10 become the workload improvement plan.

## Common findings by pillar

**Operational Excellence**: no runbooks for the top incident types; alerts that fire without context; no post-incident review process.

**Security**: unrestricted security groups (0.0.0.0/0 ingress); IAM users with access keys instead of roles; S3 buckets with public read; no CloudTrail logging; default security group in use.

**Reliability**: single-AZ database with no replica; no auto-scaling configured; missing circuit breakers for downstream dependencies; no backup restoration tested.

**Performance Efficiency**: instance types chosen by default rather than workload requirement; no caching between application and database; N+1 query patterns.

**Cost Optimisation**: no Reserved Instances or Savings Plans for steady-state workloads; over-provisioned instances with consistently low CPU; untagged resources preventing cost attribution.

## Tracking improvements over time

A review that produces a list of findings and then sits in a document has accomplished nothing. The output needs to be a tracked set of improvements with owners and target dates.

The cadence that works:
- Annual full review per workload
- Quarterly check-in on progress against findings from the last review
- Add new findings when significant architectural changes are made

AWS Partner reviews (conducted by an APN Partner) are worth doing for critical workloads — an external perspective surfaces gaps that the owning team has normalised.

*Running a Well-Architected Review for the first time or trying to get more value from the process? [Happy to compare approaches.](/contact)*

## Make the operating contract explicit

An architecture review should produce decisions and executable follow-up work. Start with one workload and the outcomes it must deliver, then inspect evidence across reliability, security, performance, cost and operations. A framework question is a prompt to investigate; a yes answer without evidence is not a control. Ask for the deployment record, access path, recovery result or cost allocation that demonstrates the claim.

Prioritize findings by consequences and uncertainty rather than by the order of the questionnaire. A missing recovery key can matter more than several cosmetic naming issues. A poorly understood dependency can justify an experiment before a large redesign. Assign an owner who can actually change the relevant system, define the acceptance evidence and choose a review date. The goal is to improve the workload, not maximize the number of closed checklist items.

Separate the review from compliance certification. Architectural guidance can identify useful improvements without proving conformity to a legal, regulatory or contractual requirement. Conversely, satisfying a narrow compliance control does not prove the service meets its availability or recovery objectives. Keep those decisions connected but explicit so that a review is not used as evidence for a conclusion it was never designed to establish.

## Close a finding with evidence that can be repeated

Turn each selected finding into a small change with a measurable completion condition. For a recovery weakness, that might be a restoration rehearsal reaching the declared business endpoint. For an access weakness, it might be a set of allowed and denied requests using the intended roles. For a cost-allocation weakness, it might be a reconciliation between source charges, allocated charges and an explicit unallocated remainder. The evidence should match the finding's actual consequence.

Keep architecture alternatives visible. A review may identify several ways to reduce a risk, each with different cost and complexity. Record the rejected options and the reason for the chosen one. This helps a future team revisit the decision when demand, staffing or service obligations change. A recommendation without its assumptions tends to become a rule applied long after its original context disappears.

Schedule follow-up around the work rather than an arbitrary maturity score. The owner should know what to demonstrate and when. If the evidence reveals that the original recommendation was wrong, update the recommendation instead of optimizing the report to show closure. A review is useful when it improves the system's behavior, including by preventing unnecessary implementation.

Distinguish missing evidence from failed behavior. A control may work but lack a reproducible record, or it may have a polished record while failing in practice. These require different actions. The former needs a demonstration and sustainable evidence capture; the latter needs a design or implementation correction. The review should preserve that distinction so documentation work does not substitute for engineering work.

Use the same review language when reporting progress. A completed document, a deployed control and an exercised control are three different states. Naming those states accurately helps leadership understand what risk has actually changed and prevents a closed ticket from being interpreted as stronger operational evidence than it contains.

Record the reviewer, test date and remaining uncertainty alongside the decision.

## Work through an illustrative scenario

A fictional review finds fourteen issues. Three need immediate action because they threaten recovery or access boundaries, five require experiments to establish their impact, and six are routine improvements. Counting all fourteen as equally urgent would make planning less useful. The chart classifies next actions; it does not claim a numerical risk score or a standardized maturity level.

| Observation | Value (findings) |
| --- | ---: |
| Immediate remediation | 3 |
| Evidence-gathering tests | 5 |
| Routine improvement | 6 |

**Calculation and limits.** Synthetic fourteen-finding review with one agreed next-action category per finding. Priority comes from documented consequence and uncertainty. Counts are planning aids, not a certification result or quantitative risk model.

## Build the evidence worksheet

**Workload boundary.** Identify the services, data and dependencies included in the review and any excluded shared platforms.

**Business objective.** State the outcome and constraint that make the finding significant.

**Observed evidence.** Link the actual configuration, rehearsal, incident or measurement supporting the finding.

**Uncertainty.** Record what remains unknown and the smallest experiment that could resolve it.

**Accountable owner.** Assign a team with the authority and skills to implement the proposed change.

**Acceptance evidence.** Describe the observable result that will close the finding and the date it will be reviewed.

## Rehearse the failure boundary

1. **Repeat a claimed control.** Ask a colleague to reproduce the evidence without relying on the original author’s explanation.

2. **Challenge an assumption.** Recalculate the recommendation when demand, recovery or ownership assumptions change.

3. **Exercise an exception.** Confirm the accepted risk has a bounded scope, owner and review date.

4. **Revisit a closed finding.** Check that the control still operates after a later deployment or organizational change.

## Sources for the mechanisms

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [NIST secure development framework](https://csrc.nist.gov/pubs/sp/800/218/final)
