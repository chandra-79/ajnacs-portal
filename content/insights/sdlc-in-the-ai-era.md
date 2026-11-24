---
title: "The SDLC in the AI Era: What Actually Changes When Code Gets Cheap"
description: "AI assistants have made code generation abundant — and moved the bottleneck. How the software development lifecycle rebalances around review, verification, and specification, and what engineering leaders should change (and defend) in response."
date: 2027-11-01
tags: ["Engineering Practice", "AI Adoption", "Engineering Leadership", "Developer Experience", "Quality Engineering"]
format: article
---

Every era of software tooling has moved the bottleneck. Compilers made machine code cheap and moved effort to design; frameworks made plumbing cheap and moved it to product logic. AI coding assistants can reduce effort for some first-draft code tasks — and the organizations still running an SDLC designed around code-is-expensive assumptions are feeling the mismatch everywhere: review queues swelling, test suites passing while behavior drifts, juniors shipping faster and learning slower.

The lifecycle isn't dying; it's rebalancing. Here's where the weight actually moves, as a framework for evaluating changes in a specific delivery environment.

## The economics in one sentence

If generation becomes substantially cheaper while verification does not, **verification becomes the constraint** — and every stage of the SDLC re-prices around that fact. Most of what follows is that sentence applied stage by stage.

## Upstream: specification becomes the highest-leverage artifact

AI assistants amplify whatever intent they're given. Vague intent, amplified, produces plausible-looking wrongness at unprecedented volume; precise intent can improve drafts but does not guarantee correctness. That shifts real value to the artifacts engineering culture spent a decade treating as bureaucratic: written requirements, interface contracts, acceptance criteria, architecture decision records. Teams discover that a crisp ADR or a well-specified ticket is no longer documentation overhead — it *is* the prompt, and the quality differential in what comes back is dramatic.

The practical change: design review moves earlier and gets more rigorous, because early design review can prevent expensive downstream rework. Code was never the expensive part to fix — it just used to be expensive enough to write that we noticed errors there. Now the code arrives in minutes, wearing whatever misunderstanding survived the specification.

## The middle: review is the new bottleneck, and it needs redesign

Code review was calibrated for human-authored diffs: a colleague's reasoning, embedded in code, at human production rates. It now faces machine-authored volume with subtly different failure modes — AI-generated code errs *plausibly*: idiomatic style, confident structure, and occasionally a hallucinated API, a subtly wrong boundary condition, or a security pattern that looks like the safe version but isn't. Reviewer vigilance calibrated on human error distributions misses machine error distributions, especially under volume fatigue.

What the adapted shops do: **keep PRs small** (the discipline matters more, not less — velocity is worthless if it arrives in unreviewable lumps); make **provenance visible** (which portions were generated, so reviewers calibrate); push the mechanical load down to machines (linting, type-strictness, AI-assisted first-pass review flagging anomalies for the human) so **human attention concentrates on intent, boundaries, and integration** — the layers where generated code actually fails; and hold the line that *the committer owns the code regardless of who typed it*. "The AI wrote it" is not a defense at the post-incident review, and making that explicit early prevents a subtle accountability rot.

## Verification: tests stop being optional-with-guilt

The test suite inherits the load that reviewer intuition used to carry. Three upgrades matter most. **Behavioral coverage over line coverage** — generated code can trivially generate tests that exercise lines while asserting almost nothing; what you need are tests encoding *intended behavior*, written or at least specified by someone who holds the intent. **Property-based and contract testing** rise in value because they verify invariants rather than examples — exactly the failure surface of plausible-but-wrong code. **CI as the trust anchor**: when volume rises, the merge gate — not the author's diligence — is what "releasable" rests on, which makes pipeline speed and flake-freedom a first-order investment rather than a hygiene item. Teams that were already strong here absorbed AI velocity gracefully; teams that weren't just got their weakness amplified.

