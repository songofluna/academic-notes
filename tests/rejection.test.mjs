import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { triangularDensity, rejectionCandidate, createRejectionSampler } from '../demos/rejection-kernel.mjs';
const close = (a,b,tolerance=1e-12) => assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);

test('the triangular density integrates to one and k >= 2 envelopes it', () => {
  let integral=0;
  for(let i=0;i<4000;i++) integral+=(triangularDensity(-1+i/2000)+triangularDensity(-1+(i+1)/2000))/4000;
  close(integral,1); assert.equal(triangularDensity(-2),0); assert.equal(triangularDensity(2),0);
  for(const k of [2,2.1,3,4,5]) for(let i=0;i<=200;i++) {
    const z=-1+i/100, p=triangularDensity(z);
    assert.ok(p<=k/2);
    for(const u of [0,.1,.5,.9,1]) {
      const point=rejectionCandidate(z,u,k);
      close(point.probability,2*p/k); close(point.h,u*k/2);
      assert.equal(point.accepted,u<=point.probability);
    }
  }
  assert.equal(createRejectionSampler({k:2}).snapshot().theoreticalRate,.5);
  assert.equal(createRejectionSampler({k:4}).snapshot().theoreticalRate,.25);
});

test('observed rates and accepted samples match the same triangular target at k=2 and k=4', () => {
  const cdf=z=>z<=0?(z+1)**2/2:1-(1-z)**2/2;
  for(const k of [2,4]) {
    const s=createRejectionSampler({k,seed:404}).advance(200000);
    const se=Math.sqrt((1/k)*(1-1/k)/s.proposals);
    close(s.rate,1/k,6*se);
    close(s.mean,0,.007); close(s.secondMoment,1/6,.003);
    let chiSquared=0, cumulative=0;
    for(let i=0;i<s.counts.length;i++) {
      const lo=-1+i*s.binWidth, hi=lo+s.binWidth, expected=s.accepted*(cdf(hi)-cdf(lo));
      chiSquared+=(s.counts[i]-expected)**2/expected; cumulative+=s.counts[i]/s.accepted;
      close(cumulative,cdf(hi),.015);
    }
    assert.ok(chiSquared<60,`k=${k}, chi squared=${chiSquared}`);
    assert.equal(s.counts.reduce((a,b)=>a+b,0),s.accepted);
    close(s.density.reduce((a,b)=>a+b,0)*s.binWidth,1);
    assert.equal(s.recent.length,160); assert.equal(s.recent[0].index,s.proposals-159);
  }
});

test('only accepted candidates enter histogram bins and seeded batches reproduce steps', () => {
  const sampler=createRejectionSampler({recentLimit:100}), counts=Array(20).fill(0);
  let accepted=0;
  for(let i=0;i<100;i++) {
    const s=sampler.advance(), last=s.recent.at(-1);
    if(last.accepted){accepted++;counts[Math.min(19,Math.floor((last.z+1)/.1))]++;}
    assert.equal(s.accepted,accepted); assert.deepEqual(s.counts,counts);
  }
  assert.deepEqual(sampler.snapshot(),createRejectionSampler({recentLimit:100}).advance(100));
  const a=createRejectionSampler({k:2}).advance(100), b=createRejectionSampler({k:4}).advance(100);
  assert.deepEqual(a.recent.map(p=>[p.z,p.u]),b.recent.map(p=>[p.z,p.u]));
  assert.ok(b.accepted<=a.accepted);
  assert.notDeepEqual(a.recent,createRejectionSampler({seed:405}).advance(100).recent);
});

test('empty state has no estimated rate and invalid settings cannot bypass the envelope', () => {
  const s=createRejectionSampler().snapshot();
  assert.equal(s.rate,null); assert.equal(s.mean,null); assert.deepEqual(s.recent,[]);
  assert.ok(s.density.every(n=>n===0));
  for(const k of [0,1.99,5.1,NaN,Infinity]) assert.throws(()=>createRejectionSampler({k}),RangeError);
  for(const seed of [-1,.5,2**32]) assert.throws(()=>createRejectionSampler({seed}),RangeError);
  for(const amount of [-1,.5,1000001]) assert.throws(()=>createRejectionSampler().advance(amount),RangeError);
  assert.throws(()=>rejectionCandidate(1.1,.5,2),RangeError);
  assert.throws(()=>rejectionCandidate(0,-.1,2),RangeError);
});

test('rejection sampling embeds lazily and stays literal inside fenced code', async () => {
  const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const helper=app.slice(app.indexOf('  const samplingDemoTitles ='),app.indexOf('  function experimentHtml('));
  const renderer=app.slice(app.indexOf('  function inlineMd('),app.indexOf('  function latex('));
  const markdown=runInNewContext(helper+'\n'+renderer+'\nmarkdown',{esc:String,safeUrl:x=>x,mediaUrl:x=>x});
  const {html}=markdown('[demo:rejection-sampling]');
  assert.match(html,/data-sampling-demo="rejection-sampling"/);
  assert.match(html,/data-src="demos\/rejection-sampling.html"/); assert.doesNotMatch(html,/(?:^|\s)src=/);
  const fence=String.fromCharCode(96).repeat(3);
  assert.doesNotMatch(markdown(fence+'\n[demo:rejection-sampling]\n'+fence).html,/data-sampling-demo/);
});

test('Step, Play, k changes, Reset and New seed keep experiment counts separate', async () => {
  const html=await readFile(new URL('../demos/rejection-sampling.html',import.meta.url),'utf8');
  const source=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm,'');
  const nodes=new Map([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,{value:id==='speed'?'50':'2',clientWidth:360,handlers:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,v){this.handlers[k]=v;}}]));
  const frames=new Map(),events={};let frameId=0;
  const document={hidden:false,getElementById:id=>nodes.get(id),querySelector:()=>({}),addEventListener:(k,v)=>events[k]=v};
  runInNewContext(source,{document,window:{addEventListener(){}},createRejectionSampler,samplingSize(){},ResizeObserver:class{observe(){}},crypto:{getRandomValues:a=>{a[0]=405;return a;}},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id)});
  const emit=(id,name,value)=>{const n=nodes.get(id);if(value!==undefined)n.value=value;n.handlers[name]({target:n});};
  const step=time=>{const active=[...frames.values()];frames.clear();active.forEach(fn=>fn(time));};
  emit('step','click');const first=nodes.get('z').textContent;
  assert.equal(nodes.get('total').textContent,'1'); emit('reset','click');emit('step','click');assert.equal(nodes.get('z').textContent,first);
  emit('play','click');step(0);for(let time=50;time<=1000;time+=50)step(time);
  assert.equal(nodes.get('total').textContent,'51');emit('play','click');assert.equal(frames.size,0);
  emit('k','input','4'); assert.equal(nodes.get('total').textContent,'0');assert.equal(nodes.get('accepted').textContent,'0');assert.equal(nodes.get('rate').textContent,'—');assert.equal(nodes.get('theory').textContent,'25.00%');
  emit('step','click');assert.equal(nodes.get('z').textContent,first);
  emit('new-seed','click');assert.equal(nodes.get('seed').textContent,405);assert.equal(nodes.get('total').textContent,'0');emit('step','click');assert.notEqual(nodes.get('z').textContent,first);
  assert.doesNotMatch(nodes.get('envelope').innerHTML+nodes.get('histogram').innerHTML,/NaN|Infinity/);
});
