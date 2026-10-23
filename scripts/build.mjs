import { readFile, writeFile, readdir, mkdir, cp, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const readJson = async (file) => JSON.parse(await readFile(join(root, file), 'utf8'));

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
function parsePost(text, filename) {
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
    order: orderValue(meta.order, filename),
    published: meta.published === true || meta.published === 'true',
    featured: meta.featured === true || meta.featured === 'true'
  };
}

function orderValue(value, context) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!['number','string'].includes(typeof value) || !Number.isSafeInteger(n) || n < 0) throw new Error(`Invalid order in ${context}: ${value}`);
  return n;
}
const byOrder = (a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.title.localeCompare(b.title, 'en', {numeric:true}) || a.slug.localeCompare(b.slug);
async function entriesAt(path, extension) {
  const entries = await readdir(join(root,path)).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  return entries.filter(name => name.endsWith(extension)).sort();
}
async function readPosts(collection) {
  const dir = `content/${collection}`;
  const names = await entriesAt(dir, '.md');
  const posts = await Promise.all(names.map(async name => parsePost(await readFile(join(root,dir,name),'utf8'), `${dir}/${name}`)));
  if (new Set(posts.map(p=>p.slug)).size !== posts.length) throw new Error(`Duplicate slugs in ${dir}`);
  return posts;
}
function outline(items, context) {
  if (!Array.isArray(items)) throw new Error(`Expected a list in ${context}`);
  const seen = new Set();
  return items.map(item => {
    const slug = String(item.id || '').trim();
    if (!/^[a-z0-9-]+$/.test(slug) || seen.has(slug) || !item.title) throw new Error(`Invalid or duplicate outline ID in ${context}: ${slug}`);
    seen.add(slug);
    return {slug, title:String(item.title), order:orderValue(item.order,context), ...(item.chapters !== undefined ? {chapters:outline(item.chapters || [],`${context}/${slug}`)} : {})};
  }).sort(byOrder);
}
async function readCourses() {
  const names = await entriesAt('content/courses', '.json');
  const courses = await Promise.all(names.map(async name => {
    const c = await readJson(`content/courses/${name}`);
    const slug = String(c.slug || '').trim();
    if (!/^[a-z0-9-]+$/.test(slug) || !c.title) throw new Error(`Invalid course: ${name}`);
    return {slug, title:String(c.title), order:orderValue(c.order,name), sections:outline(c.sections || [],name)};
  }));
  if (new Set(courses.map(c=>c.slug)).size !== courses.length) throw new Error('Duplicate course slugs');
  return courses.sort(byOrder);
}
const [notes, articles, courses, site, projects] = await Promise.all([
  readPosts('notes'), readPosts('articles'), readCourses(), readJson('data/site.json'), readJson('data/projects.json')
]);
// Only published notes must resolve to the configured outline; drafts can be incomplete.
const publishedNotes = notes.filter(n => !n.draft);
for (const note of publishedNotes) {
  const course = courses.find(c=>c.slug===note.course);
  const section = course?.sections.find(s=>s.slug===note.section);
  const chapter = section?.chapters?.find(c=>c.slug===note.chapter);
  if ((note.course && !course) || (note.section && !section) || (note.chapter && !chapter)) {
    throw new Error(`Unknown Course / Section / Chapter in note ${note.slug}: ${note.course} / ${note.section} / ${note.chapter}`);
  }
}
const publishedArticles = articles.filter(a => a.published && !a.draft);
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const name of ['index.html','styles.css','app.js']) await cp(join(root,name),join(out,name));
await cp(join(root,'assets'),join(out,'assets'),{recursive:true});
await cp(join(root,'demos'),join(out,'demos'),{recursive:true});
// Draft contents must not be embedded in the public site's JavaScript payload.
const payload = JSON.stringify({site,projects,courses,notes:publishedNotes,articles:publishedArticles});
await writeFile(join(out,'site-data.js'),`/* Generated by scripts/build.mjs — edit data/ and content/ instead. */\nwindow.SITE_DATA = ${payload.replace(/</g,'\\u003c')};\n`);
await writeFile(join(out,'.nojekyll'),'');
console.log(`Built ${publishedNotes.length} notes, ${publishedArticles.length} articles, ${courses.length} courses, ${projects.length} projects → dist/`);
