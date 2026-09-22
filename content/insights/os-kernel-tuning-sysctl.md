---
title: "Kernel Tuning with sysctl: Memory, Networking, and I/O"
description: "The sysctl parameters that actually matter in production — VM reclaim tuning, TCP stack optimisation, file descriptor limits, and the settings that separate a well-tuned server from a default install."
date: 2026-09-30
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 23
format: article
---

The Linux kernel exposes thousands of tunable parameters through `sysctl`. Most of them should be left at defaults. A small set of them, when tuned correctly, make a material difference for database servers, web proxies, high-throughput data pipelines, and any server running at scale. This lesson covers the ones that matter and explains why they matter.

## sysctl Basics

```bash
## Read a parameter
sysctl vm.swappiness
sysctl -a | grep tcp_rmem   # search across all parameters

## Set a parameter (immediate, non-persistent)
sysctl -w net.ipv4.tcp_syncookies=1

## Make it persistent (survives reboot)
## Create a file in /etc/sysctl.d/
echo "net.ipv4.tcp_syncookies = 1" | sudo tee /etc/sysctl.d/99-custom.conf

## Apply all files in /etc/sysctl.d/ immediately
sysctl -p /etc/sysctl.d/99-custom.conf
sysctl --system   # apply all sysctl files

## See which file a parameter comes from
sysctl --system -a --deprecate 2>&1 | grep vm.swappiness
```

## Virtual Memory Tuning

```bash
## /etc/sysctl.d/99-vm.conf

## ── vm.swappiness ──
## How aggressively the kernel moves anonymous memory to swap
## 0 = swap only when RAM is completely full (not literally 0)
## 60 = default (swap when ~40% of RAM is free)
## 100 = very aggressive swap use
## For a database server or in-memory cache: set to 1-10
## For a general application server: 10-20
## For a desktop: 10-30
vm.swappiness = 10

## ── vm.dirty_ratio and vm.dirty_background_ratio ──
## dirty_ratio: total dirty page threshold — kernel blocks writes at this point
## dirty_background_ratio: start background flushing at this point
## Default: 20% and 10% of RAM
## For write-heavy databases (they handle their own fsync): lower to reduce spikes
vm.dirty_ratio = 10
vm.dirty_background_ratio = 3
## For NFS or network storage where write-back is unreliable: lower further
## For SSDs with high write throughput: can raise to 20/10

## ── vm.vfs_cache_pressure ──
## How aggressively kernel reclaims inode/dentry cache vs page cache
## Lower = keep more inode cache (good for file servers with many small files)
## Higher = reclaim inode cache aggressively
## Default: 100. For file servers: 50-70
vm.vfs_cache_pressure = 50

## ── Transparent Huge Pages ──
## Covered in its own section below

## ── Overcommit policy ──
## 0 (default) = heuristic overcommit — kernel decides
## 1 = always allow overcommit — never fail malloc()
## 2 = disable overcommit — fail if not enough physical + swap
## For Redis: use overcommit_memory=1 (Redis forks for persistence)
## For conservative production: leave at 0
vm.overcommit_memory = 0
vm.overcommit_ratio = 50   # with overcommit=2: max commit = swap + 50% of RAM
```

## Transparent Huge Pages

Transparent Huge Pages (THP) maps memory in 2MB pages instead of 4KB. This reduces TLB pressure for large memory applications but causes latency spikes during huge page compaction.

```bash
## Check current THP setting
cat /sys/kernel/mm/transparent_hugepage/enabled
## [always] madvise never

## Options:
## always   = THP on for everything (default on RHEL/Ubuntu servers)
## madvise  = THP only when application explicitly requests via madvise()
## never    = THP disabled

## For databases (PostgreSQL, MySQL, MongoDB, Redis): disable or set madvise
## These databases manage their own memory allocation and THP causes latency spikes
echo madvise | sudo tee /sys/kernel/mm/transparent_hugepage/enabled
echo defer+madvise | sudo tee /sys/kernel/mm/transparent_hugepage/defrag

## Make persistent
## /etc/rc.local or a systemd unit
## Or on RHEL via /etc/tuned/no-thp/tuned.conf (tuned profile)

## Also disable THP compaction (the source of latency spikes)
echo 0 | sudo tee /sys/kernel/mm/transparent_hugepage/khugepaged/defrag
```

## File Descriptor and Process Limits

