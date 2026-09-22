---
title: "Vendor lock-in is not always a mistake. Sometimes it's the correct trade."
description: "The anti-lock-in argument is intuitively appealing and frequently overstated."
date: 2025-06-24
tags: ["Cloud Architecture", "Architecture", "Engineering Leadership"]
format: note
derived: true
---

The anti-lock-in argument is intuitively appealing and frequently overstated.

The real cost of vendor lock-in is the cost of migration: the work required to move from one provider to another. If that migration never happens — and for most organizations it doesn't — the lock-in cost is theoretical. The cost of the abstraction layer you built to maintain portability is actual.

The services that are most likely to bind you to a vendor are also often the services most worth using: managed databases, serverless compute, fully managed data pipelines. They reduce operational overhead, often significantly. The equivalent self-managed setup requires people, expertise, and time that could go elsewhere.

The right question is not "does this create lock-in?" but "what would migration actually cost, and what is the realistic probability we'd need to migrate?" For most workloads, the managed service wins the expected-value calculation even accounting for the lock-in premium.

Make the trade consciously — understanding what you are giving up and why — rather than avoiding lock-in reflexively and paying for portability you will likely never use.
