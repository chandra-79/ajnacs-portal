---
title: "Linux Storage Management: Disks, Partitions, LVM, Filesystems, and Mounting"
description: "How Linux storage works from physical disk to mounted filesystem — block devices, partition tables, LVM for flexible volume management, filesystem creation and tuning, and NFS for network storage."
date: 2024-10-08
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 12
format: article
---

Storage management is a core Linux administration skill that becomes critical when a filesystem fills up at 3am, when you need to expand a volume without downtime, or when you are provisioning a new server. Understanding the full stack — from block device to mounted filesystem — lets you make correct decisions quickly under pressure.

## What to measure

**Growth runway and recovery verification.** If a volume has 120 GiB free and recent growth is 8 GiB/day, the simple linear runway is 15 days. Recalculate with peak-day growth and restore a sample from an independent backup before treating a resize as your only recovery measure.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The Storage Stack

```
Physical disk (or cloud EBS volume, SAN LUN)
    ↓
Block device (/dev/sda, /dev/nvme0n1)
    ↓
Partition table (MBR or GPT)
    ↓
Partitions (/dev/sda1, /dev/sda2) — or no partitions, use disk directly
    ↓
Optional: LVM (logical volume management) — flexible resizing
    ↓
Filesystem (ext4, xfs, btrfs) — on partition or LVM logical volume
    ↓
Mount point (/data, /var, /home) — where it appears in the directory tree
```

## Identifying Block Devices

```bash
## List all block devices
lsblk                          # tree view: disks, partitions, mount points
lsblk -f                       # include filesystem type and UUID
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,UUID

## Disk information
fdisk -l                       # all disks and partitions
fdisk -l /dev/sda              # specific disk
parted -l                      # GPT-aware alternative

## Device details
blkid                          # UUIDs and filesystem types for all devices
blkid /dev/sda1
udevadm info /dev/sda          # detailed udev information
smartctl -a /dev/sda           # SMART data: disk health, errors, temperature

## Disk naming conventions
## /dev/sda, /dev/sdb           SATA/SAS drives
## /dev/nvme0n1, /dev/nvme1n1   NVMe SSDs
## /dev/vda, /dev/vdb           Virtio drives (KVM/QEMU VMs)
## /dev/xvda                    AWS Xen instances
## Partitions: /dev/sda1, /dev/nvme0n1p1
```

## Partitioning

```bash
## For new disks: use parted or fdisk
## GPT partition table is recommended for all disks > 2TB and modern systems

## parted (GPT, scriptable)
sudo parted /dev/sdb --script \
    mklabel gpt \
    mkpart primary ext4 1MiB 100%

## fdisk (interactive, MBR and GPT)
sudo fdisk /dev/sdb
## Common commands inside fdisk:
## g - create GPT partition table
## n - new partition
## p - print partition table
## d - delete partition
## w - write and exit
## q - quit without saving

## After partitioning, inform kernel of changes
sudo partprobe /dev/sdb
## or
sudo blockdev --rereadpt /dev/sdb
```

## Filesystems

```bash
## Create filesystems
sudo mkfs.ext4 /dev/sdb1
sudo mkfs.ext4 -L "data" /dev/sdb1          # with label
sudo mkfs.xfs /dev/sdb1
sudo mkfs.xfs -L "data" /dev/sdb1
sudo mkfs.btrfs /dev/sdb1

## Filesystem characteristics
## ext4: mature, universal, good for general use. Max volume: 1EB, max file: 16TB
## xfs: high performance, excellent for large files and parallel I/O. Cannot shrink.
## btrfs: copy-on-write, snapshots, checksums, RAID support. Still maturing.

## Filesystem check and repair (run on unmounted filesystem)
sudo e2fsck -f /dev/sdb1               # ext4 check
sudo xfs_repair /dev/sdb1              # xfs repair

## Tune ext4 filesystem
sudo tune2fs -l /dev/sdb1              # show parameters
sudo tune2fs -m 1 /dev/sdb1            # reduce reserved space from 5% to 1%
sudo tune2fs -L "data-volume" /dev/sdb1  # set label

## Resize ext4 (must be unmounted for shrink; online resize supported for expand)
sudo resize2fs /dev/sdb1               # resize to fill partition
sudo resize2fs /dev/sdb1 50G           # resize to specific size
```