```bash
## System-wide file descriptor limit
sysctl -w fs.file-max=2000000
## Check current usage
cat /proc/sys/fs/file-nr   # allocated, freed, max

## Inotify limits (required for systems monitoring many files — Kubernetes, Prometheus)
sysctl -w fs.inotify.max_user_watches=524288
sysctl -w fs.inotify.max_user_instances=512

## Maximum number of PIDs
sysctl -w kernel.pid_max=4194304   # default 32768, too low for containers

## Per-process ulimits — /etc/security/limits.conf or systemd unit settings
## For a web server or database:
## /etc/security/limits.d/99-production.conf
*    soft    nofile    65536
*    hard    nofile    65536
*    soft    nproc     32768
*    hard    nproc     32768
root soft    nofile    65536
root hard    nofile    65536

## For a systemd service (overrides /etc/security/limits.conf)
## /etc/systemd/system/myapp.service.d/override.conf
[Service]
LimitNOFILE=65536
LimitNPROC=32768

systemctl daemon-reload
systemctl restart myapp

## Check current limits for a running process
cat /proc/<PID>/limits
```

## Network Stack Tuning

```bash
## /etc/sysctl.d/99-network.conf

## ── Connection capacity ──
net.core.somaxconn = 65535            # max backlog per socket (listen queue)
net.ipv4.tcp_max_syn_backlog = 65535  # max half-open connections
net.core.netdev_max_backlog = 5000    # queue length before dropping at NIC

## ── Socket buffers ──
net.core.rmem_default = 262144
net.core.rmem_max = 134217728
net.core.wmem_default = 262144
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728

## ── TIME_WAIT handling ──
net.ipv4.tcp_tw_reuse = 1         # reuse TIME_WAIT sockets for new outbound connections
net.ipv4.tcp_fin_timeout = 15     # reduce FIN_WAIT2 timeout (default 60s)
net.ipv4.tcp_max_tw_buckets = 1440000  # max TIME_WAIT sockets

## ── Ephemeral ports (source ports for outbound connections) ──
net.ipv4.ip_local_port_range = 1024 65535  # default: 32768-60999
## If you are opening >28K connections from one server, expand this range

## ── Keepalive settings ──
net.ipv4.tcp_keepalive_time = 300       # send keepalive after 5 minutes idle
net.ipv4.tcp_keepalive_intvl = 30       # probe interval
net.ipv4.tcp_keepalive_probes = 5       # give up after 5 failed probes

## ── SYN protection ──
net.ipv4.tcp_syncookies = 1             # enable SYN cookies
net.ipv4.tcp_syn_retries = 2            # reduce retry count (faster failure)

## ── BBR congestion control (for inter-datacenter or cloud networking) ──
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
```

## Kernel Profiling for Tuning Validation

After applying tuning, verify it had the intended effect:

```bash
## Confirm sysctl values are active
sysctl net.ipv4.tcp_congestion_control
sysctl vm.swappiness

## Memory reclaim activity
vmstat -s | grep -E "swap|paged"
sar -B 1 5   # pgscank/s, pgscand/s, %vmeff (scan and scan efficiency)

## Network buffer effectiveness — check for pruned send/receive queues
netstat -s | grep -E "pruned|collapsed|overflow"
## Any pruned sockets = buffers were too small

## File descriptor usage
cat /proc/sys/fs/file-nr
## If allocated approaches max: increase fs.file-max

## Port exhaustion check
ss -s | grep TIME-WAIT
netstat -s | grep "TCP sockets finished time wait"
## Rising rapidly = ip_local_port_range too narrow or tcp_tw_reuse needed
```

## NUMA Awareness

On multi-socket servers (two physical CPUs), NUMA (Non-Uniform Memory Access) matters significantly. Memory accesses to the remote NUMA node are 2–3x slower.

```bash
## Check NUMA topology
numactl --hardware
numastat   # per-node memory statistics

## Check NUMA miss rate (remote memory accesses)
numastat -p <PID>

## Run a process bound to a specific NUMA node
numactl --cpunodebind=0 --membind=0 myapp
## Bind to CPU node 0 and allocate memory only from node 0

## For JVM applications (Java/Scala/Kotlin)
## Set heap size to fit within one NUMA node to avoid remote allocation
## -XX:+UseNUMA JVM flag enables automatic NUMA-aware memory allocation
```

NUMA tuning makes the most difference for in-memory databases (Redis, Elasticsearch, large PostgreSQL shared_buffers) and any workload with large working sets. The numastat numbers tell you whether it is worth investigating.
