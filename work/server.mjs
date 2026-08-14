import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const root = new URL('../outputs/', import.meta.url).pathname.replace(/^\/(.:)/, '$1');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'};
http.createServer(async (req,res)=>{
  try { const file=join(root,req.url==='/'?'index.html':req.url.split('?')[0]); const data=await readFile(file); res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'}); res.end(data); }
  catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173,'127.0.0.1');
