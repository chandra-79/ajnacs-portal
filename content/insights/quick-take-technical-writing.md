---
title: "Technical Writing Is an Engineering Skill — Here Is Why Engineers Underinvest in It"
description: "The engineer who writes clearly — in design documents, in pull request descriptions, in incident reports, in documentation — is more effective than the same engineer who does not. The skill is developable."
date: 2026-01-12
tags: ["Engineering Leadership"]
format: article
---

Technical writing is categorized as a soft skill. In the engineering organization, soft skills are the skills that matter less than technical skills, the ones that are nice to have but not critical, the ones that never appear in a performance review for an individual contributor.

This is wrong. Technical writing is an engineering skill in the same sense that debugging is an engineering skill — it requires precision, logical structure, awareness of the reader's context, and the ability to express complex ideas unambiguously.

## Where technical writing appears in engineering work

**Pull request descriptions.** A PR description that says "fixes the bug" requires the reviewer to understand the entire context from the code alone. A PR description that explains what was broken, why it was broken, what the fix does, and what the reviewer should pay attention to enables a review that takes 20 minutes instead of 90.

**Design documents.** A design document that clearly states the problem, articulates the constraints, describes the options considered and why each was accepted or rejected, and specifies what will be built — this is the artifact that prevents a three-week implementation from ending in a disagreement about what was supposed to be built.

**Incident reports.** An incident report that communicates what happened, what the impact was, what was done to resolve it, and what will prevent recurrence — clearly and without jargon — determines whether the organization learns from the incident or files it.

**Architecture documentation.** The system that is documented clearly enough for a competent engineer to understand, maintain, and extend without the original author — this system outlasts the original author productively.

## Why engineers underinvest in it

**Feedback loops are slow.** Writing code gets immediate feedback from tests and the compiler. Writing documentation gets feedback from the person who reads it, which might be months later when they are confused. The connection between the writing investment and the benefit is long.

**It is not measured.** Engineers are reviewed on systems shipped, bugs fixed, features delivered. Nobody is reviewed on the quality of their pull request descriptions. The unmeasured skill is the one that gets deprioritized.

**It is harder than it looks.** Writing clearly about complex technical topics requires understanding the topic well enough to explain it simply, understanding the reader's context, and organizing the explanation in the order that makes it most accessible. This takes practice and deliberate effort.

## Developing it

Like any engineering skill: deliberate practice with feedback. Write the design document before you build the thing. Get it reviewed by someone who will tell you where it is unclear. Do this repeatedly. The improvement is real and compounding.
