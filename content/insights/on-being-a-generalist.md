---
title: "The engineering generalist: connecting evidence across boundaries"
description: "Build useful depth in adjacent domains and help specialists reason from a shared timeline and clear interface assumptions."
date: 2029-06-11
tags: ["Engineering Leadership"]
format: article
derived: true
---

The specialist-generalist tension in engineering careers is often framed as a choice between depth and breadth, as though one person cannot have both. A useful senior generalist combines depth in selected domains with enough adjacent knowledge to ask precise questions. The generalist framing undersells what they actually bring.

The function of the senior technical generalist in a complex organisation: they are the people who recognise that the latency problem the networking team is investigating is caused by a data access pattern the database team introduced, which was triggered by a product change the application team shipped without a corresponding infrastructure review. The interaction becomes easier to examine when someone brings the separate observations into one shared model.

This function requires going deep enough in multiple domains to understand where the seams are. Someone who knows distributed systems well enough to design message queue architectures and knows databases well enough to understand replication lag and knows application architecture well enough to trace a call graph can help coordinate the diagnosis of cross-domain problems. That combination of depth is not shallow breadth — it is a different and more demanding accumulation.

The career development implication: engineers who deliberately expand their depth into adjacent domains become more valuable as systems grow in complexity, not less. The path requires resisting the specialisation pressure long enough to develop genuine competence in a second or third domain. The short-term cost is being less maximally expert in the first domain. The long-term value is the ability to see the full system.

## Investigate the seam before choosing a specialist

Cross-domain work often begins with an ambiguous symptom. A request is slow, but the time may be spent in application code, waiting for a database connection, transferring data or retrying a downstream call. The generalist's first contribution is to construct a shared timeline and identify which specialist can test the next hypothesis. This does not require pretending to know every implementation detail.

Ask each domain owner for its clock and unit. A database duration measured inside the server is not the same as the client-observed time, which can include connection acquisition and network delay. A queue's message age differs from worker processing time. Misaligned definitions can make two accurate dashboards appear to disagree. Write down the boundaries before interpreting the difference.

## A fictional latency decomposition

Suppose a traced request takes 500 milliseconds end to end. Instrumentation attributes 80 milliseconds to application work,120 to waiting for a connection and 300 to the database call. These are non-overlapping intervals for this simplified example. The chart focuses on the 120-millisecond wait and 300-millisecond call because they suggest different investigations. A faster query may help the call; a connection leak or inappropriate pool size may explain the wait.

Real traces can contain overlapping asynchronous spans, missing instrumentation and clock uncertainty. Do not add every span duration blindly. Identify the critical path and reconcile the measurement with the end-to-end observation. The fictional decomposition is a worksheet for reasoning, not a claim about the behavior of a particular database or network.

## Build depth through a bounded investigation

Choose one neighboring domain that repeatedly affects your work. If application incidents often involve database behavior, learn how to read an execution plan, distinguish a lock wait from CPU work and identify the safe way to test a hypothesis. Pair with a database specialist on an example that has a known answer. Ask them to explain the failure modes of the diagnostic method, not merely the successful command.

Produce a short interface note: what the domain guarantees, what it does not, which observations are trustworthy and when to escalate. Use it in a later investigation and revise it when reality contradicts the model. This creates depth that can be tested through work, rather than breadth measured by the number of tools listed on a profile.

## Make collaboration the outcome

A generalist should not become the person who attends every meeting because nobody else understands the system. Share the integrated model and make ownership clear. Bring the right specialists together with a precise question, evidence and an agreed next experiment. Record which decisions remain inside each domain and which require coordination.

Specialists can and often do reason across boundaries; generalists can also miss important details. The roles describe emphasis, not fixed limits on intelligence or value. A healthy team can combine deep expertise with people who connect the pieces. Evaluate the contribution by whether uncertainty was reduced, the right people could act and the resulting system behavior was understood. Breadth is useful when it improves those outcomes, not when it becomes a claim to outrank specialist judgment.

## Sources and further reading

- [AWS · Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Google SRE Workbook · Incident Response](https://sre.google/workbook/incident-response/)
