---
title: "AI Training Cluster Networking: Architecture for Large-Scale Model Training"
description: "Training large models at scale requires network architecture that most data centres aren't built for. Here's how to think about the networking stack for AI training clusters — topology, bandwidth requirements, collective operations, and the trade-offs between InfiniBand and high-speed Ethernet."
date: 2025-04-08
tags: ["Systems", "AI & MLOps", "HPC"]
format: article
---

A training job uses a fabric for latency-sensitive exchanges between accelerators, and storage paths for reading training data and writing checkpoints. Plan both from the job's communication pattern. A link rating cannot tell you whether the scheduler places active ranks onto healthy paths.

## What to measure

Measure representative training-step time, collective duration and checkpoint throughput. Keep model configuration, tensor shapes, rank count, software and placement comparable. **Illustrative measurement.** A synthetic pilot shows an 830 ms median step before changes and 620 ms in an isolated-fabric replay. Profile overlap before assigning the entire improvement to networking.

## Estimate communication by participant and boundary

In replicated data parallel training, gradients commonly pass through all-reduce. A standard ring with N participants moves approximately 2(N−1)S/N bytes sent per rank for a rank's S-byte buffer, plus receives. This describes algorithmic traffic, not bytes crossing one physical host link. With multiple GPUs per host, a hierarchical collective can combine traffic within the host before it reaches the network. Tensor and pipeline parallelism use different communication schedules. Check the implementation, rank topology and the reported counters.

A platform may publish a per-GPU NVLink aggregate, such as the 900 GB/s figure for the H100 platform configuration, while a network worksheet describes nominal one-way NIC line rate. Four 400 Gb/s links provide 1.6 Tb/s, or 200 GB/s nominal aggregate one-way line rate, before protocol overhead and placement limits. Keep direction, link count, host versus rank and usable payload explicit before comparing units.

## Evaluate the fit

1. Record accelerators, NICs, rank placement and collective library settings, then run a representative sweep of collectives and payload sizes.
2. Repeat under an expected background workload and a controlled link impairment. Compare the slowest rank and job-step tail against the average.
3. Watch checkpoint bursts, metadata operations and restart time. Confirm that storage and control paths are separated or provisioned for measured contention.
4. Document what operators can see when a rail is unhealthy and how the runtime behaves. Never assume failover or full link-striping from hardware count alone.

## Sources

- [NVIDIA NCCL collective reference](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html)
- [NCCL Tests bandwidth definitions](https://github.com/NVIDIA/nccl-tests/blob/master/doc/PERFORMANCE.md)
- [PyTorch DistributedDataParallel design](https://docs.pytorch.org/docs/stable/notes/ddp)
- [NVIDIA HGX system components](https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory-h100-h200-b200/latest/components.html)
