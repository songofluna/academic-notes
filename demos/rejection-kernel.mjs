import { rng } from './mh-kernel.mjs';

function validEnvelope(k) {
  if (!Number.isFinite(k) || k < 2 || k > 5) throw new RangeError('Envelope k must be between 2 and 5');
}
export function triangularDensity(z) {
  if (!Number.isFinite(z)) throw new RangeError('Finite z required');
  return Math.max(0, 1 - Math.abs(z));
}
export function rejectionCandidate(z, u, k) {
  validEnvelope(k);
  if (!Number.isFinite(z) || Math.abs(z) > 1 || !Number.isFinite(u) || u < 0 || u > 1) throw new RangeError('Invalid proposal or uniform height');
  const density = triangularDensity(z), envelope = k / 2, h = u * envelope;
  return {z, u, h, density, envelope, probability: density / envelope, accepted: h <= density};
}
export function createRejectionSampler({k = 2, seed = 404, bins = 20, recentLimit = 160} = {}) {
  validEnvelope(k);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be uint32');
  if (!Number.isInteger(bins) || bins < 2 || bins > 200 || !Number.isInteger(recentLimit) || recentLimit < 1 || recentLimit > 1000) throw new RangeError('Invalid display limits');
  const random = rng(seed), counts = Array(bins).fill(0), recent = Array(recentLimit);
  const binWidth = 2 / bins;
  let proposals = 0, accepted = 0, sum = 0, sumSquares = 0;
  function snapshot() {
    const length = Math.min(proposals, recentLimit), start = proposals - length;
    return {k, seed, proposals, accepted, rate: proposals ? accepted / proposals : null, theoreticalRate: 1 / k,
      mean: accepted ? sum / accepted : null, secondMoment: accepted ? sumSquares / accepted : null,
      binWidth, counts: [...counts], density: counts.map(n => accepted ? n / (accepted * binWidth) : 0),
      recent: Array.from({length}, (_, i) => ({...recent[(start + i) % recentLimit]}))};
  }
  return {snapshot, advance(amount = 1) {
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1000000 || !Number.isSafeInteger(proposals + amount)) throw new RangeError('Invalid proposal count');
    for (let i = 0; i < amount; i++) {
      const point = rejectionCandidate(2 * random() - 1, random(), k);
      proposals++;
      recent[(proposals - 1) % recentLimit] = {...point, index: proposals};
      if (point.accepted) {
        accepted++; sum += point.z; sumSquares += point.z ** 2;
        counts[Math.min(bins - 1, Math.floor((point.z + 1) / binWidth))]++;
      }
    }
    return snapshot();
  }};
}
