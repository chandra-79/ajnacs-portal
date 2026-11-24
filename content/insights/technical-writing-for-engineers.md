---
title: "Technical Writing for Engineers: The Highest-Leverage Skill Nobody Teaches"
description: "The design doc that prevents the wrong build, the incident report that changes the system, the PR description that gets a real review — writing is engineering leverage, and it's learnable as a craft. The genres, the discipline of the reader-first draft, and the AI-era premium on judgment."
date: 2028-09-20
tags: ["Developer Experience", "Engineering Leadership", "Engineering Practice", "Documentation", "Communication"]
format: article
---

Ask senior engineers what unexpectedly determined their impact and a surprising fraction name the same thing: writing. Not because prose is a soft skill adjacent to the real work, but because at scale *the writing is a control surface* — the design doc routes a quarter of engineering effort toward or away from the right build, the incident report either changes the system or gets filed, the RFC either aligns five teams or spawns the meeting series that replaces it, and the PR description either earns a real review or gets the rubber stamp that ships the bug. This series has repeatedly located leverage in written artifacts — ADRs, runbooks, postmortems, contracts, the async-collaboration substrate — and it's worth addressing the underlying skill directly, because it's a *craft* with learnable moves, not a talent you have or lack.

## The genres, because they have different jobs

Engineering writing isn't one skill but a handful, each with a shape the reader expects (the documentation-quadrant insight, generalized): **the design doc / RFC** — persuasion plus specification, whose job is to make a proposal *criticizable before it's expensive*: context and constraints first, the decision and its rationale, the alternatives *fairly* considered (the strawman-alternatives tell reveals a doc arguing rather than thinking — and reviewers smell it), the risks named by the author (naming your own weak points is what earns trust and better review, per the diligence-honesty signature). **The incident report / postmortem** — narrative plus analysis, whose job is *organizational learning*: the timeline as spine, the mechanism explained so a newcomer understands, the contributing factors traced without the blame that makes the next author defensive (the blameless discipline is a *writing* discipline as much as a cultural one), and remediation as owned commitments, not aspirations. **The PR description** — the underrated one: what changed, *why*, and how to verify — a small investment that can reduce repeated clarification and determine whether review is substantive or ceremonial (the code-review economics start here). **The status update / decision record** — compression as a service, whose job is letting readers *not* attend the meeting (the async-collaboration currency). Knowing which genre you're in — and giving the reader its expected shape — is half the craft; the design doc written as a stream of consciousness and the postmortem written as a defense both fail by ignoring what their reader came for.

## The one discipline underneath all of them

If there's a single transferable move, it's this: **write for the reader's context, not from your own.** The author knows the whole problem; the reader arrives cold, busy, and skeptical — and most bad engineering writing is the author's discovery process transcribed (the order they figured it out) instead of the reader's comprehension path (the order they need to receive it). The concrete techniques all serve this inversion: **BLUF — bottom line up front** (the conclusion, decision, or ask in the first lines; the reader who stops after the first paragraph should still get the point — the pyramid principle that respects that most readers *do* stop early), **one idea per paragraph, structured for skimming** (headers, short paragraphs, the key sentence first — because technical readers skim before they read, and writing that punishes skimming gets abandoned — the same attention-scarcity math from the context-engineering chapter, applied to human readers), **concrete over abstract** (the example before the principle; "the query scans 400M rows" over "performance concerns"), **precision as respect** (the ambiguous sentence spawns the clarifying thread that costs a day at async latency — the vague requirement is a bug with a delayed fault, per the collaboration-cost queueing), and **ruthless deletion** (the second draft's job is removing the words the first draft needed to think — length is not thoroughness, and the reader's time is the scarce resource you're spending). The craft is mostly *revision*: nobody writes the reader-first version first; they write the author-first version and then invert it, and the willingness to do that second pass is what separates writing that lands from writing that's merely correct.

## The organizational and AI-era stakes

Two forces raise the premium. **Organizationally**, writing scales where speaking doesn't: the well-written doc informs a thousand readers across time zones and years (the async substrate, the searchable commons), while the brilliant verbal explanation informs the six people in the room once — which is why remote and large organizations run on documents, and why "communicates clearly in writing" belongs in the promotion rubric for senior engineers as a *leverage* competency, not a nicety (and why teaching it — through review of writing, not just code — is an underinvested management move). **In the AI era**, the calculus sharpens counterintuitively: assistants make *drafting* nearly free — the blank-page tax, the first-pass structure, the polish — which relocates the scarce, human, valuable part to exactly where it always lived: *knowing what's true, deciding what matters, and judging what to cut.* Difficulty writing can arise from many causes, including unclear reasoning, language barriers, accessibility needs, or lack of practice, and the generation tools don't do that thinking — they do the typing, which frees more attention for the judgment, which means the writing-as-thinking skill got *more* valuable, not less (the generation-versus-judgment inversion, at the level of the individual keyboard). The tools also raised the *reader's* expectations (fluent text is now free, so fluency stopped being a signal) and the premium on the things they can't fake: correctness, specificity, hard-won context, and the courage to write the honest risk section.

The closing frame, in the spirit of the series: writing is where an engineer's understanding becomes leverage — the mechanism by which one person's clear thinking routes many people's effort, and the artifact that outlives the meeting, the sprint, and the author's tenure. It's learnable (write the author's draft, then invert it for the reader; lead with the point; cut what you needed to think but they don't need to read), it compounds (every clear doc raises the baseline and trains the next writer), and it's the rare skill the AI era made *more* central by automating everything around it except the part that was always the point. The best engineers aren't necessarily the best writers — but clear writing can help engineers extend their impact, because they learned that difficulty explaining a system can reveal gaps worth investigating, and the writing is where you find out.

