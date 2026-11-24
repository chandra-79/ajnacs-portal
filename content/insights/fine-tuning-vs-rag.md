---
title: "Choose retrieval or fine-tuning from the failure you can measure"
description: "Fine-tuning and RAG are frequently discussed as alternatives for the same problem. They solve different problems, and reaching for the wrong one produces expensive failures."
date: 2028-10-23
tags: ["Enterprise AI", "AI & MLOps"]
format: article
derived: true
---

Retrieval and fine-tuning change different parts of an AI system, and they can be used together. Retrieval supplies selected information at inference time. Fine-tuning changes learned parameters using training examples. The useful decision is which failure mechanism the application needs to address, not which technique has the more impressive name.

## Diagnose the information requirement

A support assistant answering questions about a frequently changing product manual needs access to the current approved manual and its permissions. Retrieval can supply that material and preserve references to the source. It still requires good indexing, filtering, and answer validation. A retrieved paragraph does not guarantee a correct interpretation.

A classifier that repeatedly misapplies a specialized label taxonomy may benefit from better examples, a clearer prompt, or supervised adaptation. Fine-tuning can teach task behavior and domain patterns, and it can also affect factual knowledge. The important limitation is that weights are not a transparent, permission-aware record store. Updating or removing one fact is usually easier to audit in an external source than in a learned parameter set.

## Compare interventions on separate failure slices

Consider a fictional 100-case evaluation. Forty cases depend on current policy facts, and 60 depend mainly on applying a stable classification rule. The baseline passes 20 policy cases and 42 classification cases, totaling 62. Adding retrieval passes 34 policy cases and 44 classification cases, totaling 78. Adapting the classifier passes 22 policy cases and 54 classification cases, totaling 76.

The chart shows the totals, but the slice counts explain the decision. Retrieval is helping the missing-information problem; adaptation is helping the stable classification task. The numbers are illustrative and do not imply that either technique will deliver these gains. A combined system would require its own evaluation; adding the improvements arithmetically would assume independence that has not been demonstrated.

## Account for the lifecycle

For retrieval, budget for ingestion, access-control updates, deletion, source freshness, query performance, and evidence checks. For fine-tuning, budget for example quality, data rights, training reproducibility, held-out evaluation, deployment compatibility, and rollback. Low-rank adaptation can reduce the number of trained parameters, but it does not eliminate those responsibilities.

Keep a baseline that uses a clear instruction and a suitable existing model. A simpler baseline may already satisfy the task. If a structured output is required, validate it in application code regardless of the training method. If an answer requires arithmetic, consider a deterministic calculation tool rather than expecting either retrieval or fine-tuning to make every calculation reliable.

For the worksheet, classify each observed error as missing or stale information, incorrect task behavior, invalid output structure, permission failure, or unsupported action. Choose an intervention for the largest consequential category, then test the same held-out cases again. Include operating cost and update effort in the decision. The original RAG and LoRA papers explain distinct mechanisms; the local experiment determines whether those mechanisms solve the application's actual problem.

Document the rejected alternatives as carefully as the selected configuration. Their constraints may become relevant when the workload changes.

## Sources and further study

- [Lewis et al. — Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [Hu et al. — LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)
