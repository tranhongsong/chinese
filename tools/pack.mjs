// Đóng gói toàn bộ trang thành MỘT file HTML chạy local, không cần thư mục hay máy chủ.
// Chạy: node tools/pack.mjs   ->  tạo HanNgu-HSK1.html ở thư mục gốc
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, f) => `<style>\n${read(f)}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) => `<script>\n${read(f).replace(/<\/script/gi, '<\/script')}\n</script>`);
const out = path.join(root, 'HanNgu-HSK1.html');
fs.writeFileSync(out, html);
console.log(`Đã tạo ${out} (${(html.length / 1048576).toFixed(2)} MB)`);
