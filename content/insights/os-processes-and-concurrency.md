---
title: "Processes, Threads, and Concurrency: What Every Engineer Must Understand"
description: "The difference between a process and a thread, how concurrency works in production systems, and why your program behaves differently on a multi-core server than on your laptop."
date: 2027-08-23
tags: ["Programming", "Fundamentals"]
series: "Operating Systems for Engineers"
seriesOrder: 2
format: article
---

Some difficult production bugs depend on timing. Two operations that should not happen simultaneously are happening simultaneously. Understanding processes, threads, and concurrency is not theoretical knowledge — it is the foundation for diagnosing the class of bugs that only appear at load, under specific timing conditions, or in production environments with multiple CPU cores.

## Process: The Unit of Isolation

A process is a running instance of a program. It has:
- Its own virtual address space, subject to explicit shared mappings and privileged inspection mechanisms
- Its own file descriptors (open files, network connections)
- At least one thread of execution
- A process ID (PID) assigned by the OS

When you run a Python script, start a web server, or launch a database — each creates one or more processes. The isolation is enforced by the OS: ordinary private-memory access is isolated, although shared memory, privileged access, and kernel faults are important qualifications.

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

Threads often have lower creation overhead and can communicate through shared memory. Process creation costs depend on the mechanism; Linux fork uses copy-on-write rather than eagerly copying every page. The cost: shared memory must be protected from concurrent modification.

## The Race Condition

A race condition occurs when correctness depends on an uncontrolled ordering of operations. Conflicting reads and writes can interleave on one core as well as execute across several cores; two simultaneous writes are only one possible example.

```python
## Two threads both execute this:
count = count + 1

## Conceptual read-modify-write model, not exact Python instructions:
## 1. Read the current count
## 2. Compute an incremented value
## 3. Store the new value

## Thread A reads count = 5
## Thread B reads count = 5 (before A has written back)
## Thread A writes 6
## Thread B writes 6
## Final count: 6 — should be 7
```

This illustrates a possible lost-update interleaving. Whether this exact Python expression reproduces it depends on implementation, version and execution details; it is not a portable race trigger. A particular run may not expose the problem. Load can increase the chance of exposing it, but a deterministic test is preferable to waiting for production.

**Fix: use a lock (mutex) to enforce exclusive access**:

```python
import threading
lock = threading.Lock()

def increment():
    global count
    with lock:          # One holder of this lock at a time
        count += 1      # All competing accesses must follow the same rule
```

## Concurrency vs Parallelism

These terms are often used interchangeably. They describe different things.

**Concurrency**: multiple tasks are in progress simultaneously (but may not be running at the same instant). A single-core CPU can run concurrent tasks by rapidly switching between them.

**Parallelism**: multiple tasks are running at the same instant, on multiple CPU cores or CPUs.

A server with 1,000 requests in progress is concurrent. It is also executing work in parallel only when its runtime and worker configuration actually use multiple execution resources at once. A single event loop can overlap many waiting requests without running their application code on four cores.

## Python's GIL: A Special Case

A conventional GIL-enabled CPython build permits only one thread at a time to execute Python bytecode within the relevant interpreter. Free-threaded builds and other implementations require separate consideration. This is a design decision in CPython (the reference implementation) that simplifies memory management at the cost of true thread parallelism.

Implications:
- **CPU-bound Python code**: in a conventional GIL-enabled interpreter, threads generally do not execute Python bytecode in parallel. Native extensions that release the GIL are a qualification. Separate processes can use multiple cores, but measure serialisation, startup and coordination costs.
- **I/O-bound Python code**: many blocking I/O operations release the GIL, allowing other threads to progress; verify the libraries and their concurrency contracts. `asyncio` can support many waiting tasks with suitable nonblocking libraries; measure its cost for the workload.
- **Java, Go, C#, Rust**: their common runtimes do not impose CPython's interpreter-wide bytecode lock. Suitable workers can execute in parallel when CPU resources and scheduling permit. Shared state still requires appropriate synchronisation.

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

These commands establish process and CPU context, not the cause of every wait. In a hypothetical investigation, 200 threads and 85% host CPU idle would not alone prove database contention. Correlating thread stacks, traces and database lock records might show that 40 requests are waiting on one lock; CPU quotas and affinity still need checking.

