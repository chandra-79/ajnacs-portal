---
title: "On-Premises Nostalgia Is a Real Phenomenon — and Worth Taking Seriously"
description: "Engineers who miss on-premises infrastructure are not just being difficult. They are often identifying real problems with cloud operational models that have not been adequately addressed."
date: 2028-08-11
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
---

The conversation happens in retrospectives, in architecture reviews, in casual conversations at the end of a long production incident. Someone says: "When we ran this on our own hardware, we never had this problem."

The reflexive response — "cloud is better, you just need to learn to use it properly" — misses something genuine.

## What on-premises nostalgia is actually about

Engineers who express nostalgia for on-premises infrastructure are almost never nostalgic for hardware procurement, data center cooling, and firmware updates. They are nostalgic for specific properties of on-premises environments that cloud environments often do not have — or have in a different and less familiar form.

**Predictable latency.** A bare-metal server in a data center connects to its SAN with sub-millisecond latency that is consistent over time. An EC2 instance connecting to EBS has generally good latency that occasionally spikes for reasons that are invisible to the engineer. The unpredictability is more disorienting than the average latency.

**Complete control over the configuration.** On-premises, you can tune anything. Kernel parameters, network stack configuration, storage scheduling, interrupt affinity. Cloud environments expose a subset of these controls and hide the rest. When performance is mysteriously degraded and the cause is in the managed infrastructure layer, there is nothing to do but open a support ticket.

**Understandable failure modes.** Hardware failures — disk failure, RAM failure, NIC failure — are understood and documented. Cloud failure modes — noisy neighbor, hypervisor maintenance, EBS volume being throttled by another tenant — are less predictable and often not communicated in advance.

**Cost predictability.** A server costs what a server costs. Cloud costs vary with usage in ways that can be difficult to model accurately, especially in the first year.

## The productive response

Rather than dismissing the nostalgia, investigate what it is specifically pointing to. If an engineer misses on-premises, ask: what specifically was better? The answer usually identifies a real gap in the current cloud deployment that can be addressed — better observability, resource reservations that reduce noisy-neighbor effects, more thorough performance baselines.

The cloud is generally better for most workloads. "Generally better" still leaves room for specific operational properties that require deliberate effort to replicate. Take the nostalgia seriously enough to find out what it is actually about.
