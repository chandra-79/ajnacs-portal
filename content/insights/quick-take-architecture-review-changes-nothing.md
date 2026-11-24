---
title: "Architecture Reviews: Choose Early, Verify Before Release"
description: "Separate options discussions from release-readiness evidence so reviews can change decisions and exposure."
date: 2028-03-31
tags: ["Architecture", "Engineering Leadership"]
format: article
---

The architecture review board meets. A team presents their design. The reviewers raise concerns. The team nods. The meeting ends. The design ships unchanged.

This happens constantly. Everyone knows it happens. The review board knows it happens. And yet the meeting recurs every quarter.

## Why late reviews have less room to change the design

By the time a design reaches a formal review, five things have usually happened:

1. A team has been working on the design for weeks and has strong ownership of it
2. Engineering effort may have already begun
3. The deadline is visible from where they are standing
4. The alternatives have not been costed out
5. Changing the design now would require re-scoping the project

In this context, a review body can identify problems. The cost of fixing them is now higher. The only outputs available are "proceed" or "stop." Stopping has a cost that the review body is not accountable for. So the meeting produces notes, the notes are filed, and the design proceeds.

This is not laziness. It is the rational response to the incentive structure.

## What useful architectural oversight looks like

**Earlier involvement.** The useful moment for architectural input is before the design is formed, not after. When a team is deciding which approach to take among two or three options, external perspective is genuinely useful. When the design is complete and the team is presenting it, the window for inexpensive changes is narrower.

**Design pairing, not design review.** Senior architects embedded with teams during the design phase — as collaborators rather than auditors — produce better outcomes than post-hoc review bodies. The trade-off is time investment; the benefit is that it actually works.

**Written review with response.** A written architecture review that requires the team to address each concern in writing — and explain why they agreed, disagreed, or deferred — produces more accountability than a meeting. The team cannot nod and leave. They have to engage.

**Lightweight checklists.** For most designs, the useful review is not a comprehensive evaluation but a checklist of the questions that teams most often overlook: how does this fail? how is it observed? who owns it in production? A well-designed checklist takes 30 minutes to complete honestly and surfaces the important gaps without requiring a full review board meeting.

The goal is not process. The goal is better systems. If your review process produces meetings where everyone agrees and nothing changes, the process is not achieving the goal.

## Make the review answer a specific question

A late review can still find a serious fault and should not be dismissed as theatre. The problem is asking it to choose an architecture after contracts, integrations, and staffing have made alternatives expensive. Separate the options discussion from the release-readiness review. Each needs different evidence and different authority.

For an early options discussion, bring a single user journey and two credible designs. Show where state changes, who can read it, and how an operation can fail halfway through. Ask reviewers to identify the assumption most likely to invalidate the preferred approach. A diagram is useful if it makes that assumption visible; a collection of boxes without a decision is preparation for a meeting, not an architecture review.

A hypothetical export service has ten design questions. Four concern reversible details such as an internal helper interface. Six concern harder-to-change obligations: tenant isolation, retention, data location, external contract, recovery, and ownership. The review spends its time on those six. This classification is an exercise; the four-versus-six split is not a recommended universal allocation of review time.

## Turn concerns into evidence

Suppose a reviewer asks whether a cancelled export can leave an accessible object in storage. An answer like “the worker cleans up” is incomplete. The team should demonstrate cancellation before upload, during upload, and after object publication. It should identify the authorisation check used when a link is followed, and the cleanup process after a crash. These observations give the reviewers something falsifiable.

Use a short response log with concern, accountable owner, disposition, evidence, and release implication. A concern can be resolved, accepted with a reason, or left open with an explicit decision about exposure. Do not allow “will monitor” to substitute for a metric, alert threshold, and person who can act. Equally, do not require every stylistic disagreement to block a release.

At the final review, sample the promised evidence. Verify that restore instructions work in a disposable environment and that the support owner can find the relevant telemetry. Record which assumptions remain untested and how the rollout limits their impact. The review's credibility comes from its ability to change scope or exposure when evidence fails, not from a large checklist.

After delivery, review one incident or unexpected operational constraint against the decision record. Did the design omit the question, answer it incorrectly, or fail to implement the answer? That distinction improves the next review much more than counting the number of meetings held.

## Further reading and source boundaries

- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
