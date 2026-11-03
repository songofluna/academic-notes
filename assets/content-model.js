/* Optional reading order. Missing or legacy metadata never prevents publication. */
(function (root) {
  'use strict';
  const names = { cs229: 'CS229', 'generative-models': 'Generative Models', 'deep-learning': 'Deep Learning', probability: 'Probability & Statistics' };
  const fallback = { generative: 'generative-models', 'deep-learning': 'deep-learning', probability: 'probability' };
  const natural = (a, b) => String(a).localeCompare(String(b), 'en', { numeric: true });
  const courseId = note => String(note.course || '').trim() || fallback[note.category] || note.category || 'notes';
  const courseName = id => names[id] || id;
  const order = note => {
    if (note.order === null || note.order === undefined || typeof note.order === 'boolean' || String(note.order).trim() === '') return Infinity;
    const n = Number(note.order);
    return Number.isFinite(n) && n >= 0 ? n : Infinity;
  };
  const lectureOrder = (a, b) => (order(a) - order(b)) || natural(a.title, b.title) || natural(a.slug, b.slug);
  function courses(notes) {
    const groups = new Map();
    for (const note of notes) {
      const id = courseId(note);
      if (!groups.has(id)) groups.set(id, { id, title: courseName(id), notes: [] });
      groups.get(id).notes.push(note);
    }
    return [...groups.values()].sort((a, b) => natural(a.title, b.title));
  }
  function chapters(notes) {
    const groups = new Map();
    for (const note of notes) {
      const title = String(note.chapter || '').trim();
      if (!groups.has(title)) groups.set(title, { title, notes: [] });
      groups.get(title).notes.push(note);
    }
    return [...groups.values()].map(g => ({ ...g, notes: [...g.notes].sort(lectureOrder) }))
      .sort((a, b) => !a.title ? -1 : !b.title ? 1 : natural(a.title, b.title));
  }
  const api = { courseId, courseName, courses, chapters, lectureOrder };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SiteContent = api;
})(typeof window !== 'undefined' ? window : globalThis);