## Mounting

```bash
## Mount a filesystem
sudo mount /dev/sdb1 /data
sudo mount -t ext4 /dev/sdb1 /data       # explicit type
sudo mount -o ro /dev/sdb1 /data         # read-only
sudo mount -o remount,rw /data           # change options without unmount

## Common mount options
## ro           read-only
## rw           read-write (default)
## noexec       disallow execution of binaries (security)
## nosuid       disallow setuid bits (security)
## nodev        disallow device files (security)
## relatime     update atime on read only if mtime is newer (performance)
## noatime      never update atime (performance, breaks some apps)

## Unmount
sudo umount /data
sudo umount -l /data              # lazy: detach when last process stops using it
sudo umount -f /data              # force (for NFS/stuck mounts)

## Show what is using a mount point
lsof /data
fuser -m /data

## View all mounts
mount
cat /proc/mounts                  # kernel's view of current mounts
findmnt                           # tree view
findmnt --target /data
```

## /etc/fstab: Persistent Mounts

```bash
## /etc/fstab format:
## device  mountpoint  fstype  options  dump  pass
UUID=abc123  /data  ext4  defaults,noatime  0  2

## Find UUID (use UUID, not /dev/sdX — device names can change)
blkid /dev/sdb1

## Test fstab without rebooting
sudo mount -a                     # mount all fstab entries not yet mounted

## fstab options for common scenarios
## Data volume:
UUID=abc123  /data  ext4  defaults,noatime,nofail  0  2
## nofail: don't prevent boot if this mount fails

## Temporary filesystem in RAM:
tmpfs  /tmp  tmpfs  defaults,size=2G,mode=1777  0  0

## Bind mount (make a directory accessible at another path):
/opt/app/data  /data/app  none  bind  0  0
```

## LVM: Logical Volume Management

LVM adds a flexible abstraction layer between physical storage and filesystems. You can resize, snapshot, and add storage to running systems without repartitioning.

**Three layers:**
- **PV (Physical Volume)**: a disk or partition (`/dev/sdb1`, `/dev/sdb`)
- **VG (Volume Group)**: a pool of storage built from PVs
- **LV (Logical Volume)**: a slice of a VG that behaves like a partition

```bash
## === Setup: add a new disk to an existing VG ===

## 1. Create Physical Volume
sudo pvcreate /dev/sdc
sudo pvs                          # show PVs

## 2. Add to Volume Group
sudo vgextend datavg /dev/sdc
sudo vgs                          # show VGs

## 3. Extend Logical Volume
sudo lvextend -l +100%FREE /dev/datavg/data    # use all free space
sudo lvextend -L +50G /dev/datavg/data          # add exactly 50GB
sudo lvs                          # show LVs

## 4. Resize the filesystem (ext4)
sudo resize2fs /dev/datavg/data

## For XFS (already mounted):
sudo xfs_growfs /data             # resize XFS online

## === Create a new LV ===
sudo lvcreate -n logs -L 100G datavg
sudo mkfs.ext4 /dev/datavg/logs
sudo mkdir /var/log/app
echo "UUID=$(blkid -s UUID -o value /dev/datavg/logs) /var/log/app ext4 defaults,noatime 0 2" | \
    sudo tee -a /etc/fstab
sudo mount -a

## === LVM Snapshots (for backups without downtime) ===
sudo lvcreate -s -n data-snap -L 10G /dev/datavg/data
sudo mount -o ro /dev/datavg/data-snap /mnt/snapshot
## Take backup from /mnt/snapshot
sudo umount /mnt/snapshot
sudo lvremove /dev/datavg/data-snap

## === Full status ===
sudo pvdisplay
sudo vgdisplay
sudo lvdisplay
```

## Disk Usage Monitoring

