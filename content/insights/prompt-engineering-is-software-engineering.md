---
title: "Prompt engineering is software engineering with worse feedback loops"
description: "Writing prompts for LLMs is software engineering. The feedback loops are worse, the determinism is lower, and the testing practices are less mature — but the discipline is the same."
date: 2029-04-20
tags: ["Enterprise AI"]
format: note
derived: true
---

A prompt is one part of a software system's behavior. Changing it can alter what the system extracts, which sources it trusts, how it handles missing information, and whether it attempts a tool action. That makes prompt changes worth versioning and evaluating. It does not make natural-language instructions equivalent to a type-safe program or a security boundary.

## Version the whole request recipe

Keep the instruction template, model identifier, generation settings, tool schemas, output schema, and retrieval configuration together in a release record. Store references to source snapshots where appropriate rather than copying sensitive documents into a repository. If two deployments have the same prompt but different retrieval filters, they are not the same experiment.

A hypothetical invoice-extraction assistant illustrates the distinction. Its task is to return supplier, currency, invoice date, and total from an approved document. The prompt explains what each field means. A schema constrains the returned shape. Application code checks that the currency is permitted and that the total is compatible with the line items. The prompt alone cannot establish those facts.

## Test a concrete change

Suppose version A extracts all required fields correctly in 42 of 50 fictional evaluation documents. Version B succeeds in 46. The chart shows those counts, corresponding to 84% and 92% on this particular test set. Inspect the four improvements and any new failures individually. A higher total may conceal a regression on negative amounts or multiple currencies.

Use separate cases for blurred scans, missing fields, credit notes, duplicate invoices, and documents containing instructions unrelated to extraction. A missing field should have a defined representation or an explicit review outcome. Forcing every field to contain a string can turn uncertainty into fabricated data.

## Make failure recovery part of the contract

Reject malformed output before it reaches downstream systems. When semantic validation fails, retain the original document reference and show the reviewer which condition failed. Bound retries. Sending the same ambiguous document repeatedly with increasingly forceful instructions can produce a confident answer without improving the evidence.

The worksheet for a prompt change includes the hypothesis, changed instruction, affected task slice, evaluation result, examples of regressions, and rollback version. Keep the evaluation cases stable during the comparison, then add genuinely new failure patterns to a later version of the suite. If an automatic judge is used, record its configuration and compare a sample of its judgments with human reviewers.

The purpose of this discipline is to make the change explainable. A future maintainer should be able to answer why a sentence exists, what behavior it was intended to improve, and which test would reveal that it stopped helping. Context engineering and production ML testing provide useful vocabulary, while ordinary release management supplies the ownership and rollback mechanisms.

## Sources and further study

- [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
