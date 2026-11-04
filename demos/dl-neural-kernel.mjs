const finite = value => {
  if (!Number.isFinite(value)) throw new RangeError('Expected a finite number');
  return value;
};
export function dlSigmoid(z) {
  finite(z);
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const exponential = Math.exp(z);
  return exponential / (1 + exponential);
}
export function dlActivation(name, z, alpha = .01) {
  finite(z);
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) throw new RangeError('Leaky slope must be between zero and one');
  switch (name) {
    case 'identity': return {value: z, derivative: 1};
    case 'step': return {value: z > 0 ? 1 : 0, derivative: z === 0 ? null : 0};
    case 'sigmoid': {const value = dlSigmoid(z); return {value, derivative: value * (1 - value)};}
    case 'tanh': {const value = Math.tanh(z); return {value, derivative: 1 - value * value};}
    case 'relu': return {value: Math.max(0, z), derivative: z === 0 ? null : z > 0 ? 1 : 0};
    case 'leaky-relu': return {value: z >= 0 ? z : alpha * z, derivative: z === 0 ? null : z > 0 ? 1 : alpha};
    default: throw new RangeError('Unknown scalar activation');
  }
}
export function dlXor(input, nonlinear = true) {
  if (!Array.isArray(input) || input.length !== 2) throw new RangeError('Expected two inputs');
  const [x1, x2] = input.map(finite), sum = x1 + x2;
  const z = [sum, sum - 1], h = nonlinear ? z.map(value => Math.max(0, value)) : [...z];
  const score = h[0] - 2 * h[1];
  return {input: [...input], z, h, score, prediction: score >= .5 ? 1 : 0};
}
export const dlXorPoints = Object.freeze([[0, 0, 0], [1, 0, 1], [0, 1, 1], [1, 1, 0]].map(Object.freeze));
export const dlForwardParameters = Object.freeze({
  w1: Object.freeze([[1, -1], [.5, 2], [-1, 1]].map(Object.freeze)),
  b1: Object.freeze([0, 1, .5]), w2: Object.freeze([.8, -.4, .2]), b2: -1
});
export function dlParameterCount(widths) {
  if (!Array.isArray(widths) || widths.length < 2 || widths.some(n => !Number.isInteger(n) || n < 1)) throw new RangeError('Expected positive layer widths');
  return widths.slice(1).reduce((sum, width, index) => sum + width * (widths[index] + 1), 0);
}
export function dlForward(input = [2, -1]) {
  if (!Array.isArray(input) || input.length !== 2) throw new RangeError('Expected two inputs');
  const x = input.map(finite), {w1, b1, w2, b2} = dlForwardParameters;
  const z1 = w1.map((row, i) => row.reduce((sum, weight, j) => sum + weight * x[j], b1[i]));
  const a1 = z1.map(value => Math.max(0, value));
  const contributions = w2.map((weight, i) => weight * a1[i]);
  const z2 = contributions.reduce((sum, value) => sum + value, b2);
  return {x, z1, a1, contributions, z2, probability: dlSigmoid(z2), parameterCount: dlParameterCount([2, 3, 1])};
}
