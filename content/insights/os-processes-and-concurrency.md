---
title: "Processes, Threads, and Concurrency: What Every Engineer Must Understand"
description: "The difference between a process and a thread, how concurrency works in production systems, and why your program behaves differently on a multi-core server than on your laptop."
date: 2027-12-17
tags: ["Programming", "Fundamentals"]
series: "Operating Systems for Engineers"
seriesOrder: 2
format: article
---

Most production bugs that are difficult to reproduce have one thing in common: they depend on timing. Two operations that should not happen simultaneously are happening simultaneously. Understanding processes, threads, and concurrency is not theoretical knowledge — it is the foundation for diagnosing the class of bugs that only appear at load, under specific timing conditions, or in production environments with multiple CPU cores.

## Process: The Unit of Isolation

A process is a running instance of a program. It has:
- Its own isolated memory space (other processes cannot read or write it)
- Its own file descriptors (open files, network connections)
- At least one thread of execution
- A process ID (PID) assigned by the OS

When you run a Python script, start a web server, or launch a database — each creates one or more processes. The isolation is enforced by the OS: a bug in one process cannot corrupt another process's memory.

```bash
## List running processes on Linux
ps aux
## Show process hierarchy
pstree
## Show resource usage per process
top
htop  # more readable version
```

## Thread: The Unit of Execution Within a Process

A thread is a unit of execution within a process. Multiple threads in the same process share:
- Memory (heap, global variables)
- File descriptors
- The process's resources

But each thread has its own:
- Stack (local variables, function call history)
- Program counter (which instruction it is executing)
- CPU register state

Threads within a process are cheaper to create than separate processes (no need to copy memory), and communication between threads is fast (shared memory). The cost: shared memory must be protected from concurrent modification.

## The Race Condition

When two threads modify the same data simultaneously without coordination, the result depends on which thread runs first. This is a race condition.

```python
## Two threads both execute this:
count = count + 1

## The operation is actually three steps:
## 1. Read count from memory into CPU register
## 2. Add 1 to the register value
## 3. Write the result back to memory

## Thread A reads count = 5
## Thread B reads count = 5 (before A has written back)
## Thread A writes 6
## Thread B writes 6
## Final count: 6 — should be 7
```

This bug is non-deterministic — it only manifests when threads are interleaved at exactly the wrong point. It may not reproduce in testing. It will appear in production under load.

**Fix: use a lock (mutex) to enforce exclusive access**:

```python
import threading
lock = threading.Lock()

def increment():
    with lock:          # Only one thread at a time
        count += 1      # Safe: no concurrent modification
```

## Concurrency vs Parallelism

These terms are often used interchangeably. They describe different things.

**Concurrency**: multiple tasks are in progress simultaneously (but may not be running at the same instant). A single-core CPU can run concurrent tasks by rapidly switching between them.

**Parallelism**: multiple tasks are running at the same instant, on multiple CPU cores or CPUs.

A web server handling 1000 requests on 4 cores is concurrent and parallel: each core runs one request at a time, but all 1000 requests are in progress simultaneously (most are waiting on I/O).

## Python's GIL: A Special Case

Python's Global Interpreter Lock (GIL) prevents multiple Python threads from executing Python bytecode simultaneously. This is a design decision in CPython (the reference implementation) that simplifies memory management at the cost of true thread parallelism.

Implications:
- **CPU-bound Python code**: threading does not improve throughput. Use `multiprocessing` (separate processes) instead.
- **I/O-bound Python code**: threading works fine, because threads release the GIL while waiting on I/O. `asyncio` (async/await) is more efficient for high concurrency I/O-bound workloads.
- **Java, Go, C#, Rust**: no GIL. Multiple threads execute truly in parallel. Thread safety must be managed explicitly.

## Practical: Reading CPU and Thread State

```bash
## Number of CPU cores
nproc
lscpu | grep "CPU(s)"

## Threads per process (Linux)
ls /proc/<PID>/task | wc -l

## System-wide thread count
ps -eo nlwp | tail -n +2 | awk '{sum+=$1} END {print sum}'

## Thread and CPU usage breakdown
pidstat -t -p <PID> 1
```

Understanding these diagnostics is what separates engineers who describe a performance problem ("the app is slow") from engineers who can quantify it ("the process has 200 threads, 40 of which are blocked waiting on a database lock, CPU idle is 85% — this is lock contention, not CPU starvation").

The next lesson covers memory management at the OS level — virtual memory, page faults, swap, and the `/proc` filesystem that exposes all of it.
