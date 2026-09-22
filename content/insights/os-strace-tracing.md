---
title: "System Call Tracing with strace and ltrace"
description: "Using strace to see every system call a process makes, ltrace for library calls, and perf trace for lightweight production tracing — the toolkit for debugging black-box performance problems."
date: 2027-08-18
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 19
format: article
---

When a process misbehaves and you cannot read its source code, or when documentation and logs give you nothing, strace lets you see exactly what the process is asking the kernel to do. Every file it opens, every network connection it makes, every signal it receives — all visible. This lesson covers strace, ltrace, and perf trace, and the practical patterns for diagnosing real production problems.

## How System Call Tracing Works

Every interaction between a user-space process and the kernel happens via system calls. Reading a file calls `read()`. Creating a socket calls `socket()`. Allocating memory calls `mmap()`. strace intercepts these calls using the `ptrace` mechanism and logs them with arguments and return values.

The cost: strace slows the traced process significantly (2–10x). Use `strace -c` for statistics in production; use full strace in dev/staging or for brief targeted captures.

## strace basics

```bash
## Trace a new command
strace ls -la /tmp

## Trace a running process by PID
sudo strace -p 1234

## Trace with timestamps (absolute time)
strace -t ls /tmp

## Trace with high-resolution timestamps (relative from start)
strace -T ls /tmp    # -T: show time spent in each syscall

## Summary statistics — safe for production use (low overhead)
strace -c -p 1234 -- sleep 30
## Shows: syscall counts, time in each call, error counts

## Follow child processes (important for multi-process servers)
strace -f ls /tmp

## Trace all threads of a process
strace -fp 1234
```

## Filtering to specific syscalls

Full strace output is overwhelming. Filter to what you need.

```bash
## Trace only file operations
strace -e trace=open,openat,read,write,close,stat,lstat ls /tmp

## Trace only network operations
strace -e trace=socket,connect,bind,listen,accept,send,recv,sendto,recvfrom curl https://example.com

## Trace only process/signal operations
strace -e trace=fork,clone,execve,exit,kill,signal ls

## Using categories (shorthand)
strace -e trace=file   ls /tmp    # all file-related syscalls
strace -e trace=network curl ...  # all network-related syscalls
strace -e trace=process ls        # all process-related syscalls
strace -e trace=ipc    ...        # IPC: pipe, socket, mq_*

## Trace with output to file (avoids mixing with application output)
strace -o /tmp/trace.txt -p 1234
```

## Practical diagnosis patterns

**Why is this process slow to start?**
```bash
strace -T -e trace=openat command 2>&1 | sort -t= -k2 -rn | head -20
## Shows which file opens take the most time
```

**What files is this process reading?**
```bash
strace -e trace=openat,read -p 1234 2>&1 | grep '"/'
## Shows all absolute paths being opened
```

**Why is the application failing to connect?**
```bash
strace -e trace=network,socket curl http://internal-service:8080 2>&1 | grep -E "connect|ECONNREFUSED|ETIMEDOUT"
```

**What is blocking this process?** (sleeping on a syscall)
```bash
## Find what syscall a process is currently blocked in
cat /proc/1234/wchan
## Shows the kernel function where the process is sleeping

## More detail
cat /proc/1234/status | grep State
## State: S (sleeping) — waiting on something
## State: D (uninterruptible sleep) — waiting on I/O or kernel lock
## D state: check iostat for I/O saturation, or look for lock contention
```

**Which config file is actually being read?**
```bash
strace -e trace=openat nginx -t 2>&1 | grep -v ENOENT | grep '"/'
## ENOENT = file not found; filter those out to see files that were actually opened
```

## Reading strace output

```
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
read(3, "\177ELF\2\1\1\3\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0P\237\2\0\0\0\0\0"..., 832) = 832
close(3)                                = 0
connect(4, {sa_family=AF_INET, sin_port=htons(80), sin_addr=inet_addr("93.184.216.34")}, 16) = -1 ECONNREFUSED (Connection refused)
```

Format: `syscall(arguments) = return_value [error message]`

Return values:
- Non-negative = success (often a file descriptor number for open calls)
- `-1` = error; the `E*` code tells you what failed
  - `ENOENT` — no such file or directory
  - `EACCES` — permission denied
  - `ECONNREFUSED` — TCP connection refused (port is not listening)
  - `ETIMEDOUT` — connection timed out (firewall drop, host unreachable)
  - `EAGAIN` — resource temporarily unavailable (non-blocking socket, try again)

## ltrace — library call tracing

Where strace shows kernel calls, ltrace shows calls to shared libraries (libc, libssl, etc.).

```bash
## Trace library calls for a command
ltrace ls /tmp

## Trace a running process
sudo ltrace -p 1234

## Summary (counts and time)
ltrace -c ls /tmp

## Show both syscalls and library calls
ltrace -S ls /tmp
```

ltrace is useful for diagnosing issues in applications where the problem is in a library rather than a syscall — for example, tracing OpenSSL function calls to debug TLS certificate validation problems.

## perf trace — lightweight production tracing

`strace` uses `ptrace` which stops the process for each syscall. `perf trace` uses kernel tracepoints and perf ring buffers — much lower overhead, suitable for brief production captures.

```bash
## Trace syscalls for a PID (low overhead)
sudo perf trace -p 1234 -- sleep 10

## Trace only specific syscalls
sudo perf trace -e openat,read,write -p 1234 -- sleep 10

## Summary statistics (very low overhead, similar to strace -c)
sudo perf trace -s -p 1234 -- sleep 30

## System-wide trace for 10 seconds
sudo perf trace -a -- sleep 10 2>&1 | head -100
```

## Diagnosing a real scenario: application hangs

```bash
## Step 1: find the PID
pgrep -l myapp

## Step 2: what state is it in?
cat /proc/<PID>/status | grep State
## D = uninterruptible sleep: waiting on I/O or kernel lock
## S = sleeping: blocked on a syscall

## Step 3: what syscall is it blocked on?
cat /proc/<PID>/syscall
## Output: syscall_number arg0 arg1 ... sp pc
## First number is the syscall number

## Look up the syscall number
ausyscall --dump | grep "^<number>"

## Step 4: what is the call stack?
cat /proc/<PID>/stack   # kernel stack
## Requires CONFIG_STACKTRACE=y in kernel

## Step 5: if it is in a read() or write(), what fd?
ls -la /proc/<PID>/fd   # see all open file descriptors
## fd 7 -> /data/large-file.dat: probably waiting on a slow NFS read

## Step 6: correlate with iostat to confirm I/O wait
iostat -xz 1 5
```

This sequence — state check, syscall identification, file descriptor inspection, I/O correlation — resolves most "application is stuck" problems without needing source code access.
