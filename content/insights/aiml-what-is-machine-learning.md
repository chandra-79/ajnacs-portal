---
title: "What Machine Learning Actually Is — Before the Hype and After the Buzzwords"
description: "A precise definition of machine learning, the difference between supervised, unsupervised, and reinforcement learning, and why understanding the category matters before choosing an approach."
date: 2025-07-23
tags: ["AI & MLOps", "Fundamentals"]
series: "AI, ML, LLMs, and Neural Networks: A Practitioner's Introduction"
seriesOrder: 1
format: article
---

Machine learning is a method for building programs that improve with experience — specifically, programs that adjust their behaviour based on data rather than being explicitly programmed with rules. That definition is precise enough to be useful and broad enough to cover a wide range of techniques. Before diving into neural networks and large language models, understanding the broader landscape of ML prevents the category errors that lead to picking the wrong approach for a given problem.

## What to measure

**Precision and recall at a stated threshold.** If a classifier flags 50 records and 35 are true positives, precision is 70%. If the held-out set contains 70 positives, recall is 50%. Report the decision threshold and class balance alongside both measures.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The Fundamental Distinction: Rules vs Learning

Traditional programming: a developer writes rules. Data goes in, the rules process it, output comes out.

```
Data + Rules → Output
```

In supervised machine learning, a developer provides examples of inputs and desired outputs. Training fits a model to map inputs to predictions.

```
Data + Desired Outputs → Rules (model)
Rules (model) + New Data → Predicted Output
```

In this example, training adjusts the parameters of a **model** to reduce a loss on the training data. The trained model is then used to make predictions on new data it has not seen before.

## The Three Categories

**Supervised Learning**: the training data contains both inputs and correct outputs. The algorithm learns to map inputs to outputs.

Examples:
- Email spam classification: input is email text and metadata, output is spam/not spam
- House price prediction: input is house features, output is price
- Image recognition: input is pixel values, output is class label

Supervised learning is the most common type in production applications. You need labelled data — examples where the correct answer is known.

**Unsupervised Learning**: the training data contains only inputs, no labels. The algorithm finds structure in the data.

Examples:
- Customer segmentation: group customers by purchasing behaviour without predefined groups
- Anomaly detection: learn what normal looks like; flag deviations
- Dimensionality reduction: compress high-dimensional data (e.g., 1000 features → 2 features) for visualisation

Unsupervised learning is used for exploration — finding patterns when you do not know in advance what you are looking for.

**Reinforcement learning** trains a policy using rewards associated with actions and outcomes. It can learn from interaction or from recorded experience. Reward feedback serves a different purpose from labelled answers in supervised prediction.

Examples:
- Game-playing agents (AlphaGo, OpenAI Five)
- Robotic control
- Reinforcement learning from human feedback, one family of techniques for adapting models to human preferences

## Key Terminology

**Training** adjusts model parameters to optimise a specified objective, such as reducing supervised prediction loss or increasing expected reward.

**Inference**: using the trained model to make predictions on new data. In production, inference is what your application does on every request.

**Overfitting**: the model has learned the training data too precisely, including its noise, and performs poorly on new data. The model has memorised rather than generalised.

**Underfitting**: the model is too simple to capture the underlying pattern. High error on both training and new data.

**Generalisation**: the ability to perform well on data the model was not trained on. The actual goal.

**Feature**: an input variable used by the model. For a house price model: square footage, number of bedrooms, location, age. Feature engineering — selecting and transforming raw data into meaningful features — is often the most impactful work in a supervised learning project.

## When Machine Learning Is and Is Not the Right Tool

Machine learning is appropriate when:
- The rules are too complex to write explicitly (image recognition, language understanding)
- The rules change over time and the model should adapt to new data
- There is sufficient labelled training data
- The cost of incorrect predictions is acceptable and understood

Machine learning is not appropriate when:
- The problem can be solved with deterministic rules (use rules)
- You have insufficient training data
- Explainability is required in a way that complex models cannot provide
- The cost of a wrong prediction is catastrophic and cannot be bounded

