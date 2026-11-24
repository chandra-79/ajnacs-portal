---
title: "Why AI Pilots Succeed and Never Ship: The Production Gap"
description: "A promising pilot needs evidence about production data, ownership, permissions, and fallback behavior before it can become a service."
date: 2028-04-03
tags: ["Enterprise AI", "Engineering Leadership"]
format: article
---

The AI pilot succeeds. The demo is impressive. The stakeholders are excited. Leadership approves the next phase. And then, somewhere between "approved" and "deployed," the project stalls. Six months later, the pilot is still the pilot.

This failure mode is worth testing for explicitly rather than treating a successful demo as a release decision.

## Why pilots succeed but do not ship

**Pilot data is not production data.** The pilot was built on a curated dataset that the team controlled. Production data is messier, more diverse, and includes the edge cases nobody thought to include in the pilot. The model that performed well in the demo encounters inputs it was never tested on, and quality drops.

**Latency is fine for demos, not for workflows.** A two-second response time is acceptable when you are showing something impressive. It is not acceptable when it is embedded in a workflow that previously took a half-second. Performance requirements that were not specified in the pilot phase become blockers in the production phase.

**Nobody owns it after the pilot.** Pilots often have a dedicated team with a clear mandate. Production ownership requires monitoring, incident response, evaluation and a maintained update or retirement process. Retraining pipelines are needed only when the chosen design includes model training; a hosted-model workflow still needs dependency and configuration change controls. That ownership needs to be established before the service is released.

**Compliance and security review.** In regulated industries, an AI system touching customer data or influencing business decisions may require specialist review with a scope and duration determined by the use case. If this review starts after the pilot succeeds, it delays production by the full review duration. If it starts before the pilot, it focuses the design appropriately.

## The fix is earlier conversations

The questions that prevent this failure are not hard to ask. They need to be asked before the pilot starts:

- Who owns this system in production, by name?
- What is the monitoring plan — what do we alert on, and who responds?
- What is the graceful degradation behavior when the application detects unsupported or invalid output?
- What is the compliance and security review process, and when does it start?
- What production data will be used, and does it match the pilot data distribution?

If these questions cannot be answered before the pilot, the pilot is research. It should be scoped and funded accordingly. Research that produces learning is valuable. Research that is called a product development activity and then fails to ship is expensive and demoralizing.

Call the thing what it is. Then build the right thing.

## Make the next milestone a production uncertainty

A hypothetical purchase-order assistant has passed a demonstration using 30 clean documents. Its next milestone should not be another polished demonstration. It should test whether the same workflow can handle the document types, permissions, and review decisions that the actual team encounters. Identify the assumption most likely to prevent a safe release, then design a bounded experiment around it.

Suppose the team creates a 100-document rehearsal: 60 ordinary orders, 20 scans, and 20 documents with missing or contradictory fields. The assistant produces a reviewable draft for 54 ordinary orders, 12 scans, and eight incomplete documents. The chart shows 90%, 60%, and 40% completion within those slices. The overall 74% result is less useful than knowing which input classes need a different route. These are synthetic numbers, not a claim about document-model performance.

## Define the supported path and the fallback together

The first release might support ordinary digital orders while sending scans and incomplete documents through the established manual path. That can be a useful product if the interface makes the scope clear and the manual handoff preserves the work. A broad promise followed by silent failure is harder to operate than a narrow promise with an explicit limitation.

Measure the effort of both paths. A fallback that requires the user to re-upload the document, repeat metadata, and explain the failure can erase the benefit of successful drafts. Retain the document reference and the failed validation result so that the reviewer can continue without reconstructing the task.

## Write a service acceptance record

The record should identify the owner, eligible input classes, permissions, expected response time, review requirement, quality evidence, and rollback procedure. Include the operational cost of source updates and model changes. If no team can accept those responsibilities, the project still has an ownership problem even if the model score is excellent.

Rehearse a source outage and an access revocation. Confirm that cached content does not bypass a changed permission and that a timeout does not appear as a completed decision. Test the notification received by the responsible operator. A runbook that only the original developer can interpret is not a complete handoff.

For the worksheet, list each remaining production uncertainty, the evidence needed, the smallest test, the decision owner, and the stop condition. Close the pilot when the evidence supports a defined release, a narrower scope, or a decision not to proceed. Research can be valuable without becoming a service. The avoidable failure is continuing to call an unresolved experiment production-ready because the original demonstration looked convincing.

## Sources and further study

- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
