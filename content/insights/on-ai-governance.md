---
title: "AI governance starts with a decision someone owns"
description: "AI governance starts with a decision someone owns"
date: 2029-05-09
tags: ["Enterprise AI", "Governance", "Engineering Leadership"]
format: note
derived: true
---

AI governance becomes useful when it changes a concrete decision. A policy that says to use AI responsibly is difficult to execute. A service record that names the permitted data, the review owner, the action boundary, and the shutdown procedure gives engineers something they can implement and operators something they can verify.

## Start with the action boundary

A hypothetical document assistant may summarize approved files and create a draft. Sending that draft to an external recipient is a separate capability with a different consequence. Treat the boundary explicitly in the application and permission system. A model's statement that the user approved an action is not a substitute for an authorization check.

The chart illustrates an inventory of 20 AI workflows: 11 are read-only, six create drafts for review, and three can change external state. These fictional categories help prioritize review; they are not a universal risk ranking. A read-only workflow can still expose sensitive information, and a draft can still contain harmful errors.

## Make ownership testable

For each workflow, ask who can explain its input sources, approve a material change, respond to a suspected disclosure, and disable the relevant capability. Rehearse one scenario: an untrusted document asks the assistant to send private content elsewhere. The expected outcome should follow from tool permissions and application controls, with model-level safeguards adding protection.

Use a one-page worksheet containing purpose, data classes, users, available actions, evidence of testing, and review date. Link to the actual configuration and incident procedure rather than copying their names into a policy document. NIST supplies a broad risk-management structure; OWASP provides concrete application threat categories. The local task is to turn those ideas into controls whose behavior can be demonstrated.

## Sources and further study

- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
