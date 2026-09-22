---
title: "Ethernet vs. InfiniBand for AI Training: Why the Network Fabric Matters More Than You Think"
description: "Most AI infrastructure decisions focus on GPUs and storage. Network fabric is the variable that determines whether your training cluster runs at 90% efficiency or 40%."
date: 2025-03-25
tags: ["Systems", "Enterprise AI", "Infrastructure"]
format: article
---

The GPU cluster is provisioned. 256 A100s. Expensive, powerful, and sitting at 42% GPU utilization during distributed training.

The bottleneck is not the GPUs. The bottleneck is the network.

## Why distributed AI training is a network problem

Modern large model training uses distributed data parallelism or tensor parallelism, which requires frequent synchronization of gradients or activations across GPUs. The synchronization involves a lot of data moving very fast:

A GPT-scale model with 100 billion parameters has approximately 400GB of gradient data (in FP32) that needs to be averaged across all nodes after each backward pass. With 128-node training, each node sends and receives approximately 6GB per step. At 1,000 steps per minute, that is 100GB/s of sustained bidirectional traffic per node.

Standard 100GbE (100 gigabit Ethernet) provides approximately 12.5 GB/s unidirectional. The arithmetic does not work.

## InfiniBand vs. Ethernet: the real differences

**InfiniBand HDR (200 Gb/s)** — the standard for serious AI training infrastructure — provides:
- 200 Gb/s bandwidth per port (25 GB/s)
- Sub-microsecond latency (1–2 microseconds)
- RDMA (Remote Direct Memory Access) — data moves directly between GPU memory on different nodes without CPU involvement
- Congestion control designed for HPC all-reduce patterns

**High-speed Ethernet (400GbE RoCE)** — the cloud-friendly alternative:
- 400 Gb/s bandwidth (50 GB/s) on current-generation switches
- 2–5 microsecond latency
- RDMA over Converged Ethernet (RoCE v2) — requires careful ECN configuration to avoid congestion collapse
- Available in all major cloud providers (AWS EFA, Azure InfiniBand, GCP GPUDirect TCPX)

## The practical implication for training efficiency

All-reduce communication efficiency (the collective operation that averages gradients) degrades sharply with latency and becomes network-bound when bandwidth is insufficient. The MFU (model flops utilization) of a training run on InfiniBand-connected H100s is typically 40–50% higher than the same run on standard Ethernet-connected nodes.

This means:
- Training the same model takes 40% more calendar time on Ethernet
- Using 40% more GPU-hours
- Spending 40% more on compute cost

At the scale of serious training runs — weeks to months of GPU time — 40% is not a small difference.

## The cloud context

AWS Elastic Fabric Adapter (EFA), Azure InfiniBand, and GCP GPUDirect all provide high-speed fabric options in their GPU instances. Using a P4d or P5 instance on AWS without placing instances in a cluster placement group and enabling EFA leaves the high-speed fabric unused. The instance has the capability; the configuration has to explicitly use it.

The engineers who optimize GPU selection and storage and then deploy on standard instance networking are leaving a large fraction of the cluster's performance unused.
