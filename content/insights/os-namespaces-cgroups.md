---
title: "Linux Namespaces and cgroups: The Foundation of Containers"
description: "How Linux namespaces isolate processes, filesystems, networks, and users — and how cgroups enforce resource limits. The primitives that Docker, Kubernetes, and every container runtime are built on."
date: 2026-06-02
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 24
format: article
---

Containers are not a Linux feature. There is no `container` system call. What containers are is a combination of two existing kernel primitives — namespaces and cgroups — wrapped in a user-space runtime. Understanding these primitives explains why containers work, what their security boundaries actually are, and what happens when they fail.

## What to measure

**Throttling and memory pressure by workload.** If cgroup CPU metrics show 250 throttled periods out of 1,000, throttling occurred in 25% of observed periods. Keep this distinct from the fraction of CPU time lost; inspect throttled duration and request latency under the same traffic.

*Illustrative measurement. Any numbers in this example are hypothetical.*

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
readlink /proc/1/ns/net
## Compare the identifier with the equivalent link for the selected workload PID.

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

## Start by identifying the kernel view that differs

For a container that cannot read a mounted file, collect the process identity and the mount identity from inside the workload and from a trusted host inspection path. The host can see a filesystem mounted while the container sees a different mount table or a bind mount hiding the expected file. Use the process’s mount information to find the selected mount and compare its read/write state and source. After proving the mount is present, check the application’s effective user, ownership mapping, permissions, and runtime policy. Each check narrows a different boundary of the failure.

When inspecting namespace symlinks, compare their target namespace identities. An ordinary listing shows the symlink itself and can be misleading if you compare directory entry inodes without dereferencing. PID and network namespaces are separate. Two application processes may show different PID views while sharing an interface and listening port table. Conversely, sharing a mount namespace says little about which files those processes may access. The [Linux namespaces manual](https://man7.org/linux/man-pages/man7/namespaces.7.html) describes resource scopes, identifiers, and the relationship between namespaces and processes.

For identity questions, inspect the user namespace mapping and the application process’s effective credentials. A process ID as reported inside a container also differs from the host-side ID used to inspect the same process. Pick a documented method to map the identities before correlating logs. Record how the workload was launched and which namespaces it shares intentionally. A mixture of copied command output from different process contexts can lead an operator to correct the wrong configuration.

## Read resource limits across the cgroup hierarchy

Start with the running process’s cgroup path and find the relevant mounted cgroup interface. A cgroup namespace can virtualize the path visible inside a container. A runtime, service manager, or orchestrator may own the actual host hierarchy and reconcile changes. Record the leaf values and each relevant parent’s values. A child can show unlimited local CPU or memory while constrained by an ancestor that also serves sibling workloads.

For a worked CPU example, imagine a leaf with `cpu.max` set to `150000 100000`. Under sustained runnable demand, the setting permits a quota of 150 ms of CPU time per 100 ms period, equivalent to 1.5 CPUs on average. Multiple runnable threads can consume that allowance early and wait for replenishment. If the parent has a 1-CPU cap shared with another child, the leaf cannot achieve its own nominal quota consistently. The numbers are illustrative. Record time deltas from CPU statistics at the leaf and parents along with the affected service’s request latency.

CPU weights express relative shares when workload demand competes under the relevant hierarchy. A weight setting can affect one workload’s share under contention while having little visible effect when resources are idle. Use a controlled load on both siblings before drawing conclusions about fairness. Do the same comparison without the competing workload, keeping parent limits and CPU placement fixed. The [kernel cgroup v2 guide](https://docs.kernel.org/admin-guide/cgroup-v2.html) details limits, weights, delegation, and controller availability.

## Diagnose memory pressure before a kill

Compare the sampled memory total, usage breakdown, pressure, and changes to event counters. A total alone does not separate cached file data from anonymous memory, and two workloads at the same total can reclaim different amounts before slowing. The cgroup’s `memory.high` is a threshold that can drive reclaim and throttle allocation. The `memory.max` value is a hard limit whose effects depend on reclaim and allocation behavior. The memory event counters help distinguish hitting a threshold from an actual OOM or kill. Inspect relevant parent events as well as the workload’s local events.

In an illustrative service with a 1 GiB hard limit, the process heap could use 650 MiB, while native allocations, thread stacks, and charged cache together account for another 300 MiB. That leaves about 74 MiB compared to 1,024 MiB, assuming the components were measured consistently and are additive. A transient spike can therefore cause pressure even if the language runtime reports plenty of unused heap. Take the measurement while the representative workload runs and compare sustained capacity after load drops. For allocator-level data, preserve enough detail to tell an expected cache from sustained growth.

Record whether a slowdown improved after changing demand, a limit, or sibling contention. For a service that was killed, correlate the kernel or runtime report with cgroup event counters and process exit status. Reproduce the symptom on an isolated workload with comparable bounds rather than forcing memory pressure on a shared node. The kernel’s [pressure stall information guide](https://docs.kernel.org/accounting/psi.html) explains time-based pressure measurements.

## Verify the policy the runtime actually applied

Read the effective configuration in the final deployment. A workload with a PID namespace and a memory limit can still have broad host mounts, elevated capabilities, or a permissive syscall policy depending on the runtime settings. Treat namespace isolation, resource accounting, capabilities, filesystem permissions, syscall policy, and application identity as independently verifiable controls. A namespace can change the view of a resource while other authorized channels still connect processes across that boundary.

For a normal application, record the intended mounts, writable locations, user, group access, and any capability justified by an operation. Run the readiness and ownership checks under the intended non-root identity with a disposable workload. Verify startup, shutdown, and normal state writes. Verify that application cache and temporary files use the approved paths when the root filesystem is read-only. A broadly privileged mode may hide a missing configuration or unwritable path without explaining the original defect. Include the observed settings in deployment evidence. Kubernetes documents the supported [container security-context settings](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/).

Close the test by repeating a representative operation as the deployed application and one workload-level limit test against its staging replica. Keep a compact evidence record with runtime version, namespace identifiers, cgroup path, parent limits, and metrics for the test interval. Capture any expected host-level placement differences between replicas. A move between service-manager configurations or container runtimes can change the effective resource hierarchy, so evaluate the deployed controls after that move even when the workload manifest stayed identical.

## Measure task headroom during deployment and recovery

A task-count limit can bind during a graceful reload where two pools briefly coexist. For an illustrative service with 36 steady-state tasks, a second copy of 36 tasks would occupy 72 even before helpers and health probes counted in the same cgroup. With a ceiling of 75 tasks, a burst of four additional helpers could fail before steady-state monitoring has time to report a problem. Check `pids.current`, the applicable `pids.max`, and the controller’s event counter during staging reload. Count threads as tasks where the controller does. If the service reports a failed worker creation, correlate the failure with parent and local cgroup limits and separately verify process-user limits. Include parallel deploys and supervision behavior in the same test.

A dry run should also account for the workers needed during rollback.
