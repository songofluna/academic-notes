export const samplingSize = () => parent.postMessage({type:'academic-notes:sampling-resize',height:Math.ceil(document.body.getBoundingClientRect().height)}, location.origin === 'null' ? '*' : location.origin);
export const samplingNumber = value => Math.abs(value) < .00005 ? '0.0000' : value.toFixed(4);
export function samplingIndices(count, maximum = 400, logarithmic = false) {
  const length = Math.min(count, maximum);
  return [...new Set(Array.from({length}, (_, i) => logarithmic ? Math.round(Math.exp(Math.log(count) * i / Math.max(1, length - 1))) : Math.round(1 + (count - 1) * i / Math.max(1, length - 1))))];
}
export function samplingPlot(svg, options) {
  const {xmin, xmax, ymin, ymax, xTicks, yTicks, series = [], references = [], bars = [], points = [], interval, logX = false, xLabel = '', yLabel = ''} = options;
  const height = Number(svg.getAttribute('viewBox').split(' ')[3]), left = 58, right = 449, top = 23, bottom = height - 44;
  const transform = x => logX ? Math.log10(x) : x;
  const sx = x => left + (transform(x) - transform(xmin)) / (transform(xmax) - transform(xmin)) * (right - left);
  const sy = y => bottom - (y - ymin) / (ymax - ymin) * (bottom - top);
  const tick = value => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/,'');
  let marks = yTicks.map(y => `<line x1="${left}" x2="${right}" y1="${sy(y)}" y2="${sy(y)}" stroke="#e7ece2"/><text x="${left-9}" y="${sy(y)+6}" text-anchor="end">${tick(y)}</text>`).join('');
  marks += xTicks.map(x => `<text x="${sx(x)}" y="${bottom+24}" text-anchor="middle">${x >= 1000 ? x/1000+'k' : tick(x)}</text>`).join('');
  marks += references.map(({value,color='#677062',dashed=true}) => `<line x1="${left}" x2="${right}" y1="${sy(value)}" y2="${sy(value)}" stroke="${color}" stroke-width="2" ${dashed?'stroke-dasharray="7 5"':''}/>`).join('');
  marks += bars.map(([x,y]) => `<line x1="${sx(x)}" x2="${sx(x)}" y1="${sy(0)}" y2="${sy(y)}" stroke="#70944d" stroke-width="6"/>`).join('');
  marks += series.map(({values,color='#70944d',dashed=false,width=2.5}) => `<path d="${values.map(([x,y],i)=>`${i?'L':'M'}${sx(x)},${sy(y)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dashed?'stroke-dasharray="7 5"':''}/>`).join('');
  if (interval) {const x=sx(interval.x), y1=sy(interval.lower), y2=sy(interval.upper);marks+=`<path d="M${x},${y1}L${x},${y2}M${x-5},${y1}H${x+5}M${x-5},${y2}H${x+5}" stroke="#a77441" stroke-width="2" fill="none"/>`;}
  marks += points.map(([x,y])=>`<circle cx="${sx(x)}" cy="${sy(y)}" r="4" fill="#70944d"/>`).join('');
  marks += `<text x="${left}" y="16">${yLabel}</text><text x="253" y="${height-4}" text-anchor="middle">${xLabel}</text>`;
  svg.innerHTML = `<g font-family="sans-serif" font-size="17" fill="#60665c">${marks}</g>`;
}
