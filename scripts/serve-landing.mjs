// Servidor estático mínimo para probar la landing y el panel en tu computadora.
//   node scripts/serve-landing.mjs [puerto]        (por defecto 8083)
// Para conectarla a un servidor real, copia las dos claves en landing/config.js (no las subas a git).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'landing');
const port = Number(process.argv[2] || 8083);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (!rel || rel.endsWith('/')) rel += 'index.html';
  if (rel.includes('..')) { res.writeHead(400).end('Ruta no válida'); return; }
  try {
    const body = await readFile(join(root, rel));
    res.writeHead(200, { 'Content-Type': types[extname(rel)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
}).listen(port, () => console.log(`Landing en http://localhost:${port}/  ·  panel en http://localhost:${port}/admin.html`));
