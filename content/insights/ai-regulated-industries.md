---
title: "Deploying AI in Regulated Industries: Healthcare, Finance, and the Compliance Minefield"
description: "AI deployment in healthcare and financial services faces regulatory requirements that don't apply to consumer applications. Understanding the constraints before starting is cheaper than discovering them after deployment."
date: 2027-11-12
tags: ["AI & MLOps", "Enterprise AI", "Architecture"]
format: article
---

Regulated AI delivery begins with a precise description of the function, the data and the decision it influences. A tool that formats an internal report is different from a system that recommends treatment or influences access to credit, even if both use the same language model. The engineering plan should reflect that difference before choosing infrastructure.

This guide describes a practical review process rather than declaring any product compliant. Applicability depends on jurisdiction, organizational role, intended use and implementation. The primary references below provide starting points for specialist review, and their current scope should be checked when a project makes a release decision.

## Begin with an applicability record

Write down who uses the system, whose information it processes, what output it produces and what action follows. Identify whether the output is optional advice, a draft reviewed before use, a ranking that changes access to a service, or an automated decision. A human nominally present in the workflow does not by itself establish meaningful oversight.

Separate binding legal requirements, supervisory guidance, contractual commitments and internal policies. They can all influence design, but they are not interchangeable. Record the exact source and the reason it applies. This avoids a common failure in technical plans: copying a regulation's name into a checklist without identifying the obligation or responsible owner.

The applicability record should have an update trigger. Changing a report assistant into a recommendation engine, adding a new user population or sending data to a different processor can change the analysis. A one-time approval for a model vendor cannot cover every future use of that vendor's products.

## Healthcare: data handling and product function are distinct

HIPAA applicability is tied to covered entities, business associates and protected health information in the relevant relationship; it does not apply to every health-related application merely because it contains medical language. HHS cloud guidance explains that a cloud provider processing or maintaining electronic PHI on behalf of a covered entity or business associate can itself be a business associate, including when it holds encrypted data without the key.

For an applicable workflow, review the agreement, permitted services, data flows and safeguards together. A business associate agreement is important but is not a blanket certification of every configuration. Avoid declaring a whole vendor universally eligible or ineligible: coverage can depend on the service, account terms, feature and deployment arrangement.

Device regulation is a separate question. FDA's clinical decision support guidance distinguishes software functions excluded from the device definition from functions that remain subject to device oversight. The intended function and the statutory criteria matter. A simple slogan such as "information is unregulated, decisions are regulated" is too coarse to classify a real product. Use the current FDA guidance and appropriate regulatory expertise for that determination.

Engineering can support the review by making functionality explicit. Document whether the system analyzes medical images, gives patient-specific recommendations, presents source evidence and allows the intended professional to independently review the basis. Do not change product wording to evade the substance of the function; the actual behavior must match the reviewed intended use.

## Financial services: use the current guidance and its scope

The US banking agencies issued revised model risk management guidance in April 2026, superseding SR 11-7. The current guidance is risk-based and expected to be most relevant to banking organizations with more than $30 billion in assets. Its definition and scope matter: it expressly excludes generative and agentic AI from that guidance's scope while stating that broader risk management and governance should guide appropriate controls for tools outside it.

That exclusion does not mean a bank can deploy an LLM without controls, nor does it make every LLM subject to the older guidance by default. The institution needs a reviewed governance approach appropriate to the actual use, alongside other applicable obligations. Preserve the distinction between supervisory guidance and enforceable legal requirements when explaining the decision to engineers.

For consequential financial decisions, a post-hoc explanation tool is not automatically a valid reason-giving mechanism. Feature-attribution methods describe aspects of model behavior under their assumptions; they do not independently establish that a decision is accurate, lawful or adequately explained. The business decision rule, data lineage and applicable notice requirements need coordinated review.

## Worked example: evidence readiness before a pilot

Consider a hypothetical program assessing 40 AI workflows across a regulated organization. Sixteen have a documented intended use, mapped data flow and accepted validation plan. Twelve lack sufficient evaluation evidence, eight depend on unresolved vendor terms and four have no confirmed accountable owner. The chart shows these four exclusive categories, which sum to 40.

The ready-for-pilot proportion is 16/40, or 40%. If eight of the evaluation gaps are resolved and all other conditions remain satisfied, it becomes 24/40, or 60%, an increase of twenty percentage points. This is a synthetic planning exercise, not a compliance score or an observation from a customer engagement. Readiness for a limited pilot does not establish readiness for unrestricted production.

