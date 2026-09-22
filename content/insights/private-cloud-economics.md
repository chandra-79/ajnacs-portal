---
title: "Private cloud economics only work when someone actually does the accounting"
description: "Private cloud cost justifications usually compare hardware acquisition cost plus data centre expenses against public cloud on-demand pricing."
date: 2026-04-29
tags: ["Cloud Architecture", "FinOps", "Infrastructure"]
format: note
---

Private cloud cost justifications usually compare hardware acquisition cost plus data centre expenses against public cloud on-demand pricing. This comparison consistently underestimates the total cost of private cloud and overestimates the savings.

The costs that appear in the business case: hardware, rack space, power, network infrastructure, and perhaps an initial licensing cost for the hypervisor.

The costs that don't appear: the engineering team required to build and maintain the platform (often 3–6 engineers for a medium-scale deployment), the operational overhead of patching, capacity planning, hardware failure management, and upgrades. The opportunity cost of those engineers not building product or improving reliability elsewhere. The support contracts that accumulate over a 5-year hardware lifecycle. The cost of incidents that a managed service would have prevented or handled without engineering escalation.

When these costs are included, private cloud frequently exceeds public cloud for workloads with variable demand, and breaks even only for steady-state, high-utilisation workloads at scale — exactly the scenario where private cloud's economics are legitimately favourable.

Private cloud CAN be the cheaper option, for the right workloads, at the right scale, with a well-run platform team. But "it'll be cheaper than cloud" as an assumption rather than a calculated result, with all costs included, is an assumption that turns into a surprise over a three-year budget cycle.

Do the accounting before committing the capital.
