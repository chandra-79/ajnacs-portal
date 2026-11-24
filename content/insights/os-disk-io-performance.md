---
title: "Disk I/O Performance Analysis on Linux"
description: "Using iostat, iotop, and fio to measure disk throughput, latency, and queue depth — and diagnosing the I/O bottlenecks that silently degrade production databases."
date: 2025-04-30
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 17
format: article
---

Disk I/O problems are the most deceptive category of Linux performance issues. An application stalls, CPU shows low utilisation, memory looks fine — and you discover that everything is waiting on disk. Databases, log pipelines, and container image pulls are the most common offenders. Understanding what the storage stack is telling you is a prerequisite for any serious Linux work.

## What to measure

**IOPS and p99 at a fixed queue depth.** At a fixed 4 KiB block size and queue depth, record IOPS, throughput and p99 latency. At 25,000 operations/s, throughput is about 102 MB/s in decimal units. A higher queue depth can increase throughput and worsen tails simultaneously.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The Storage Stack

Before measuring, understand what you are measuring. A write from an application travels through:

1. Application buffer (write() call)
2. Page cache (kernel buffer — Linux may return immediately here)
3. Block layer (I/O scheduler queues requests)
4. Device driver
5. Actual hardware (HDD, SSD, NVMe, SAN LUN, EBS volume)

`iostat` and `iotop` observe traffic at the block device layer (between 3 and 4). They do not distinguish between page cache hits and actual device I/O. If your application has high throughput but low `iostat` numbers, the page cache is absorbing the writes.

## iostat — device-level I/O statistics

```bash
## Install
apt install sysstat

## Basic: device utilisation every 2 seconds
iostat -d 2

## Extended — the key diagnostic view
iostat -xz 2
## -x: extended statistics
## -z: omit devices with no activity

## Example output:
## Device   r/s    w/s  rMB/s  wMB/s  rrqm/s  wrqm/s  %rrqm  %wrqm  r_await  w_await  aqu-sz  rareq-sz  wareq-sz  svctm  %util
## nvme0n1  42.0  180.0   0.52   2.25     0.0    32.0    0.0   15.1     0.42    12.30    2.21      12.6      12.8    0.18   22.1
## sdb       0.0    0.0    0.0    0.0     0.0     0.0    0.0    0.0     0.00     0.00    0.00       0.0       0.0    0.00    0.0
```

**Key columns**:
- `r/s`, `w/s` — reads and writes per second (IOPS)
- `rMB/s`, `wMB/s` — throughput in MB/s
- `r_await`, `w_await` — average time in milliseconds for a read/write request to complete (from I/O submission to completion). This includes queue wait time. For NVMe: sub-millisecond is normal. For SSD: 1–5ms. For HDD: 5–20ms. Higher means the device is overwhelmed.
- `aqu-sz` — average queue depth. Read this alongside throughput and tail latency for the same request mix. Parallel devices can sustain multiple outstanding operations.
- `%util` — percentage of time the device had at least one request in flight. For HDDs, 100% = saturated. For SSDs and NVMe, 100% is less meaningful because they can service multiple requests in parallel (check `aqu-sz` instead).

```bash
## Watch just the metrics that matter
iostat -xz 1 | awk '/Device/{header=1} header && /nvme|sd/{print $1, "r/s="$2, "w/s="$3, "await_r="$10, "await_w="$11, "%util="$NF}'
```

## iotop — which process is doing the I/O

```bash
apt install iotop

## Interactive mode
sudo iotop

## Non-interactive snapshot (useful in scripts)
sudo iotop -b -n 3 -o   # -b: batch, -n 3: 3 samples, -o: only processes with I/O

## Keys in interactive mode:
## o — toggle showing only processes with I/O
## a — toggle accumulated vs current I/O
## r — sort order
```

iotop answers "which process is causing this I/O." This is the first question when `iostat` shows saturation but you do not know the culprit.

## fio — benchmarking actual storage performance

`fio` (Flexible I/O Tester) lets you measure what your storage can actually deliver, and test specific access patterns before deploying a workload.

```bash
apt install fio

## Sequential read throughput (large file streaming, log reads)
fio --name=seq-read --ioengine=libaio --direct=1 --rw=read \
    --bs=1M --size=4G --numjobs=1 --iodepth=32 \
    --filename=/data/fio-test --group_reporting

## Sequential write throughput
fio --name=seq-write --ioengine=libaio --direct=1 --rw=write \
    --bs=1M --size=4G --numjobs=1 --iodepth=32 \
    --filename=/data/fio-test --group_reporting

## Random read IOPS (database reads)
fio --name=rand-read --ioengine=libaio --direct=1 --rw=randread \
    --bs=4k --size=4G --numjobs=4 --iodepth=64 \
    --filename=/data/fio-test --group_reporting

## Random write IOPS (database writes)
fio --name=rand-write --ioengine=libaio --direct=1 --rw=randwrite \
    --bs=4k --size=4G --numjobs=4 --iodepth=64 \
    --filename=/data/fio-test --group_reporting

## Mixed 70/30 read/write — typical OLTP workload
fio --name=mixed-oltp --ioengine=libaio --direct=1 --rw=randrw \
    --rwmixread=70 --bs=4k --size=4G --numjobs=4 --iodepth=64 \
    --filename=/data/fio-test --group_reporting

## Latency test — 4K random reads, low queue depth (single-threaded app)
fio --name=latency --ioengine=libaio --direct=1 --rw=randread \
    --bs=4k --size=512M --numjobs=1 --iodepth=1 \
    --filename=/data/fio-test --group_reporting --lat_percentiles=1
```

