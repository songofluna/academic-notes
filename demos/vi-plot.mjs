import { gaussianEllipse } from './vi-gaussian-kernel.mjs';
export const viFormat = value => Math.abs(value) < .00005 ? '0.0000' : value.toFixed(4);
export const reportViSize = () => parent.postMessage({type:'academic-notes:vi-resize',height:Math.ceil(document.body.getBoundingClientRect().height)}, location.origin === 'null' ? '*' : location.origin);
export function plotGaussian(svg, {rho, covariance, mean = [0, 0], path = []}) {
  const sx = x => 240 + 52 * x, sy = y => 185 - 52 * y;
  let marks = [-2, -1, 0, 1, 2].map(t => `<line x1="84" x2="396" y1="${sy(t)}" y2="${sy(t)}" stroke="#edf0e9"/><line x1="${sx(t)}" x2="${sx(t)}" y1="29" y2="341" stroke="#edf0e9"/><text x="${sx(t)}" y="365" text-anchor="middle">${t}</text><text x="70" y="${sy(t)+6}" text-anchor="end">${t}</text>`).join('');
  const contour = (cov, center, color, dashed, width) => [1, 2].map(radius => `<path d="${gaussianEllipse(cov, center, radius).map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x)},${sy(y)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dashed ? 'stroke-dasharray="7 5"' : ''}/>`).join('');
  marks += contour(covariance, mean, '#70944d', false, 3.5);
  marks += contour([[1, rho], [rho, 1]], [0, 0], '#59625b', true, 2);
  if (path.length) marks += `<polyline points="${path.map(([x,y]) => `${sx(x)},${sy(y)}`).join(' ')}" fill="none" stroke="#a77441" stroke-width="2.5"/>` + path.map(([x,y]) => `<circle cx="${sx(x)}" cy="${sy(y)}" r="3" fill="#a77441"/>`).join('');
  marks += `<circle cx="${sx(mean[0])}" cy="${sy(mean[1])}" r="5" fill="#70944d"/><text x="414" y="365">z₁</text><text x="66" y="17">z₂</text>`;
  svg.innerHTML = `<g font-family="sans-serif" font-size="18" fill="#60665c">${marks}</g>`;
}
