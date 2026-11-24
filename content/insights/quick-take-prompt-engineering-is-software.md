---
title: "Prompt Engineering Is Software Engineering With Worse Feedback Loops"
description: "Prompts influence software behavior and need versioning, evaluation, and clear ownership. The difference is that the execution environment (the LLM) is non-deterministic and the feedback loops are slower."
date: 2028-04-26
tags: ["Enterprise AI"]
format: article
---

Prompt engineering gets dismissed in two directions. Some say it is trivial — just write what you want in plain English. Others say it is not real engineering — just natural language, no formal verification, no type system.

Both dismissals miss the same thing: prompts are natural-language instructions within a probabilistic application, and all the challenges of software engineering — correctness, edge cases, maintainability, testing — apply.

## What prompt engineering shares with software engineering

**Correctness has edge cases.** A prompt that works for 90% of inputs fails for 10%. The failures are often systematic — consistent patterns in inputs that trigger consistent failures. Identifying these patterns requires the same kind of exploratory testing and systematic analysis that software testing requires. The difference is that the failure modes are less predictable and harder to enumerate in advance.

**Prompts have regressions.** A prompt that works correctly today may fail after a model update, after a change to the retrieval pipeline, after a change to the surrounding application context. Without a regression test suite — a set of inputs with expected outputs that can be checked automatically — regressions are discovered in production.

**Prompts require documentation.** A prompt that is not documented is a black box. The next engineer who maintains it does not know why specific phrases were chosen, what problems they solve, what alternatives were tried. This is the same knowledge transfer problem as undocumented code.

**Prompts accumulate technical debt.** A prompt that was hacked together to handle a specific failure mode, without a principled solution, accumulates edge cases and special cases that make it progressively harder to modify. This is prompt technical debt.

## The worse feedback loops

Many conventional unit tests provide fast pass/fail feedback, although distributed and randomized systems also require more complex testing. In prompt engineering, evaluation requires running the prompt against a test set (slow), evaluating outputs with a rubric (often requiring human judgment or a separate evaluation model), and interpreting results that are probabilistic rather than deterministic.

This makes the iteration cycle slower and the regression detection harder. The discipline must account for those different feedback characteristics — you cannot rely on fast deterministic feedback to catch errors.

The craft is real. The tools for doing it well are still maturing. Dismissing it as trivial is how production AI systems end up with unmaintainable prompt spaghetti that nobody understands and everyone is afraid to change.

## Treat a prompt revision as a controlled release

Consider a hypothetical service that converts service-desk messages into a triage record. Its output contains category, urgency, a short explanation, and references to the message content. A prompt revision asks the model to distinguish service impact from the sender's emotional language. The expected benefit is fewer urgent classifications for messages that are strongly worded but describe a minor inconvenience.

Create 80 fictional messages with independently agreed categories. Version A correctly categorizes 64; version B correctly categorizes 70. The chart shows those counts, corresponding to 80% and 87.5%. Inspect urgency separately: a revision that reduces false urgency but misses a real outage may be unacceptable even when category accuracy improves. The sample illustrates the method, not a benchmark.

## Keep deterministic checks outside the prompt

Validate that the category is one of the permitted values, that required fields exist, and that any source references point to the supplied message. Reject unsupported identifiers. Those conditions should be checked by code rather than by asking the generator whether it followed the instructions. A well-formed record can still be semantically wrong, so retain a separate rubric for the classification decision.

Represent uncertainty deliberately. If the message lacks the affected service or impact, the application can request clarification or route to a human. Requiring a confident urgency for every message creates an incentive to invent missing context. The user interface should make the review state visible rather than presenting unverified output as an accepted ticket classification.

## Make the release reproducible enough to investigate

Record the prompt template, model configuration, schema version, examples, and test-set version. Preserve the rendered request recipe or a privacy-conscious equivalent. A prompt identifier alone is insufficient if the application injects changing tool descriptions or retrieval snippets around it.

Use a canary route with bounded traffic after offline checks pass. Compare task outcomes and review effort with the previous version. Keep the older configuration available until the new one has survived the relevant workflow cycle. If the deployment changes several components at once, acknowledge that a regression may not be attributable to prompt wording alone.

For the worksheet, write one hypothesis, one expected behavior change, and one failure that would reject the change. Then list the cases that exercise each. Review the diff with someone who did not write it and ask them to explain why each new instruction is necessary. Remove instructions that duplicate application validation or conflict with a higher-priority requirement. This keeps the prompt maintainable as a component of the system rather than an accumulating archive of every failure the team has encountered.

## Sources and further study

- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
