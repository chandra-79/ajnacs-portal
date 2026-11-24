---
title: "Linux Package Management: apt, dnf, snap, and Building from Source"
description: "How Linux package managers work, apt and dnf usage patterns, managing PPAs and third-party repositories, snap and flatpak, and when building from source is the right answer."
date: 2027-03-31
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 10
format: article
---

Package management is how software gets onto Linux systems — and how it stays current, consistent, and removable. Understanding how package managers work, not just which commands to run, lets you diagnose installation failures, manage dependency conflicts, and maintain clean systems at scale.

## How Package Management Works

A package is an archive containing software binaries, configuration files, documentation, and metadata — the package name, version, maintainer, and most importantly, its dependencies (other packages it requires to function).

A package manager resolves the full dependency tree automatically: installing `nginx` may pull in `libpcre3`, `zlib1g`, and `libssl3` because nginx requires them at runtime. Without a package manager, you would resolve and install each dependency manually.

The **package repository** is a server that hosts packages and their metadata. The package manager fetches the metadata (a package index), lets you search it, and downloads packages on demand.

## Debian/Ubuntu: apt

`apt` is the high-level interface. `dpkg` is the low-level tool that actually installs `.deb` files.

```bash
## Update package index (always do this before installing)
sudo apt update

## Upgrade installed packages
sudo apt upgrade                  # upgrade with no removals
sudo apt full-upgrade             # upgrade, allowing removals (dist-upgrade)
sudo apt-get dist-upgrade         # older alias for full-upgrade

## Install and remove
sudo apt install nginx
sudo apt install nginx=<available-version>   # select a version shown by apt-cache policy
sudo apt remove nginx             # remove, keep config files
sudo apt purge nginx              # remove including config files
sudo apt autoremove               # remove orphaned dependencies

## Search and inspect
apt search "web server"
apt show nginx                    # detailed package info
apt list --installed              # all installed packages
apt list --installed | grep python
dpkg -l nginx                     # dpkg status of a package
dpkg -L nginx                     # files installed by a package
dpkg -S /usr/sbin/nginx           # which package owns a file

## Hold a package at its current version (prevent upgrades)
sudo apt-mark hold nginx
sudo apt-mark unhold nginx
apt-mark showhold                 # list held packages
```

## Managing Repositories

```bash
## View configured repos
cat /etc/apt/sources.list
ls /etc/apt/sources.list.d/

## Add a PPA (Ubuntu-specific)
sudo add-apt-repository ppa:ondrej/php
sudo apt update

## Add a third-party repo (modern way: signed-by)
## Historical repository syntax illustration, not a current install recipe.
## Check upstream instructions for the actual distribution and architecture.
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list

sudo apt update
sudo apt install docker-ce

## Remove a repository
sudo add-apt-repository --remove ppa:ondrej/php
sudo rm /etc/apt/sources.list.d/docker.list
```

## RHEL/CentOS/Fedora: dnf (and the older yum)

```bash
## Update
sudo dnf check-update
sudo dnf upgrade

## Install and remove
sudo dnf install nginx
sudo dnf install nginx-<available-version>  # illustrative placeholder
sudo dnf remove nginx
sudo dnf autoremove

## Search and inspect
dnf search nginx
dnf info nginx
dnf list installed
dnf provides /usr/sbin/nginx      # which package provides a file
rpm -ql nginx                     # files installed by package
rpm -qf /usr/sbin/nginx           # which package owns a file

## Repository management
dnf repolist                      # list enabled repos
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf config-manager --disable repo-name

## Groups: install multiple related packages
dnf group list
sudo dnf group install "Development Tools"
```

## Package Pinning and Locking

Production updates need an explicit policy for compatibility, security response, restarts, and recovery. Holds and automation are tools within that policy:

```bash
## apt: hold individual packages
sudo apt-mark hold kubernetes-cni kubelet kubeadm kubectl

## apt: unattended-upgrades for security patches only
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
## Configure: /etc/apt/apt.conf.d/50unattended-upgrades
## Allow: "${distro_id}:${distro_codename}-security";
## Disallow: "${distro_id}:${distro_codename}";  (no general upgrades)

## dnf: version locking plugin
sudo dnf install python3-dnf-plugin-versionlock
sudo dnf versionlock add nginx
sudo dnf versionlock list
```

