---
title: "eBPF: The Future of Linux Observability and Security"
description: "What eBPF is, why it changes Linux observability fundamentally, and how tools like bpftrace, BCC, Cilium, and Falco use it to instrument the kernel without kernel modules or system calls."
date: 2026-09-10
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 25
format: article
---

eBPF (Extended Berkeley Packet Filter) is the most significant development in Linux systems engineering in the last decade. It allows safe, arbitrary programs to run inside the kernel, triggered by any kernel event, with no kernel module required and no reboot. This is why the Linux observability, networking, and security tooling landscape changed completely between 2018 and 2024.

## What eBPF Is

Classical BPF was introduced in 1992 to filter network packets efficiently. eBPF extended the concept to the entire kernel: a sandboxed virtual machine inside the kernel that can be attached to any probe point.

When an eBPF program is loaded:
1. The kernel's **verifier** checks it exhaustively — no infinite loops, no invalid memory accesses, all paths terminate, no unsafe kernel function calls
2. The JIT compiler compiles it to native machine code
3. The program attaches to a **hook** — a tracepoint, kprobe, uprobe, socket, or XDP event
4. When that hook fires, the eBPF program runs in kernel context

The program can:
- Read kernel data structures
- Aggregate data in eBPF maps (key-value stores in kernel memory)
- Call a restricted set of kernel helper functions
- Pass data to user space via ring buffers or perf events

It cannot crash the kernel, leak memory, or execute in an infinite loop. The verifier ensures this at load time.

## Why eBPF Changes Everything

Before eBPF, observing the kernel required:
- **Kernel modules**: load arbitrary code into kernel space, risky, require reboot, version-specific
- **System call tracing** (strace, ptrace): works but stops the process and slows it 10x
- **Static kernel instrumentation** (tracepoints): limited to pre-defined probe points

eBPF allows:
- Dynamic instrumentation of any kernel function, any user-space function, any network packet — without restarts
- Sub-microsecond overhead (JIT-compiled native code)
- Custom aggregation in the kernel — only send summaries to user space, not every individual event
- Kernel-version-independent programs via BTF (BPF Type Format) and CO-RE (Compile Once, Run Everywhere)

This is why tools like Cilium replaced kube-proxy, Falco uses eBPF for container runtime security, and Cloudflare rewrote its DDoS mitigation in eBPF.

## bpftrace — scripting the kernel

`bpftrace` is a high-level eBPF scripting language (similar to awk syntax) for on-the-fly kernel tracing.

```bash
## Install
apt install bpftrace

## "Hello, world" — trace all execve calls
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_execve { printf("%s execve\n", comm); }'

## Count syscalls by process name, 10-second snapshot
sudo bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); } interval:s:10 { print(@); clear(@); }'

## Trace new TCP connections with source/dest
sudo bpftrace -e '
kprobe:tcp_connect {
  $sk = (struct sock *)arg0;
  printf("connect: %s -> %s:%d\n",
    comm,
    ntop(AF_INET, $sk->__sk_common.skc_daddr),
    $sk->__sk_common.skc_dport >> 8);
}'

## Disk I/O latency histogram
sudo bpftrace -e '
kprobe:blk_mq_start_request { @start[arg0] = nsecs; }
kprobe:blk_account_io_done /@start[arg0]/ {
  @latency_us = hist((nsecs - @start[arg0]) / 1000);
  delete(@start[arg0]);
}
END { print(@latency_us); }'

## File opens by process
sudo bpftrace -e '
tracepoint:syscalls:sys_enter_openat {
  printf("%-16s %s\n", comm, str(args->filename));
}'

## Count function calls in a specific process (uprobe)
sudo bpftrace -e '
uprobe:/usr/bin/python3:PyObject_Call { @[comm] = count(); }
interval:s:5 { print(@); }'

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
sudo biolatency-bpfcc -d nvme0n1 10          # disk latency for 10 seconds
sudo runqlat-bpfcc 10                        # scheduler latency for 10 seconds
sudo profile-bpfcc -F 99 -a 30              # CPU sampling for 30 seconds
```

## eBPF for Networking: XDP and Cilium

XDP (eXpress Data Path) allows eBPF programs to process network packets before the kernel's network stack — at wire speed, directly on the NIC's driver receive hook.

```bash
## Cloudflare-style DDoS drop — drop all UDP packets from a specific source
## (This is a simplified illustration, not production code)
sudo ip link set dev eth0 xdp obj xdp-drop.o sec xdp_drop
sudo ip link show dev eth0 | grep xdp   # verify loaded

## Remove XDP program
sudo ip link set dev eth0 xdp off
```

**Cilium** replaces kube-proxy in Kubernetes and implements all L3/L4/L7 networking policies in eBPF:
- No iptables rules (scales to 100k+ pods without iptables performance collapse)
- Identity-based security policies (based on pod labels, not IP addresses)
- L7 policy enforcement (allow only specific HTTP paths)
- Deep network visibility (Hubble — the eBPF-based observability plane)

```bash
## Install Cilium in a Kubernetes cluster
helm repo add cilium https://helm.cilium.io/
helm install cilium cilium/cilium --namespace kube-system

## Verify Cilium is replacing kube-proxy
cilium status
## Shows: eBPF programs loaded, policies, endpoints

## Check Hubble (the observability layer)
hubble observe --last 50
hubble observe --namespace production --protocol http
```

## eBPF for Security: Falco

Falco uses eBPF (or kernel modules) to monitor every system call in every container and alert on suspicious behaviour.

```bash
## Install Falco with eBPF driver
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
    --set driver.kind=ebpf \
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

Before CO-RE (Compile Once, Run Everywhere), eBPF programs had to be compiled on the same kernel they would run on. BTF (BPF Type Format) embeds kernel type information in the binary, allowing eBPF programs compiled against one kernel to run on any kernel that has BTF support.

```bash
## Check if your kernel has BTF support
ls /sys/kernel/btf/vmlinux   # exists = BTF available

## Check kernel eBPF capabilities
sudo bpftool feature
## Shows: supported program types, helper functions, map types

## Check loaded eBPF programs
sudo bpftool prog list
sudo bpftool prog show id <ID>

## Check eBPF maps
sudo bpftool map list
```

## The Road from Here

eBPF is now standard infrastructure in production Linux environments. The tools built on it — Cilium, Falco, Pixie, Parca, Coroot, and a growing list — are replacing the previous generation of observability and security tooling. Understanding eBPF fundamentals is no longer optional for senior Linux or Kubernetes engineers.

The progression from this course into eBPF production work is:
1. Start with bpftrace one-liners for performance diagnosis (immediate value)
2. Use BCC tools to replace strace and perf in production profiling
3. Evaluate Cilium if you run Kubernetes (real gains at scale)
4. Deploy Falco for container runtime security (compliance and incident detection)
5. Write custom eBPF programs with libbpf and CO-RE when standard tools do not cover your observability requirements

This is the full arc of the Linux course: from shell basics to the kernel primitives that define modern cloud infrastructure. What happens next is in your hands.