```bash
## Filesystem usage
df -h                             # all mounted filesystems, human-readable
df -h /data                       # specific mount
df -i                             # inode usage (can run out even with free space)

## Directory usage
du -sh /var/log                   # size of directory
du -sh /var/log/*                 # each subdirectory
du -sk /var/log/* | sort -rn | head -10   # sorted, largest first

## Find large files
find /var -type f -size +100M -exec ls -lh {} +
find / -type f -size +1G 2>/dev/null

## Monitor disk I/O in real time
iostat -x 1                       # extended stats, 1-second interval
iotop                             # per-process I/O (like top for disk)
```

## NFS: Network File System

```bash
## Server side: export a directory
sudo apt install nfs-kernel-server
echo "/data  192.168.1.0/24(rw,sync,no_subtree_check)" | sudo tee -a /etc/exports
sudo exportfs -ra                 # apply exports
sudo systemctl enable --now nfs-server

## Client side: mount NFS share
sudo apt install nfs-common
sudo mount -t nfs server:/data /mnt/data

## In /etc/fstab (with retries and timeout options):
server:/data  /mnt/data  nfs  defaults,_netdev,hard  0  0
## _netdev: wait for network before mounting
## hard: wait for the server and retry NFS requests. Test application behavior during unavailability.

## Check NFS mounts
showmount -e server               # what a server is exporting
nfsstat                           # NFS statistics
```

Storage management decisions made under pressure — expanding a full volume, adding a new disk to a running system — go smoothly when you understand the stack from block device to mount point. LVM in particular is the tool that converts what would otherwise be a risky repartitioning operation into a straightforward online resize.

## Trace the application path back to its actual volume

Start from the path the application really opens, including the pathname as seen by the application process. A change made to the host mount table may be invisible inside a container or service with its own mount namespace. Record the filesystem type and source, then map its device and the lower layers to physical or cloud storage identifiers. Keep provider volume IDs, filesystem UUIDs, and LVM identities in the inventory so another engineer can identify the same disk after a reboot or instance replacement.

Compare `findmnt --target /data` with what the application can write, and check that the result names the expected mount target. If a mount fails, an ordinary directory can remain at the mount path and receive writes on the root filesystem. The workload may look healthy until the root disk fills. Test restart with the intended mount absent on a disposable system. A service handling authoritative data should refuse to become ready when it sees the wrong source. Set service startup ordering so volume availability and permissions are verified before the application uses it.

For clustered storage, record the expected writer role and naming scheme. Mapping two hosts to an ordinary local filesystem on a shared block device can corrupt data if both treat it as their own. Check the documented coordination model for that deployment. A filesystem UUID identifies a filesystem format instance, and a block-level clone can carry the same UUID. Choose stable identifiers with that possibility in mind and validate restored clones in an isolated environment.

## Diagnose disagreement between filesystem and directory totals

A capacity page can show that `df` reports 90 GiB used while `du` sees 59 GiB attributed to reachable files. The arithmetic is illustrative. These tools measure different things. Check whether the scan ran with enough permissions and remained inside the intended filesystem. Compare an allocation-based `du` scan with a separate apparent-size report when sparse files might explain a discrepancy. For a live system, save sample timestamps because a process can write substantial data while a recursive traversal is running.

Next check for an open file whose directory entry has been deleted. A process can continue writing to it until the last reference closes, using blocks which no pathname walk can count. Identify the owning process and coordinate a safe reopen or restart under the service’s operating procedure. Verify the filesystem counters afterwards. Removing another file of similar size may provide immediate runway but leaves the underlying behavior intact. A test of log rotation should show that the writer switches to the intended new file and older allocations become reclaimable.

Check inode availability and quotas alongside free bytes. Many small files can exhaust the available inode count long before capacity appears full. Per-user or project quotas may stop a workload despite plenty of filesystem-level free space. A report should record which counter explains the actual write failure and whether other tenants are affected. Build alerts with that same scope.

## Expand from the lowest changed layer upwards

