---
title: "Linux Users, Groups, and Permissions: The Complete Model"
description: "How Linux user and group management works, the permission model in depth, sudo configuration, setuid/setgid, ACLs, and the hardening practices that belong on every production server."
date: 2026-08-03
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 9
format: article
---

Linux access control is built on a model that has been in place since the 1970s: every process runs as a user, every file has an owner and a group, and access is determined by matching the process's user and group against the file's permission bits. Understanding this model completely — including its extensions (sudo, ACLs, capabilities) — is essential for both daily operations and security hardening.

## Users and Groups

Every user has a numeric user ID (UID) and belongs to one or more groups, each with a numeric group ID (GID). The mapping between names and IDs lives in two files:

```bash
cat /etc/passwd    # users: username:password:UID:GID:comment:home:shell
cat /etc/group     # groups: groupname:password:GID:member1,member2,...
cat /etc/shadow    # password hashes (root-readable only)

## View your own identity
id                 # uid=1000(chandra) gid=1000(chandra) groups=1000(chandra),27(sudo),4(adm)
whoami             # just the username
```

**System users** (UID < 1000): created by services — `www-data` for nginx, `postgres` for PostgreSQL. They have no login shell (`/usr/sbin/nologin`) and no home directory.

**Regular users** (UID >= 1000): human accounts with home directories and login shells.

```bash
## User management
sudo useradd -m -s /bin/bash -G sudo chandra    # create with home dir, bash, sudo group
sudo useradd -r -s /usr/sbin/nologin appuser     # create system user
sudo passwd chandra                               # set password
sudo usermod -aG docker chandra                   # add to group (-a is essential; without it, removes from other groups)
sudo usermod -s /bin/zsh chandra                  # change login shell
sudo userdel -r chandra                           # delete user and home directory

## Group management
sudo groupadd engineers
sudo gpasswd -a chandra engineers                 # add user to group
sudo gpasswd -d chandra engineers                 # remove user from group

## Switch users
su - postgres                                     # switch to postgres user (- loads their environment)
sudo -u www-data nginx -t                         # run one command as www-data
```

## The Permission Model

Every file and directory has three permission sets:

```
-rwxr-xr-- 1 chandra engineers 4096 May 29 10:00 deploy.sh
│└─┬──┘└─┬──┘└─┬──┘
│  │     │     └── others: r-- (read only)
│  │     └──────── group (engineers): r-x (read, execute)
│  └────────────── owner (chandra): rwx (read, write, execute)
└────────────────── file type: - regular, d directory, l symlink, b block device
```

Permission bits:
- `r` (4): read file contents / list directory contents
- `w` (2): write to file / create or delete files in directory
- `x` (1): execute file / traverse directory (enter it, access files within)

```bash
## Change permissions
chmod 755 script.sh              # rwxr-xr-x
chmod 644 config.txt             # rw-r--r--
chmod 600 ~/.ssh/id_ed25519      # rw------- (SSH keys MUST be this)
chmod 700 ~/.ssh                 # rwx------ (SSH dir must be this)
chmod +x script.sh               # add execute for all
chmod u+x,g-w script.sh          # symbolic: add owner exec, remove group write
chmod -R 755 /var/www/html       # recursive

## Change ownership
chown chandra file               # change owner
chown chandra:engineers file     # change owner and group
chown -R www-data:www-data /var/www/
chgrp engineers file             # change group only

## Default permissions — umask subtracts from 666 (files) or 777 (dirs)
umask                            # shows current mask (typically 022)
## 022 → files created as 644, dirs as 755
## 027 → files created as 640, dirs as 750
```

## Special Permission Bits

**Setuid (s)**: when set on an executable, the program runs as the file's owner, not the calling user. Used by `passwd` and `sudo` to temporarily gain root privileges.

```bash
ls -la /usr/bin/passwd
## -rwsr-xr-x 1 root root 68208 /usr/bin/passwd
## ^ setuid: runs as root regardless of who calls it

## Set/remove setuid
chmod u+s /path/to/binary
chmod 4755 /path/to/binary      # 4 prefix sets setuid
```

**Setgid (s)** on a directory: new files created inside inherit the directory's group, not the creator's group. Essential for shared project directories.

```bash
chmod g+s /shared/project        # new files inherit group
chmod 2775 /shared/project       # 2 prefix sets setgid

mkdir /shared/project
chown :engineers /shared/project
chmod 2775 /shared/project       # engineers can create files, group is preserved
```

**Sticky bit (t)** on a directory: users can only delete their own files, even if they have write permission on the directory. Used on `/tmp`.

```bash
ls -la / | grep tmp
## drwxrwxrwt  /tmp                # t = sticky bit
chmod +t /shared/uploads         # users can only delete their own files
```

## sudo — Controlled Privilege Escalation

`sudo` allows specified users to run commands as root (or another user) with logging.

```bash
sudo command                     # run as root
sudo -u postgres psql            # run as specific user
sudo -l                          # list your sudo permissions
sudo -i                          # open root shell (use carefully)

## The sudoers file — always edit with visudo (validates syntax)
sudo visudo
```

Key sudoers patterns:

```
## /etc/sudoers.d/engineers  (preferred: drop files in sudoers.d/)

## Allow engineers group to run all commands as root
%engineers  ALL=(ALL:ALL) ALL

## Allow chandra to restart nginx without password
chandra  ALL=(root) NOPASSWD: /bin/systemctl restart nginx

## Allow deploy user to run deployment script only
deploy  ALL=(root) NOPASSWD: /opt/scripts/deploy.sh

## Allow appuser to run specific commands as www-data
appuser  ALL=(www-data) /usr/bin/php, /usr/bin/composer
```

**Production rule**: never grant `NOPASSWD: ALL`. Grant the minimum commands required.

## Access Control Lists (ACLs)

The basic permission model allows one owner and one group. ACLs allow per-user and per-group permissions on any file.

```bash
## Show ACLs
getfacl /var/www/html

## Set ACL — give alice read/write without changing group
setfacl -m u:alice:rw /var/www/html/config.php

## Set ACL for a group
setfacl -m g:deployers:rx /var/www/html

## Set default ACL — new files in directory inherit these
setfacl -d -m u:alice:rw /var/www/html

## Remove specific ACL
setfacl -x u:alice /var/www/html/config.php

## Remove all ACLs
setfacl -b /var/www/html/config.php
```

## Practical: Hardening File Permissions

```bash
## Find world-writable files (security risk)
find / -perm -002 -type f -not -path "*/proc/*" 2>/dev/null

## Find setuid binaries
find / -perm -4000 -type f 2>/dev/null

## Find files with no owner
find / -nouser -o -nogroup 2>/dev/null

## Audit sudo usage
journalctl _COMM=sudo | tail -50
grep sudo /var/log/auth.log

## Check for accounts with empty passwords
awk -F: '($2 == "" ) {print $1}' /etc/shadow

## Lock an account
sudo passwd -l username          # locks the password
sudo usermod -e 1 username       # expire the account immediately
```

The permission model is simple but covers the vast majority of access control requirements on a well-configured Linux system. ACLs extend it for complex shared directory scenarios. Sudo provides auditable privilege escalation. Understanding the model at this level means you can harden a system correctly rather than guessing at permission settings.
