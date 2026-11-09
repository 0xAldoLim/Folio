import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve('.'),mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webm':'video/webm'};
createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}const content=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','Cache-Control':'no-store'});res.end(content);}catch{res.writeHead(404).end('Not found');}}).listen(4179,'127.0.0.1',()=>console.log('Folio fixtures: http://127.0.0.1:4179/tests/fixtures/article.html'));
