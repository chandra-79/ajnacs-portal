---
title: "The gap between local development and cloud deployment is wider than Docker makes it appear"
description: "Docker is an excellent tool for application-layer portability.…"
date: 2026-05-25
tags: ["Developer Tools", "Infrastructure", "Cloud Architecture"]
format: note
derived: true
---

Docker is an excellent tool for application-layer portability. It reliably closes the gap between "it runs locally" and "it runs in a container in the cloud." The gap it doesn't close is the gap between a container and a full Ubuntu virtual machine.

For infrastructure automation — cloud-init scripts, Ansible playbooks, bootstrap scripts, systemd service configuration — the OS environment matters. systemd unit files behave differently in a container than on a real host. cloud-init runs at VM boot and has specific expectations about the system state it encounters. Kernel parameters and module availability differ. Network interface naming conventions and DNS resolution in cloud VPC networks don't replicate inside a container.

The engineers who write cloud-init scripts and test them in Docker containers are testing their ability to render YAML. They're not testing whether the rendered YAML produces the expected system state on a real Ubuntu instance.

Multipass solves this specifically. It provisions a full Ubuntu virtual machine — real systemd, real kernel, real cloud-init support — in under 30 seconds. Cloud-init injection is a command-line flag. The VM is disposable and fast to recreate.

The discipline of testing infrastructure automation on an environment that matches the deployment target catches a category of issues — systemd unit failures, cloud-init ordering problems, network configuration edge cases — that container-based testing will never surface. For application code, containers are sufficient. For infrastructure code, use a real VM.