**Reading fio output**:
```
randread: (groupid=0, jobs=4): err= 0: pid=12345
  read: IOPS=48.2k, BW=188MiB/s (197MB/s)(4096MiB/21745msec)
    lat (usec): min=82, max=4327, avg=832.14, stdev=198.23
    lat (usec): 95.00th=[1221], 99.00th=[1533], 99.50th=[1713], 99.90th=[2212]
```

IOPS, bandwidth, and latency percentiles. The 99th and 99.9th latency percentiles matter more than averages for database workloads — those tail latencies are what users and queries actually experience.

## The I/O Scheduler

The Linux block layer queues and reorders I/O requests before sending them to the device. The right scheduler depends on the device type.

```bash
## Check the scheduler for each device
cat /sys/block/sda/queue/scheduler
## [mq-deadline] kyber none   — the one in brackets is active

## Available schedulers:
## none         — no scheduling, submit directly (best for NVMe SSDs)
## mq-deadline  — deadline-based, good for HDDs and SSDs
## kyber        — targets latency, better for SSDs under mixed load
## bfq          — fairness, good for desktop/multi-tenant environments

## Change scheduler
echo none | sudo tee /sys/block/nvme0n1/queue/scheduler      # NVMe — use none
echo mq-deadline | sudo tee /sys/block/sda/queue/scheduler   # HDD — use deadline

## Make persistent (udev rule)
## /etc/udev/rules.d/60-scheduler.rules
ACTION=="add|change", KERNEL=="nvme*", ATTR{queue/scheduler}="none"
ACTION=="add|change", KERNEL=="sd*", ATTR{queue/scheduler}="mq-deadline"
```

## Diagnosing Slow Write Performance

```bash
## Is the page cache flushing to disk slowly?
cat /proc/meminfo | grep -E "Dirty|Writeback"
## High Dirty (several GB) = writes are buffered but not flushed
## High Writeback = currently flushing to disk

## Tuning page cache flush behaviour
## /etc/sysctl.conf
vm.dirty_ratio = 10          # writing processes participate at 10% of eligible memory
vm.dirty_background_ratio = 5  # background writeback threshold at 5% of eligible memory
vm.dirty_expire_centisecs = 3000  # flush pages older than 30 seconds
vm.dirty_writeback_centisecs = 500  # check for dirty pages every 5 seconds

sysctl -p   # apply immediately

## Measure the database’s actual cache and durability behavior.
## PostgreSQL uses shared buffers and can benefit from the operating system page cache.
## Keep durability settings enabled and measure the end-to-end commit latency.
```

## Diagnosing I/O Latency Spikes

Latency spikes (not sustained high latency) are usually caused by:
1. **Write-back flushes** — the page cache flushes a burst of dirty pages
2. **GC/compaction** — SSDs and NVMe doing garbage collection
3. **Snapshots** — LVM/EBS snapshots causing copy-on-write delays
4. **Network storage** — EBS, NFS, or iSCSI network hiccups

```bash
## Capture per-request latency with blktrace
sudo blktrace -d /dev/nvme0n1 -o trace -- sleep 10
blkparse trace.blktrace.0 | grep "D A" | awk '{print $7}' | sort -n | tail -20

## Per-request histogram with bpftrace (requires kernel 4.9+)
sudo bpftrace -e '
  kprobe:blk_mq_start_request { @start[arg0] = nsecs; }
  kprobe:blk_account_io_done /@start[arg0]/ {
    @usecs = hist((nsecs - @start[arg0]) / 1000);
    delete(@start[arg0]);
  }
  END { print(@usecs); }
'
```

The output is a histogram of I/O completion times in microseconds, showing exactly where the latency distribution sits and whether there are outlier spikes.

## Start with the time the application actually waits

Pick a user-visible operation such as a transaction commit and record its elapsed time. Break the timeline into application work, writes issued, durability calls, and acknowledgement. Align these with device-level reads, writes, and queue metrics. Use the process, container, and filesystem identities to correlate them. A single elevated device average cannot explain the path of a particular transaction. For remote storage, include client-side request time and the provider’s resource metrics because the issue can be outside the guest’s block layer.

