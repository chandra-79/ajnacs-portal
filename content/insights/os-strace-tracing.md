---
title: "System Call Tracing with strace and ltrace: Evidence and Limits"
description: "Use focused system-call and library traces to test a diagnostic hypothesis while accounting for overhead, permissions, and sensitive data."
date: 2027-08-13
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 19
format: article
---

When a process misbehaves and you cannot read its source code, or when documentation and logs give you nothing, strace lets you see exactly what the process is asking the kernel to do. Selected system calls and signals can be observed within the attached process scope and tracing permissions. Filters, attachment timing, child-process coverage and other limits affect what the capture establishes. This lesson covers strace, ltrace, and perf trace, and the practical patterns for diagnosing real production problems.

## How System Call Tracing Works

Every interaction between a user-space process and the kernel happens via system calls. Reading a file calls `read()`. Creating a socket calls `socket()`. A runtime may obtain memory with calls such as `mmap()` or `brk()`, but many allocations are satisfied without a new syscall. strace intercepts these calls using the `ptrace` mechanism and logs them with arguments and return values.

Tracing can materially perturb a process. The overhead is workload- and configuration-dependent; summary mode is not automatically low-overhead. Prefer a representative test environment and bounded, targeted captures.

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

## Summary statistics; interrupt after a short authorised observation
strace -c -p 1234
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
strace -e trace=%network curl --max-time 5 https://example.com

## Trace only process/signal operations
strace -e trace=%process,%signal ls

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
strace -T -e trace=openat -o trace.txt command
## Inspect the duration in angle brackets; sorting by return value is not timing
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

Traditional strace tracing uses ptrace stops. perf trace uses performance-event facilities and can have different overhead. Validate the chosen mode, event rate and data exposure before production use.

