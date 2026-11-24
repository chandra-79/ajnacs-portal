---
title: "HPC Network Topology Patterns: Fat-Tree, Torus, and Dragonfly Explained"
description: "The network topology of an HPC or AI training cluster determines its bandwidth, latency, cost, and how well it scales. Here's how fat-tree, torus, and dragonfly topologies work, their trade-offs, and which workloads each suits best."
date: 2026-10-30
tags: ["Systems", "HPC", "AI & MLOps"]
format: article
---

A topology specifies which paths exist. The application's communication pattern, routing and the placement of work determine whether it can use them efficiently. A sensible comparison starts with the job and its busiest phases.

## What to measure

Run a matched comparison of local and global transfers, placement, payload size and offered load. Report median and p95 by job and the most contended path. **Illustrative measurement.** In a fictional comparison p95 falls from 92 µs on an oversubscribed fixture to 41 µs on a matched nonblocking configuration. State which resources the traffic exercises before extending that conclusion.

## Fat-tree

A correctly provisioned fat-tree can provide full bisection bandwidth. That is an aggregate capability across a partition. It does not eliminate host injection limits, unbalanced path choice or congestion from shared links. A rank in a ring all-reduce exchanges data with neighbours, while other collectives use tree or hierarchical patterns. Compare placement and oversubscription for the communication actually performed.

## Torus

A torus extends a mesh with wraparound links. A conventional k-ary d-dimensional torus has up to 2d distinct neighbours per node in the usual case. Very small dimensions can share neighbours. Mapping a grid-like workload to adjacent nodes can keep traffic local. Global exchanges can compete for the same links over longer routes.

## Dragonfly

A Dragonfly uses groups of routers with local connections and sparse global links between groups. Canonical minimal routes in the design can traverse at most three router-to-router links, with at most one global hop. Adaptive detours may travel farther to avoid congestion. Check per-group placement and global link usage under job mixes that the system will see.

## Rails and placement

Multiple rails can increase aggregate line rate if the hosts and runtime can stripe useful traffic across them. Four identical rails give a four-times line-rate ceiling, not a four-times application guarantee. Check failure behaviour explicitly. Train a scheduler to respect the fabric's placement assumptions before relying on a benchmark from ideal placement.

## Sources

- [Al-Fares et al., A Scalable, Commodity Data Center Network Architecture, SIGCOMM](https://doi.org/10.1145/1402958.1402967)
- [Kim et al., Technology-Driven, Highly-Scalable Dragonfly Topology, ISCA](https://research.google/pubs/technology-driven-highly-scalable-dragonfly-topology/)
- [NVIDIA NCCL Tests, bandwidth definitions](https://github.com/NVIDIA/nccl-tests/blob/master/doc/PERFORMANCE.md)
