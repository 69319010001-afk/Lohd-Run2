const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'outputs');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.wav':'audio/wav'};
http.createServer((req, res) => {
  const clean = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(root, clean === '/' ? 'index.html' : clean);
  if (!file.startsWith(root)) { res.statusCode = 403; return res.end('Forbidden'); }
  fs.readFile(file, (error, data) => {
    if (error) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', types[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  });
}).listen(4173, '127.0.0.1');