Suppose a provider increases a block volume from 500 GiB to 700 GiB, with a partition containing the LVM physical volume and an XFS filesystem on a logical volume. This is an illustrative expansion. Before acting, confirm that the correct device now exposes approximately 700 GiB and that partition geometry permits growth. If there is a partition, the kernel must see its enlarged bounds before the physical volume can use them. Verify physical volume capacity and volume group free extents before extending the intended logical volume. Then grow the mounted filesystem with its own documented tool and confirm the size reported at the application’s mount path.

Record capacities and identifiers at every step. If the lower device grew but the logical volume stayed at its prior size, use the upper-layer evidence to choose where to resume. Repeating the initial cloud request or rerunning partition commands without inspection can make the outcome harder to diagnose. If the logical volume already grew, check the filesystem before extending the volume again. Test a small representative write and verify ownership and access through the deployed service.

Treat shrink as a separate procedure with a different failure boundary. File data can be lost if a lower layer shrinks before the filesystem. Use a supported, rehearsed procedure for the specific filesystem. For filesystems and versions where shrinking is unsupported, build a smaller replacement and migrate verified data under a controlled cutover. Red Hat’s [guide to managing logical volumes](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/pdf/configuring_and_managing_logical_volumes/Red_Hat_Enterprise_Linux-10-Configuring_and_managing_logical_volumes-en-US.pdf) covers resizing and volume types.

## Check the thin pool and the snapshot separately

In a thin-provisioned pool, virtual capacities do not establish available physical storage. Imagine a 600 GiB thin pool backing four 250 GiB logical volumes. If their combined allocations and snapshot history consume 570 GiB of pool data, only about 30 GiB remains at that layer. An individual filesystem can show 80 GiB free while its next write approaches pool exhaustion. These are illustrative values and exclude metadata or allocation overhead. Monitor pool data and metadata independently, along with remaining physical extents for expansion.

Measure change rate during a snapshot’s expected lifetime. An illustrative snapshot reserve of 10 GiB exposed to roughly 4 GiB of unique changed blocks per hour only has about 2.5 hours of runway if the rate stays constant. Repeated writes to the same blocks, metadata, implementation details, and other activity change the real lifetime. Test under the backup window and record what happens if unexpectedly heavy write activity overlaps it. For thin snapshots, account for shared pool counters and snapshots that keep old blocks referenced.

A point-in-time block snapshot of a running service generally provides a crash-consistency boundary unless the application or storage workflow coordinates writes and the documented consistency mechanism. If the application’s state spans multiple volumes, a tested database backup procedure or coordinated snapshots may be necessary. Restore away from the source, use the service’s consistency tooling, and confirm a known business object plus the latest expected recoverable record. Save whether redo or replay was required and time the restore through application readiness. Verify an independent copy that remains available when the original storage fails.

## Give network storage an explicit failure policy

For NFS, test how the workload experiences a server outage and how it behaves when the server recovers. On Linux, a hard mount generally keeps retrying an unanswered request. A soft mount can surface an error after retries are exhausted, and the Linux NFS manual warns of potential silent data corruption in some circumstances. Choose options against application correctness, storage documentation, and failure behavior. Check NFS version, permissions, and whether clients can recover after stale handles or network changes. Verify a representative operation after server recovery. See the [Linux NFS manual](https://man7.org/linux/man-pages/man5/nfs.5.html).

Record whether the application can accept new work while remote reads or writes are delayed. Plan an operator-visible response for blocked requests, such as limiting admission while storage fails. In a staged outage, monitor client latency, error codes, and the observed service outcome in addition to mount presence. The same exercise can expose an application that silently writes to a local path when the expected share is missing. Validate the path after both reboot and recovery before declaring the service healthy.

For a planned mount change, keep a record of exact source and target identities, the prior mount options, and the owner who can stop writers. Take a baseline of active service file handles and expected file counts. Compare them after the service starts on the intended volume. If consumers write during the migration, identify which data can be copied concurrently and which changes need a final sync under a write freeze. A rollback that immediately remounts the old filesystem may drop updates from the new location. Rehearse recovering both the mount and the data needed to reopen the application.
