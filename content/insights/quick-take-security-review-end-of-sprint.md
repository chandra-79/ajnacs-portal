---
title: "Security Review at the End of the Sprint Is Too Late"
description: "Security review after code is written, tested, and ready to ship catches real problems at the moment when fixing them is most expensive. Here is where in the development cycle security input actually belongs."
date: 2028-10-04
tags: ["DevSecOps", "Security"]
format: article
---

The sprint is done. The feature is built, tested, and ready to ship. The security review request goes in. Three days later, the security reviewer comes back with findings: the authentication implementation has a privilege escalation path, and the API endpoints are missing rate limiting.

Fixing authentication is not a small change. It touches three services. It requires new test cases. It requires a design change. The sprint is blown, the release is delayed, and the team is frustrated.

This is not what the security team was supposed to prevent. This is what late security review reliably produces.

## When security input is actually useful

**At the design stage.** Before a feature is designed, the security implications of different design approaches are relatively cheap to evaluate. An authentication design that introduces a privilege escalation path can be corrected in a whiteboard conversation. The same correction after the code is written requires a rework of the implementation.

Security questions that belong at design time: What data does this feature access? Who should be allowed to do what? How does this feature integrate with the existing authorization model? What are the trust boundaries? Are there any state transitions that could be exploited?

**During development, via automated tools.** SAST, dependency scanning, and secret detection in the CI pipeline provide continuous security feedback as code is written. These tools catch the class of vulnerability that is detectable through static analysis — injection risks, known-vulnerable libraries, hardcoded credentials, insecure random number generation.

**In code review, for design-level security properties.** A code reviewer with security awareness who can evaluate whether the authorization logic is correct, whether error messages leak sensitive information, whether input validation is appropriate — this is the human judgment layer that automated tools cannot replace.

**Post-deployment, via runtime monitoring and penetration testing.** Some vulnerabilities are only detectable in a running system. Regular penetration testing and application-layer monitoring catch what design review and automated tools miss.

## The security review at end-of-sprint as signal

When the end-of-sprint security review is finding significant issues, it is a signal of a security process gap earlier in the cycle. The review is finding design-stage problems at implementation time. The fix is not to speed up the review or make the reviewers more efficient. The fix is to move security input to where it is cheaper.

The end-of-sprint review should be confirming what earlier controls already validated — not discovering problems for the first time.
