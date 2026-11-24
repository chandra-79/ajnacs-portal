---
title: "What an Operating System Actually Does — and Why Every Engineer Should Know"
description: "The OS sits between your code and the hardware. Understanding what it manages — processes, memory, files, network — makes you a better programmer, a better architect, and a better debugger."
date: 2027-07-19
tags: ["Programming", "Fundamentals"]
series: "Operating Systems for Engineers"
seriesOrder: 1
format: article
---

Most application programs run on top of an operating system; bare-metal and some embedded programs are important exceptions. The OS is not a background concern — it is the environment that determines what your code can do, how fast it runs, and what happens when it fails. Engineers who understand their OS write faster code, design better systems, and diagnose production issues that are invisible to engineers who treat the OS as a black box.

## What an OS Manages

An operating system has one job: manage shared resources so that multiple programs can use them simultaneously without conflict.

The resources it manages:

**CPU time**: Servers have widely varying core counts and resource limits. Hundreds of processes want to run. The OS scheduler decides which process runs on which core, for how long, and in what order — switching between them fast enough that each process appears to be running continuously.

**Memory**: Physical RAM is finite. The OS manages how it is divided between processes, protects ordinary private mappings between processes, subject to explicit shared memory, privileged access and security limitations, and provides virtual address spaces. Some configurations also move eligible pages to swap; virtual memory does not require swapping.

**Storage**: Files and directories are an abstraction built by the OS on top of raw disk blocks. The file system manages where data is stored, how it is retrieved, and how multiple processes can access the same file safely.

**Network**: The OS implements the TCP/IP stack — the protocols that break your HTTP request into packets, route them across the internet, and reassemble them on the other end.

**Devices**: keyboards, displays, cameras, GPUs — the OS provides device drivers that abstract hardware differences into consistent interfaces programs can use.

## The Kernel and User Space

The OS is split into two layers:

**Kernel space**: The core of the OS, running with full hardware access. The kernel manages the CPU scheduler, memory allocator, file systems, and device drivers. Code running in kernel space can do anything the hardware allows.

**User space**: Where your programs run. User space code has no direct hardware access. To talk to hardware, your program makes a **system call** — a request to the kernel to perform a privileged operation on your behalf.

```
Your Python program
      ↓  open("data.csv")
  Python runtime
      ↓  read() system call
  Linux kernel
      ↓
  Disk driver
      ↓
  Physical storage
```

Many file and socket operations cross the system-call interface. Runtime allocators can satisfy many allocations from memory already obtained, and buffered reads can avoid a syscall for each application read. The actual path and device latency determine cost.

## Why This Matters for Performance

The CPU-bound vs. I/O-bound distinction is an OS concept. A CPU-bound program spends most of its time executing instructions in user space. An I/O-bound program spends most of its time waiting for the kernel to complete system calls — reading from disk, writing to a database, waiting for network responses.

The distinction drives architecture decisions:
- CPU-bound workloads benefit from more cores and parallelism
- I/O-bound workloads benefit from concurrency (many tasks waiting simultaneously), not necessarily more cores

In a conventional CPython build, waiting I/O can release the Global Interpreter Lock. Appropriate concurrency can overlap those waits; achievable request capacity still depends on workload, limits, and implementation.

## Linux Is the Production OS

Linux is widely used in cloud systems. Windows and other operating systems also support production services; learn the resource model and diagnostic tools of your actual environment.

Linux is open source, so its implementation and design documentation are available for deeper investigation. Source-code size is not a useful measure of what an application engineer needs to learn.

The following lessons in this series cover the Linux concepts every cloud and systems engineer needs: processes and concurrency, the file system and storage, networking, and practical Linux commands that diagnose the production issues you will actually encounter.

## Follow a request across the boundaries

Imagine a fictional document service receiving one small upload. The application validates an account, writes a temporary file, calculates a checksum, and records metadata. The kernel provides sockets and file operations, but it does not understand the business rule that an account may upload only its own documents. The application must enforce that rule. Operating-system isolation and application authorisation work at different levels.

A useful model separates running, runnable, and waiting. A running thread is executing on a CPU. A runnable thread can execute but may be waiting for a scheduler allocation. A waiting thread cannot progress until an event occurs, such as data arriving or a lock becoming available. A slow request can move through all three states. Adding cores helps only when the limiting work can actually run in parallel.

Suppose one request takes 100 milliseconds of elapsed time: 20 milliseconds of CPU execution, 60 waiting for storage, and 20 waiting for a downstream response. These invented durations are mutually exclusive intervals along one serial request path. They add to 100 milliseconds; durations from concurrent spans would not necessarily add this way. The chart represents the assumed breakdown, not an operating-system benchmark.

Even eliminating half the CPU work saves only ten milliseconds under this model. Eliminating all CPU work would leave 80 milliseconds. This is a useful upper bound before spending days on a loop optimisation. It also explains why low CPU utilisation does not establish good user experience. A dependency can be slow while the local CPU remains mostly idle.

## A small observation exercise

Use a disposable Linux environment and a harmless test program that reads a synthetic file and computes its digest. Record the program version, input byte count, elapsed time, user CPU time, and system CPU time. Repeat the same input after the first run. A faster second read may reflect the page cache rather than improved code; keep the cache state in your notes instead of presenting the best result as a universal speed.

Observe the process using the system's normal process monitor. Then run a brief system-call trace restricted to file operations. Look for the input path and the return value from opening it. A library may buffer many application reads into fewer kernel reads. That observation is why a line of source code is not a reliable count of system calls.

Change one condition: make the file inaccessible to the test user. Predict the result before rerunning. The important evidence is the failing operation and its error, not merely the final exception text. Restore the test permissions afterward. Do not use real customer documents or secrets in a trace; syscall arguments can expose paths and contents.

## Containers do not remove the kernel

An ordinary Linux container shares its host kernel while using isolation and resource-control mechanisms. The CPU count visible to a program can differ from the CPU quota available to its cgroup. A service can therefore experience throttling even when a host-level dashboard appears to show spare capacity. Inspect the process's effective limits before buying a larger instance or increasing thread counts.

Memory observations need similar care. Resident memory, virtual address space, page cache, and an application's heap are different quantities. A large virtual allocation does not prove that equally much physical RAM is in use. Conversely, a modest language heap does not exclude large native buffers or mapped files. Start with the question you need to answer: what consumes the resource, what limit applies, and what happens when that limit is reached?

For an incident worksheet, record the affected operation, its deadline, runnable CPU demand, blocked dependency, applicable memory limit, and the first error. This gives the next investigator a testable resource hypothesis instead of the vague statement that the server is slow. The OS vocabulary is valuable because it makes those hypotheses more precise.

## Further reading and source boundaries

- [Linux manual: control groups](https://man7.org/linux/man-pages/man7/cgroups.7.html)
- [Linux manual: system-call tracing](https://man7.org/linux/man-pages/man1/strace.1.html)
- [Linux manual: POSIX threads](https://man7.org/linux/man-pages/man7/pthreads.7.html)
