---
title: "RoCE vs iWARP: Choosing the Right RDMA Technology for Your Workload"
description: "Both RoCE and iWARP provide RDMA over Ethernet, but they have different network requirements, loss behavior, and operational characteristics. Here's how to choose between them for AI training, HPC, and storage workloads."
date: 2026-11-02
tags: ["Systems", "HPC", "AI & MLOps"]
format: article
---

RDMA (Remote Direct Memory Access) bypasses the operating system kernel and CPU for network data transfers, allowing applications to directly read and write remote memory. For workloads where inter-node latency and CPU overhead matter — AI training collectives, high-performance storage, financial trading infrastructure — RDMA provides advantages that conventional TCP/IP networking can't match.

Two RDMA-over-Ethernet technologies dominate: RoCE (RDMA over Converged Ethernet) and iWARP (Internet Wide Area RDMA Protocol). They solve the same problem differently and have meaningfully different operational requirements.

## RoCE: high performance, demanding network

RoCE maps InfiniBand transport directly to Ethernet. There are two versions:

**RoCEv1** operates at Layer 2 — it requires hosts to be in the same Ethernet broadcast domain. Not suitable for routed networks.

**RoCEv2** operates at Layer 3 — it adds UDP/IP encapsulation, enabling routing across subnets. Most modern RoCE deployments use RoCEv2.

### Performance characteristics

RoCE offers latency and throughput close to native InfiniBand. For all-reduce operations in distributed AI training, RoCE with 400GbE NICs (ConnectX-7 or similar) delivers throughput that approaches the theoretical maximum of the link.

### The lossless Ethernet requirement

RoCE's critical operational requirement: **it requires a lossless Ethernet fabric**. RoCE transport does not have TCP's retransmission and congestion control mechanisms — if a packet is dropped, the RDMA operation fails.

Lossless Ethernet is achieved with Priority Flow Control (PFC), which enables hardware-level flow control per priority class. When a switch's ingress buffer approaches full for a given priority, it sends a PAUSE frame to the upstream device, which stops transmitting that priority class. This prevents drops.

PFC operates correctly only when configured consistently across the entire fabric:
- All switches need PFC enabled on the RDMA priority
- QoS marking must be consistent end-to-end
- Buffer configurations need to be tuned for the link speed and cable distance

PFC misconfiguration causes PFC storms — a feedback loop where pause frames propagate across the fabric and cause cascading congestion. This is not a theoretical risk; PFC storms are a known failure mode in poorly configured RoCE networks. DCQCN (Data Center Quantized Congestion Notification) mitigates this by adding explicit congestion feedback, but it requires additional configuration.

### When RoCE is the right choice

- Collocated clusters where you control the full network fabric
- Environments already using Mellanox/NVIDIA NICs (native RoCE support)
- AI training clusters where maximising collective throughput is the priority
- Environments willing to invest in the operational discipline to maintain lossless Ethernet

## iWARP: TCP-based, tolerant of lossy networks

iWARP runs RDMA over standard TCP/IP. The operating system TCP stack handles retransmission and congestion control; iWARP adds RDMA semantics on top.

### Performance characteristics

iWARP's reliance on TCP introduces overhead that RoCE avoids. Latency is higher than RoCE, particularly at small message sizes where TCP header processing is a larger proportion of the total work. Throughput at large message sizes approaches line rate, since TCP overhead is proportionally smaller.

For CPU-to-CPU RDMA operations at low message sizes (common in storage and some HPC patterns), the latency difference between RoCE and iWARP is measurable and operationally relevant.

### Operational simplicity

iWARP works on standard Ethernet infrastructure without PFC or special QoS configuration. You can deploy iWARP over a standard data center network without modifying the fabric. This is the significant operational advantage.

Loss tolerance: iWARP handles packet loss through TCP retransmission. A packet drop degrades throughput (due to retransmission and congestion window reduction) but doesn't fail the operation. For WAN-extended storage workloads or environments with mixed traffic sharing the network, this matters.

### When iWARP is the right choice

- Environments where the network fabric isn't fully under your control
- Storage protocols over RDMA (NVMe-oF, iSER) where loss-tolerance is more valuable than peak latency
- Environments with mixed workloads sharing Ethernet where lossless configuration is impractical
- WAN deployments where lossless Ethernet isn't possible

## Decision criteria summary

| Criterion | RoCE | iWARP |
|-----------|------|-------|
| Latency (small messages) | Lower | Higher |
| Peak throughput | Higher | Similar for large messages |
| Network requirements | Lossless Ethernet (PFC) | Standard Ethernet |
| Loss tolerance | None without DCQCN | Yes (TCP) |
| Operational complexity | Higher | Lower |
| AI training (all-reduce) | Preferred | Viable |
| Storage over RDMA | Viable | Common |
| WAN deployment | Not suitable | Viable |

## NVIDIA/InfiniBand as an alternative

For large-scale AI training clusters, InfiniBand (rather than either RoCE or iWARP) is often the preferred choice at the scale where collective performance is critical. InfiniBand is a purpose-built RDMA fabric that avoids the Ethernet compatibility complications entirely. HDR/NDR InfiniBand (200/400 Gb/s) with SHARP (in-network reduction) offloads all-reduce operations to the network switches, reducing both latency and CPU overhead compared to any Ethernet-based RDMA solution.

For enterprises building AI training infrastructure on existing Ethernet networks, RoCE with proper PFC/DCQCN configuration is the pragmatic path to InfiniBand-comparable performance.

*Designing a networking fabric for AI training or HPC? The topology and technology choices compound on each other. [Happy to think through the trade-offs.](/contact)*
