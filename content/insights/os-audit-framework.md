---
title: "Linux Audit Framework and Compliance Logging"
description: "Configuring auditd to log who ran what command, file access by privileged accounts, and network activity — and turning those logs into evidence for SOC 2, PCI DSS, and security incident investigations."
date: 2027-10-15
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 22
format: article
---

The Linux Audit Framework (`auditd`) is a kernel-level logging subsystem that records security-relevant events: who executed which command, who accessed which file, who called which system call. Kernel-generated audit records provide evidence beyond application logs, but coverage depends on rules and successful collection. Privileged compromise, event loss, storage failure, and disabled collection can undermine the record; use protected off-host evidence and tested monitoring.

## Architecture

The audit subsystem has three parts:

1. **Kernel audit subsystem** — generates selected syscall and other audit records under the active configuration
2. **auditd** daemon — receives records from the kernel audit subsystem over its audit transport and writes them to `/var/log/audit/audit.log`
3. **audit tools** — `auditctl` (rule management), `ausearch` (querying logs), `aureport` (summarising), `audit2allow`/`audit2why` (SELinux integration)

```bash
## Install and start
apt install auditd audispd-plugins   # Debian/Ubuntu
dnf install audit                     # RHEL/Fedora

systemctl enable auditd
# Start using the service procedure supported by the distribution.
# On RHEL, consult its auditd service-management guidance.

## Check status
auditctl -s
## Shows: enabled state, pid, rate limit, backlog

## View current rules
auditctl -l
```

## Writing Audit Rules

Rules tell the kernel what to log. They are defined in `/etc/audit/rules.d/` (persistent) or added live with `auditctl` (not persistent across reboot unless included in the configured rule-loading process).

```text
## /etc/audit/rules.d/99-production.rules

## Optional final rule only after validation: lock configuration until reboot
## (comment out during initial setup, enable for production)
## -e 2

## ── Syscall rules ──

## Observe selected executable launches with effective UID zero
-a always,exit -F arch=b64 -F euid=0 -S execve -k root-commands

## Observe execve calls for any user (potentially high volume)
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

## Kernel module activity (one signal, not complete rootkit detection)
-w /sbin/insmod -p x -k kernel-modules
-w /sbin/rmmod -p x -k kernel-modules
-a always,exit -F arch=b64 -S init_module -S finit_module -S delete_module -k kernel-modules

## Failed file access attempts (reconnaissance detection)
-a always,exit -F arch=b64 -S open -F exit=-EACCES -F auid>=1000 -F auid!=unset -k access-denied
-a always,exit -F arch=b64 -S open -F exit=-EPERM -F auid>=1000 -F auid!=unset -k access-denied

## Mount and unmount (detecting unauthorised storage)
-a always,exit -F arch=b64 -S mount -F auid>=1000 -F auid!=unset -k mounts
-a always,exit -F arch=b64 -S umount2 -F auid>=1000 -F auid!=unset -k mounts

```

Select rules for paths and syscall architectures that actually exist on the target. Do not paste the whole inventory into a production host. After reviewing the rule file, load and inspect it using shell commands:

```bash
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
aureport -m                          # account-modification report
aureport --failed                    # failed events only
aureport -l --failed -ts last-week   # failed logins last week
```

## Reading Raw Audit Events

```bash
## Illustrative raw event fields, not a captured customer record:
## type=SYSCALL msg=audit(1717495200.123:4521): arch=c000003e syscall=59
## success=yes exit=0 a0=7f1234 a1=7f5678 a2=7f9abc a3=0
## items=3 ppid=12345 pid=12346 auid=1000 uid=0 gid=0 euid=0
## suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=pts0 ses=42
## comm="sudo" exe="/usr/bin/sudo" key="privilege-escalation"

## Fields:
## auid  = audit UID — the original login user (does not change with sudo)
## uid   = real UID; euid is the effective UID
## exe   = path of the executable
## comm  = command name
## key   = the -k tag from your rule

## Translate UIDs to names in ausearch output
ausearch -k root-commands --interpret   # -i shorthand
```

## Centralising Logs and Protecting Them

Audit logs on the local machine can be tampered with by a root-level attacker. Forward them to an external SIEM or log aggregator immediately.

