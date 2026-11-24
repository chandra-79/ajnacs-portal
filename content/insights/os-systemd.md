---
title: "systemd: Service Management, Unit Files, Timers, and journald"
description: "How systemd works, writing unit files, managing services, creating timers to replace cron, and using journald to query logs with precision. The complete guide for Linux system administrators."
date: 2027-04-16
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 11
format: article
---

systemd is the init system and service manager on many widely used Linux distributions. It coordinates boot and configured units, can schedule periodic tasks, and integrates with journal logging. If you run Linux in production, you interact with systemd constantly — even if you do not realize it. This lesson covers systemd from first principles to advanced unit file authoring.

## What systemd Does

The kernel starts an initial user-space process that becomes PID 1; boot arrangements can include an initramfs before the final host manager runs. On systems using systemd as the host init system, it normally runs as PID 1. Containers and other distributions may use different init arrangements; processes are not all direct children of systemd.

systemd's responsibilities:
- **Parallel service startup**: systemd starts services concurrently when their dependencies are satisfied; the actual boot-time benefit depends on dependencies and workload
- **Dependency management**: services declare what they require and what they should start after
- **Service supervision**: automatically restarts failed services according to configured policies
- **Logging**: can collect configured service stdout/stderr in the journal; output can also be directed elsewhere
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
StartLimitIntervalSec=60s
StartLimitBurst=3

[Service]
Type=simple
User=appuser
Group=appgroup
WorkingDirectory=/opt/myapp
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=-/etc/myapp/environment

## Executable
ExecStartPre=/opt/myapp/scripts/pre-start.sh
ExecStart=/usr/bin/node /opt/myapp/server.js
ExecStop=/opt/myapp/scripts/graceful-stop.sh
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536
MemoryMax=512M
CPUQuota=200%

## Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
StateDirectory=myapp
LogsDirectory=myapp
ReadWritePaths=/var/lib/myapp /var/log/myapp

[Install]
WantedBy=multi-user.target
```

**[Unit] section key directives:**
- `After=`: start after these units (dependency ordering, not requirement)
- `Requires=`: pulls in a dependency; activation failure propagation depends on ordering and unit state
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
## Opens a drop-in editor; the following content belongs in that file.
```

```ini
[Service]
LimitNOFILE=100000
Environment=NGINX_WORKER_PROCESSES=4
```

## systemd Timers: The Modern Cron

Timers are systemd units (`.timer` files) that activate a corresponding `.service` file on a schedule. They integrate scheduling with unit dependencies and the journal. Persistent calendar timers can catch up after inactivity, but do not replay every missed occurrence.

