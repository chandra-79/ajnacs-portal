---
title: "Your staging environment is lying to you and you've learned to live with it"
description: "The gap between staging and production is well understood and consistently underestimated. Every engineering team knows their staging environment isn't production-faithful."
date: 2025-07-14
tags: ["DevSecOps", "Engineering Leadership"]
format: note
---

The gap between staging and production is well understood and consistently underestimated. Every engineering team knows their staging environment isn't production-faithful. Most have developed a cultural acceptance of this gap and adjusted their expectations accordingly — which means they've also accepted that some class of bugs will only be discovered by production users.

The gaps that cause the most incidents: data volume (a query that runs in 100ms against 10,000 rows in staging runs in 12 seconds against 50 million rows in production), concurrency (race conditions and locking issues that only appear under real traffic patterns), and third-party integration differences (staging pointed at sandbox APIs that have different error rates and latency characteristics than production APIs).

The honest approach is not to build a better staging environment — it's to change what you're trying to validate where. Staging is appropriate for functional correctness checks: does the feature do what it's supposed to do? Production-level validation requires production: feature flags that enable gradual rollout, canary deploys that expose a small percentage of traffic to new code, and monitoring that catches regressions quickly rather than after they affect most users.

Testing in production deliberately, with controls, is safer than trusting staging to validate production behavior. The teams that have accepted this are less surprised by production incidents.
