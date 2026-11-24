---
title: "The Linux File System: Everything Is a File and Why That Matters"
description: "Linux's 'everything is a file' philosophy, the directory hierarchy, permissions, inodes, and the proc and sys filesystems that expose the kernel's internals to any engineer who knows where to look."
date: 2027-12-17
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
├── tmp/        Temporary files (cleanup policy varies)
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
- Timestamps (access, modification and status change; creation time support varies)
- Pointers to the disk blocks containing the file's data

A directory entry maps a filename to an inode number. The filename is not stored in the inode — it is stored in the directory. This is why you can have multiple filenames (hard links) pointing to the same inode, and why renaming within one filesystem can change directory entries without copying all file contents; it still involves filesystem work and failure conditions.

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
- 600 = owner rw- (6), group --- (0), others --- (0) — private keys should have suitably restrictive access; 600 is a common setting, while stricter modes can also be valid

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

## Environment inspection can expose secrets; inspect only selected
## non-sensitive variables in an authorised diagnostic session.

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

The engineer who knows `/proc`, the permission model, and the log locations can diagnose a production Linux system without any additional tooling. Available tools and visibility depend on the distribution, container image, namespaces and permissions. Host-level evidence may require a separate authorised diagnostic environment.

## A name, an open file, and durable data are different things

A pathname is resolved through directories to a filesystem object. An open file descriptor refers to an opened object even if a pathname later changes. This distinction explains a common operational puzzle: deleting a large log file may not immediately release its storage when a process still has it open. Removing a name and closing the final reference are separate events.

In a fictional logging exercise, a process holds an unlinked 600 MiB log open while the directory tree contains 200 MiB of named files. A simple model accounts for 800 MiB of file data still occupying storage, although a directory walk finds only 200 MiB. After the process closes the unlinked file, that 600 MiB becomes eligible for reclamation. The chart illustrates the two components before closure; filesystem metadata, snapshots, compression, and reserved space are excluded.

This is one reason `du` and `df` can disagree. They measure different things, and other causes such as filesystem reservations or snapshots are possible. Inspect open descriptors and the filesystem's own accounting before assuming either tool is wrong. Do not delete arbitrary files as a first response to a full volume; identify ownership and retention obligations.

## Atomic replacement is not the same as durability

A common configuration-update pattern writes a complete temporary file in the destination directory and renames it over the target. On a suitable filesystem, the rename can provide atomic name replacement so readers do not observe a half-written target. A cross-filesystem move cannot use the same rename operation and may become copy-and-delete behaviour in a command-line tool.

Crash durability requires additional thought. Completing a write or rename does not automatically prove that every required change has reached stable storage. The file and containing directory have distinct persistence considerations. The Linux `fsync` documentation explains why synchronising file contents alone does not necessarily synchronise the directory entry. Actual guarantees also depend on the filesystem, mount options, storage stack, and error handling.

For a critical state file, prefer a well-tested storage abstraction rather than inventing a persistence protocol casually. If implementing one, document the intended failure model and validate it under controlled crashes. Test reader behaviour during replacement, write errors, and interrupted updates. A happy-path test cannot establish power-loss safety.

## Read permission failures at every directory boundary

A readable file can still be inaccessible because the process lacks search permission on a parent directory. Directory read, write, and execute bits have different meanings from those on a regular file. Deleting a directory entry depends primarily on permissions on the directory, with additional rules such as the sticky bit, rather than simply the file's write bit.

A worksheet for an access failure should include the effective user and groups, every parent directory, the file mode, ACLs where used, mount restrictions, and mandatory-access-control policy. Record the exact operation that fails: opening for reading, creating a new entry, replacing an existing file, or executing a program. These operations exercise different checks.

Avoid fixing an unexplained failure with world-writable permissions. In a disposable test directory, grant the smallest permission needed for the intended service account, rerun the operation, and verify that an unrelated account remains denied. This tests both the useful access and the boundary you meant to preserve.

## A safe file-lifecycle exercise

Create a temporary directory containing a small synthetic file. Open it in a test process, rename it, and read through the still-open descriptor. Then unlink the renamed path and observe that the process can still read while the descriptor is open. Close it and confirm the name remains absent. Keep the file small so the exercise cannot create storage pressure.

Next create a hard link and a symbolic link to a second test file. Inspect inode numbers and link counts, then remove the original name. The hard link still names the same object; the symbolic link refers to a path that may now be missing. Explain the difference before using links in a deployment or backup procedure.

Finish by recording which observations came from the process namespace. Containers may have different mount views, restricted `/proc` visibility, no systemd journal, and minimal command sets. Paths and tools available on a host are not guaranteed inside every container. A useful runbook names the environment in which each command should run and what evidence it is expected to produce.

## Further reading and source boundaries

- [Linux manual: inode metadata](https://man7.org/linux/man-pages/man7/inode.7.html)
- [Linux manual: rename](https://man7.org/linux/man-pages/man2/rename.2.html)
- [Linux manual: fsync](https://man7.org/linux/man-pages/man2/fsync.2.html)
- [Linux manual: path resolution](https://man7.org/linux/man-pages/man7/path_resolution.7.html)
