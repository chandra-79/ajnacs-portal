---
title: "The cloud bill without a named owner grows until it becomes a crisis"
description: "Cloud spend without a named owner follows a predictable arc. In the early months it's small enough that nobody prioritises it."
date: 2029-05-28
tags: ["FinOps", "Engineering Leadership"]
format: note
derived: true
---

Cloud spend without a named owner follows a predictable arc. In the early months it's small enough that nobody prioritises it. Then it's growing but the growth is attributed to scaling — reasonable, expected, not worth interrupting the team over. Then it's large and the technical debt of accumulated waste (ghost VMs, over-provisioned instances, forgotten dev environments, duplicate resources) is significant to address. By the time leadership asks why the cloud bill is three times the original projection, the archaeology is daunting.

Every cost item that became waste was visible in a billing console at some point. It was visible when the project ended and the VMs stayed running. It was visible when the reserved instances weren't being used. It was visible when the developer provisioned a test database and it became permanent.

The reason it wasn't acted on is that acting on it wasn't anyone's job.

FinOps is a function, not a tool. Someone needs to own cloud spend visibility, review it regularly, route findings to accountable teams, and drive the conversations that close the gap between current and optimal spend. This function can be a dedicated team in a large organization or one person's 20% time in a smaller one. Either way, it needs to be a named accountability — not a shared assumption that someone else is watching.

If nobody owns it, it grows. That's not a cloud problem, it's an organizational design problem.