The status rules should be explicit. A workflow with both missing evidence and unresolved vendor terms must either receive a documented primary blocker or appear in a separate multi-label analysis. Otherwise category totals become misleading. Keep the underlying findings even when the chart uses one category per workflow for readability.

Use the example to plan work, not to reward approvals. A team that removes difficult workflows from the denominator can make the percentage rise without reducing risk. Record withdrawals and rejected proposals separately, with reasons. Review age and criticality alongside counts so a small number of consequential unresolved workflows remains visible.

## Design an evidence package that can be challenged

The package should identify intended use, excluded uses, relevant populations, data sources, transformation logic, model and prompt versions, evaluation results and known limitations. For a retrieval system, include the document snapshot and access-control design. For a learned classifier, include the label definition, sampling process and time boundaries used for training and evaluation.

Independent challenge means a reviewer can question assumptions and request changes. It does not require inventing a separate bureaucracy for every low-impact prototype. Review depth should reflect consequence and uncertainty. A synthetic-data experiment may need a lightweight technical review, while a system affecting patients or customers needs domain expertise and a stronger validation record.

State what the evaluation does not establish. A retrospective test can identify errors but may not reveal how professionals behave when the tool is available. A simulated workflow can exercise failure handling without proving real-world effectiveness. Pilot design should connect those gaps to the next stage of evidence instead of presenting all testing as equivalent assurance.

## Validate the complete workflow

Measure the outcome after the human and software steps, not only the model's output. Reviewers can miss plausible errors or become over-reliant on the recommendation. A workflow that appears safer because it contains a review checkbox may still fail if the reviewer lacks evidence, time or authority to disagree.

Include ordinary cases, boundary conditions, missing information and known failure scenarios. Evaluate relevant subgroups where lawful and appropriate, with denominators and uncertainty. Do not interpret a small subgroup's zero observed errors as a guarantee. Record disagreements between reviewers because they can reveal an unclear task definition rather than a model defect.

Test access and effect controls directly. Attempt to retrieve a record outside the permitted account, replay an expired approval and submit a validly formatted but unauthorized action. These are service-level tests that should hold even if the model proposes an incorrect operation. A good prompt is not a replacement for an authorization check.

## A practical review lab using fictional records

Create a fictional intake assistant that summarizes ten invented service requests. It may draft a summary and identify missing information, but it cannot approve or deny a service. Prepare reference summaries and mark which claims require a source. Include one ambiguous request, one contradictory record and one record the user is not authorized to view.

Run the assistant through the same interface intended for the pilot. Record whether it preserves uncertainty, cites the correct record and respects access limits. Have a reviewer make the next decision using the proposed interface. Observe whether the reviewer can inspect the source and correct an error without reconstructing the entire workflow manually.

The worksheet should contain intended use, applicable review owner, data classification, input identifier, output version, validation result, reviewer disposition and any committed effect. Keep the fictional dataset separate from real operational records. The lab teaches the evidence path and exposes interface defects without requiring sensitive data or making a clinical or financial decision.

Add a simulated provider outage and an incorrect model update. Verify that the tool can be disabled, that users understand the fallback and that pending work remains recoverable. A fallback that silently sends data to an unreviewed provider changes the data boundary and should not be treated as a routine availability fix.

## Operate, revise and retire

After launch, monitor availability, outcome quality, complaints, overrides and the maturity of delayed labels. Keep diagnostic access controlled and retain only what the applicable policies and purposes justify. Storing every prompt forever can create a new sensitive-data repository without improving the evidence needed for review.

Define which changes require renewed validation: a new model, changed prompt, altered retrieval corpus, expanded population or additional authority can all affect behavior. The review should target the changed assumptions. A model rollback may need corresponding prompt, feature and schema versions to restore the previously validated configuration.

Retirement also needs a plan. Revoke credentials, stop scheduled processing, preserve required decision records and remove data from derived stores according to the applicable retention rules. Notify dependent teams that the workflow is no longer supported so an old endpoint does not remain an unofficial decision service.

The useful deliverable is a traceable chain from intended use to requirements, controls, evaluation and operating decisions. It lets engineers build concrete safeguards and lets qualified reviewers assess their adequacy. That is more dependable than a generic claim that an AI system is compliant because its vendor, model or hosting region appears on an approved list.

## Sources and further study

- [HHS — Guidance on HIPAA and cloud computing](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html)
- [FDA — Clinical Decision Support Software guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software)
- [Federal Reserve — Revised supervisory guidance on model risk management](https://www.federalreserve.gov/frrs/guidance/supervisory-guidance-on-model-risk-management.htm)
- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
