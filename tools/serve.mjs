// Máy chủ tĩnh tối giản (chỉ dùng khi phát triển/kiểm tra). Chạy: node tools/serve.mjs [cổng]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lan = process.argv.includes('--lan');
const port = +process.argv.find(a => /^[0-9]+$/.test(a)) || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mp3': 'audio/mpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || file.includes('node_modules')) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
  });
}).listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`Trên máy tính: http://localhost:${port}`);
  if (lan) {
    const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
    console.log('Trên điện thoại (cùng Wi-Fi), mở Safari và gõ một trong các địa chỉ:');
    ips.forEach(ip => console.log(`   http://${ip}:${port}`));
    console.log('Nhấn Ctrl+C để dừng. Nếu Windows hỏi về tường lửa, chọn "Cho phép" (mạng riêng).');
  }
});
