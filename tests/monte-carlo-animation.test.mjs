import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createMonteCarloSeSampler, sampleSummary } from '../demos/sampling-kernel.mjs';
const close = (a, b, tolerance = 1e-11) => assert.ok(Math.abs(a-b) < tolerance, `${a} != ${b}`);

test('one sample has a mean and theoretical SE, but no estimated variance, MCSE or CI', () => {
  const sampler = createMonteCarloSeSampler(403), one = sampler.at(1);
  assert.equal(one.values.length, 1); assert.equal(one.mean, one.values[0]);
  assert.equal(one.variance, null); assert.equal(one.mcse, null); assert.equal(one.interval, null);
  close(one.theoreticalSe, Math.sqrt(2));
  assert.deepEqual(sampler.at(2).values.slice(0, 1), one.values);
  sampler.at(10000); assert.deepEqual(sampler.at(1), one);
  assert.throws(() => sampler.at(0), RangeError);
  assert.throws(() => sampleSummary([one.mean]), RangeError);
});

test('rewinding and incremental playback reproduce exactly the same prefixes', () => {
  const streamed = createMonteCarloSeSampler(137), direct = createMonteCarloSeSampler(137).at(10000);
  for (const count of [1,2,10,100,999,10000,100,2,1,10000]) {
    const actual = streamed.at(count);
    assert.deepEqual(actual.values, direct.values.slice(0,count));
    assert.deepEqual(actual.means, direct.means.slice(0,count));
    if (count > 1) {
      const independent = sampleSummary(actual.values);
      close(actual.mcse, independent.mcse); assert.deepEqual(actual.interval, independent.interval);
    }
  }
});

test('independent seeds recover mean 1 and estimator variance 2/S', () => {
  const count = 200, repeats = 1024;
  let mean = 0, squaredError = 0, estimatedVariance = 0;
  for (let seed = 0; seed < repeats; seed++) {
    const s = createMonteCarloSeSampler(seed).at(count);
    mean += s.mean/repeats; squaredError += (s.mean-1)**2/repeats;
    estimatedVariance += s.mcse**2/repeats;
  }
  close(mean, 1, .015); close(squaredError, 2/count, .002);
  close(estimatedVariance, 2/count, .001);
});

// Run the actual demo controller with a deterministic animation clock.
async function controller() {
  const html = await readFile(new URL('../demos/monte-carlo-se.html', import.meta.url),'utf8');
  const source = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm,'');
  const nodes = new Map([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,{
    value: id==='speed'?'250':'1', textContent:'', hidden:false, disabled:false, clientWidth:640,
    attributes:{}, handlers:{}, validity:{valid:true}, setAttribute(key,value){this.attributes[key]=String(value);},
    addEventListener(name,fn){this.handlers[name]=fn;}
  }]));
  const events = {}, frames = new Map(); let frameId=0;
  const document = {hidden:false,getElementById:id=>nodes.get(id),querySelector:()=>({}),addEventListener:(event,fn)=>events[event]=fn};
  runInNewContext(source, {
    document, window:{addEventListener(){}}, createMonteCarloSeSampler,
    samplingSize(){}, samplingNumber:n=>n.toFixed(4),
    requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},
    cancelAnimationFrame:id=>frames.delete(id),
    ResizeObserver:class{observe(){}},
    crypto:{getRandomValues:array=>{array[0]=403;return array;}}
  });
  return {
    node:id=>nodes.get(id),
    emit(id,event,value){const node=nodes.get(id);if(value!==undefined)node.value=value;node.handlers[event]({target:node});},
    step(time){const active=[...frames.values()];frames.clear();active.forEach(fn=>fn(time));},
    hide(){document.hidden=true;events.visibilitychange();},
    pending:()=>frames.size,
    values:()=>['mean','mcse','theory','interval'].map(id=>nodes.get(id).textContent)
  };
}

test('Play/Pause/speed/end and background suspension advance only elapsed playback time', async () => {
  const c = await controller();
  assert.equal(c.node('mcse').textContent, '—'); assert.equal(c.node('ci').attributes.d,'');
  assert.ok(c.node('pause').disabled); assert.equal(c.node('single-sample').hidden,false);
  c.emit('play','click'); c.step(0); c.step(1000);
  assert.equal(Number(c.node('count').value),251);
  c.emit('pause','click'); const paused=c.values(); c.step(5000);
  assert.deepEqual(c.values(),paused); assert.equal(c.pending(),0);
  c.emit('play','click'); c.step(6000); c.step(7000);
  assert.equal(Number(c.node('count').value),501);
  c.emit('speed','change','1000'); c.step(7100); c.step(8100);
  assert.equal(Number(c.node('count').value),1501);
  c.hide(); c.step(100000);
  assert.equal(Number(c.node('count').value),1501); assert.equal(c.pending(),0);
  c.emit('play','click'); c.step(100000); c.step(120000);
  assert.equal(Number(c.node('count').value),10000);
  assert.ok(c.node('play').disabled); assert.ok(c.node('pause').disabled); assert.equal(c.pending(),0);
});

test('seeking and Restart retain the seed; New seed resets to a different reproducible series', async () => {
  const c = await controller(), initial=c.values();
  c.emit('count-value','input','100'); const short=c.values(), path=c.node('trace').attributes.d;
  c.emit('count-value','change','10000');
  c.emit('count','input','100'); assert.deepEqual(c.values(),short); assert.equal(c.node('trace').attributes.d,path);
  c.emit('restart','click'); assert.deepEqual(c.values(),initial); assert.equal(c.node('seed').textContent,403);
  assert.equal(c.node('single-sample').hidden,false); assert.equal(c.node('ci').attributes.d,'');
  c.emit('new-seed','click'); assert.equal(c.node('seed').textContent,404); assert.notDeepEqual(c.values(),initial);
  c.emit('count-value','change','100'); const other=c.values();
  close(Number(c.node('mean').textContent),createMonteCarloSeSampler(404).at(100).mean,.000051);
  c.emit('restart','click'); c.emit('count-value','change','100'); assert.deepEqual(c.values(),other);
  for (const id of ['trace','ci','band','target']) assert.doesNotMatch(c.node(id).attributes.d,/NaN|Infinity/);
});