The next lesson covers memory management at the OS level — virtual memory, page faults, swap, and the `/proc` filesystem that exposes all of it.

## Start with the invariant, not the thread count

An invariant is a property that must remain true across operations. For a fictional ticket service, one seat must not be sold twice. A lock around an in-memory counter can protect threads in one process, but it does not coordinate two independent application processes or an external database writer. The protection must exist at the scope where competing updates occur.

For a database-backed seat reservation, inspect the transaction and uniqueness or conditional-update rule. If the application checks availability and then performs an unrelated write, another request can change the seat between those steps. Adding more web workers makes the timing easier to encounter but does not create the underlying correctness problem. The issue is the unprotected read-modify-write contract.

A race condition need not involve simultaneous physical execution. Two tasks on one core can interleave across waits and produce an invalid result. Conversely, two tasks executing on separate cores can be safe when they operate on independent state or use appropriate synchronisation. Concurrency describes overlapping progress; correctness depends on the allowed interleavings.

## Work through a capacity model

Assume a fictional worker requires 25 milliseconds of CPU time and 75 milliseconds waiting for an external response per job. Serial processing takes 100 milliseconds per job, or at most ten jobs per second under these simplified assumptions. One fully available CPU can supply at most 1,000 / 25 = 40 jobs per second of CPU work. Four overlapping jobs could hide the assumed waits enough to approach that CPU ceiling, if the dependency and scheduler permit it.

The chart compares the ten-job serial ceiling and the forty-job CPU ceiling. It does not predict actual throughput or guarantee that four threads achieve it. Queueing, variable service time, network limits, lock contention, and memory overhead are excluded. The model helps identify what to measure before increasing concurrency.

At forty jobs per second, if the external service slows from 75 to 750 milliseconds, much more work remains in flight. A fixed worker limit may cause queue growth; an unlimited policy may consume memory and connections. Set an admission limit, a deadline, and an overload response. Concurrency is a resource budget, not a free optimisation.

## Build a deterministic race exercise

Use synthetic state and two workers. Instead of hoping a loop reproduces a race, place a barrier after each worker reads the shared value and before either writes it. Both workers can then deliberately act on the same old value. Verify the incorrect final state, add the synchronisation or atomic operation, and verify the invariant again.

In Python, keep the example's scope correct: a function assigning a module-level counter needs `global count`, or the state should be stored in an explicit object. Do not assume a particular bytecode sequence or interpreter scheduling makes a high-level operation safe. Document the interpreter build, especially when comparing conventional GIL-enabled CPython with free-threaded builds or native extensions that release the GIL.

Next test cancellation. Stop a worker after it reserves a ticket but before it acknowledges the request. Determine whether the reservation remains, expires, or is rolled back. A caller timing out does not automatically undo a database commit. This exercise connects local concurrency to the externally visible request contract.

## Interpret thread observations carefully

Two hundred threads do not imply two hundred active CPU consumers. Some may sleep, wait on a condition variable, or block in a dependency. A sampled blocked state also does not identify its business cause by itself. Correlate thread stacks, lock ownership, application traces, and dependency measurements over the same interval.

CPU percentages need a denominator. A process using one full core may appear as 100% in one tool and a fraction of total machine capacity in another. A container with a quota of one CPU can be constrained on a many-core host. Record effective quota and affinity alongside utilisation before concluding that the host has enough available capacity for the process.

Locks introduce their own failure modes: inconsistent acquisition order can deadlock, a long critical section can serialize unrelated work, and cancellation can leave resources unreleased if cleanup is wrong. Keep critical sections small enough to explain, avoid remote calls while holding a lock when possible, and test failure paths. The goal is not maximum parallelism. It is correct progress within a measured resource envelope.

## Further reading and source boundaries

- [Linux manual: threads](https://man7.org/linux/man-pages/man7/pthreads.7.html)
- [Linux manual: fork](https://man7.org/linux/man-pages/man2/fork.2.html)
- [Linux kernel: cgroup v2](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html)
- [Python: free-threaded execution](https://docs.python.org/3/howto/free-threading-python.html)
