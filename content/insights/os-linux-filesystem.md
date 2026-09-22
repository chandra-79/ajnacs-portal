---
title: "The Linux File System: Everything Is a File and Why That Matters"
description: "Linux's 'everything is a file' philosophy, the directory hierarchy, permissions, inodes, and the proc and sys filesystems that expose the kernel's internals to any engineer who knows where to look."
date: 2027-07-19
tags: ["Programming", "Fundamentals"]
series: "Operating Systems for Engineers"
seriesOrder: 4
format: article
---

"Everything is a file" is not just a Linux philosophy — it is a design decision that makes the OS inspectable and programmable in a uniform way. The same `read()` and `write()` system calls that read text files also read from network sockets, communicate with hardware devices, and inspect running processes. Understanding the Linux filesystem unlocks the diagnostic capability the OS exposes to any engineer willing to look.

## The Directory Hierarchy

Linux uses a single rooted directory tree. There are no drive letters (C:, D:) — everything is under `/`.

```
/
├── bin/        Essential command binaries (ls, cp, bash)
├── etc/        System configuration files
├── home/       User home directories
├── lib/        Shared libraries
├── proc/       Virtual filesystem: kernel and process state
├── sys/        Virtual filesystem: hardware and kernel parameters
├── tmp/        Temporary files (cleared on reboot)
├── usr/        User programs and libraries
│   ├── bin/    Most command-line tools
│   └── lib/    Libraries for user programs
└── var/        Variable data: logs, databases, spool files
    └── log/    System and application logs
```

**`/proc` and `/sys`** are virtual filesystems — they contain no data on disk. The kernel generates their contents on demand when you read from them. Reading `/proc/cpuinfo` asks the kernel for current CPU information; reading `/proc/<PID>/status` asks for the current state of process PID.

## Inodes: What a File Actually Is

A file is not just its content. It is an **inode** — a data structure stored on disk that contains:
- File type (regular file, directory, symbolic link, device)
- Permissions (read/write/execute for owner, group, others)
- Owner (UID) and group (GID)
- File size
- Timestamps (created, modified, accessed)
- Pointers to the disk blocks containing the file's data

A directory entry maps a filename to an inode number. The filename is not stored in the inode — it is stored in the directory. This is why you can have multiple filenames (hard links) pointing to the same inode, and why renaming a file within the same filesystem is instantaneous (only the directory entry changes).

```bash
## Show inode information
stat /etc/hosts
ls -i /etc/hosts    # show inode number

## Count inodes in use (separate limit from disk space)
df -i
```

## Permissions: The Three-Level Model

Linux permissions are a three-level model: owner, group, others. Each level has three bits: read (r), write (w), execute (x).

```bash
ls -la /usr/bin/python3
## -rwxr-xr-x 1 root root 5480 Jan 10 2026 /usr/bin/python3
## ^^^         owner: rwx (read, write, execute)
## ^^^      group: r-x (read, no write, execute)
## ^^^   others: r-x (read, no write, execute)
```

**Numeric representation**: r=4, w=2, x=1. Sum the values for each level.
- 755 = owner rwx (7), group r-x (5), others r-x (5)
- 644 = owner rw- (6), group r-- (4), others r-- (4)
- 600 = owner rw- (6), group --- (0), others --- (0) — SSH private keys must be 600

```bash
chmod 755 script.sh      # set permissions
chown chandra:engineers file.txt   # set owner and group
```

## /proc: The Kernel's Diagnostic Interface

`/proc` is where the kernel exposes its state. Every running process has a directory at `/proc/<PID>/`:

```bash
## All files a process has open
ls -la /proc/<PID>/fd

## Memory map of a process
cat /proc/<PID>/maps

## Environment variables of a running process
cat /proc/<PID>/environ | tr '\0' '\n'

## Command line that started the process
cat /proc/<PID>/cmdline | tr '\0' ' '

## System-wide: current network connections
cat /proc/net/tcp
ss -tunapoe   # more readable

## CPU info
cat /proc/cpuinfo

## Memory info
cat /proc/meminfo

## Kernel version
cat /proc/version
uname -r
```

## Logs: Where the System Tells You What Happened

Linux logs are in `/var/log/` and in the systemd journal:

```bash
## System log (kernel, hardware, OS events)
journalctl -k                   # kernel messages
journalctl -u nginx.service     # logs for a specific service
journalctl --since "1 hour ago" # time-filtered

## Traditional log files
tail -f /var/log/syslog         # system events
tail -f /var/log/auth.log       # authentication events (login, sudo)

## Application logs commonly in:
## /var/log/<application>/
## or via journalctl if managed by systemd
```

The engineer who knows `/proc`, the permission model, and the log locations can diagnose a production Linux system without any additional tooling. Every cloud VM, every Kubernetes node, every container with a shell exposes the same interface.
