// The chapter's tractable Gaussian example: p=N(0, [[1,rho],[rho,1]]).
function determinant(rho) {
  if (!Number.isFinite(rho) || Math.abs(rho) >= 1) throw new RangeError('|rho| must be less than 1');
  return (1 - rho) * (1 + rho);
}
export function gaussianKL(rho, mean = [0, 0], variance = determinant(rho)) {
  const d = determinant(rho);
  if (!Array.isArray(mean) || mean.length !== 2 || !mean.every(Number.isFinite) || !Number.isFinite(variance) || variance <= 0) throw new RangeError('Invalid Gaussian parameters');
  const [a, b] = mean, ratio = variance / d;
  // Equivalent to m^T Sigma^-1 m, written as a sum of nonnegative terms.
  const quadratic = (a - rho * b) ** 2 / d + b * b;
  return ratio - 1 - Math.log(ratio) - .5 * Math.log(d) + .5 * quadratic;
}
export function familyOptimum(rho, family = 'mean-field') {
  const d = determinant(rho);
  if (!['mean-field', 'full'].includes(family)) throw new RangeError('Unknown family');
  return {rho, family, covariance: family === 'full' ? [[1, rho], [rho, 1]] : [[d, 0], [0, d]], kl: family === 'full' ? 0 : -.5 * Math.log(d)};
}
export function createCaviState(rho = .8, mean = [1, 1]) {
  const variance = determinant(rho), kl = gaussianKL(rho, mean, variance);
  return {rho, mean: [...mean], variance, next: 0, updates: 0, path: [[...mean]], history: [kl], kl};
}
export function caviStep(state) {
  const mean = [...state.mean], coordinate = state.next;
  // State contains the latest other factor: the second update uses NEW m1.
  mean[coordinate] = state.rho * mean[1 - coordinate];
  const kl = gaussianKL(state.rho, mean, state.variance);
  return {...state, mean, next: 1 - coordinate, updates: state.updates + 1, path: [...state.path, mean], history: [...state.history, kl], kl};
}
export function gaussianEllipse(covariance, mean = [0, 0], radius = 1, steps = 100) {
  const a = Math.sqrt(covariance[0][0]), b = covariance[1][0] / a, c = Math.sqrt(covariance[1][1] - b * b);
  if (![a, b, c, radius].every(Number.isFinite) || a <= 0 || c <= 0 || radius <= 0) throw new RangeError('Positive definite covariance required');
  return Array.from({length: steps + 1}, (_, i) => {
    const angle = 2 * Math.PI * i / steps, u = radius * Math.cos(angle), v = radius * Math.sin(angle);
    return [mean[0] + a * u, mean[1] + b * u + c * v];
  });
}
export function createRelativeElboSampler({rho = .8, seed = 312} = {}) {
  const d = determinant(rho), exact = .5 * Math.log(d);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be uint32');
  let state = seed >>> 0;
  // Mulberry32: deterministic open-interval uniforms; Box-Muller gives iid pairs.
  const uniform = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return (((n ^ (n >>> 14)) >>> 0) + .5) / 4294967296;
  };
  const values = [], sums = [0];
  return {
    at(count) {
      if (!Number.isInteger(count) || count < 1 || count > 1000000) throw new RangeError('Sample count must be between 1 and 1000000');
      while (values.length < count) {
        const r = Math.sqrt(-2 * Math.log(uniform())), angle = 2 * Math.PI * uniform();
        const e1 = r * Math.cos(angle), e2 = r * Math.sin(angle);
        // z_i=sqrt(d)*e_i under q*. log p(z|x)-log q*(z)=.5 log d+rho*e1*e2.
        const value = exact + rho * e1 * e2;
        values.push(value); sums.push(sums.at(-1) + value);
      }
      return {count, seed, rho, variance: d, exact, evidenceReference: 0, estimate: sums[count] / count, standardError: Math.abs(rho) / Math.sqrt(count), values: values.slice(0, count), means: sums.slice(1, count + 1).map((sum, i) => sum / (i + 1))};
    }
  };
}
