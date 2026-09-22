---
title: "Managed Services Eliminate Operational Burden — They Don't Eliminate Operational Responsibility"
description: "Choosing RDS over self-managed PostgreSQL removes the database administration work. It does not remove the need to understand database performance, connection management, or failover behavior."
date: 2028-06-16
tags: ["Cloud Architecture", "Infrastructure"]
format: article
---

The appeal of managed services is obvious: AWS or Azure handles patching, backups, hardware failures, and OS maintenance, while your team focuses on the application. For most teams, this is the correct trade.

The trap is assuming that "managed" means "operated for you." It does not.

## What managed services handle

RDS handles: hardware provisioning, operating system maintenance, database engine patching (on a schedule you configure), automated backups (within a retention window you configure), and storage expansion. In a Multi-AZ configuration, it handles automatic failover to a standby replica.

This is genuinely valuable. The self-managed alternative requires several hours per month of maintenance and a level of infrastructure expertise that many application teams do not have.

## What managed services do not handle

**Query performance.** RDS does not write your queries. It does not create your indexes. It does not tell you that your application is running 10,000 N+1 queries per request. Performance Engineering Responsibility is entirely with the application team.

**Connection pool management.** RDS has connection limits that vary by instance size. An application that opens a new database connection per request and never closes them (no connection pool) will exhaust the connection limit on any RDS instance. This is an application architecture problem that RDS cannot solve. RDS Proxy helps — but you have to configure it.

**Failover recovery time.** RDS Multi-AZ failover is automatic. It takes 60–120 seconds. During those 60–120 seconds, connections fail. An application that does not handle connection failure gracefully — with retries, backoff, and graceful degradation — will have a full outage during a failover that RDS considers a successful HA event.

**Configuration tuning.** RDS provides sane defaults. They are not necessarily the correct settings for your workload. Parameter groups allow configuration changes, but they require the same understanding of database tuning that self-managed PostgreSQL would require.

**Data modeling.** No managed service makes a bad data model good.

## The right mental model

Managed services are infrastructure partnerships, not infrastructure outsourcing. The cloud provider handles the physical and operational infrastructure. Your team handles everything that makes the service useful for your specific workload.

This is a good trade. Just go in with accurate expectations about what the word "managed" covers.