Security-wise, the same story with higher stakes: generated code reproduces the training distribution's vulnerabilities at generation speed, supply-chain surface grows (hallucinated or typosquatted dependencies are a real attack class now), and the countermeasures are the boring ones executed consistently — SAST/dependency scanning as merge gates, secrets management that makes the insecure path hard, and provenance tracking for what entered the codebase from where.

## Downstream and around: operations, docs, and the pipeline itself

Deployment and operations change least in structure — the disciplines already covered elsewhere (progressive delivery, GitOps, observability) simply matter *more*, because shipping frequency rises and each shipped unit carries less human pre-verification. The kill-switch and the canary analysis absorb what the author's certainty used to. Meanwhile AI earns its keep on the operational side too: incident summarization, log-pattern triage, runbook drafting, test-failure clustering — the unglamorous toil where "mostly right, human-checked" is exactly the right quality bar.

Documentation inverts economically: generation is nearly free, so the scarce asset becomes *curation* — deciding what's true, pruning what's stale. A wiki that doubles in size via generation without an ownership model is negative-value; the answer is the same lifecycle discipline as feature flags — owners, review dates, deletion as a celebrated activity.

## The people problem nobody's tooling solves

The skill-formation question is the era's genuine open wound: juniors historically built judgment by writing the boring code that AI now writes. If the entry-level experience becomes "prompt and paste," the seniors of 2032 never form the instincts that make review and architecture work. The teams handling this deliberately treat it as an explicit training design problem — rotations where juniors write from scratch, review apprenticeships where they must articulate *why* generated code is wrong before a senior confirms, debugging assignments on AI-authored failures (a useful calibration exercise). What doesn't work is pretending the issue away or banning the tools; both just move learning underground.

For leaders, the honest metrics stance: expect real but uneven gains (the marketing numbers assume greenfield; legacy integration, review, and verification dilute them), measure at the *delivery* level (change lead time, deployment frequency, failed deployment recovery time, change fail rate, and deployment rework rate — the current DORA delivery measures) rather than trusting generation-stage vanity metrics like lines produced or suggestion-acceptance rate, and watch change-fail rate specifically: it can reveal release problems, alongside other quality and reliability evidence.

## The through-line

Every rebalancing above points the same direction: **the SDLC's center of gravity moves from producing artifacts to specifying and verifying them.** Requirements, contracts, tests, review, provenance, observability — the connective tissue we underinvested in while code was the expensive part — is now the load-bearing structure. Organizations that treated process as scaffolding around heroic coding will struggle; organizations that always believed the system around the code *was* the engineering will find this era suits them unreasonably well. The tools changed the price of typing. They raised the price of knowing what you meant.

## Evaluate an assistant as part of a workflow

The useful unit of evaluation is a completed, verified change in a defined environment. Suggestion acceptance and generated line count describe interaction with a tool, but they do not establish that the change is correct, maintainable, or useful. Choose tasks representative of the repository: a small bug fix, an integration change, a test addition, and a refactor with a stable behavioral contract. Keep the task definition and acceptance criteria independent of the assistant's proposed implementation.

Record the model or product version, available repository context, permissions, and the time allowed. An assistant operating with full local tests has a different information environment from one receiving only a pasted function. Preserve relevant outputs for review under the organization's data policy. Do not retain secrets or customer records merely to make the evaluation reproducible; use approved fixtures and redact sensitive material at collection time.

A comparison should also account for the engineer's familiarity with the task. Someone repeating a problem they already solved has an advantage unrelated to the tool. Rotate task order when feasible, use comparable task sets, and explain the limits of the design. Small internal trials can inform a local rollout without supporting a universal productivity percentage.

## Worked example: generation gains and verification costs

Imagine a hypothetical change that takes six active hours to implement and two hours to review and verify without assistance. Total active effort is eight hours. With an assistant, implementation takes three hours, but review and verification take three because the author must inspect unfamiliar generated logic. Total effort is six hours. The chart compares eight and six hours, a reduction of two hours, or 25%.

