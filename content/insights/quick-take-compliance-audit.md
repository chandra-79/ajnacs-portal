---
title: "The Compliance Audit Nobody Prepared For Is Actually an Architecture Review"
description: "SOC 2 and ISO 27001 audits expose gaps in access control, logging, change management, and encryption. These are architecture decisions. Treating the audit as a compliance exercise misses the point."
date: 2028-08-25
tags: ["DevSecOps", "Engineering Leadership"]
format: article
---

The compliance audit arrives. Nobody feels ready. The frantic documentation sprint begins — policies are written the week before, screenshots are collected the day before, access reviews are done for the first time in months.

The audit passes, narrowly or comfortably, and everyone breathes out. The lesson learned is: we need to be more prepared next time.

The deeper lesson, which fewer teams draw, is that everything the audit exposed was an architecture and process gap that existed long before the audit.

## What audits actually surface

SOC 2 Type II, ISO 27001, and PCI DSS audits have different scopes but similar blind spots for under-prepared engineering organizations:

**Access control gaps.** Former employees with active credentials. Engineers with production database access who have not needed it in 18 months. Service accounts shared between multiple applications. These are access control architecture problems, not documentation problems.

**Logging gaps.** No audit trail of who accessed what data. Logs that exist but are not retained for the required period. Logs that are stored where they can be modified or deleted by the people they are supposed to audit. These are logging architecture problems.

**Change management gaps.** Infrastructure changes deployed without approval records. Deployments without change tickets. No traceability from a code change to a production deployment to a documented reason. These are CI/CD and process architecture problems.

**Encryption gaps.** Data at rest not encrypted. Data in transit encrypted in some places but not others. Encryption keys stored alongside the data they protect. Architecture problems.

## The productive reframe

Rather than treating an audit as a compliance obligation, treat it as a requirements document for your security architecture.

An SOC 2 audit requires: access reviews on a defined schedule, MFA for all users, encryption at rest and in transit, logging of privileged actions, incident response procedures, and change management records.

Each of these is an engineering capability. The org that builds these capabilities builds a more secure and more operable system. The compliance certification is a byproduct.

The audit that runs against systems with these capabilities built in does not require a sprint of documentation work. It requires showing the auditor that the systems work the way they are supposed to.

That is a much more comfortable audit to have.
