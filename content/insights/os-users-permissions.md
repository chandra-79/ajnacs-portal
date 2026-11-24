---
title: "Linux Users, Groups, and Permissions: The Complete Model"
description: "How Linux user and group management works, the permission model in depth, sudo configuration, setuid/setgid, ACLs, and the hardening practices that belong on every production server."
date: 2027-03-01
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 9
format: article
---

Linux access control is built on a model that has been in place since the 1970s: every process runs as a user, every file has an owner and a group, and access is determined by matching the process's user and group against the file's permission bits. Understanding this model completely — including its extensions (sudo, ACLs, capabilities) — is essential for both daily operations and security hardening.

## Users and Groups

Every user has a numeric user ID (UID) and belongs to one or more groups, each with a numeric group ID (GID). Local mappings appear in these files; NSS can also obtain identities from directory services:

```bash
cat /etc/passwd    # users: username:password:UID:GID:comment:home:shell
cat /etc/group     # groups: groupname:password:GID:member1,member2,...
cat /etc/shadow    # protected password hashes; distribution-specific privileged access applies

## View your own identity
id                 # uid=1000(chandra) gid=1000(chandra) groups=1000(chandra),27(sudo),4(adm)
whoami             # just the username
```

System and human account UID ranges depend on distribution and local policy. A service account can have a home directory and its login behavior must be inspected rather than inferred from its number.

```bash
## User management
sudo useradd -m -s /bin/bash -G sudo chandra    # create with home dir, bash, sudo group
sudo useradd -r -s /usr/sbin/nologin appuser     # create system user
sudo passwd chandra                               # set password
sudo usermod -aG engineers chandra                   # add to group (-a is essential; without it, removes from other groups)
sudo usermod -s /bin/zsh chandra                  # change login shell
# Destructive example for an approved disposable account only:
# sudo userdel -r labuser  # also removes its home; inspect owned data and running processes first

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

| Permission class | Example bits | Meaning for a regular file |
|---|---|---|
| Owner | rwx | Read, write, execute |
| Group | r-x | Read and execute |
| Other | r-- | Read |

Permission bits:
- `r` (4): read file contents / list directory contents
- `w` (2): write to file / create or delete files in directory
- `x` (1): execute file / traverse directory (enter it, access files within)

```bash
## Change permissions
chmod 755 script.sh              # rwxr-xr-x
chmod 644 config.txt             # rw-r--r--
chmod 600 ~/.ssh/id_ed25519      # restrictive private-key example; ownership and alternate valid modes matter
chmod 700 ~/.ssh                 # restrictive SSH-directory example
chmod a+x script.sh              # explicitly add execute to all classes
chmod u+x,g-w script.sh          # symbolic: add owner exec, remove group write
find ./lab-web -type d -exec chmod 755 {} +
find ./lab-web -type f -exec chmod 644 {} +

## Change ownership
chown chandra file               # change owner
chown chandra:engineers file     # change owner and group
## Keep deployed code owned by a deployment identity; grant the runtime
## write access only to the specific state directories it requires.
chgrp engineers file             # change group only

## umask clears permission bits from the mode requested at creation
umask                            # shows current mask (typically 022)
## For requested modes 0666/0777 without default ACLs: 022 gives 0644/0755
## Under the same assumptions: 027 gives 0640/0750
```

## Special Permission Bits

**Setuid (s)**: on an eligible executable, execution can change the effective UID to the file owner while retaining other identity information. Mount flags, no_new_privs, tracing, namespaces, and kernel rules can suppress or constrain this behavior. Used by `passwd` and `sudo` to temporarily gain root privileges.

```bash
ls -la /usr/bin/passwd
## -rwsr-xr-x 1 root root 68208 /usr/bin/passwd
## Setuid can set effective UID to the owner when execution conditions permit.

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

**Sticky bit (t)** on a directory restricts deletion and renaming to the file owner, directory owner, or a suitably privileged process, in addition to other access checks. Used on `/tmp`.

```bash
ls -la / | grep tmp
## drwxrwxrwt  /tmp                # t = sticky bit
chmod +t /shared/uploads         # also allows directory-owner or privileged exceptions
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
## General interpreters and package managers can execute arbitrary code;
## do not treat them as narrowly scoped sudo permissions.
```

Grant the minimum command and identity scope required. Broad passwordless administration needs an explicit, reviewed reason and compensating controls; it is not a default service-account pattern.

## Access Control Lists (ACLs)

The basic permission model allows one owner and one group. ACLs can express named-user and named-group permissions where the filesystem and mount support them.

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

## A process carries credentials, not a username string

The kernel makes many access decisions using numeric credentials associated with a process. Names are a presentation and lookup layer. Local files are one source of those mappings, while NSS can consult directory services. Use getent when you need the system's configured view of a user or group rather than assuming every identity appears in /etc/passwd. A deleted name can leave files owned by its numeric UID, which matters if that UID is later reused.

Real, effective, saved, and filesystem identities have distinct roles. For ordinary troubleshooting, inspect the effective identity and supplementary groups of the actual process performing the operation. A new group membership may not appear in an already-running session or service until its credentials are refreshed. Checking a newly opened shell while the failing daemon retains old groups can lead to a misleading conclusion.

Containers add namespace mappings. UID 0 inside a user namespace is not automatically equivalent to unrestricted host root. Conversely, a container with broad host privileges can have authority beyond what its internal username suggests. Inspect the runtime configuration and mappings before reasoning about ownership across a bind mount.

