import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { madeMasks } from '../demos/made-mask.mjs';

test('default MADE masks and reachable inputs match the note', () => {
  const state = madeMasks();
  assert.deepEqual(state.input, [[1,0,0,0],[1,1,0,0],[1,1,1,0]]);
  assert.deepEqual(state.output, [[0,0,0],[1,0,0],[1,1,0],[1,1,1]]);
  for (let i=1;i<=4;i++) assert.deepEqual(madeMasks([1,2,3],i).inputs, Array.from({length:i-1},(_,j)=>j+1));
});

test('all 27 degree assignments and four outputs exclude current and future inputs', () => {
  for(let a=1;a<=3;a++) for(let b=1;b<=3;b++) for(let c=1;c<=3;c++) for(let i=1;i<=4;i++) {
    const degrees=[a,b,c], state=madeMasks(degrees,i);
    const paths=[];
    // Independent graph traversal using the displayed masks.
    for(let j=0;j<4;j++) for(let k=0;k<3;k++) {
      assert.equal(state.input[k][j],Number(j+1<=degrees[k]));
      assert.equal(state.output[i-1][k],Number(degrees[k]<i));
      if(state.input[k][j] && state.output[i-1][k]) {
        assert.ok(j+1<i,`Leak from x${j+1} to output ${i} for ${degrees}`);
        paths.push(`${j+1}/${k+1}/${i}`);
      }
    }
    assert.deepEqual(state.paths.map(p=>`${p.input}/${p.hidden}/${p.output}`).sort(),paths.sort());
    assert.deepEqual(state.inputs,[...new Set(paths.map(p=>Number(p.split('/')[0])))].sort());
  }
  assert.deepEqual(madeMasks([3,3,3],3).inputs,[]);
  assert.deepEqual(madeMasks([1,1,1],4).inputs,[1]);
});

test('invalid MADE configurations are rejected', () => {
  for(const degrees of [[0,2,3],[1,2,4],[1,2], [1,2,2.5]]) assert.throws(()=>madeMasks(degrees),RangeError);
  for(const i of [0,5,1.5]) assert.throws(()=>madeMasks([1,2,3],i),RangeError);
});

test('MADE shortcode is lazy, base-path relative and remains literal inside code', async () => {
  const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const helper=app.slice(app.indexOf('  function madeDemoHtml('),app.indexOf('  function experimentHtml('));
  const renderer=app.slice(app.indexOf('  function inlineMd('),app.indexOf('  function latex('));
  const context={esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),safeUrl:x=>x,mediaUrl:x=>x};
  const render=runInNewContext(`${helper}\n${renderer}\nmarkdown`,context);
  const {html}=render('[demo:made-mask-explorer]');
  assert.match(html,/data-made-demo/);
  assert.match(html,/data-src="demos\/made-mask-explorer.html"/);
  assert.doesNotMatch(html,/(?:^|\s)src=/);
  assert.doesNotMatch(render('```\n[demo:made-mask-explorer]\n```').html,/data-made-demo/);
});
