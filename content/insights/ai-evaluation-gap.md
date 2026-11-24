---
title: "The AI system went live without a systematic evaluation framework. That is the real risk."
description: "Software engineering has decades of practice around automated testing."
date: 2028-11-24
tags: ["AI & MLOps", "Enterprise AI"]
format: article
derived: true
---

A model that returns an answer without an exception has passed a transport test. It has not necessarily answered the question, used an authorized source, or respected the task boundary. Evaluation supplies evidence for those separate properties. It belongs beside ordinary software tests, because a reliable retrieval API and an unreliable answer can coexist in the same successful HTTP response.

## Define a failure that reviewers can recognize

For a hypothetical internal-policy assistant, define a supported answer as one that identifies the correct policy version, answers the requested question, and cites a passage that supports the important claim. If no authorized passage answers the question, a clear abstention is preferable to an invented rule. This definition is more useful than asking reviewers whether the answer sounds helpful.

Build cases from permitted examples of actual tasks and add deliberately difficult cases. Include an obsolete policy, a similar policy for another jurisdiction, a missing exception, and a user who lacks permission to see the source. Keep expected facts and acceptable variants beside each case. A good answer need not match one sentence word for word, but it must satisfy the same factual and permission constraints.

## Show what the aggregate conceals

Suppose a fictional test set has 100 routine questions and 20 exception questions. The existing system passes 92 routine questions and 16 exceptions. A proposed change passes 97 routine questions and 10 exceptions. Overall success moves from 108/120, or 90%, to 107/120, or about 89.2%. The small aggregate change hides a decline from 80% to 50% on exceptions.

The chart shows exception passes before and after the change. These counts illustrate why release review should examine important slices. They do not establish a benchmark or prove statistical significance. A 20-case slice provides limited precision; use it to identify a regression and investigate, then enlarge the evidence set where the decision warrants it.

## Distinguish the failing component

Save the identifiers of retrieved passages and their revisions with the evaluation result. If the right passage is absent, inspect query construction, permissions, filtering, chunk boundaries, and ranking. If it is present but misinterpreted, inspect answer instructions, conflicting context, and the reasoning required. If the answer is correct but its cited passage is irrelevant, treat citation support as a separate defect.

Do not let a model grade itself without calibration. Automatic judges can reduce review effort, but they can prefer verbose answers, share the generator's mistakes, or respond to instructions embedded in the answer. Compare their judgments with independent human ratings on a maintained sample. Record the judge version and prompt as part of the evaluation configuration.

## Make the release gate operational

Create a worksheet with case ID, task slice, source revision, expected facts, answer, citation support, permission outcome, and reviewer decision. Run the same held-out cases before and after a change. Record repeated samples when outputs vary. Keep latency, cost, and abstention rates alongside correctness, since a system can raise answer accuracy simply by refusing more tasks.

The release owner should know which failures block deployment and who can accept a documented exception. After release, compare production feedback with the test coverage and add newly discovered failure patterns to a future test set. Avoid repeatedly tuning against the only held-out set. Evaluation is a continuing measurement process, not a permanent score attached to a model name.

## Sources and further study

- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [Lewis et al. — Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
