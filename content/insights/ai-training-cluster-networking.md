---
title: "AI Training Cluster Networking: Architecture for Large-Scale Model Training"
description: "Training large models at scale requires network architecture that most data centres aren't built for. Here's how to think about the networking stack for AI training clusters — topology, bandwidth requirements, collective operations, and the trade-offs between InfiniBand and high-speed Ethernet."
date: 2026-03-27
tags: ["Systems", "AI & MLOps", "HPC"]
format: article
---

Training large language models and diffusion models at scale is a fundamentally different networking problem from running web services. The workload characteristics are different: very high bandwidth between adjacent nodes, synchronisation points that require all nodes in a group to communicate simultaneously, and sensitivity to network variance that doesn't matter in loosely-coupled microservice architectures.

A slow network in a web service deployment slightly increases response time. A slow network in a distributed model training job slows the entire job to the speed of the slowest link, because all nodes must synchronise at each gradient exchange.

## Why training clusters need different networking

Distributed training breaks a model's computation across multiple GPUs and nodes. Two dominant parallelism strategies:

**Data parallelism**: each GPU trains on a different batch of data with the same model parameters. After each batch, gradients are synchronised across all GPUs via an all-reduce collective. The bandwidth requirement scales with model size — for a model with billions of parameters, the all-reduce requires exchanging hundreds of gigabytes per step, hundreds of times per second.

**Tensor/pipeline parallelism**: for models too large to fit in a single GPU's memory, the model itself is split across GPUs. Layers or tensor slices are distributed. Each forward pass requires data to move from one GPU to the next in the pipeline, and from one rank to another for tensor-parallel operations. Latency between adjacent stages directly adds to step time.

Both patterns require:
- **High bandwidth**: enough to exchange gradients without becoming the training bottleneck
- **Low latency**: especially for tight synchronisation points in pipeline and tensor parallelism
- **Low variance**: a single slow link in a ring all-reduce makes every GPU wait for the slowest link

## Topology for training clusters

**Fat-tree / Clos topology**: the standard for large-scale training. A three-tier Clos (leaf-spine-core or ToR-aggregate-core) provides full bisection bandwidth — any-to-any communication at full line rate. For training clusters, full bisection bandwidth ensures that inter-node communication doesn't bottleneck regardless of which nodes are assigned to a job.

**Rail-optimized topology**: a specialised topology for training at scale. Multiple independent networks (rails) connect all nodes, and the training framework distributes all-reduce traffic across rails. A 4-rail design with 400GbE links per rail provides 1.6 Tbps of aggregate bandwidth per node — comparable to multi-rail NVLink bandwidth within a node. Used by large-scale cloud AI clusters (AWS Trainium, Google TPU pods).

**InfiniBand non-blocking fabric**: InfiniBand topologies (fat-tree with HDR/NDR) are non-blocking within the fabric — a switch can forward traffic from all ports simultaneously at line rate. Many HPC and AI training clusters use InfiniBand with EDR (100 Gbps), HDR (200 Gbps), or NDR (400 Gbps) links.

## InfiniBand vs. RoCE at training scale

**InfiniBand** remains the preferred choice for the largest training clusters:
- Native RDMA without the Ethernet compatibility overhead
- SHARP (Scalable Hierarchical Aggregation and Reduction Protocol) performs in-network all-reduce — the reduction happens in the switches, reducing the volume of data that needs to traverse the network
- Consistent, predictable latency
- Managed fabric with centralised subnet management

**RoCE** (RDMA over Converged Ethernet) is viable at scale with proper configuration:
- Requires lossless Ethernet (Priority Flow Control + DCQCN)
- Works with standard Ethernet switching infrastructure
- Increasingly competitive with InfiniBand at 400GbE for many training workloads
- Cloudscale AI clusters (AWS, Microsoft, Google) use RoCE in various configurations

The performance gap between InfiniBand and high-speed RoCE has narrowed at 400GbE speeds. For new buildouts without existing InfiniBand infrastructure, RoCE on 400GbE Ethernet is often the more economical choice when combined with good switch silicon (Spectrum-4, Tomahawk 5).

## Intra-node interconnect: NVLink and NVSwitch

Within a node, GPU-to-GPU communication uses NVLink rather than PCIe. NVLink Gen4 (used in H100) provides 900 GB/s total GPU-to-GPU bandwidth within a node via NVSwitch — orders of magnitude more than PCIe would provide.

This asymmetry (high-bandwidth intra-node, relatively lower-bandwidth inter-node) drives the tensor/pipeline parallelism decomposition strategy: operations that require frequent, high-volume communication (tensor-parallel) stay within a node; operations that require less frequent synchronisation (data-parallel all-reduce) span nodes.

## Bandwidth requirements in practice

A rule of thumb for all-reduce bandwidth requirements in data-parallel training:

```
Required network bandwidth (per node) ≈ (2 * model_parameters * bytes_per_parameter) / step_time
```

For a 70B parameter model with bf16 (2 bytes) and a target step time of 1 second:
```
(2 * 70e9 * 2) / 1 = 280 GB/s per node
```

This exceeds what even 400GbE can provide — which is why large model training uses multiple nodes per NVLink domain (tensor parallelism within nodes) to reduce the inter-node all-reduce volume, and why SHARP in-network reduction (which reduces traffic on the switches) is valuable.

## Storage networking for AI workloads

Training clusters need fast access to training data (petabyte-scale datasets) and checkpoint storage. The storage network is often separate from the training interconnect:

- **Training data**: parallel file systems (GPFS, Lustre, WekaFS) or object storage (S3, GCS) with high-throughput access. Storage bandwidth needs to keep all GPUs fed without bottlenecking on data loading.
- **Checkpoints**: regular writes of model state to durable storage. Checkpoint frequency and size (hundreds of GB for large models) determine storage I/O requirements. NVMe over Fabrics (NVMe-oF) or high-throughput object storage are common patterns.

*Designing networking for an AI training cluster or evaluating whether your existing infrastructure is suitable? [Happy to compare configurations.](/contact)*
