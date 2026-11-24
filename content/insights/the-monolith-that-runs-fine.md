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

## Price the constraint rather than the fashion

A fictional fulfilment application has a 20-minute deployment procedure, including a ten-minute manual check. It releases ten times a week. The manual check therefore consumes 100 minutes of operator attention, while the full release elapsed time totals 200 minutes. Those quantities are different: making the process unattended can release attention without shortening the deployment itself.

Suppose a scripted smoke check reduces active intervention to two minutes per release. Operator attention becomes 20 minutes per week, an 80-minute reduction. That experiment addresses a concrete constraint without introducing service discovery, remote-call retries, or a second data owner. It says nothing about whether the application will eventually need extraction.

Before accepting a service proposal, name a success test that the simpler improvement cannot meet. Examples include isolating untrusted document conversion, scaling a CPU-heavy report worker separately, or allowing a team to deploy without coordinating a shared release. Record both the present requirement and the cost of crossing a process boundary.

## An extraction readiness exercise

Choose one candidate module. List its public operations and every table it reads or writes. Move direct cross-module table access behind an explicit interface. Run the existing regression tests and one failure rehearsal before changing deployment topology. If the module cannot be separated inside one process without extensive hidden dependencies, adding a network will not make those dependencies disappear.

The decision can be to retain the monolith and still invest heavily in it: bounded queries, reliable releases, ownership, and restore testing all have practical value. Healthy architecture has observable obligations. A particular number of deployables is not one of them.

## Further reading and source boundaries

- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
- [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)
