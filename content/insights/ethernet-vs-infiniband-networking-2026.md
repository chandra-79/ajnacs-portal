---
title: "Ethernet vs. InfiniBand: Choosing the Right Network Fabric in 2026"
description: "A practical breakdown of when to use Ethernet and when InfiniBand makes sense — with key metrics, topology differences, and real-world guidance for cloud, HPC, and AI workloads."
date: 2026-10-02
tags: ["Systems", "Infrastructure", "Enterprise AI", "Cloud Architecture", "HPC"]
format: article
---

Choose the complete network stack against the job: fabric, host adapters, transport, collective runtime and operating team. For an installed cluster, placement and congestion policy can matter more to step time than the name of the transport.

## What to measure

Track application step time and a representative collective over the same nodes, ranks and buffers. Report port line rate in Gb/s, collective payload in GB/s, and whether a figure is one-way, bidirectional or aggregated. **Illustrative measurement.** For two fictional clusters the median collective step drops from 51 ms to 43 ms with the same job configuration. That comparison does not establish an advantage for every deployment of either fabric.

## Transport and topology

Ethernet supports many workloads and network designs. RDMA deployments can use RoCE, whose observed congestion and loss behaviour depends on the transport, adapters and switch configuration. Provision, configure and observe the path that the workload actually uses. The existing office network is not a stand-in for a dedicated GPU fabric.

InfiniBand defines a fabric and native RDMA capabilities. Port speed depends on generation and lane count. For example, a four-lane NDR port is rated at 400 Gb/s, while four-lane XDR is rated at 800 Gb/s. Payload transfer, host injection and collective completion must be checked separately.

Accelerator interconnects and cluster fabrics are distinct. An NVIDIA DGX H100 uses NVLink and NVSwitch within the system, and network interfaces for inter-node exchange. Read the cloud SKU: AWS EFA uses Scalable Reliable Datagram transport, while Azure ND H100 v5 documents dedicated InfiniBand per GPU. Compute configuration, topology and runtime determine whether a measured cross-cloud comparison is meaningful.

## Decide on evidence

Freeze the run configuration and record congestion, errors and buffer behaviour on the relevant network. Compare training-step distribution, fraction of step blocked on communication, cost for the completed job and recovery on a bad link. Repeat across a small and representative job size. Scale from the comparison without assuming a fixed GPU count at which one fabric becomes preferable.

## Sources

- [InfiniBand Trade Association specification update](https://infinibandta.org/wp-content/uploads/2026/08/Whats-New-in-Vol.-1-and-2-Release-2.1-2026-07-31.pdf)
- [NVIDIA DGX H100 system guide](https://docs.nvidia.com/dgx/dgxh100-user-guide/dgxh100-user-guide.pdf)
- [AWS EFA](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html)
- [Azure ND H100 v5](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series)
