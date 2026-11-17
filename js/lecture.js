/* Video bài giảng: giáo viên ảo giảng từng bài (giọng nói + bảng đen + phụ đề + hoạt hình nét chữ).
   Toàn bộ kịch bản tự sinh từ dữ liệu trong data/lessons.js nên bài nào cũng có. */
(() => {
'use strict';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Xử lý văn bản để đọc ---------- */
const stripHtml = s => String(s).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const PY_ONLY = 'āǎēěīǐōǒūǔǖǘǚǜ'; /* dấu thanh chỉ có trong pinyin, không có trong tiếng Việt */
const hasPy = s => [...s].some(c => PY_ONLY.includes(c));
function cleanVi(t) {
  return t
    .replace(/\([^()]*\)/g, m => (hasPy(m) || /[1-4]/.test(m) ? ' ' : m))
    .split(/\s+/).filter(w => !hasPy(w)).join(' ')
    .replace(/\+/g, ' cộng ').replace(/[→⟶=]/g, ', ').replace(/[“”"«»*()\[\]/]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
const ZH = /[㐀-鿿][㐀-鿿　-〿＀-￯\s]*/g;
/* Tách đoạn văn lẫn Hán-Việt: phần tiếng Việt đọc bằng giọng Việt, phần chữ Hán đọc bằng giọng Trung */
function mixed(text, extra = {}) {
  const plain = stripHtml(text), out = [];
  const pushVi = s => {
    const c = cleanVi(s);
    if (!/[A-Za-zÀ-ỹ0-9]/.test(c)) return;
    c.replace(/([.!?:;])\s+/g, '$1\u0001').split('\u0001').forEach(p => { if (p.trim()) out.push({ lang: 'vi', text: p.trim(), ...extra }); });
  };
  let last = 0, m; ZH.lastIndex = 0;
  while ((m = ZH.exec(plain))) {
    if (m.index > last) pushVi(plain.slice(last, m.index));
    const z = m[0].replace(/\s+/g, '');
    if (z) out.push({ lang: 'zh', text: z, sub: z, ...extra });
    last = m.index + m[0].length;
  }
  if (last < plain.length) pushVi(plain.slice(last));
  return out;
}

/* ---------- Soạn kịch bản bài giảng ---------- */
function build(L) {
  const HAS = window.HANYU.HAS;
  const S = [];
  const nv = L.vocab.length, nd = L.dialogues.length, ng = L.grammar.length;

  /* 1. Mở đầu */
  S.push({
    label: 'Mở đầu',
    board: `<div class="lb-big kai" data-k="0">${esc(L.h)}</div><div class="lb-py" data-k="0">${esc(L.p)}</div><div class="lb-vi" data-k="1">${esc(L.v)}</div>
      <div class="lb-goal" data-k="2">🎯 ${esc(L.goal)}</div>
      <ul class="lb-list" data-k="3"><li>${nv} từ mới</li><li>${nd} đoạn hội thoại</li><li>${ng} điểm ngữ pháp</li><li>Bài tập luyện tập</li></ul>`,
    steps: [
      { lang: 'vi', text: `Xin chào các bạn! Chào mừng các bạn đến với bài số ${L.id}.` },
      { lang: 'vi', text: 'Tên bài học hôm nay là:', k: 0 },
      { lang: 'zh', text: L.h, rate: 0.7, k: 0, sub: `${L.h}  ${L.p}` },
      { lang: 'vi', text: `Nghĩa là: ${L.v}.`, k: 1 },
      { lang: 'vi', text: `Mục tiêu của bài này: ${L.goal}.`, k: 2 },
      { lang: 'vi', text: `Hôm nay chúng ta sẽ học ${nv} từ mới, ${nd} đoạn hội thoại và ${ng} điểm ngữ pháp. Chúng ta bắt đầu nào!`, k: 3 },
    ],
  });

  /* 2. Từ mới: mỗi từ một slide có hoạt hình nét viết */
  L.vocab.forEach((w, i) => {
    const say = w.say || w.h;
    const chars = [...w.h].filter(window.HANYU.HAS).slice(0, 3);
    S.push({
      label: `Từ mới ${i + 1}/${nv}: ${w.h}`,
      board: `<div class="lb-tag">TỪ MỚI ${i + 1}/${nv}</div><div class="lb-big kai" data-k="0">${esc(w.h)}</div><div class="lb-py" data-k="1">${esc(w.p)}</div>
        <div class="lb-vi" data-k="2">${esc(w.v)} <span class="lb-small">· ${esc(w.t)}</span></div>${w.hv ? `<div class="lb-hv" data-k="3">Hán Việt: ${esc(w.hv)}</div>` : ''}
        <div class="lb-strokes" data-strokes="${esc(chars.join(''))}"></div>`,
      after: board => {
        const holder = board.querySelector('.lb-strokes'); if (!holder) return;
        const size = chars.length > 1 ? 130 : 170;
        chars.forEach(c => holder.append(window.HANYU.strokeCard(c, size, { autoPlay: true })));
      },
      steps: [
        { lang: 'vi', text: i === 0 ? 'Chúng ta bắt đầu với từ mới đầu tiên.' : `Từ mới thứ ${i + 1}.` },
        { lang: 'zh', text: say, rate: 0.6, k: 0, sub: `${w.h}  ${w.p}` },
        { lang: 'vi', text: `Nghĩa là: ${w.v}.`, k: 2 },
        ...(w.hv ? [{ lang: 'vi', text: `Âm Hán Việt là: ${w.hv}.`, k: 3 }] : []),
        { lang: 'vi', text: 'Các bạn đọc theo cô nhé.' },
        { wait: 1500 },
        { lang: 'zh', text: say, rate: 0.8, k: 1, sub: `${w.h}  ${w.p}` },
        { wait: 1200 },
      ],
    });
  });

  /* 3. Ôn nhanh từ vựng */
  S.push({
    label: 'Ôn nhanh từ vựng',
    board: `<div class="lb-tag">ÔN NHANH</div><div class="lb-grid">${L.vocab.map((w, i) => `<div class="lb-cell" data-k="${i}"><span class="kai">${esc(w.h)}</span><small>${esc(w.p)}</small><small>${esc(w.v)}</small></div>`).join('')}</div>`,
    steps: [
      { lang: 'vi', text: 'Bây giờ chúng ta cùng ôn nhanh lại toàn bộ từ vựng vừa học.' },
      ...L.vocab.map((w, i) => ({ lang: 'zh', text: w.say || w.h, rate: 0.8, k: i, sub: `${w.h}  ${w.p}  ·  ${w.v}` })),
      { lang: 'vi', text: 'Rất tốt! Chúng ta sang phần hội thoại.' },
    ],
  });

  /* 4. Hội thoại */
  L.dialogues.forEach((d, di) => {
    S.push({
      label: `Hội thoại ${di + 1}/${nd}`,
      board: `<div class="lb-tag">HỘI THOẠI ${di + 1}/${nd}</div><h3 class="lb-h">${esc(d.title)}</h3>${d.lines.map((ln, li) => `<div class="lb-line ${ln.s === 'B' ? 'b' : ''}" data-k="${li}"><b>${esc(ln.s)}</b><div><div class="kai lb-hz">${esc(ln.h)}</div><div class="lb-pyl">${esc(ln.p)}</div><div class="lb-vil">${esc(ln.v)}</div></div></div>`).join('')}`,
      steps: [
        { lang: 'vi', text: `Bây giờ chúng ta nghe ${stripHtml(d.title).replace(/[–-]/g, ',')}. Hai bạn hãy chú ý lắng nghe, mỗi câu cô sẽ đọc rồi giải nghĩa.` },
        ...d.lines.flatMap((ln, li) => [
          { lang: 'zh', text: ln.say || ln.h, role: ln.s, rate: 0.8, k: li, sub: `${ln.s}:  ${ln.h}   ${ln.p}` },
          { lang: 'vi', text: `Nghĩa là: ${ln.v}`, k: li, sub: ln.v },
        ]),
        { lang: 'vi', text: 'Các bạn hãy luyện đọc lại đoạn hội thoại này, một bạn đóng vai A, một bạn đóng vai B nhé.' },
      ],
    });
  });

  /* 5. Ngữ pháp */
  L.grammar.forEach((g, gi) => {
    const exs = g.ex || [];
    S.push({
      label: `Ngữ pháp ${gi + 1}/${ng}`,
      board: `<div class="lb-tag">NGỮ PHÁP ${gi + 1}/${ng}</div><h3 class="lb-h">${esc(g.t)}</h3><div class="lb-body" data-k="0">${g.body}</div>
        ${g.table ? `<table class="t lb-table" data-k="1"><tr>${g.table[0].map(c => `<th>${esc(c)}</th>`).join('')}</tr>${g.table.slice(1).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>` : ''}
        ${exs.map((e, j) => `<div class="lb-ex" data-k="${2 + j}"><div class="kai lb-hz">${esc(e.h)}</div><div class="lb-pyl">${esc(e.p)}</div><div class="lb-vil">${esc(e.v)}</div></div>`).join('')}`,
      steps: [
        { lang: 'vi', text: `Điểm ngữ pháp số ${gi + 1}.` },
        ...mixed(g.t),
        ...mixed(g.body, { k: 0 }),
        ...(g.table ? [{ lang: 'vi', text: 'Các bạn xem bảng trên bảng đen.', k: 1 }] : []),
        ...(exs.length ? [{ lang: 'vi', text: 'Chúng ta cùng xem các ví dụ.' }] : []),
        ...exs.flatMap((e, j) => [
          { lang: 'zh', text: e.h.replace(/\s+/g, ''), rate: 0.8, k: 2 + j, sub: `${e.h}   ${e.p}` },
          { lang: 'vi', text: `Nghĩa là: ${e.v}`, k: 2 + j, sub: e.v },
        ]),
      ],
    });
  });

  /* 6. Văn hoá */
  if (L.culture) {
    S.push({
      label: 'Góc văn hoá',
      board: `<div class="lb-tag">GÓC VĂN HOÁ</div><div class="lb-body lb-culture" data-k="0">${esc(L.culture)}</div>`,
      steps: [{ lang: 'vi', text: 'Bây giờ là góc văn hoá.' }, ...mixed(L.culture, { k: 0 })],
    });
  }

  /* 6b. Mẹo học riêng của bài */
  const lt = window.TIPS && window.TIPS.lesson && window.TIPS.lesson[L.id];
  if (lt) {
    S.push({
      label: 'Mẹo học',
      board: `<div class="lb-tag">💡 MẸO HỌC</div><ul class="lb-list">${lt.map((t, i) => `<li data-k="${i}">${t}</li>`).join('')}</ul>`,
      steps: [{ lang: 'vi', text: 'Một vài mẹo nhỏ cho bài này.' }, ...lt.flatMap((t, i) => mixed(t, { k: i }))],
    });
  }

  /* 7. Kết bài */
  S.push({
    label: 'Tổng kết',
    board: `<div class="lb-tag">TỔNG KẾT</div><div class="lb-big kai" data-k="0">${esc(L.h)}</div><ul class="lb-list" data-k="1"><li>Ôn lại ${nv} từ mới ở tab <b>Từ vựng</b></li><li>Luyện đọc hội thoại hai vai</li><li>Làm bài tập ở tab <b>Luyện tập</b></li></ul>
      <p class="lb-actions" data-k="2"><a class="btn primary" href="#/lesson/${L.id}/practice">Làm bài tập ngay →</a> ${L.id < 15 ? `<a class="btn" href="#/lesson/${L.id + 1}/video">Bài ${L.id + 1}</a>` : ''}</p>`,
    steps: [
      { lang: 'vi', text: `Vậy là chúng ta đã học xong bài số ${L.id}.`, k: 0 },
      { lang: 'vi', text: 'Về nhà các bạn hãy ôn lại từ mới, luyện đọc hội thoại và làm bài tập nhé.', k: 1 },
      { lang: 'vi', text: 'Cảm ơn các bạn đã theo dõi. Hẹn gặp lại các bạn ở bài sau!', k: 2 },
      { lang: 'zh', text: '再见!', rate: 0.7, sub: '再见!  Zàijiàn!  ·  Tạm biệt!' },
    ],
  });
  return S;
}

/* ---------- Video nhúng (YouTube, TikTok, Bilibili, file mp4) ---------- */
function parseVideo(url) {
  const u = String(url || '').trim(); if (!u) return null;
  let m;
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/))) return { kind: 'YouTube', src: 'https://www.youtube-nocookie.com/embed/' + m[1], url: u };
  if (/youtube\.com\/playlist/.test(u) && (m = u.match(/[?&]list=([\w-]+)/))) return { kind: 'YouTube', src: 'https://www.youtube-nocookie.com/embed/videoseries?list=' + m[1], url: u };
  if ((m = u.match(/tiktok\.com\/[^?#]*\/video\/(\d+)/))) return { kind: 'TikTok', src: 'https://www.tiktok.com/embed/v2/' + m[1], url: u, tall: true };
  if ((m = u.match(/bilibili\.com\/video\/(BV\w+)/i))) return { kind: 'Bilibili', src: 'https://player.bilibili.com/player.html?bvid=' + m[1] + '&autoplay=0', url: u };
  if (/\.(mp4|webm|ogv|m4v)(\?.*)?$/i.test(u)) return { kind: 'Video', file: /^https?:/i.test(u) ? u : (u.startsWith('video/') ? u : 'video/' + u), url: u };
  if (/\/\/(vm|vt)\.tiktok\.com|tiktok\.com\/t\//.test(u)) return { err: 'Link rút gọn của TikTok chưa dùng được. Hãy mở video trên trình duyệt rồi sao chép link đầy đủ dạng tiktok.com/@tên/video/123…' };
  return { err: 'Chưa nhận ra link. Hỗ trợ: YouTube, TikTok (link đầy đủ), Bilibili, hoặc file .mp4 / .webm.' };
}
function videoPlayer(v) {
  if (v.file) return `<video controls preload="metadata" src="${esc(v.file)}" style="width:100%;max-height:70vh;background:#000;border-radius:10px"></video>`;
  const style = v.tall ? 'width:min(340px,100%);height:600px;margin:0 auto;display:block' : 'width:100%;aspect-ratio:16/9';
  return `<iframe src="${esc(v.src)}" style="${style};border:0;border-radius:10px;background:#000" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="Video bài giảng"></iframe>`;
}
/* Khu vực video: danh sách video đã gắn cho một bài (key), cho phép dán link thêm/xoá */
function videoSection(host, key, label) {
  const H = window.HANYU, $ = H.$;
  H.S.videos = H.S.videos || {};
  const fixed = [].concat((window.VIDEO_MAP || {})[key] || []).map(parseVideo).filter(v => v && !v.err);
  const render = () => {
    const mine = H.S.videos[key] || [];
    const all = [...fixed.map(v => ({ ...v, fixed: true })), ...mine.map((t, i) => ({ ...parseVideo(t), i }))].filter(v => v.kind);
    host.innerHTML = `<div class="card vsec" style="margin-bottom:14px"><h3 style="margin-top:0">🎬 Video học thêm · ${esc(label)}</h3>
      ${all.length ? all.map(v => `<div class="vitem"><div class="vhead"><span class="tag">${esc(v.kind)}</span><a class="small" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">Mở trong tab mới ↗</a>${v.fixed ? '' : `<button class="btn sm ghost" data-vdel="${v.i}">Xoá</button>`}</div>${videoPlayer(v)}</div>`).join('') : '<p class="muted small">Chưa có video nào. Dán link bài giảng YouTube, TikTok hoặc Bilibili mà bạn thích vào ô bên dưới.</p>'}
      <div class="row" style="margin-top:10px"><input class="input" id="vUrl" placeholder="Dán link YouTube / TikTok / Bilibili / .mp4…" style="flex:1;min-width:200px"><button class="btn primary" id="vAdd">+ Thêm video</button></div>
      <p id="vErr" class="small" style="color:var(--red);min-height:1.2em;margin:6px 0 0"></p>
      <p class="small muted" style="margin:0">Video được <b>nhúng</b> từ trang gốc nên cần có mạng và vẫn do kênh gốc quản lý. Link được lưu trên máy bạn. Nếu YouTube báo lỗi khi mở trực tiếp file index.html, hãy chạy <code>node tools/serve.mjs</code> rồi vào http://localhost:5173.</p></div>`;
    const add = () => {
      const v = parseVideo($('#vUrl', host).value);
      if (!v) return;
      if (v.err) { $('#vErr', host).textContent = v.err; return; }
      if (mine.includes(v.url)) { $('#vErr', host).textContent = 'Video này đã được thêm.'; return; }
      H.S.videos[key] = [...mine, v.url]; H.save(); render();
    };
    $('#vAdd', host).onclick = add;
    $('#vUrl', host).addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
    host.querySelectorAll('[data-vdel]').forEach(b => b.onclick = () => { const arr = [...mine]; arr.splice(+b.dataset.vdel, 1); H.S.videos[key] = arr; H.save(); render(); });
  };
  render();
}

/* ---------- Trình phát ---------- */
let instance = 0;
function mount(box, L, custom) {
  const H = window.HANYU, Voice = H.Voice, $ = H.$, $$ = H.$$;
  const my = ++instance;
  const slides = custom ? custom.slides : build(L);
  let si = 0, pi = 0, playing = false, token = 0, speed = 1;

  box.innerHTML = `<div class="lec">
    <div class="stage">
      <div class="lec-top"><div class="teacher" id="lTeacher" title="Cô giáo">👩‍🏫</div><div class="lec-name"><b>Cô Hoa</b><span>Giáo viên Hán ngữ · ${custom ? esc(custom.title) : `Bài ${L.id}: ${esc(L.v)}`}</span></div><div class="lec-slide" id="lCount"></div></div>
      <div class="board" id="lBoard"></div>
      <div class="subs" id="lSubs">Bấm ▶ để bắt đầu bài giảng.</div>
      <div class="lec-prog"><i id="lProg"></i></div>
    </div>
    <div class="lec-ctrl">
      <button class="btn" id="lPrev" title="Slide trước">⏮</button>
      <button class="btn primary" id="lPlay">▶ Bắt đầu học</button>
      <button class="btn" id="lNext" title="Slide sau">⏭</button>
      <select class="input" id="lSel" title="Chọn phần" style="max-width:240px">${slides.map((s, i) => `<option value="${i}">${i + 1}. ${esc(s.label)}</option>`).join('')}</select>
      <select class="input" id="lSpd" title="Tốc độ"><option value="0.8">Chậm 0.8×</option><option value="1" selected>Vừa 1×</option><option value="1.25">Nhanh 1.25×</option></select>
    </div>
    <p class="small muted" id="lNote"></p>
    <div id="vidHost" style="margin-top:16px"></div></div>`;

  videoSection($('#vidHost', box), custom ? 'tones' : L.id, custom ? custom.title : `Bài ${L.id}`);
  const board = $('#lBoard', box), subs = $('#lSubs', box), teacher = $('#lTeacher', box), playBtn = $('#lPlay', box);
  if (!Voice.vi.length) $('#lNote', box).innerHTML = '⚠ Máy chưa có giọng đọc tiếng Việt nên cô giáo sẽ chỉ hiện <b>phụ đề</b> cho phần tiếng Việt (phần tiếng Trung vẫn có tiếng). Dùng <b>Microsoft Edge</b> và cài giọng Vietnamese (Cài đặt Windows → Time &amp; language → Speech) để nghe giảng đầy đủ.';
  else $('#lNote', box).textContent = 'Mẹo: bấm vào chữ Hán hoặc ▶ ở hoạt hình nét để xem lại; chọn phần ở danh sách để nhảy tới.';

  const alive = () => my === instance && box.isConnected;
  const ui = () => {
    playBtn.textContent = playing ? '⏸ Tạm dừng' : (si === 0 && pi === 0 ? '▶ Bắt đầu học' : '▶ Tiếp tục');
    $('#lCount', box).textContent = `${si + 1}/${slides.length}`;
    $('#lSel', box).value = si;
    $('#lProg', box).style.width = ((si + (slides[si].steps.length ? pi / slides[si].steps.length : 0)) / slides.length * 100) + '%';
    teacher.classList.toggle('speaking', false);
  };
  const reveal = k => {
    $$('.hl', board).forEach(e => e.classList.remove('hl'));
    if (k == null) return;
    const els = $$(`[data-k="${k}"]`, board);
    els.forEach(e => { e.classList.remove('pend'); e.classList.add('hl'); });
    if (els[0]) board.scrollTo({ top: Math.max(0, els[0].offsetTop - board.clientHeight / 3), behavior: 'smooth' });
  };
  const showSlide = i => {
    si = i; pi = 0;
    const s = slides[i];
    board.innerHTML = s.board;
    $$('[data-k]', board).forEach(e => e.classList.add('pend'));
    board.scrollTop = 0;
    if (s.after) s.after(board);
    ui();
  };
  const stop = () => { token++; playing = false; Voice.stop(); ui(); };

  async function run() {
    const t = ++token; playing = true;
    if (!board.firstChild) showSlide(si);
    ui();
    while (alive() && t === token && si < slides.length) {
      const s = slides[si];
      while (pi < s.steps.length) {
        const st = s.steps[pi];
        if (st.wait) { await sleep(st.wait / speed); }
        else {
          reveal(st.k);
          subs.textContent = st.sub || st.text;
          teacher.classList.add('speaking');
          const rate = st.lang === 'vi' ? speed : (st.rate ? st.rate * speed : H.S.prefs.rate * speed);
          await Voice._say(st.text, st.role || 'A', rate, st.lang);
          teacher.classList.remove('speaking');
          if (alive() && t === token) await sleep(220 / speed);
        }
        if (!alive() || t !== token) return;
        pi++; $('#lProg', box).style.width = ((si + pi / s.steps.length) / slides.length * 100) + '%';
      }
      if (si + 1 < slides.length) { showSlide(si + 1); await sleep(500); }
      else break;
    }
    if (alive() && t === token) {
      playing = false; subs.textContent = '🎉 Kết thúc bài giảng. Hãy làm bài tập để củng cố nhé!';
      H.bump(10); H.save(); ui(); playBtn.textContent = '↺ Học lại từ đầu'; si = slides.length - 1; pi = slides[si].steps.length;
    }
  }
  const go = i => {
    const was = playing; stop();
    showSlide(Math.max(0, Math.min(slides.length - 1, i)));
    subs.textContent = slides[si].label;
    if (was) run();
  };

  playBtn.onclick = () => {
    if (playing) { stop(); return; }
    if (si === slides.length - 1 && pi >= slides[si].steps.length) { showSlide(0); }
    run();
  };
  $('#lPrev', box).onclick = () => go(si - 1);
  $('#lNext', box).onclick = () => go(si + 1);
  $('#lSel', box).onchange = e => go(+e.target.value);
  $('#lSpd', box).onchange = e => { speed = +e.target.value; };
  showSlide(0);
  subs.textContent = 'Bấm ▶ để bắt đầu bài giảng.';
}

window.Lecture = { mount };
})();
