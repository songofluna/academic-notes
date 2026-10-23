import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { bananaContour, generateChain, log1, log2, normal, pdf1, rng } from '../demos/mh-kernel.mjs';

function near(actual, expected, tolerance, label = 'value') {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual}, expected ${expected} ± ${tolerance}`);
}

test('the deployed simulator module parses and imports the tested kernel', async () => {
  const html = await readFile(new URL('../demos/metropolis-hastings.html', import.meta.url), 'utf8');
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  assert.match(script, /import .* from '\.\/mh-kernel\.mjs'/);
  const result = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: script, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('multimodal density is normalized with the specified moments and stable tails', () => {
  let mass = 0, mean = 0, second = 0;
  const dx = .002;
  for (let x = -12 + dx / 2; x < 12; x += dx) {
    const p = pdf1(x) * dx;
    mass += p; mean += p * x; second += p * x * x;
  }
  near(mass, 1, 1e-10); near(mean, -.54, 1e-10);
  near(second, .38 * (9 + .6 ** 2) + .38 * .85 ** 2 + .24 * (2.5 ** 2 + .42 ** 2), 1e-10);
  assert.ok(Number.isFinite(log1(1000)) && log1(1000) < -100000);
  assert.ok(log1(2000) < log1(1000));
});

test('Box–Muller proposals have zero mean, unit variance and independent coordinates', () => {
  const random = rng(98231), n = 200000;
  let x = 0, y = 0, xx = 0, yy = 0, xy = 0;
  for (let i = 0; i < n; i++) {
    const a = normal(random), b = normal(random);
    x += a; y += b; xx += a * a; yy += b * b; xy += a * b;
  }
  near(x / n, 0, .01); near(y / n, 0, .01);
  near(xx / n, 1, .015); near(yy / n, 1, .015); near(xy / n, 0, .01);
});

for (const mode of ['density', 'banana']) {
  test(`${mode}: seeded chains preserve their prefix when extended`, () => {
    const short = generateChain({ mode, iterations: 100 });
    const long = generateChain({ mode, iterations: 10000 });
    for (const key of Object.keys(short)) {
      if (short[key]) assert.deepEqual(short[key], long[key].slice(0, 101));
    }
    assert.notDeepEqual(short.x, generateChain({ mode, seed: 2406, iterations: 100 }).x);
  });

  test(`${mode}: symmetric proposal, acceptance ratio, detailed balance and rejection state`, () => {
    const sigma = .9, c = generateChain({ mode, sigma, iterations: 10000 });
    // Independent direct-density formulas, deliberately not the kernel's log functions.
    const density = (x, y) => mode === 'density'
      ? [[.38, -3, .6], [.38, 0, .85], [.24, 2.5, .42]].reduce((p, [w, m, s]) => p + w / (Math.sqrt(2 * Math.PI) * s) * Math.exp(-((x - m) ** 2) / (2 * s * s)), 0)
      : Math.exp(-x * x / (2 * 1.65 ** 2) - (y - .2 * (x * x - 1.65 ** 2) - .15 * x) ** 2 / .5);
    const q = (a, b, ay = 0, by = 0) => Math.exp(-((a - b) ** 2 + (ay - by) ** 2) / (2 * sigma * sigma));
    let accepts = 0, rejects = 0, dx = 0, dx2 = 0, dy = 0, dy2 = 0, dxy = 0;
    for (let t = 1; t < c.x.length; t++) {
      const oldX = c.x[t - 1], oldY = c.y?.[t - 1] ?? 0;
      const xp = c.proposedX[t], yp = c.proposedY?.[t] ?? 0;
      const pOld = density(oldX, oldY), pNew = density(xp, yp);
      const alpha = Math.min(1, pNew / pOld);
      near(c.alpha[t], alpha, 1e-12, 'acceptance probability');
      const accepted = c.uDraw[t] < alpha;
      assert.equal(c.accepted[t], Number(accepted));
      assert.equal(c.x[t], accepted ? xp : oldX);
      if (c.y) assert.equal(c.y[t], accepted ? yp : oldY);
      accepts += Number(accepted); rejects += Number(!accepted);
      assert.equal(c.acceptCount[t], accepts);
      assert.equal(q(xp, oldX, yp, oldY), q(oldX, xp, oldY, yp));
      near(pOld * q(xp, oldX, yp, oldY) * alpha, pNew * q(oldX, xp, oldY, yp) * Math.min(1, pOld / pNew), 1e-12, 'detailed balance');
      const a = xp - oldX, b = yp - oldY;
      dx += a; dx2 += a * a; dy += b; dy2 += b * b; dxy += a * b;
    }
    assert.ok(accepts > 0 && rejects > 0);
    near(dx / 10000, 0, .04); near(dx2 / 10000, sigma ** 2, .05);
    if (c.y) { near(dy / 10000, 0, .04); near(dy2 / 10000, sigma ** 2, .05); near(dxy / 10000, 0, .04); }
  });
}

test('banana contours are exact constant-density curves', () => {
  for (const r of [.7, 1.4, 2.1, 2.8]) {
    for (let i = 0; i < 240; i++) near(log2(...bananaContour(r, 2 * Math.PI * i / 240)), -r * r / 2, 1e-12);
  }
});

test('long MH runs recover independently derived target moments and mode masses', t => {
  const report = {};
  for (const mode of ['density', 'banana']) {
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, se = 0, see = 0, sxe = 0;
    let accepted = 0, left = 0, middle = 0, right = 0;
    for (const seed of [11, 104, 2405, 5099, 8101, 19842, 39811, 78104]) {
      const c = generateChain({ mode, seed, iterations: 100000 });
      accepted += c.acceptCount[100000] - c.acceptCount[10000];
      for (let i = 10001; i <= 100000; i++) {
        const x = c.x[i], y = c.y?.[i] ?? 0, e = y - .2 * (x * x - 2.7225) - .15 * x;
        n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
        se += e; see += e * e; sxe += x * e;
        if (x < -1.5) left++; else if (x < 1.25) middle++; else right++;
      }
    }
    const mx = sx / n, my = sy / n, vx = sxx / n - mx * mx, vy = syy / n - my * my, cov = sxy / n - mx * my;
    if (mode === 'density') {
      near(mx, -.54, .07, 'mixture mean'); near(vx, 5.082086, .16, 'mixture variance');
      // Compute target region masses by quadrature, independently of the sampler.
      const expected = [0, 0, 0];
      for (let x = -12 + .001; x < 12; x += .002) expected[x < -1.5 ? 0 : x < 1.25 ? 1 : 2] += pdf1(x) * .002;
      [left, middle, right].forEach((count, i) => near(count / n, expected[i], .015, 'mode region mass'));
      report[mode] = { samples: n, mean: mx, variance: vx, regionMasses: [left / n, middle / n, right / n], expectedRegionMasses: expected, acceptance: accepted / n };
    } else {
      // X~N(0,1.65²), E~N(0,.5²), Y=.2(X²-1.65²)+.15X+E.
      near(mx, 0, .08, 'banana mean X'); near(my, 0, .04, 'banana mean Y');
      near(vx, 2.7225, .15, 'banana variance X');
      near(vy, .08 * 2.7225 ** 2 + .0225 * 2.7225 + .25, .09, 'banana variance Y');
      near(cov, .15 * 2.7225, .08, 'banana covariance');
      near(se / n, 0, .015, 'latent residual mean'); near(see / n, .25, .015, 'latent residual second moment');
      near(sxe / n, 0, .025, 'latent X-residual cross moment');
      report[mode] = { samples: n, meanX: mx, meanY: my, varianceX: vx, varianceY: vy, covariance: cov, residualMean: se / n, residualSecondMoment: see / n, acceptance: accepted / n };
    }
  }
  t.diagnostic(JSON.stringify(report));
});

test('small proposals exhibit slow mixing despite high acceptance', () => {
  const jump = sigma => {
    const c = generateChain({ mode: 'banana', sigma, iterations: 20000 });
    let sum = 0;
    for (let i = 1; i < c.x.length; i++) sum += (c.x[i] - c.x[i - 1]) ** 2 + (c.y[i] - c.y[i - 1]) ** 2;
    return { esjd: sum / 20000, rate: c.acceptCount[20000] / 20000 };
  };
  const small = jump(.15), medium = jump(.65);
  assert.ok(small.rate > medium.rate && small.esjd < medium.esjd / 3);
});
