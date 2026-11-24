---
title: "Technical writing as a testable engineering artifact"
description: "Design documents around a reader task, test the instructions, and keep operational reasoning connected to implementation changes."
date: 2029-02-14
tags: ["Engineering Leadership"]
format: article
derived: true
---

The framing of writing as a "soft skill" in engineering has produced decades of engineers who regard documentation as an obligation to be minimised and clear communication as optional. The framing is wrong and the consequences are expensive.

Writing forces precision in a way that conversation does not. You can discuss an architectural approach in a meeting and leave with everyone nodding in apparent agreement while holding genuinely different mental models of what was decided. Writing down the design forces the author to commit to specifics: which service owns which data, what happens when the external API is unavailable, how the system behaves at twice the expected traffic volume. The gaps in the reasoning become visible in the writing before they become visible in production.

Design documents, architectural decision records, runbooks, and post-mortems are not administrative overhead. They are the engineering artifacts that make collaborative systems work. A design document reviewed by three engineers before implementation catches the integration assumption nobody questioned in the verbal discussion. A runbook tested by a new on-call engineer surfaces the step that was obvious to the author and incomprehensible to someone without that context. An ADR that explains why a technology was chosen and what conditions would make the team reconsider prevents the architecture from being relitigated every six months by engineers who weren't present for the original decision.

The career leverage of clear writing is also real. An engineer who can write a clear technical proposal will have their ideas considered by stakeholders who were not in the meeting. An engineer who can write a clear post-mortem will surface systemic issues that verbal discussions in a conference room typically do not produce. Writing scales influence in ways that direct conversation does not.

Teaching writing to engineers means treating it as a technical skill: give specific feedback, provide examples of what clear looks like, and create incentives for good documentation rather than minimum viable documentation.

## Give each document one job

A design proposal helps readers decide. A runbook helps an operator act. A tutorial helps a learner acquire a capability. Combining all three into one long document can make each job harder. State the intended reader, the decision or task, and the knowledge assumed. Put supporting background behind a clearly named link when it is not needed for the immediate action.

For a runbook, name the preconditions before the commands. The reader should know which environment is in scope, which permissions are required and what observation justifies proceeding. Show the expected result and the stop condition after a risky step. Commands copied from a working terminal session can still fail when the reader has a different shell, account or current directory.

## Test instructions with someone who lacks the author's context

Consider a fictional recovery guide with 12 steps. In a first walkthrough, a colleague completes eight steps without clarification. Four require help because an environment name, expected output or prerequisite is missing. After revision, the colleague completes 11 steps independently, while one still needs specialist approval. The chart compares independently completed steps; it does not measure the safety of the recovery or the reader's ability.

Keep the remaining approval step explicit. Removing a legitimate control merely to improve the independent-completion count would make the metric look better while weakening the procedure. Record whether a step was blocked by missing information, missing access or an intentional safety boundary. These categories lead to different fixes.

## A documentation review exercise

Select a procedure that can be executed safely in a sandbox. Ask the reviewer to read it without the author explaining it aloud. The reviewer should mark every ambiguous noun, missing prerequisite and unexpected result. Observe where they stop, but avoid silently helping them through the gap. The purpose is to test the artifact, not to evaluate the person.

Revise the most consequential gaps first. Replace “restart the service” with the exact service identity, the approved environment and the observable sign that it restarted successfully. Replace “check the logs” with the relevant event, time range and decision the log is intended to support. Keep sensitive identifiers out of public examples and use clearly labelled placeholders that cannot be mistaken for production values.

## Keep reasoning close to the change

When a code change alters an interface, recovery path or operational assumption, include the documentation update in the same review. Link a design decision to the implementation that realizes it. If the implementation intentionally differs, explain why. A document that continues to describe the old behavior can be more dangerous than an obvious gap because it gives the reader unwarranted confidence.

Assign an owner for important operational documents and define what triggers review: a dependency upgrade, a changed permission boundary, a failed exercise or a new failure mode. A calendar reminder can supplement these triggers, but it cannot prove that the content is correct. The strongest evidence is that the intended reader can use the document for its stated purpose and recognize when the procedure no longer applies.

## Sources and further reading

- [Google · Technical writing courses](https://developers.google.com/tech-writing/overview)
- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
