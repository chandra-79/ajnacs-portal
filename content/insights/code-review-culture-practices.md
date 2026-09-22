---
title: "Code Review That Actually Works: Culture, Mechanics, and the AI-Era Update"
description: "Code review is the highest-leverage quality practice most teams run badly — too slow, too shallow, or too personal. The mechanics that make reviews fast and substantive, the culture that keeps them kind, and what changes when half the diffs are machine-drafted."
date: 2024-10-28
tags: ["Engineering Practice", "Engineering Leadership", "Code Review", "Developer Experience", "Quality Engineering"]
format: article
---

Ask engineers about code review and you'll hear two contradictory truths in the same breath: it's the practice they most value for learning and quality — and the stage where their work goes to wait. Both are accurate, because review is really two systems wearing one name: an information system (knowledge transfer, defect detection, design alignment) and a queueing system (the handoff where work sits pending human attention). Teams that run review well engineer both. Teams that run it badly get the queue without the information.

## What review is actually for (rank-ordered by evidence)

The research on review effectiveness has been consistent for decades, and it's mildly deflating: review catches *some* bugs, but its measured defect yield is lower than its reputation — automated tests and static analysis catch the mechanical failures more reliably. What review does uniquely well is everything else: **knowledge distribution** (the only routine mechanism by which more than one person understands each part of the system — the bus-factor insurance you're actually buying), **design coherence** (catching the wrong abstraction before it hardens, the duplicate implementation of something that exists), **standards convergence** (how a team develops shared taste), and **legibility pressure** — code written knowing it will be read is better code before the review even happens.

This ranking has a practical consequence most teams haven't absorbed: review attention should concentrate on *design, correctness of intent, and integration* — the human-unique layers — while everything mechanically checkable (format, lint, obvious bugs, coverage, secrets) is enforced by machines *before* a human looks. A human writing "missing semicolon style nit" comments in 2026 is a misallocated senior engineer, and every nit a robot could have raised erodes the reviewer's authority for the comments that matter.

## The mechanics: batch size and latency rule everything

Two numbers dominate review-system performance, and they're the two teams track least.

**Diff size.** Reviewer defect-detection falls off a cliff with diff size — a few hundred lines reviewed carefully beats two thousand skimmed, and "LGTM" on a 1,500-line PR is not approval, it's surrender. Small PRs aren't a preference; they're the enabling condition for review to work at all (and for everything else covered under trunk-based development). Teams that cap PRs — softly at ~400 lines, with stacked/chained PRs for bigger features — report that review quality improves *and* total throughput rises, because small diffs merge fast and rework shrinks.

**Turnaround latency.** Review latency is a tax on every change, and its second-order cost is worse than the wait: slow reviews teach authors to batch bigger PRs ("might as well include everything, this'll take days anyway"), which makes reviews slower — the doom loop most review cultures live in. The working norm at high-performing teams: **first response within a business day, ideally hours** — review is a first-class daily activity with calendar reality (a morning review block), not something squeezed between "real work." Making review turnaround a *team-visible* metric (never individual — the same Goodhart rule as always) gives the norm teeth without surveillance.

Round-trip count matters too: reviews that converge in one or two passes respect everyone's time. The enablers are a good PR description (what, why, how to verify — the author's five minutes saves each reviewer twenty), draft PRs for early design feedback *before* the code hardens, and the discipline of distinguishing blocking comments from suggestions explicitly — "nit (non-blocking):" is cheap notation that prevents a style preference from costing a day-long round trip.

## The culture: comments are about code, and everyone knows it — until they don't

Review is the most frequent peer-to-peer judgment ritual in engineering, which makes it the place where team culture is most actively manufactured. The norms that keep it healthy are teachable: comments address the code, not the author ("this function re-fetches inside the loop" vs "you always do this"); reviewers ask questions where they're genuinely unsure and say so ("is there a reason X?" often surfaces context that changes the review); authors treat pushback as information, not verdict; and *praise appears in reviews* — noting the elegant fix costs nothing and calibrates the channel so it isn't purely a defect-delivery mechanism. The senior engineers set this tone whether they intend to or not; a lead who nitpicks juniors and rubber-stamps peers has taught the team what review is really for, and no written norms document will overwrite the demonstration.

One structural choice with outsized cultural effect: **review assignments should spread, not concentrate.** The pattern where one gatekeeper reviews everything produces a bottleneck, a bus-factor, and a generation of engineers who never developed review judgment. Rotating reviewers, pairing juniors as second reviewers, and CODEOWNERS scoped to areas (not persons) distribute both the load and the learning.

## The AI-era update

Machine-drafted code and machine-assisted review change the calculus on both sides of the PR, mostly by amplifying what was already true. On volume: generation velocity makes the small-PR discipline *more* binding, not less — the failure mode of the era is the plausible 2,000-line generated diff that no human can meaningfully verify, and the correct response is the same as it always was: decompose or don't merge. On review assistance: AI first-pass review (summarizing diffs, flagging anomalies, catching the mechanical layer) genuinely helps — treat it as the newest robot in the "robots before humans" pipeline — but its confident tone tempts reviewers into deference, and its miss profile (plausible-but-wrong logic, hallucinated API assumptions, security patterns that look right) is precisely the profile human review exists to catch. The accountability rule that keeps the system sound: **the author owns everything they submit regardless of what drafted it, and the approver owns their approval.** Review is where that ownership becomes real — which means the era of cheap code has quietly made careful review *more* valuable, not less: verification is the scarce good now, and review is verification's human half.

Run the audit on your own team this week: median PR size, median time-to-first-review, and one honest question — do our senior engineers' calendars contain any time for the activity we claim is our primary quality practice? The answers usually explain each other.
