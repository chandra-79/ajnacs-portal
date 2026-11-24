---
title: "CPU and Memory Performance Analysis on Linux"
description: "How to read top, htop, vmstat, sar, and perf to diagnose CPU saturation, memory pressure, and kernel bottlenecks before they become outages."
date: 2027-08-09
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 16
format: article
---

Performance analysis is not about running a tool and reading a number. It is about building a mental model of what the system is doing, then confirming or refuting that model with data. Linux exposes extensive host, process, and control-group instrumentation. The tools in this lesson expose complementary evidence — from CPU scheduling to kernel memory reclaim — with sampling and scope limits that the investigation must record.

## The USE Method

Before opening any tool, know what you are measuring. Brendan Gregg's USE Method gives a framework:

- **Utilisation** — how much of the resource is in use (0–100%)
- **Saturation** — how much work is queued waiting for the resource
- **Errors** — whether the resource is reporting faults

Interpret utilization together with runnable work, effective CPU entitlement, per-core balance, and service symptoms. A host-wide average can hide a busy core or a throttled container.

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

**Load average** includes runnable tasks and tasks in uninterruptible sleep, averaged over 1, 5, and 15 minutes. It is not a CPU-utilization percentage or a direct wait-time multiplier. Compare it with CPU entitlement, task states, and latency; a rising trend shows increasing load, which may be healthy work or contention.

**CPU breakdown**:
- `us` — user space (your application code)
- `sy` — kernel/system (syscalls, kernel threads)
- `wa` — I/O-wait accounting during idle CPU time; interpretation is subtle on multicore systems and does not directly measure a disk queue
- `hi` — hardware interrupt handlers
- `si` — software interrupt processing; networking can contribute, but high `si` alone does not prove network saturation
- `st` — stolen by a hypervisor (on VMs — time the hypervisor gave to another guest)

**Memory**: Linux uses otherwise available memory for caches, so a small `free` value alone does not establish pressure. `avail Mem` estimates memory available for new applications without swapping; it is not an allocation guarantee. Correlate low availability with reclaim, active swapping, pressure signals and service latency. Previously used swap can remain allocated after pressure has subsided.

## vmstat — the faster overview

```bash
vmstat 2 10
## Output every 2 seconds, 10 times

## Output columns:
## r  — runnable processes, including those running or waiting for CPU
## b  — processes in uninterruptible sleep (usually waiting for I/O)
## swpd — swap in use
## free — free memory
## si/so — swap in/out per second; correlate sustained activity with pressure and latency
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

Sustained runnable work above available CPU capacity suggests contention. Blocked tasks and swap activity require correlation with device behavior, pressure, and application latency; neither alone proves saturation or degradation.

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

`sar` (System Activity Reporter, part of the `sysstat` package) can sample and store system statistics on a distribution-configured schedule. It is how you investigate "what happened at 3am?"

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
apt install linux-perf   # Debian; Ubuntu commonly packages perf in matching linux-tools packages
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
## High %sy can involve syscalls or other kernel work; use a bounded profile to distinguish them
## High %si includes softirq work; correlate network counters before attributing it to networking

## Step 5: what CPU is it on? (NUMA, IRQ affinity issues)
cat /proc/<PID>/status | grep Cpus_allowed
```

## Diagnosing Memory Pressure

```bash
## Inspect retained kernel messages, then restrict journal records to the last hour
dmesg | grep -i "oom\|killed process" | tail -20
journalctl -k --since "1 hour ago" | grep -i "oom\|out of memory"

## What is using memory?
ps -eo pid,rss,vsz,comm --sort=-rss | head -20
## rss = resident set size (physical RAM in use)
## vsz = virtual size (mapped, not necessarily in RAM)

## Memory breakdown by category
cat /proc/meminfo

## Key fields in /proc/meminfo:
## MemAvailable  — estimate available without swapping; not a cgroup-specific allocation promise
## Cached        — page cache (files cached in RAM)
## Slab          — kernel data structure cache
## SwapCached    — pages in both swap and RAM (recently swapped back)
## Dirty         — pages that need writing to disk
## Mapped        — files mapped into process address space

## Check for memory-hungry slab caches
slabtop -s c   # sort by cache size

## Check swap activity
vmstat -s | grep -i swap
cat /proc/vmstat | grep pgpg   # pgpgin/pgpgout describe paging I/O; use pswpin/pswpout for swap-page counters
```

