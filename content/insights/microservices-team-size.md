---
title: "Microservices scale with teams. Monoliths scale with databases. Know which problem you have."
description: "The microservices debate has produced more opinion than clarity, largely because the participants are arguing from different team sizes and different ownership models without…"
date: 2026-03-23
tags: ["Architecture", "Engineering Leadership"]
format: article
---

The microservices debate has produced more opinion than clarity, largely because the participants are arguing from different team sizes and different ownership models without acknowledging the difference.

Microservices are a solution to a specific class of problem: the coordination cost of multiple teams working in a shared codebase. When ten teams deploy to the same application, every release is a negotiation about what is included, who has tested what, and whose changes get held back because another team's changes aren't ready. Service boundaries replace code boundaries with team boundaries, giving each team an autonomous deployment unit they control.

This is a team scaling benefit. It has a real technical cost: distributed systems introduce network latency, partial failure modes, data consistency challenges, and debugging complexity that monoliths avoid. A distributed system that does not need to be distributed pays that cost for no benefit.

The technical case for microservices — performance at scale — is real but narrower than the adoption suggests. Most applications are not at a scale where monolithic deployment creates a technical ceiling. The teams that adopted microservices for technical reasons at sub-large scale often discover that the operational overhead exceeds the technical benefit. The teams that adopted them for team autonomy reasons at appropriate scale find that the operational overhead is a fair price for independent deployment capability.

The starting question: how many teams will own this system, and do those teams need independent deployment cadences? If the answer is one team with one cadence, the architectural pattern that is fastest to build and easiest to operate is the right answer, regardless of its label.
