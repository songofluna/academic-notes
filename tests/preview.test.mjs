import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

test('portable preview preserves JavaScript/LaTeX dollars and embeds a working MH module', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'academic-notes-preview-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const dir = join(temp, 'site');
  await mkdir(dir);
  const source = fileURLToPath(new URL('../', import.meta.url));
  for (const path of ['scripts', 'index.html', 'app.js', 'styles.css', 'data', 'assets', 'demos']) {
    await cp(join(source, path), join(dir, path), { recursive: true });
  }
  for (const script of ['scripts/build.mjs', 'scripts/preview.mjs']) {
    const result = spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  const html = await readFile(join(temp, 'academic-notes-studio-preview.html'), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  for (const script of scripts) {
    const result = spawnSync(process.execPath, ['--check'], { input: script, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  const originalApp = await readFile(join(source, 'app.js'), 'utf8');
  assert.equal(scripts.at(-1).trim(), originalApp.replace(/<\//g, '<\\/').trim());
  const dataScript = scripts.find(script => script.includes('window.SITE_DATA ='));
  const context = { window: {} };
  runInNewContext(dataScript, context);
  const demo = context.window.MH_DEMO_SRCDOC;
  assert.match(demo, /function generateChain/);
  assert.doesNotMatch(demo, /import .* from '\.\/mh-kernel\.mjs'/);
  const module = demo.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  const result = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: module, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
