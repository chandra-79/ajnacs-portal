---
title: "Linux Audit Framework and Compliance Logging"
description: "Configuring auditd to log who ran what command, file access by privileged accounts, and network activity — and turning those logs into evidence for SOC 2, PCI DSS, and security incident investigations."
date: 2027-04-16
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 22
format: article
---

The Linux Audit Framework (`auditd`) is a kernel-level logging subsystem that records security-relevant events: who executed which command, who accessed which file, who called which system call. Unlike application logs, these records cannot be suppressed by a compromised application because the kernel generates them. This makes audit logs the authoritative source for forensic investigation and compliance evidence.

## Architecture

The audit subsystem has three parts:

1. **Kernel audit module** — intercepts system calls and generates event records based on active rules
2. **auditd** daemon — reads records from the kernel ring buffer and writes them to `/var/log/audit/audit.log`
3. **audit tools** — `auditctl` (rule management), `ausearch` (querying logs), `aureport` (summarising), `audit2allow`/`audit2why` (SELinux integration)

```bash
## Install and start
apt install auditd audispd-plugins   # Debian/Ubuntu
dnf install audit                     # RHEL/Fedora

systemctl enable --now auditd

## Check status
auditctl -s
## Shows: enabled state, pid, rate limit, backlog

## View current rules
auditctl -l
```

## Writing Audit Rules

Rules tell the kernel what to log. They are defined in `/etc/audit/rules.d/` (persistent) or added live with `auditctl` (lost on restart).

```bash
## /etc/audit/rules.d/99-production.rules

## ── Required first line: make rule list immutable after loading ──
## (comment out during initial setup, enable for production)
## -e 2

## ── Syscall rules ──

## Log all commands executed by root
-a always,exit -F arch=b64 -F uid=0 -S execve -k root-commands

## Log all commands executed by any user (high volume — use carefully)
-a always,exit -F arch=b64 -S execve -k all-commands

## Log privilege escalation (sudo, su)
-w /usr/bin/sudo -p x -k privilege-escalation
-w /usr/bin/su -p x -k privilege-escalation

## ── File watch rules (-w = watch) ──
## -p: rwxa — read, write, execute, attribute change

## Critical config files
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/sudoers -p wa -k privilege-escalation
-w /etc/sudoers.d/ -p wa -k privilege-escalation

## SSH configuration changes
-w /etc/ssh/sshd_config -p wa -k ssh-config
-w /root/.ssh/ -p wa -k ssh-keys

## Network configuration
-w /etc/hosts -p wa -k network-config
-w /etc/network/ -p wa -k network-config

## Crontab modifications (persistence mechanism)
-w /etc/cron.d/ -p wa -k cron
-w /var/spool/cron/ -p wa -k cron
-w /etc/crontab -p wa -k cron

## Kernel module loading (rootkit detection)
-w /sbin/insmod -p x -k kernel-modules
-w /sbin/rmmod -p x -k kernel-modules
-a always,exit -F arch=b64 -S init_module -S delete_module -k kernel-modules

## Failed file access attempts (reconnaissance detection)
-a always,exit -F arch=b64 -S open -F exit=-EACCES -F auid>=1000 -k access-denied
-a always,exit -F arch=b64 -S open -F exit=-EPERM -F auid>=1000 -k access-denied

## Mount and unmount (detecting unauthorised storage)
-a always,exit -F arch=b64 -S mount -F auid>=1000 -k mounts
-a always,exit -F arch=b64 -S umount2 -F auid>=1000 -k mounts

## Load the rules
augenrules --load   # loads all files in /etc/audit/rules.d/
auditctl -l         # verify loaded
```

## Querying Audit Logs

```bash
## Search by key (the -k tag from your rules)
ausearch -k identity              # changes to /etc/passwd etc.
ausearch -k privilege-escalation  # sudo/su usage
ausearch -k root-commands         # commands run as root

## Search by key with time filter
ausearch -k identity -ts yesterday -te today

## Search by user
ausearch -ua 1000    # by UID
ausearch -ua john    # by username

## Search for specific executable
ausearch -x /bin/bash

## Search for login failures
ausearch -m USER_LOGIN --success no

## Pipe to aureport for summary
ausearch -k root-commands | aureport -x --summary

## Standard report formats
aureport                             # overall summary
aureport -l                          # login report
aureport -x                          # executable report
aureport -u                          # user report
aureport -f                          # file access report
aureport -m                          # modification report
aureport --failed                    # failed events only
aureport -l --failed -ts last-week   # failed logins last week
```

## Reading Raw Audit Events

```bash
## Raw event for a sudo command:
## type=SYSCALL msg=audit(1717495200.123:4521): arch=c000003e syscall=59
## success=yes exit=0 a0=7f1234 a1=7f5678 a2=7f9abc a3=0
## items=3 ppid=12345 pid=12346 auid=1000 uid=0 gid=0 euid=0
## suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=42
## comm="sudo" exe="/usr/bin/sudo" key="privilege-escalation"

## Fields:
## auid  = audit UID — the original login user (does not change with sudo)
## uid   = current effective UID
## exe   = path of the executable
## comm  = command name
## key   = the -k tag from your rule

## Translate UIDs to names in ausearch output
ausearch -k root-commands --interpret   # -i shorthand
```

## Centralising Logs and Protecting Them

Audit logs on the local machine can be tampered with by a root-level attacker. Forward them to an external SIEM or log aggregator immediately.

```bash
## /etc/audit/plugins.d/syslog.conf — forward audit events to syslog
active = yes
direction = out
path = builtin_syslog
type = builtin
args = LOG_INFO
format = string

## Or use audisp-remote to forward directly to a remote auditd
## /etc/audit/audisp-remote.conf
remote_server = siem.company.internal
port = 60
transport = tcp
enable_krb5 = no

## Set rate limits to prevent log flooding under attack
## /etc/audit/auditd.conf
rate_limit = 200         # events per second limit
space_left_action = email
admin_space_left_action = suspend   # if disk is critically low, stop accepting events
```

## Immutable Rules

For PCI DSS and SOC 2 compliance environments, audit rules should be made immutable at boot so they cannot be changed without a reboot (which itself generates an event).

```bash
## Last line of /etc/audit/rules.d/99-production.rules
-e 2
## This makes the rule list locked until reboot
## auditctl -l will show "(no new rules)..." if you try to add rules

## Verify
auditctl -s | grep "enabled"
## enabled 2 = immutable mode active
```

## Compliance Mapping

| Compliance requirement | Audit rule coverage |
|---|---|
| PCI DSS 10.2.1 — All user access | `execve` rules + login events |
| PCI DSS 10.2.2 — Root actions | `-F uid=0 -S execve` |
| PCI DSS 10.2.5 — Auth mechanism changes | `/etc/passwd`, `/etc/shadow` watches |
| SOC 2 CC6.1 — Logical access controls | Login events, sudo usage |
| SOC 2 CC7.2 — Monitoring | File integrity via `-w` watches |
| HIPAA 164.312(b) — Audit controls | All of the above + centralised forwarding |

The CIS Benchmark for Linux provides a complete set of recommended audit rules for each level (Level 1/Level 2) that maps to these compliance frameworks. Start with the CIS recommendations and remove rules that generate excessive false-positive volume for your specific workload.
