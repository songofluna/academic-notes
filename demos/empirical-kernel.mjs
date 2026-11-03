// Uniformly select observation indices; repeated values retain their multiplicity.
export function createEmpiricalSampler(observations, seed = 1304) {
  if (!Array.isArray(observations) || !observations.length || !observations.every(Number.isFinite)) {
    throw new TypeError('A nonempty array of finite observations is required.');
  }
  const data = [...observations];
  const masses = new Map();
  for (const x of data) masses.set(x, (masses.get(x) || 0) + 1);
  let state = seed >>> 0;
  const samples = [];
  const uniform = () => {
    let t = state = (state + 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    at(count) {
      if (!Number.isInteger(count) || count < 0 || count > 100000) throw new RangeError('Invalid draw count.');
      while (samples.length < count) samples.push(data[Math.floor(uniform() * data.length)]);
      const counts = new Map([...masses.keys()].map(x => [x, 0]));
      let sum = 0;
      for (let i = 0; i < count; i++) {
        counts.set(samples[i], counts.get(samples[i]) + 1);
        sum += samples[i];
      }
      return {
        count,
        samples: samples.slice(0, count),
        mean: count ? sum / count : null,
        last: count ? samples[count - 1] : null,
        distribution: [...masses].sort(([a], [b]) => a - b).map(([value, n]) => ({
          value, mass: n / data.length, count: counts.get(value),
          frequency: count ? counts.get(value) / count : null
        }))
      };
    }
  };
}
