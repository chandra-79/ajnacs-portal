---
title: "What Containers Actually Are — Not the Marketing Version"
description: "Containers are not lightweight VMs. They are processes with resource constraints and namespace isolation. Understanding the actual mechanism makes you a better user of Docker, Kubernetes, and every container runtime."
date: 2026-07-30
tags: ["DevSecOps", "Fundamentals"]
series: "Containerization from the Ground Up"
seriesOrder: 1
format: article
---

The most common misconception about containers: they are lightweight virtual machines. They are not. A container is a process — or a group of processes — running on the host OS, isolated by Linux kernel features and constrained in its resource usage. Understanding this distinction is foundational for every engineer who uses containers in production.

## What to measure

**Start latency and memory at equivalent load.** Start the same service in a container and a VM using identical application versions. Measure time from launch to a healthy request and memory at steady state. Separate warm-start and cold-start results instead of averaging them together.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [CNCF’s 2025 Annual Cloud Native Survey](https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/).

## Virtual Machines vs Containers: The Actual Difference

A virtual machine (VM) includes a full guest operating system — its own kernel, its own init process, its own drivers. The hypervisor (VMware, KVM, Hyper-V) runs below all guest OS instances and provides the illusion of dedicated hardware to each. The guest kernel is fully isolated from the host kernel.

A container includes only the application and its dependencies — no kernel. The container shares the host OS kernel. It is isolated at the process level, not the kernel level.

```
Virtual Machine:                Container:
┌──────────────────┐           ┌──────────────────┐
│  Application     │           │  Application     │
├──────────────────┤           ├──────────────────┤
│  Libraries / Runtime │       │  Libraries / Runtime │
├──────────────────┤           ├──────────────────┤
│  Guest OS Kernel │           │  (shares host kernel) │
├──────────────────┤           └──────────────────┘
│  Hypervisor      │                    │
├──────────────────┤           ┌──────────────────┐
│  Host OS Kernel  │           │  Host OS Kernel  │
├──────────────────┤           ├──────────────────┤
│  Hardware        │           │  Hardware        │
└──────────────────┘           └──────────────────┘
```

**Implications**:
- Container startup is fast (milliseconds) because there is no OS to boot
- Containers use less memory than VMs because they share the kernel
- Containers have a smaller attack surface than VMs in some respects — but they share the host kernel, which means a kernel vulnerability affects all containers on the host
- You cannot run a Windows container on a Linux host (different kernels), but you can run multiple Linux distributions as containers on a Linux host (they share the kernel; the user-space libraries differ)

## The Two Linux Features That Make Containers Work

Containers are built on two Linux kernel features:

**Namespaces** provide isolation — making processes believe they have exclusive access to a resource. The following Linux namespace types are common in container discussions. Modern Linux also has the time namespace.

| Namespace | What It Isolates |
|---|---|
| PID | Process IDs — container processes start at PID 1 |
| Network | Network interfaces, IP addresses, routing tables |
| Mount | Filesystem mount points |
| UTS | Hostname and domain name |
| IPC | Inter-process communication (shared memory, semaphores) |
| User | User and group IDs |
| Cgroup | Control group hierarchy |

**Cgroups** (control groups) enforce resource limits — preventing one container from consuming all available CPU or RAM.

```bash
## A container is just a process with namespaces applied
## You can create one manually without Docker:
unshare --pid --mount --net --fork bash
## Now you're in an isolated PID and network namespace

## Docker does the same thing, plus:
## - Image layer management
## - Network bridge setup
## - Volume mounting
## - cgroup limits
## - A pleasant API
```

## Container Images: Layered Filesystems

A container image is a layered filesystem. Instructions that change the filesystem can introduce filesystem layers. Instructions such as CMD record configuration metadata.

```dockerfile
FROM ubuntu:22.04        # Base layer from Ubuntu image
RUN apt-get update \     # New layer: updated package lists
    && apt-get install -y python3
COPY requirements.txt /  # New layer: your requirements file
RUN pip install -r requirements.txt  # New layer: installed packages
COPY app/ /app/          # New layer: your application code
CMD ["python3", "/app/main.py"]
```

When a container runs, a thin writable layer is added on top. Any writes go to this writable layer — the underlying layers remain unchanged. This is why multiple containers from the same image share the read-only layers in storage but have independent writable state.

```bash
## Inspect an image's layers
docker history my-image:latest

## See disk usage by images and containers
docker system df -v
```

## What Docker Actually Does

Docker is a tool that wraps all of the above — namespace creation, cgroup configuration, image layer management, networking — into a usable interface. It is not the only container runtime: containerd, CRI-O, and podman are alternatives that Kubernetes commonly uses directly.

```bash
## Run a container with explicit resource limits
docker run \
  --cpus="2"                    # max 2 CPU cores via cgroups
  --memory="512m"               # max 512MB RAM via cgroups
  --name my-service \
  --network my-network \        # custom network namespace
  -p 8080:8080 \               # port mapping via iptables
  my-service:latest

## Inspect the actual namespaces and cgroups for a running container
docker inspect my-service
Locate the workload's control group and identify the cgroup version first. On cgroup v2, inspect memory.max at its discovered path. Older cgroup v1 memory controllers expose memory.limit_in_bytes.
ls /proc/<container-pid>/ns/
```

