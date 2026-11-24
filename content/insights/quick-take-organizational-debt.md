---
title: "Organizational debt: trace the decisions that keep waiting"
description: "Distinguish ownership gaps, incomplete requests and capacity constraints before changing a process or removing an approval."
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

**Knowledge silos.** Critical system knowledge exists in the heads of two people. When one leaves, the knowledge leaves with them. The team may spend substantial time rediscovering missing context; measure that effort rather than assuming a fixed six-month penalty. The silo was created by historical accident and maintained because transferring the knowledge takes time that never became a priority.

## How the friction spreads across workstreams

Technical and organizational debt can both affect many parts of a system. Their impact depends on which work repeatedly crosses the affected boundary.

A decision that requires coordination across three teams with misaligned incentives, unclear ownership, and an accumulated approval process can take weeks for something that should take hours. The effect can recur across multiple decisions that use the same path.

## Addressing it

Organisational debt is paid down the same way technical debt is: deliberately, incrementally, with specific allocation of time that could otherwise go to building new things.

The retro that identifies a process nobody is using and eliminates it. The team reorganization that clarifies ownership. The documentation that transfers knowledge out of a silo. The incentive adjustment that aligns teams around shared outcomes.

None of these are interesting. All of them compound forward when done consistently.

## Follow one decision through the organization

Choose a routine change that crosses a team boundary. Record who requests it, who supplies evidence, who decides and who implements the result. Separate necessary controls from accidental waiting. An approval may exist to protect a real risk even if its current implementation is slow. Removing it without understanding the obligation can exchange a visible delay for an invisible failure.

Ask each participant what information they need and what decision they are authorized to make. A handoff often waits because the request is incomplete, because the receiving team has no capacity, or because authority is ambiguous. Those are different problems. A new form may help the first, staffing or prioritization the second, and a decision-rights agreement the third.

## A fictional approval-path example

Suppose an access request spends two hours in active handling and 18 hours waiting between three teams. A revised path keeps the same two hours of checks but reduces waiting to six hours by making the owner and required evidence explicit. Total elapsed time changes from 20 to eight hours. The chart shows waiting time, not labor saved: the reduction is 12 elapsed hours, while active handling is unchanged.

This distinction matters when presenting the result. Multiplying12 hours by an hourly labor rate would invent a saving that the example does not establish. The business effect may be earlier onboarding or less blocked work, but that requires its own evidence. Track whether rejected requests, exceptions or inappropriate access increase after the change. Faster approval is useful only when the intended control still works.

## Build an ownership agreement small enough to use

For the chosen request type, write the service owner, decision owner, required evidence, expected response window and escalation route. Include an absence or backup arrangement. A single person's name is insufficient if they cannot delegate or if every decision waits for their return. Make the agreement visible where requests are created, rather than in a separate governance document nobody consults.

Test it with three cases: an ordinary request, an incomplete request and an urgent exception. Ask a colleague outside the original discussion to route each case. If they need informal knowledge to find the owner, the agreement is incomplete. If the urgent path skips all recordkeeping, add a way to capture the decision and review it afterward.

## Retire process deliberately

Keep the reason for a control alongside the control. When the risk or system changes, the team can evaluate whether the step still serves its purpose. A process retirement record should identify what is removed, which obligation remains and how the new path is verified. This prevents the same approval from being recreated later simply because nobody remembers why it disappeared.

Organizational friction can affect many workstreams, but there is no general rate showing that it compounds faster than technical debt. Technical and organizational constraints also interact. A shared database can create coordination work; unclear ownership can prevent the database boundary from improving. Diagnose the specific path and change the smallest mechanism that the evidence supports.

## Sources and further reading

- [Melvin Conway · The original design and communication thesis](https://www.melconway.com/Home/Conways_Law.html)
- [Schwaber and Sutherland · Scrum Guide](https://scrumguides.org/scrum-guide.html)
