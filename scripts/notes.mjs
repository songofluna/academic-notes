import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import { parsePost } from './lib/post.mjs';
import { sha256, readJson, json, sectionId, exists, exclusive, containedPath, git, requireBranch, inventory, sourcePacket, template, reviewTemplate, verifySources, fingerprint, validate, metrics } from './lib/note-workflow.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const [command='help',section,...args]=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const work=()=>join(root,'.note-work',sectionId(section));
const runNode=script=>execFileSync(process.execPath,[script],{cwd:root,stdio:'inherit'});
const fail=errors=>{if(errors.length)throw Error(errors.map(x=>`- ${x}`).join('\n'));};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function prepare() {
  const packet=await sourcePacket(root,section), dir=work();
  if(await exists(join(dir,'packet.json'))) throw Error('Packet already exists. Resume it; for revised sources move the old .note-work section folder aside first.');
  await exclusive(join(dir,'packet.json'),json(packet));
  await exclusive(join(dir,'note.md'),template(packet));
  await exclusive(join(dir,'review.json'),json(reviewTemplate(packet)));
  await exclusive(join(dir,'prompt.md'),`# Section ${section} 집필\n\nRead AGENTS.md, .agents/skills/academic-note-author/SKILL.md, docs/automation/writing-guide.md and docs/automation/README.md.\n\nUse packet.json as the frozen PDF/page map. Run npm run notes -- extract ${section}; visually inspect every selected page from both PDFs. Populate review.json with a complete inventory before writing note.md. OCR/text is a navigation aid, not mathematical evidence. Mark unclear equations and stop dependent claims.\n\nPreserve source order and all mathematics; use newnote1 only for style. Research relevant primary-source figures when a visual is justified, then prefer checked SVG/code. The existing Chapter budget is available via npm run notes -- inventory.\n\nFinish source and math review, validate, preview on desktop/mobile, exercise controls, then record the current fingerprint. Run npm run check. Integrate only a new slug on a review branch and open a PR; never merge or deploy. A baseline means comparison only.\n`);
  console.log(`Prepared ${dir}. No AI call or source interpretation has been made. Read prompt.md, extract/inspect PDFs, then write the manuscript.`);
}
async function extract() {
  const dir=work(), packet=await readJson(join(dir,'packet.json'));
  await verifySources(packet);
  const temp=join(dir,'pages');
  await mkdir(temp,{recursive:true});
  for(const s of packet.sources) {
    const info=execFileSync('pdfinfo',[s.path],{encoding:'utf8'}), count=Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
    if(!count || s.pages.some(p=>p>count)) throw Error(`Page range exceeds ${s.id}: ${count} PDF pages`);
    for(const page of s.pages) {
      const prefix=join(temp,`${s.id}-${page}`);
      execFileSync('pdftoppm',['-f',String(page),'-l',String(page),'-scale-to','1800','-png','-singlefile',s.path,prefix]);
      execFileSync('pdftotext',['-f',String(page),'-l',String(page),'-layout',s.path,`${prefix}.txt`]);
    }
  }
  console.log(`Rendered ${temp}; read PNGs, including equations/diagrams. Extracted text is not a verified transcription.`);
}
async function compare() {
  const dir=work();
  const packet=await exists(join(dir,'packet.json'))?await readJson(join(dir,'packet.json')):null;
  const baseline=option('--baseline')||packet?.entry.baseline;
  if(!baseline) throw Error('Provide --baseline content/notes/<existing>.md');
  const original=await readFile(await containedPath(root,baseline),'utf8');
  const candidate=await exists(join(dir,'note.md'))?await readFile(join(dir,'note.md'),'utf8'):null;
  const result={section,baseline,baseCommit:git(root,'rev-parse','HEAD'),status:candidate?'candidate-unrated':'blocked-missing-sources',original:metrics(original),candidate:candidate?metrics(candidate):null};
  await mkdir(dir,{recursive:true});
  await writeFile(join(dir,'comparison.json'),json(result));
  await writeFile(join(dir,'comparison.md'),`# Section ${section} comparison\n\nStatus: ${result.status}\n\nBaseline: ${baseline} @ ${result.baseCommit}\n\nOriginal SHA-256: ${result.original.sha256}\n\n| Measure | Existing | Candidate |\n|---|---:|---:|\n| Prose characters | ${result.original.proseCharacters} | ${result.candidate?.proseCharacters??'not generated'} |\n| Display equations | ${result.original.displayEquations} | ${result.candidate?.displayEquations??'—'} |\n| Images | ${result.original.images} | ${result.candidate?.images??'—'} |\n| Interactive embeds | ${result.original.demos.length} | ${result.candidate?.demos.length??'—'} |\n\nCounts exclude frontmatter; prose excludes whitespace, headings, fenced code, math, image/demo lines. Counts are structural, not quality scores.\n\nAssess independently against BOTH PDFs: mathematical coverage/conditions; symbol consistency; explanation order and first-year readability; necessary length; visual accuracy; correct controls; desktop/mobile rendering. Record each as pass / revise / blocked with a concrete page/item/example. A missing source is blocked, never a quality pass.\n\n${candidate?'Candidate exists but quality requires page-by-page review.':'Both source PDFs and the Section page map are required before generating a candidate. Existing prose is a style/baseline reference, not a replacement source.'}\n`);
  console.log(json(result));
}
async function preview() {
  const dir=work();
  const comparison=await exists(join(dir,'comparison.json'))?await readJson(join(dir,'comparison.json')):null;
  const candidate=await exists(join(dir,'note.md'))?parsePost(await readFile(join(dir,'note.md'),'utf8'),'note.md'):null;
  if(!candidate&&!comparison) throw Error('Run prepare or compare first');
  runNode('scripts/build.mjs');
  const dest=join(dir,'preview');
  await rm(dest,{recursive:true,force:true}); await cp(join(root,'dist'),dest,{recursive:true});
  if(candidate) {
    candidate.slug=`review-${section.replaceAll('.','-')}`; candidate.draft=false;
    // Only the isolated, gitignored preview payload includes this manuscript.
    await writeFile(join(dest,'site-data.js'),(await readFile(join(dest,'site-data.js'),'utf8'))+`\nwindow.SITE_DATA.notes.push(${JSON.stringify(candidate).replace(/</g,'\\u003c')});\n`);
    const review=await readJson(join(dir,'review.json'));
    for(const a of review.assets.filter(a=>!a.existing)) {
      const target=a.target.startsWith('content/notes/images/')?a.target.slice('content/notes/'.length):a.target;
      const src=await containedPath(dir,`assets/${a.target}`), out=await containedPath(dest,target);
      await mkdir(dirname(out),{recursive:true}); await cp(src,out);
    }
  }
  const baseline=comparison?parsePost(await readFile(await containedPath(root,comparison.baseline),'utf8'),'baseline.md'):null;
  const frame=(title,slug)=>`<section><h2>${title}</h2><a target="_blank" href="index.html#/notes/${escape(slug)}">전체 화면으로 검수</a><iframe title="${title}" src="index.html#/notes/${escape(slug)}"></iframe></section>`;
  await writeFile(join(dest,'review.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Section ${section} 검토</title><style>body{font:16px system-ui;margin:20px;color:#27312b}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,480px),1fr));gap:18px}iframe{width:100%;height:78vh;border:1px solid #dfe5da;margin-top:12px}h2{font-size:18px}</style><h1>Section ${section} · 로컬 검토</h1><p>공개 글은 변경되지 않았습니다. 수식·그림·조작은 각 전체 화면에서도 확인하세요.</p><main>${baseline?frame('기존 원고',baseline.slug):''}${candidate?frame('생성 후보 · 작성자 검토 전',candidate.slug):'<section><h2>생성 후보 없음</h2><p>원본 필기 PDF와 강의안의 해당 Section이 등록되기 전에는 재작성하지 않습니다.</p></section>'}</main></html>`);
  console.log(`Preview ready: npm run notes -- serve ${section} (loopback only; not deployed)`);
}
async function integrate() {
  requireBranch(root);
  const dir=work(), result=await validate(root,dir);
  fail(result.errors); result.warnings.forEach(x=>console.warn(x));
  const {packet,review,text,post}=result;
  if(packet.entry.baseline) throw Error('Comparison packets cannot replace an existing article. Keep the baseline unchanged and review the comparison.');
  if((await inventory(root)).some(p=>p.slug===post.slug)) throw Error(`Existing slug refused: ${post.slug}`);
  const target=`content/notes/${post.slug}.md`, published=text.replace(/^draft:\s*true\s*$/m,'draft: false');
  if(published===text) throw Error('Expected a standalone draft: true field');
  const outputs=[{path:target,bytes:Buffer.from(published)}];
  const assets=[];
  for(const a of review.assets) {
    const path=await containedPath(a.existing?root:dir,a.existing?a.target:`assets/${a.target}`), bytes=await readFile(path);
    assets.push({...a,sha256:sha256(bytes)});
    if(!a.existing) outputs.push({path:a.target,bytes});
  }
  const record={version:1,section,baseCommit:packet.baseCommit,note:target,noteSha256:sha256(published),status:'awaiting-author-review',sources:packet.sources.map(({path,...s})=>s),sourceReview:review.sourceReview,items:review.items,questions:review.questions,visualDecision:review.visualDecision,interactiveDecision:review.interactiveDecision,assets,qa:review.qa};
  outputs.push({path:`docs/publishing/automation/${post.slug}.json`,bytes:Buffer.from(json(record))});
  if(new Set(outputs.map(o=>o.path)).size!==outputs.length) throw Error('Duplicate output paths');
  for(const o of outputs) if(await exists(await containedPath(root,o.path))) throw Error(`Refusing to overwrite ${o.path}`);
  const created=[];
  try {
    for(const o of outputs) {await exclusive(await containedPath(root,o.path),o.bytes);created.push(o.path);}
    runNode('scripts/build.mjs');
  } catch(e) {for(const p of created)await rm(join(root,p));throw e;}
  console.log(`Integrated ${target} on ${requireBranch(root)} for PR review. Public Pages changes only after the author merges. Run npm run check, inspect git diff, then push this branch and create a PR.`);
}
async function checkRecords() {
  const dir=join(root,'docs/publishing/automation');
  if(!await exists(dir)) {console.log('No integrated automated notes yet.');return;}
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.json'))) {
    const r=await readJson(join(dir,file)),text=await readFile(await containedPath(root,r.note),'utf8');
    fail(checkRecord(r,text));
    for(const a of r.assets) if(sha256(await readFile(await containedPath(root,a.target)))!==a.sha256)throw Error(`Stale asset record: ${a.target}`);
  }
  console.log('Integrated note provenance and file hashes verified (source PDFs remain local).');
}
// Public records are receipts, not claims of independent automated mathematical proof.
import { checkEvidence } from './lib/note-workflow.mjs';
export function checkRecord(r,text) {
  const errors=checkEvidence({sources:r.sources},r,parsePost(text,'record.md').body);
  if(r.noteSha256!==sha256(text))errors.push(`Manuscript changed without updating review record: ${r.note}`);
  if(r.sources.some(s=>s.path||!/^[a-f0-9]{64}$/.test(s.sha256))) errors.push('Public record contains local paths or invalid source hashes');
  for(const key of ['fingerprint','sourceCoverage','mathematics','style','desktop','mobile','interactions'])if(!r.qa?.[key]?.trim())errors.push(`Missing QA receipt: ${key}`);
  return errors;
}
async function serve() {
  const base=join(work(),'preview');
  if(!await exists(join(base,'review.html')))throw Error('Run preview first');
  const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpeg':'image/jpeg','.webp':'image/webp'};
  http.createServer(async(req,res)=>{
    try {
      const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'review.html';
      const bytes=await readFile(await containedPath(base,path));
      res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
    }catch{res.writeHead(404).end('Not found');}
  }).on('error',error=>{console.error(`Preview server: ${error.message}`);process.exitCode=1;})
    .listen(Number(process.env.PORT||4174),'127.0.0.1',()=>console.log(`http://127.0.0.1:${process.env.PORT||4174}/review.html`));
}
async function main() {
  switch(command) {
    case 'init': await exclusive(join(root,'.note-sources/catalog.json'),json({version:1,sources:{},sections:{}}));console.log('Created private source catalog. See docs/automation/catalog.example.json.');break;
    case 'prepare': await prepare();break;
    case 'extract': await extract();break;
    case 'inventory': console.log(json((await inventory(root)).filter(p=>p.demos.length).map(({file,chapter,course,demos})=>({file,chapter,course,demos}))));break;
    case 'validate': {const r=await validate(root,work(),!args.includes('--draft'));console.log(json({errors:r.errors,warnings:r.warnings}));if(r.errors.length)process.exitCode=1;break;}
    case 'fingerprint': {const review=await readJson(join(work(),'review.json')),text=await readFile(join(work(),'note.md'),'utf8');console.log(await fingerprint(root,text,review,work()));break;}
    case 'compare': await compare();break;
    case 'preview': await preview();break;
    case 'serve': await serve();break;
    case 'integrate': await integrate();break;
    case 'check': await checkRecords();break;
    default: console.log('notes: init | prepare SECTION | extract SECTION | inventory | validate SECTION [--draft] | fingerprint SECTION | compare SECTION [--baseline PATH] | preview SECTION | serve SECTION | integrate SECTION | check');
  }
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(e=>{console.error(e.message);process.exitCode=1;});
