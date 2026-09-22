---
title: "Memory Management: Virtual Memory, Page Faults, and Why Your App Runs Out of RAM"
description: "What virtual memory is, how the OS maps it to physical RAM, what a page fault means, and how to diagnose memory pressure before it causes an out-of-memory kill."
date: 2027-08-23
tags: ["Programming", "Fundamentals"]
series: "Operating Systems for Engineers"
seriesOrder: 3
format: article
---

Memory errors are among the most common causes of production incidents: out-of-memory kills, swap pressure causing latency spikes, memory leaks growing until the process crashes. Understanding how the OS manages memory turns these from mysterious failures into diagnosable, preventable problems.

## Virtual Memory: The Abstraction

Every process operates in virtual address space — a continuous range of addresses from 0 to some maximum, as if the process owned all of memory. In reality, physical RAM is shared across all processes and the hardware has far less of it than the total virtual address space suggests.

The OS maintains a **page table** for each process: a mapping from virtual addresses to physical addresses. Each mapping covers a page — typically 4KB of contiguous memory. When your program accesses a virtual address, the CPU's Memory Management Unit (MMU) translates it to a physical address using the page table.

Benefits of virtual memory:
- **Isolation**: each process sees its own address space. It cannot accidentally (or maliciously) access another process's memory.
- **Flexibility**: physical memory can be non-contiguous; the process sees a contiguous address space anyway.
- **Overcommit**: the OS can allocate more virtual memory than physical RAM exists, expecting that not all of it will be used simultaneously.

## Page Faults: When the Mapping Does Not Exist

A page fault occurs when a process accesses a virtual address that has no physical page currently mapped to it.

**Minor page fault**: the page exists (in memory or already mapped) but the page table entry is not yet set up. The OS updates the page table and execution continues. This happens constantly during normal program execution — it is fast and benign.

**Major page fault**: the page is not in RAM — it is on disk (in the swap space or a memory-mapped file). The OS must read it from disk into a physical page and update the page table before execution can continue. This is slow (milliseconds vs nanoseconds) and is what causes "swap pressure" latency spikes.

```bash
## Monitor page faults in real time
vmstat 1
## Columns: si (swap in pages/sec), so (swap out pages/sec)
## Non-zero si values mean pages are being read from swap — a warning sign

## Page faults per process
cat /proc/<PID>/status | grep -E "VmRSS|VmSwap|VmPeak"
```

## Physical Memory Concepts

**RSS (Resident Set Size)**: the amount of physical RAM currently used by a process. This is the meaningful memory metric — virtual address space size is misleading because most of it is not mapped to physical RAM.

**VSZ (Virtual Size)**: total virtual address space allocated. Often much larger than RSS.

**Swap**: disk space used as an overflow for physical RAM. When RAM is full and the OS needs to allocate a page, it evicts a less-recently-used page to swap. If the evicted page is needed again, it must be read back from disk — the major page fault.

```bash
## Memory usage summary
free -h
## Watch for 'available' (not just 'free') — this includes reclaimable cache

## Per-process memory sorted by RSS
ps aux --sort=-%mem | head -20

## Detailed memory map for a process
pmap -x <PID>

## System memory events (OOM kills, swap activity)
dmesg | grep -E "oom|Out of memory|Killed process"
```

## Memory Leaks: What They Actually Are

A memory leak occurs when a program allocates memory and retains a reference to it indefinitely, preventing garbage collection or explicit deallocation.

```python
## Subtle Python memory leak: unbounded cache
cache = {}

def get_data(key: str) -> dict:
    if key not in cache:
        cache[key] = fetch_from_database(key)  # stored forever
    return cache[key]
```

The cache grows without bound as new keys are requested. In a long-running service with a large key space, this eventually exhausts available memory.

**Detection**: graph RSS over time. A leak shows a monotonically increasing trend that does not plateau. A healthy service shows RSS that fluctuates but does not grow indefinitely.

```bash
## Watch RSS of a specific process over time
while true; do
  ps -o rss= -p <PID>
  sleep 10
done
```

## OOM Killer: The Last Resort

When the system runs out of physical memory and swap, the Linux OOM (Out-of-Memory) killer selects a process to kill. The selection is based on a heuristic score that weighs memory usage, process priority, and whether the process is a system critical process.

```bash
## Check if OOM killer has fired recently
dmesg | grep "oom_kill"
journalctl -k | grep "oom"
```

An OOM kill of your application process in a Kubernetes pod appears as a container restart with exit code 137 (SIGKILL). The pod log will be empty (the process was killed, not exited). The node-level `dmesg` will have the OOM event.

Understanding memory at the OS level means you can diagnose whether a memory incident is a leak, a sizing issue, a specific workload spike, or swap pressure — and fix the right problem.
