---
title: "systemd: Service Management, Unit Files, Timers, and journald"
description: "How systemd works, writing unit files, managing services, creating timers to replace cron, and using journald to query logs with precision. The complete guide for Linux system administrators."
date: 2026-08-06
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 11
format: article
---

systemd is the init system and service manager on every major Linux distribution. It starts your system, manages all running services, schedules periodic tasks, and collects logs. If you run Linux in production, you interact with systemd constantly — even if you do not realize it. This lesson covers systemd from first principles to advanced unit file authoring.

## What systemd Does

When the Linux kernel finishes booting, it starts exactly one user-space process: PID 1. On modern Linux systems, that process is `systemd`. Everything else — every service, every daemon, every user session — is a child of systemd.

systemd's responsibilities:
- **Parallel service startup**: systemd starts services concurrently when their dependencies are satisfied, significantly faster than sequential init scripts
- **Dependency management**: services declare what they require and what they should start after
- **Service supervision**: automatically restarts failed services according to configured policies
- **Logging**: collects stdout/stderr from all services into the journal
- **Timers**: scheduled execution without cron

```bash
## systemd's process tree
systemctl status              # overall system status
systemd-cgls                  # full process tree organized by cgroup
pstree 1                      # process tree rooted at PID 1
```

## systemctl: Managing Services

```bash
## Service lifecycle
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx        # stop then start
sudo systemctl reload nginx         # reload config without stopping (if supported)
sudo systemctl try-restart nginx    # restart only if currently running

## Enable/disable (controls whether service starts on boot)
sudo systemctl enable nginx
sudo systemctl disable nginx
sudo systemctl enable --now nginx   # enable AND start immediately
sudo systemctl disable --now nginx  # disable AND stop immediately

## Status
systemctl status nginx              # current state + recent log
systemctl is-active nginx           # active / inactive / failed
systemctl is-enabled nginx          # enabled / disabled
systemctl is-failed nginx           # returns 0 if in failed state

## List services
systemctl list-units --type=service                   # active services
systemctl list-units --type=service --state=failed    # failed services
systemctl list-units --type=service --state=running   # running services
systemctl list-unit-files --type=service              # all installed services

## Reload systemd after changing unit files
sudo systemctl daemon-reload

## Boot timing analysis
systemd-analyze                     # total boot time
systemd-analyze blame               # per-service boot time, slowest first
systemd-analyze critical-chain      # the critical path of boot
```

## Unit Files: How Services Are Defined

A unit file describes what a service is, how to start it, and how it relates to other services.

```ini
## /etc/systemd/system/myapp.service
[Unit]
Description=My Application Server
Documentation=https://docs.myapp.internal
After=network-online.target postgresql.service
Requires=postgresql.service
Wants=redis.service

[Service]
Type=simple
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp

## Environment
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=-/etc/myapp/environment    # - means don't fail if missing

## Executable
ExecStartPre=/opt/myapp/scripts/pre-start.sh
ExecStart=/usr/bin/node /opt/myapp/server.js
ExecStop=/opt/myapp/scripts/graceful-stop.sh

## Restart policy
Restart=on-failure
RestartSec=5s
StartLimitIntervalSec=60s
StartLimitBurst=3        # max 3 restarts in 60 seconds, then stop trying

## Resource limits
LimitNOFILE=65536        # max open file descriptors
MemoryMax=512M           # hard memory limit (kills process if exceeded)
CPUQuota=200%            # max 2 CPU cores

## Security hardening
NoNewPrivileges=yes
PrivateTmp=yes           # private /tmp — not shared with other services
ProtectSystem=strict     # /usr, /boot, /etc read-only
ProtectHome=yes          # /home, /root, /run/user read-only
ReadWritePaths=/var/lib/myapp /var/log/myapp

[Install]
WantedBy=multi-user.target
```

**[Unit] section key directives:**
- `After=`: start after these units (dependency ordering, not requirement)
- `Requires=`: hard dependency — if this fails, the unit fails
- `Wants=`: soft dependency — start this if possible, don't fail if it's absent
- `BindsTo=`: like Requires but also stops this unit when the dependency stops

**[Service] section Type values:**
- `simple`: ExecStart is the main process (most common)
- `forking`: process forks and parent exits (traditional daemon pattern)
- `oneshot`: process exits after completing; systemd waits for it
- `notify`: process sends a ready notification to systemd via `sd_notify`
- `dbus`: service signals readiness via D-Bus

