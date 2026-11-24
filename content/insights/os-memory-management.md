---
title: "Memory Management: Virtual Memory, Page Faults, and Why Your App Runs Out of RAM"
description: "What virtual memory is, how the OS maps it to physical RAM, what a page fault means, and how to diagnose memory pressure before it causes an out-of-memory kill."
date: 2027-10-11
tags: ["Programming", "Fundamentals"]
series: "Operating Systems for Engineers"
seriesOrder: 3
format: article
---

Memory failures can cause production incidents: out-of-memory kills, latency from reclaim or swapping, and leaks that exhaust a process budget. Understanding how the OS manages memory makes these failures easier to diagnose and helps identify which preventive controls are appropriate.

## Virtual Memory: The Abstraction

Each process uses a virtual address space with regions for mappings such as executable code, libraries and allocated data. Many addresses can be unmapped or reserved; an address-space range does not imply that every address has physical backing. Physical RAM is shared across processes and can be much smaller than their combined virtual mappings.

The OS maintains a **page table** for each process: a mapping from virtual addresses to physical addresses. Each mapping covers a page — commonly 4 KiB on Linux systems, with other base page sizes and larger pages depending on architecture and configuration. When your program accesses a virtual address, the CPU's Memory Management Unit (MMU) translates it to a physical address using the page table.

Benefits of virtual memory:
- **Isolation**: each process sees its own address space. Ordinary access to private mappings is protected. Explicit shared mappings, privileged inspection and security vulnerabilities require separate consideration.
- **Flexibility**: physical memory can be non-contiguous; the process sees a contiguous address space anyway.
- **Overcommit**: the OS can allocate more virtual memory than physical RAM exists, expecting that not all of it will be used simultaneously.

## Page Faults: When the Mapping Does Not Exist

A page fault occurs when an access cannot proceed under the current page-table mapping or permissions. The OS may resolve it, for example by providing a page or handling copy-on-write, or reject an invalid access.

**Minor page fault**: the fault is resolved without reading a page from backing storage. Examples can include demand-zero allocation and copy-on-write handling, as well as establishing a mapping to an already resident page. The required allocation or copying can still consume CPU and memory bandwidth. Minor faults do not require storage I/O, although their overhead can still matter at high rates.

**Major page fault**: the page is not in RAM — it is on disk (in the swap space or a memory-mapped file). The OS must read it from disk into a physical page and update the page table before execution can continue. Storage-backed faults can add latency. Major faults may involve file-backed pages as well as swap, so the fault count alone does not prove swap pressure.

```bash
## Monitor system activity, including swap I/O
vmstat 1
## Columns: si and so report swap activity; check the installed vmstat manual for units
## Non-zero si values mean pages are being read from swap — a warning sign

## Resident, swap and peak virtual memory (not page-fault counters)
cat /proc/<PID>/status | grep -E "VmRSS|VmSwap|VmPeak"
```

## Physical Memory Concepts

**RSS (Resident Set Size)**: the amount of physical RAM currently used by a process. RSS is useful, but shared pages, proportional attribution and cgroup accounting also matter. Virtual size answers a different question.

**VSZ (Virtual Size)**: total virtual address space allocated. Often much larger than RSS.

**Swap**: configured backing space that can hold eligible anonymous-memory pages outside ordinary resident RAM. Reclaim can begin before all RAM is exhausted. Clean file-backed cache pages can instead be discarded and reread from their files; not every reclaimed page is written to swap. The policy and cost depend on the system, and compressed swap arrangements also exist. A later access that requires storage I/O is a major fault.

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

A memory leak occurs when memory that is no longer useful is not reclaimed as intended. In a garbage-collected program, unnecessary references can keep objects reachable. In a manually managed program, losing the last usable pointer without freeing an allocation can also leak memory. Both require investigation of ownership and lifetime.

```python
## Subtle Python memory leak: unbounded cache
cache = {}

def get_data(key: str) -> dict:
    if key not in cache:
        cache[key] = fetch_from_database(key)  # stored forever
    return cache[key]
```

The cache grows without bound as new keys are requested. In a long-running service with a large key space, this eventually exhausts available memory.

**Detection**: graph RSS over time. Investigate growth after comparable work cycles. Caches, allocator retention and workload changes can also raise RSS, while some leaks grow in steps.

```bash
## Watch RSS of a specific process over time
while true; do
  ps -o rss= -p <PID>
  sleep 10
done
```

## OOM Killer: The Last Resort

Under unresolved system or cgroup memory pressure, Linux may invoke an OOM (Out-of-Memory) killer. A cgroup limit can be reached while the host still has available memory. Selection considers eligible tasks within the relevant memory domain, memory use and the configured `oom_score_adj`, with kernel-specific exclusions and policy. Ordinary CPU scheduling priority is not a reliable description of the current OOM selection rule.

