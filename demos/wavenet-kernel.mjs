export function dilatedGraph(dilations = [1,2,4,8]) {
  if (!Array.isArray(dilations) || dilations.length < 1 || dilations.length > 10 ||
      dilations.some(d => !Number.isInteger(d) || d < 1 || d > 512)) {
    throw new RangeError('Invalid dilation schedule');
  }
  const layers = dilations.length;
  const nodes = Array.from({length:layers+1}, () => []);
  const edges = [];
  nodes[layers] = [0];
  for (let layer = layers; layer > 0; layer--) {
    const previous = new Set();
    for (const offset of nodes[layer]) {
      for (const source of [offset, offset + dilations[layer-1]]) {
        previous.add(source);
        edges.push({layer, offset, source});
      }
    }
    nodes[layer-1] = [...previous].sort((a,b) => a-b);
  }
  const span = 1 + dilations.reduce((sum,d) => sum+d, 0);
  // Feature offset 0 is fed x_(t−1), because the raw sequence is shifted first.
  const lags = nodes[0].map(offset => offset+1);
  return {dilations:[...dilations], layers, span, lags, nodes, edges,
    gaps:Array.from({length:span}, (_,i) => i+1).filter(lag => !lags.includes(lag))};
}
