---
title: "The first engineering hire: define the work before the profile"
description: "Make product uncertainty, operational responsibilities, assessment evidence and available support explicit before hiring."
date: 2029-07-25
tags: ["Engineering Leadership"]
format: note
derived: true
---

The first hire can strongly influence the standards later engineers inherit. The practices they introduced, the patterns they chose, the corners they cut — these become the baseline that the team normalises. Engineers three through ten inherit the architecture the first engineer built, the testing practices they established, and the on-call culture they modelled.

This is why the first engineering hire deserves a different level of deliberation than the fifth or the tenth. The fifth engineer joins a functioning team with established practices and can adapt to them. The first engineer creates the practices.

The specific failure mode: founders hire for speed because they need to move fast, and speed is a legitimate early priority. The engineer who moves fastest is often not the engineer who makes the best long-term architectural decisions. Greenfield development can appear fast before integration and operational obligations become visible. The places where engineering judgment compounds are in decisions about what to abstract and what to leave concrete, what to build as a service and what to embed in the monolith, how to structure data so that the system can be queried in ways you have not anticipated yet.

Many consequential decisions arise early, although their timing depends on the product and business. They shape the codebase for years. The first engineering hire is disproportionately consequential compared to any subsequent hire, and the hiring process should reflect that. Not a longer process — a more thoughtful one, focused on judgment and system-level reasoning rather than task-level output speed.

## Start with the first six months of actual work

Write a role brief that names the product uncertainty, the operational obligations and the support the hire will receive. A founder may need someone to build a narrow prototype, integrate an existing service or establish a reliable production foundation. Those needs overlap but are not identical. Hiring a senior infrastructure specialist for an undefined product experiment may leave the most urgent problem untouched.

Identify decisions that are difficult to reverse. Customer identity, ownership of business data and contractual service commitments often deserve more deliberation than the first CSS framework. Ask the candidate how they would preserve options while shipping a useful slice. A simple architecture with a clear migration path can be a better starting point than an elaborate platform that assumes demand the company has not yet observed.

## Budget the work beyond feature coding

In a fictional four-week planning window, reserve 80 hours for product implementation,24 for tests and release automation,16 for operational setup and 20 for customer discovery and design discussion. The total is 140 hours. If the plan allocates all 140 hours to feature coding, it leaves 60 hours of identified supporting work unplanned. The chart compares implementation with that supporting work; it is a planning example, not a claim about a normal engineer's working hours.

Include the founder's responsibilities too. The engineer cannot independently resolve an undefined business requirement, approve a contract or decide which customer problem matters most. A role that quietly includes every technical and product responsibility may be impossible regardless of the candidate's capability. State which decisions the founder retains and how quickly they will respond when the work is blocked.

## Use a realistic discussion instead of a hero puzzle

Give candidates the same small product scenario and constraints. Ask for a first release, a deployment approach, a recovery plan and a list of questions they would ask before committing. Introduce a change, such as a customer requiring an audit trail or a data export. Observe how the candidate revises the plan and explains the cost. Score evidence of judgment separately from familiarity with a particular vendor.

A practical exercise should be bounded, relevant and respectful of the candidate's time. If it produces useful company work, compensate it appropriately and clarify ownership. Do not ask candidates to reveal confidential material from previous employers. They can demonstrate reasoning with a fictional scenario or a sanitized example whose limits are explicit.

## Agree on what the hire will not own alone

Set expectations for security review, accounting systems, legal decisions and after-hours support. A first engineer may coordinate these areas, but that does not make them a substitute for every specialist. Budget access to outside expertise where mistakes carry significant consequences. Establish how the company will handle absence and emergencies before the first production incident.

Review the role after the first meaningful release. Has the work shifted from exploration to operations? Is the next hire intended to deepen expertise, share support or create a second delivery stream? The first hire has substantial influence, but later decisions can change practices and architecture. Treat the early arrangement as a deliberate starting point with review triggers, rather than a permanent culture set by one person's habits.

## Sources and further reading

- [US OPM · Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/)
- [AWS · Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
