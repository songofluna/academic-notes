// Create a single self-contained HTML file for quickly inspecting the site without a server.
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let html=await readFile(join(root,'index.html'),'utf8');
const css=await readFile(join(root,'styles.css'),'utf8');
for (const [path, attributes] of [['assets/content-model.js','defer'], ['assets/vendor/prism.js','data-manual defer']]) {
  const source=await readFile(join(root,path),'utf8');
  html=html.replace(`<script src="${path}" ${attributes}></script>`,()=>`<script data-manual>\n${source.replace(/<\/script/gi,'<\\/script')}\n</script>`);
}
const js=await readFile(join(root,'app.js'),'utf8');
let data=await readFile(join(root,'dist/site-data.js'),'utf8');
// Inline the shared kernel only for the portable preview; deployed demos load it as a module.
const kernel=(await readFile(join(root,'demos/mh-kernel.mjs'),'utf8')).replace(/^export /gm,'');
const demo=(await readFile(join(root,'demos/metropolis-hastings.html'),'utf8'))
  .replace("import { generateChain, pdf1, log2, bananaContour } from './mh-kernel.mjs';",()=>kernel);
data+='\nwindow.MH_DEMO_SRCDOC = '+JSON.stringify(demo).replace(/</g,'\\u003c')+';\n';
const empiricalKernel=(await readFile(join(root,'demos/empirical-kernel.mjs'),'utf8')).replace(/^export /gm,'');
const empiricalDemo=(await readFile(join(root,'demos/empirical-distribution.html'),'utf8'))
  .replace("import { createEmpiricalSampler } from './empirical-kernel.mjs';",()=>empiricalKernel);
data+='\nwindow.EMPIRICAL_DEMO_SRCDOC = '+JSON.stringify(empiricalDemo).replace(/</g,'\\u003c')+';\n';
const madeKernel=(await readFile(join(root,'demos/made-mask.mjs'),'utf8')).replace(/^export /gm,'');
const madeDemo=(await readFile(join(root,'demos/made-mask-explorer.html'),'utf8'))
  .replace("import { madeMasks } from './made-mask.mjs';",()=>madeKernel);
data+='\nwindow.MADE_DEMO_SRCDOC = '+JSON.stringify(madeDemo).replace(/</g,'\\u003c')+';\n';
const pixelcnnKernel=(await readFile(join(root,'demos/pixelcnn-context.mjs'),'utf8')).replace(/^export /gm,'');
const pixelcnnDemo=(await readFile(join(root,'demos/pixelcnn-blind-spot.html'),'utf8'))
  .replace("import { pixelcnnContext } from './pixelcnn-context.mjs';",()=>pixelcnnKernel);
data+='\nwindow.PIXELCNN_DEMO_SRCDOC = '+JSON.stringify(pixelcnnDemo).replace(/</g,'\\u003c')+';\n';
const img=await readFile(join(root,'assets','hero-photo.webp'));
const inlineImage='data:image/webp;base64,'+img.toString('base64');
// site config references to /assets work in the packed HTML without companion files.
data=data.replaceAll('/assets/hero-photo.webp',inlineImage);
// Callback replacements preserve literal $&, $', $` and $$ in code/LaTeX.
html=html.replace('<link rel="stylesheet" href="styles.css">',()=>`<style>\n${css}\n</style>`);
html=html.replace('<script src="site-data.js" defer></script>',()=>`<script>\n${data.replace(/<\//g,'<\\/')}\n</script>`);
html=html.replace('<script src="app.js" defer></script>','');
// Inline <script defer> does not defer: put the app at the end, after the DOM.
html=html.replace('</body>',()=>`<script>\n${js.replace(/<\//g,'<\\/')}\n</script>\n</body>`);
await writeFile(resolve(root,'../academic-notes-studio-preview.html'),html);
console.log('Created academic-notes-studio-preview.html');
