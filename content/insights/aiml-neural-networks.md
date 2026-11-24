---
title: "Neural Networks Explained: What They Are, How They Learn, and Why They Work"
description: "Neurons, layers, weights, activation functions, backpropagation, and gradient descent — the actual mechanics of how a neural network learns from data, explained without the mathematics becoming the obstacle."
date: 2026-09-04
tags: ["AI & MLOps", "Fundamentals"]
series: "AI, ML, LLMs, and Neural Networks: A Practitioner's Introduction"
seriesOrder: 2
format: article
---

Neural networks have produced most of the significant AI results of the last decade: image recognition that surpasses human accuracy, protein structure prediction that eluded biology for fifty years, and language models that can write, reason, and code. Understanding the basic mechanics — why neural networks are capable of learning complex functions — is foundational for any engineer working with modern AI systems.

## What to measure

**Generalisation gap.** Use disjoint training and validation sets. An accuracy of 96% on training data and 84% on validation data gives a 12-percentage-point gap. Compare both against a simple baseline and inspect class-level errors before changing the network.

*Illustrative measurement. Any numbers in this example are hypothetical.*

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

The weights and bias are parameters that training adjusts. A single neuron followed by a threshold can represent a linear decision boundary. A network with nonlinear activations can represent more complex boundaries, depending on its architecture and training.

## Why Activation Functions Matter

A stack composed only of affine layers, each with weights and a bias, still computes one affine transformation. Nonlinear activations allow layers to represent more complex relationships.

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

## Follow one training update all the way through

Take a small binary classifier for whether a product return needs manual review. Suppose two input features have been transformed to values of 2 and 1. In an illustrative linear layer with weights 0.4 and −0.3 and bias 0.1, the logit is 0.6. A sigmoid maps that logit to a score of about 0.646. If the example is truly positive, the corresponding binary cross-entropy is about 0.437. The derivative with respect to the logit is the score minus the label, approximately −0.354. Multiplying by the first input value gives a gradient of about −0.708 for the first weight. A plain gradient descent step of 0.1 then adds about 0.071 to that weight.

This path explains what the numbers in the training loop mean. A positive label that the network scores too low produces a gradient that pushes the logit upward for that example. The change also affects every other example that uses the same weight. A later batch can push in the other direction. Adaptive optimizers add state and change how individual updates are scaled, so do not expect an Adam trace to match this one-step gradient descent illustration.

## Match the output head to the target

If one example belongs to exactly one class among several, return a vector of logits and use a multiclass loss. PyTorch’s [CrossEntropyLoss documentation](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html) describes the expected logits and target formats. In the common class-index case an input with shape batch by class pairs with one class index per example. A softmax can be useful when reporting class scores at inference. Applying it before this loss changes what the loss sees and is unnecessary for this training contract.

For multiple independent flags on the same example, use one logit and binary target per flag. A customer request might be marked both time-sensitive and related to billing. [BCEWithLogitsLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.modules.loss.BCEWithLogitsLoss.html) combines sigmoid with the binary loss. Establish a decision threshold for each flag on validation data. If a target value is missing, decide whether to mask the loss or collect the label. Treating unknown labels as negative can make a model learn the behavior of the labeling process rather than the work itself.

## Check that the implementation can learn before tuning it

Start with a tiny deterministic batch and confirm that the inputs and labels line up. Try to fit that batch deliberately, with augmentations and dropout disabled when appropriate. If loss cannot fall, inspect data shapes, feature distributions, the target range, which parameters have gradients, and whether the optimizer saw the right model. This is a wiring check and the resulting model has no standing as a deployment candidate. Then restore normal training and compare behavior on held-out data.

Measure training and validation loss by epoch. Average the relevant quantity across cases or tokens, rather than reporting the last batch as if it represented the full epoch. Move the model to evaluation mode when comparing checkpoints because normalization and dropout layers can behave differently during training and validation. Set aside a test set before making architecture decisions. Report how data was grouped and which split was used to choose the final checkpoint. Early stopping tuned on validation can reduce validation error, but it cannot make the same validation set equivalent to a fresh test.

## Use error inspection to decide what to change

In an illustrative data split with 200 validation examples, suppose a network makes 24 errors and 16 involve low-light images. Check the share of low-light cases before treating that count as disproportionate. If they account for 40 of 200 inputs, their error rate is 40%, compared with 5% on the other 160. More width might make the model fit the training set better without addressing the lighting gap. Inspect whether those images were represented in training, how reviewers labeled them, and whether the prediction path normalizes them the same way.

Try one repair at a time. Examples include gathering representative data, revising the split, and changing input augmentation to reflect the intended use. Repeat with the same evaluation and seeds when the earlier result depends on random initialization. Preserve calibration as a separate outcome if a downstream rule interprets scores as probabilities. A drop in cross-entropy with the same accuracy may change which examples lie above a threshold.

Before deployment, verify input preprocessing on the original training examples and on a fixture passed through the serving interface. Record the selected checkpoint, normalization constants, label mapping and expected tensor shape. Compare outputs across both routes before addressing runtime speed. When prediction is fast but consistently wrong, mismatched features or class indices are often more actionable clues than the headline number of layers.

When validation results improve only on one random split, inspect the split with the dataset owner. Duplicate images or several frames from one recording can make validation resemble training. Group related examples before partitioning and use the grouped split again when comparing a new checkpoint.