## snap and flatpak: Universal Packages

**snap** (Canonical/Ubuntu): self-contained packages with bundled dependencies that run in a sandbox.

```bash
sudo snap install code --classic   # VS Code
sudo snap install kubectl --classic
snap list                           # installed snaps
snap refresh                        # update all snaps
snap info code                      # package details

## Snaps run confined by default
## --classic flag disables confinement (full system access)
## --devmode for development, --jailmode for strict confinement
```

**When to use snap**: when the upstream provides a snap (often more current than distro packages), or when you need multiple versions of a tool side-by-side.

**What to assess**: startup behaviour for the actual application, confinement requirements, update policy, and availability in restricted networks. Measure rather than assuming every snap has unsuitable performance.

## Building from Source

Sometimes a package is unavailable, the packaged version is too old, or you need custom compile flags.

```bash
## Historical configure/make syntax illustration.
## Do not install this old example over a managed production package.
## Use a currently supported release and isolated build prefix.
sudo apt install build-essential   # gcc, g++, make, etc.
sudo apt install autoconf automake libtool

wget https://nginx.org/download/nginx-1.26.0.tar.gz
tar -xzf nginx-1.26.0.tar.gz
cd nginx-1.26.0

./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib64/nginx/modules \
    --with-http_ssl_module \
    --with-http_v2_module

make -j$(nproc)          # build using all CPU cores
## Install only into an isolated staging prefix after verification
## make DESTDIR="$staging_dir" install

## CMake projects
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr/local ..
make -j$(nproc)
## Install only into an isolated staging prefix after verification
## make DESTDIR="$staging_dir" install

## Python packages (use virtual environments — never system pip)
python3 -m venv /opt/myapp/venv
source /opt/myapp/venv/bin/activate
pip install -r requirements.txt

## Go binaries
go build -o /usr/local/bin/mytool ./cmd/mytool
```

## Practical: Maintaining a Clean System

```bash
## Disk space used by package caches
du -sh /var/cache/apt/archives/
du -sh /var/cache/dnf/

## Clean package caches
sudo apt clean          # remove all cached .deb files
sudo apt autoclean      # remove only outdated cached .debs
sudo dnf clean all      # remove all cached data

## Find large installed packages
dpkg-query --show --showformat='${Package} ${Installed-Size}\n' | \
    sort -k2 -rn | head -20 | awk '{printf "%-40s %6.1f MB\n", $1, $2/1024}'

## Check package integrity
sudo dpkg --verify nginx           # check supported stored file metadata/checksums; not a complete security audit
sudo rpm --verify nginx            # RHEL equivalent

## List recently installed packages
grep " install " /var/log/dpkg.log | tail -20
rpm -qa --qf "%{installtime:date} %{name}\n" | sort | tail -20
```

Understanding package management at this depth means you can maintain systems that are both current (security patches applied) and stable (critical services pinned), diagnose installation failures, and trace which package introduced a file that is causing a conflict.

## Trust, compatibility, and freshness are separate checks

Repository authentication establishes that metadata came through a trusted signing chain and that downloaded content matches it. It does not establish that the software is free of vulnerabilities or that it is compatible with your application. Adding a repository therefore expands a trust relationship, not merely a list of download locations.

Before adding one, record the owner, distribution release, architecture, signing-key source, update policy, and removal procedure. Restrict the signing key to the intended repository where the package manager supports that scope. Do not solve an expired or mismatched signature by globally disabling verification. Investigate the clock, repository configuration, and documented key rotation instead.

Package scripts may run with administrative privileges during installation and removal. Review the provider and operational requirements accordingly. A package name that resembles a familiar upstream project is not sufficient provenance. Prefer distribution or upstream documentation and verify that the instructions apply to the actual OS release rather than copying a command from an unrelated system.

## Build a rollout plan around evidence

Imagine a fictional fleet of 100 identical application hosts. A proposed staged rollout updates five canary hosts, then twenty more, then the remaining seventy-five. The chart shows those batch sizes, not an observed success rate. Advancing requires evidence from the current stage: service startup, representative requests, resource use, and any required background job cycle.