```ini
## /etc/systemd/system/backup.timer
[Unit]
Description=Daily database backup
After=network-online.target

[Timer]
## Calendar-based schedule
OnCalendar=*-*-* 02:30:00

## Catch up when activated if a calendar firing was missed while inactive
Persistent=true
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
journalctl -p err..warning           # between warning and err

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
## MaxRetentionSec=1 month     # max age

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

Declarative units, service supervision, logging, and timers can replace selected custom scripts where the host uses systemd. Validate the effective unit, environment, privileges, and application behavior; a successful manual command does not reproduce every sandbox and resource setting of the managed service. StateDirectory and LogsDirectory create the example state directories with managed ownership, while the application user, executable, scripts, and working directory must already exist.

## Distinguish process state from application readiness

A service being active means something specific to its unit type; it does not necessarily mean the application can serve requests. With Type=simple, systemd considers startup begun without waiting for an application-level readiness signal. Type=notify can communicate readiness when the application correctly implements the notification protocol. A separate health check may still be necessary to verify a user-facing operation.

Ordering is another distinct concept. After=postgresql.service orders startup relative to that unit when both participate in the transaction. It does not prove that a database accepts queries or that a schema migration is complete. Requires= and Wants= affect dependency activation, with different failure behavior. The application should handle transient dependency unavailability according to its contract rather than rely entirely on boot order.

network-online.target also has limits. Its meaning depends on the distribution's network wait service and configuration. It is not a continuous guarantee that DNS, a remote API, or every route remains available. A service that requires a remote endpoint should use bounded retries and expose a useful failure state. Repeatedly restarting the process may not repair the underlying network problem.

## Worked example: a restart policy is a bounded attempt budget

Imagine a hypothetical application that exits immediately because a required configuration file is invalid. The unit allows three starts in a sixty-second interval and waits five seconds between restart attempts. Ignoring small scheduling overhead, attempts can occur at approximately 0,5, and 10 seconds. A further attempt around 15 seconds is rejected by the start-rate limit until the policy permits another start.

The chart shows the three permitted attempt times. It is a synthetic illustration, not an exact timing guarantee: process runtime, scheduler delay, and the configured start-limit behavior affect real timestamps. The key point is that Restart=on-failure does not promise unlimited recovery. A service can remain failed because repeated starts hit the rate limit.

After fixing the configuration, inspect the failure state and reset the rate-limit counters when appropriate before starting the service. Do not reset counters repeatedly without addressing the cause. That simply creates another crash loop and may flood logs or overload a dependency. Record the original exit status and journal evidence before it is lost in repeated attempts.

## Treat unit syntax as its own language

ExecStart is not a general shell command line. Redirection, pipelines, and shell expansion do not behave as they do in an interactive shell unless a shell is explicitly invoked. Prefer a direct executable with explicit arguments. If a shell script is necessary, place it in a reviewed file with a clear interpreter and error handling rather than embedding a complicated expression in the unit.

Keep comments on separate lines in unit files. A trailing hash comment after a setting can be interpreted as part of the value instead of as a comment. Use systemd-analyze verify with the installed version, and inspect warnings as well as the exit result. A directive supported by the latest online manual may be unavailable on an older distribution release.

A drop-in merges with the vendor unit according to directive-specific rules. Some settings replace a value; list-valued settings may accumulate and need an empty assignment before replacement. Inspect systemctl cat and relevant systemctl show properties to confirm the effective unit. Editing a file and running daemon-reload updates the manager's view, but the running process may still need a restart or supported reload to use the new configuration.

## Resource controls and sandboxing need application tests

MemoryMax establishes a cgroup memory limit; behavior under pressure can include reclaim and an out-of-memory kill within the unit's cgroup. It is not a substitute for understanding the application's normal and peak memory use. Set limits using representative workloads and verify failure behavior. A limit that is too low can turn ordinary traffic into repeated service failures.

CPUQuota controls CPU time relative to a single CPU, so 200% allows up to two CPUs' worth of time across available processors. It is not the same as pinning a process to two specific cores. Throttling can increase latency even when the host has idle capacity elsewhere. Measure the workload and inspect cgroup statistics when diagnosing a service that appears slow under a quota.

Filesystem protections constrain what the service can see or modify. ProtectHome=yes makes relevant home paths inaccessible rather than merely read-only. ProtectSystem=strict makes most of the filesystem read-only with documented exceptions, and ReadWritePaths can provide necessary writable locations. Those paths must exist with appropriate ownership. Use StateDirectory, RuntimeDirectory, or related directives where they fit the application's lifecycle.

Sandboxing options are valuable but not complete isolation. Their availability and effect depend on kernel features, privileges, and the unit environment. Test the application's normal behavior and failure paths after enabling them. A hardening score is a diagnostic aid, not proof that the service is secure or that every suggested setting is compatible.

## Timers require business-level completion evidence

Multiple OnCalendar entries are combined; they are not a menu from which systemd chooses one. Select the intended schedule explicitly and inspect the next activation time. Calendar interpretation also depends on time zone and clock behavior. Use the documented calendar-analysis tools to check a schedule before relying on it for a business process.

Persistent=true applies to calendar timers and can trigger a missed activation after the timer becomes active again. It does not replay every missed occurrence as a separate job. If the associated service is already active when the timer elapses, systemd does not start another instance of the same service. Decide whether that behavior matches the task, especially for long-running backups or imports.

A successful timer activation is not a successful backup. The service should return a meaningful exit status and verify the required artifact. Backup assurance also needs restore testing, retention, and access controls. Publish an alert for a missing or failed business outcome rather than merely monitoring whether the timer unit is enabled.

## A disposable service lab

Create a non-production unit that runs a short script and writes a timestamp into a dedicated temporary state directory. Use an unprivileged service account and a path created for the exercise. Validate the unit, start it, inspect its status and journal, then intentionally make the script return a nonzero exit code. Observe the difference between the process exit status, the unit state, and the restart policy.

Restore the script and verify recovery. Add a timer with one schedule, then inspect the next activation and the previous service result. Test a manual start separately from timer activation. Keep the task harmless and idempotent so repeated execution does not create an external side effect. The exercise should teach state transitions, not modify a production service.

Finish by stopping and disabling the test timer and service, removing only the files created for the lab, and reloading the manager configuration. Confirm no test process remains. Record the unit version, expected states, and observed journal entries. This becomes a reusable troubleshooting worksheet for real services: effective configuration, identity, filesystem access, dependency behavior, exit status, resource limits, and application-level readiness.

The practical takeaway is to reason about systemd as a supervisor with explicit state and dependency semantics. It can start, stop, constrain, and observe processes very reliably when those semantics match the application. It cannot infer business success from a running PID or repair an invalid configuration simply by restarting it more often.

## Sources and further reading

- [systemd · Service units](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)
- [systemd · Execution environment](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)
- [systemd · Timers](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html)
