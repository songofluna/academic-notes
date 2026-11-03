import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { dilatedGraph } from '../demos/wavenet-kernel.mjs';

test('standard, doubling and gapped dilation schedules have the correct input sets', () => {
  assert.deepEqual(dilatedGraph([1,1,1,1]).lags,[1,2,3,4,5]);
  assert.deepEqual(dilatedGraph([1,2,4,8]).lags,Array.from({length:16},(_,i)=>i+1));
  const gapped=dilatedGraph([2,2]);
  assert.equal(gapped.span,5);
  assert.deepEqual(gapped.lags,[1,3,5]);
  assert.deepEqual(gapped.gaps,[2,4]);
  const ten=dilatedGraph(Array.from({length:10},(_,i)=>2**i));
  assert.equal(ten.span,1024);
  assert.equal(ten.lags.length,1024);
  assert.deepEqual(ten.gaps,[]);
});

test('backward paths agree with independent forward impulse convolutions after shifting raw input', () => {
  const schedules=[[1],[8],[2,2],[1,1,1,1],[1,2,4,8],[8,8,8,8],[3,5,2,7]];
  for(let a=1;a<=8;a++)for(let b=1;b<=8;b++)schedules.push([a,b]);
  for(const schedule of schedules) {
    const state=dilatedGraph(schedule),target=state.span+4;
    const lags=[];
    // Feature position i receives raw x_i; it predicts x_(i+1).
    // Probe current/future raw samples too, not just the expected past set.
    for(let source=0;source<=target+2;source++) {
      let values=Array.from({length:target+3},(_,i)=>Number(i===source));
      for(const d of schedule)values=values.map((value,i)=>value+(values[i-d]??0));
      if(values[target-1]>0)lags.push(target-source);
    }
    assert.deepEqual(lags.sort((a,b)=>a-b),state.lags);
    assert.ok(state.lags.every(lag=>lag>=1));
    for(const edge of state.edges) {
      assert.ok(state.nodes[edge.layer].includes(edge.offset));
      assert.ok(state.nodes[edge.layer-1].includes(edge.source));
      assert.ok(edge.source===edge.offset||edge.source===edge.offset+schedule[edge.layer-1]);
    }
  }
});

test('every UI dilation combination partitions its RF span into connected inputs and gaps', () => {
  for(let layers=1;layers<=4;layers++) {
    const combinations=8**layers;
    for(let code=0;code<combinations;code++) {
      let value=code;
      const ds=Array.from({length:layers},()=>{const d=value%8+1;value=Math.floor(value/8);return d;});
      const s=dilatedGraph(ds);
      assert.equal(s.span,1+ds.reduce((a,b)=>a+b,0));
      assert.deepEqual([...s.lags,...s.gaps].sort((a,b)=>a-b),Array.from({length:s.span},(_,i)=>i+1));
      assert.equal(s.lags[0],1);
      assert.equal(s.lags.at(-1),s.span);
    }
  }
});

test('invalid dilation schedules are rejected', () => {
  for(const ds of [[],[0],[1.5],[-1],[513],Array(11).fill(1),'1,2'])assert.throws(()=>dilatedGraph(ds),RangeError);
});

test('WaveNet embeds lazily and its shortcode stays literal in code fences', async () => {
  const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const helper=app.slice(app.indexOf('  function wavenetDemoHtml('),app.indexOf('  function experimentHtml('));
  const renderer=app.slice(app.indexOf('  function inlineMd('),app.indexOf('  function latex('));
  const markdown=runInNewContext(helper+'\n'+renderer+'\nmarkdown',{esc:String,safeUrl:x=>x,mediaUrl:x=>x});
  const {html}=markdown('[demo:wavenet-dilation]');
  assert.match(html,/data-wavenet-demo/);
  assert.match(html,/data-src="demos\/wavenet-dilation.html"/);
  assert.doesNotMatch(html,/(?:^|\s)src=/);
  const fence=String.fromCharCode(96).repeat(3);
  assert.doesNotMatch(markdown(fence+'\n[demo:wavenet-dilation]\n'+fence).html,/data-wavenet-demo/);
});
