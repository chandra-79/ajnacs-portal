---
title: "Organizational debt: revisit the process and preserve the safeguard"
description: "Trace a request, distinguish control obligations from accidental waiting, and rehearse a clearer decision path."
date: 2029-06-18
tags: ["Engineering Leadership"]
format: article
derived: true
---

Technical debt has been given a vocabulary, tooling, and a legitimate place in engineering planning conversations. The analogy to financial debt — borrowed time that accrues interest in the form of maintenance cost and decreased velocity — is useful and widely understood. Teams backlog technical debt. They dedicate sprint capacity to it. They write ADRs explaining the trade-offs.

Organizational debt is less consistently recorded, although teams can name and track it explicitly. It accumulates in process decisions, reporting structures, approval workflows, and team topologies that were correct at one scale or moment in time and become increasingly costly as circumstances change. Unlike technical debt, it can become hard to notice when the navigation becomes habitual.

The four-approval decision process is a representative example. It was created in response to a specific incident — a decision made without sufficient review that had significant negative consequences. The process was correct at the time. Two years later, the organisation is larger, the team has rebuilt trust, the specific risk that prompted the process has been mitigated by better tooling, but the four-approval workflow remains. Engineers who need to make decisions spend a week collecting approvals from stakeholders who approve reflexively. The process that was designed to prevent bad decisions is preventing timely ones.

Refactoring organisations requires the same discipline as refactoring code: identifying the specific cost the current structure creates, understanding why the structure was created, determining whether the original reason still applies, and making a deliberate change with attention to side effects. This is not a comfortable conversation. Process changes affect people's roles, influence, and established patterns. The discomfort is not a reason to avoid it. It is the reason organisational debt persists until it is expensive enough to force the conversation.

## Separate the original safeguard from its current implementation

An old approval path may have been created after a serious failure. Begin by understanding what it was intended to prevent. Ask which decision requires judgment, which evidence must be retained and which checks can now be automated. A process can be cumbersome while still protecting a real obligation. The review should preserve the protection even if the sequence of people and forms changes.

Map one request from creation to completion. For each stage, record the owner, input, decision, output and waiting time. Do not assume that four approvers provide four independent checks. They may be reviewing the same information without clear responsibilities, or each may be protecting a distinct risk. The map lets the team tell the difference.

## Work through a fictional approval model

Suppose four sequential approvals each wait an average of six hours and take 15 minutes of active review. The simplified total is 24 hours waiting plus one hour active review, or 25 hours elapsed. A redesigned path uses two independent reviews in parallel, each still requiring six hours waiting and 15 minutes active review. Under the simplified assumption that both begin together, elapsed time becomes 6.25 hours, while total reviewer labor is 30 minutes.

The chart compares 25 and 6.25 elapsed hours. It does not predict a real service level. The parallel path is valid only if the reviews do not depend on each other's conclusions and the removed steps are genuinely redundant or replaced by equivalent controls. Record those assumptions and test exceptions before changing the production process.

## Run a small process rehearsal

Select an ordinary request, a request with missing evidence and a request requiring an exception. Ask someone outside the redesign group to route them using the proposed instructions. Observe where they need informal knowledge. A process that works only when its designer is present has not removed the ownership problem.

For each rehearsal, verify the control outcome as well as the completion time. Was the right person authorized to decide? Was the decision recorded? Could an incomplete request be approved accidentally? Could an urgent exception bypass all later review? These questions connect process simplification to risk management rather than treating fewer steps as an end in itself.

## Give the revised agreement a review trigger

Publish the owner, supported request types, response expectation and escalation route. Identify conditions that would require another review: a new regulatory obligation, a different workload, repeated exceptions or a changed team structure. Keep the previous rationale available so future colleagues understand why a step was removed.

Organizational debt is a metaphor for accumulated coordination cost, not a quantity with a universal interest rate. It can be visible and managed when a team names the affected decisions and records their consequences. The practical improvement is a clearer, testable agreement about how work moves through the organization, with the necessary safeguards still intact.

## Sources and further reading

- [Melvin Conway · The original design and communication thesis](https://www.melconway.com/Home/Conways_Law.html)
- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
