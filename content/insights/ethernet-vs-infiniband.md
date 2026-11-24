---
title: "Compare Training Fabrics Through the Communication Workload"
description: "Compare AI network fabrics through collective communication, congestion and workload requirements, with explicit synthetic bandwidth arithmetic."
date: 2029-05-16
tags: ["Systems", "Enterprise AI", "Infrastructure"]
format: note
derived: true
---

A distributed training job can have well-provisioned accelerators and still spend substantial time waiting for communication. The relevant question is how much communication lies on the measured step's critical path.

Ethernet and InfiniBand offer different deployment and operating choices:

→ **Ethernet** has a broad ecosystem and can support RDMA through RoCE v2 when the adapters, fabric configuration and software path support it. Cost and effective performance depend on the selected equipment and topology.

→ **InfiniBand** provides an RDMA-capable fabric used in HPC and distributed training. Compare a specific adapter and switch generation, port configuration and topology; an aggregate switch-capacity number is not interchangeable with per-port bandwidth or application latency.

The decision most enterprise teams actually face isn't "which do I buy" — it's "do I know which fabric my cloud instance is using underneath, and am I tuning my distributed training jobs for the right constraints?"

For either fabric, verify which transport the job actually selects and benchmark the communication pattern that limits useful throughput.

## Measure the collective that limits the step

Fabric choice depends on topology, effective bandwidth, latency, congestion handling, software support and operational constraints. Ethernet is not automatically unsuitable for training, and an InfiniBand label alone does not establish that the application uses the network efficiently. Compare the actual distributed workload and communication library configuration.

For a hypothetical training step, computation takes 180 milliseconds and non-overlapped communication takes 120 milliseconds. The step takes 300 milliseconds. Halving communication time yields 240 milliseconds, a 20% step-time reduction and a throughput increase of 300/240 = 1.25 times. It does not double training throughput because the compute portion is unchanged. If communication overlaps with computation, this additive model overstates the exposed communication cost.

## A reproducible comparison

Hold model size, batch size, worker count, precision, placement and software versions constant. Record effective collective bandwidth, step latency, utilization and errors. Test more than one message size because small control traffic and large gradient transfers stress different aspects of the fabric. Inspect the communication library's selected transport and interfaces rather than assuming that the instance description determines the active path.

Introduce a constrained link or a slow worker only in a controlled test environment. Observe whether the slowdown appears as collective waiting, congestion or application imbalance. Compare cost per completed training step and recovery behavior as well as peak bandwidth. A fabric decision is useful when the measured communication pattern justifies its cost and the team can operate it reliably.

### Figure methodology

Synthetic non-overlapped model: 180 ms compute + 120 ms communication = 300 ms; halving communication gives 240 ms. Throughput rises 1.25×, assuming unchanged batch and compute work.

| Worked observation | milliseconds |
| --- | ---: |
| Original step | 300 |
| Faster communication | 240 |

## Primary references and further study

- [NVIDIA NCCL user guide](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/index.html)
- [NCCL troubleshooting and transport checks](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/troubleshooting.html)
