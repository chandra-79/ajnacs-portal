---
title: "eBPF: The Future of Linux Observability and Security"
description: "What eBPF is, why it changes Linux observability fundamentally, and how tools like bpftrace, BCC, Cilium, and Falco use it to instrument the kernel without a custom kernel module; loading and management still use kernel interfaces such as the bpf system call."
date: 2027-10-18
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 25
format: article
---

eBPF enables verified programs to run at supported Linux hooks for tracing, networking, and other uses. Available program types, helpers, privileges, and attachment points depend on the kernel and configuration. It can add instrumentation without loading a custom kernel module, but its safety and performance still require operational review.

## What eBPF Is

Classical BPF was introduced in 1992 to filter network packets efficiently. eBPF extended the concept to the entire kernel: a sandboxed virtual machine inside the kernel that can be attached to supported hooks.

When an eBPF program is loaded:
1. The kernel's **verifier** checks program constraints, including memory access and bounded execution under supported constructs
2. Where enabled and supported, a JIT compiler translates it to native machine code
3. The program attaches to a **hook** — a tracepoint, kprobe, uprobe, socket, or XDP event
4. When that hook fires, the eBPF program runs in kernel context

The program can:
- Read kernel data structures
- Aggregate data in eBPF maps (key-value stores in kernel memory)
- Call a restricted set of kernel helper functions
- Pass data to user space via ring buffers or perf events

The verifier reduces specific classes of risk; it is not a guarantee against kernel bugs, excessive overhead, or a logically incorrect security policy.

## Why eBPF Changes Everything

Other kernel-observation approaches include:
- **Kernel modules**: load arbitrary code into kernel space, privileged and version-sensitive; many can be loaded without reboot
- **System call tracing** (strace, ptrace): can add substantial overhead depending on the syscall workload and tracing mode
- **Static kernel instrumentation** (tracepoints): limited to pre-defined probe points

eBPF allows:
- Instrumentation at supported kernel, user-space, and networking hooks — without restarts
- Workload-dependent overhead that must be measured
- Custom aggregation in the kernel — only send summaries to user space, not every individual event
- Improved portability through BTF and CO-RE, subject to kernel capabilities and compatible types

Cilium can use eBPF for supported kube-proxy replacement configurations, and Falco can consume events through an eBPF driver. These are deployment choices with version and kernel prerequisites, not universal replacements for all networking or security mechanisms.

## bpftrace — scripting the kernel

`bpftrace` is a high-level eBPF scripting language (similar to awk syntax) for on-the-fly kernel tracing.

```bash
## Install
apt install bpftrace

## "Hello, world" — trace all execve calls
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_execve { printf("%s execve\n", comm); }'

## Count syscalls by process name, 10-second snapshot
sudo bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); } interval:s:10 { print(@); clear(@); exit(); }'

## Use maintained BCC tools for TCP and block-I/O investigations; inspect
## supported options and kernel compatibility before tracing.

## File opens by process
sudo bpftrace -e '
tracepoint:syscalls:sys_enter_openat {
  printf("%-16s %s\n", comm, str(args->filename));
}'

## Discover available user-space symbols before choosing a uprobe.
## Python symbols may live in a shared library rather than this executable.
sudo bpftrace -l 'uprobe:/usr/bin/python3:*'
## A real process-specific probe also needs an appropriate PID filter and bounded duration.

## List available tracepoints
sudo bpftrace -l 'tracepoint:*'
sudo bpftrace -l 'tracepoint:syscalls:*'
sudo bpftrace -l 'kprobe:*tcp*'
```

## BCC — the higher-level toolkit

BCC (BPF Compiler Collection) provides Python/Lua wrappers around eBPF programs, plus a collection of pre-written tools.

