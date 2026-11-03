import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { allowedContext, shiftExample } from '../demos/gated-pixelcnn-kernel.mjs';

test('theoretical context partitions the full past, including the upper-right region', () => {
  const state = allowedContext(12);
  assert.deepEqual(state.vertical, [0,1,2,3,4,5,6,7,8,9]);
  assert.deepEqual(state.horizontal, [10,11]);
  for (let target = 0; target < 25; target++) {
    const s = allowedContext(target);
    assert.deepEqual(s.combined, Array.from({ length: target }, (_, i) => i));
    assert.ok(s.vertical.every(i => Math.floor(i/5) < Math.floor(target/5)));
    assert.ok(s.horizontal.every(i => Math.floor(i/5) === Math.floor(target/5) && i < target));
  }
  for (let target = 0; target < 5; target++) assert.deepEqual(allowedContext(target).vertical, []);
});

test('default shift example exposes m,n before alignment and only past inputs afterwards', () => {
  const s = shiftExample(12);
  assert.deepEqual(s.before, [6,7,8,11,12,13]);
  assert.deepEqual(s.beforeLeaks, [12,13]);
  assert.deepEqual(s.after, [1,2,3,6,7,8]);
  assert.deepEqual(s.horizontal, [11]);
  assert.deepEqual(s.finalInputs, [1,2,3,6,7,8,11]);
  assert.deepEqual(s.afterLeaks, []);
});

test('shift dependencies agree with independent forward convolution and zero-padded shift for every target', () => {
  for (let size = 1; size <= 8; size++) {
    const count = size * size;
    const before = Array.from({ length: count }, () => []);
    const shifted = Array.from({ length: count }, () => []);
    const combined = Array.from({ length: count }, () => []);
    for (let source = 0; source < count; source++) {
      const input = Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => Number(r*size+c === source)));
      const v = input.map((row, r) => row.map((_, c) => {
        let value = 0;
        for (let rr = r-1; rr <= r; rr++) for (let cc = c-1; cc <= c+1; cc++) value += input[rr]?.[cc] ?? 0;
        return value;
      }));
      for (let target = 0; target < count; target++) {
        const r = Math.floor(target / size), c = target % size;
        const aligned = r === 0 ? 0 : v[r-1][c];
        const h = c === 0 ? 0 : input[r][c-1];
        if (v[r][c] > 0) before[target].push(source);
        if (aligned > 0) shifted[target].push(source);
        if (aligned+h > 0) combined[target].push(source);
      }
    }
    for (let target = 0; target < count; target++) {
      const s = shiftExample(target, size);
      assert.deepEqual(s.before, before[target]);
      assert.deepEqual(s.after, shifted[target]);
      assert.deepEqual(s.finalInputs, combined[target]);
      assert.ok(s.finalInputs.every(i => i < target));
      assert.deepEqual(s.afterLeaks, []);
      if (target < size) assert.deepEqual(s.after, []);
    }
  }
});

test('invalid targets and grid sizes are rejected', () => {
  for (const args of [[-1,5],[25,5],[1.5,5],[0,0],[0,1.5],[0,21]]) {
    assert.throws(() => allowedContext(...args), RangeError);
    assert.throws(() => shiftExample(...args), RangeError);
  }
});

test('two-stack shortcode is lazy, can occur in articles, and stays literal inside fences', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const helper = app.slice(app.indexOf('  function gatedPixelcnnDemoHtml('), app.indexOf('  function experimentHtml('));
  const renderer = app.slice(app.indexOf('  function inlineMd('), app.indexOf('  function latex('));
  const markdown = runInNewContext(`${helper}\n${renderer}\nmarkdown`, { esc: String, safeUrl: x => x, mediaUrl: x => x });
  const { html } = markdown('[demo:gated-pixelcnn-stacks]');
  assert.match(html, /data-gated-pixelcnn-demo/);
  assert.match(html, /data-src="demos\/gated-pixelcnn-stacks.html"/);
  assert.doesNotMatch(html, /(?:^|\s)src=/);
  assert.doesNotMatch(markdown('```\n[demo:gated-pixelcnn-stacks]\n```').html, /data-gated-pixelcnn-demo/);
});
