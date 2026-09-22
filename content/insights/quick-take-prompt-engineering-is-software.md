---
title: "Prompt Engineering Is Software Engineering With Worse Feedback Loops"
description: "Prompts are code — they have logic, edge cases, regressions, and require testing. The difference is that the execution environment (the LLM) is non-deterministic and the feedback loops are slower."
date: 2028-04-26
tags: ["Enterprise AI"]
format: article
---

Prompt engineering gets dismissed in two directions. Some say it is trivial — just write what you want in plain English. Others say it is not real engineering — just natural language, no formal verification, no type system.

Both dismissals miss the same thing: prompts are program specifications for a probabilistic execution environment, and all the challenges of software engineering — correctness, edge cases, maintainability, testing — apply.

## What prompt engineering shares with software engineering

**Correctness has edge cases.** A prompt that works for 90% of inputs fails for 10%. The failures are often systematic — consistent patterns in inputs that trigger consistent failures. Identifying these patterns requires the same kind of exploratory testing and systematic analysis that software testing requires. The difference is that the failure modes are less predictable and harder to enumerate in advance.

**Prompts have regressions.** A prompt that works correctly today may fail after a model update, after a change to the retrieval pipeline, after a change to the surrounding application context. Without a regression test suite — a set of inputs with expected outputs that can be checked automatically — regressions are discovered in production.

**Prompts require documentation.** A prompt that is not documented is a black box. The next engineer who maintains it does not know why specific phrases were chosen, what problems they solve, what alternatives were tried. This is the same knowledge transfer problem as undocumented code.

**Prompts accumulate technical debt.** A prompt that was hacked together to handle a specific failure mode, without a principled solution, accumulates edge cases and special cases that make it progressively harder to modify. This is prompt technical debt.

## The worse feedback loops

In traditional software, the test suite runs in seconds or minutes and produces a binary pass/fail against a deterministic specification. In prompt engineering, evaluation requires running the prompt against a test set (slow), evaluating outputs with a rubric (often requiring human judgment or a separate evaluation model), and interpreting results that are probabilistic rather than deterministic.

This makes the iteration cycle slower and the regression detection harder. The discipline required is higher, not lower — you cannot rely on fast deterministic feedback to catch errors.

The craft is real. The tools for doing it well are still maturing. Dismissing it as trivial is how production AI systems end up with unmaintainable prompt spaghetti that nobody understands and everyone is afraid to change.
