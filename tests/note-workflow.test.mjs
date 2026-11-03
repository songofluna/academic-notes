import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { json, readJson, sourcePacket, verifySources, validate, fingerprint, checkEvidence, containedPath, demos, sha256 } from '../scripts/lib/note-workflow.mjs';

const source=fileURLToPath(new URL('../',import.meta.url));
const command=(root,...args)=>spawnSync(process.execPath,['scripts/notes.mjs',...args],{cwd:root,encoding:'utf8'});
function onePagePdf() {
  const stream='BT /F1 18 Tf 72 720 Td (Synthetic source x = 1) Tj ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let pdf='%PDF-1.4\n';const offsets=[0];
  objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});
  const xref=Buffer.byteLength(pdf);
  return pdf+`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
}
async function fixture(t) {
  const root=await mkdtemp(join(tmpdir(),'note-workflow-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  for(const p of ['scripts','app.js','styles.css','index.html','assets','demos','data']) await cp(join(source,p),join(root,p),{recursive:true});
  await mkdir(join(root,'content/notes/images'),{recursive:true});
  for(const slug of ['gm-ch05-59','existing-a','existing-b','existing-c'])await writeFile(join(root,`content/notes/${slug}.md`),`---\nslug: ${slug}\ntitle: Existing fixture ${slug}\nchapter: Chapter 05. Autoregressive Models\ncourse: generative-models\ndraft: false\n---\n\nTest-only existing content.\n\n$$\nx=1\n$$\n\n[demo:wavenet-dilation]\n`);
  execFileSync('git',['init','-b','review/fixture'],{cwd:root,stdio:'pipe'});
  execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','fixture'],{cwd:root,stdio:'pipe'});
  await mkdir(join(root,'.note-sources'));
  // Minimal headers are for byte identity tests, never passed off as rendered source PDFs.
  await writeFile(join(root,'.note-sources/handwritten.pdf'),'%PDF-1.4\nfixture handwritten');
  await writeFile(join(root,'.note-sources/lecture.pdf'),'%PDF-1.4\nfixture lecture');
  const catalog={version:1,sources:{hw:{kind:'handwritten',title:'Test handwritten',path:'handwritten.pdf'},lecture:{kind:'lecture',title:'Test lecture',path:'lecture.pdf'}},sections:{'5.10':{title:'Fixture',chapter:'Chapter 05. Autoregressive Models',course:'generative-models',category:'generative',slug:'fixture-only',order:10,summary:'Test-only manuscript',sources:[{id:'hw',pages:[1]},{id:'lecture',pages:[1]}]}}};
  await writeFile(join(root,'.note-sources/catalog.json'),json(catalog));
  return {root,catalog,work:join(root,'.note-work/5.10')};
}
async function ready(t) {
  const f=await fixture(t);
  const prepared=command(f.root,'prepare','5.10');assert.equal(prepared.status,0,prepared.stderr);
  const path=join(f.work,'note.md');
  const text=(await readFile(path,'utf8')).replace('[검토 필요: 원본의 수식·조건·설명 순서를 확인한 뒤 집필]','테스트 수식은 다음과 같다.\n\n$$\nx=1\n$$');
  await writeFile(path,text);
  const review=await readJson(join(f.work,'review.json'));
  for(const s of review.sourceReview)Object.assign(s,{reviewedBy:'test fixture only',notes:'Synthetic review receipt; no real academic claim.'});
  review.items=['hw','lecture'].map(id=>({id:`${id}-eq`,sourceId:id,page:1,kind:'equation',transcription:'x=1',status:'verified',noteExcerpt:'x=1'}));
  review.visualDecision='No figure needed in synthetic test';review.interactiveDecision='No additional interactive; preserve existing chapter';
  for(const key of Object.keys(review.qa))review.qa[key]='synthetic test receipt';
  review.qa.fingerprint=await fingerprint(f.root,text,review,f.work);
  await writeFile(join(f.work,'review.json'),json(review));
  return {...f,review,text};
}

test('prepare requires both source kinds and explicit positive PDF pages',async t=>{
  const {root,catalog}=await fixture(t);
  catalog.sections['5.10'].sources.pop();
  await writeFile(join(root,'.note-sources/catalog.json'),json(catalog));
  await assert.rejects(sourcePacket(root,'5.10'),/Missing lecture/);
  catalog.sections['5.10'].sources.push({id:'lecture',pages:[0]});
  await writeFile(join(root,'.note-sources/catalog.json'),json(catalog));
  await assert.rejects(sourcePacket(root,'5.10'),/positive/);
  await assert.rejects(sourcePacket(root,'5.11'),/No registered source map/);
});
test('source changes invalidate the packet; preparing twice cannot overwrite work',async t=>{
  const {root,work}=await ready(t);
  assert.notEqual(command(root,'prepare','5.10').status,0);
  const packet=await readJson(join(work,'packet.json'));
  await writeFile(join(root,'.note-sources/lecture.pdf'),'%PDF-1.4 changed');
  await assert.rejects(verifySources(packet),/Source changed/);
});
test('Poppler extracts selected PDF pages into PNG and text, and rejects out-of-range pages',async t=>{
  if(['pdfinfo','pdftoppm','pdftotext'].some(tool=>spawnSync(tool,['-v']).error))return t.skip('Optional Poppler tools are not installed');
  const {root,work,catalog}=await fixture(t);
  for(const name of ['handwritten','lecture'])await writeFile(join(root,'.note-sources',`${name}.pdf`),onePagePdf());
  assert.equal(command(root,'prepare','5.10').status,0);
  const result=command(root,'extract','5.10');assert.equal(result.status,0,result.stderr);
  assert.deepEqual((await readFile(join(work,'pages/hw-1.png'))).subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
  assert.match(await readFile(join(work,'pages/lecture-1.txt'),'utf8'),/Synthetic source x = 1/);
  catalog.sections['5.11']={...catalog.sections['5.10'],sources:[{id:'hw',pages:[2]},{id:'lecture',pages:[1]}]};
  await writeFile(join(root,'.note-sources/catalog.json'),json(catalog));
  assert.equal(command(root,'prepare','5.11').status,0);
  assert.match(command(root,'extract','5.11').stderr,/Page range exceeds/);
});
test('unread pages, unclear math and uncovered inventory fail even when prose looks finished',async t=>{
  const {work,review}=await ready(t),packet=await readJson(join(work,'packet.json'));
  review.sourceReview[0].reviewedBy='';review.items[0].status='unclear';review.items[1].noteExcerpt='not in body';review.questions=['What is the subscript?'];
  const errors=checkEvidence(packet,review,'x=1');
  for(const pattern of [/Inspect every/,/Unclear/,/Uncovered/,/Unresolved/])assert.ok(errors.some(e=>pattern.test(e)),errors.join('\n'));
});
test('QA expires on manuscript, figure or runtime edits',async t=>{
  const {root,work,text,review}=await ready(t);
  assert.equal((await validate(root,work)).errors.length,0);
  await writeFile(join(work,'note.md'),text.replace('title: "Fixture"','title: "Changed"'));
  assert.ok((await validate(root,work)).errors.some(e=>e.includes('fingerprint')));
  await writeFile(join(work,'note.md'),text);
  await writeFile(join(root,'styles.css'),'/* changed layout */');
  assert.notEqual(await fingerprint(root,text,review,work),review.qa.fingerprint);
});
test('existing four chapter interactives are preserved, but a fifth is blocked',async t=>{
  const {root,work,text}=await ready(t);
  const before=await validate(root,work);assert.equal(before.errors.length,0);assert.ok(before.warnings.some(x=>x.includes('4 interactive')));
  await writeFile(join(work,'note.md'),text+'\n[demo:wavenet-dilation]\n');
  assert.ok((await validate(root,work,false)).errors.some(x=>x.includes('budget')));
  await writeFile(join(work,'note.md'),text+'\n[demo:normal]\n');
  assert.ok((await validate(root,work,false)).errors.some(x=>x.includes('Unregistered')));
  assert.deepEqual(demos('```md\n[demo:normal-kl]\n```\n\n[demo:wavenet-dilation]'),['wavenet-dilation']);
});
test('integration exclusively creates a note and public receipt; production build omits private inputs',async t=>{
  const {root,work}=await ready(t);
  const original=await readFile(join(root,'content/notes/gm-ch05-59.md'));
  const result=command(root,'integrate','5.10');assert.equal(result.status,0,result.stderr);
  const post=await readFile(join(root,'content/notes/fixture-only.md'),'utf8');assert.match(post,/draft: false/);
  const record=await readJson(join(root,'docs/publishing/automation/fixture-only.json'));
  assert.equal(record.noteSha256,sha256(post));assert.ok(record.sources.every(s=>!('path' in s)));
  assert.equal(command(root,'check').status,0);
  const payload=await readFile(join(root,'dist/site-data.js'),'utf8');assert.match(payload,/fixture-only/);assert.doesNotMatch(payload,/fixture handwritten|Synthetic review receipt|\.note-sources/);
  assert.deepEqual(await readFile(join(root,'content/notes/gm-ch05-59.md')),original);
  assert.notEqual(command(root,'integrate','5.10').status,0);
  await writeFile(join(root,'content/notes/fixture-only.md'),post+'\nUnchecked edit');assert.notEqual(command(root,'check').status,0);
  assert.ok(await readFile(join(work,'note.md')));
});
test('main and comparison packets cannot integrate',async t=>{
  const {root,work}=await ready(t);
  execFileSync('git',['branch','-m','main'],{cwd:root});
  assert.match(command(root,'integrate','5.10').stderr,/separate review branch/);
  execFileSync('git',['branch','-m','review/fixture'],{cwd:root});
  const packet=await readJson(join(work,'packet.json'));packet.entry.baseline='content/notes/gm-ch05-59.md';
  await writeFile(join(work,'packet.json'),json(packet));
  assert.match(command(root,'integrate','5.10').stderr,/Comparison packets/);
});
test('a conflicting asset causes no partial manuscript write',async t=>{
  const {root,work,review,text}=await ready(t);
  const target='content/notes/images/test-existing.svg';
  await mkdir(join(work,'assets/content/notes/images'),{recursive:true});
  await writeFile(join(work,'assets',target),'<svg/>');await writeFile(join(root,target),'author-owned');
  review.assets=[{target,existing:false,method:'original-svg',description:'fixture',checks:'fixture',sourceItems:['hw-eq'],reference:{url:'https://example.invalid/fixture',locator:'Figure 1',checked:'test only'}}];
  review.qa.fingerprint=await fingerprint(root,text,review,work);await writeFile(join(work,'review.json'),json(review));
  assert.match(command(root,'integrate','5.10').stderr,/Refusing to overwrite/);
  await assert.rejects(readFile(join(root,'content/notes/fixture-only.md')),/ENOENT/);
  assert.equal(await readFile(join(root,target),'utf8'),'author-owned');
});
test('lexical traversal and symlink escapes are refused',async t=>{
  const {root}=await fixture(t),outside=await mkdtemp(join(tmpdir(),'outside-note-'));
  t.after(()=>rm(outside,{recursive:true,force:true}));await symlink(outside,join(root,'escape'));
  await assert.rejects(containedPath(root,'../note.md'),/escapes/);
  await assert.rejects(containedPath(root,'escape/note.md'),/escapes/);
});
test('baseline-only comparison never manufactures a candidate or modifies the source',async t=>{
  const {root}=await fixture(t),baseline='content/notes/gm-ch05-59.md',before=await readFile(join(root,baseline));
  assert.equal(command(root,'compare','5.9','--baseline',baseline).status,0);
  const comparison=await readJson(join(root,'.note-work/5.9/comparison.json'));
  assert.equal(comparison.status,'blocked-missing-sources');assert.equal(comparison.candidate,null);assert.equal(comparison.original.displayEquations,1);assert.equal(comparison.original.sha256,sha256(before));
  assert.equal(command(root,'preview','5.9').status,0);
  assert.match(await readFile(join(root,'.note-work/5.9/preview/review.html'),'utf8'),/생성 후보 없음/);
  assert.deepEqual(await readFile(join(root,baseline)),before);
});
test('candidate preview uses the existing renderer and stays outside dist',async t=>{
  const {root}=await ready(t);
  const result=command(root,'preview','5.10');assert.equal(result.status,0,result.stderr);
  assert.deepEqual(await readFile(join(root,'.note-work/5.10/preview/app.js')),await readFile(join(root,'app.js')));
  assert.match(await readFile(join(root,'.note-work/5.10/preview/site-data.js'),'utf8'),/review-5-10/);
  assert.doesNotMatch(await readFile(join(root,'dist/site-data.js'),'utf8'),/review-5-10|fixture-only/);
});