## Why This Matters for Production

The kernel-sharing model has security implications. If a container runs as root, and a kernel vulnerability allows privilege escalation, the attacker has root on the host — affecting all other containers. This is why:

1. Never run containers as root when avoidable
2. Keep host kernels patched
3. Use security profiles (seccomp, AppArmor) to limit syscalls from containers
4. For strong isolation requirements, consider VM-based container runtimes (gVisor, Kata Containers) that add a thin kernel per container

The next lesson covers writing production-quality Dockerfiles — the specific decisions that determine whether your container image is secure, efficient, and reproducible.

## Draw the boundary from the process outward

When examining a container, identify the application process, the environment it sees, and the resources it can actually use. Compare the process ID shown inside the container with the host view in an environment you administer. The same task can have a process ID in both views because namespaces change how another process can name it. Work performed by that task still consumes resources on its host. Visibility and accounting can therefore disagree in a completely healthy deployment. A dashboard showing a busy host doesn't tell you which container used those resources. Start the diagnostic with per-workload counters.

A container's filesystem also comes in multiple parts. A runtime can mount an image, add a writable area, and place a separate volume at one of the visible paths. A file written to the volume does not have the same lifecycle as a file written to the container's default writable layer. Test that distinction by storing synthetic records in both locations and replacing the container with a new instance built from the same digest. Record which records survive and whether a new instance can read them with its configured user. Mounting over an existing application directory can hide the files already present in the image. If a configuration suddenly vanishes after adding storage, inspect the mount targets before rebuilding the image.

## Distinguish contention from enforcement

Assume a fictional worker uses three independent CPU-bound tasks. It is allowed an average of one CPU worth of time under its runtime quota and is placed on a host with four otherwise idle CPUs. A dashboard may report idle capacity at the host while the worker still stalls during its busiest intervals. Verify the per-container throttle counters alongside throughput and queue time. A scheduling reservation, a hard CPU quota, and contention from neighboring work answer different questions. Increasing the replica's CPU allocation can help if throttling sets the pace. It will not fix a dependency that serializes all work inside one database transaction.

Memory deserves a similar exercise. Suppose a process uses roughly 160 MiB for application allocations and another 110 MiB in file-backed working data. A limit of 256 MiB does not mean it has 96 MiB spare. Application working-set measures, container accounting, and reclaimable cache cover different populations. In your own test environment, vary the workload and compare the application's allocation statistics with the container's memory events and actual throughput. On cgroup v2, record memory events and distinguish a high threshold that induces reclaim and throttling from a hard maximum. Save the exit reason when a process disappears. Similar symptoms can come from the process choosing to stop, from a container runtime action, or from memory enforcement. See [the kernel cgroup v2 documentation](https://docs.kernel.org/admin-guide/cgroup-v2.html).

## Check startup, readiness, and shutdown separately

Using the time it takes the container process to appear as your performance measure will miss warmup and dependency checks. In an illustrative exercise, process startup takes 0.2 seconds, the dependency connection takes 1.8 seconds, and warming a local index takes 3.0 additional seconds. The first eligible request arrives after about five seconds if those stages run in order. Changing the process launcher to save 0.1 seconds does little for the time users wait. Measure from a defined creation event to the first successful request through the real serving path. Log the milestones so the team can see where startup time went.

Exercise termination with an in-flight request. Observe what the process receives, how long it stops accepting new work, and whether it can finish or hand back outstanding work before the runtime shuts it down. If your service starts child processes, verify that the container's init or entry process forwards signals and reaps exited children as intended. Set the termination allowance based on actual behavior. A larger allowance will not help an application that ignores the signal. Test with the exact packaged process, because an entrypoint wrapper can change signal delivery.

## Compare options using equal workload assumptions

Compare a container, a VM, and a stronger isolation runtime under the same successful workload and durability requirements. Use matched versions, connection behavior, data sets, and the same observation intervals. For a cold trial, account for image or disk transfer and for prerequisites that a warm trial keeps loaded. Track requests completed at the required latency alongside infrastructure usage and operator work. Report the underlying host setup. A container running inside a developer desktop's Linux VM adds host and VM effects to desktop measurements. Those figures will not directly characterize a Linux production fleet.

Before selecting a runtime for untrusted workloads, distinguish the access the process has from the isolation boundary it shares. Verify how identities map to host privileges and what volumes or control-plane services are exposed. An application running as an unprivileged user with minimal mounts is a useful control. It does not remove the requirement to update the host and configure workload separation. Use the boundary and threat model to choose the deployment architecture. Then rerun the application measurements with that architecture in place. The [Open Container Initiative Runtime Specification](https://github.com/opencontainers/runtime-spec/blob/main/config-linux.md) documents how Linux runtime configuration expresses namespaces, resources, and security settings.
