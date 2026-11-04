import test from 'node:test';
import assert from 'node:assert/strict';
import { gaussianKL, familyOptimum, createCaviState, caviStep, gaussianEllipse, createRelativeElboSampler } from '../demos/vi-gaussian-kernel.mjs';
import { jensenLog } from '../demos/jensen-kernel.mjs';
const close = (a, b, tolerance = 1e-12) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
test('log Jensen gap has the right orientation, equality cases and scale invariance', () => {
  close(jensenLog(1, 9, .5).gap, Math.log(5 / 3));
  for (const t of [0, .2, 1]) close(jensenLog(3, 3, t).gap, 0);
  close(jensenLog(1, 9, 0).gap, 0); close(jensenLog(1, 9, 1).gap, 0);
  close(jensenLog(2, 8, .3).gap, jensenLog(20, 80, .3).gap);
  assert.throws(() => jensenLog(0, 1, .5), RangeError);
});
test('reverse-KL Gaussian family optimum uses conditional, not marginal variance', () => {
  const optimum = familyOptimum(.8);
  close(optimum.covariance[0][0], .36); close(optimum.kl, .5108256237659907);
  close(gaussianKL(.8), optimum.kl);
  assert.ok(gaussianKL(.8, [0, 0], 1) > optimum.kl);
  close(familyOptimum(.8, 'full').kl, 0); close(familyOptimum(0).kl, 0);
  for (const rho of [-.95, -.2, 0, .8, .99]) {
    const d = 1 - rho * rho;
    for (const ratio of [.4, .9, 1.1, 2]) assert.ok(gaussianKL(rho, [0, 0], ratio * d) > gaussianKL(rho));
  }
  assert.throws(() => familyOptimum(1), RangeError);
  assert.throws(() => createCaviState(-1), RangeError);
});
test('CAVI uses latest means sequentially and decreases KL at each coordinate', () => {
  let state = createCaviState();
  state = caviStep(state); close(state.mean[0], .8); close(state.mean[1], 1);
  state = caviStep(state); close(state.mean[0], .8); close(state.mean[1], .64);
  for (const rho of [-.9, 0, .4, .8]) {
    let s = createCaviState(rho, [-1.4, 2.1]);
    for (let i = 0; i < 400; i++) {
      const next = caviStep(s);
      assert.ok(next.kl <= s.kl + 1e-12);
      close(next.variance, 1 - rho * rho);
      s = next;
    }
    close(s.kl, familyOptimum(rho).kl, 1e-12);
    close(s.mean[0], 0, 1e-12); close(s.mean[1], 0, 1e-12);
  }
  const zero = caviStep(caviStep(createCaviState(0))); assert.deepEqual(zero.mean, [0, 0]);
});
test('Gaussian contours are points of constant Mahalanobis radius', () => {
  const rho = -.8, d = 1 - rho * rho, mean = [.3, -.4];
  for (const [x, y] of gaussianEllipse([[1, rho], [rho, 1]], mean, 2)) {
    const a = x - mean[0], b = y - mean[1];
    close((a * a - 2 * rho * a * b + b * b) / d, 4, 1e-11);
  }
});
test('relative ELBO uses reproducible nested iid draws with exact reference and standard error', () => {
  const sampler = createRelativeElboSampler({seed: 312});
  const small = sampler.at(30), large = sampler.at(10000);
  assert.deepEqual(large.values.slice(0, 30), small.values);
  assert.deepEqual(sampler.at(30), small);
  assert.deepEqual(createRelativeElboSampler({seed: 312}).at(30), small);
  assert.notDeepEqual(createRelativeElboSampler({seed: 313}).at(30).values, small.values);
  close(large.exact, -.5108256237659907); close(large.standardError, .008);
  close(large.estimate, large.values.reduce((sum, x) => sum + x, 0) / large.count);
  assert.ok(Math.abs(large.estimate - large.exact) < 5 * large.standardError);
  const variance = large.values.reduce((sum, x) => sum + (x - large.exact) ** 2, 0) / large.count;
  assert.ok(Math.abs(variance - .64) < .06);
  const zero = createRelativeElboSampler({rho: 0, seed: 0}).at(100);
  close(zero.estimate, 0); close(zero.standardError, 0); assert.ok(zero.values.every(x => x === 0));
});
