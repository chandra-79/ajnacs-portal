---
title: "CPU and Memory Performance Analysis on Linux"
description: "How to read top, htop, vmstat, sar, and perf to diagnose CPU saturation, memory pressure, and kernel bottlenecks before they become outages."
date: 2026-08-21
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 16
format: article
---

Performance analysis is not about running a tool and reading a number. It is about building a mental model of what the system is doing, then confirming or refuting that model with data. Linux gives you more visibility into its own internals than any other OS. The tools in this lesson expose the full picture — from CPU scheduler decisions to kernel memory reclaim.

## The USE Method

Before opening any tool, know what you are measuring. Brendan Gregg's USE Method gives a framework:

- **Utilisation** — how much of the resource is in use (0–100%)
- **Saturation** — how much work is queued waiting for the resource
- **Errors** — whether the resource is reporting faults

A CPU at 95% utilisation with a run queue of 50 is saturated. A CPU at 50% utilisation with a run queue of 0 is not. Utilisation alone is meaningless without saturation.

## top — the starting point

```bash
top
## Keys during interactive mode:
## 1     — show per-CPU stats
## M     — sort by memory
## P     — sort by CPU (default)
## c     — show full command line
## u     — filter by user
## q     — quit
## H     — show threads instead of processes
## V     — forest view (parent/child tree)
```

Reading the top header:

```
top - 14:23:01 up 42 days,  3:17,  2 users,  load average: 1.23, 0.89, 0.74
Tasks: 342 total,   2 running, 340 sleeping,   0 stopped,   0 zombie
%Cpu(s):  8.4 us,  1.2 sy,  0.0 ni, 89.1 id,  0.8 wa,  0.0 hi,  0.5 si,  0.0 st
MiB Mem :  15887.2 total,    421.0 free,   8234.0 used,   7232.2 buff/cache
MiB Swap:   2048.0 total,   1024.0 free,   1024.0 used.   6891.0 avail Mem
```

**Load average**: tasks that are either running or waiting for CPU/IO, averaged over 1, 5, and 15 minutes. On an 8-core machine, a load of 8.0 means full utilisation. A load of 16.0 means the system is saturated — every process waits twice as long as it should. A rising trend (1m > 5m > 15m) indicates a problem that is getting worse.

**CPU breakdown**:
- `us` — user space (your application code)
- `sy` — kernel/system (syscalls, kernel threads)
- `wa` — I/O wait — CPU is idle but processes are waiting on disk
- `hi` — hardware interrupt handlers
- `si` — software interrupt / network packet processing (high `si` = network saturation)
- `st` — stolen by a hypervisor (on VMs — time the hypervisor gave to another guest)

**Memory**: Linux uses free memory for buffer/cache aggressively — "free" memory is wasted memory. What matters is `avail Mem` (memory that can be given to applications without swapping). If `avail Mem` is low and swap `used` is rising, you have memory pressure.

## vmstat — the faster overview

```bash
vmstat 2 10
## Output every 2 seconds, 10 times

## Output columns:
## r  — processes waiting for CPU (run queue length)
## b  — processes in uninterruptible sleep (usually waiting for I/O)
## swpd — swap in use
## free — free memory
## si/so — swap in/out per second (any value here indicates memory pressure)
## bi/bo — blocks in/out (disk I/O in blocks/sec)
## cs — context switches per second
## us/sy/id/wa/st — CPU percentages
```

```
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0  1048576  420320  12144 7234560    0    0     0     4   42  312  8  1 90  1  0
 0  0  1048576  419816  12144 7234560    2    0     0   128   38  289  6  1 92  1  0
```

High `r` (run queue consistently above CPU count) = CPU saturation. High `b` = I/O saturation. Any `si`/`so` = you are swapping = performance is degraded.

## htop — interactive and visual

```bash
## Install if not present
apt install htop   # Debian/Ubuntu
dnf install htop   # RHEL/Fedora

htop
## F5  — tree view
## F6  — sort
## F9  — kill (sends signal)
## F4  — filter by process name
## t   — tree view toggle
```

htop adds: per-CPU bars, per-process memory details, tree view showing parent/child relationships, and cleaner display of CPU steal and IO wait. On a multi-core server, immediately press `1` in top or switch to htop to see whether load is concentrated on one core (usually means single-threaded code or IRQ affinity problems).

## sar — historical performance data

`sar` (System Activity Reporter, part of the `sysstat` package) samples and stores system statistics every 10 minutes by default. It is how you investigate "what happened at 3am?"