Use the forwarding plugin and configuration shipped with the installed audit package. Plugin paths and formats vary across distribution releases. Configure authenticated, protected transport using the supported deployment design, and test receiver authorization, reconnect behavior, queue persistence, and disk exhaustion. Plain TCP alone does not provide confidentiality or authenticated delivery.

The following is an illustrative fragment of `auditd.conf`, not a complete production policy:

```ini
space_left_action = email
admin_space_left_action = suspend
```

Email requires working notification delivery. Suspending logging loses coverage; a different policy may sacrifice service availability instead. Define and test thresholds, notification recipients, retention, and the acceptable failure response. Kernel rate limits belong in audit rules (`-r`), not a `rate_limit` entry in `auditd.conf`; a nonzero limit can discard evidence and must not be treated as harmless flood protection.

## Immutable Rules

Where the approved control design requires it, immutable mode can prevent audit-rule changes until reboot. It is not a universal certification requirement, and reboot evidence itself depends on collection coverage.

```text
## Last line of /etc/audit/rules.d/99-production.rules
-e 2
## This makes the rule list locked until reboot
## Attempts to change locked rules are denied until reboot

```

Verify from a shell:

```bash
auditctl -s | grep "enabled"
## enabled 2 = immutable mode active
```

## Map evidence to an explicit control objective

| Objective | Candidate evidence | Important limitation |
|---|---|---|
| Attribute privileged execution | Execution records with login and effective identities | Shell built-ins and missing login attribution need separate consideration |
| Observe identity-file changes | Scoped file or syscall rules | Directory services and alternate configuration paths need coverage |
| Detect collection failure | Backlog, lost-event, disk and forwarding monitoring | A running daemon alone does not prove complete collection |
| Support investigation | Correlated, protected off-host records | Retention, clocks, access and completeness must be verified |

A rule set is only part of an audit-control design. Map the exact current framework and assessment scope with qualified reviewers; this article does not claim that a few example rules establish PCI DSS, SOC2, or HIPAA compliance. Use distribution-supported baselines and document exceptions rather than deleting noisy rules without understanding their control purpose.

## Design for an investigation question

Begin with a concrete question such as “Which login identity changed the service's authorization configuration?” The answer requires more than an execution record. You need a rule covering the relevant configuration path, identity attribution, a trustworthy timestamp, correlation across records belonging to the same event, and preserved evidence outside the affected host. If the configuration lives in a remote directory service, watching a local file may not answer the question at all.

Separate event generation from successful collection. The kernel can generate a matching record while a congested backlog or unavailable consumer prevents complete downstream delivery. The daemon can be running while the filesystem is nearly full. A forwarding process can be healthy while the receiver rejects its credentials. Monitor each stage and test the actual failure behavior rather than using process uptime as the evidence-quality metric.

A policy should specify the event classes, exclusions, retention, access restrictions, and investigation owner. Broad rules can create excessive volume and expose sensitive command arguments. Narrow rules can miss the behavior of interest. Make that tradeoff explicit with examples of events the policy must capture and events it intentionally does not capture. Review the policy when service paths, identities, deployment mechanisms, or operating-system versions change.

## Interpret identities and events carefully

The audit login identity, `auid`, is intended to preserve attribution to the login session even when effective privilege changes. It can be unset for some processes and execution environments. A rule selecting `auid >= 1000` must account for the unset value and for the distribution's actual identity policy. The number 1000 is a common local convention, not a universal boundary between humans and services.

Real UID, effective UID, and filesystem UID answer different questions. A privileged process may have an effective identity that differs from the identity associated with its login. Containerized workloads add another attribution problem: host identities, namespaces, orchestration metadata, and application identities may need correlation. Audit records alone do not automatically explain which customer request caused a process action.

One event can contain several records sharing an event identifier, including syscall, executable arguments, current directory, and path information. Preserve the event relationship when ingesting records. Counting each record as an independent user action exaggerates activity. Conversely, flattening an event into one short message can discard the path or identity detail needed for investigation.

Executable-launch rules are not a complete command transcript. Shell built-ins do not necessarily call `execve`, and applications may use `execveat` where supported. Access rules limited to `open` do not cover every modern file-opening syscall. Match the supported syscall set and architecture to the target kernel and threat question. Compatibility execution may require rules for another supported architecture; do not copy architecture names blindly between systems.

## A bounded lab for a disposable virtual machine

