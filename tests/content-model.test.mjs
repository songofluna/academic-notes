import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { courseId, courses, chapters } = require('../assets/content-model.js');
const Prism = require('../assets/vendor/prism.js');

test('optional course metadata preserves every note without assigning a guessed course', () => {
  const notes = [
    { slug: 'a', title: 'A', category: 'generative' },
    { slug: 'b', title: 'B', category: 'probability' },
    { slug: 'c', title: 'C', course: 'My own course', chapter: 'Unregistered title' },
  ];
  const original = structuredClone(notes);
  assert.equal(courseId(notes[0]), 'generative-models');
  assert.equal(courseId(notes[1]), 'probability');
  assert.deepEqual(courses(notes).flatMap(c => c.notes).map(n => n.slug).sort(), ['a','b','c']);
  assert.deepEqual(notes, original);
});

test('chapter numbers sort naturally; reading order wins over date within a chapter', () => {
  const result = chapters([
    { title: 'Z', slug: 'z', chapter: 'Chapter 10', order: 1 },
    { title: 'B', slug: 'b', chapter: 'Chapter 2', order: 2, date: '2026-11-02' },
    { title: 'C', slug: 'c', chapter: 'Chapter 2', order: 1, date: '2026-01-01' },
    { title: 'A', slug: 'a', chapter: 'Chapter 2', order: 'not-a-number' },
    { title: 'Overview', slug: 'intro', chapter: '' },
  ]);
  assert.deepEqual(result.map(c=>c.title), ['', 'Chapter 2', 'Chapter 10']);
  assert.deepEqual(result[1].notes.map(n=>n.slug), ['c','b','a']);
});

test('empty, invalid, and legacy order values fall back to a stable title order', () => {
  for (const order of [null, '', ' ', true, -1, 'NaN']) {
    assert.deepEqual(chapters([{ title:'B', slug:'b', order },{ title:'A', slug:'a' }])[0].notes.map(n=>n.slug), ['a','b']);
  }
});

test('bundled highlighting supports academic code and escapes markup as text', () => {
  for (const lang of ['python','javascript','json','bash','css','markup']) assert.ok(Prism.languages[lang]);
  const html=Prism.highlight('import numpy as np\nprint("<script>alert(1)</script>")', Prism.languages.python, 'python');
  assert.match(html,/class="token keyword"/);
  assert.match(html,/&lt;script>/);
  assert.doesNotMatch(html,/<script>/);
});