## Diagnosing OOM Situations Before They Kill Your Process

The OOM killer picks a process to terminate based on an `oom_score`. You can influence this:

```bash
## See the OOM score for a process (higher = more likely to be killed)
cat /proc/<PID>/oom_score

## Protect a process from the OOM killer (score adjustment)
echo -1000 > /proc/<PID>/oom_score_adj    # minimum = exempt from OOM victim selection; do not apply casually
echo 1000  > /proc/<PID>/oom_score_adj    # maximum adjustment; selection still depends on scope and eligibility

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
## Governor behavior depends on the CPU driver and hardware.
## Names alone do not establish frequency or latency behavior.

## Set all CPUs to performance mode
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

## Check CPU steal (VMs); a nonzero value alone does not establish hypervisor overload
awk '/^cpu / {print "steal ticks:", $9}' /proc/stat
vmstat 1 10 | awk 'NR>2{print $17}'   # st in this common layout; inspect header
```

Sustained steal time can indicate unavailable virtual CPU time. Correlate it with the workload and provider behavior; a fixed 5% threshold is not universal. Rehosting, entitlement changes, and application improvements address different mechanisms and should be evaluated with evidence.

## Start with a service symptom and a sampling window

The first question is not whether a CPU percentage looks high. It is whether a defined service outcome has deteriorated: completed work is falling, request latency exceeds its objective, or jobs are missing their completion window. Record the start and end of the observation, the workload offered, completed units, and errors. Then inspect host and process signals from the same interval. A historical peak from one window cannot explain a latency percentile calculated over another without additional evidence.

Use a comparison period with similar work when possible. A batch that processes larger documents may legitimately use more CPU per item than a prior batch. A higher average utilization can accompany improved throughput rather than degradation. Keep the input mix, concurrency, software version, and machine entitlement beside the measurements. These are the conditions needed to distinguish a capacity problem from a change in the work itself.

Sampling has limits. A one-second average may conceal a short burst, while a single instantaneous reading may overstate a transient event. Capture enough consecutive observations to see the relationship between demand, resource pressure, and the user-visible symptom. If a process disappears during the interval, record its exit rather than silently treating the next process with the same name as a continuous measurement.

## Worked example: reconcile CPU demand with the actual entitlement

Consider a hypothetical worker group with a quota equivalent to two CPU cores, observed for sixty seconds. It completes 300 jobs and consumes 108 CPU-seconds. Average CPU demand is 108 / 60 = 1.8 cores. Relative to its two-core entitlement, that is 90% utilization. Relative to a sixteen-core host, the same usage is only 11.25%. Both percentages can be arithmetically correct while telling very different stories about the worker's constraint.

The accompanying chart compares the available CPU budget, 120 CPU-seconds, with the 108 CPU-seconds consumed in that same window. The difference is twelve CPU-seconds of unused aggregate entitlement; it is not proof that every arriving job could obtain CPU immediately. Bursty parallel work can exhaust a quota within a scheduling period and wait even when a longer average remains below the limit.

The observed CPU cost is 108 / 300 = 0.36 CPU-seconds per completed job. If a comparable follow-up consumes 96 CPU-seconds for the same 300 jobs, the cost becomes 0.32 CPU-seconds per job. That would be an 11.1% reduction in this illustrative CPU cost, calculated as (0.36 - 0.32) / 0.36. It would not by itself prove an equal latency improvement: queueing, I/O, and other dependencies still contribute to elapsed time.

For real measurements, use counter differences rather than subtracting percentages. Check for resets, process replacement, and missing samples. If completed work is zero, report total CPU consumed and leave cost per completion undefined. Do not divide by attempted jobs if retries materially change the amount of useful output.

## Read the container boundary as well as the host

A container can encounter a local CPU or memory constraint while the host has spare resources. Locate the service's cgroup through its process membership and inspect the relevant controller files for that hierarchy. For cgroup v2, `cpu.max`, `cpu.stat`, `memory.current`, `memory.max`, and `memory.events` help describe entitlement and events. Paths differ across service managers and container runtimes; do not assume that a process always belongs to one fixed directory.

The kernel's cgroup documentation defines these interfaces. Use it to distinguish quota enforcement from ordinary competition with other workloads. A count of throttled periods is a clue about enforcement, not a count of failed requests. Correlate changes in the counters with the service symptom and the offered work before deciding that increasing a limit is the right intervention.

