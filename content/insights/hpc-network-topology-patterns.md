---
title: "HPC Network Topology Patterns: Fat-Tree, Torus, and Dragonfly Explained"
description: "The network topology of an HPC or AI training cluster determines its bandwidth, latency, cost, and how well it scales. Here's how fat-tree, torus, and dragonfly topologies work, their trade-offs, and which workloads each suits best."
date: 2026-10-30
tags: ["Systems", "HPC", "AI & MLOps"]
format: article
---

The network fabric of a high-performance computing cluster isn't just cabling — it's an architectural decision that determines the performance ceiling of every job that runs on it. The topology defines how bandwidth scales with cluster size, how much any-to-any communication costs, and how many switches and cables you need.

Three topologies dominate HPC and AI training infrastructure: fat-tree, torus, and dragonfly. Each makes different trade-offs between bandwidth, diameter (maximum hops between any two nodes), cost, and engineering complexity.

## Fat-tree: full bisection bandwidth, high cost

Fat-tree (also called Clos or folded Clos) is the most widely deployed topology for data centres, HPC clusters, and large-scale AI training. The name comes from the original Leiserson fat-tree paper, though the implementation used in practice is the three-tier Clos: edge (top-of-rack) switches connected to aggregation switches connected to core switches.

The defining property: **full bisection bandwidth**. Any half of the nodes can communicate with the other half at full line rate simultaneously. Any-to-any communication between any two nodes uses the same bandwidth — there's no penalty for communicating with a non-adjacent node.

**Why this matters for distributed training**: all-reduce collective operations require every node to communicate with every other node in the group. Full bisection bandwidth means these operations don't become network-bottlenecked regardless of which nodes are assigned to a job.

**The cost**: scales as O(N log N) in switch ports. A fat-tree for N nodes requires significantly more switches than sparser topologies. At 10,000+ nodes, the cabling complexity is substantial.

Variants:
- **2-tier Clos** (leaf-spine): simpler, used in smaller deployments
- **3-tier Clos**: standard for larger HPC clusters; 10,000+ nodes
- **Non-blocking vs oversubscribed**: full fat-tree is non-blocking (full bisection bandwidth); oversubscribed fat-tree (e.g., 2:1 at the spine) reduces cost at the expense of bisection bandwidth

InfiniBand and high-speed Ethernet deployments at hyperscalers predominantly use fat-tree variants.

## Torus: low diameter, bandwidth penalty for non-local traffic

A torus connects nodes in a multi-dimensional grid where each node connects directly to its neighbours, and the edges of the grid wrap around to connect to the opposite edge (making a torus rather than a flat grid).

A 3D torus: each node has 6 neighbours (left/right, front/back, up/down) and wraps in all three dimensions.

**Advantages:**
- Low switch port count — a k-ary d-dimensional torus connects N = k^d nodes with only d·k links per node
- Low diameter for uniform nearest-neighbour communication patterns
- Cost-effective for very large clusters (IBM Blue Gene series, Cray systems)

**Disadvantages:**
- Non-uniform bandwidth: communication between nearby nodes uses a short path; communication between distant nodes uses many hops through intermediate nodes
- All-reduce performance depends heavily on the mapping of parallel jobs to the torus — a job whose nodes are spread across the torus will see higher latency than one whose nodes are co-located
- Poor bisection bandwidth relative to fat-tree: splitting the cluster in half leaves relatively few cross-links

**When torus is used**: large-scale scientific computing where the communication pattern is primarily nearest-neighbour (computational fluid dynamics, climate simulation, molecular dynamics). In these workloads, the torus topology matches the communication pattern of the physics being simulated.

For ML training with all-reduce patterns (which require any-to-any communication), fat-tree or dragonfly outperform torus at scale.

## Dragonfly: low diameter, moderate cost

Dragonfly is a two-level topology that aims to combine the low diameter of a torus with the bandwidth of a fat-tree at lower cost than a full fat-tree.

**Structure:**
- Nodes connect to a local switch (group)
- Groups are connected to each other via global links
- Each group has high internal bandwidth; global links provide inter-group connectivity

The key design property: any two nodes are at most 3 hops apart (local switch → global link → destination local switch), regardless of cluster size. This is significantly lower than a fat-tree for very large clusters.

**Trade-offs:**
- Adaptive routing is essential — static routing can create hotspots on global links when many jobs need inter-group communication simultaneously
- Less uniform bandwidth than fat-tree: intra-group communication is cheaper than inter-group
- More complex to manage than fat-tree due to the two-level hierarchy

**Where dragonfly is deployed**: Cray Aries (Cray XC series), HPE Slingshot, some large-scale supercomputers. The topology was designed for the scale (100,000+ nodes) where fat-tree becomes impractically expensive.

At the scale of typical enterprise HPC clusters (hundreds to a few thousand nodes), fat-tree is usually the better choice — simpler to configure, easier to reason about, and the cost advantage of dragonfly only materialises at very large scale.

## Rail-optimized topology for AI training

For AI training specifically, a specialised variant called rail-optimized (or multi-rail) topology is gaining adoption.

**Structure**: multiple independent networks (rails) each connecting all compute nodes. A 4-rail design means each node has 4 NICs, each connected to a separate independent fat-tree fabric.

**Why it helps for all-reduce**: all-reduce traffic is distributed across all 4 rails simultaneously, quadrupling effective bandwidth. Each rail uses a separate switch fabric — a failure on one rail reduces bandwidth but doesn't stop training.

NVIDIA's NVLink switch fabric operates on this principle within a rack; multi-rail Ethernet or InfiniBand extends it inter-rack.

## Choosing for your workload

| Topology | Best for | Not ideal for |
|----------|----------|---------------|
| Fat-tree | General HPC, AI training, any-to-any workloads | Very large clusters (cost) |
| Torus | Nearest-neighbour scientific simulation | All-reduce heavy ML training |
| Dragonfly | Very large HPC (100k+ nodes) | Small/medium clusters (complexity cost) |
| Rail-optimized | Large-scale AI training (1000+ GPUs) | General-purpose workloads |

For most enterprise AI training clusters under 1,000 GPUs, a fat-tree with RoCE or InfiniBand at 200–400 Gbps is the pragmatic choice: well-understood, supported by standard tooling, and delivers the bandwidth that distributed training requires.

*Designing or evaluating network infrastructure for HPC or AI training? [Happy to compare configurations.](/contact)*
