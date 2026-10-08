// Tails the game log, keeps snapshots in memory, serves the dashboard.
// Usage: node src/server.js <path/to/stdout.txt> [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChunk } from './parser.js';

const logPath = process.argv[2];
const port = Number(process.argv[3] ?? 3000);
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const snapshots = [];
let offset = 0;

function poll() {
  if (!logPath) return;
  let size;
  try { size = fs.statSync(logPath).size; } catch { return; }
  if (size < offset) offset = 0; // log was truncated on game restart
  if (size === offset) return;
  const fd = fs.openSync(logPath, 'r');
  const buf = Buffer.alloc(size - offset);
  fs.readSync(fd, buf, 0, buf.length, offset);
  fs.closeSync(fd);
  offset = size;
  snapshots.push(...parseChunk(buf.toString('utf8')));
  if (snapshots.length > 5000) snapshots.splice(0, snapshots.length - 5000);
}
setInterval(poll, 1000);
poll();

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

http.createServer((req, res) => {
  if (req.url === '/api/snapshots') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(snapshots));
  }
  const name = req.url === '/' ? 'index.html' : path.basename(req.url.split('?')[0]);
  const file = path.join(publicDir, name);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'text/plain' });
    res.end(data);
  });
}).listen(port, () => console.log(`Companion at http://localhost:${port} (log: ${logPath ?? 'none'})`));
