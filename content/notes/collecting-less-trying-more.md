---
title: "A smaller reading list and a real experiment"
description: "An alternative to accumulating resources faster than they can become usable knowledge."
date: 2026-04-24
tags: ["Personal Practice", "Learning"]
format: article
---

A saved article is a pleasant object. It promises that a future version of you will understand the subject, perhaps on a quieter weekend with better coffee and fewer interruptions. Saving it takes seconds. The future reader inherits the obligation.

A growing collection can be useful. It can also become a record of postponed encounters rather than a source of learning. The distinction is not the number of bookmarks. It is whether the collection leads to questions, practice, or decisions that make the material usable.

One alternative is to collect less for a while and turn one item into a small experiment. The experiment need not be ambitious. It can be an attempt to explain a concept, reproduce a calculation, test an example, or notice whether a suggested practice fits the work you actually do.

## Give the material a job

Before adding another resource, ask what you want it to help you do. “Learn about distributed systems” is an interest. “Explain what happens when a client retries after losing a response” is a question that can shape a session.

A specific question makes it easier to choose the relevant part of a long resource. It also makes it possible to stop. You do not have to finish a whole book to resolve one uncertainty, and you do not have to pretend that resolving one uncertainty means understanding the whole field.

Some reading has no immediate job, and that is fine. Pleasure, surprise, and wandering are legitimate reasons to read. The useful move is to distinguish open exploration from deliberate practice so neither has to impersonate the other.

If everything is labelled essential, the label stops helping. Separate material for a current question from material you may want later. Let the later list remain optional. A bookmark is not a promise to its author or a debt owed to your future self.

## Turn an idea into something observable

Suppose a fictional reader saves an article about retry behaviour. A small experiment could use a local toy service that records an operation identifier and deliberately drops a response. The reader can then observe what happens when the client sends the same operation again.

The value lies in the question and the observation, not in building a miniature production platform. State what the example leaves out: concurrent callers, durable storage, authentication, and a network with more complicated failures. A bounded exercise can clarify a mechanism while remaining an incomplete model.

For a nontechnical essay, the experiment might be a conversation. If the essay recommends making requests more specific, rewrite one upcoming request with an explicit result and deadline. Notice whether the response becomes easier to act on. Do not infer a universal communication law from one interaction.

A calculation is another useful form. Recompute the example's numbers and change one input. If the conclusion changes, identify why. If it does not change, ask which input would matter. This turns a polished explanation into a model you can inspect.

## Keep the evidence small and honest

An experiment deserves a brief record of what you expected, what you tried, and what you observed. Keep interpretation separate. “The test returned the same stored result twice” is an observation. “The implementation is safe for every duplicate request” is a much larger claim.

Include enough detail to repeat the exercise. For code, that may mean the relevant version and command. For a worksheet, it may mean inputs and units. For a working habit, it may mean the setting and the limits of what you could observe.

You do not need a dashboard for every personal experiment. A short note can be enough. Excessive tracking can become another way to postpone contact with the material. The record serves the learning question; it should not become the main product unless the record itself is what you are practising.

Also record a result that did not help. A practice may be useful in one setting and awkward in another. That boundary is knowledge. Keeping only successful examples creates a personal archive that is encouraging but less trustworthy.

## Use recall to find the next question

After reading and trying the example, close the source and explain the idea without copying its language. What is the problem? What mechanism addresses it? What assumption makes the mechanism work? Where would you hesitate to use it?

[Cornell's description of retrieval practice](https://lsc.cornell.edu/how-to-study/studying-for-and-taking-exams/effective-study-strategies/) offers a simple starting point: put what you can recall onto a blank page, then inspect the gaps. The practice should include checking and correcting the account, not confidently preserving an error.

The gaps provide a better next reading list than general anxiety about being behind. You may need an explanation of one prerequisite, a counterexample, or a more realistic exercise. That is a smaller and more useful request than “send me everything on this topic.”

Sharing the explanation with another person can help if they are able to question it. Ask them to identify an unclear step rather than simply confirm that the summary sounds good. Fluency and understanding can overlap, but they are not the same thing.

## Try a one-resource week

Choose one resource already waiting in your collection. Write a question it might answer. Give yourself a manageable session to read the relevant section and produce one observable result: a calculation, a diagram, a local experiment, or a short explanation.

At the end, record what changed in your understanding and what remains uncertain. Decide whether the next useful action is another source, another attempt, or a pause. There is no requirement to turn every curiosity into a project.

If the resource is not useful, release it. Time spent discovering a mismatch can prevent more time being spent preserving it. The point is not to become ruthlessly efficient at reading. It is to let some of the material cross the distance between being available and becoming understood.

The [note on accumulating knowledge](/notes/on-accumulating-knowledge/) considers the broader collection. This practice gives one small part of that collection a chance to become something you can explain, test, and use.
