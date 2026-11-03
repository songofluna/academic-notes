import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {pixelcnnContext,receptiveField} from '../demos/pixelcnn-context.mjs';

test('q uses k,l,m,p in the first layer; j,n,o remain blind at any depth',()=>{
  assert.deepEqual(receptiveField(16,1),[10,11,12,15]);
  for(let depth=1;depth<=8;depth++)assert.deepEqual(pixelcnnContext(16,depth).blind,[9,13,14]);
  assert.equal(pixelcnnContext(16,1).beyondDepth.length,9);
  assert.deepEqual(pixelcnnContext(16,8).beyondDepth,[]);
  assert.equal(pixelcnnContext(16,8).reachable.length,13);
});

test('all 25 targets and eight depths agree with forward impulse convolutions',()=>{
  for(let layers=1;layers<=8;layers++) {
    const dependencies=Array.from({length:25},()=>[]);
    for(let source=0;source<25;source++) {
      let values=Array.from({length:25},(_,i)=>Number(i===source));
      for(let layer=1;layer<=layers;layer++) {
        values=values.map((_,index)=>{
          const r=Math.floor(index/5),c=index%5;
          let sum=0;
          for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++) {
            const allowed=dr===-1||(dr===0&&dc===-1)||(layer>1&&dr===0&&dc===0);
            const rr=r+dr,cc=c+dc;
            if(allowed&&rr>=0&&rr<5&&cc>=0&&cc<5)sum+=values[rr*5+cc];
          }
          return sum;
        });
      }
      values.forEach((value,target)=>{if(value>0)dependencies[target].push(source);});
    }
    for(let target=0;target<25;target++) {
      const state=pixelcnnContext(target,layers);
      assert.deepEqual(state.reachable,dependencies[target]);
      assert.ok(state.reachable.every(i=>i<target),'Current/future information leaked');
      assert.deepEqual([...state.reachable,...state.blind,...state.beyondDepth].sort((a,b)=>a-b),Array.from({length:target},(_,i)=>i));
      const row=Math.floor(target/5),col=target%5;
      const geometricBlind=Array.from({length:target},(_,i)=>i).filter(i=>i%5-col>row-Math.floor(i/5));
      assert.deepEqual(state.blind,geometricBlind);
      if(layers>1)assert.ok(receptiveField(target,layers-1).every(i=>state.reachable.includes(i)));
    }
  }
});

test('boundaries do not wrap, and invalid controls are rejected',()=>{
  assert.deepEqual(receptiveField(0,8),[]);
  assert.deepEqual(receptiveField(5,1),[0,1]);
  assert.deepEqual(receptiveField(4,1),[3]);
  for(const [target,layers] of [[-1,1],[25,1],[0,0],[0,1.5]])assert.throws(()=>pixelcnnContext(target,layers),RangeError);
});

test('PixelCNN shortcode stays lazy and is literal in code fences',async()=>{
  const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const helper=app.slice(app.indexOf('  function pixelcnnDemoHtml('),app.indexOf('  function experimentHtml('));
  const renderer=app.slice(app.indexOf('  function inlineMd('),app.indexOf('  function latex('));
  const render=runInNewContext(`${helper}\n${renderer}\nmarkdown`,{esc:s=>String(s),safeUrl:x=>x,mediaUrl:x=>x});
  const {html}=render('[demo:pixelcnn-blind-spot]');
  assert.match(html,/data-pixelcnn-demo/);
  assert.match(html,/data-src="demos\/pixelcnn-blind-spot.html"/);
  assert.doesNotMatch(html,/(?:^|\s)src=/);
  assert.doesNotMatch(render('```\n[demo:pixelcnn-blind-spot]\n```').html,/data-pixelcnn-demo/);
});