```bash
## Check if OOM killer has fired recently
dmesg | grep "oom_kill"
journalctl -k | grep "oom"
```

A container may report OOMKilled and exit status 137 after an OOM event, but 137 alone is not proof. Earlier application logs can remain available. Correlate runtime termination details, cgroup counters and kernel logs where accessible.

Understanding memory at the OS level means you can diagnose whether a memory incident is a leak, a sizing issue, a specific workload spike, or swap pressure — and fix the right problem.

## Separate the address-space view from the pressure view

Virtual addresses describe what a process can address. Resident pages describe what is currently backed in RAM. Resource accounting describes what a cgroup or system charges to a workload. These views overlap but are not interchangeable. A process mapping a large file may have a large virtual size while touching only a small subset of its pages.

Shared pages make simple addition misleading. If several processes map the same library, each process's RSS may include resident pages shared with the others. Proportional set size apportions shared pages and can help explain attribution, while cgroup accounting answers a different question about the applicable limit. Choose the metric to match the operational decision rather than declaring one memory number universally correct.

Consider a fictional importer under a 512 MiB memory limit. Assume its idle footprint is 180 MiB and each concurrently decoded batch adds 70 MiB at the peak. One batch implies 250 MiB, three imply 390 MiB, and five imply 530 MiB. The chart uses those assumptions. Five batches exceed the nominal limit by 18 MiB before allowing for other overhead. No actual process measurements are represented.

This arithmetic suggests a test, not a safe production setting. The additions may not be linear: buffers can overlap, allocators retain arenas, and garbage collection can delay reclamation. Measure peak charged memory with the intended input distribution and concurrency. Leave headroom based on observed variation and recovery needs, not on an arbitrary percentage copied from another service.

## Design a leak investigation around retention

An upward RSS graph is a symptom, not a diagnosis. It may reflect a warming cache, an allocator retaining freed pages, a growing backlog, larger inputs, or objects that are genuinely no longer needed but remain retained. A leak can also show steps and plateaus rather than a perfectly monotonic line. Compare memory with completed work and active work over a meaningful interval.

For a managed-language service, capture a suitable heap profile in an isolated reproduction and identify which objects retain the growing allocation. For native memory, use tools appropriate to the runtime and allocator. The language heap may remain steady while a native library or mapped buffer grows. Record both the application's own counters and the operating-system view.

Repeat the same bounded workload, then let in-flight work finish. If retained objects keep increasing across cycles with no legitimate cache growth, investigate their ownership. If memory stabilises but does not return to the OS, determine whether it is reusable inside the process. Lower RSS after a forced collection is not by itself proof that the root cause is fixed.

## A controlled memory-budget lab

Use a disposable environment with a documented limit and synthetic files. Start with one batch, then three, then five, preserving the same file sizes and code version. Record peak memory, completion count, elapsed time, rejected jobs, and termination reason. Do not run an unbounded stressor on a shared production host.

Make the program stop admitting work when its concurrency limit is reached. Verify whether callers wait in a bounded queue or receive a clear overload response. Compare this with allowing all batches to start. The practical result should include whether every accepted job is eventually completed or recoverable, not merely whether the process stays alive.

Then terminate the worker during a batch and restart it. Confirm that partial outputs are either discarded or resumed using an explicit checkpoint rule. Memory protection that causes repeated restarts can still produce a damaging retry loop if accepted jobs are not recoverable. Capacity and correctness have to be assessed together.

## Read out-of-memory evidence in context

Exit status 137 often indicates termination by SIGKILL, but it does not uniquely establish an OOM kill. An operator or supervisor can also send that signal. In a container environment, inspect the recorded termination reason and the relevant cgroup events, then correlate kernel logs when available. Host memory can remain available while a workload hits its own cgroup limit.

Distinguish an OOM kill from an application allocation failure that returns an error. Both can happen under pressure, and the handling path differs. Retain useful logs before the failure and preserve restart counts. A killed process may have substantial earlier logs even though it cannot write a final cleanup message.

The investigation report should state the effective limit, input sizes, concurrency, peak accounting metric, termination evidence, and recovery outcome. That record supports a concrete change: bound admission, reduce retained data, stream a transformation, fix ownership, or change capacity. Raising the limit without understanding growth merely changes when the next incident may occur.

## Further reading and source boundaries

- [Linux kernel: cgroup v2 memory controller](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html)
- [Linux manual: process memory maps](https://man7.org/linux/man-pages/man5/proc_pid_smaps.5.html)
- [Linux manual: process resource statistics](https://man7.org/linux/man-pages/man5/proc_pid_stat.5.html)
- [Linux manual: OOM score adjustment](https://man7.org/linux/man-pages/man5/proc_pid_oom_score_adj.5.html)
