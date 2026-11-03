import { readFile, writeFile, readdir, mkdir, stat, realpath } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parsePost } from './post.mjs';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
export const json = value => JSON.stringify(value, null, 2) + '\n';
export const sectionId = value => {
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(value || '')) throw Error('Section must look like 5.10 or 5.7.1');
  return value;
};
export const exists = async path => { try { await stat(path); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } };
export async function exclusive(path, text) {
  await mkdir(dirname(path), {recursive:true});
  await writeFile(path, text, {flag:'wx'});
}
export function safePath(root, path) {
  const full = resolve(root, path), rel = relative(root, full);
  if (!rel || rel === '..' || rel.startsWith('..' + '/') || isAbsolute(rel)) throw Error(`Path escapes workspace: ${path}`);
  return full;
}
// Check existing parents too: lexical containment alone does not stop symlink escapes.
export async function containedPath(root, path) {
  const full = safePath(root, path), realRoot = await realpath(root);
  let parent = full;
  while (!await exists(parent)) parent = dirname(parent);
  safePath(realRoot, relative(realRoot, await realpath(parent)) || '.root-placeholder');
  return full;
}
export function git(root, ...args) { return execFileSync('git', args, {cwd:root, encoding:'utf8'}).trim(); }
export function requireBranch(root) {
  const branch = git(root, 'branch', '--show-current');
  if (!branch || ['main','master','gh-pages'].includes(branch)) throw Error('Use a separate review branch; main/master/gh-pages/detached HEAD are refused.');
  return branch;
}
export function demos(body) {
  const text = body.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, '');
  return [...text.matchAll(/^\[demo:([a-z0-9-]+)\]\s*$/gm)].map(m=>m[1]);
}
export async function inventory(root) {
  const files = (await readdir(join(root,'content/notes'))).filter(f=>f.endsWith('.md'));
  const posts = await Promise.all(files.map(async file => ({file:`content/notes/${file}`, ...parsePost(await readFile(join(root,'content/notes',file),'utf8'), file)})));
  return posts.map(p=>({...p, demos:demos(p.body)}));
}
export async function sourcePacket(root, section) {
  sectionId(section);
  const path = join(root,'.note-sources/catalog.json');
  if (!await exists(path)) throw Error('Missing source catalog. Run npm run notes -- init, then register both PDFs and the Section page map. No manuscript was generated.');
  const catalog = await readJson(path), entry = catalog.sections?.[section];
  if (catalog.version !== 1 || !entry) throw Error(`No registered source map for Section ${section}. Fill .note-sources/catalog.json; do not infer pages from the existing post.`);
  for (const key of ['title','chapter','slug','course','category','summary']) if (!entry[key]?.trim()) throw Error(`Section ${section}: missing ${key}`);
  if (!/^[a-z0-9-]+$/.test(entry.slug)) throw Error('Invalid note slug');
  if (!Number.isFinite(entry.order)) throw Error('Section order must be numeric');
  const sources = [];
  for (const ref of entry.sources || []) {
    const source = catalog.sources?.[ref.id];
    if (!/^[a-z0-9-]+$/.test(ref.id || '') || !source?.title || !source.path || !['handwritten','lecture'].includes(source.kind)) throw Error('Each source needs a stable id, title, PDF path and handwritten/lecture kind');
    if (!Array.isArray(ref.pages) || !ref.pages.length || ref.pages.some(p=>!Number.isInteger(p)||p<1) || new Set(ref.pages).size!==ref.pages.length) throw Error('Pages must be distinct positive 1-based PDF page numbers');
    const full = resolve(root,'.note-sources',source.path), bytes = await readFile(full);
    if (!bytes.subarray(0,1024).includes(Buffer.from('%PDF-'))) throw Error(`${ref.id} is not a PDF`);
    sources.push({id:ref.id,kind:source.kind,title:source.title,path:full,pages:ref.pages,sha256:sha256(bytes)});
  }
  if (new Set(sources.map(s=>s.id)).size!==sources.length) throw Error('Duplicate source ids');
  for (const kind of ['handwritten','lecture']) if (!sources.some(s=>s.kind===kind)) throw Error(`Missing ${kind} PDF. Existing prose and papers cannot substitute for this source.`);
  return {version:1,section,entry,sources,baseCommit:git(root,'rev-parse','HEAD')};
}
export function template(packet) {
  const {entry:e,section} = packet;
  const values = {slug:e.slug,title:e.title,date:new Date().toISOString().slice(0,10),category:e.category,course:e.course,chapter:e.chapter,order:e.order,summary:e.summary,tags:e.tags||'',draft:true,sample:false};
  return `---\n${Object.entries(values).map(([k,v])=>`${k}: ${JSON.stringify(v)}`).join('\n')}\n---\n\n> 작성자 검토 전\n\n## ${section}\n\n[검토 필요: 원본의 수식·조건·설명 순서를 확인한 뒤 집필]\n`;
}
export function reviewTemplate(packet) {
  return {version:1,sourceReview:packet.sources.map(s=>({sourceId:s.id,pages:s.pages,reviewedBy:'',notes:''})),items:[],questions:[],assets:[],visualDecision:'',interactiveDecision:'',qa:{fingerprint:'',sourceCoverage:'',mathematics:'',style:'',desktop:'',mobile:'',interactions:''}};
}
export async function verifySources(packet) {
  for (const source of packet.sources) if (sha256(await readFile(source.path))!==source.sha256) throw Error(`Source changed: ${source.id}. Prepare a fresh packet and review again.`);
}
export async function fingerprint(root, manuscript, review, work) {
  const files = ['app.js','styles.css','index.html','assets/content-model.js', ...((await readdir(join(root,'demos'))).sort().map(f=>`demos/${f}`))];
  const hashes = await Promise.all(files.map(async p=>[p,sha256(await readFile(safePath(root,p)))]));
  for (const asset of review.assets) hashes.push([asset.target,sha256(await readFile(await assetPath(root,work,asset)))]);
  return sha256(json({manuscript:manuscript.replace(/^draft:\s*(true|false)\s*$/m,'draft: REVIEW'),hashes}));
}
async function assetPath(root, work, asset) {
  if (!/^(content\/notes\/images\/[a-z0-9-]+\.(svg|png|jpe?g|webp)|demos\/[a-z0-9-]+\.(html|mjs))$/.test(asset.target||'')) throw Error('Asset target must be a named note image or demo');
  return containedPath(asset.existing ? root : work, asset.existing ? asset.target : `assets/${asset.target}`);
}
export function checkEvidence(packet, review, body) {
  const errors = [], need = (ok,msg)=>{if(!ok)errors.push(msg);};
  need(review.version===1,'Unknown review version');
  need(Array.isArray(review.questions)&&review.questions.length===0,'Unresolved questions remain');
  need(Array.isArray(review.items)&&review.items.length>0,'Source inventory is empty');
  const items = review.items || [];
  need(new Set(items.map(i=>i.id)).size===items.length,'Duplicate inventory ids');
  for (const s of packet.sources) {
    const r = (review.sourceReview||[]).find(r=>r.sourceId===s.id);
    need(r?.reviewedBy?.trim() && r?.notes?.trim() && JSON.stringify([...(r?.pages||[])].sort())===JSON.stringify([...s.pages].sort()),`Inspect every selected page image and record reviewer/notes: ${s.id}`);
    for (const page of s.pages) need(items.some(i=>i.sourceId===s.id && i.page===page),`Inventory missing ${s.id} PDF page ${page} (use context item for a non-substantive page)`);
  }
  for (const i of items) {
    const s = packet.sources.find(s=>s.id===i.sourceId);
    need(/^[a-z0-9-]+$/.test(i.id||'')&&s?.pages.includes(i.page),`Invalid source locator: ${i.id}`);
    need(['equation','definition','assumption','example','figure','context'].includes(i.kind),`Missing item kind: ${i.id}`);
    need(i.status==='verified' && i.transcription?.trim(),`Unclear/untranscribed item: ${i.id}`);
    need(i.noteExcerpt?.trim() && body.includes(i.noteExcerpt),`Uncovered source item or stale excerpt: ${i.id}`);
  }
  for (const a of review.assets||[]) {
    need(a.description?.trim() && a.checks?.trim(),`Describe the figure and mathematical checks: ${a.target}`);
    need(a.sourceItems?.length && a.sourceItems.every(id=>items.some(i=>i.id===id)),`Missing source items for asset: ${a.target}`);
    need(['original-svg','code','reuse'].includes(a.method),`Missing asset method: ${a.target}`);
    need(a.reference?.url?.startsWith('https://') && a.reference?.locator && a.reference?.checked,`Verify paper/lecture reference and figure/page locator: ${a.target}`);
    if(a.method==='reuse') need(a.reference?.reusePermission?.trim(),`Record reuse permission; attribution alone is insufficient: ${a.target}`);
  }
  need(review.visualDecision?.trim(),'Record why figures are needed or omitted');
  need(review.interactiveDecision?.trim(),'Record chapter-level interactive decision');
  return errors;
}
export async function validate(root, work, strict=true) {
  const packet=await readJson(join(work,'packet.json')), review=await readJson(join(work,'review.json'));
  const text=await readFile(join(work,'note.md'),'utf8'), post=parsePost(text,'note.md');
  await verifySources(packet);
  const errors=checkEvidence(packet,review,post.body), warnings=[];
  for(const field of ['slug','title','chapter','course','category','summary','order']) if(String(post[field])!==String(packet.entry[field])) errors.push(`Metadata differs from section map: ${field}`);
  if(!post.draft) errors.push('Keep the working manuscript draft: true until integration');
  if(!post.body.includes('작성자 검토 전')) errors.push('Missing author review notice');
  if(/검토 필요|TODO|TBD|SOURCE_REQUIRED/.test(post.body)) errors.push('Unresolved manuscript marker');
  const plain=post.body.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm,'');
  if((plain.match(/\$\$/g)||[]).length%2 || (plain.match(/\\\[/g)||[]).length!==(plain.match(/\\\]/g)||[]).length) errors.push('Unbalanced display math delimiters');
  const app=await readFile(join(root,'app.js'),'utf8');
  const registered=new Set([...app.matchAll(/demo:([a-z0-9-]+)/g)].map(m=>m[1]));
  for(const id of demos(post.body)) if(!registered.has(id)) errors.push(`Unregistered interactive shortcode: ${id}`);
  for(const a of review.assets||[]) await assetPath(root,work,a).then(readFile);
  for(const match of plain.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)) {
    const [,alt,url]=match;
    if(!alt.trim()) errors.push(`Image needs alt text: ${url}`);
    if(!url.startsWith('images/')) errors.push(`Use repository-local note images: ${url}`);
    if(!(review.assets||[]).some(a=>a.target===`content/notes/${url}`)) errors.push(`Image missing provenance: ${url}`);
  }
  const posts=await inventory(root), existing=posts.filter(p=>p.chapter===post.chapter && p.course===post.course);
  const baseline=packet.entry.baseline;
  const count=existing.filter(p=>p.file!==baseline).reduce((n,p)=>n+p.demos.length,0)+demos(post.body).length;
  const previous=existing.reduce((n,p)=>n+p.demos.length,0);
  if(count>3) {
    if(count>previous) errors.push(`Chapter interactive budget: ${previous} existing → ${count}; target 1–3. Do not add another.`);
    else warnings.push(`Chapter already has ${previous} interactive embeds; preserved without adding (${count} in comparison).`);
  } else if(count===0) warnings.push('Chapter target is 1–3 interactives; reserve a useful experiment in the chapter plan.');
  if(strict) {
    for(const key of ['sourceCoverage','mathematics','style','desktop','mobile','interactions']) if(!review.qa?.[key]?.trim()) errors.push(`Missing review evidence: qa.${key}`);
    if(review.qa?.fingerprint!==await fingerprint(root,text,review,work)) errors.push('QA fingerprint is stale or missing. Review the current note/assets/runtime and run fingerprint.');
  }
  return {packet,review,text,post,errors,warnings};
}
export function metrics(text) {
  const {body}=parsePost(text,'metrics.md');
  const prose=body.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm,'').replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/g,'').replace(/\$[^$\n]+\$|\\\([^\n]*?\\\)/g,'').replace(/^#{1,6}.*$|^!\[.*$|^\[demo:.*$/gm,'').replace(/\s/g,'');
  return {sha256:sha256(text),proseCharacters:prose.length,headings:[...body.matchAll(/^#{1,4}\s+(.+)$/gm)].map(m=>m[1]),displayEquations:(body.match(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/g)||[]).length,images:(body.match(/!\[[^\]]*\]\(/g)||[]).length,demos:demos(body)};
}
