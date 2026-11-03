function validate(target, size) {
  if (!Number.isInteger(size) || size < 1 || size > 20 ||
      !Number.isInteger(target) || target < 0 || target >= size * size) {
    throw new RangeError('Invalid target or grid size');
  }
}

export function allowedContext(target = 12, size = 5) {
  validate(target, size);
  const row = Math.floor(target / size);
  const vertical = Array.from({ length: row * size }, (_, i) => i);
  const horizontal = Array.from({ length: target % size }, (_, c) => row * size + c);
  return { target, size, vertical, horizontal, combined: [...vertical, ...horizontal] };
}

// A concrete top-aligned 2×3 convolution: rows r−1,r; columns c−1,c,c+1.
// Out-of-image inputs are zero padding and carry no dependency.
function verticalInputs(row, col, size) {
  if (row < 0) return [];
  const inputs = [];
  for (const dr of [-1, 0]) for (const dc of [-1, 0, 1]) {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r < size && c >= 0 && c < size) inputs.push(r * size + c);
  }
  return inputs;
}

export function shiftExample(target = 12, size = 5) {
  validate(target, size);
  const row = Math.floor(target / size), col = target % size;
  const before = verticalInputs(row, col, size);
  const after = verticalInputs(row - 1, col, size);
  // First raw-input horizontal layer: strict-left Mask A in a 1×3 kernel.
  const horizontal = col > 0 ? [target - 1] : [];
  const finalInputs = [...new Set([...after, ...horizontal])].sort((a, b) => a - b);
  return { target, size, row, col, before, after, horizontal, finalInputs,
    beforeLeaks: before.filter(i => i >= target),
    afterLeaks: finalInputs.filter(i => i >= target),
    sourceRow: row - 1 };
}
