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

## The Fundamental Distinction: Rules vs Learning

Traditional programming: a developer writes rules. Data goes in, the rules process it, output comes out.

```
Data + Rules → Output
```

Machine learning: a developer provides data and desired outputs. The algorithm learns the rules.

```
Data + Desired Outputs → Rules (model)
Rules (model) + New Data → Predicted Output
```

The learned rules are encoded in a **model** — a mathematical function with parameters that were adjusted during training to produce correct outputs for the training data. The trained model is then used to make predictions on new data it has not seen before.

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

**Reinforcement Learning**: an agent learns by taking actions in an environment and receiving rewards or penalties. No labelled training data; the agent learns through trial and error.

Examples:
- Game-playing agents (AlphaGo, OpenAI Five)
- Robotic control
- RLHF (Reinforcement Learning from Human Feedback) — the technique used to align LLMs with human preferences

## Key Terminology

**Training**: the process of adjusting model parameters to minimise prediction error on the training dataset.

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
