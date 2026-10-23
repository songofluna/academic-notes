// Shared by the live simulator and the Node tests. No DOM or plotting code.
export const components = [
  { w: .38, mu: -3, sd: .6 },
  { w: .38, mu: 0, sd: .85 },
  { w: .24, mu: 2.5, sd: .42 },
];

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function normal(random) {
  let u = 0, v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function log1(x) {
  // Log-sum-exp preserves the actual Gaussian tails without a density floor.
  const terms = components.map(c => Math.log(c.w / (Math.sqrt(2 * Math.PI) * c.sd)) - .5 * ((x - c.mu) / c.sd) ** 2);
  const largest = Math.max(...terms);
  return largest + Math.log(terms.reduce((sum, term) => sum + Math.exp(term - largest), 0));
}

export const pdf1 = x => Math.exp(log1(x));
export const bananaCenter = x => .20 * (x * x - 1.65 ** 2) + .15 * x;
export const log2 = (x, y) => -.5 * (x / 1.65) ** 2 - .5 * ((y - bananaCenter(x)) / .50) ** 2;

// Transform a circle in the latent standard normal coordinates. Each path is
// an exact equal-density contour: log pi(x,y) = -radius^2 / 2 + constant.
export function bananaContour(radius, angle) {
  const x = 1.65 * radius * Math.cos(angle);
  return [x, bananaCenter(x) + .50 * radius * Math.sin(angle)];
}

export function generateChain({ mode = 'density', sigma = mode === 'banana' ? .65 : 1.4, seed = 2405, iterations = 12000 } = {}) {
  if (!['density', 'banana'].includes(mode)) throw new Error('Unknown target distribution');
  if (!Number.isFinite(sigma) || sigma <= 0) throw new Error('Proposal scale must be positive');
  if (!Number.isInteger(iterations) || iterations < 0) throw new Error('Iterations must be a nonnegative integer');
  const random = rng(seed + (mode === 'banana' ? 104729 : 0));
  const n = iterations + 1;
  const x = new Float64Array(n), y = mode === 'banana' ? new Float64Array(n) : null;
  const proposedX = new Float64Array(n), proposedY = y ? new Float64Array(n) : null;
  const accepted = new Uint8Array(n), acceptCount = new Uint32Array(n);
  const alpha = new Float64Array(n), uDraw = new Float64Array(n);
  x[0] = y ? -3.8 : -4.95;
  if (y) y[0] = 2.2;
  let currentLog = y ? log2(x[0], y[0]) : log1(x[0]);
  for (let t = 1; t <= iterations; t++) {
    // Fixed isotropic Gaussian random walk: q(new|old) = q(old|new).
    const xp = x[t - 1] + sigma * normal(random);
    const yp = y ? y[t - 1] + sigma * normal(random) : 0;
    proposedX[t] = xp;
    if (y) proposedY[t] = yp;
    const nextLog = y ? log2(xp, yp) : log1(xp);
    const logAlpha = Math.min(0, nextLog - currentLog);
    const u = random();
    const didAccept = Math.log(u) < logAlpha;
    alpha[t] = Math.exp(logAlpha); uDraw[t] = u;
    accepted[t] = Number(didAccept);
    acceptCount[t] = acceptCount[t - 1] + accepted[t];
    // Rejections are samples too: never drop the repeated current state.
    x[t] = didAccept ? xp : x[t - 1];
    if (y) y[t] = didAccept ? yp : y[t - 1];
    if (didAccept) currentLog = nextLog;
  }
  return { x, y, proposedX, proposedY, accepted, acceptCount, alpha, uDraw };
}
