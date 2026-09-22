---
title: "Disk I/O Performance Analysis on Linux"
description: "Using iostat, iotop, and fio to measure disk throughput, latency, and queue depth — and diagnosing the I/O bottlenecks that silently degrade production databases."
date: 2026-08-24
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 17
format: article
---

Disk I/O problems are the most deceptive category of Linux performance issues. An application stalls, CPU shows low utilisation, memory looks fine — and you discover that everything is waiting on disk. Databases, log pipelines, and container image pulls are the most common offenders. Understanding what the storage stack is telling you is a prerequisite for any serious Linux work.

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
- `aqu-sz` — average queue depth. Values consistently above 1–2 indicate the device cannot keep up with the request rate.
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
vm.dirty_ratio = 10          # start background write at 10% of RAM
vm.dirty_background_ratio = 5  # flush when dirty pages hit 5% of RAM
vm.dirty_expire_centisecs = 3000  # flush pages older than 30 seconds
vm.dirty_writeback_centisecs = 500  # check for dirty pages every 5 seconds

sysctl -p   # apply immediately

## For databases, disable page cache entirely and use O_DIRECT
## PostgreSQL: fsync = on, full_page_writes = on handles its own durability
## The database bypasses the page cache with O_DIRECT
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
