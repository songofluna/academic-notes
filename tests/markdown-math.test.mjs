import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

test('Markdown preserves TeX asterisks and line breaks in inline and display math', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const renderer = app.slice(app.indexOf('  function inlineMd('), app.indexOf('  function latex('));
  const context = {
    esc: value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    mediaUrl: x => x, safeUrl: x => x,
  };
  const render = runInNewContext(`${renderer}\nmarkdown`, context);
  const source = String.raw`Inline \(k^* + x^*\) and $a^*+b^*$ with **bold** and \`literal *code*\`.

\[
\boxed{-\log p(x=k^*\mid y)=-\log\alpha_{k^*}}
\]

\[
y_k=\begin{cases}
1,&k=k^*,\\
0,&k\neq k^*
\end{cases}
\]

$$
z^*+w^*
$$`.replaceAll('\\`', '`');
  const {html} = render(source);
  assert.ok(html.includes(String.raw`\(k^* + x^*\)`));
  assert.ok(html.includes(String.raw`\(a^*+b^*\)`));
  assert.ok(html.includes('<strong>bold</strong>'));
  assert.ok(html.includes('<code>literal *code*</code>'));
  assert.equal((html.match(/class="math-block"/g) || []).length, 3);
  assert.ok(html.includes(String.raw`-\log p(x=k^*\mid y)=-\log\alpha_{k^*}`));
  assert.ok(html.includes(String.raw`1,&amp;k=k^*,\\`));
  assert.ok(html.includes(String.raw`z^*+w^*`));
  assert.ok(!html.includes('<em>'));
});
