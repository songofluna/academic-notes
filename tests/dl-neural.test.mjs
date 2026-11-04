import test from 'node:test';
import assert from 'node:assert/strict';
import { dlSigmoid, dlActivation, dlXor, dlXorPoints, dlForward, dlForwardParameters, dlParameterCount } from '../demos/dl-neural-kernel.mjs';
const close = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
test('scalar activation ranges, symmetry and extreme logits stay finite', () => {
  for (const z of [-1000, -10, -1, 0, 1, 10, 1000]) {
    const s = dlActivation('sigmoid', z), t = dlActivation('tanh', z);
    assert.ok(s.value >= 0 && s.value <= 1 && Number.isFinite(s.derivative));
    assert.ok(t.value >= -1 && t.value <= 1 && Number.isFinite(t.derivative));
    close(s.value + dlSigmoid(-z), 1); close(t.value, -Math.tanh(-z));
    close(dlActivation('identity', z).value, z);
  }
  close(dlSigmoid(0), .5); close(dlActivation('sigmoid', 0).derivative, .25);
  assert.throws(() => dlSigmoid(NaN), RangeError);
});
test('displayed local slopes agree with central differences away from kinks', () => {
  for (const name of ['identity', 'step', 'sigmoid', 'tanh', 'relu', 'leaky-relu']) for (const z of [-3, -.3, .4, 2]) {
    const h = 1e-5, alpha = .1;
    const difference = (dlActivation(name, z+h, alpha).value - dlActivation(name, z-h, alpha).value) / (2*h);
    close(dlActivation(name, z, alpha).derivative, difference, 1e-9);
  }
});
test('the source step convention and nonsmooth activations distinguish values from derivatives at zero', () => {
  for (const name of ['step', 'relu', 'leaky-relu']) {
    assert.equal(dlActivation(name, 0).derivative, null);
    close(dlActivation(name, 0).value, 0);
  }
  close(dlActivation('leaky-relu', -2, .1).value, -.2);
  close(dlActivation('step', -.1).value, 0); close(dlActivation('step', .1).value, 1);
  close(dlActivation('leaky-relu', -2, .1).derivative, .1);
  for (const alpha of [0, 1, -1, NaN]) assert.throws(() => dlActivation('leaky-relu', 1, alpha), RangeError);
});
test('the fixed two-ReLU network implements the XOR truth table and merged positive features', () => {
  const results = dlXorPoints.map(([x1, x2]) => dlXor([x1, x2]));
  assert.deepEqual(results.map(r => r.score), [0, 1, 1, 0]);
  assert.deepEqual(results.map(r => r.prediction), [0, 1, 1, 0]);
  assert.deepEqual(results.map(r => r.h), [[0, 0], [1, 0], [1, 0], [2, 1]]);
  close(dlXor([.5, 0]).score, .5); close(dlXor([1, .5]).score, .5);
  assert.equal(dlXor([2, 2]).score, -2, 'The readout is a score, not a clipped probability');
});
test('removing nonlinearities collapses the same fixed XOR network to 2-x1-x2', () => {
  for (const x1 of [-2, 0, .3, 1, 4]) for (const x2 of [-1, 0, .7, 1, 3]) close(dlXor([x1, x2], false).score, 2-x1-x2);
  assert.deepEqual(dlXorPoints.map(([a,b]) => dlXor([a,b], false).prediction), [1, 1, 1, 0]);
});
test('complete forward pass recovers the independently specified source example', () => {
  const input = [2, -1], result = dlForward(input);
  assert.deepEqual(result.z1, [3, 0, -2.5]); assert.deepEqual(result.a1, [3, 0, 0]);
  close(result.z2, 1.4); close(result.probability, .8021838885585818);
  assert.equal(result.parameterCount, 13); assert.deepEqual(input, [2, -1]);
  assert.ok(Object.isFrozen(dlForwardParameters.w1[0]));
});
test('forward controls preserve inactive ReLU units and correct readout signs', () => {
  const zero = dlForward([0, 0]); assert.deepEqual(zero.a1, [0, 1, .5]); close(zero.z2, -1.3); close(zero.probability, .2141650169574414);
  const negative = dlForward([-3, 3]); assert.deepEqual(negative.a1, [0, 5.5, 6.5]); close(negative.z2, -1.9);
  const positive = dlForward([3, -3]); assert.deepEqual(positive.a1, [6, 0, 0]); close(positive.z2, 3.8);
  assert.throws(() => dlForward([1, Infinity]), RangeError);
});
test('dense parameter counts include one bias for every non-input unit', () => {
  assert.equal(dlParameterCount([2, 3, 1]), 13);
  assert.equal(dlParameterCount([3, 4, 2, 1]), 29);
  assert.equal(dlParameterCount([2, 1]), 3);
  for (const widths of [[2], [2, 0], [2, 1.5]]) assert.throws(() => dlParameterCount(widths), RangeError);
});