Memory needs the same care. Host `MemAvailable` does not guarantee that a constrained cgroup can allocate more memory. A process can also reserve a large virtual address space without making every page resident. Conversely, summing resident-set sizes across processes can double-count shared pages. Choose a measurement that matches the question, and state whether it describes a process, cgroup, or whole machine.

Increasing a memory limit may postpone an out-of-memory event without explaining an unbounded working set. Inspect allocation growth across comparable requests, retained objects where the runtime supports it, and whether the expected workload fits. A resource limit is part of isolation and capacity planning; it should not become an arbitrary number adjusted whenever an alarm fires.

## Add pressure evidence before choosing a remedy

Linux Pressure Stall Information exposes time spent stalled on CPU, memory, or I/O through `/proc/pressure/` and, where supported, per-cgroup files. Its `some` measure concerns time with at least some tasks stalled; `full` has a different meaning and CPU full is not a useful system-wide saturation reading. The units and scope matter. Read the kernel documentation before turning a pressure value into an alert.

Pressure helps ask whether resource scarcity is delaying work, while utilization asks how much resource was busy. Neither identifies the application's cause alone. CPU pressure may support a hypothesis about runnable work waiting. Memory pressure may accompany reclaim. I/O pressure may point toward tasks delayed on storage. Use the signal to choose the next discriminating check, not as a universal diagnosis.

A CPU-bound service may benefit from reducing per-request work, changing concurrency, or supplying more entitlement. A lock-bound service may become worse when more workers compete. A memory-heavy batch may need smaller batches or a corrected retention pattern. A slow dependency may need a bounded timeout or a change in the request path. The remedy follows the mechanism, not the most prominent graph.

## A read-only investigation lab

Use a disposable Linux environment running a workload you are authorised to inspect. Record the CPU count visible to the process, its cgroup membership, the configured quota where present, and the workload's completed-job counter. Capture two counter snapshots separated by a known interval. Record elapsed time using a monotonic clock in your measurement script so wall-clock corrections do not distort the denominator.

Run `vmstat 1 10` and distinguish the initial report, which can summarize activity since boot, from later interval reports. Capture per-CPU information and a process-level view during the same period. If PSI files exist, read them before and after the workload. The lab does not require changing governors, OOM scores, or kernel limits. Those changes would introduce additional variables before the original behavior is understood.

Build a worksheet with columns for interval duration, CPU-seconds, entitlement in cores, completed jobs, queue observations, and error count. Calculate cores used as CPU-seconds divided by elapsed seconds, entitlement utilization as cores used divided by entitled cores, and CPU cost per completion as CPU-seconds divided by completed jobs. Include the units in each heading.

Repeat with one controlled workload change, such as a smaller input batch, while keeping the environment fixed. Explain whether the result supports a change in per-item work, concurrency, or queueing. If the observations do not distinguish these explanations, name the additional signal needed. The objective is a defensible diagnosis, not a collection of screenshots from every available tool.

## Make profiling a bounded experiment

A profile is a sample of execution under specified conditions. Select a representative interval and process scope, retain symbols when permitted, and record the profiler configuration. System-wide collection can include other workloads and sensitive operational details. A process-scoped capture is often a clearer starting point when the service has already been identified.

Check profiling overhead and permissions in a safe environment before using the same procedure during a production incident. Missing stack frames, unavailable hardware counters, and sampling bias can affect interpretation. A wide stack in a profile identifies where sampled execution accumulated; it does not automatically identify wasted work or the best optimization.

After a change, repeat the workload and the service-level measurements. A lower CPU cost that increases errors or worsens tail latency is not a complete success. Preserve the original and follow-up conditions so another engineer can reproduce the comparison and decide whether the improvement applies outside the small test.

A useful handover includes the suspected limiting resource, the evidence that supports it, and the next observation that could disprove the diagnosis. Keep unresolved alternatives visible.

## Primary references

- [Linux kernel: Pressure Stall Information](https://docs.kernel.org/accounting/psi.html)
- [Linux kernel: cgroup v2 interfaces](https://docs.kernel.org/admin-guide/cgroup-v2.html)

- [Linux manual: CPU accounting and steal time](https://www.man7.org/linux/man-pages/man5/proc_stat.5.html)
- [Linux manual: estimated available memory](https://www.man7.org/linux/man-pages/man5/proc_meminfo.5.html)