```bash
## GNU timeout bounds an existing-PID capture; measure overhead
sudo timeout 10s perf trace -p 1234

## Trace only specific syscalls
sudo timeout 10s perf trace -e openat,read,write -p 1234

## Summary statistics; measure overhead for the chosen event volume
sudo timeout 30s perf trace -s -p 1234

## System-wide capture: use only in an authorised disposable lab
sudo timeout 10s perf trace -a -o perf-trace.log
## timeout normally exits 124 when its time limit stops the capture
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

This sequence can narrow a blocking hypothesis without source access. It does not establish the cause of every hang, and user-space contention may require runtime stacks or profiling.

## Start with a question and a stop condition

A trace is most useful when it tests a specific hypothesis: is the process opening the expected configuration file, repeatedly failing a connection, or waiting on a particular descriptor? Capture only the relevant process and syscall categories for a bounded interval. An unrestricted trace of every process produces a large sensitive artifact and can make the original incident harder to interpret.

Define the stop condition before attaching: enough evidence to observe one failing operation, a small time limit, or a maximum file size under the chosen capture method. Keep the output on storage that cannot fill the application's critical volume. Verify permissions and tracing policy in the environment rather than reaching immediately for unrestricted privileges.

Do not assume summary mode removes instrumentation cost. `strace -c` reduces printed detail but still observes the traced calls. The slowdown depends on syscall frequency, process behaviour, kernel features, filters, and capture mode. Measure the effect on a representative test process before treating it as acceptable for a latency-sensitive service.

## Distinguish syscall time from request time

Suppose a fictional short capture observes forty configuration opens, ten socket connection attempts, and fifty reads. The chart displays these counts: 40, 10, and 50. They total 100 selected calls, but they do not describe all work performed by the process. They exclude CPU-only computation, unselected syscalls, and activity outside the interval.

If the forty opens repeatedly search nonexistent optional configuration paths, that may be normal library probing. If the application expected one fixed file and fails all forty times, the same count suggests a different problem. An error count requires semantic context. Removing every `ENOENT` line can hide the exact missing-file failure you were trying to diagnose.

Elapsed duration shown for a call can include waiting and scheduler delay. It does not necessarily measure CPU consumed by that kernel operation. Summary modes have their own timing options, so label the measurement precisely. Adding syscall durations across concurrent threads can exceed wall-clock capture duration and must not be presented as a serial request breakdown.

## Correlate descriptors with their lifecycle

A descriptor number is local to a process and can be reused after closing. Descriptor seven may refer to a file at one time and a socket later. Follow the open, duplication, and close sequence rather than attaching permanent meaning to the number. Include process or thread identifiers when following children, and keep unfinished/resumed calls paired correctly.

A path shown in a trace is also interpreted within the process's mount namespace and working directory. A file that exists on the host may be absent inside the container. Relative paths depend on the current directory or directory descriptor used by the operation. Check that context before concluding that the application is using the wrong configuration.

A successful `write` means bytes were accepted according to that interface, not necessarily that they are durable or that a remote application processed them. A successful connection similarly does not prove authentication or business success. The trace reveals a boundary; application and storage semantics still determine the operation's meaning.

## Build a three-case local lab

Use a tiny program that reads a synthetic configuration file and prints a non-sensitive summary. First run it with a valid path. Second run it with a missing path. Third run it as a test user without access to the file. Restrict the trace to file-related calls and compare the first relevant error with the application's reported exception.

Keep the fixture directory private to the exercise. Trace arguments and read buffers can contain file contents, tokens, and personal information. Use harmless strings and avoid broad read/write tracing against a service processing real records. Truncation limits reduce output size but do not constitute reliable redaction.

Next, make the program try two candidate paths in order, with only the second present. Observe the expected first failure and eventual success. This demonstrates why counting errors without understanding fallback behaviour can produce a false incident. Write the expected path sequence before running the test and verify it against the trace.

Finally, compare elapsed execution time with and without tracing using the same input and several trials. Report the environment and tool options. Do not publish the ratio as a universal property of strace: a file-heavy loop and a CPU-heavy computation expose very different instrumentation costs. The useful result is whether this capture mode perturbs this workload enough to invalidate the observation.

## Choose a different tool when the boundary is wrong

If the process spends its time in user-space computation, a syscall trace may show very little. A CPU profiler, runtime stack sampler, or application trace can provide better evidence. If threads are waiting on a user-space synchronisation primitive, the kernel wait alone may not identify the lock owner or the business operation holding it.

`ltrace` observes supported dynamically linked call boundaries, not every function executed. Static linking, inlining, symbol visibility, and implementation details can limit what appears. A missing library call in the output is therefore not proof that the application never performed the corresponding work. Verify that the tool can observe the implementation you are testing.

`perf trace` uses a different instrumentation path and can be a better fit for some captures, but overhead and data exposure still depend on configuration. Event volume, stack collection, symbol resolution, and lost events affect the result. A tool advertised as lightweight does not make a system-wide capture automatically appropriate during an incident.

## Write the conclusion at the evidence level

A defensible finding is: during the capture, this process attempted to open this expected path and received `EACCES`; running with the intended group membership in the test environment made that operation succeed. A weaker finding is: permissions were broken everywhere. Keep the conclusion bounded to the operation and evidence actually observed.

Retain the minimal relevant excerpt with sensitive values removed, the command options, time interval, process identity, and environmental context. Delete unnecessary raw captures under the team's retention policy. If the hypothesis was not supported, record that too and choose the next instrument deliberately. Tracing is a way to reduce uncertainty, not a requirement to force every problem into a syscall explanation.

## Further reading and source boundaries

- [strace manual](https://man7.org/linux/man-pages/man1/strace.1.html)
- [perf trace manual](https://man7.org/linux/man-pages/man1/perf-trace.1.html)
- [ltrace manual](https://man7.org/linux/man-pages/man1/ltrace.1.html)
- [Linux manual: ptrace](https://man7.org/linux/man-pages/man2/ptrace.2.html)
