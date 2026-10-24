import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'academic-notes-build-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const path of ['scripts', 'index.html', 'styles.css', 'app.js', 'assets', 'data', 'demos']) {
    await cp(join(root, path), join(dir, path), { recursive: true });
  }
  return dir;
}

function build(dir) {
  return spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: dir, encoding: 'utf8' });
}

async function payload(dir) {
  const context = { window: {} };
  runInNewContext(await readFile(join(dir, 'dist/site-data.js'), 'utf8'), context);
  return JSON.parse(JSON.stringify(context.window.SITE_DATA));
}

for (const state of ['empty', 'missing notes directory', 'missing content directory']) {
  test(`build succeeds with ${state}`, async t => {
    const dir = await fixture(t);
    if (state === 'empty') await mkdir(join(dir, 'content/notes'), { recursive: true });
    if (state === 'missing notes directory') await mkdir(join(dir, 'content'));
    const result = build(dir);
    assert.equal(result.status, 0, result.stderr);
    const data = await payload(dir);
    assert.deepEqual(data.notes, []);
    assert.deepEqual(data.site, JSON.parse(await readFile(join(dir, 'data/site.json'), 'utf8')));
    assert.deepEqual(data.projects, JSON.parse(await readFile(join(dir, 'data/projects.json'), 'utf8')));
    assert.deepEqual(await readFile(join(dir, 'dist/assets/hero-photo.webp')), await readFile(join(dir, 'assets/hero-photo.webp')));
    assert.equal(await readFile(join(dir, 'dist/.nojekyll'), 'utf8'), '');
    for (const file of ['metropolis-hastings.html', 'mh-kernel.mjs']) {
      assert.equal(await readFile(join(dir, 'dist/demos', file), 'utf8'), await readFile(join(dir, 'demos', file), 'utf8'));
    }
  });
}

test('build preserves published Markdown and omits draft contents', async t => {
  const dir = await fixture(t);
  await mkdir(join(dir, 'content/notes'), { recursive: true });
  const body = '## 수식과 코드\n\n$x^2$\n\n$$\n\\frac{1}{2}\n$$\n\n```js\nconst x = "<tag>";\n```\n\n![사진](/assets/hero-photo.webp)';
  const published = `---\nslug: public-note\ntitle: 공개 글\ndraft: false\n---\n${body}\n`;
  const draft = '---\nslug: draft-note\ntitle: 초안\ndraft: true\n---\nDRAFT_SENTINEL';
  await writeFile(join(dir, 'content/notes/public.md'), published);
  await writeFile(join(dir, 'content/notes/draft.md'), draft);
  await writeFile(join(dir, 'content/notes/.gitkeep'), '');
  const result = build(dir);
  assert.equal(result.status, 0, result.stderr);
  const data = await payload(dir);
  assert.equal(data.notes.length, 1);
  assert.equal(data.notes[0].body, body);
  assert.equal(data.notes[0].title, '공개 글');
  assert.doesNotMatch(await readFile(join(dir, 'dist/site-data.js'), 'utf8'), /DRAFT_SENTINEL/);
  assert.equal(await readFile(join(dir, 'content/notes/public.md'), 'utf8'), published);
  assert.equal(await readFile(join(dir, 'content/notes/draft.md'), 'utf8'), draft);
});

test('unexpected filesystem errors still fail the build', async t => {
  const dir = await fixture(t);
  await mkdir(join(dir, 'content'));
  await writeFile(join(dir, 'content/notes'), 'A file is not a notes directory.');
  const result = build(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ENOTDIR/);
});

test('invalid notes still fail the build', async t => {
  const dir = await fixture(t);
  await mkdir(join(dir, 'content/notes'), { recursive: true });
  await writeFile(join(dir, 'content/notes/invalid.md'), 'Missing frontmatter');
  const result = build(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing YAML frontmatter/);
});

test('duplicate note slugs still fail the build', async t => {
  const dir = await fixture(t);
  await mkdir(join(dir, 'content/notes'), { recursive: true });
  for (const name of ['first.md', 'second.md']) {
    await writeFile(join(dir, 'content/notes', name), '---\nslug: same-slug\ntitle: Duplicate\n---\nBody');
  }
  const result = build(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Duplicate slugs/);
});