## Worked example: mode creation is a bit operation

Suppose a program requests mode 0666 for a new regular file and the process umask is 0027. The mask clears group-write and all other-class permissions, producing 0640. For a directory requested as 0777 under the same mask, the result is 0750. The conceptual figure separates requested mode, mask, resulting mode, and later access checks. It is not an arithmetic subtraction chart because permission bits are flags, not quantities.

These values describe a hypothetical ordinary creation without a default ACL. A default ACL on the parent directory changes the creation rules, and an application can request a more restrictive mode. A later chmod or ACL change can also alter access. The example demonstrates why “umask subtracts from 777” is an unreliable mental shortcut even when familiar cases appear to work numerically.

Use a disposable directory to test the behavior. Record the current mask, create a file and directory, inspect their modes, then restore the prior mask if you changed it in the interactive shell. Prefer a subshell when experimenting so the altered mask does not unexpectedly affect later commands. Do not test broad recursive permission changes on system directories.

## Directory permissions explain many surprises

Reading a directory allows listing its entries; execute permission allows searching or traversing it. A person can sometimes access a known filename through a searchable directory without being able to list every name. Each parent directory in a path must permit the relevant traversal. A readable file can therefore remain inaccessible because an ancestor directory blocks the path.

Creating, deleting, or renaming directory entries depends primarily on the containing directory's permissions, with additional checks such as the sticky bit. Making a file read-only does not necessarily prevent someone with suitable directory permissions from deleting its name. The sticky bit restricts deletion and renaming in shared directories, but the directory owner and suitably privileged processes have additional authority.

An open file descriptor is another distinction. Changing a path's permissions does not necessarily revoke access already obtained through an open descriptor. Account and access retirement therefore needs to consider running processes and sessions, not only the current file mode. Rebooting is not always necessary, but explicit session or process handling may be.

## ACL masks and inheritance need inspection

An access ACL can grant named users and groups additional permissions. Its mask limits the effective permissions of the named-user, owning-group, and named-group entries. A getfacl result may therefore show a requested permission and a narrower effective permission. Diagnose the mask before adding another redundant ACL entry.

A default ACL on a directory influences newly created children; it does not retroactively repair every existing file. Applications can request restrictive modes, and copying tools may preserve or replace metadata according to their options. Test the actual workflow that creates the files. A manual touch command is not always representative of an application that creates a temporary file and renames it into place.

Changing ordinary group mode bits can interact with the ACL mask. Review both ls and getfacl output after a change. A recursive chmod intended to standardize modes can unexpectedly alter effective ACL permissions across a tree. Keep ownership and access requirements explicit, and use separate handling for directories and regular files when their needs differ.

## Sudo rules are programs with a trust boundary

A narrow-looking sudo command can still provide broad authority. If a user can modify a permitted script, its imported code, or a configuration file that controls execution, they may control what runs with the elevated identity. A general interpreter or package manager can execute arbitrary code and should not be mistaken for a limited operational action. Review the entire execution path.

Use absolute executable paths and inspect argument matching according to the installed sudo version. Wildcards can match more than an operator expects. A wrapper can constrain inputs, but only if it validates them correctly and is not writable by the caller. Keep the wrapper small, reviewable, and owned by an appropriate administrative identity.

Validate sudoers syntax with visudo and test both an allowed and a denied action using a dedicated test account. Logging is useful evidence, but it does not guarantee that every subprocess action is recorded in the detail an investigation may require. Define the audit objective and configure the relevant facilities accordingly.

## Setuid, capabilities, and service ownership

Setuid execution changes credentials under defined conditions, but mount options, no-new-privileges, and other controls can suppress or constrain the effect. Linux does not treat a setuid shell script like an ordinary setuid binary. Do not add special bits to an arbitrary executable as a quick fix for a permission problem. Establish the minimum authority the operation needs and choose a supported mechanism.

File capabilities can grant specific privileged operations, but a capability can still be powerful in context. Inspect the program and the resources it can influence. A capability assigned to an interpreter may empower all code the interpreter runs. Container capability sets and user namespaces further affect the meaning of the grant.

Separate deployed code from writable application state. If a web process owns and can modify its executable code, an application compromise may persist by altering that code. Give the runtime only the write locations it needs, such as an upload or cache directory, and keep deployment authority distinct where practical. Test log rotation and temporary-file creation so a restrictive design remains operable.

## An access-debugging worksheet

Record the failing operation, effective process identity, supplementary groups, complete path, mode bits, ACL, mount options, and MAC context. Reproduce the operation as the relevant identity in a controlled environment. Change one condition at a time and verify both intended access and intended denial. Avoid chmod 777 as a diagnostic shortcut because it changes several boundaries at once and can leave a dangerous exception behind.

For account removal, inventory credentials, scheduled jobs, service ownership, active sessions, and files by numeric ID. Locking a password is only one step and does not necessarily disable key-based authentication. Preserve or transfer required data before deleting a home directory. The practical lesson is to reason about the actual process, object, and operation rather than infer access from a username or a familiar-looking mode string.

## Sources and further reading

- [Linux man-pages · Process credentials](https://man7.org/linux/man-pages/man7/credentials.7.html)
- [Linux man-pages · umask](https://man7.org/linux/man-pages/man2/umask.2.html)
- [Linux ACL project · Access control lists](https://man7.org/linux/man-pages/man5/acl.5.html)
