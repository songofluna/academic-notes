import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleSummary, createMonteCarloSeSampler, markovStep, markovTrajectory, gibbsCoordinate, createGibbsSampler, ar1Theory, createAr1Sampler, ulaStationary } from '../demos/sampling-kernel.mjs';
const close = (a, b, tolerance = 1e-12) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
test('MCSE uses sample variance and sqrt(S), with the stated approximate interval', () => {
  const s = sampleSummary([1, 2, 3]);
  close(s.mean, 2); close(s.variance, 1); close(s.mcse, 1 / Math.sqrt(3));
  close(s.interval[0], 2 - 1.96 / Math.sqrt(3)); close(s.interval[1], 2 + 1.96 / Math.sqrt(3));
  assert.throws(() => sampleSummary([1]), RangeError);
  const wide = sampleSummary([0, 10]); assert.ok(wide.interval[0] < 0, 'Do not clip normal-approximation intervals');
});
test('normal-square Monte Carlo preserves prefixes and matches independent moments', () => {
  const sampler = createMonteCarloSeSampler(), short = sampler.at(30), large = sampler.at(100000);
  assert.deepEqual(sampler.at(30), short); assert.deepEqual(large.values.slice(0, 30), short.values);
  assert.deepEqual(createMonteCarloSeSampler().at(30), short);
  assert.notDeepEqual(createMonteCarloSeSampler(404).at(30).values, short.values);
  const mean = large.values.reduce((s, x) => s + x, 0) / large.count;
  const variance = large.values.reduce((s, x) => s + (x - mean) ** 2, 0) / (large.count - 1);
  close(large.mean, mean, 1e-12); close(large.variance, variance, 1e-11);
  close(large.theoreticalSe, Math.sqrt(2 / large.count));
  assert.ok(Math.abs(mean - 1) < 5 * large.theoreticalSe); close(variance, 2, .08);
});
test('row-vector Markov evolution agrees with the exact solution and stationary distribution', () => {
  for (const initial of [0, .25, .75, 1]) for (const t of [0, 1, 2, 10, 100]) {
    const state = markovTrajectory('source', initial, t);
    close(state.distribution[0], .75 + (initial - .75) * .6 ** t);
    close(state.distribution[0] + state.distribution[1], 1);
  }
  const model = markovTrajectory();
  assert.deepEqual(markovStep([.75, .25], model.matrix), [.75, .25]);
  assert.throws(() => markovStep([.2, .7], model.matrix), RangeError);
});
test('identity and alternating examples distinguish stationarity from convergence', () => {
  const identity = markovTrajectory('identity', .2, 100);
  assert.equal(identity.stationary, null); assert.deepEqual(identity.distribution, [.2, .8]);
  for (const t of [0, 1, 2, 9, 10]) {
    close(markovTrajectory('alternating', .2, t).distribution[0], t % 2 ? .8 : .2);
    close(markovTrajectory('alternating', .5, t).distribution[0], .5);
  }
});
test('Gibbs draws use the latest other coordinate and conditional standard deviation', () => {
  const first = gibbsCoordinate([1, 1], 0, .8, 1);
  close(first[0], 1.4); close(first[1], 1);
  const second = gibbsCoordinate(first, 1, .8, -1);
  close(second[0], 1.4); close(second[1], .52);
  const sampler = createGibbsSampler(), short = sampler.at(10), long = sampler.at(100);
  assert.deepEqual(sampler.at(10), short); assert.deepEqual(long.states.slice(0, 11), short.states);
  close(short.conditionalSd, .6);
  assert.notDeepEqual(createGibbsSampler({seed: 412}).at(10).states, short.states);
});
test('Gibbs sweeps recover the joint Gaussian, not the smaller mean-field variance', () => {
  const result = createGibbsSampler({rho: .8, seed: 917}).at(220000);
  const pairs = result.states.filter((_, i) => i >= 20000 && i % 2 === 0), n = pairs.length;
  const moments = pairs.reduce((s, [x, y]) => [s[0]+x,s[1]+y,s[2]+x*x,s[3]+y*y,s[4]+x*y], [0,0,0,0,0]).map(x => x / n);
  close(moments[0], 0, .025); close(moments[1], 0, .025);
  close(moments[2], 1, .04); close(moments[3], 1, .04); close(moments[4], .8, .04);
});
test('AR1 finite-S variance matches a direct covariance sum and distinguishes the asymptotic ESS', () => {
  for (const a of [-.8, 0, .5, .8, .95]) for (const n of [1, 4, 20]) {
    let covarianceSum = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) covarianceSum += a ** Math.abs(i-j);
    close(ar1Theory(a, n).variance, covarianceSum / (n*n));
  }
  const source = ar1Theory(.8, 9000); close(source.tau, 9); close(source.asymptoticEss, 1000);
  assert.ok(source.finiteSe < source.asymptoticSe);
  assert.ok(ar1Theory(-.8, 100).asymptoticEss > 100);
  const sampler = createAr1Sampler(), short = sampler.at(20), large = sampler.at(100000);
  assert.deepEqual(sampler.at(20), short); assert.deepEqual(large.values.slice(0, 20), short.values);
  const variance = large.values.reduce((sum, x) => sum+x*x, 0) / large.count;
  const lag = large.values.slice(1).reduce((sum, x, i) => sum+x*large.values[i], 0) / (large.count-1);
  close(variance, 1, .04); close(lag, .8, .04);
});
test('Gaussian ULA stationary variance solves its exact recursion on the stable domain', () => {
  for (const eta of [.0001, .02, .5, 1, 1.5, 1.9]) {
    const s = ulaStationary(eta);
    close(s.variance, s.coefficient**2*s.variance+2*eta, 1e-12);
    assert.ok(s.variance > 1); close(s.sd*s.sd, s.variance, 1e-12);
  }
  close(ulaStationary(1).variance, 2); close(ulaStationary(.5).variance, 4/3);
  for (const eta of [0, 2, -1, NaN]) assert.throws(() => ulaStationary(eta), RangeError);
});