Use a non-production Linux virtual machine with audit support, a working audit daemon, and permission to manage rules. Keep immutable mode disabled for this exercise. The goal is to establish that a scoped rule produces queryable evidence, then remove that temporary rule. Do not use a global rule deletion command on a shared host.

Create a dedicated directory and file first. In a root shell inside the disposable machine, the legacy watch syntax below is convenient for demonstrating the lifecycle:

```bash
install -d -m 0700 /tmp/ajna-audit-lab
printf 'initial\n' > /tmp/ajna-audit-lab/config.txt
auditctl -w /tmp/ajna-audit-lab/config.txt -p wa -k ajna_lab
printf 'changed\n' >> /tmp/ajna-audit-lab/config.txt
ausearch -k ajna_lab -ts recent -i
auditctl -W /tmp/ajna-audit-lab/config.txt -p wa -k ajna_lab
auditctl -s
```

The upstream auditctl documentation deprecates legacy watch rules in favor of syscall-based equivalents. For a production policy, use the supported syscall-rule form and assess performance with the distribution's guidance. The exercise deliberately uses an isolated existing file and a distinct key so the temporary rule is easy to identify and remove. Confirm removal with the rule listing before deleting the lab directory.

Inspect the event identifier, path, success status, login identity, and effective identity. Repeat through an ordinary login followed by authorized privilege elevation and compare attribution with a process started outside a login session. Do not manufacture a conclusion if the environment leaves the login identity unset. Record the limitation and identify the additional signal your deployment needs.

## Estimate storage from records, not intuition

Consider a hypothetical policy producing 200 records per second at an average serialized size of 600 bytes. Raw throughput is `200 × 600 = 120,000 bytes/second`. At a constant rate, one day produces `120,000 × 86,400 = 10,368,000,000 bytes`, or 10.368 decimal GB. Seven days require 72.576 GB and 30 days require 311.04 GB before other costs.

The chart uses those synthetic values and decimal gigabytes, with one GB equal to one billion bytes. It excludes indexing, replication, metadata, compression, encryption framing, bursts, and retention-tier overhead. These are planning inputs, not a measured Linux benchmark. The average record size must be measured after the actual serialization and enrichment path used for storage.

A multi-record event changes the interpretation of throughput. If an example workload averages four records per event, 200 records per second corresponds to approximately 50 events per second under that assumption. Do not assume that ratio is stable across event classes. Measure both record and event rates, along with peak windows, because sustained averages conceal the backlog pressure created by bursts.

## Rehearse evidence loss and recovery

In a controlled environment, interrupt the forwarding destination and observe local queue growth. Restore it and verify whether events arrive in order, whether duplicates appear, and whether the receiver can detect missing intervals. Record the maximum supported outage at the observed rate. A queue with sufficient space for a quiet weekend may be insufficient during an incident that produces far more records.

Test low-disk thresholds without filling a production filesystem. Confirm that the configured email or alert actually reaches an accountable person. Document whether the chosen response suspends logging, rotates files, stops a service, or affects the host. There is no universally correct availability-versus-evidence tradeoff; it depends on the system's approved operating requirements.

Track lost-event counters, backlog behavior, receiver freshness, and a periodic known test event. A heartbeat proves a narrow path is working, not that every important event class is covered. Combine it with rule-inventory checks and periodic samples of expected behavior. Preserve machine-readable identifiers and clock information needed to investigate discrepancies.

## Deliverables for the control owner

A useful handover contains the approved question-to-rule map, the target distribution and package versions, a tested rule-loading procedure, rollback conditions, forwarding configuration ownership, retention assumptions, and evidence from failure rehearsals. Include the limits: uncovered applications, unset identities, unsupported syscall variants, and the possibility of privileged tampering before off-host preservation.

Review access to audit evidence as carefully as access to application data. Command arguments and file paths can reveal secrets or sensitive business information. Restrict readers, avoid unnecessary collection, and establish a process for investigation access. The objective is reliable, proportionate evidence that can answer a defined question, not the largest possible pile of logs.

## Sources and further reading

- [Linux Audit · auditctl reference](https://github.com/linux-audit/audit-userspace/blob/master/docs/auditctl.8)
- [Linux Audit · auditd.conf reference](https://github.com/linux-audit/audit-userspace/blob/master/docs/auditd.conf.5)
- [Red Hat Enterprise Linux · Auditing the system](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/auditing-the-system_security-hardening)
