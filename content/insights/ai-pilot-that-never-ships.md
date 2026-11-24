---
title: "Why a successful AI pilot can stall before production"
description: "Turn an AI pilot into an operating decision with a defined workflow, evaluation evidence, support ownership, a fallback and measured delivery effort."
date: 2028-12-01
tags: ["Enterprise AI", "Engineering Leadership"]
format: article
derived: true
---

A successful AI demonstration is evidence about one constrained task. It is not evidence that the system can operate with production permissions, incomplete inputs, changing documents, realistic demand, and an accountable owner. A pilot stalls when those questions remain outside its definition of success. There is no reliable universal percentage of pilots that fail to ship, so the useful question is which production uncertainty the next experiment will remove.

## Give the pilot a decision to make

Consider a hypothetical support team evaluating an assistant that drafts answers from approved troubleshooting guides. Its decision is whether to offer drafts for one product family. The assistant will not send messages, change customer accounts, or make compensation decisions. This boundary keeps the experiment measurable and makes the fallback straightforward: the existing support workflow continues whenever the assistant cannot produce a supported draft.

Write the decision before choosing a model. Specify the eligible questions, who reviews the output, which documents are authoritative, and the maximum acceptable review effort. Define a stopped pilot as a legitimate result. If the source documents are inconsistent, improving them may be the right investment even when the assistant itself performs adequately.

## Separate model feasibility from service readiness

Build two evidence lists. The first concerns answers: relevance, factual support, handling of missing information, and agreement with the approved procedure. The second concerns operation: authentication, document permissions, timeout behavior, logging, ownership, and rollback. Passing one list does not compensate for failing the other.

Use a small production-shaped corpus that includes contradictory versions, deleted documents, ambiguous questions, and requests outside scope. Keep private customer data out of exploratory environments unless the organization has approved that handling. Record the source revision for each evaluation case so that a changed answer can be traced to a changed document rather than attributed automatically to the model.

## Work through the review burden

The chart is an illustrative workload calculation, not an Ajna customer result. Suppose the team handles 400 eligible questions per week. Its baseline writing and checking time is six minutes per question: 2,400 minutes. The assistant drafts 300 of them. Each draft requires three minutes of checking, or 900 minutes. The remaining 100 follow the original six-minute process, adding 600 minutes. Add 200 minutes for correcting retrieval issues and maintaining approved examples. The proposed process therefore consumes 1,700 minutes, releasing 700 minutes, or about 11.7 hours, in this assumed week.

This estimate is conditional. If review averages five minutes, the assisted process consumes 2,300 minutes and releases only 100 minutes. If errors create follow-up contacts, those contacts belong in the calculation. The pilot should measure review and rework time rather than count generated answers as saved labor. Staffing cost does not fall automatically when a few hours become available; the team must decide what useful work can fill that capacity.

## Turn the result into a release decision

Ask the service owner to rehearse three failures: the document index is unavailable, the user loses access to a source, and the model returns an unsupported answer. The interface should expose the limitation and preserve the user's task. A timeout should not leave a half-written draft that looks approved. A document-permission change must apply to retrieval and cached results, not merely to the visible link.

For the worksheet, create one row per evaluated task with eligibility, source revision, baseline minutes, review minutes, rework minutes, and outcome. Separate one-time setup from recurring upkeep. Review a sample with two support specialists and resolve disagreements before expanding the sample. Keep the evaluation set outside prompt tuning so that repeated editing does not quietly turn the test into training material.

A release recommendation should state the supported product family, the measured limitations, the responsible owner, and the specific condition that returns users to the manual workflow. The NIST framework supplies a broader risk-management structure; the ML Test Score offers concrete production-readiness questions. Neither document is a certificate that a particular assistant is ready. Readiness comes from evidence for the service you intend to operate.

## Sources and further study

- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
