---
title: "Ethernet vs. InfiniBand for AI Training: Why the Network Fabric Matters More Than You Think"
description: "Most AI infrastructure decisions focus on GPUs and storage. Network fabric is the variable that determines whether your training cluster runs at 90% efficiency or 40%."
date: 2025-03-25
tags: ["Systems", "Enterprise AI", "Infrastructure"]
format: article
---

The question for a distributed training run is how long communication delays useful work. A fabric may have ample nominal bandwidth and still show slow job steps because of rank placement, collective configuration, congestion, or a slow host.

## What to measure

Measure the application's step time and a representative collective with the same ranks and message sizes. Record the type of collective, placement, topology, and whether communication overlaps compute. **Illustrative measurement.** A fictional p95 collective completion time of 39 ms versus 32 ms describes only the two configurations tested.

## Why the traffic estimate matters

A conventional ring AllReduce with N ranks and a gradient buffer of S bytes per rank sends about 2(N−1)S/N per rank, with comparable receives. One rank follows the ring's neighbour exchanges. This estimate assumes that each rank participates with the full buffer. Sharded state, hierarchical algorithms, gradient bucketing and multiple ranks per host change the bytes crossing each NIC.

At 128 ranks, a hypothetical 400 GB full buffer on each rank gives about 794 GB sent per rank per collective. Dividing the full buffer by 128 would describe a different assumption about data ownership. Specify the placement and the collective before estimating traffic on a host link.

## Select a system to test

InfiniBand and RDMA-capable Ethernet deployments each have transport, NIC and software requirements. Cloud providers expose different implementations and topologies. AWS EFA uses its own transport, and Azure ND H100 v5 documents dedicated InfiniBand networking. For a cloud selection, get the exact instance configuration and run a matched collective and training-step replay before comparing cost per useful step.

## Sources

- [NVIDIA NCCL Tests performance methodology](https://github.com/NVIDIA/nccl-tests/blob/master/doc/PERFORMANCE.md)
- [AWS Elastic Fabric Adapter](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html)
- [Azure ND H100 v5 topology](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series)