A buffered write can finish quickly while the kernel still holds dirty data. For a service that promises durable results, collect timing for the operation that actually forces the intended durability guarantee. Compare the storage benchmark’s completion semantics to the application’s. Direct I/O, synchronous open options, and explicit synchronization calls answer different questions. The Linux kernel’s [virtual-memory documentation](https://docs.kernel.org/admin-guide/sysctl/vm.html) distinguishes the thresholds for background writeback and for write-generating processes to participate. Verify database access and synchronization behavior for the installed database version. For example, PostgreSQL uses its own shared buffers and may use the operating-system page cache. Its [resource configuration documentation](https://www.postgresql.org/docs/current/runtime-config-resource.html) discusses their interaction.

## Interpret queue depth as a workload measurement

At a stable rate, average in-flight work approximates average completion rate times average duration over matching boundaries. In an illustrative run, 8,000 completed operations/s averaging 2 ms implies about 16 outstanding requests on average. That can be an efficient operating point for a parallel device. For a single transactional thread waiting for one operation at a time, concurrency is limited and the same storage might feel slow even at a tiny fraction of its maximum throughput. Compare the actual workload against a measured latency-throughput curve before deciding a queue depth is too high.

Averages also hide mixtures. A 4 KiB random read and a 1 MiB sequential write use storage differently. Separate reads from writes at minimum, and include operation size and whether they share the device. Observe how the same arrival rate behaves at different points in the volume’s operating range. If the service improves when writers stop while reads continue, investigate contention, upload bursts, or flushing. If the database still waits on one slow write at low volume, focus on its individual durable-write latency.

Select the correct block layer. In a device-mapper setup, a logical volume and an underlying device can each report the same operation at different stages. Summing them double counts traffic. Locate the filesystem’s actual device and follow its parent chain. The kernel’s [I/O statistics field descriptions](https://docs.kernel.org/admin-guide/iostats.html) explain the underlying counters and what time in flight captures. Use device utilization, observed completions, and latency together when judging a multi-queue device.

## Use pressure data to confirm impact on work

Check I/O pressure stall information with kernel support enabled. It measures time workloads spend stalled on I/O resources and adds a workload-oriented perspective to device counters. Compare available workload-level pressure with host pressure where the hierarchy exposes both. Read `/proc/pressure/io` for the host view. A background test can keep a device busy while business applications still meet their objectives. A workload with repeated delays and rising I/O stall time deserves investigation even if other tenants remain healthy.

Record the measurement window when using pressure averages. Two dashboard samples at different rollup periods can disagree without either being wrong. Report the difference in total stall time across a known interval when comparing short experiments. Correlate with per-process I/O and application traces. Account for asynchronous writeback and journalling, whose device work can appear under a different task from the one that initiated the original write. Pressure is evidence of a stall, and the timing and attribution data help identify the responsible path. The Linux kernel provides a [pressure stall reference](https://docs.kernel.org/accounting/psi.html).

## Design a storage test that reproduces the production constraint

Use a disposable file on the intended mount, record the file size, and preserve enough free space for the test and existing services. Write-test only a nonproduction target prepared for the experiment. Choose an I/O engine and verify achieved queue depth rather than reading it only from the command line. A nominal queue depth can differ from actual concurrency depending on the engine, buffered operation, and workload shape. Review the I/O depth distribution together with completion latency and scheduling delays in the tool output. The [fio reference](https://fio.readthedocs.io/en/latest/fio_doc.html) documents these options and output.

Build a load series with shallow concurrency to capture baseline latency and larger concurrency to find where throughput stops growing. Test the real read/write mix and include synchronization if the application actually synchronizes durable transactions. Use a documented warm-up, run long enough to detect temporary volume burst limits, and repeat the same schedule after a change. Save job files and volume settings including provisioned bandwidth or IOPS limits. Comparing runs on different volume types or burst states can be useful when those conditions are the variable being studied. Keep the baseline consistent when isolating another factor.

A hypothetical device holds p99 read latency under 4 ms through 12,000 IOPS and reaches 15,000 IOPS at p99 14 ms. A service with a 5 ms storage budget would need to operate closer to the first measured point or change its workload. Those figures illustrate the comparison, rather than forecasting a specific class of device. Retain enough samples to interpret high percentiles, and compare only like latency definitions. A percentile from an I/O generator does not include the rest of the application’s request path.

## Require a falsifiable explanation for a change

If you suspect periodic writeback, look for dirty-memory growth and a burst of writes aligned with the slow application interval. Record the current kernel settings and compare the expected behavior with a controlled change on a candidate host. Changing a scheduler may help if work is queued differently at the block layer. It cannot eliminate a provider bandwidth cap or a database lock. Verify an improvement at the business operation boundary and check that backgrounds such as exports or backups still finish within their objectives.

If you use event tracing, document which timestamps are collected and what they represent. A dispatch timestamp paired with its matching completion can yield time after dispatch. One timestamp with no matched event does not yield a duration. Validate the probe names and arguments against the running kernel and account for events that are dropped, merged, or otherwise unavailable. Keep host overlays and test artifacts long enough for a teammate to reproduce the measurement. End with a record of the bottleneck isolated, the change evaluated, and what new evidence would make you revisit the conclusion.

Include at least one test condition that leaves the original code and storage settings intact while varying only the suspected competing work. For example, shift an export window and compare the same commit workload between normal and export periods. When moving the export improves the transaction objective, measure where the export now competes and whether that new slot is acceptable for both services.
