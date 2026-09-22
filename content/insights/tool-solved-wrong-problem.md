---
title: "Most failed tool adoptions solved the wrong problem with the right tool."
description: "The pattern appears in most engineering organisations: a tool is evaluated, selected through a structured process, adopted with engineering investment, and then delivers minimal value or…"
date: 2028-12-20
tags: ["Engineering Leadership", "Architecture"]
format: article
derived: true
---

The pattern appears in most engineering organisations: a tool is evaluated, selected through a structured process, adopted with engineering investment, and then delivers minimal value or requires replacement within two years. The tool was not the problem. The problem definition was.

Tool selection processes tend to optimise for completeness of evaluation. They compare feature sets, pricing, vendor stability, integration ecosystem, and community size. These are legitimate criteria for tools where the requirement is clear. They miss the more fundamental question: what specific, measurable outcome are we trying to produce, and is that outcome actually produced by this class of tool?

Service mesh adoption is a representative example. A team identifies a security concern about inter-service communication and selects a service mesh to address it. After six months of implementation, the service mesh is running and adding measurable operational complexity. The security concern it was intended to address was actually a gap in API gateway authentication policy that the mesh does not directly fix. The root problem is still present; the team now also owns the mesh.

The failure was not the tool selection. It was the requirement definition. The specific security concern should have been articulated precisely — what threat, what attack surface, what data in scope. With that precision, the solution might have been mutual TLS at the gateway layer, a policy change in the identity provider, or network segmentation — all simpler than a full service mesh.

Requirements-first tool selection: define the outcome before opening a vendor comparison. The right tool for a clearly defined problem is usually obvious. The wrong tool for a vague problem is always expensive.
