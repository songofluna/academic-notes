// A small YAML frontmatter reader for the flat schema used by Pages CMS.
// Quoted scalars, booleans, comma-separated tags, and YAML block strings are supported.
function decodeScalar(s) {
  const value = s.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return '';
  if (value[0] === '"') { try { return JSON.parse(value); } catch { return value.slice(1, -1); } }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  if (value.startsWith('[') && value.endsWith(']')) return value.slice(1, -1).split(',').map(x=>decodeScalar(x));
  return value.replace(/\s+#.*$/, '');
}
export function parsePost(text, filename) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`Missing YAML frontmatter in ${filename}`);
  const meta = {};
  const lines = match[1].split(/\r?\n/);
  for (let i=0; i<lines.length; i++) {
    const m = lines[i].match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (/^[>|][-+]?\s*$/.test(raw)) {
      const block = [];
      while (i+1 < lines.length && (/^\s+/.test(lines[i+1]) || !lines[i+1])) block.push(lines[++i].replace(/^  /,''));
      meta[key] = block.join(raw.startsWith('>') ? ' ' : '\n').trimEnd();
    } else if (!raw.trim() && i+1<lines.length && /^\s+-\s/.test(lines[i+1])) {
      const list = [];
      while (i+1<lines.length && /^\s+-\s/.test(lines[i+1])) list.push(decodeScalar(lines[++i].replace(/^\s+-\s*/,'')));
      meta[key] = list;
    } else meta[key] = decodeScalar(raw);
  }
  const slug = String(meta.slug || filename.split('/').pop().replace(/\.md$/,'')).trim();
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Invalid slug: ${slug}`);
  if (!meta.title) throw new Error(`Missing title in ${filename}`);
  return {
    slug,
    title: String(meta.title),
    date: String(meta.date || '').slice(0,10),
    category: String(meta.category || 'probability'),
    summary: String(meta.summary || ''),
    tags: (Array.isArray(meta.tags) ? meta.tags : String(meta.tags || '').split(',')).map(s=>String(s).trim()).filter(Boolean),
    draft: meta.draft === true || meta.draft === 'true',
    sample: meta.sample === true || meta.sample === 'true',
    body: text.slice(match[0].length).trim(),
    source: 'repo',
    course: String(meta.course || '').trim(),
    section: String(meta.section || '').trim(),
    chapter: String(meta.chapter || '').trim(),
    order: meta.order ?? null,
    published: meta.published === true || meta.published === 'true',
    featured: meta.featured === true || meta.featured === 'true'
  };
}
