---
title: "RoCE vs iWARP: Choosing the Right RDMA Technology for Your Workload"
description: "Both RoCE and iWARP provide RDMA over Ethernet, but they have different network requirements, loss behavior, and operational characteristics. Here's how to choose between them for AI training, HPC, and storage workloads."
date: 2026-11-02
tags: ["Systems", "HPC", "AI & MLOps"]
format: article
---

Compare RDMA implementations against a working application, supported NICs, and the network behaviour your team can monitor. RDMA changes how applications move data and interact with the host networking stack. It cannot eliminate contention or buffer limits.

## What to measure

Replay comparable transfers with equal endpoints, payload distribution, queue depths and offered load. Measure p99 completion time under a controlled incast and report timeouts, retransmissions, CPU overhead and application impact. **Illustrative measurement.** The fictional profiles below produce 128 µs and 102 µs under one defined stress pattern.

## RoCE

RoCEv2 transports RDMA packets over UDP/IP. Reliable-connected RoCE supports retransmission. A common design uses Priority Flow Control for a lossless priority and ECN with a congestion-control algorithm such as DCQCN. These perform different jobs. PFC pauses a priority, while congestion control reacts to congestion feedback. Some hardware and configurations support lossy RoCE operation. Check the supported mode and the experience of the team operating it.

Test congestion in both the port and the receiver, including what happens after one busy flow interrupts others. Review pause duration, congestion markings and NIC retry counters under incast.

## iWARP

The iWARP RDMAP stack commonly uses TCP via its lower-layer mapping. TCP implements retransmission and congestion mechanisms. Offload can put much of that work on an RDMA-capable NIC. Check host, adapter and application support before selecting it. Test its response to loss and delay on the actual path.

## Decision

Compare approved hardware, workload latency, network features, driver support, telemetry and failover. An existing Ethernet fabric can affect rollout cost. A dedicated InfiniBand option deserves the same application test and recovery exercise if it is a viable candidate.

## Sources

- [IETF RFC 5040, RDMAP](https://www.rfc-editor.org/rfc/rfc5040)
- [Zhu et al., Congestion Control for Large-Scale RDMA Deployments, SIGCOMM](https://www.microsoft.com/en-us/research/publication/congestion-control-large-scale-rdma-deployments/)
- [Mittal et al., Revisiting Network Support for RDMA, SIGCOMM](https://arxiv.org/abs/1806.08159)
- [NVIDIA Cumulus Linux, RoCE modes](https://docs.nvidia.com/networking-ethernet-software/cumulus-linux-519/Layer-1-and-Switch-Ports/Quality-of-Service/RDMA-over-Converged-Ethernet-RoCE/)
