---
title: "Retrospectives that lead to testable changes"
description: "Choose one bounded experiment, define the observation, and review evidence before adding another improvement commitment."
date: 2029-02-07
tags: ["Engineering Leadership"]
format: article
derived: true
---

Retrospectives are useful when teams connect observations about their work to decisions they can revisit. The format is well-understood. The facilitation patterns are documented. The output format — what went well, what could be better, what actions to take — is standard. The gap is between action items generated and action items completed.

The ownership problem is the most common failure mode. An action item assigned to "the team" has no owner. Everyone assumes someone else is driving it. The next retrospective opens with the same problem on the list, slightly reworded. Teams that repeat the same retrospective items across multiple sprints have stopped learning from the practice. The format continues because stopping it feels like giving up. The change it was designed to produce does not occur.

The structural fix is straightforward and consistently avoided because it creates accountability. Every action item has a single named owner — not a pair, not the team — and a definition of what done means. The definition needs to be specific enough that both the owner and the team can verify completion. "Improve our deployment process" is not a definition. "Reduce deployment time from 22 minutes to 12 minutes by the end of the next sprint, measured by CI pipeline duration" is.

The retrospective review at the start of the following retrospective creates accountability without blame. Each action item is either complete — evidence required — or not complete — with its constraint explained and a decision to reschedule, change or stop the work. Teams that discover they consistently carry items forward are committing to more than they can deliver. The appropriate response is to commit to fewer items, not to maintain a growing backlog of incomplete improvement work.

The practice that compounds is the one that produces fewer, completed actions rather than many, unowned aspirations.

## Select an experiment that fits the next iteration

A retrospective is a place to inspect how work happened, including collaboration and tooling. It can produce useful understanding even when the team chooses no new change. The stronger question is whether the conversation changes a decision when a change is warranted. Avoid creating action items merely to prove that the meeting had output. An overloaded improvement backlog can become another source of frustration.

Choose one problem that participants can describe with an example. “Reviews are slow” is a starting point. “Three changes waited overnight because no reviewer knew who owned the shared library” is a more testable observation. Identify a small intervention, such as a primary reviewer and backup for that library, and define what you expect to observe. Do not promise a numerical improvement before understanding the variation in the work.

## Compare elapsed time without claiming causality

Suppose five fictional review requests waited 2,4,6,8 and 10 hours for an initial substantive response. Their median is 6 hours. During a small trial, five comparable requests waited 1,2,3,4 and 9 hours, giving a median of 3 hours. The chart compares those medians. It also hides the 9-hour wait in the second group, which is why the individual observations should remain visible in the worksheet.

The difference is not proof that the new ownership rule caused the improvement. The changes may have been smaller, the reviewers less busy or the time zones better aligned. Record those conditions and keep collecting observations. A useful first conclusion is that the trial deserves a closer look, rather than announcing a 50% productivity increase from ten observations.

## Use a one-page experiment record

Write the problem, a recent example, the proposed change, an owner who coordinates it, and a review date. Add the start and stop definitions for the observation. For review waiting time, decide whether nights and weekends count and what constitutes a substantive response. A bot acknowledgment is not the same event as a reviewer identifying the next action.

At the next retrospective, inspect the record before collecting new suggestions. The team can continue, adapt, stop or replace the experiment. If the owner lacked time or authority, discuss the planning decision that created the constraint. Carrying an item forward indefinitely is not the only responsible outcome. A deliberate cancellation with a reason is clearer than a stale commitment.

## Make disagreement safe to express

An experiment should not depend on everyone agreeing about why the problem exists. One engineer may believe review delays come from unclear ownership; another may point to oversized changes. Both hypotheses can be recorded. Choose a small test that helps distinguish them and avoid treating the result as a contest between people.

Keep confidential interpersonal issues out of a public action tracker. Some concerns need a private conversation, a manager or an established support process. A retrospective is not therapy, but comparing it dismissively with therapy does not improve engineering practice. Its purpose is collaborative inspection and adaptation. Judge it by the quality of the decisions and learning it enables, not the number of tickets produced at the end.

## Sources and further reading

- [Schwaber and Sutherland · Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
