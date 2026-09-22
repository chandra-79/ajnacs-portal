---
title: "Vendor lock-in anxiety is usually worse than the lock-in itself."
description: "Vendor lock-in anxiety is usually worse than the lock-in itself."
date: 2026-05-26
tags: ["Cloud Architecture", "Engineering Leadership"]
format: note
---

Vendor lock-in anxiety is usually worse than the lock-in itself.

I've worked on multi-cloud architectures built primarily to avoid lock-in. In most of them:
- The portability layer added more complexity than the original lock-in would have
- The teams never actually needed to migrate
- The abstraction reduced access to the managed services that would have solved real problems

That said — there are real lock-in risks worth managing: proprietary data formats at scale, network egress costs, and non-portable governance configurations.

The question isn't "can we avoid lock-in?" It's "what are the specific risks, and are they worth the cost of the portability layer?"

Most of the time, a deliberate commercial strategy with a strong exit clause is better engineering than a portable-by-default architecture you'll never use.
