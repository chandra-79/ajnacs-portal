---
title: "Code Review That Actually Works: Culture, Mechanics, and the AI-Era Update"
description: "Design code review around clear evidence, manageable changes, and reviewer availability. Examine queueing delays, constructive feedback, and verification of machine-drafted code without treating review speed as a quality score."
date: 2028-04-28
tags: ["Engineering Practice", "Engineering Leadership", "Code Review", "Developer Experience", "Quality Engineering"]
format: article
---

Ask engineers about code review and you'll hear two contradictory truths in the same breath: it's the practice they most value for learning and quality — and the stage where their work goes to wait. Both are accurate, because review is really two systems wearing one name: an information system (knowledge transfer, defect detection, design alignment) and a queueing system (the handoff where work sits pending human attention). Teams that run review well engineer both. Teams that run it badly get the queue without the information.

## What review can contribute

Review, automated tests, and static analysis address overlapping but different risks; their relative effectiveness depends on the system and the evaluation method. Review can also contribute to: **knowledge distribution** (one routine mechanism for distributing understanding of a system — the bus-factor insurance you're actually buying), **design coherence** (catching the wrong abstraction before it hardens, the duplicate implementation of something that exists), **standards convergence** (how a team develops shared taste), and **legibility pressure** — an expectation of review can encourage authors to make intent and reasoning easier to inspect.

Reserve reviewer attention for design, intended behavior, integration risks, and evidence that the change meets its requirements. Automate reliable formatting and lint checks before requesting final review. Static analysis and secret scanning can identify particular patterns, but neither detects every defect or credential, and coverage does not establish correctness. Keep their limitations visible. If a formatting convention can be checked consistently by a maintained tool, automate it so that reviewers can concentrate on questions requiring context.

## The mechanics: batch size and latency rule everything

Diff complexity and review latency are useful starting measurements, alongside risk, reviewer availability, and the quality of the verification evidence.

**Diff size.** Large, complex diffs can exceed the attention available for a careful review — a few hundred lines reviewed carefully beats two thousand skimmed, and "LGTM" on a 1,500-line PR is not approval, it's surrender. Small, coherent PRs can make review easier (and for everything else covered under trunk-based development). Treat a line-count threshold as a local prompt to split work, not an evidence-backed universal cutoff. Mechanical changes and behavioral changes need different review strategies.

**Turnaround latency.** Review latency is a tax on every change, and its second-order cost is worse than the wait: slow reviews teach authors to batch bigger PRs ("might as well include everything, this'll take days anyway"), which makes reviews slower — a feedback loop worth checking in the team's own data. An illustrative working agreement is **first response within a business day**, adjusted for time zones, urgency, staffing, and change risk — review is a first-class daily activity with calendar reality (a morning review block), not something squeezed between "real work." Making review turnaround a *team-visible* metric (never individual — the same Goodhart rule as always) gives the norm teeth without surveillance.

Round-trip count matters too: reviews that converge in one or two passes respect everyone's time. The enablers are a good PR description (what, why, how to verify — the description can reduce repeated clarification; any time saving must be measured locally), draft PRs for early design feedback *before* the code hardens, and the discipline of distinguishing blocking comments from suggestions explicitly — "nit (non-blocking):" is cheap notation that prevents a style preference from costing a day-long round trip.

## The culture: comments are about code, and everyone knows it — until they don't

Review is a recurring peer-to-peer assessment in many engineering teams, which makes it the place where team culture is most actively manufactured. The norms that keep it healthy are teachable: comments address the code, not the author ("this function re-fetches inside the loop" vs "you always do this"); reviewers ask questions where they're genuinely unsure and say so ("is there a reason X?" often surfaces context that changes the review); authors treat pushback as information, not verdict; and *praise appears in reviews* — noting the elegant fix costs nothing and calibrates the channel so it isn't purely a defect-delivery mechanism. The senior engineers set this tone whether they intend to or not; a lead who nitpicks juniors and rubber-stamps peers has taught the team what review is really for, and no written norms document will overwrite the demonstration.

One structural choice with outsized cultural effect: **review assignments should spread, not concentrate.** The pattern where one gatekeeper reviews everything produces a bottleneck, a bus-factor, and a generation of engineers who never developed review judgment. Rotating reviewers, pairing juniors as second reviewers, and CODEOWNERS paths assigned to maintained teams, with explicit availability and fallback arrangements distribute both the load and the learning.

## The AI-era update

Machine-drafted code and machine-assisted review change the calculus on both sides of the PR, mostly by amplifying what was already true. On volume: generation velocity makes the small-PR discipline *more* binding, not less — the failure mode of the era is the plausible 2,000-line generated diff that no human can meaningfully verify, and the correct response is the same as it always was: decompose or don't merge. On review assistance: AI first-pass review may help with summaries or candidate findings when its output is independently checked — treat it as the newest robot in the "robots before humans" pipeline — but its confident tone tempts reviewers into deference, and its miss profile (plausible-but-wrong logic, hallucinated API assumptions, security patterns that look right) is precisely the profile human review exists to catch. The accountability rule that keeps the system sound: **the author owns everything they submit regardless of what drafted it, and the approver owns their approval.** Review is where that ownership becomes real — which means the era of cheap code has quietly made careful review *more* valuable, not less: verification is the scarce good now, and review is verification's human half.

Run the audit on your own team this week: median PR size, median time-to-first-review, and one honest question — do our senior engineers' calendars contain any time for the activity we claim is our primary quality practice? The answers usually explain each other.

## Separate review readiness from reviewer availability

A change is not ready merely because the branch exists. Review readiness means the author can explain the intended behavior, identify the affected contract, and show the relevant verification. A draft can invite early architectural discussion without claiming that every line is ready for approval. Distinguish that discussion from the final review so that a useful early comment does not become an accidental sign-off on later code.

For a payment handler, the review packet might include the request contract, idempotency behavior, failure cases, and a test showing duplicate delivery. For a documentation change, it might include the rendered page and checked links. The packet should match the risk. Requiring a lengthy security questionnaire for a spelling correction creates noise; treating a permission change as a routine refactor hides a meaningful boundary.

Reviewer availability then becomes an explicit service the team provides. A named backup can handle routine changes when a specialist is absent, but the backup needs the relevant competence. Do not turn a turnaround target into pressure to approve code outside someone's understanding. A reviewer can respond promptly with a specific request for expertise or evidence. That is a useful first response even when approval must wait.

## Worked example: a review queue with two different delays

Imagine a sample of twenty comparable changes. Before a team experiment, each change averages twelve elapsed working hours waiting for its first substantive review and four hours from that response to approval. The mean total is sixteen working hours per change. After assigning a daily review rotation and improving descriptions, first-response waiting averages six hours and the remaining review phase still averages four: ten working hours in total.

The chart compares sixteen and ten hours, a reduction of six hours per change, or 37.5%. Across twenty changes, the sum of elapsed durations falls from 320 to 200 change-hours. That sum is not 120 engineer-hours saved. Changes may wait concurrently, and authors may perform other work during the wait. The arithmetic describes flow through a hypothetical queue, not labor utilization or a measured customer result.

Collect the actual timestamps from ready-for-review, first substantive response, and approval. Exclude a bot's immediate acknowledgement from the first-response definition. Keep draft periods separate. Report sample size and compare similar change categories, because an emergency configuration fix and a schema migration have different review needs. Also count changes that remain open; a report containing only merged work hides abandoned and stalled reviews.

A faster queue is not sufficient evidence of better review. Sample the comments and later defects to see whether reviewers are still checking the important behavior. A short observation period may reveal scheduling improvements without establishing a reliable change in escaped defects. Discuss uncertainty openly, especially when defect counts are small or incident discovery occurs weeks after deployment.

## Review a behavioral contract before individual lines

Begin with what the change promises. If a cache is added, ask what can become stale, how invalidation works, and whether a cache miss still behaves correctly. If a retry is added, ask whether repeating the operation is safe and how the retry budget interacts with the request deadline. These questions can reveal design errors before a reviewer spends attention on naming or formatting.

Then trace a representative successful path and a representative failure path. Verify how input is validated, where authority is checked, what state is changed, and how the caller learns the result. For concurrent code, identify the invariant that must survive interleaving. A unit test that exercises one sequential call does not demonstrate concurrency safety. Ask for a focused test or explanation rather than requesting broad coverage without a concrete concern.

Finally inspect operational consequences. Does the change add a new dependency, expose sensitive values in logs, or create a migration that cannot be reversed? Can the release be stopped safely? A rollback flag may disable new behavior while leaving a transformed database incompatible with the old binary. Review the actual deployment sequence rather than assuming source rollback restores the prior system state.

## A practical reviewer worksheet

Use five short prompts: intended behavior, evidence, risks, release path, and open questions. Under intended behavior, summarize the change in your own words. If that summary differs from the author's, resolve the mismatch before debating implementation. Under evidence, link the tests or manual observations that support the claim. Under risks, identify the boundary most likely to fail and the consequence if it does.

For the release path, record any sequencing requirement between producers and consumers, schemas and applications, or permissions and workloads. Under open questions, distinguish a blocking correctness issue from an optional suggestion. Explain the reason for a blocking request. A reviewer should not need to invoke seniority when a concrete invariant or documented constraint explains the concern.

The author can use the same worksheet before requesting review. That often exposes missing context without adding another process document. Keep the result in the change description so the next reviewer and future maintainer can find it. Avoid copying a large template full of empty headings into every small change; the worksheet is a thinking aid, not a quota of prose.

## Machine assistance and accountability

An assistant can summarize a diff, suggest tests, or identify a suspicious pattern. Its output is another input to verification. Check whether it understood the actual library version and surrounding code. A plausible warning about an API that does not exist wastes reviewer attention; a confident approval does not establish correctness. Track useful findings and false alarms if the team wants to evaluate the assistant's effect.

Do not send restricted source or credentials to an external service without the organization's approved data controls. Review generated test assertions carefully: a test can faithfully encode the same mistaken assumption as the implementation. Independent expectations matter more than the number of generated tests. For a financial calculation, derive a small expected result by hand and test boundary conditions separately.

The sustainable practice is a review system with explicit ownership, sufficient attention, and a clear contract for evidence. Small, coherent changes often help, but line count is only a proxy: a five-line authorization change can carry more risk than a large mechanical rename. Tune the workflow to the change, preserve learning, and use turnaround data to improve the queue without turning it into an individual performance score.

## Sources and further reading

- [Google Engineering Practices · Code review](https://google.github.io/eng-practices/review/reviewer/)
- [Microsoft Engineering Fundamentals · Code reviews](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/)
- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
