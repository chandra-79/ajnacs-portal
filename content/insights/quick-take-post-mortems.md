---
title: "Post-Mortems Without Action Items Are Just Storytelling"
description: "The post-mortem that documents what happened, who did what, and why the incident occurred — without committing to specific changes — produces an excellent account of a failure and zero improvement."
date: 2025-08-04
tags: ["Engineering Leadership", "Observability", "Resilience"]
format: article
---

The post-mortem is well-written. The timeline is clear, the contributing factors are identified, and the team's response is documented honestly. Everyone reads it, nods, and moves on.

Three weeks later, the same incident type recurs.

## The accountability gap in post-mortems

Most post-mortems identify contributing factors. Fewer convert those factors into specific, assigned, time-bounded action items. The ones that do often do not track completion. The ones that track completion often deprioritize the actions when the next sprint starts and new work comes in.

The result is a growing library of post-mortems that accurately document the organization's recurring failures.

## What a post-mortem action item actually requires

An action item that can be tracked and completed has four properties:

**Specific.** "Improve observability" is not an action item. "Add an alert for database connection pool exhaustion that pages the on-call engineer when the pool is at 80% capacity for more than 60 seconds" is an action item.

**Assigned.** One person's name. Not "the platform team" or "whoever is working on it." A person who can say, at the next sprint review, whether the action was completed.

**Time-bounded.** A deadline. Not a vague commitment to do it "soon." A sprint or a date.

**Prioritised.** This is where most post-mortem action items die — they are created, assigned, and deprioritized when the next sprint planning happens. The team lead needs to hold the line on post-mortem actions having space in the queue.

## The review mechanism

The post-mortem's value is created when the actions are completed, not when the document is written. This requires a review mechanism: at the end of each sprint, are the open post-mortem actions still open? If yes, are they in the current sprint? If not, when?

Some teams maintain a post-mortem action board alongside their normal work board, reviewed weekly. This makes the completion status of post-mortem actions visible and creates the social accountability to follow through.

## The blameless post-mortem and action items

The blameless post-mortem movement rightly focuses on system causes rather than individual blame. This is the correct approach for identifying what went wrong. It does not reduce the need for action items. Systems do not fix themselves. People fix systems. Someone needs to be responsible for each fix.

Blameless identification of system problems plus named ownership of system improvements produces the outcome post-mortems are supposed to produce.
