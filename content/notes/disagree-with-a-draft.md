---
title: "Disagree with the draft while it is still cheap to change"
description: "Why early, specific criticism can be kinder than late approval followed by a preventable failure."
date: 2026-02-13
tags: ["Personal Practice", "Collaboration"]
format: article
---

There is a courteous way to waste someone's week: read an early proposal, notice a serious concern, and offer only encouragement. The author continues, the work becomes polished, and the concern finally appears when changing direction is much more expensive.

Silence may have felt considerate in the moment. Perhaps the idea was unfinished, the author was enthusiastic, or the reviewer did not want to sound difficult. But an unfinished idea is often precisely when a useful disagreement can do the most good.

The challenge is to disagree with enough specificity that the author can improve the work, and enough care that the criticism does not become a judgment of the person. “This isn't right” supplies little help. “The recovery plan assumes access that the on-call role does not have” gives the draft something concrete to address.

## Tell the author what kind of review you are giving

A draft can invite many different kinds of feedback. The author may need a challenge to the central argument, a technical correctness check, or a review of the explanation. If the purpose is unclear, reviewers can spend time polishing sentences in a proposal whose premise has not been tested.

Ask which decision the draft should support and what is still open to change. A useful review request can say that the author wants objections to the assumptions before investing in implementation. That invitation lowers the chance that a fundamental concern will be mistaken for an unwelcome detour.

The reviewer should also state the boundary of their review. If you checked the data model but did not examine the security implications, say so. Approval of one part should not silently become approval of the whole artifact.

This is especially important when a person's title gives their comments more authority than intended. A casual “looks good” from a senior colleague may be copied into a decision record as sign-off. Use language that matches the review actually performed.

## Put the concern beside its consequence

A useful objection has a location, a reason, and a consequence. Identify the sentence, diagram, assumption, or missing case. Explain what appears incorrect or unsupported. Then say what could happen if it remains unchanged.

In a fictional training plan, the draft might ask learners to deploy an application before they have credentials for the environment. The concern is not that the lesson is “too ambitious.” It is that a prerequisite is missing and the exercise cannot begin for the intended audience. That framing makes the remedy easier to discuss.

Offer a possible correction when you have one, but do not pretend that every valid concern requires a complete replacement design. A reviewer can identify an untested assumption without knowing the best solution. The author should not have to accept the reviewer's preferred architecture merely to acknowledge the problem.

Distinguish errors from preferences. A command that deletes the wrong directory is not equivalent to a preference for a different heading style. Marking everything as equally important makes the author do extra work to find the criticism that matters.

## Use a counterexample carefully

A small counterexample can expose a weakness more clearly than a broad statement. If the draft says a process works for every request, show one legitimate request it does not handle. If the proposed metric is meant to represent customer outcomes, show a case where the metric rises while the outcome worsens.

Keep the counterexample within the intended scope. An exotic condition that the author has explicitly excluded may be interesting without invalidating the proposal. The review should test the actual claim, not the most expansive claim that could be imagined from its vocabulary.

Also allow the author to supply missing evidence. A concern can turn out to be addressed in a linked design or a test result the reviewer has not seen. Revision may then require making that evidence easier to find rather than changing the design itself.

The aim is a more accurate shared account. A review becomes less useful when the participants start protecting their original interpretation of the draft. Both the document and the review can be corrected.

## Make early criticism easier to receive

A rough draft should not be judged as if it were a finished publication. Missing transitions and awkward wording may be expected at the stage when the author is testing a central idea. Focus the review on the uncertainty that matters now.

Describe what is already working when it helps preserve useful structure. “The recovery sequence is clear; the ownership of the final check is missing” gives the author a boundary for revision. Empty praise at the top of a long objection list is less helpful than a precise account of what can remain.

Choose the conversation's setting with care. A public review is appropriate when the work needs shared technical scrutiny. A sensitive concern about how an example represents a person may deserve a private discussion first. Kindness includes choosing a route that serves the correction rather than the reviewer's visibility.

The related [note on feedback](/notes/on-feedback/) addresses the exchange more broadly. In draft review, the special opportunity is timing: the work is still flexible, and a specific concern can prevent a much larger disappointment later.

## Try a three-comment review

Take an early draft and limit the first pass to three consequential comments. One should identify the most important assumption. One should ask for evidence or a missing case. One should name the clearest next improvement. This is a constraint for focus, not a permanent limit on necessary review.

Write each comment so that the author can tell what action would answer it. Avoid questions whose only acceptable response is agreement with your preference. If the concern is nonnegotiable because of a requirement, name that requirement directly.

After the revision, acknowledge what changed and close resolved comments. A review should converge. Reopening settled preferences indefinitely can make collaboration feel like a moving target.

The accompanying diagram follows a concern from a specific place in the draft through evidence and revision to closure. The reward is not winning the argument. It is helping the work become stronger at the moment when strengthening it costs least.
