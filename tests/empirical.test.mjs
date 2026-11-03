import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmpiricalSampler } from '../demos/empirical-kernel.mjs';

test('resampling preserves duplicate-observation mass and never invents data values', () => {
  const state = createEmpiricalSampler([-1, 0, 0, 2], 1304).at(100000);
  assert.deepEqual(state.distribution.map(d=>d.mass), [.25, .5, .25]);
  assert.equal(state.distribution.reduce((s,d)=>s+d.count,0), state.count);
  assert.ok(state.samples.every(x=>[-1,0,2].includes(x)));
  for (const d of state.distribution) assert.ok(Math.abs(d.frequency-d.mass)<.01);
  assert.ok(Math.abs(state.mean-.25)<.02);
});

test('draw-count changes show the same sample prefix; reset seed reproduces it', () => {
  const sampler = createEmpiricalSampler([-1,0,0,2],1304);
  const first = sampler.at(10), later = sampler.at(1000);
  assert.deepEqual(later.samples.slice(0,10),first.samples);
  assert.deepEqual(sampler.at(10),first);
  assert.deepEqual(sampler.at(1000),later);
  assert.deepEqual(createEmpiricalSampler([-1,0,0,2],1304).at(1000),later);
  assert.notDeepEqual(createEmpiricalSampler([-1,0,0,2],1305).at(1000).samples,later.samples);
});

test('zero draws and a point mass have exact meaningful summaries', () => {
  const sampler=createEmpiricalSampler([7,7,7]);
  assert.equal(sampler.at(0).mean,null);
  assert.equal(sampler.at(0).last,null);
  const state=sampler.at(20);
  assert.equal(state.mean,7);
  assert.deepEqual(state.distribution,[{value:7,mass:1,count:20,frequency:1}]);
  assert.throws(()=>sampler.at(-1),RangeError);
  assert.throws(()=>sampler.at(1.5),RangeError);
});