**Install with drop-ins (preferred for modifications):**

```bash
## Instead of editing the unit file directly, create a drop-in
sudo systemctl edit nginx
## Creates /etc/systemd/system/nginx.service.d/override.conf
## Override only the parts you need:

[Service]
LimitNOFILE=100000
Environment=NGINX_WORKER_PROCESSES=4
```

## systemd Timers: The Modern Cron

Timers are systemd units (`.timer` files) that activate a corresponding `.service` file on a schedule. They provide better logging, dependency management, and missed-execution handling than cron.

```ini
## /etc/systemd/system/backup.timer
[Unit]
Description=Daily database backup
After=network-online.target

[Timer]
## Calendar-based schedule
OnCalendar=daily            # every day at midnight
OnCalendar=Mon-Fri 09:00    # weekdays at 9am
OnCalendar=*-*-* 02:30:00   # daily at 2:30am
OnCalendar=Sun *-*-* 03:00  # every Sunday at 3am

## Run at boot if the last run was missed
Persistent=true

## Randomize start within this window (prevents thundering herd)
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```ini
## /etc/systemd/system/backup.service
[Unit]
Description=Database backup job
After=postgresql.service

[Service]
Type=oneshot
User=backup
ExecStart=/opt/scripts/backup-database.sh
StandardOutput=journal
StandardError=journal
```

```bash
## Enable the timer (not the service — the timer activates the service)
sudo systemctl enable --now backup.timer

## Check timer status
systemctl list-timers               # all active timers + next/last run times
systemctl status backup.timer       # timer state
systemctl status backup.service     # last run output via journal

## Test the service manually
sudo systemctl start backup.service
journalctl -u backup.service -n 50
```

## journald: Querying Logs with Precision

The journal stores structured logs from all services. Unlike flat log files, it supports rich filtering.

```bash
## Basic usage
journalctl                           # all logs, oldest first
journalctl -r                        # reverse (newest first)
journalctl -f                        # follow (like tail -f)
journalctl -n 50                     # last 50 lines
journalctl -p err                    # errors only (emerg,alert,crit,err)
journalctl -p warning..err           # between warning and err

## Filter by service (unit)
journalctl -u nginx
journalctl -u nginx -u postgresql    # multiple units
journalctl -u nginx -f               # follow nginx logs

## Filter by time
journalctl --since "2026-05-31 10:00:00"
journalctl --since "1 hour ago"
journalctl --since today
journalctl --since "2026-05-31" --until "2026-06-01"

## Filter by process
journalctl _PID=1234
journalctl _COMM=nginx               # all messages from nginx process
journalctl _UID=1000                 # all messages from UID 1000

## Output formats
journalctl -u nginx -o json          # JSON output
journalctl -u nginx -o json-pretty   # pretty JSON
journalctl -u nginx -o short-precise # precise timestamps
journalctl -u nginx -o verbose       # all journal fields

## Disk usage
journalctl --disk-usage

## Configure retention in /etc/systemd/journald.conf
## SystemMaxUse=500M          # max journal size
## SystemMaxFileSize=100M     # max individual file size
## MaxRetentionSec=1month     # max age

sudo systemctl restart systemd-journald  # apply changes
```

## Practical: Debugging a Failed Service

```bash
## 1. Check what failed
systemctl status myapp.service

## 2. See the full log for this service
journalctl -u myapp.service -n 100

## 3. See logs from the last start attempt specifically
journalctl -u myapp.service --since "5 minutes ago"

## 4. See the unit file currently in use (including drop-ins)
systemctl cat myapp.service

## 5. Verify the unit file syntax
systemd-analyze verify /etc/systemd/system/myapp.service

## 6. Check if the user/binary exists
getent passwd appuser
ls -la /usr/bin/node

## 7. Test ExecStart manually as the service user
sudo -u appuser /usr/bin/node /opt/myapp/server.js

## 8. Reset the failure counter (after fixing the cause)
sudo systemctl reset-failed myapp.service
sudo systemctl start myapp.service
```

systemd's combination of declarative unit files, automatic service supervision, structured logging, and timer-based scheduling replaces half the ad-hoc automation that used to require separate tools. The investment in understanding it fully pays back on every Linux system you ever operate.
