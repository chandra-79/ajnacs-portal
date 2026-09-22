---
title: "Linux Namespaces and cgroups: The Foundation of Containers"
description: "How Linux namespaces isolate processes, filesystems, networks, and users — and how cgroups enforce resource limits. The primitives that Docker, Kubernetes, and every container runtime are built on."
date: 2026-09-08
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 24
format: article
---

Containers are not a Linux feature. There is no `container` system call. What containers are is a combination of two existing kernel primitives — namespaces and cgroups — wrapped in a user-space runtime. Understanding these primitives explains why containers work, what their security boundaries actually are, and what happens when they fail.

## Namespaces

A namespace wraps a global resource and makes processes inside the namespace believe they have their own isolated copy of it. Processes in different namespaces cannot see or affect each other's resources.

Linux has eight namespace types (as of kernel 5.6+):

| Namespace | Resource isolated | Linux 3.x |
|---|---|---|
| `pid` | Process IDs — PID 1 in a container is not PID 1 on the host | 3.8 |
| `net` | Network interfaces, routing tables, iptables rules | 3.0 |
| `mnt` | Mount points and filesystem tree | 3.8 |
| `uts` | Hostname and domain name | 3.0 |
| `ipc` | System V IPC, POSIX message queues | 3.0 |
| `user` | User and group IDs (UID/GID remapping) | 3.8 |
| `cgroup` | cgroup root directory | 4.6 |
| `time` | System clocks | 5.6 |

```bash
## See namespaces in use by a process
ls -la /proc/self/ns/
## Shows symlinks like: pid -> pid:[4026531836]
## The number in brackets is the namespace ID

## See namespaces for a specific process
ls -la /proc/<PID>/ns/

## Compare namespaces between two processes
## Same inode number = same namespace
ls -lai /proc/1/ns/net /proc/$(pgrep docker)/ns/net

## List all namespaces on the system
lsns        # requires util-linux
lsns -t pid # only PID namespaces

## Create a new namespace for a command (unshare)
sudo unshare --pid --fork --mount-proc bash
## Now in a new PID namespace — ps shows only this shell and its children
ps aux   # only shows 1 process (PID 1 = this bash)
exit

## New network namespace (no network interfaces except loopback)
sudo unshare --net bash
ip link    # only lo, no eth0 etc.
exit

## User namespace (map current user to root inside the namespace)
unshare --user --map-root-user bash
id         # uid=0(root) — but only inside this namespace
whoami     # root
## On the host, this process still runs as the original user
exit
```

## cgroups v2

cgroups (control groups) enforce resource limits on groups of processes. They do not isolate — they constrain. A container can be limited to 2 CPUs and 1GB of RAM using cgroups.

```bash
## Check cgroup version
stat -fc %T /sys/fs/cgroup
## tmpfs = cgroups v1
## cgroup2fs = cgroups v2

## Check if systemd is using cgroup v2
systemctl --version | grep cgroup

## cgroups v2 filesystem layout
ls /sys/fs/cgroup/
## In v2: a unified hierarchy (all controllers in one tree)
## In v1: separate hierarchies per controller (memory, cpu, etc.)

## See cgroup for a process
cat /proc/<PID>/cgroup

## Create a cgroup (v2)
mkdir /sys/fs/cgroup/my-limited-group

## Set CPU and memory limits
echo "200000 1000000" > /sys/fs/cgroup/my-limited-group/cpu.max
## 200000 microseconds out of every 1000000 = 20% of one CPU

echo $((512 * 1024 * 1024)) > /sys/fs/cgroup/my-limited-group/memory.max
## 512MB memory limit

## Add a process to the cgroup
echo $$ > /sys/fs/cgroup/my-limited-group/cgroup.procs
## $$ = current shell PID

## Run the stress tool to verify the limit
stress-ng --cpu 4 --vm 1 --vm-bytes 600M --timeout 10s
## Memory allocation above 512MB will be OOM-killed by the kernel
```

## systemd and cgroups

systemd is a cgroup manager. Every systemd service lives in its own cgroup slice.