```bash
## Install
apt install bpfcc-tools linux-headers-$(uname -r)

## Pre-built tools in BCC (most useful ones):
execsnoop-bpfcc      # trace new process executions
opensnoop-bpfcc      # trace file opens
tcplife-bpfcc        # TCP connection duration
tcptop-bpfcc         # top TCP connections by bandwidth
biolatency-bpfcc     # disk I/O latency histogram
biosnoop-bpfcc       # per-I/O latency trace
runqlat-bpfcc        # CPU run queue latency histogram
profile-bpfcc        # CPU flame graph sampling
funclatency-bpfcc    # function call latency histogram
offcputime-bpfcc     # off-CPU time analysis

## Usage examples
sudo execsnoop-bpfcc                          # show all exec calls system-wide
sudo opensnoop-bpfcc -p 1234                 # file opens for PID 1234
sudo tcplife-bpfcc                            # show completed TCP connections
sudo biolatency-bpfcc -d nvme0n1 10 1        # one 10-second disk-latency interval
sudo runqlat-bpfcc 10 1                      # one 10-second scheduler-latency interval
sudo profile-bpfcc -F 99 -a 30              # CPU sampling for 30 seconds
```

## eBPF for Networking: XDP and Cilium

XDP (eXpress Data Path) supports early packet processing. Native driver, generic, and hardware-offload modes have different attachment points and requirements. Achievable packet rate depends on hardware, program work, traffic, and configuration.

```bash
## Inspect an approved test interface; substitute its actual name.
ip -details link show dev test0
## Loading requires a reviewed object, supported mode, and explicit attachment scope.
## The object determines packet behavior; its filename does not prove a safe policy.
## Keep the prior attachment and a tested recovery path before replacing any program.
```

**Cilium** can provide kube-proxy replacement when configured for a supported cluster. Its datapath uses eBPF, while some L7 functions involve a proxy:
- Datapath behavior and remaining iptables use depend on configuration
- Identity-based security policies (based on pod labels, not IP addresses)
- L7 policy enforcement (allow only specific HTTP paths)
- Deep network visibility (Hubble — the eBPF-based observability plane)

```bash
## Install Cilium in a Kubernetes cluster
helm repo add cilium https://helm.cilium.io/
# Follow the version-specific installation guide for your cluster;
# do not replace an existing CNI with an unreviewed generic install command.

## Inspect Cilium deployment health; verify replacement mode separately.
cilium status --verbose
## Shows: eBPF programs loaded, policies, endpoints

## Check Hubble (the observability layer)
hubble observe --last 50
hubble observe --namespace production --protocol http
```

## eBPF for Security: Falco

Falco uses supported event sources and drivers to evaluate runtime rules. Coverage depends on configuration, supported events, and event loss; an alerting rule is not a complete security boundary.

```bash
## Illustrative Falco installation in an approved test cluster.
## Review chart version, privileges, kernel support, and values before installing.
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
    --set driver.kind=modern_ebpf \
    --namespace falco --create-namespace

## Example Falco rules (detect common attack patterns)
## - container running shell (interactive shell in a container)
## - writing to /etc from a container
## - outbound connection to unexpected IP
## - chmod of sensitive files
## - ptrace from a container

## Check Falco alerts
kubectl logs -n falco -l app.kubernetes.io/name=falco
```

## BTF and CO-RE: Portability Across Kernel Versions

Before CO-RE (Compile Once, Run Everywhere), many tracing workflows compiled against target-kernel information or maintained compatibility code for differing layouts. Target-local compilation was one approach, not a requirement for every eBPF program. BTF describes types, and CO-RE relocations let a loader adapt supported field accesses to target-kernel layouts. BTF availability alone does not guarantee that required helpers, hooks, or semantics exist.

```bash
## Check if your kernel has BTF support
ls /sys/kernel/btf/vmlinux   # exists = BTF available

## Check kernel eBPF capabilities
sudo bpftool feature
## Shows: supported program types, helper functions, map types

## Check loaded eBPF programs
sudo bpftool prog list
# Replace 42 with an existing program ID reported by the preceding listing.
sudo bpftool prog show id 42

## Check eBPF maps
sudo bpftool map list
```

## The Road from Here