The most expensive ML projects I have seen failed not at the modelling stage but at the problem definition stage: the team built a sophisticated model for a problem that a simpler approach would have solved more reliably. The right tool choice starts with a clear problem definition and a realistic assessment of available data.

The next lesson covers neural networks — the architecture underlying modern deep learning, and the reason the last decade of AI progress has been so dramatic.

## Start with the decision and its timing

Imagine a team that receives product support tickets and wants to send billing issues to a specialist. An input might be the subject and first message. The prediction is whether billing help is needed. The action is assignment to a queue, and the observable outcome is the first correct assignment. Specify when the service makes that decision. The ticket’s eventual resolution code is useful for creating a label later. It cannot be an input when the ticket first arrives. A model built from a historical export can accidentally see both in the same record.

Write down how a label is created, who is allowed to revise it, and what to do when two reviewers disagree. In the example, updating a credit card and asking about a feature limit could both mention payment. A documented rubric might send payment disputes to specialists and plan questions to the normal queue. Keep genuinely ambiguous tickets as a separate class for review instead of forcing agreement. A supervised model learns what the recorded label represents. If the rubric changes after a new product launch, the old labels may no longer answer the operational question.

## Build a benchmark you can beat with a simpler system

Start with the current manual or rule-based process. Then fit a simple model that uses only inputs known at assignment, such as a logistic regression on text features. A more complex model has to justify added work for data preparation, troubleshooting and maintenance. Create a test fixture with new customers, common topics and uncommon issues that matter. Freeze that test before choosing the model. The [scikit-learn guide on common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html) explains why fitting preprocessing on the full dataset before splitting can leak information into training. Fit the vocabulary or scaler using only the training samples in each fold.

Choose a split that matches how the model will be used. A random split may be reasonable when observations are independent and sampled from a similar population. When the same customer has several versions of a ticket, keep the related examples in the same split. When the model will be deployed on future requests, reserve a later period and reconstruct the data available at each prediction time. Compare the overlap of identifiers and near-duplicates before trusting an improvement. If the final test influences a redesign, set aside a new final check.

## Work the cost of a decision threshold

Suppose 100 of 1,000 fictional tickets genuinely need the specialist. At a lower threshold, the model sends 160 tickets and captures 80 billing issues. It adds 80 false assignments and misses 20 true issues. At a higher threshold it sends 100 tickets and captures 65 true issues, leaving 35 false assignments and 35 misses. The higher threshold is more precise at 65%, compared with 50%, but recall drops from 80% to 65%.

If a misrouted ordinary ticket costs an estimated two staff minutes and a missed billing ticket costs eight, the first policy consumes an illustrative 320 extra minutes and the second 350. The second policy may still be necessary if the specialist queue can process only 120 items, or if some missed tickets carry a different cost. Take the thresholds and the constraints to the people who manage the queue. Do not claim that precision alone identifies the better policy. The [Google classification guide](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) explains the denominators behind these scores.

## Decide what happens when the score is uncertain

Use a shadow rollout to compute predictions while the existing queue process retains control. Measure whether the same types remain difficult, what an ambiguous example costs to review, and how often the model cannot obtain a valid input. It is possible to introduce a middle band that requires review, while allowing only high-confidence and low-consequence decisions to proceed automatically. Publish a route for a missing model or invalid features so a support request does not disappear when prediction fails.

Once automatic assignments start, record their outcomes with the applied model and policy version. Review both flags and unflagged samples, because labels collected only for the cases the model selected cannot reveal how many it missed. Set a cadence for checking traffic composition and labels. A seasonal influx of new issues may affect input distribution before enough outcomes exist to judge quality. Keep the option to return to rules while the sample matures. The production decision is whether the combination of prediction, review and fallback improves the real assignment process at an acceptable cost.

Retain a sample of cases that were routed by the prior rules and review them against the new rubric. If the label definition changed during deployment, version it separately from the model so an apparent quality improvement can be checked against the same decision standard.