The implementation stage alone improved by 50%, from six to three hours. Reporting that as the total workflow gain would overstate the result. The example deliberately distinguishes stage-level and end-to-end arithmetic. It excludes elapsed queueing, tool cost, training time, later maintenance, and escaped defects. These are synthetic inputs, not an Ajna customer result or a forecast for a particular coding product.

A real evaluation needs quality outcomes alongside time. Record whether the change met its acceptance criteria, how much rework followed review, and whether failures appeared after release. Some consequences emerge too late for a short trial. State the observation window and keep a route to update the finding. A promising early result can justify a bounded rollout while remaining provisional.

## Specify invariants that are independent of the draft

A generated implementation and generated tests can share the same misconception. For an invoice calculation, write the rounding rule, currency unit, allowed negative values, and treatment of duplicate events before asking for code. Derive at least one expected result independently. Include boundary cases that challenge the rule, such as zero items, a refund, or values near a rounding boundary.

Property-based tests can explore more inputs, but a property is only useful if it expresses a real requirement. An assertion that a result is always nonnegative may be wrong for a valid refund. Contract tests can verify an interface while missing a business rule behind it. Combine methods according to the failure modes rather than assuming a particular testing label supplies complete assurance.

For external APIs, verify the documented version and response behavior. An assistant may suggest an obsolete parameter or a method from a different library. Pin dependencies through the normal review process and inspect newly introduced packages. A package name appearing in generated text is not evidence that the package is legitimate, maintained, or necessary.

## Permissions are part of the development lifecycle

A coding assistant that can read files, execute commands, or call services has operational authority beyond text generation. Define the minimum permissions for the task. Keep production credentials out of ordinary development sessions. Separate untrusted repository content from trusted instructions, and do not let a comment or issue body authorize an unrelated command or data transfer.

Review the execution boundary before enabling autonomous loops. A test command can invoke scripts that access the network or modify local state. An apparently harmless build may execute dependency hooks. Use isolated environments and approved credentials where appropriate, and preserve an audit trail of consequential actions. Human approval should be meaningful and attached to a concrete action, rather than a vague blanket acknowledgement at the beginning of a long session.

The same principle applies to deployment. Generating a patch, merging it, and releasing it are different authorities. Keep required review and release controls tied to the repository's risk model. An assistant can prepare evidence and automate routine checks without silently inheriting permission to alter a production service.

## A rollout worksheet for engineering leaders

Define the eligible task classes and the tasks that remain outside the initial trial. Name the owner of tool configuration, data handling, and incident response. State how engineers report a harmful or misleading output without being penalized for using the approved tool. A rollout that measures adoption while discouraging negative feedback will learn very little about actual risk.

Collect active implementation time, review effort, elapsed delivery time, rework, and qualitative feedback. Use aggregate results to improve the workflow rather than ranking individuals by prompt count. Pair the trial with a training exercise in which engineers explain a generated change, identify its assumptions, and modify it without relying on the assistant's explanation. The goal is retained understanding, not compliance with a tool-use quota.

Choose a stop condition. Examples include repeated introduction of unapproved dependencies, exposure of restricted material, or a review burden that exceeds the saved implementation effort. Choose an expansion condition too: representative tasks meet quality expectations, permissions are controlled, and the team can support the tool operationally. Record the decision and the evidence, including disappointing results.

## Maintain the system after adoption

Models, integrations, repository conventions, and developer habits change. Re-run a small stable evaluation set after material changes, while adding new cases from real failures. Keep old results associated with the exact configuration that produced them. A benchmark that silently changes tasks cannot show a clean trend.

Continue investing in readable code, tests, build reliability, and documentation. Those assets support both people and automated tools, and they remain useful if a vendor changes or the assistant is unavailable. The practical objective is a dependable delivery system in which machine assistance has a measured role. Generation speed is one input; the final decision rests on verified behavior, maintainable ownership, and the consequences of shipping the change.

## Sources and further reading

- [DORA · Software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
- [NIST · Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [NIST · AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