```bash
## View the cgroup tree
systemd-cgls

## See resource usage by cgroup
systemd-cgtop

## Set CPU and memory limits for a service via systemd
## /etc/systemd/system/myapp.service.d/override.conf
[Service]
CPUQuota=200%         # 2 CPU cores (200% of one CPU)
MemoryMax=1G          # hard memory limit
MemoryHigh=800M       # soft limit — kernel throttles writes above this
TasksMax=100          # maximum number of processes/threads

systemctl daemon-reload
systemctl restart myapp

## Verify the cgroup limits are applied
cat /sys/fs/cgroup/system.slice/myapp.service/memory.max
cat /sys/fs/cgroup/system.slice/myapp.service/cpu.max
```

## How Container Runtimes Use These Primitives

A container is:
1. A new set of namespaces (pid, net, mnt, uts, ipc, user)
2. A new mount namespace with an overlay filesystem as the root
3. A cgroup limiting its CPU and memory
4. A set of dropped Linux capabilities and a Seccomp filter

```bash
## See what namespaces Docker created for a container
docker run -d --name test nginx
docker inspect test --format '{{.State.Pid}}'   # get container PID on host
ls -la /proc/<container-PID>/ns/

## Verify CPU limits
docker run --cpus=0.5 --memory=256m nginx
cat /sys/fs/cgroup/system.slice/docker-<container-id>.scope/cpu.max
## Should show: 50000 100000 (50% of one CPU)

## Enter a running container's namespaces (nsenter)
sudo nsenter -t <container-PID> --net -- ip link
## --net: enter only the network namespace
## Useful for debugging without going through docker exec

## Run a process in the same namespaces as a container
sudo nsenter -t <container-PID> --pid --net --mnt --uts --ipc bash
## This is essentially what docker exec does
```

## Seccomp — syscall filtering

Seccomp (Secure Computing Mode) restricts which system calls a process can make. It is the third pillar of container isolation alongside namespaces and cgroups.

```bash
## Check if a process has a Seccomp filter
cat /proc/<PID>/status | grep Seccomp
## 0 = no filter
## 1 = strict (read, write, exit, sigreturn only)
## 2 = filter mode (custom filter applied)

## Docker applies a default Seccomp profile that blocks ~44 syscalls
## including: keyctl, add_key, request_key (prevent keyring attacks)
## clock_adjtime (prevent time manipulation)
## get_mempolicy (prevent NUMA info leaks)

## Run a container without Seccomp (for debugging only)
docker run --security-opt seccomp=unconfined myimage

## Apply a custom Seccomp profile
docker run --security-opt seccomp=/path/to/profile.json myimage

## Kubernetes Seccomp:
## spec.securityContext.seccompProfile.type: RuntimeDefault
## or: Localhost (custom profile)
```

## Container Escape via cgroup and Namespace Abuse

Understanding the attack surface of namespaces and cgroups is essential for anyone running containers in production.

```bash
## Check if running in a privileged container (dangerous)
cat /proc/self/status | grep CapEff
## Privileged container = 0000003fffffffff (all capabilities)
## Normal container = much fewer capabilities

## Check for a writable cgroup mount (CVE-2019-5736 class of vulnerability)
mount | grep cgroup
find /sys/fs/cgroup -writable 2>/dev/null | head

## Check if container can see host PIDs
ls /proc | wc -l
## Large number = host PID namespace is shared (never in production)

## What a container should NOT have:
## --privileged flag (Docker): grants all capabilities, disables Seccomp and AppArmor
## --pid=host: shares host PID namespace
## --net=host: shares host network namespace
## hostPath mounts to / or /proc or /sys

## Minimal production Kubernetes security context:
## spec.containers[].securityContext:
## allowPrivilegeEscalation: false
## readOnlyRootFilesystem: true
## runAsNonRoot: true
## runAsUser: 1000
## capabilities:
## drop: ["ALL"]
```

The container runtime (containerd, CRI-O) handles namespace and cgroup creation, but the policy decisions about what capabilities to grant, what Seccomp profile to apply, and what namespaces to share are the operator's responsibility. The kernel will enforce exactly what you configure — no more, no less.
