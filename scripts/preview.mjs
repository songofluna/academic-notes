// Create a single self-contained HTML file for quickly inspecting the site without a server.
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let html=await readFile(join(root,'index.html'),'utf8');
const css=await readFile(join(root,'styles.css'),'utf8');
const js=await readFile(join(root,'app.js'),'utf8');
let data=await readFile(join(root,'dist/site-data.js'),'utf8');
const img=await readFile(join(root,'assets','hero-photo.webp'));
const inlineImage='data:image/webp;base64,'+img.toString('base64');
// site config references to /assets work in the packed HTML without companion files.
data=data.replaceAll('/assets/hero-photo.webp',inlineImage);
html=html.replace('<link rel="stylesheet" href="styles.css">',`<style>\n${css}\n</style>`);
html=html.replace('<script src="site-data.js" defer></script>',`<script>\n${data.replace(/<\//g,'<\\/')}\n</script>`);
html=html.replace('<script src="app.js" defer></script>','');
// Inline <script defer> does not defer: put the app at the end, after the DOM.
html=html.replace('</body>',`<script>\n${js.replace(/<\//g,'<\\/')}\n</script>\n</body>`);
await writeFile(resolve(root,'../academic-notes-studio-preview.html'),html);
console.log('Created academic-notes-studio-preview.html');
