---
title: "Technical Writing Is an Engineering Skill — Here Is Why Engineers Underinvest in It"
description: "The engineer who writes clearly — in design documents, in pull request descriptions, in incident reports, in documentation — is more effective than the same engineer who does not. The skill is developable."
date: 2028-11-06
tags: ["Engineering Leadership"]
format: article
---

Technical writing is categorized as a soft skill. In the engineering organization, soft skills are the skills that matter less than technical skills, the ones that are nice to have but not critical, the ones that never appear in a performance review for an individual contributor.

This is wrong. Technical writing is an engineering skill in the same sense that debugging is an engineering skill — it requires precision, logical structure, awareness of the reader's context, and the ability to express complex ideas unambiguously.

## Where technical writing appears in engineering work

**Pull request descriptions.** A PR description that says "fixes the bug" requires the reviewer to understand the entire context from the code alone. A PR description that explains what was broken, why it was broken, what the fix does, and what the reviewer should pay attention to can reduce the clarification needed before substantive review.

**Design documents.** A design document that clearly states the problem, articulates the constraints, describes the options considered and why each was accepted or rejected, and specifies what will be built — this is the artifact that prevents a three-week implementation from ending in a disagreement about what was supposed to be built.

**Incident reports.** An incident report that communicates what happened, what the impact was, what was done to resolve it, and what will prevent recurrence — clearly and without jargon — determines whether the organization learns from the incident or files it.

**Architecture documentation.** The system that is documented clearly enough for a competent engineer to understand, maintain, and extend without the original author — this system outlasts the original author productively.

## Why engineers underinvest in it

**Feedback loops are slow.** Writing code gets immediate feedback from tests and the compiler. Writing documentation gets feedback from the person who reads it, which might be months later when they are confused. The connection between the writing investment and the benefit is long.

**It is not measured.** Engineers are reviewed on systems shipped, bugs fixed, features delivered. Some evaluation systems give little explicit attention to the quality of change descriptions. The unmeasured skill is the one that gets deprioritized.

**It is harder than it looks.** Writing clearly about complex technical topics requires understanding the topic well enough to explain it simply, understanding the reader's context, and organizing the explanation in the order that makes it most accessible. This takes practice and deliberate effort.

## Developing it

Like any engineering skill: deliberate practice with feedback. Write the design document before you build the thing. Get it reviewed by someone who will tell you where it is unclear. Do this repeatedly. The improvement is real and compounding.

## Review a description as a record of intent

A change description needs enough context for a reviewer to evaluate the behavior and for a future maintainer to understand the decision. State the trigger, the previous result and the new result. Explain a material limitation when it affects use or rollout. Do not narrate every edit; the diff already records those. Concentrate on reasoning that the code alone cannot reveal.

For a timeout fix, the description might explain that a retry previously outlived the caller's deadline, that the new implementation propagates the remaining budget, and that the test covers cancellation during a retry. A reviewer can then ask whether the new behavior matches the intended contract. “Improve reliability” gives them much less to evaluate.

## A fictional review-clarity exercise

Take eight fictional change descriptions and ask a reviewer to identify three things: the affected behavior, the reason for the change and the validation performed. In the first set, five descriptions supply all three. After revision, seven do. The chart compares complete descriptions, not review speed or defect prevention. A description can contain all three fields and still be wrong, so technical review remains necessary.

Keep the scoring concrete. “The author sounded confident” is not a criterion. “The test description identifies the retry-cancellation case” is. If two reviewers disagree about whether the reason is clear, use that disagreement to improve the wording. Do not turn the exercise into a ranking of writing ability across engineers with different language backgrounds or familiarity with the system.

## Build a short feedback loop

Ask a reader to summarize the proposed behavior before reviewing the implementation. If their summary differs from the author's intent, correct the description first. This can reveal an ambiguous requirement as well as unclear writing. A document is not merely a translation of a finished thought; writing and reviewing it can expose a decision that was never actually made.

Use examples to teach the expected level of detail. A small copy correction may need one sentence and a visual check. A concurrency change may need a scenario, invariants, failure behavior and the evidence from tests. Requiring the same long template for every change creates empty sections and teaches authors to treat the process as form filling.

## Keep the claim proportional to the evidence

Clear writing can reduce clarification and make review more effective, but a statement that it changes a review from 90 minutes to 20 minutes is an illustration unless measured under comparable conditions. The difference depends on the change, reviewer context and quality of the underlying design. Use writing examples to demonstrate improved information, rather than attaching unsupported universal savings to them.

Treat documentation defects as ordinary engineering feedback. Missing prerequisites, an ambiguous recovery instruction or an outdated API example should have an owner and a correction path. The lasting improvement is a practice in which readers can report confusion early and authors can verify whether the revision solved it. That practice makes communication part of the work rather than an invisible extra task left until a release is already late.

## Sources and further reading

- [Google Engineering Practices · Writing good change descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)
- [Google Technical Writing · Audience](https://developers.google.com/tech-writing/one/audience)
