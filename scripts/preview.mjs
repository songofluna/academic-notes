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
const gatedPixelcnnKernel=(await readFile(join(root,'demos/gated-pixelcnn-kernel.mjs'),'utf8')).replace(/^export /gm,'');
const gatedPixelcnnDemo=(await readFile(join(root,'demos/gated-pixelcnn-stacks.html'),'utf8'))
  .replace("import { allowedContext, shiftExample } from './gated-pixelcnn-kernel.mjs';",()=>gatedPixelcnnKernel);
data+='\nwindow.GATED_PIXELCNN_DEMO_SRCDOC = '+JSON.stringify(gatedPixelcnnDemo).replace(/</g,'\\u003c')+';\n';
const wavenetKernel=(await readFile(join(root,'demos/wavenet-kernel.mjs'),'utf8')).replace(/^export /gm,'');
const wavenetDemo=(await readFile(join(root,'demos/wavenet-dilation.html'),'utf8'))
  .replace("import { dilatedGraph } from './wavenet-kernel.mjs';",()=>wavenetKernel);
data+='\nwindow.WAVENET_DEMO_SRCDOC = '+JSON.stringify(wavenetDemo).replace(/</g,'\\u003c')+';\n';
async function packDemo(name) {
  const source = await readFile(join(root, `demos/${name}.html`), 'utf8');
  const inlined = new Set();
  const inlineModules = async text => {
    const imports = [...text.matchAll(/^import \{[^}]+\} from '(\.\/[^']+\.mjs)';$/gm)];
    for (const match of imports) {
      const modulePath = match[1];
      let body = '';
      if (!inlined.has(modulePath)) {
        inlined.add(modulePath);
        body = await inlineModules((await readFile(join(root, 'demos', modulePath), 'utf8')).replace(/^export /gm, ''));
      }
      text = text.replace(match[0], () => body);
    }
    return text;
  };
  return inlineModules(source);
}
const chapter3Demos = {};
for (const name of ['jensen-log', 'variational-gaussian', 'cavi-gaussian', 'monte-carlo-elbo']) chapter3Demos[name] = await packDemo(name);
data += '\nwindow.CHAPTER3_DEMO_SRCDOC = ' + JSON.stringify(chapter3Demos).replace(/</g, '\\u003c') + ';\n';
const chapter4Demos = {};
for (const name of ['monte-carlo-se', 'markov-chain', 'gibbs-gaussian', 'mcmc-mixing', 'langevin-bias']) chapter4Demos[name] = await packDemo(name);
data += '\nwindow.CHAPTER4_DEMO_SRCDOC = ' + JSON.stringify(chapter4Demos).replace(/</g, '\\u003c') + ';\n';
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
