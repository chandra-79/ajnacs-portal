---
title: "Neural Networks Explained: What They Are, How They Learn, and Why They Work"
description: "Neurons, layers, weights, activation functions, backpropagation, and gradient descent — the actual mechanics of how a neural network learns from data, explained without the mathematics becoming the obstacle."
date: 2026-07-06
tags: ["AI & MLOps", "Fundamentals"]
series: "AI, ML, LLMs, and Neural Networks: A Practitioner's Introduction"
seriesOrder: 2
format: article
---

Neural networks have produced most of the significant AI results of the last decade: image recognition that surpasses human accuracy, protein structure prediction that eluded biology for fifty years, and language models that can write, reason, and code. Understanding the basic mechanics — why neural networks are capable of learning complex functions — is foundational for any engineer working with modern AI systems.

## The Basic Unit: The Artificial Neuron

An artificial neuron performs a simple computation: it takes multiple input values, multiplies each by a weight, sums the weighted inputs, adds a bias, and passes the result through an activation function.

```
output = activation_function(w1*x1 + w2*x2 + w3*x3 + ... + bias)
```

Where:
- `x1, x2, x3...` are the inputs
- `w1, w2, w3...` are the weights (learned during training)
- `bias` is an offset term (also learned)
- `activation_function` introduces non-linearity

The weights and bias are the parameters that training adjusts. A single neuron can learn a linear decision boundary. Networks of neurons can learn arbitrarily complex functions.

## Why Activation Functions Matter

Without activation functions, a stack of neurons computes a linear function, regardless of depth. Linear functions cannot capture the complex, non-linear patterns in real data.

**ReLU** (Rectified Linear Unit): `f(x) = max(0, x)`. The most commonly used activation in hidden layers. Simple, computationally cheap, and empirically effective.

**Sigmoid**: `f(x) = 1 / (1 + e^(-x))`. Squashes output to (0, 1). Used in binary classification output layers.

**Softmax**: normalises a vector of values to probabilities that sum to 1. Used in multi-class classification output layers.

**GELU** (Gaussian Error Linear Unit): used in transformer models (GPT, BERT). Smoother than ReLU; empirically performs better for language tasks.

## Layers: Organising Neurons into Networks

Neurons are organised into layers:

- **Input layer**: one node per input feature (or per pixel for image input)
- **Hidden layers**: intermediate computation layers — the "deep" in deep learning
- **Output layer**: produces the prediction (one node for regression, N nodes for N-class classification)

A "deep" neural network simply has multiple hidden layers. The depth allows the network to learn hierarchical representations: early layers learn simple patterns (edges in images, common word patterns in text), later layers compose these into complex concepts.

```python
## A simple neural network in PyTorch
import torch
import torch.nn as nn

class SimpleNetwork(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, hidden_size),   # input → hidden
            nn.ReLU(),                             # activation
            nn.Linear(hidden_size, hidden_size),  # hidden → hidden
            nn.ReLU(),
            nn.Linear(hidden_size, output_size),  # hidden → output
        )

    def forward(self, x):
        return self.layers(x)
```

## How Learning Works: Loss, Gradient Descent, Backpropagation

Training adjusts the weights and biases to minimise prediction error. The process:

**1. Forward pass**: run the input through the network, get a prediction.

**2. Calculate loss**: measure how wrong the prediction was. Common loss functions:
- Mean Squared Error (regression): average of squared differences between predicted and actual values
- Cross-Entropy Loss (classification): measures divergence between predicted probability distribution and true labels

**3. Backward pass (backpropagation)**: calculate how much each weight contributed to the error, using the chain rule of calculus. This gives the gradient — the direction and magnitude of change needed in each weight to reduce the loss.

**4. Update weights**: adjust each weight in the direction that reduces loss, by a step size called the **learning rate**.

```
new_weight = old_weight - learning_rate × gradient
```

**5. Repeat**: for many examples, many times (multiple epochs). The network gradually learns to minimise prediction error.

## What "Training" Looks Like Operationally

```python
## Training loop skeleton
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
loss_function = nn.CrossEntropyLoss()

for epoch in range(num_epochs):
    for batch_inputs, batch_labels in dataloader:
        # Forward pass
        predictions = model(batch_inputs)

        # Calculate loss
        loss = loss_function(predictions, batch_labels)

        # Backward pass
        optimizer.zero_grad()   # clear previous gradients
        loss.backward()         # compute gradients

        # Update weights
        optimizer.step()

    print(f"Epoch {epoch}: loss = {loss.item():.4f}")
```

## Why Neural Networks Generalise

The universal approximation theorem shows that a sufficiently large neural network can approximate any continuous function. But approximating the training data is easy — the interesting question is why neural networks often generalise well to new data.

The empirical answer: neural networks, when trained correctly with regularisation (dropout, weight decay), tend to learn compressed, generalisable representations of patterns rather than memorising specific examples. The large parameter count is offset by the regularisation pressure and the gradient descent dynamics that favour smooth, generalisable solutions over sharp, overfit ones.

Understanding this tension — between fitting the training data and generalising to new data — is the central challenge of every supervised learning project. The next lesson applies these foundations to the architecture that produced the current generation of AI systems: the transformer.
