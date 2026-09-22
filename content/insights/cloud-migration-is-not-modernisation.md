---
title: "Lifting and shifting to the cloud is relocation, not modernisation"
description: "Lift-and-shift is a legitimate cloud migration strategy. But when organizations call it \"cloud transformation,\" they're setting expectations that a server relocation cannot meet."
date: 2025-10-20
tags: ["Cloud Architecture", "Infrastructure"]
format: note
derived: true
---

Lift-and-shift is a legitimate cloud migration strategy. But when organizations call it "cloud transformation," they're setting expectations that a server relocation cannot meet.

Moving a VM from your data centre to Azure IaaS gives you: managed hardware, geographic redundancy, and a pay-per-hour cost model. It does not give you: elastic scaling, managed service economics, modern observability, or the operational agility that cloud-native architectures enable.

Lift-and-shift has real use cases. Data centre exits with hard deadlines. Legacy applications where the refactoring risk exceeds the value of modernisation. A deliberate first step before a planned re-architecture. In these contexts it's the right call.

The problem is when it becomes the destination rather than a waypoint. A VM running a monolithic application on Azure is the same monolithic application — it just costs more because you're paying for compute you previously owned, and the operational muscle memory that made it manageable in the old environment doesn't transfer cleanly.

The modernisation work — infrastructure as code, shift to managed services, event-driven architecture, automated testing, observability — that's what changes how a team operates. That work doesn't happen automatically when you change where the server runs.

Cloud transformation is an operational change. The infrastructure move is a prerequisite, not the thing itself.
