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

## What to measure

**One parameter per controlled comparison.** Change one setting at a time, repeat the same traffic, and record p99 latency, queue drops and CPU. If 500 of 1,000,000 connections fail before a change and 200 fail after, the observed rates are 0.05% and 0.02%; repeat to rule out load variation.

*Illustrative measurement. Any numbers in this example are hypothetical.*

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

Use the [kernel virtual memory sysctl reference](https://docs.kernel.org/admin-guide/sysctl/vm.html#swappiness) and verify the running host’s values before proposing a change.

```bash
## /etc/sysctl.d/99-vm.conf

## ── vm.swappiness ──
## Relative I/O cost of swapping versus filesystem paging (0–200).
## 60 is a common upstream default. This is not a RAM percentage.
## Zero changes when swap is considered. It does not disable it.
## Preserve the host setting until the workload has been tested.
## vm.swappiness = 60

## ── vm.dirty_ratio and vm.dirty_background_ratio ──
## dirty_ratio: total dirty page threshold — kernel blocks writes at this point
## dirty_background_ratio: start background flushing at this point
## The percentage base is the memory eligible for dirty pages. Check current values.
## For write-heavy databases (they handle their own fsync): lower to reduce spikes
vm.dirty_ratio = 10
vm.dirty_background_ratio = 3
## Measure stalls and writeback behavior before changing either threshold.

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

## Capture both the active value and its source

Before touching a kernel parameter, capture the kernel release, distribution, service runtime, namespace where the symptom occurs, and current value. Read individual live keys from the same scope as the affected process. In a container, a networking parameter may belong to the container’s network namespace, and other settings may be host-wide or controlled by the platform. Note any boot-time or provisioning policy that reasserts the value. Keep read-only inspection separate from commands which load settings, including `sysctl --system`.

For systemd-based systems, `sysctl.d` files are sorted by filename, and a later assignment can override an earlier one. Files with the same name have directory precedence. Use the documentation matching the system’s implementation and compare the final change against the effective value after reboot, replacement, and relevant runtime restarts. Some devices or modules only expose their settings after initialization. Capture where the desired setting is defined so an operator can tell which layer owns it. See [systemd’s sysctl.d manual](https://www.freedesktop.org/software/systemd/man/latest/sysctl.d.html).

Test one change at a time with bounded traffic and check comparable tail latency, errors, throughput, and resource cost. State the change’s predicted impact before starting. If the rollback requires a restart or reapplies a group of settings, exercise that procedure separately. When testing a `vm.dirty_*` value, remember that switching between the byte and ratio forms resets the counterpart. Restore the previous effective mode as well as the desired threshold.

## Separate reclaim stalls from writeback bursts

Look for changes in I/O and memory pressure alongside application latency. High dirty bytes can be acceptable with a stable writeback rate and healthy latency. A growing dirty backlog followed by saturated storage and occasional stalls suggests a different problem. Compare application writes, durable completion rate, and the device’s recorded load under a representative schedule. Distinguish a secondary effect caused by an existing storage limit from a writeback policy that changes how work reaches the device.

Suppose an illustrative workload dirties data steadily at 220 MiB/s while its target flushes about 160 MiB/s for part of a test. The gap is 60 MiB/s. Even an additional 1 GiB of usable buffering only conceals the gap for roughly 17 seconds before pressure increases, assuming no other reclaim or throttling and steady rates. A higher threshold can shift the delay into a more disruptive burst. Retest with a control that reduces the write rate or moves the competing workload, then see which change improves durable throughput.

The kernel defines dirty ratios against memory eligible for the calculation, rather than total installed RAM. The background threshold starts flusher work, and the higher threshold makes the write-generating process participate. Dirty page expiry and periodic wakeup are different controls. Report observed thresholds and trace timing before mapping a configured ratio to an exact number of bytes or seconds. See the [Linux virtual-memory sysctl reference](https://docs.kernel.org/admin-guide/sysctl/vm.html).

## Identify the TCP queue where the symptom occurs

Trace a connection from the client across the load balancer to the application listener. A slow `accept()` path can fill the completed connection queue while the application CPU is paused. Half-open handshakes use a separate queue and can be affected by packet loss or client retries. The listener uses its configured backlog within the kernel limit. Raising `somaxconn` alone leaves a smaller application backlog unchanged until the listener asks for more capacity. Compare listener observations, connection setup latency, application accept rate, and host activity in the same time frame.

On the outbound side, distinguish failures to allocate a local source port from timeouts establishing the connection to its destination. A rising TIME_WAIT count can be expected when connection churn rises. It does not quantify available tuples on a specific source and destination path. Consider connection reuse and measure local and NAT-side symptoms before expanding the configured range. `tcp_fin_timeout` concerns orphaned FIN_WAIT_2 sockets, and is a separate setting from TIME_WAIT behavior. Consult the [kernel’s IP sysctl documentation](https://docs.kernel.org/networking/ip-sysctl.html) for scope and version-sensitive behavior.

Set a target for the connection outcome, such as the fraction of intended connections accepted by a specific deadline. A larger queue can make the headline drop counter improve while clients spend longer waiting. Preserve both measures in the results. If rejected connections disappear but request timeouts rise, the same workload may have moved its waiting time up the stack.

## Locate limits before granting more headroom

Suppose an illustrative service fails to open sockets near 4,096 local descriptors while system-wide allocations are only 25% of their maximum. Read the running process’s file descriptor limit and count its current descriptors by type. Compare growth against traffic and check cleanup after requests finish. A per-process limit could be binding here. A process leaking sockets will eventually reach a higher limit too. An allocation failure observed at the system-wide boundary has a different diagnosis and affects workloads beyond the one reported.

For excessive task counts, inspect the service manager’s limit and cgroup task counters alongside process-level limits. A process can run within a service or parent slice that rejects new tasks despite a generous system-wide PID ceiling. Test a controlled service start at intended concurrency after modifying one limit. Record the effective values and whether the owning process was recreated under them. Also note that a parent setting may still constrain the service. Kernel-wide changes can shift resource consumption to other workloads sharing the same host.

Keep a record of the expected symptom, the diagnostic boundary, the smallest setting change tested, and the times of the control and candidate runs. Include the uncertainty remaining in the comparison. If the kernel version or deployment layout changes, rerun the original workload before carrying the old override forward. That gives the next team evidence to decide whether the setting still addresses a live constraint.

## Check huge-page policy on the running system

Transparent huge-page defaults and available sizes depend on the kernel and distribution. The top-level policy and the settings for individual sizes can both matter on kernels that offer multiple sizes. Inspect the effective configuration and count how often the workload actually uses huge pages before changing compaction policy. Change the candidate service and observe repeated allocation, warm-up, and steady-state runs. A service may trade lower translation overhead for deploy-time or periodic latency. Record both results along with the working set and memory-pressure observations. The [kernel’s transparent huge-page guide](https://docs.kernel.org/admin-guide/mm/transhuge.html) explains the settings and their scope.
