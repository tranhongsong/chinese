// Gom dữ liệu nét chữ (hanzi-writer-data) cho mọi chữ Hán xuất hiện trong data/*.js, js/*.js, index.html.
// Chạy: node tools/build.mjs  (cần chạy `npm install` trong thư mục tools một lần)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'tools', 'node_modules', 'hanzi-writer-data');

const sources = [
  ...fs.readdirSync(path.join(root, 'data')).filter(f => f.endsWith('.js')).map(f => path.join(root, 'data', f)),
  ...fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => path.join(root, 'js', f)),
  path.join(root, 'index.html'),
];

const chars = new Set();
for (const f of sources) {
  const text = fs.readFileSync(f, 'utf8');
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (c >= 0x4e00 && c <= 0x9fff) chars.add(ch);
  }
}
// Chữ bổ sung (luôn có sẵn để luyện viết)
for (const ch of '一二三四五六七八九十零') chars.add(ch);

const out = {};
const missing = [];
for (const ch of [...chars].sort()) {
  const file = path.join(dataDir, ch + '.json');
  if (fs.existsSync(file)) out[ch] = JSON.parse(fs.readFileSync(file, 'utf8'));
  else missing.push(ch);
}

fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
const js = '/* Tự sinh bởi tools/build.mjs từ hanzi-writer-data (Make Me a Hanzi, Arphic Public License) */\n' +
  'window.HANZI_DATA = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(root, 'vendor', 'strokes.js'), js);

console.log(`Chữ Hán trong dự án: ${chars.size}`);
console.log(`Có dữ liệu nét: ${Object.keys(out).length}`);
console.log(`Thiếu dữ liệu (${missing.length}): ${missing.join(' ')}`);
console.log(`strokes.js: ${(js.length / 1024).toFixed(0)} KB`);