eBPF is used by several Linux networking, observability, and security tools. Adoption and suitability vary by workload, kernel, operating model, and required evidence. Understanding its capabilities and limitations is useful for teams operating these tools.

The progression from this course into eBPF production work is:
1. Start with bpftrace one-liners for performance diagnosis (immediate value)
2. Choose BCC, strace, or perf according to the diagnostic question and overhead
3. Evaluate Cilium if you run Kubernetes after measuring the relevant datapath and operational tradeoffs
4. Evaluate Falco rules and event coverage for specific runtime-detection requirements
5. Write custom eBPF programs with libbpf and CO-RE when standard tools do not cover your observability requirements

This is the full arc of the Linux course: from shell basics to the kernel primitives that define modern cloud infrastructure. What happens next is in your hands.

## Begin with a diagnostic question

An eBPF tool is useful when it can observe a mechanism relevant to the problem. “Why is this request slow?” is still too broad for a first probe. A more focused question might be whether the process waits for CPU scheduling, spends time in a particular syscall, or experiences block-I/O latency. Select a tool whose event definition matches that question and whose output you can interpret.

Start with existing application and host metrics when they can answer the question cheaply. A process-level CPU profile, a queue metric, or a database plan may be more direct than kernel instrumentation. eBPF complements those tools. It does not make every other profiler obsolete, and a lower-level observation is not automatically a better explanation of a business-level symptom.

Document the workload and collection window. A trace taken during an idle period may not explain a peak-load incident. A short sample can miss rare events. A system-wide probe can include unrelated processes and make one application's behavior look worse than it is. Filter by an appropriate process, cgroup, or workload identity where the tool supports it, and state what the filter excludes.

## Worked example: event volume versus aggregated output

Suppose a hypothetical probe observes 50,000 events per second for ten seconds. That produces 500,000 observed events. If user space receives a 64-byte record for every event, the payload alone is 32,000,000 bytes, or 32 decimal megabytes, before transport and formatting overhead. If the program instead maintains 100 aggregate entries of 32 bytes each and exports them once, the aggregate payload is 3,200 bytes.

The chart compares 32,000,000 and 3,200 payload bytes. This is synthetic arithmetic, not a benchmark or a claim that aggregation makes tracing free. The kernel program still executes for each event, map updates have cost, and the aggregate may lose details needed for diagnosis. The example shows why output design matters when the event rate is high.

For a real experiment, measure application throughput and latency with and without the probe under comparable load. Record CPU use, memory use, event loss, and output volume. Repeat enough runs to distinguish a stable effect from background variation. Report the kernel, tool version, probe, filter, and workload so that another operator can understand the result's scope.

## The verifier is a boundary, not an operational guarantee

The verifier checks whether a program obeys supported safety constraints before loading. Modern kernels support bounded forms of iteration and other constructs under specific rules; “eBPF has no loops” is an oversimplification. A program can be rejected because the verifier cannot establish the required property even when its author believes it is safe. Read the verifier log and the documentation for the target kernel rather than weakening controls to force a load.

A verified program can still be logically wrong. A network program may drop legitimate traffic, a tracing program may count the wrong event, and a security rule may miss the behavior it intends to detect. Kernel implementation bugs and resource pressure also remain possible. Treat deployment of a persistent eBPF program as a software change with review, testing, observability, and rollback.

Privileges differ by kernel, configuration, and operation. Do not assume that a broad administrative capability is the only way to run a tool, or that an unprivileged user can load every program type. Check the supported capability model and the organization's policy. A tracing agent may gain visibility into filenames, process arguments, network metadata, or other sensitive information, so access and retention deserve explicit controls.

## Choose stable attachment points when possible

Tracepoints expose named events and fields intended for tracing, while kprobes attach to implementation details that can change across kernel builds. Uprobes depend on the target binary, symbols, optimization, and runtime behavior. A function that is inlined or absent may not be attachable under the name used in an example. List available probes and inspect their arguments on the actual host before collecting data.