```bash
apt install sysstat   # Debian/Ubuntu

## CPU utilisation for today
sar -u 1 10         # current, 1-second intervals, 10 samples
sar -u -f /var/log/sysstat/sa$(date +%d)   # today's historical data

## Memory
sar -r 1 10

## Disk I/O
sar -d 1 10

## Network
sar -n DEV 1 10

## Context switches and interrupts
sar -w 1 10

## All of the above for yesterday
sar -A -f /var/log/sysstat/sa$(date -d yesterday +%d)
```

## perf — CPU profiling down to the instruction

`perf` is a Linux kernel profiler. It records CPU counter data (cache misses, branch mispredictions, cycles) and can produce flame graphs.

```bash
## Install
apt install linux-perf   # Debian/Ubuntu
dnf install perf          # RHEL/Fedora

## Record a 30-second CPU profile of everything
sudo perf record -g -a -F 99 -- sleep 30
## -g: capture call graph
## -a: all CPUs
## -F 99: 99 samples per second (avoids lock-step with 100Hz timer)

## View the report
sudo perf report

## Profile a specific process (PID)
sudo perf record -g -p 1234 -- sleep 30

## Count hardware events for a command
perf stat ls -la /usr

## One-liner CPU hotspot from all processes
sudo perf top   # live, shows which functions are hot
```

## Diagnosing High CPU

```bash
## Step 1: which process?
top -b -n 1 | head -20

## Step 2: what is it doing?
ps -eo pid,ppid,cmd,%cpu,%mem --sort=-%cpu | head

## Step 3: is it one thread or all threads?
top -H -p <PID>    # H = show threads

## Step 4: is it in user space or kernel?
## High %us = application code, profile with perf or strace
## High %sy = lots of syscalls — check with strace -c -p <PID>
## High %si = network processing — check with sar -n DEV

## Step 5: what CPU is it on? (NUMA, IRQ affinity issues)
cat /proc/<PID>/status | grep Cpus_allowed
```

## Diagnosing Memory Pressure

```bash
## Check for OOM kills in the last hour
dmesg | grep -i "oom\|killed process" | tail -20
journalctl -k | grep -i "oom\|out of memory"

## What is using memory?
ps -eo pid,rss,vsz,comm --sort=-rss | head -20
## rss = resident set size (physical RAM in use)
## vsz = virtual size (mapped, not necessarily in RAM)

## Memory breakdown by category
cat /proc/meminfo

## Key fields in /proc/meminfo:
## MemAvailable  — what applications can actually use (more accurate than MemFree)
## Cached        — page cache (files cached in RAM)
## Slab          — kernel data structure cache
## SwapCached    — pages in both swap and RAM (recently swapped back)
## Dirty         — pages that need writing to disk
## Mapped        — files mapped into process address space

## Check for memory-hungry slab caches
slabtop -s c   # sort by cache size

## Check swap activity
vmstat -s | grep -i swap
cat /proc/vmstat | grep pgpg   # pgpgin/pgpgout = pages paged in/out
```

## Diagnosing OOM Situations Before They Kill Your Process

The OOM killer picks a process to terminate based on an `oom_score`. You can influence this:

```bash
## See the OOM score for a process (higher = more likely to be killed)
cat /proc/<PID>/oom_score

## Protect a process from the OOM killer (score adjustment)
echo -1000 > /proc/<PID>/oom_score_adj    # minimum = very protected
echo 1000  > /proc/<PID>/oom_score_adj    # maximum = first to be killed

## For a service managed by systemd
## /etc/systemd/system/myapp.service.d/override.conf
[Service]
OOMScoreAdjust=-900
```

## CPU Throttling and Frequency Scaling

On cloud VMs and laptops, CPU throttling causes mysterious latency spikes.

```bash
## Check current CPU frequency
cat /proc/cpuinfo | grep "cpu MHz"

## Check thermal throttling events (cloud VMs often don't expose this)
sudo dmesg | grep -i "throttl"

## Check turbo boost and frequency governors
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
## "performance" keeps the CPU at max frequency
## "powersave" throttles dynamically — bad for latency-sensitive workloads

## Set all CPUs to performance mode
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

## Check CPU steal (VMs) — any steal means the hypervisor is overloaded
grep steal /proc/stat
vmstat 1 10 | awk 'NR>2{print $16}'   # st column
```

Sustained CPU steal above 5% on a production workload is a problem with the host, not your application. The right response is to move to a different instance or host, not to optimise the application.
