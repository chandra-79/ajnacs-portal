---
title: "Writing Technical Documents That Actually Get Read"
description: "Most technical documentation is never read after it's written. The documents that get read and used share structural and stylistic patterns. Here's what distinguishes useful technical writing from documentation theater."
date: 2028-05-15
tags: ["Engineering Leadership"]
format: article
---

Technical documentation is often treated as overhead — something that gets done after the real work is finished, quickly, and mostly as proof that it happened. The result is documents that are accurate at the time of writing, complete by some definition, and never consulted again.

Documentation that gets read has different properties. It is structured for the reader's purpose rather than the writer's convenience. It is specific about what it covers and what it doesn't. It is written to answer the questions a reader will actually have.

## The question a reader is trying to answer

Every technical document has a primary reader purpose. Understanding that purpose shapes every structural decision.

**Reference documentation** (API docs, configuration options, CLI flags): the reader knows what they want; they need to find it and understand the exact specification. Structure alphabetically or by function. Completeness matters more than narrative.

**Conceptual documentation** (architecture overviews, how a system works): the reader is building a mental model. Structure around concepts and their relationships, not implementation details. Analogy and diagram are more useful than code samples.

**Tutorial or how-to guide**: the reader wants to accomplish a specific goal. Structure sequentially; every step must produce an observable result. Error states and how to recover from them are as important as the happy path.

**Runbook or incident response guide**: the reader is under pressure and needs to take action quickly. Structure for scanning, not reading. Action steps before context. Explicit decision points. The reader will not read this document the way they would read an article.

Writing the wrong type of document for the reader's purpose is the most common documentation mistake. An architecture overview that reads like a reference manual, or a runbook that reads like a tutorial, fails the reader even if all the information is technically present.

## Structure that aids navigation

Technical documents are rarely read front to back. Readers scan headings to find the section relevant to their question, then read that section.

**Headers as navigation**: headers should describe what the section answers, not what topic it is about. "Deployment" as a header requires the reader to scan the section. "How to deploy to production" gets them there immediately.

**The inverted pyramid**: put the most important information first. The reader who stops after two paragraphs should have gotten the essential point. Context and nuance follow.

**Short paragraphs**: a paragraph containing eight sentences covering two topics will be skimmed faster than two focused paragraphs of four sentences each. Long paragraphs signal "this requires slow reading," which defers reading to a later time that often doesn't come.

**Examples before explanation**: a concrete example is easier to understand than an abstract explanation. Show what something does, then explain the rule.

## Precision over completeness

The instinct to be comprehensive produces documents that cover every edge case and caveat in the same prose, at the same depth, without indicating which cases are common and which are rare.

Write for the common case. Handle edge cases with callouts or dedicated sections. A reader working through the 80% case should not wade through caveats that apply to 5% of situations.

Explicit scope statements help: "This guide covers deploying to Azure Container Apps with a managed identity. Deployment to Kubernetes is covered in the Kubernetes guide." The reader who needs the other case is directed; the reader who needs this case is not distracted.

## Maintenance and decay

Documentation decays. A document that was accurate when written becomes less accurate as the system it describes changes. Stale documentation is worse than no documentation because it is misleading rather than absent.

The practices that slow decay:

**Documentation close to the code**: documentation in the repository, adjacent to the code it describes, is more likely to be updated when the code changes. Documentation in a separate wiki is easily forgotten during code review.

**Minimal documentation**: write the smallest document that serves the reader's purpose. Less surface area means less to maintain. Remove documentation that no longer applies rather than leaving it as outdated context.

**Dated content for temporary guidance**: "as of March 2026, the recommended approach is..." signals to the reader that this may change and to check whether it is still current.

**Documentation as part of the definition of done**: code review that includes a documentation check — does the PR update any relevant documentation? — catches the most common decay source.

*Working on improving your team's technical documentation practices or writing standards? [Happy to compare what works and what gets ignored.](/contact)*
