---
title: "Read the footnotes before repeating the headline"
description: "A practical habit for separating a useful claim from the conditions that made it true."
date: 2026-11-24
tags: ["Personal Practice", "Critical Reading"]
format: article
---

A headline travels well because it leaves things behind. The experimental setup stays in the paper. The workload stays in the benchmark repository. The exclusions stay beneath the chart. By the time a claim reaches a meeting, it may have become a sentence that sounds applicable everywhere.

Reading the footnotes is a way of putting some of that context back. It does not require distrusting every author or refusing to learn from summaries. It requires noticing when a summary is about to become evidence for a decision it was never designed to support.

The important question is often simple: under what conditions was this result obtained, and how close are those conditions to the ones that matter here? That question can turn an exciting number into a useful lead. It can also reveal that the number is answering a different question entirely.

## Follow the claim to its original shape

When an article says a technique is faster, find out what “faster” measures. Is it elapsed time for one request, total throughput, training time, developer effort, or something else? A result can be accurately reported and still be irrelevant to the problem in front of you.

A hypothetical benchmark might report that one parser processes a file in two seconds and another in four. That supports a comparison for the tested file and configuration. It does not by itself show that an entire application will become twice as fast, because parsing may occupy only a small part of the application's work.

Even the small comparison needs context. Were both runs warm? Were errors handled the same way? Did the input fit in memory? Was the measurement repeated? Were the implementations doing equivalent work? These questions are not reasons to dismiss the benchmark. They identify what would need to be reproduced.

When the source is available, prefer the original paper, documentation, dataset, or repository over a chain of articles repeating the same sentence. Several repetitions are not several independent observations. They may all lead back to one narrow experiment.

## Read the denominator

Percentages are especially good at travelling without their luggage. A failure rate needs a denominator. A cost reduction needs a baseline and a boundary. A completion rate needs a definition of who was eligible and what counted as complete.

Imagine a fictional onboarding report with eight successful deployments from ten attempts. The completion rate is 80% for that defined group. If two people abandoned the process before an “attempt” was recorded, the experience of everyone who started is different. The arithmetic may be correct while the definition hides an important part of the journey.

A cost claim can have the same problem. A lower bill may reflect lower usage. A lower cost per request may reflect more retries. The [cloud unit-cost guide](/insights/cloud-unit-economics/) shows why the chosen business outcome belongs beside the numerator. A number becomes more useful when its construction is visible.

Do not assume that a missing denominator proves dishonesty. Summaries have limited space and authors make mistakes. Ask for the missing definition before deciding what the claim means. If it cannot be obtained, treat the number as a prompt for investigation rather than a settled basis for action.

## Look for what was excluded

A study's limitations are part of its result. They may explain which population was observed, which cases were removed, or which mechanisms were not tested. A careful author who states those limits is giving the reader material for judgment.

Read the exclusions before using the conclusion to describe a different setting. A classroom exercise may suggest a useful learning practice without establishing how it works for every professional task. A single organisation's operating model may offer insight without being a universal staffing prescription.

There is a difference between uncertainty and uselessness. Evidence with boundaries can still be valuable. The task is to apply it at the right strength. “This is worth testing in our setting” is often a more defensible conclusion than either “this proves it” or “this proves nothing.”

Also notice the date and the version. A technical statement can be accurate for a named release and wrong for the system now in use. Keep the version attached when you share the claim. Historical context should not be silently converted into present-tense advice.

## Make the evidence easy to revisit

A useful reading note can be short. Record the claim in your own words, the original source, the relevant conditions, and the question it helps answer. Add a separate line for your interpretation. This keeps the source's finding from merging with the conclusion you drew from it.

If the material contains a chart, note the units and the population before noting the dramatic shape. If it contains code, record whether you ran it and what you changed. If it contains a recommendation, identify whether it is supported by measured results, experience, or an argument about design.

You do not need to perform this process for every interesting sentence. Use it when the claim will travel into a proposal, a lesson, an architecture choice, or a public article. The more consequential the reuse, the more valuable a traceable path becomes.

That path also makes correction easier. When a result is challenged or updated, you can find the notes and decisions that depend on it. Without the path, the claim can persist as organisational folklore long after its original conditions have been forgotten.

## Try one claim, not an entire reading backlog

Choose a number you recently repeated. Find its earliest accessible source. Write what was measured, against what baseline, over what population or workload, and under which limitations. Mark any field you cannot establish rather than filling it with a plausible guess.

Then rewrite the sentence you would use in a conversation. Keep the useful finding and attach the condition that most affects its interpretation. If that makes the sentence less dramatic, that may be the cost of making it more informative.

The diagram here is a route from headline to decision, not a hierarchy of respectable reading. Summaries remain useful entrances. The habit is to know when you need to go through the door. For a wider approach to reading without turning everything into collection, continue with [the note on reading](/notes/on-reading/).