async function put(dir, path, text) {
  await mkdir(dirname(join(dir,path)), {recursive:true});
  await writeFile(join(dir,path), typeof text==='string'?text:JSON.stringify(text));
}
test('articles publish explicitly, isolate slugs from notes and preserve Markdown bytes', async t => {
  const dir=await fixture(t);
  const body=String.raw`## 수식

$\alpha$ and \(x\).

$$
\pi(x)=\frac{1}{Z} f(x)
$$

[demo:metropolis-hastings]

\`\`\`python
print("<tag>")
\`\`\`

![photo](/assets/hero-photo.webp)`;
  await put(dir,'content/notes/shared.md','---\nslug: shared\ntitle: Existing note\n---\nOriginal note');
  await put(dir,'content/articles/shared.md',`---\nslug: shared\ntitle: Article\npublished: true\nfeatured: true\ntags: [MCMC, Bayesian]\nsummary: >-\n  First line\n  Second line\n---\n${body}\n`);
  await put(dir,'content/articles/private.md','---\nslug: private\ntitle: Hidden\npublished: false\nfeatured: true\n---\nPRIVATE_SENTINEL');
  await put(dir,'content/articles/unset.md','---\nslug: unset\ntitle: Hidden too\n---\nUNSET_SENTINEL');
  await put(dir,'content/articles/draft.md','---\nslug: draft\ntitle: Draft\npublished: true\ndraft: true\n---\nDRAFT_ARTICLE_SENTINEL');
  const result=build(dir);assert.equal(result.status,0,result.stderr);
  const data=await payload(dir);
  assert.equal(data.notes[0].body,'Original note');
  assert.equal(data.articles.length,1);
  assert.equal(data.articles[0].body,body);
  assert.equal(data.articles[0].featured,true);
  assert.deepEqual(data.articles[0].tags,['MCMC','Bayesian']);
  assert.equal(data.articles[0].summary,'First line Second line');
  assert.doesNotMatch(await readFile(join(dir,'dist/site-data.js'),'utf8'), /PRIVATE_SENTINEL|UNSET_SENTINEL|DRAFT_ARTICLE_SENTINEL/);
});

for (const meta of [
  'course: absent',
  'course: cs229\nsection: absent',
  'course: generative-models\nsection: "1.1~1.2 "\nchapter: 1. Introduction to deep generative models.',
  'section: foundations\nchapter: basics'
]) {
  test(`legacy outline metadata cannot block publishing: ${meta.replaceAll('\n',' / ')}`, async t => {
    const dir=await fixture(t);
    const source=`---\nslug: newnote1\ntitle: GM chapter1 1.1~1.2\ncategory: generative\n${meta}\n---\n## Original section\n\n$X$\n\n[demo:metropolis-hastings]`;
    await put(dir,'content/notes/newnote1.md',source);
    const result=build(dir);assert.equal(result.status,0,result.stderr);
    const data=await payload(dir);
    assert.equal(data.notes.length,1);
    assert.equal(data.notes[0].category,'generative');
    assert.equal(data.notes[0].body,'## Original section\n\n$X$\n\n[demo:metropolis-hastings]');
    assert.equal(await readFile(join(dir,'content/notes/newnote1.md'),'utf8'),source);
  });
}

test('retired course configuration is neither validated nor modified', async t => {
  const dir=await fixture(t);
  const source='{ incomplete legacy configuration';
  await put(dir,'content/courses/old.json',source);
  await put(dir,'content/notes/public.md','---\ntitle: Public\ncourse: old\n---\nBody');
  const result=build(dir);assert.equal(result.status,0,result.stderr);
  assert.equal((await payload(dir)).notes[0].course,'old');
  assert.equal(await readFile(join(dir,'content/courses/old.json'),'utf8'),source);
});

test('incomplete draft classifications stay out of the public payload', async t => {
  const dir=await fixture(t);
  await put(dir,'content/notes/draft.md','---\ntitle: Draft\ndraft: true\ncourse: future\nsection: future\n---\nPRIVATE_DRAFT');
  const result=build(dir);assert.equal(result.status,0,result.stderr);
  assert.deepEqual((await payload(dir)).notes,[]);
});

for (const value of ['-1', '1.5', 'not-a-number', 'true']) {
  test(`retired lecture order does not block publication: ${value}`, async t=>{
    const dir=await fixture(t);
    const source=`---\ntitle: Existing note\norder: ${value}\n---\nBody`;
    await put(dir,'content/notes/legacy.md',source);
    const result=build(dir);assert.equal(result.status,0,result.stderr);
    assert.equal((await payload(dir)).notes.length,1);
    assert.equal(await readFile(join(dir,'content/notes/legacy.md'),'utf8'),source);
  });
}

test('duplicate article slugs still fail the build', async t=>{
  const dir=await fixture(t);
  for(const file of ['a','b'])await put(dir,`content/articles/${file}.md`,'---\nslug: duplicate\ntitle: Duplicate\n---\nBody');
  assert.match(build(dir).stderr,/Duplicate slugs in content\/articles/);
});

test('empty article collection is valid; unexpected errors still fail', async t=>{
  const dir=await fixture(t);
  await mkdir(join(dir,'content/articles'),{recursive:true});
  let result=build(dir);assert.equal(result.status,0,result.stderr);
  assert.deepEqual((await payload(dir)).articles,[]);
  await rm(join(dir,'content/articles'),{recursive:true});
  await put(dir,'content/articles','Not a directory');
  result=build(dir);assert.notEqual(result.status,0);assert.match(result.stderr,/ENOTDIR/);
});
