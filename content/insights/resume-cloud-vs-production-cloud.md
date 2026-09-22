---
title: "There's a difference between the cloud technology you'd put on your CV and the one you'd run in production"
description: "Before adopting a technology, I've started asking two questions separately."
date: 2025-11-04
tags: ["Cloud Architecture", "Engineering Leadership"]
format: note
---

Before adopting a technology, I've started asking two questions separately.

First: is this technically interesting and would it be valuable to have on the team's résumé? Second: would I want to be the on-call engineer debugging this at 3am with a production incident in progress?

These questions are not the same, and they don't always have the same answer.

Genuinely new technologies are worth exploring. They often solve real problems that established tools handle poorly. But they come with: incomplete documentation, small communities, fewer colleagues who've seen the failure modes, and no established runbooks for incidents.

The most prudent architecture decision I've observed in practice was a team choosing Postgres over a distributed NoSQL store for a workload that would have worked fine on either — because the team understood Postgres deeply, had years of operational experience with it, and knew exactly what would happen when things went wrong. The distributed store was more interesting. The Postgres choice was more defensible.

The question "is this the right technology for the problem?" is incomplete. The full question is: "is this the right technology for the problem, given the team that will run it, the operational complexity we're willing to accept, and the support we'll have when it fails?"

Choose boring technology deliberately. It's a valid architectural decision, not a lack of ambition.
