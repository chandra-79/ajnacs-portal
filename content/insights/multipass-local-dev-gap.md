---
title: "The gap between local development and cloud deployment is wider than Docker makes it appear"
description: "Docker is an excellent tool for application-layer portability.…"
date: 2029-05-11
tags: ["Developer Tools", "Infrastructure", "Cloud Architecture"]
format: note
derived: true
---

Docker is an excellent tool for application-layer portability. It reliably closes the gap between "it runs locally" and "it runs in a container in the cloud." The gap it doesn't close is the gap between a container and a full Ubuntu virtual machine.

For infrastructure automation — cloud-init scripts, Ansible playbooks, bootstrap scripts, systemd service configuration — the OS environment matters. systemd unit files behave differently in a container than on a real host. cloud-init runs at VM boot and has specific expectations about the system state it encounters. Kernel parameters and module availability differ. Network interface naming conventions and DNS resolution in cloud VPC networks don't replicate inside a container.

Rendering cloud-init YAML in a container can validate syntax, but it does not establish the resulting boot-time state on a target Ubuntu VM.

Multipass solves this specifically. It provisions a full Ubuntu virtual machine — real systemd, real kernel, real cloud-init support — with launch time depending on image availability, host resources, and configuration. Cloud-init injection is a command-line flag. The VM is disposable and fast to recreate.

The discipline of testing infrastructure automation on an environment that matches the deployment target catches a category of issues — systemd unit failures, cloud-init ordering problems, network configuration edge cases — that a typical application-container test may not exercise. Choose the environment according to the behaviour being tested; some infrastructure checks need a VM, while cloud-specific behaviour still needs separate validation.

## Build a parity checklist around the operating system

A VM is valuable when the test depends on host behaviour: boot ordering, service users, package installation, filesystem permissions, or kernel interfaces. Containers remain useful for many application tests. Neither choice automatically reproduces a cloud environment's identity, network policy, managed storage, or regional failure modes.

Consider a fictional bootstrap with eight required checks. Six concern local operating-system state: the service account, package presence, directory permissions, process startup, log output, and restart behaviour. Two concern cloud-specific identity and storage access. A local VM can exercise the first six under the chosen image, while the other two need an isolated cloud test or a clearly documented substitute. The chart shows test scope, not a claim that 75% of deployment risk is covered.

Version the bootstrap and run it on a clean VM. Reboot the VM, verify that the service starts without an interactive shell, and run the setup a second time to test whether it behaves safely when resources already exist. Inject a missing configuration value and confirm that the failure is understandable and does not leave a partially privileged service running.

Record the image version, architecture, CPU and memory allocation, and expected output. A successful run on an ARM laptop does not establish compatibility with every x86 package or cloud image. Keep those differences in the validation plan.

The result is a repeatable test of declared assumptions. It is stronger than “works on my laptop” because another engineer can reconstruct the same starting state and see which parts of the deployment remain untested.

## Further reading and source boundaries

- [Canonical Multipass documentation](https://canonical.com/multipass/docs/latest/)
- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