## Start with a reader and a task

Before drafting, write down who will read the document and what they should be able to do afterward. A new operator restoring a service needs prerequisites, commands, expected results, and escalation. An architect reviewing a proposal needs constraints, alternatives, and consequences. A product leader choosing a release scope needs a decision and its tradeoffs. These readers may use the same underlying evidence while needing different documents.

Inventory the knowledge the reader can reasonably be assumed to have. Define domain-specific terms when they first appear, and link stable background material rather than repeating a textbook in every proposal. Avoid relying on a team's internal nickname for a service when the document must survive personnel changes. A glossary can help, but it should not become a substitute for clear sentences.

Choose the artifact's lifetime. An incident update may be accurate for thirty minutes; an architecture record may remain useful for years as a historical explanation. Put timestamps and status where they matter. A document can be obsolete as an instruction while still valuable as a record of what was believed at the time. Label that distinction rather than silently rewriting history.

## Worked example: ambiguity creates support work

Imagine a hypothetical deployment guide used twenty times in a month. In twelve attempts, readers need an additional ten-minute clarification from a maintainer, creating 120 minutes of support effort. After adding a prerequisite check and an example of the expected output, only four attempts need the same ten-minute clarification, creating forty minutes. The chart compares 120 and forty support minutes for the same twenty uses.

The difference is eighty support minutes, or about 66.7%. This is synthetic arithmetic, not a measured improvement or a general return on documentation. It excludes the author's revision time, reader waiting, and differences in reader experience. If the revised guide took three hours to produce, the first month's support reduction alone would not repay that effort. The value might still be justified by safer operation or continued use, but those benefits need separate evidence.

To study a real guide, record the task, document version, point of confusion, clarification needed, and completion outcome. Do not collect unnecessary personal information. A small usability session can reveal a specific unclear step without producing a statistically representative estimate of all users. Publish the method and sample limitations if the result appears in a public article.

## Make instructions executable by a reader

A procedure should identify prerequisites before the first action that depends on them. State the environment, permissions, and versions assumed. Show commands in code blocks and distinguish literal values from placeholders. Explain what success looks like after a consequential step. A command returning exit status zero may still leave the service unusable; include the behavioral check that matters.

Put warnings next to the action they qualify. If a command deletes data, the reader should see the scope and recovery requirements before running it. Avoid burying that information in a general introduction several screens away. For production operations, link to the organization's approved change and access process. A public example should use disposable resources and make its boundaries clear.

Test the procedure from the reader's starting state. Authors often have cached credentials, existing directories, or environment variables that the guide never mentions. A clean environment exposes those hidden prerequisites. Ask another engineer to follow the document while narrating what they expect, then revise the confusing steps. The exercise tests the document, not the reader's intelligence.

## Explain decisions with evidence and alternatives

A decision document should distinguish facts, assumptions, and preferences. A measured latency distribution is evidence. A projected growth rate is an assumption unless supported by a forecast with a stated method. A team's preference for a language may matter for maintainability, but it is not a performance benchmark. Naming the category makes the reasoning easier to review.

Describe alternatives fairly. Include the strongest plausible reason to choose each one and the condition under which it would become preferable. A rejected option is useful to future readers when its rejection depends on a constraint that may later change. If the only alternative described is obviously absurd, the document probably has not tested the recommendation seriously.

Use a small worked example to expose the mechanism. For a retry policy, show the total request budget and the delays between attempts. For a storage decision, show capacity, retention, and recovery assumptions. Keep units visible. A chart should identify its data origin and formula so that visual polish does not make an illustrative scenario look like observed evidence.

## Edit for navigation as well as sentences

Headings should answer the questions readers bring. A heading such as “Recovery prerequisites” is more useful in a runbook than “Important considerations.” Descriptive link text helps readers decide whether to follow a reference and supports assistive technologies. Do not use color alone to distinguish mandatory from optional actions. Provide a text explanation of any diagram whose meaning is necessary to the task.

Separate reference information from a tutorial when their purposes diverge. A tutorial can guide a learner through a safe example in a controlled order. A reference should make individual facts easy to retrieve without reading the entire page. Combining both into one long narrative can make the tutorial hard to follow and the reference hard to search.

Keep the document near the code or workflow that changes it when practical. Assign an owner and a review trigger, such as an API version change or an incident that exposes a missing step. A calendar review can catch neglect, but a change-triggered review is often more directly connected to correctness. Remove or redirect duplicate instructions so readers can identify the authoritative version.

## Use assistance without outsourcing truth

A writing assistant can suggest structure or identify an ambiguous sentence. Verify every technical statement, command, citation, and example against the actual system. Fluent prose can conceal a missing premise. Do not let an assistant invent an incident, customer outcome, or numerical result to make the article more persuasive. Label hypothetical examples and preserve the distinction between explanation and evidence.

For a practical exercise, take one existing page and ask a colleague to complete its intended task. Record where they stop, what they infer incorrectly, and which information they search for elsewhere. Revise only the parts that obstruct the task, then repeat the attempt with the updated version. The outcome is a document that works for its reader, which is a more meaningful standard than word count, polish, or the author's confidence.

## Sources and further reading

- [Google · Technical writing courses](https://developers.google.com/tech-writing/overview)
- [Google · Audience](https://developers.google.com/tech-writing/one/audience)
- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
