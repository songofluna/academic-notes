import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const port = Number(process.env.PORT || 4173);
http.createServer(async(req,res)=>{
  try {
    const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const absolute = resolve(join(dist, path === '/' ? 'index.html' : path.slice(1)));
    if(!absolute.startsWith(dist+'/') && absolute !== dist) {res.writeHead(403).end();return;}
    const content = await readFile(absolute);
    res.writeHead(200, {'Content-Type':`${types[extname(absolute)]||'application/octet-stream'}; charset=utf-8`});res.end(content);
  }catch{res.writeHead(404).end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log(`Visit http://localhost:${port}/`));
