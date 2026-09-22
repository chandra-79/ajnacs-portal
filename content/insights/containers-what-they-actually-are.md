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

**Namespaces** provide isolation — making processes believe they have exclusive access to a resource. Linux has seven namespace types:

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

A container image is a layered filesystem. Each instruction in a Dockerfile creates a read-only layer:

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
cat /sys/fs/cgroup/memory/docker/<container-id>/memory.limit_in_bytes
ls /proc/<container-pid>/ns/
```

## Why This Matters for Production

The kernel-sharing model has security implications. If a container runs as root, and a kernel vulnerability allows privilege escalation, the attacker has root on the host — affecting all other containers. This is why:

1. Never run containers as root when avoidable
2. Keep host kernels patched
3. Use security profiles (seccomp, AppArmor) to limit syscalls from containers
4. For strong isolation requirements, consider VM-based container runtimes (gVisor, Kata Containers) that add a thin kernel per container

The next lesson covers writing production-quality Dockerfiles — the specific decisions that determine whether your container image is secure, efficient, and reproducible.
