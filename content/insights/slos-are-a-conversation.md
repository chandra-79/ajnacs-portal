---
title: "SLOs are a conversation between engineering and the business, not a monitoring configuration"
description: "An SLO programme that only engineering reads is not an SLO programme. It's a set of internal metrics dressed in SLO terminology."
date: 2026-03-09
tags: ["DevSecOps", "Observability", "Engineering Leadership"]
format: note
---

An SLO programme that only engineering reads is not an SLO programme. It's a set of internal metrics dressed in SLO terminology.

The value of an SLO comes from the shared understanding it creates between engineering and the business: this is what reliability means for this service, this is how we measure it, this is what we commit to, and this is what we do when we're below it. The number is less important than the shared understanding the number represents.

Getting to that shared understanding requires a conversation that most SLO implementations skip. When you say 99.9% availability, does the business understand that means 8.7 hours of downtime per year? Is that acceptable for a payment service? A customer-facing checkout? An internal HR portal? The answers are different, and a blanket "99.9% for everything" reflects nobody's actual reliability requirements.

The other half of the SLO that rarely gets implemented: the error budget policy. When the error budget is depleted, what actually changes? If the answer is "engineering discusses it in the next sprint planning," the error budget concept has no teeth. The value of error budgets is in the pre-agreed trade-off: reliability work takes priority when the budget is gone. That trade-off requires product and leadership agreement, not just engineering metrics.

Set your SLOs by starting with the business impact question, not the technical metrics question. The monitoring configuration comes last.
