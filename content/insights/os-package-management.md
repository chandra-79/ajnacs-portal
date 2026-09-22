---
title: "Linux Package Management: apt, dnf, snap, and Building from Source"
description: "How Linux package managers work, apt and dnf usage patterns, managing PPAs and third-party repositories, snap and flatpak, and when building from source is the right answer."
date: 2026-08-05
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
sudo apt install nginx=1.24.0-1   # specific version
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
## Example: Docker official repo
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
sudo dnf install nginx-1.24.0
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

Production servers should not have packages auto-upgraded unexpectedly. Strategies:

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

**When to avoid snap**: performance-sensitive applications (snaps mount a squashfs image and have measurable startup overhead), or environments where network access is restricted.

## Building from Source

Sometimes a package is unavailable, the packaged version is too old, or you need custom compile flags.

```bash
## General pattern for configure/make projects
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
sudo make install

## CMake projects
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr/local ..
make -j$(nproc)
sudo make install

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
sudo dpkg --verify nginx           # verify installed files match package
sudo rpm --verify nginx            # RHEL equivalent

## List recently installed packages
grep " install " /var/log/dpkg.log | tail -20
rpm -qa --qf "%{installtime:date} %{name}\n" | sort | tail -20
```

Understanding package management at this depth means you can maintain systems that are both current (security patches applied) and stable (critical services pinned), diagnose installation failures, and trace which package introduced a file that is causing a conflict.
