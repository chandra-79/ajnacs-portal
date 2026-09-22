---
title: "Organisational Debt: What It Is and Why It Compounds Faster Than Technical Debt"
description: "Technical debt slows engineering velocity. Organisational debt — unclear ownership, misaligned incentives, accumulated process — slows everything. It is harder to see and harder to pay down."
date: 2028-10-30
tags: ["Engineering Leadership"]
format: article
---

Technical debt is well-understood. It is code or architecture decisions that were made for short-term convenience and that now slow future development. It is visible in pull requests, sprint velocity, and time-to-fix for bugs.

Organisational debt is the equivalent in processes, structures, and human systems — and it is harder to see, harder to measure, and harder to address.

## What organisational debt looks like

**Ownership gaps.** A system that everyone uses and nobody owns. When something goes wrong, the investigation begins with "whose problem is this?" The answer is either unclear or contested. Resolution is slow because no single person has the authority and context to make a decision and act.

**Accumulated process.** A process was added to handle a one-time problem. The problem was solved. The process remained. Over time, the process accumulated other processes as exceptions and edge cases were addressed. The team now has a 12-step approval process for routine changes that could be automated or eliminated. Nobody removes it because "we added it for a reason."

**Misaligned incentives.** Team A is measured on feature delivery speed. Team B is measured on system reliability. Team A ships features quickly, Team B spends time managing the production consequences. This incentive structure produces ongoing conflict that absorbs engineering and management time while solving no problems.

**Knowledge silos.** Critical system knowledge exists in the heads of two people. When one leaves, the knowledge leaves with them. The team spends 6 months rediscovering what was known. The silo was created by historical accident and maintained because transferring the knowledge takes time that never became a priority.

## Why it compounds faster than technical debt

Technical debt slows the code that is touched by it. Organisational debt slows every decision that passes through the affected process, team boundary, or ownership gap.

A decision that requires coordination across three teams with misaligned incentives, unclear ownership, and an accumulated approval process can take weeks for something that should take hours. This compounds across every decision in the organization simultaneously.

## Addressing it

Organisational debt is paid down the same way technical debt is: deliberately, incrementally, with specific allocation of time that could otherwise go to building new things.

The retro that identifies a process nobody is using and eliminates it. The team reorganization that clarifies ownership. The documentation that transfers knowledge out of a silo. The incentive adjustment that aligns teams around shared outcomes.

None of these are interesting. All of them compound forward when done consistently.
