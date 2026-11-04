export function jensenLog(y1, y2, t) {
  if (![y1, y2, t].every(Number.isFinite) || y1 <= 0 || y2 <= 0 || t < 0 || t > 1) throw new RangeError('Positive points and a weight in [0,1] required');
  const mean = t * y1 + (1 - t) * y2;
  const logMean = Math.log(mean), meanLog = t * Math.log(y1) + (1 - t) * Math.log(y2);
  return {y1, y2, t, mean, logMean, meanLog, gap: Math.max(0, logMean - meanLog)};
}
