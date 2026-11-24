---
title: "Security Review: Ask Design Questions Before the Release Gate"
description: "Move threat and trust-boundary decisions earlier while retaining implementation tests and final validation."
date: 2029-07-02
tags: ["DevSecOps", "Security"]
format: note
derived: true
---

A late security review can still find an important defect and prevent a harmful release. Its limitation is that a design correction may now require substantial rework. Ask trust-boundary questions while the design is changeable, then retain implementation and runtime checks for properties that cannot be established from a diagram.

## Follow a password-reset feature through its decisions

Before implementation, identify the legitimate actor, the recovery channel, the reset-token lifecycle and the response shown for an unknown account. Decide how the feature avoids exposing account existence, prevents arbitrary redirection and handles repeated use of a reset token. These are application requirements, not merely scanner configuration.

Use a hypothetical acceptance set with twelve cases. Nine pass, two fail because an expired token is accepted and a previously used token can be replayed, and one remains unclear because the team has not defined its policy for existing sessions after a password reset. The pass fraction is 75%, but the two failures and the undefined policy block acceptance under this example. They are not made harmless by nine successful happy paths.

## Build a testable security worksheet

For each case, record the expected actor, token state, action, expected result and evidence. Use disposable accounts and synthetic recovery messages. Test an unused valid token, an expired token, a second use of the same token and a request attempting to change the target account. Keep tokens out of logs and screenshots shared outside the test boundary.

For the unresolved session policy, involve the appropriate product and security owners. Determine whether the user can revoke other sessions and what additional action is required after suspected compromise. Then implement and test the agreed behavior. A test cannot establish correctness when the intended rule is undefined.

## Connect review stages instead of replacing them

Design review identifies the required properties. Code review checks how those properties are implemented. Automated tests preserve regression evidence, and a controlled end-to-end test confirms that the deployed recovery flow uses the intended settings and dependencies. Static analysis can detect selected unsafe patterns but cannot infer every business requirement.

Record a finding with its violated requirement, affected path, remediation owner and retest result. If a serious issue is found at the release gate, address the immediate risk and improve the earlier review question. Do not treat earlier involvement as a reason to remove final validation. The useful outcome is a chain of evidence from the security requirement to the running behavior, with clear responsibility when that chain has a gap.

| Observation | Value (cases) |
| --- | ---: |
| Passed | 9 |
| Failed token checks | 2 |
| Policy unresolved | 1 |

**Figure method.** Synthetic twelve-case reset-flow suite: 9/12=75% pass, two failed token cases and one undefined session-policy case. Counts do not establish overall application security.

## Primary references

- [OWASP password recovery](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)
