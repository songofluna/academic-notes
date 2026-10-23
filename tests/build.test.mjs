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
  for (const path of ['scripts', 'index.html', 'styles.css', 'app.js', 'assets', 'data']) {
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
