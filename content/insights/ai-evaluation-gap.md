---
title: "The AI system went live without a systematic evaluation framework. That is the real risk."
description: "Software engineering has decades of practice around automated testing."
date: 2025-08-08
tags: ["AI & MLOps", "Enterprise AI"]
format: article
derived: true
---

Software engineering has decades of practice around automated testing. The discipline is imperfect, inconsistently applied, and still the most reliable mechanism for catching regressions before users do. AI systems need an equivalent discipline, and most production deployments do not have it.

The reason is structural. Traditional software testing validates deterministic behaviour: given input X, output Y is correct. AI system outputs are not deterministic in the same way. The correct response to a question may have multiple valid forms. The failure modes are often subtle — a response that is factually wrong but confident-sounding, a retrieved document that is relevant to the surface topic but not the actual question, a classification that is correct for the most common case and wrong for the cases that matter most.

Building evaluation for these systems requires defining what "good" looks like well enough to automate the measurement. This is harder than writing a unit test and easier than it seems once you start. A set of benchmark queries with known correct responses, evaluated automatically on every deployment. Retrieval quality metrics for RAG systems — are the retrieved documents actually relevant to the query? Output safety checks that flag specific failure patterns. Business metric correlation — are the AI-assisted interactions producing better outcomes than the baseline?

None of these replace human judgment for edge case analysis. They do catch systematic degradation automatically, which is what the team actually needs. A model version change that degrades performance on a specific query pattern by 15% should not reach production undetected. It will reach production undetected if the only evaluation is manual testing of happy path cases before launch.
