---
title: "Monitoring tells you something is wrong. Observability tells you why."
description: "Monitoring tells you something is wrong. Observability tells you why."
date: 2029-02-16
tags: ["Observability", "Engineering Leadership", "Cloud Architecture"]
format: note
derived: true
---

Monitoring tells you something is wrong. Observability tells you why.

Most organizations have monitoring. Fewer have observability.

Monitoring: dashboards, alerts, the CPU graph that goes red at 3am.
Observability: the ability to ask arbitrary questions about your system's behavior without deploying new code.

The difference matters most when:
- The issue is intermittent and doesn't reproduce in staging
- The failure is in a dependency you don't own
- The system is behaving unexpectedly but no alerts fired

Investing in observability — structured logs, distributed tracing, carefully selected metric dimensions and correlated event context — pays back every time something goes wrong in a way nobody predicted.

Which is every interesting production incident.

## Test the question your telemetry can answer

Monitoring can reveal unexpected failures through user-visible signals, and observability does not guarantee an explanation for every event. Treat them as complementary practices. In a hypothetical ten-request diagnostic fixture, logs explain seven failures and correlated traces explain two more; one remains unresolved. The useful result is nine explained cases with one explicit blind spot, not a claim of complete visibility.

Write down the failing operation, its correlation key, the evidence source and a competing hypothesis. Reproduce the unresolved case with non-sensitive inputs, then add only the signal needed to distinguish the alternatives. Check sampling and collection loss before concluding that an absent event never happened. The exercise measures diagnostic coverage for its chosen cases, not the system's general reliability.

| Observation | Value (cases) |
| --- | ---: |
| Explained by logs | 7 |
| Added by traces | 2 |
| Unresolved | 1 |

**Figure method.** Synthetic ten-case fixture: 7+2=9 explained, one unresolved. Categories describe this exercise only and do not compare telemetry products universally.

## Further reading

- [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