CO-RE improves portability by allowing supported accesses to adapt to target type information. It does not add a helper or hook that the target kernel lacks. A field may have changed meaning, a feature may be disabled, or a vendor kernel may behave differently. A compatibility test matrix should include the kernel families and configurations actually operated, not merely one development laptop.

Prefer maintained tools for complicated subsystem measurements. A block-I/O latency probe needs correct pairing of start and completion events, handling of reused identifiers, and cleanup of state. A short one-liner can look convincing while silently missing a path. Inspect the tool's event definition and known limitations before using its histogram as evidence of storage latency.

## Histograms, samples, and missing events

A histogram bucket represents a range, not a precise measurement at its label. Do not derive an exact percentile from coarse buckets without acknowledging the approximation. Keep units explicit: nanoseconds, microseconds, and milliseconds differ by factors of a thousand. A tracing tool may report time spent off CPU, which includes more than storage waiting, or scheduler delay, which is different from total request latency.

Event loss can bias an investigation. If a ring buffer fills during the busiest period, the retained events may underrepresent precisely the condition being studied. Inspect drop counters and the tool's warnings. Increasing a buffer may help but also consumes memory and does not fix an output consumer that cannot keep up indefinitely. Aggregation or narrower filtering may be a better design.

Sampling adds another limitation. A CPU sample profile estimates where sampled execution occurred; it is not an exact accounting of every function call. Very short or infrequent activity may be missed. State the sampling rate and duration, and avoid presenting the absence of a sample as proof that a path never ran.

## A bounded tracing lab

Use a disposable Linux VM with a supported bpftrace package and no sensitive workload. Record uname output and the tool version. List a supported syscall tracepoint, then count events for a short, fixed interval while running a known local command. Prefer an aggregate count over printing every event. Stop the probe and verify that its process has exited before changing the workload.

Repeat the experiment with a different command and explain why the count changes. The exercise is about relating an event definition to behavior, not about obtaining a universal syscall count. Shell startup, dynamic linking, locale, and library versions can alter the observed events. Preserve the command and environment description with the result.

Next, deliberately choose a filter that excludes the workload and observe an empty result. This demonstrates that “nothing observed” can mean an incorrect filter rather than an absence of activity. Inspect the available fields before using a process name as identity; names can be truncated or shared. Where supported, a cgroup or exact process identifier can provide a more suitable scope, with its own lifecycle caveats.

## Networking and security require separate rollout discipline

An XDP program can affect traffic before much of the normal network stack, depending on the attachment mode and driver support. A faulty drop rule can make a host unreachable. Rehearse attachment and removal on an isolated interface with an independent recovery route. Do not attach an unspecified object file to a production interface merely to follow an observability tutorial.

Cilium deployment and kube-proxy replacement depend on cluster configuration and supported migration procedures. Installing a chart is not proof that replacement is enabled or that all service paths work. Test DNS, service access, network policy, ingress, egress, and failure recovery in the intended configuration. Existing connection state may not transfer between datapaths during a migration.

Runtime detection tools such as Falco need an alerting workflow as well as a driver. Test a harmless event that should match a rule, verify that the alert reaches the intended destination, and inspect event-loss metrics. Tune exceptions narrowly and retain the reason. A quiet dashboard can mean normal behavior, an overly broad exception, missing events, or a broken notification path.

The practical takeaway is to connect every probe to a question, every number to a collection method, and every persistent program to an operating owner. eBPF offers powerful visibility and control, but dependable use requires the same engineering discipline as any other privileged component of the system.

## Sources and further reading

- [Linux kernel · libbpf overview](https://docs.kernel.org/bpf/libbpf/libbpf_overview.html)
- [bpftrace · Language reference 0.24](https://bpftrace.org/docs/release_024/language)
- [Cilium · Kube-proxy replacement](https://docs.cilium.io/en/stable/network/kubernetes/kubeproxy-free/)
- [Falco · Kubernetes deployment](https://falco.org/docs/setup/kubernetes/)
