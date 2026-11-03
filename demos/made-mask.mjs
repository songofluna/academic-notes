// Single hidden layer, natural input order; Germain et al. (2015), equations 8–9.
export function madeMasks(degrees = [1, 2, 3], selected = 3) {
  if (degrees.length !== 3 || !degrees.every(m => Number.isInteger(m) && m >= 1 && m <= 3)) {
    throw new RangeError('Three hidden degrees from 1 to 3 are required');
  }
  if (!Number.isInteger(selected) || selected < 1 || selected > 4) throw new RangeError('Output must be 1–4');
  const input = degrees.map(m => Array.from({ length: 4 }, (_, j) => Number(j + 1 <= m)));
  const output = Array.from({ length: 4 }, (_, i) => degrees.map(m => Number(m < i + 1)));
  const paths = [];
  for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) {
    if (input[k][j] && output[selected - 1][k]) paths.push({ input: j + 1, hidden: k + 1, output: selected });
  }
  return { input, output, paths, inputs: [...new Set(paths.map(p => p.input))].sort((a, b) => a - b) };
}
