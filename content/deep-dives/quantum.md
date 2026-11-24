# Translate repeated circuit shots into a probability estimate
@lesson circuit-shot-uncertainty | Calculate the estimated probability and show how precision scales with the number of independent circuit shots.
@chart Sampling standard error near a 50% outcome | percentage points
@value 100 shots | 5
@value 400 shots | 2.5
@value 1,600 shots | 1.25
@value 6,400 shots | 0.625
@match measurement | experiment | qubit | randomness | probability | observable
@source IBM Quantum · Sampler inputs and outputs | https://quantum.cloud.ibm.com/docs/en/ibm-quantum-compute/sampler-input-output
@source NIST · Confidence intervals for proportions | https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm

## Count the outcome

For a circuit measured in a specified basis, define the bit or bitstring event you will count. If a specified event occurs 52 times in 100 shots, the observed proportion is 0.52. For independent identically distributed shots in a binary outcome, the estimated standard error near p = 0.5 is approximately sqrt(p(1−p)/n). At 100 shots it is about five percentage points.

## Separate precision from bias

Increasing from 100 to 400 shots halves the sampling standard error to 2.5 percentage points. Four times as many independent shots give about half the standard error. More shots cannot remove a measurement bias. Report the circuit, basis, number of shots, observed counts, and any postselection. A confidence interval is not equivalent to a standard error. Use a method such as a Wilson interval when reporting an interval from binary outcome counts.

Check the order and grouping of repeated trials if calibration changes during the run. Compare separate batches and preserve the backend and job settings so a later reader can tell which results came from the same conditions.

## Limits of the example

The chart uses theoretical sampling errors for binary outcomes at p = 0.5. It does not include state preparation errors, correlated shots, readout drift, or calibration uncertainty. Use repeat experiments and device-specific controls to investigate those effects.

# Separate readout error from the outcome you wanted to observe
@lesson readout-calibration | Use a two-state calibration model to show why raw outcome proportions can differ from the prepared state probabilities.
@chart Fraction classified as one | %
@value Prepared zero | 6
@value Prepared one | 90
@value Circuit raw | 48
@value Corrected estimate | 50
@match error correction | readout | state preparation | noise | correction | detection
@source IBM Quantum · Error mitigation and suppression techniques | https://quantum.cloud.ibm.com/docs/en/guides/error-mitigation-and-suppression-techniques

## Calibrate under comparable conditions

Suppose a single-qubit measurement labels six of 100 prepared zeros as one and 90 of 100 prepared ones as one. In a simple two-state calibration, the observed probability q of labeling a one is 0.06 × (1−p) + 0.90 × p, where p is the underlying probability of the one outcome under the model.

## Compute the correction and test it

If a circuit is labeled one 48% of the time, the corrected estimate is (0.48−0.06) ÷ (0.90−0.06) = 0.50. Keep the raw 48% with the corrected value. Their difference depends on the calibration assumptions. Store the calibration counts and their collection time. Re-run a control when conditions change.

The denominator is small if the readout gives nearly the same label frequency for both prepared states. The inversion then magnifies sampling uncertainty. For multi-qubit measurements, independent single-qubit calibration may not capture correlated readout. More elaborate models require more calibration data and validation.

## Limits of the example

These values are illustrative. Prepared states themselves can be imperfect, and the sample estimates for calibration are not exact. Propagate their uncertainty and compare against held-out controls. A corrected estimate alone does not prove that a circuit executed correctly.

# Compare logical error rates without comparing the wrong denominator
@lesson logical-error-comparison | Distinguish per-cycle rates from whole-run failures and show why a comparison needs matched conditions and uncertainty.
@chart Modeled probability of at least one error | %
@value 10 cycles at 0.1% | 0.9955
@value 50 cycles at 0.1% | 4.8794
@value 100 cycles at 0.1% | 9.5208
@match logical qubit | fault tolerance | surface code | error correction | threshold | below threshold
@source Google Quantum AI and collaborators · Quantum error correction below the surface code threshold | https://doi.org/10.1038/s41586-024-08449-y

## Keep duration in the denominator

Imagine independent error opportunities with probability 0.001 per cycle. The probability of at least one error in n cycles is 1 − (1−0.001)ⁿ. The chart gives about 1.00% after ten cycles, 4.88% after fifty, and 9.52% after one hundred. The per-cycle probability is unchanged. A different run length alone can therefore move a per-run failure figure.

## Choose a fair comparison

When comparing reported measurements, ask whether they use the same logical state or operation, code distances, decoder assumptions, number of cycles, and loss or postselection rules. A smaller per-cycle error rate under one test does not give an end-to-end prediction for an unrelated algorithm. Retain the reported uncertainty and the tested environment.

Read the methods of an experiment before converting a number. Some protocols estimate logical error per cycle from survival or parity across different lengths. Real errors can correlate, leak between states, or cancel in the final observable. A model for at least one independent error is a teaching calculation, not a reconstruction of such an experiment.

## Limits of the example

The inputs are illustrative and differ from the cited device study. Compare repeated logical tests on matched conditions and use the experiment's statistical model before interpreting error suppression.
