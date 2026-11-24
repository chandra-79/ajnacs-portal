---
title: "Define the requirement before choosing the engineering tool"
description: "Map the actual constraint, test a representative path and compare concrete alternatives at the same level of detail."
date: 2028-12-20
tags: ["Engineering Leadership", "Architecture"]
format: article
derived: true
---

A recurring failure pattern is that a tool is evaluated, selected through a structured process, adopted with engineering investment, and then delivers minimal value or requires replacement within two years. The tool was not the problem. The problem definition was.

Tool selection processes tend to optimise for completeness of evaluation. They compare feature sets, pricing, vendor stability, integration ecosystem, and community size. These are legitimate criteria for tools where the requirement is clear. They miss the more fundamental question: what specific, measurable outcome are we trying to produce, and is that outcome actually produced by this class of tool?

Service mesh adoption is a representative example. A team identifies a security concern about inter-service communication and selects a service mesh to address it. After six months of implementation, the service mesh is running and adding measurable operational complexity. The security concern it was intended to address was actually a gap in API gateway authentication policy that the mesh does not directly fix. The root problem is still present; the team now also owns the mesh.

The failure was not the tool selection. It was the requirement definition. The specific security concern should have been articulated precisely — what threat, what attack surface, what data in scope. With that precision, the solution might have been mutual TLS at the gateway layer, a policy change in the identity provider, or network segmentation — all simpler than a full service mesh.

Requirements-first tool selection: define the outcome before opening a vendor comparison. A clear problem makes the trade-offs testable. A vague problem makes even a careful product comparison difficult to interpret.

## Write the threat or constraint before naming the product

For a security-related purchase, identify the actor, entry point, protected resource and required behavior. “Secure service communication” can mean authenticating a caller, encrypting traffic, authorizing a business action or limiting network reachability. These controls are related but not interchangeable. A product that supplies mutual TLS does not automatically decide whether an authenticated caller is allowed to change a particular customer's record.

Draw the request path and mark each trust boundary. Identify where identity is established, where authorization is evaluated and how the decision is recorded. Then ask which observed gap the proposed tool closes. This avoids comparing products whose feature names sound similar but operate at different layers.

## A fictional requirements-coverage exercise

Suppose a team lists eight required controls for a new integration. A proposed platform directly implements five. Two require application changes and one remains unresolved. The chart compares five covered requirements with three that need further work. It does not assign equal risk to every requirement or imply that 62.5% coverage is acceptable. A single missing authorization control may block release regardless of the aggregate count.

For each requirement, record evidence rather than a vendor checkbox. Can the team demonstrate a rejected unauthorized request? Is the audit record complete enough to reconstruct a decision? What happens when the policy service is unavailable? Keep a separate decision for accepting, mitigating or removing the remaining risk. Do not hide an unresolved control inside an overall score.

## Build the smallest proof that answers the question

Create a test environment with one legitimate request and one request that should fail. Include a failure of the dependency that supplies identity or policy. Record the expected outcome before running the test. If the proposed control is at the gateway, test whether an alternate path can bypass it. If it is inside a service, test whether every relevant handler uses it.

Measure operational cost as well. Who updates policy, rotates credentials, diagnoses failures and reviews access? A product can reduce application work while adding a new central service that needs careful operation. That may be a worthwhile trade-off, but it should appear in the decision rather than emerge after rollout.

## Keep alternatives at the same level of specificity

Compare the proposed product with a concrete smaller change, not with an imaginary zero-cost status quo. The alternative might be fixing an authorization rule, adding a missing validation check or adopting a managed identity capability. State the migration effort and limits of each. A familiar tool is not automatically simpler if the team must invent substantial surrounding behavior to use it safely.

Conclude with a bounded recommendation: use this capability for these request paths, retain these application controls and revisit the decision if these conditions change. The right answer is not always obvious, even when the problem is clear. A precise requirement makes uncertainty visible and allows a focused experiment to reduce it.

## Sources and further reading

- [AWS · Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
