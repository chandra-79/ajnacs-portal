---
title: "Your monolith running fine in production is not a problem that needs solving"
description: "The migration to microservices is often proposed as modernisation rather than as a solution to a specific problem."
date: 2029-03-23
tags: ["Architecture", "Engineering Leadership"]
format: note
derived: true
---

The migration to microservices is often proposed as modernisation rather than as a solution to a specific problem. These are different things, and the distinction matters when you are deciding whether to invest significant engineering effort in rearchitecting something that works.

Microservices solve specific problems well: teams that cannot deploy independently because they share a codebase, components that need to scale at different rates, and codebases that have grown so large that the cognitive load of understanding the whole system has become a serious productivity constraint.

What microservices do not solve: bad code quality, poor test coverage, slow development velocity that comes from team dynamics rather than architecture, or the desire to use newer technology.

The honest audit before a microservices migration: list the specific operational constraints the monolith creates. Not the theoretical constraints ("eventually it won't scale") — the actual constraints happening now. If the list is short or vague, the migration is solving a problem that hasn't arrived yet, while creating operational complexity that arrives immediately.

The systems that cause organizations the most trouble are often not monoliths. They're distributed systems that inherited monolith-era design patterns without inheriting the monolith's debuggability.
