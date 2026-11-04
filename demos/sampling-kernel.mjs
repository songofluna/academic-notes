// Pure numerical models for Chapter 4; randomness reuses the tested MH helpers.
import { rng, normal } from './mh-kernel.mjs';
function validCount(n, minimum = 1, maximum = 1000000) {
  if (!Number.isInteger(n) || n < minimum || n > maximum) throw new RangeError('Invalid sample count');
}
function validCorrelation(a) {
  if (!Number.isFinite(a) || Math.abs(a) >= 1) throw new RangeError('Correlation must lie strictly between -1 and 1');
}
function seededNormal(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be uint32');
  const random = rng(seed);
  return () => normal(random);
}
function summaryFromMoments(count, mean, m2) {
  const variance = m2 / (count - 1), mcse = Math.sqrt(variance / count);
  return {count, mean, variance, mcse, interval: [mean - 1.96 * mcse, mean + 1.96 * mcse]};
}
export function sampleSummary(values) {
  validCount(values.length, 2);
  let mean = 0, m2 = 0;
  values.forEach((value, i) => {
    if (!Number.isFinite(value)) throw new RangeError('Finite observations required');
    const delta = value - mean; mean += delta / (i + 1); m2 += delta * (value - mean);
  });
  return summaryFromMoments(values.length, mean, m2);
}
export function createMonteCarloSeSampler(seed = 403) {
  const draw = seededNormal(seed), values = [], means = [], sumsOfSquares = [];
  let mean = 0, m2 = 0;
  return {at(count) {
    validCount(count);
    while (values.length < count) {
      const z = draw(), value = z * z, n = values.length + 1, delta = value - mean;
      mean += delta / n; m2 += delta * (value - mean);
      values.push(value); means.push(mean); sumsOfSquares.push(m2);
    }
    const summary = count === 1
      ? {count, mean: means[0], variance: null, mcse: null, interval: null}
      : summaryFromMoments(count, means[count - 1], sumsOfSquares[count - 1]);
    return {...summary, exact: 1, integrandVariance: 2, theoreticalSe: Math.sqrt(2 / count), seed, values: values.slice(0, count), means: means.slice(0, count)};
  }};
}
export const MARKOV_PRESETS = {
  source: {matrix: [[.9, .1], [.3, .7]], stationary: [.75, .25]},
  identity: {matrix: [[1, 0], [0, 1]], stationary: null},
  alternating: {matrix: [[0, 1], [1, 0]], stationary: [.5, .5]},
};
export function markovStep(distribution, matrix) {
  if (distribution.length !== 2 || matrix.length !== 2 || !matrix.every(row => row.length === 2)) throw new RangeError('Two states required');
  for (const row of [distribution, ...matrix]) {
    if (!row.every(p => Number.isFinite(p) && p >= 0 && p <= 1) || Math.abs(row[0] + row[1] - 1) > 1e-10) throw new RangeError('Probability rows must sum to one');
  }
  return [distribution[0] * matrix[0][0] + distribution[1] * matrix[1][0], distribution[0] * matrix[0][1] + distribution[1] * matrix[1][1]];
}
export function markovTrajectory(preset = 'source', initialFirst = 1, steps = 0) {
  if (!Object.hasOwn(MARKOV_PRESETS, preset) || !Number.isFinite(initialFirst) || initialFirst < 0 || initialFirst > 1) throw new RangeError('Invalid Markov settings');
  validCount(steps, 0, 1000);
  const model = MARKOV_PRESETS[preset], history = [[initialFirst, 1 - initialFirst]];
  for (let i = 0; i < steps; i++) history.push(markovStep(history.at(-1), model.matrix));
  return {preset, steps, matrix: model.matrix.map(row => [...row]), stationary: model.stationary ? [...model.stationary] : null, distribution: [...history.at(-1)], history};
}
export function gibbsCoordinate(state, coordinate, rho, epsilon) {
  validCorrelation(rho);
  if (state.length !== 2 || !state.every(Number.isFinite) || ![0, 1].includes(coordinate) || !Number.isFinite(epsilon)) throw new RangeError('Invalid Gibbs state');
  const next = [...state];
  next[coordinate] = rho * state[1 - coordinate] + Math.sqrt((1 - rho) * (1 + rho)) * epsilon;
  return next;
}
export function createGibbsSampler({rho = .8, seed = 411, initial = [1, 1]} = {}) {
  validCorrelation(rho);
  if (initial.length !== 2 || !initial.every(Number.isFinite)) throw new RangeError('Invalid initial state');
  const draw = seededNormal(seed), states = [[...initial]];
  return {at(updates) {
    validCount(updates, 0);
    while (states.length <= updates) states.push(gibbsCoordinate(states.at(-1), (states.length - 1) % 2, rho, draw()));
    const state = [...states[updates]], nextCoordinate = updates % 2;
    return {rho, seed, updates, state, nextCoordinate, conditionalMean: rho * state[1 - nextCoordinate], conditionalSd: Math.sqrt((1 - rho) * (1 + rho)), states: states.slice(0, updates + 1).map(pair => [...pair])};
  }};
}
export function ar1Theory(a, count) {
  validCorrelation(a); validCount(count);
  let factor = 1, power = a;
  for (let k = 1; k < count; k++, power *= a) factor += 2 * (1 - k / count) * power;
  const tau = (1 + a) / (1 - a), variance = factor / count;
  return {a, count, tau, asymptoticEss: count / tau, variance, finiteSe: Math.sqrt(variance), asymptoticSe: Math.sqrt(tau / count), acf: Array.from({length: 31}, (_, k) => a ** k)};
}
export function createAr1Sampler({a = .8, seed = 412} = {}) {
  validCorrelation(a);
  const draw = seededNormal(seed), values = [draw()], sd = Math.sqrt((1 - a) * (1 + a));
  return {at(count) {
    validCount(count);
    while (values.length < count) values.push(a * values.at(-1) + sd * draw());
    return {a, seed, count, values: values.slice(0, count)};
  }};
}
export function ulaStationary(eta) {
  if (!Number.isFinite(eta) || eta <= 0 || eta >= 2) throw new RangeError('This Gaussian ULA needs 0 < eta < 2');
  const variance = 1 / (1 - eta / 2);
  return {eta, coefficient: 1 - eta, targetVariance: 1, variance, sd: Math.sqrt(variance)};
}
