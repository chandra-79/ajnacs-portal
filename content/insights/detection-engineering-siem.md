---
title: "Detection Engineering: Treating Security Alerts Like Software, Because They Are"
description: "The SOC's alert rules are the security program's actual product — and most estates run them as an unversioned pile of vendor defaults. Detections-as-code, the ATT&CK-mapped coverage inventory, testing detections against simulated attacks, and the alert-quality economics."
date: 2029-06-22
tags: ["Security", "Detection Engineering", "Reliability", "Observability", "Platform Engineering"]
format: note
---

Somewhere between the security tooling budget and the breach report sits an unglamorous artifact that determines which one wins: the detection estate — the rules, queries, and analytics that convert the telemetry firehose (the audit logs, the IAM anomalies, the endpoint and network signals this series has been wiring up chapter by chapter) into the alerts a human investigates. And in most organizations it's run the way application code was run in 2005: vendor defaults plus accumulated one-off rules, unversioned, untested, owned by whoever wrote each one, with quality measured — if at all — by volume. **Detection engineering** is the correction: the discipline that treats detections as software, with the full SDLC this series keeps applying to everything else, because the failure modes are identical — silent breakage, untested logic, alert fatigue as the trust-decay spiral, and coverage nobody can state.

## Detections-as-code: the SDLC arrives at the SOC

The structural move: **detection rules live in version control** — expressed in the portable formats where possible (Sigma-class rule specifications compiling to your SIEM's dialect — the vendor-decoupling that makes the rules an asset rather than a platform hostage) — and flow through a

## Make the operating contract explicit

A useful detection rule begins with a behavior and an available observation. For example, a service identity granting itself broader privileges is more concrete than a rule called suspicious activity. Describe which event proves the grant, which identity field identifies the actor and what legitimate administration would look like. A rule cannot detect behavior absent from its input stream, even when its query is syntactically correct.

Treat the event schema as a dependency. A vendor rename, a changed parser or a delayed collector can make an apparently healthy rule stop matching. Keep a small fixture with expected matches and expected nonmatches, and run it whenever the query or schema changes. Then check ingestion freshness independently. Zero alerts during a broken collection period must not look like a quiet environment.

Precision and recall answer different questions. Reviewing alerts can estimate the fraction that were relevant among those reviewed. It cannot reveal every missed attack. Recall requires a known set of cases, such as authorized exercises or carefully constructed test events. Production coverage will still be incomplete. Publish the denominator and limitations instead of presenting a single detection score as protection against all threats.

## Work through an illustrative scenario

A synthetic rule evaluation contains twenty known malicious test sequences and eighty benign ones. The rule alerts on sixteen malicious and eight benign sequences. Recall on this fixture is 16/20 = 80%; precision is 16/24, approximately 66.7%. Four malicious sequences are missed. Changing the rule should be evaluated against both kinds of mistake; suppressing every noisy alert could improve precision while reducing recall.

| Observation | Value (sequences) |
| --- | ---: |
| True alerts | 16 |
| False alerts | 8 |
| Missed malicious cases | 4 |

**Calculation and limits.** Synthetic labeled fixture. Precision is true alerts divided by all alerts; recall is true alerts divided by all malicious fixture cases. This controlled set does not estimate the rate of unknown production attacks.

## Build the evidence worksheet

**Behavior.** State the action sequence of interest and why it violates the protected service boundary.

**Required event.** Identify the source, schema version, timestamps and fields the rule needs in order to match.

**Benign counterexample.** Include authorized administration and maintenance that resemble the behavior but should not page an analyst.

**Expected match.** Label each fixture case before execution and retain the event evidence that supports the label.

**Response action.** Tell the analyst which identity or resource to inspect next without exposing credentials in the alert.

**Collection health.** Monitor arrival delay and missing sources independently of whether any detection fires.

## Rehearse the failure boundary

1. **Rename a parsed field.** Verify that schema regression tests fail before the rule is deployed.

2. **Delay the event stream.** Check that ingestion health reports the delay and the detection window handles late events as designed.

3. **Replay a benign change.** Ensure a documented administrative exception does not accidentally suppress unrelated suspicious activity.

4. **Retest a missed case.** Change one condition at a time and compare precision and recall against the same fixture.

## Sources for the mechanisms

- [OWASP logging guidance](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [NIST secure development framework](https://csrc.nist.gov/pubs/sp/800/218/final)
