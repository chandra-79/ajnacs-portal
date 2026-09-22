---
title: "Most AI teams optimise compute and storage. The network fabric is often an afterthought — until training grinds to a halt."
description: "Most AI teams spend months optimizing compute and storage. The network fabric is an afterthought — until distributed training grinds to a halt."
date: 2026-06-08
tags: ["Systems", "Enterprise AI", "Infrastructure"]
format: note
derived: true
---

Most AI teams spend months optimizing compute and storage. The network fabric is an afterthought — until distributed training grinds to a halt.

Ethernet vs. InfiniBand in 2026:

→ **Ethernet** is the right default for almost everything. Mature, cost-effective, huge ecosystem. With RoCE v2, even RDMA is now accessible on Ethernet infrastructure.

→ **InfiniBand** is a precision specialist — sub-microsecond latency, native RDMA, 1.6–3.2T+ bandwidth. Purpose-built for AI training clusters, HPC, supercomputing.

The decision most enterprise teams actually face isn't "which do I buy" — it's "do I know which fabric my cloud instance is using underneath, and am I tuning my distributed training jobs for the right constraints?"

For most workloads: Ethernet. For serious AI training at scale: know your interconnect.
