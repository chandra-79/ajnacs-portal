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

Access reviews, authentication controls, protected data, audit evidence, incident response and change management can support assurance objectives. The applicable SOC 2 criteria, scope and control design must be established for the engagement; this is not a universal prescribed technology checklist.

Each of these is an engineering capability. The org that builds these capabilities builds a more secure and more operable system. The compliance certification is a byproduct.

The audit that runs against systems with these capabilities built in does not require a sprint of documentation work. It requires showing the auditor that the systems work the way they are supposed to.

That is a much more comfortable audit to have.

## Trace a control from its objective to its evidence

Different assurance frameworks have different scopes, criteria and reporting rules. Do not convert one familiar checklist into a universal statement that every audit requires the same technologies. Agree the applicable criteria, system boundary, review period and evidence expectations with the responsible assurance specialists. Engineering can then build evidence around the actual control objective.

For an illustrative access review, the population contains 80 active identities. Seventy-two reviews are fully closed with required actions verified, five await an owner decision and three have a removal decision awaiting execution. Thus 75 identities have a decision, but only 72/80, or 90%, have a closed workflow. The three removals need execution and verification, and the five pending decisions need accountable follow-up. These disjoint states describe workflow completion, not compliance with a named standard.

Create a worksheet with the control objective, population source, review frequency, responsible owner, evidence artifact and exception handling. Reconcile the population against the actual identity provider or resource inventory. A perfectly reviewed spreadsheet that omits a production account has incomplete scope. Preserve timestamps and provenance so evidence can be tied to the period being evaluated.

## Test the control, not just the screenshot

Pick a disposable account and remove its privileged role through the documented process. Verify the access outcome, record when the change takes effect and confirm the audit event is retained. A screenshot of a policy setting does not establish that it was applied to every relevant resource or operated throughout a review period. Automated evidence collection can improve consistency, but collectors need their own access boundaries, failure monitoring and change history.

Map findings to causes: a missing owner, an incomplete inventory, a broken workflow or insufficient evidence. Some findings are documentation gaps, others are control-design or operating failures; treating all of them as architecture failures obscures the corrective action. Avoid manufacturing evidence after the fact. If a control did not operate, record the gap and remediation honestly.

The useful engineering output is a repeatable control with explainable scope and observable operation. Auditors and assurance reviewers determine whether that evidence meets the applicable criteria. Passing an assessment is not a guarantee against incidents, while a sustainable evidence process can make both routine operations and future reviews less disruptive.

| Observation | Value (identities) |
| --- | ---: |
| Closed reviews | 72 |
| Awaiting decision | 5 |
| Removal required | 3 |

**Figure method.** Synthetic 80-identity review: 72 closed, 5 awaiting decision, 3 awaiting removal. Closed share=72/80=90%; decisions made=75/80=93.75%. Disjoint workflow states do not certify compliance.

## Further reading

- [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [S3 Object Lock mechanics](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)
