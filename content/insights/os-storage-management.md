---
title: "Linux Storage Management: Disks, Partitions, LVM, Filesystems, and Mounting"
description: "How Linux storage works from physical disk to mounted filesystem — block devices, partition tables, LVM for flexible volume management, filesystem creation and tuning, and NFS for network storage."
date: 2026-08-10
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 12
format: article
---

Storage management is a core Linux administration skill that becomes critical when a filesystem fills up at 3am, when you need to expand a volume without downtime, or when you are provisioning a new server. Understanding the full stack — from block device to mounted filesystem — lets you make correct decisions quickly under pressure.

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
server:/data  /mnt/data  nfs  defaults,_netdev,soft,timeo=30,retry=3  0  0
## _netdev: wait for network before mounting
## soft: return error after timeout (not hang forever)
## timeo: timeout in tenths of a second

## Check NFS mounts
showmount -e server               # what a server is exporting
nfsstat                           # NFS statistics
```

Storage management decisions made under pressure — expanding a full volume, adding a new disk to a running system — go smoothly when you understand the stack from block device to mount point. LVM in particular is the tool that converts what would otherwise be a risky repartitioning operation into a straightforward online resize.