A five-host canary is not automatically representative. Include the configurations and traffic classes that matter, such as a host using a particular driver or a worker handling larger files. Define the observation window according to the failure you want to detect. A ten-minute HTTP check cannot establish that a nightly batch remains compatible.

Record the package version, repository origin, dependency changes, and restart or reboot requirement for each stage. A package installation can succeed while the running service still uses an older library until restarted. Conversely, maintainer scripts may restart a service immediately. The deployment plan needs to account for both behaviours and preserve enough capacity during disruption.

## Pinning needs an owner and an expiry

A version hold can prevent an unexpected upgrade, but it can also prevent an important security fix. Treat it as a temporary compatibility decision with a named owner, reason, review date, and removal condition. A list of permanent unexplained holds is a hidden maintenance backlog.

Version availability is also part of reproducibility. Specifying an old version does not ensure that a moving repository still serves it or its dependencies. For controlled builds, use an approved snapshot or artifact retention strategy, record repository metadata, and retain the resulting image or package set. Balance reproducibility with a deliberate update process so a reproducible build does not become a permanently vulnerable build.

Automated security updates can be appropriate when accompanied by tested restart policy, monitoring, and recovery. “Never update automatically” and “always update immediately” are both too broad. Decide by service criticality, patch urgency, compatibility risk, and operational capability. The purpose of a policy is to make the tradeoff explicit and consistently executed.

## Understand what removal and rollback mean

Removing a package does not necessarily remove application data, user-created configuration, credentials, or external resources. Purging package-managed configuration can have a larger effect than removal, but it is not a universal data-erasure operation. Read the package's behaviour and take a verified backup before a consequential change.

Downgrading a binary may not reverse a database or configuration migration performed during an upgrade. A rollback plan should identify the state format and whether the previous version can still read it. Sometimes recovery means restoring a compatible backup or deploying a forward fix. A package manager's transaction history is useful evidence, not a guarantee that all application state can be undone.

Source builds create similar obligations. Installing directly over distribution-managed paths can leave the package database describing files that no longer match its packages. Build in an isolated environment, verify the source artifact, use a dedicated prefix or produce a package, and record compiler and dependency versions. Keep an uninstall or replacement path and a process for receiving upstream fixes.

## A disposable-VM maintenance lab

Create a VM from a documented image and snapshot it if the environment supports snapshots. Choose a harmless package already present in the distribution repository. Inspect its installed files, candidate version, dependencies, and origin before changing anything. Save the inspection output with secrets and unrelated host details excluded.

Run the package manager's simulation or transaction-preview mode and read the proposed installs, removals, and held changes. A simulation can reveal dependency decisions but does not execute every maintainer script or prove runtime compatibility. Perform the change in the disposable VM, run a representative function, and inspect service status and logs.

Next, remove the package and identify which files remain. Reinstall it and verify whether configuration and data were preserved. This teaches the difference between package ownership and application state. Do not use a production database package for the first exercise; the goal is to understand lifecycle semantics with negligible data risk.

Finally, test automation's interpretation of exit codes. Some inspection commands use a nonzero code for a normal informational result. For example, DNF's `check-update` uses a distinct status when updates are available. A shell script that treats every nonzero status as a repository failure will report the wrong condition. Consult the command reference for the installed tool family and version.

## Keep the maintenance record small and useful

For each change, retain the reason, affected package set, source, compatibility evidence, restart action, and recovery path. Include held packages and the next review date. This makes routine maintenance auditable without producing a long narrative for every update. The record should help an engineer answer what changed and how to recover, not merely prove that a command ran.

## Further reading and source boundaries

- [Debian: APT archive authentication](https://manpages.debian.org/bookworm/apt/apt-secure.8.en.html)
- [Debian: apt-get operations and simulation](https://manpages.debian.org/bookworm/apt/apt-get.8.en.html)
- [DNF command reference](https://dnf.readthedocs.io/en/stable/command_ref.html)
- [Snapcraft: confinement](https://snapcraft.io/docs/snap-confinement)
