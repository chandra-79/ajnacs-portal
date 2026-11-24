---
title: "Translation is part of technical leadership"
description: "How to carry a concern across disciplines without flattening the meaning or making yourself a permanent interpreter."
date: 2026-11-24
tags: ["Personal Practice", "Collaboration"]
format: article
---

Two teams can use the same word and discuss different things. “Available” may mean a service responds, a dataset is approved for use, or a person has capacity. “Ready” may mean code is merged, controls are checked, or support can handle the release. A conversation can sound aligned while its participants are planning for different conditions.

Translation is part of technical leadership because work crosses these boundaries constantly. The task is not to simplify everything until nobody objects. It is to preserve the important meaning while making it understandable enough for another discipline to act on.

A good translator also tries to make future translation less dependent on them. If every conversation requires one person to interpret the organisation to itself, that person becomes both valuable and a bottleneck. Shared examples, definitions, and decisions can distribute the understanding.

## Start with the consequence

An infrastructure team may describe a constraint in terms of capacity, queue depth, or a recovery window. A product team may need to understand which customer action will be delayed and what choice is required before a launch. Both accounts can be correct, but neither automatically answers the other's question.

Begin by connecting the technical condition to the consequence relevant to the listener. Then preserve the mechanism underneath it. “A delayed payment confirmation may cause customers to retry; the retry path must recognise the same order” carries more useful meaning than either an unexplained technical term or a vague warning that the system is risky.

The direction also runs the other way. A business request that sounds like a cosmetic change may carry a contractual or operational requirement. Ask what the requester needs to be true, who will rely on it, and what failure would mean. Translate that need into observable acceptance conditions before proposing implementation.

This is a collaborative act. The translator should check the account with the people whose concern is being represented. Otherwise translation can become a confident distortion that neither side recognises.

## Keep important distinctions intact

Plain language does not require pretending that two different measures are interchangeable. Cost, price, revenue, and margin are not synonyms. A successful request is not necessarily a completed business outcome. A backup is not proof of recovery.

When a distinction changes the decision, explain it with a small example. In a hypothetical order system, several technical attempts can belong to one customer order. Counting all attempts as successful business output would make the reported unit cost misleading. The [cloud cost-per-unit guide](/insights/cloud-unit-economics/) develops that distinction with a worked calculation.

Examples help because they give both teams something concrete to inspect. They also reveal where the simplification stops working. A shared example should include a boundary or failure case, not only the smooth path that makes the explanation easy.

Avoid using an analogy beyond the relationship it was meant to explain. A queue resembles a line of waiting work in one respect; the analogy may conceal retries, priorities, or parallel workers. Say what the analogy clarifies and return to the actual mechanism when the decision requires more detail.

## Translate uncertainty as well as conclusions

A message often loses its uncertainty as it travels upward or across teams. “The early test suggests this may fit” becomes “engineering confirmed it.” The final statement is easier to plan around and less faithful to the evidence.

Carry the qualification that matters. Name whether a result is measured, estimated, simulated, or proposed. Explain which condition has not been checked and what action will resolve it. The listener should not have to infer confidence from the speaker's tone.

A useful update might say that the component passed a small test, the representative workload remains untested, and a decision is expected after that test. That gives planning a real dependency instead of a false certainty.

This does not mean surrounding every sentence with hedging. Some facts are established and some decisions are made. Be direct about those. Precision includes knowing where a qualification is necessary and where it merely obscures a clear result.

## Build a shared object

Repeated verbal explanation is often a sign that the teams need something they can look at together. A short diagram, a sample record, an acceptance example, or a decision note can become that shared object.

Choose the object around the disagreement. If teams differ about ownership, draw the boundary and the handover. If they differ about “done,” write one example that should pass and one that should fail. If they differ about a metric, show its inputs, exclusions, and calculation.

The object should be small enough to correct in conversation. A polished presentation can make revision feel expensive. A plain example invites people to point to the exact part that does not match their understanding.

After agreement, place the object where both teams can find it. Assign an owner for changes and identify which other material depends on it. Translation becomes reusable when the resulting understanding survives the meeting.

## Practise with one overloaded word

Choose a word that appears repeatedly in your team's conversations: ready, critical, supported, secure, done, available. Ask two people from different roles to describe a concrete situation that meets the word and one that does not.

Compare their examples without deciding immediately which definition wins. They may be describing different legitimate requirements. Write a more specific phrase for each requirement and show how they relate. “Ready for testing” and “ready for customer use” can both remain useful if their boundaries are clear.

Try the revised language in the next planning discussion. Notice whether it changes the questions people ask or the assumptions they make. If the confusion persists, the issue may be an unresolved responsibility rather than vocabulary alone.

The diagram here follows meaning from the originating concern through a concrete example into an agreed condition. Translation is complete when the receiving team can act and the originating team recognises what has been carried across. The person doing the translating should eventually be able to step away without taking the shared understanding with them.
