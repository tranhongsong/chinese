/* Hán ngữ nhập môn – ứng dụng học tiếng Trung chạy offline (không cần máy chủ). */
(() => {
'use strict';

/* ================= Tiện ích ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const view = $('#view');
const HAS = ch => !!(window.HANZI_DATA && window.HANZI_DATA[ch]);

/* ================= Lưu trữ ================= */
const KEY = 'hanyu.v1';
let S = { done: {}, parts: {}, exam: null, quiz: {}, known: {}, srs: {}, days: {}, prefs: { showPy: true, showVi: true, rate: 0.85, voice: '', anim: 1, theme: '' } };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) { const o = JSON.parse(raw); S = { ...S, ...o, prefs: { ...S.prefs, ...(o.prefs || {}) } }; }
} catch (e) { /* không có localStorage: vẫn chạy bình thường */ }
/* Ngày học, chuỗi ngày, ôn tập ngắt quãng (Leitner) */
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
const bump = (n = 1) => { const d = today(); S.days[d] = (S.days[d] || 0) + n; };
const GOAL = 20;
function streak() {
  let d = today(), n = 0;
  if (!S.days[d]) d--;
  while (S.days[d]) { n++; d--; }
  return n;
}
const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
const isDue = k => S.srs[k] && S.srs[k].due <= today();
const dueCount = () => ALLV.filter(w => isDue(w.key)).length;
const rateWord = (k, good) => {
  const b = S.srs[k] ? S.srs[k].box : 0;
  const nb = good ? Math.min(6, b + 1) : 0;
  S.srs[k] = { box: nb, due: today() + (good ? INTERVALS[nb] : 0) };
  if (good) S.known[k] = 1; else delete S.known[k];
  bump();
};
const normTxt = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '');
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
function applyTheme() {
  const t = S.prefs.theme;
  if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
}
applyTheme();

/* ================= Chỉ mục dữ liệu ================= */
const LESSONS = window.LESSONS || [];
const ALLV = [];
{
  const seen = new Set();
  LESSONS.forEach(L => L.vocab.forEach(w => {
    const k = w.h + w.p;
    if (!seen.has(k)) { seen.add(k); ALLV.push({ ...w, lesson: L.id, key: k }); }
  }));
}
const RADS = [];
(window.RADICALS || []).forEach(g => g.items.forEach(it => RADS.push({ ...it, cat: g.cat })));
const RAD_OF = {};
RADS.forEach(r => {
  (RAD_OF[r.r] = RAD_OF[r.r] || []).push(r);
  r.ex.forEach(e => { (RAD_OF[e[0]] = RAD_OF[e[0]] || []); if (!RAD_OF[e[0]].includes(r)) RAD_OF[e[0]].push(r); });
});

/* ================= Từ điển tổng hợp (từ, câu, cụm từ) ================= */
const ZHCH = /[\u3400-\u9fff]/g;
const zhOnly = s => (String(s).match(ZHCH) || []).join('');
const LEX = new Map();      /* chữ Hán -> { p, v, say } dùng cho hộp tra khi bôi đen */
const DICT = [];            /* mục để tìm kiếm: từ và câu */
const lexAdd = (h, p, v, say) => {
  const k = zhOnly(h); if (!k || !p) return;
  const old = LEX.get(k);
  if (!old || (!old.v && v)) LEX.set(k, { p, v: v || '', say: say || k });
};
ALLV.forEach(w => { lexAdd(w.h, w.p, w.v, w.say); DICT.push({ h: w.h, p: w.p, v: w.v, hv: w.hv || '', t: w.t, say: w.say || w.h, lesson: w.lesson, word: true }); });
{
  const seenS = new Set();
  const addSent = (h, p, v, lesson, say) => {
    const k = zhOnly(h); if (!k || seenS.has(k)) return; seenS.add(k);
    DICT.push({ h, p, v, hv: '', t: 'câu / cụm từ', say: say || k, lesson, word: false });
    lexAdd(h, p, v, say);
  };
  LESSONS.forEach(L => {
    lexAdd(L.h, L.p, L.v);
    L.dialogues.forEach(d => d.lines.forEach(ln => {
      addSent(ln.h, ln.p, ln.v, L.id, ln.say);
      if (ln.g) { const t = ln.g.split(' '), ps = String(ln.p).replace(/[.,?!，。？！]/g, '').split(/\s+/); if (t.length === ps.length) t.forEach((x, i) => lexAdd(x, ps[i], '')); }
    }));
    L.grammar.forEach(g => (g.ex || []).forEach(e => addSent(e.h, e.p, e.v, L.id)));
  });
}
RADS.forEach(r => { lexAdd(r.r, r.py, r.vi); r.ex.forEach(e => lexAdd(e[0], e[1], e[2])); });
(window.WRITING ? [...window.WRITING.strokes, ...window.WRITING.structures, ...window.WRITING.liushu] : []).forEach(s => (s.ex || []).forEach(e => lexAdd(e[0], e[1], e[2])));
if (window.PINYIN) [...window.PINYIN.initials, ...window.PINYIN.finals].forEach(g => g.items.forEach(it => lexAdd(it.ex, it.py, it.vi)));
/* Cắt một đoạn chữ Hán thành các từ (khớp dài nhất trước) */
function segmentZh(text) {
  const s = [...zhOnly(text)], out = [];
  for (let i = 0; i < s.length;) {
    let n = Math.min(8, s.length - i), hit = null;
    for (; n > 0; n--) { const k = s.slice(i, i + n).join(''); if (LEX.has(k)) { hit = { h: k, ...LEX.get(k) }; break; } }
    if (hit) { out.push(hit); i += n; } else { out.push({ h: s[i], p: '', v: '', say: s[i] }); i++; }
  }
  return out;
}

/* ================= Hộp tra nhanh khi bôi đen chữ Hán ================= */
const selBox = document.createElement('div'); selBox.id = 'selBox'; selBox.hidden = true; document.body.append(selBox);
const hideSel = () => { selBox.hidden = true; };
function checkSelection() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) { hideSel(); return; }
  if (selBox.contains(sel.anchorNode)) return;
  const el = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
  if (el && el.closest('input,textarea,select')) { hideSel(); return; }
  const text = sel.toString().trim();
  if (!/[\u3400-\u9fff]/.test(text) || zhOnly(text).length > 60) { hideSel(); return; }
  const key = zhOnly(text), whole = LEX.get(key), segs = segmentZh(text);
  const py = whole ? whole.p : segs.map(x => x.p || x.h).join(' ');
  const parts = segs.filter(x => x.v);
  const meaning = whole && whole.v ? whole.v : (parts.length ? parts.map(x => `<b class="kai">${esc(x.h)}</b> ${esc(x.v)}`).join('<br>') : '');
  selBox.innerHTML = `<div class="sb-row"><span class="sb-hz kai">${esc(text.length > 30 ? text.slice(0, 30) + '…' : text)}</span><button class="spk" id="sbSay" title="Nghe phát âm" aria-label="Nghe">🔊</button></div>
    <div class="sb-py">${esc(py) || '<span class="muted">(chưa có pinyin trong dữ liệu)</span>'}</div>
    <div class="sb-vi">${meaning || '<span class="muted">Chưa có nghĩa trong dữ liệu bài học.</span>'}</div>`;
  const say = whole ? whole.say : key;
  $('#sbSay', selBox).onmousedown = e => e.preventDefault();
  $('#sbSay', selBox).onclick = () => Voice.speak(say);
  const r = sel.getRangeAt(0).getBoundingClientRect();
  selBox.hidden = false;
  const w = selBox.offsetWidth, h = selBox.offsetHeight;
  let x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
  let y = r.bottom + 10; if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 10);
  selBox.style.left = x + 'px'; selBox.style.top = y + 'px';
  Voice.speak(say);
}
document.addEventListener('mouseup', e => { if (!selBox.contains(e.target)) setTimeout(checkSelection, 10); });
document.addEventListener('keyup', e => { if (e.shiftKey || e.key.startsWith('Arrow')) setTimeout(checkSelection, 10); });
document.addEventListener('touchend', () => setTimeout(checkSelection, 300));
document.addEventListener('mousedown', e => { if (!selBox.contains(e.target)) hideSel(); });
window.addEventListener('scroll', hideSel, { passive: true });
window.addEventListener('hashchange', hideSel);

/* ================= Giọng đọc ================= */
const Voice = {
  zh: [], vi: [], run: 0, audio: null,
  init() {
    if (!('speechSynthesis' in window)) { this.status(); return; }
    const load = () => {
      this.vi = speechSynthesis.getVoices().filter(v => /^vi/i.test(v.lang)).sort((x, y) => (/Natural|Online/i.test(y.name) ? 1 : 0) - (/Natural|Online/i.test(x.name) ? 1 : 0));
      this.zh = speechSynthesis.getVoices().filter(v => /^zh/i.test(v.lang) || /chinese|中文|mandarin/i.test(v.name));
      this.status();
    };
    load();
    speechSynthesis.onvoiceschanged = load;
  },
  status() {
    const el = $('#voiceStatus');
    const v = this.pick('A');
    const map = window.AUDIO_MAP || {};
    if (Object.keys(map).length) { el.textContent = '🔊 File MP3 trong thư mục audio'; el.className = 'voice-status'; }
    else if (v) { el.textContent = '🔊 ' + v.name.replace(/^Microsoft\s+/, ''); el.className = 'voice-status'; }
    else { el.textContent = '⚠ Chưa có giọng tiếng Trung'; el.className = 'voice-status bad'; }
  },
  score(v, role) {
    let s = 0; const n = v.name;
    if (/Natural|Online/i.test(n)) s += 5;
    if (/zh[-_]CN/i.test(v.lang)) s += 3; else if (/zh[-_](TW|HK)/i.test(v.lang)) s -= 2;
    if (/Google/i.test(n)) s += 1;
    if (role === 'A' && /Xiaoxiao|Xiaoyi|Huihui|Yaoyao|Tracy|Female/i.test(n)) s += 2;
    return s;
  },
  pick(role) {
    const zh = this.zh; if (!zh.length) return null;
    if (role === 'A' && S.prefs.voice) { const f = zh.find(x => x.voiceURI === S.prefs.voice); if (f) return f; }
    const sorted = [...zh].sort((a, b) => this.score(b, role) - this.score(a, role));
    if (role === 'B') {
      const male = sorted.find(v => /Yunxi|Yunyang|Yunjian|Kangkang|Male|Yunhao/i.test(v.name));
      if (male) return male;
    }
    return sorted[0];
  },
  stop() {
    this.run++;
    if (this.audio) { try { this.audio.pause(); } catch (e) {} this.audio = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    $$('.playing').forEach(e => e.classList.remove('playing'));
  },
  speak(text, role = 'A', rate, lang) { this.stop(); return this._say(text, role, rate, lang); },
  /* Đọc lần lượt nhiều mục; hooks.start(item,i) / hooks.end(item,i); dừng ngay khi có lệnh đọc khác */
  async seq(items, hooks = {}, gap = 350) {
    this.stop(); const my = this.run;
    for (let i = 0; i < items.length; i++) {
      if (this.run !== my) return;
      const it = items[i];
      if (hooks.start) hooks.start(it, i);
      await this._say(it.text, it.role || 'A');
      if (hooks.end) hooks.end(it, i);
      if (this.run !== my) return;
      await new Promise(r => setTimeout(r, gap));
    }
  },
  /* Trả về Promise, resolve khi đọc xong hoặc bị dừng */
  _say(text, role = 'A', rate, lang) {
    if (lang === 'vi') {
      const r = rate || 1;
      if (!('speechSynthesis' in window) || !this.vi.length) return new Promise(res => setTimeout(res, Math.max(1000, String(text).length * 75 / r))); /* không có giọng Việt: chạy theo phụ đề */
      return new Promise(res0 => {
        let done = false; const res = () => { if (!done) { done = true; res0(); } };
        const u = new SpeechSynthesisUtterance(String(text));
        u.lang = 'vi-VN'; u.voice = this.vi[0]; u.rate = r;
        u.onend = u.onerror = () => res();
        setTimeout(res, 3000 + String(text).length * 120 / r); /* dự phòng: iOS đôi khi không báo kết thúc */
        setTimeout(() => speechSynthesis.speak(u), 60);
      });
    }
    const clean = String(text).replace(/\s+/g, '');
    const map = window.AUDIO_MAP || {};
    const file = map[role + '|' + text] || map[text];
    if (file) {
      return new Promise(res => {
        const a = new window.Audio('audio/' + file);
        this.audio = a;
        a.playbackRate = rate || 1;
        a.onended = a.onerror = () => res();
        a.play().catch(() => res());
      });
    }
    if (!('speechSynthesis' in window)) { toast('Trình duyệt không hỗ trợ đọc giọng nói.'); return Promise.resolve(); }
    return new Promise(res0 => {
      let done = false; const res = () => { if (!done) { done = true; res0(); } };
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'zh-CN';
      const v = this.pick(role), a = this.pick('A');
      if (v) u.voice = v; else if (!this.zh.length) toast('Máy chưa có giọng tiếng Trung. Hãy dùng Microsoft Edge hoặc xem phần Cài đặt.');
      u.rate = rate || S.prefs.rate;
      u.pitch = (role === 'B' && v === a) ? 0.75 : 1;
      u.onend = u.onerror = () => res();
      setTimeout(res, 3000 + clean.length * 600 / (rate || S.prefs.rate || 1)); /* dự phòng: iOS đôi khi không báo kết thúc */
      setTimeout(() => speechSynthesis.speak(u), 60); /* iOS: chờ một chút sau cancel() thì mới đọc được */
    });
  },
};

/* ================= Giao diện chung ================= */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}
function openModal(content) {
  const body = $('#modalBody'); body.innerHTML = '';
  if (typeof content === 'string') body.innerHTML = content; else body.append(content);
  $('#overlay').hidden = false;
  return body;
}
function closeModal() { $('#overlay').hidden = true; $('#modalBody').innerHTML = ''; Voice.stop(); }
$('#modalX').addEventListener('click', closeModal);
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#overlay').hidden) closeModal(); });
$('#menuBtn').addEventListener('click', () => $('#side').classList.toggle('open'));
document.addEventListener('click', e => { const s = $('#side'); if (s.classList.contains('open') && !e.target.closest('#side, #menuBtn, #bnMenu')) s.classList.remove('open'); });
{ const b = $('#bnMenu'); if (b) b.addEventListener('click', () => $('#side').classList.toggle('open')); }

const spk = (text, role = 'A') => `<button class="spk" data-say="${esc(text)}" data-role="${role}" title="Nghe" aria-label="Nghe">🔊</button>`;
const chip = (hz, py, vi, say) => `<button class="chip" data-char="${esc(hz)}" data-py="${esc(py || '')}" data-vi="${esc(vi || '')}" data-sw="${esc(say || '')}"><span class="c-hz">${esc(hz)}</span>${py ? `<span class="c-py">${esc(py)}</span>` : ''}${vi ? `<span class="c-vi">${esc(vi)}</span>` : ''}</button>`;
const chips = list => `<div class="chips">${list.map(e => chip(e[0], e[1], e[2], e[3])).join('')}</div>`;

/* Một cú nhấp bất kỳ */
document.addEventListener('click', e => {
  const t = e.target;
  const sp = t.closest('.spk[data-say]');
  if (sp && sp.closest('[data-rad]')) {
    e.stopPropagation(); sp.classList.add('playing');
    Voice.speak(sp.dataset.say).then(() => sp.classList.remove('playing'));
    return;
  }
  const c = t.closest('[data-char]');
  if (c) { openChar(c.dataset.char, { py: c.dataset.py, vi: c.dataset.vi, say: c.dataset.sw }); return; }
  const rd = t.closest('[data-rad]');
  if (rd) { openRadical(rd.dataset.rad); return; }
  const s = t.closest('[data-say]');
  if (s && !s.closest('[data-char]')) {
    s.classList.add('playing');
    Voice.speak(s.dataset.say, s.dataset.role || 'A').then(() => s.classList.remove('playing'));
  }
});

/* ================= Minh hoạ nét viết ================= */
function strokeSteps(ch) {
  const wrap = document.createElement('div'); wrap.className = 'steps';
  const d = HAS(ch) && window.HANZI_DATA[ch];
  if (!d) return wrap;
  const n = d.strokes.length;
  d.strokes.forEach((_, i) => {
    let paths = '';
    for (let j = 0; j < n; j++) paths += `<path class="${j < i ? 'done' : j === i ? 'now' : 'ghost'}" d="${d.strokes[j]}"/>`;
    wrap.insertAdjacentHTML('beforeend', `<div class="step"><svg viewBox="0 0 1024 1024" aria-hidden="true"><g transform="scale(1,-1) translate(0,-900)">${paths}</g></svg><span>${i + 1}</span></div>`);
  });
  return wrap;
}

function strokeCard(ch, size = 260, opts = {}) {
  const wrap = document.createElement('div'); wrap.className = 'wcard';
  const box = document.createElement('div'); box.className = 'zige'; box.style.width = box.style.height = size + 'px';
  const status = document.createElement('div'); status.className = 'wstatus';
  const tools = document.createElement('div'); tools.className = 'wtools';
  wrap.append(box, status, tools);
  if (!HAS(ch)) {
    box.innerHTML = `<div class="kai" style="line-height:${size}px;font-size:${size * .7}px;text-align:center">${esc(ch)}</div>`;
    status.textContent = 'Chưa có dữ liệu nét cho chữ này.';
    return wrap;
  }
  const cs = getComputedStyle(document.documentElement);
  const col = n => cs.getPropertyValue(n).trim() || undefined;
  const w = HanziWriter.create(box, ch, {
    width: size, height: size, padding: Math.round(size * 0.06),
    showOutline: true, showCharacter: true,
    strokeColor: col('--ink'), outlineColor: col('--outline'), highlightColor: col('--red'), drawingColor: col('--ink'),
    strokeAnimationSpeed: S.prefs.anim, delayBetweenStrokes: 250, strokeFadeDuration: 200,
    showHintAfterMisses: 2, highlightOnComplete: true, drawingWidth: Math.max(10, size / 22),
    charDataLoader: (c, ok, err) => (HAS(c) ? ok(window.HANZI_DATA[c]) : err()),
  });
  const total = window.HANZI_DATA[ch].strokes.length;
  let step = 0, quizOn = false, busy = false;
  const say = t => { status.textContent = t; status.className = 'wstatus'; };
  const btn = (label, fn, cls = '') => { const b = document.createElement('button'); b.className = 'btn sm ' + cls; b.innerHTML = label; b.addEventListener('click', fn); tools.append(b); return b; };

  const stopQuiz = () => { if (quizOn) { w.cancelQuiz(); quizOn = false; bQuiz.classList.remove('on'); bQuiz.innerHTML = '✍ Tập viết'; } };
  const bPlay = btn('▶ Xem nét viết', () => {
    stopQuiz(); step = 0; busy = true; say(`${total} nét`); w.showOutline();
    w.animateCharacter({ onComplete: () => { busy = false; say(`Hoàn thành · ${total} nét`); } });
  }, 'primary');
  btn('⏯ Từng nét', () => {
    stopQuiz();
    if (step >= total || step === 0) { step = 0; w.hideCharacter({ duration: 100 }); }
    setTimeout(() => {
      w.animateStroke(step, { onComplete: () => {} });
      step++; say(`Nét ${step}/${total}`);
      if (step >= total) { say(`Nét ${total}/${total} · bấm lần nữa để làm lại`); }
    }, step === 0 ? 150 : 0);
  });
  const bQuiz = btn('✍ Tập viết', () => {
    if (quizOn) { stopQuiz(); w.showCharacter(); say(''); return; }
    quizOn = true; bQuiz.classList.add('on'); bQuiz.innerHTML = '✖ Dừng tập'; step = 0;
    say('Dùng chuột hoặc ngón tay viết từng nét theo thứ tự.');
    w.quiz({
      onCorrectStroke: d => { status.className = 'wstatus ok'; status.textContent = `Đúng! Nét ${d.strokeNum + 1}/${total}`; },
      onMistake: d => { status.className = 'wstatus bad'; status.textContent = `Chưa đúng ở nét ${d.strokeNum + 1}. Thử lại hoặc xem gợi ý.`; },
      onComplete: s => { quizOn = false; bQuiz.classList.remove('on'); bQuiz.innerHTML = '✍ Tập viết'; status.className = 'wstatus ok'; status.textContent = s.totalMistakes ? `Xong! Có ${s.totalMistakes} lỗi, hãy thử lại để viết chuẩn hơn.` : 'Tuyệt vời! Viết hoàn hảo, không lỗi 🎉'; },
    });
  });
  let outline = true;
  btn('◌ Nét mờ', () => { outline = !outline; outline ? w.showOutline() : w.hideOutline(); });
  const sp = document.createElement('select'); sp.className = 'input'; sp.title = 'Tốc độ'; sp.style.padding = '4px 8px';
  [['Chậm', 0.55], ['Vừa', 1], ['Nhanh', 1.8]].forEach(([n, v]) => { const o = document.createElement('option'); o.value = v; o.textContent = n; if (Math.abs(v - S.prefs.anim) < 0.01) o.selected = true; sp.append(o); });
  sp.addEventListener('change', () => { S.prefs.anim = +sp.value; save(); try { w._options.strokeAnimationSpeed = +sp.value; } catch (e) {} });
  tools.append(sp);
  if (opts.autoPlay) setTimeout(() => bPlay.click(), 350);
  if (opts.startQuiz) setTimeout(() => bQuiz.click(), 100);
  return wrap;
}

/* ================= Cửa sổ chi tiết chữ / bộ thủ ================= */
function lookupWord(text) { return ALLV.find(w => w.h === text); }
function openChar(text, info = {}) {
  const chars = [...text].filter(HAS);
  if (!chars.length) return;
  const w = lookupWord(text);
  const py = info.py || (w && w.p) || '', vi = info.vi || (w && w.v) || '', hv = w && w.hv;
  const sayText = info.say || (w && w.say) || text;
  const body = document.createElement('div');
  let cur = 0;
  const render = () => {
    body.innerHTML = '';
    const ch = chars[cur];
    const head = document.createElement('div');
    head.innerHTML = `<div class="row" style="justify-content:center;gap:14px"><span class="kai" style="font-size:2.6rem">${esc(text)}</span>${spk(sayText)}</div>
      <div class="center"><b style="color:var(--red)">${esc(py)}</b> ${vi ? '· ' + esc(vi) : ''} ${hv ? `<span class="tag">${esc(hv)}</span>` : ''}</div>`;
    body.append(head);
    if (chars.length > 1) {
      const tabs = document.createElement('div'); tabs.className = 'tabs'; tabs.style.justifyContent = 'center';
      chars.forEach((c, i) => { const b = document.createElement('button'); b.className = 'tab kai' + (i === cur ? ' active' : ''); b.style.fontSize = '1.4rem'; b.textContent = c; b.addEventListener('click', () => { cur = i; render(); }); tabs.append(b); });
      body.append(tabs);
    }
    const mid = document.createElement('div'); mid.style.margin = '10px 0';
    mid.append(strokeCard(ch, 270, { autoPlay: true }));
    body.append(mid);
    const st = strokeSteps(ch); st.style.margin = '6px 0 12px'; body.append(st);
    const extra = document.createElement('div');
    const rs = RAD_OF[ch];
    let h = '';
    if (rs && rs.length) h += `<h3>Bộ thủ liên quan</h3><div class="chips">${rs.slice(0, 4).map(r => `<button class="chip" data-rad="${esc(r.r)}"><span class="c-hz">${esc(r.r)}</span><span class="c-py">${esc(r.hv)}</span><span class="c-vi">${esc(r.vi)}</span></button>`).join('')}</div>`;
    const ws = ALLV.filter(x => x.h.includes(ch) && x.h !== text).slice(0, 6);
    if (ws.length) h += `<h3 style="margin-top:14px">Từ chứa chữ ${esc(ch)}</h3>${chips(ws.map(x => [x.h, x.p, x.v, x.say]))}`;
    extra.innerHTML = h; body.append(extra);
  };
  render();
  openModal(body);
  Voice.speak(sayText);
}
function openRadical(r) {
  const item = RADS.find(x => x.r === r);
  if (!item) return;
  const body = document.createElement('div');
  const variant = item.orig !== item.r;
  body.innerHTML = `<div class="center"><span class="kai" style="font-size:3rem;color:var(--red)">${esc(item.r)}</span>
    <h3 style="margin:4px 0">${esc(item.hv)} · ${esc(item.py)} ${spk(item.orig || item.r)}</h3><p>${esc(item.vi)}</p>
    ${variant ? `<p class="small muted">Dạng biến thể của chữ <button class="chip" data-char="${esc(item.orig)}" style="min-width:0;padding:0 8px"><span class="c-hz" style="font-size:1.2rem">${esc(item.orig)}</span></button> · ${item.strokes} nét</p>` : `<p class="small muted">${item.strokes} nét · Nhóm: ${esc(item.cat)}</p>`}</div>`;
  const show = HAS(item.r) ? item.r : item.orig;
  const c = strokeCard(show, 220, { autoPlay: true }); body.append(c);
  const st = strokeSteps(show); st.style.margin = '8px 0'; body.append(st);
  body.insertAdjacentHTML('beforeend', `<h3>Chữ thường gặp có bộ này</h3><div class="rex">${item.ex.map(e => `<div class="rex-row">${spk(e[3] || e[0])}${chip(e[0], e[1], e[2], e[3])}</div>`).join('')}</div>`);
  openModal(body);
  Voice.speak(item.orig || item.r);
}

/* ================= Router ================= */
let cleanup = null;
const routes = [
  [/^\/?$/, viewHome],
  [/^\/pinyin(?:\/(\w+))?$/, viewPinyin],
  [/^\/writing(?:\/(\w+))?$/, viewWriting],
  [/^\/radicals$/, viewRadicals],
  [/^\/lessons$/, viewLessons],
  [/^\/lesson\/(\d+)(?:\/(\w+))?$/, viewLesson],
  [/^\/review$/, viewReview],
  [/^\/write(?:\/(.+))?$/, viewWrite],
  [/^\/tones(?:\/(\w+))?$/, viewTones],
  [/^\/dict$/, viewDict],
  [/^\/listen$/, viewListen],
  [/^\/exam$/, viewExam],
  [/^\/speak$/, viewSpeak],
  [/^\/ask$/, viewAsk],
];
function route() {
  Voice.stop();
  if (cleanup) { cleanup(); cleanup = null; }
  closeModal();
  const h = decodeURIComponent(location.hash.slice(1)) || '/';
  let name = 'home';
  for (const [re, fn] of routes) {
    const m = h.match(re);
    if (m) { name = fn.name.replace('view', '').toLowerCase(); fn(...m.slice(1)); injectTips(name, m.slice(1)); break; }
  }
  const nav = name === 'lesson' ? 'lessons' : name;
  $$('.side a, .bottomnav a').forEach(a => a.classList.toggle('active', a.dataset.route === nav));
  const at = $('.tab.active', view); if (at && at.scrollIntoView) at.scrollIntoView({ inline: 'center', block: 'nearest' });
  $('#side').classList.remove('open');
  hydrate();
  window.scrollTo(0, 0);
}
/* ===== Mẹo học ===== */
function tipBox(items, title = '💡 Mẹo học') {
  return `<details class="callout tip" ${window.innerWidth > 860 ? 'open' : ''}><summary><b>${title}</b></summary><ul>${items.map(t => `<li>${t}</li>`).join('')}</ul></details>`;
}
function injectTips(name, args) {
  const T = window.TIPS; if (!T) return;
  let items = [];
  const [x, y] = args;
  if (name === 'home') items = T.home;
  else if (name === 'pinyin') items = T[{ initials: 'initials', finals: 'finals', tones: 'tonesLink', rules: 'rules' }[x || 'initials']] || [];
  else if (name === 'writing') items = T[{ strokes: 'strokes', rules: 'rules_write', structure: 'structure' }[x || 'strokes']] || [];
  else if (name === 'lesson') {
    const tab = y || 'video';
    items = [...((T.lesson || {})[+x] || []), ...(T[{ dialogue: 'dialogue', vocab: 'vocab', grammar: 'grammar', practice: 'practice' }[tab]] || [])];
  } else items = T[name] || [];
  if (name === 'tones' || !items.length) return;
  const html = tipBox(items);
  if (name === 'lesson' || name === 'writing' || name === 'pinyin') {
    const tabs = $('.tabs', view);
    if (tabs) { tabs.insertAdjacentHTML('afterend', html); return; }
  }
  const head = $('.page-head', view);
  if (head) head.insertAdjacentHTML('afterend', html); else view.insertAdjacentHTML('beforeend', html);
}
function hydrate() {
  $$('[data-strip]', view).forEach(el => { if (!el.firstChild) el.append(strokeSteps(el.dataset.strip)); });
  $$('[data-card]', view).forEach(el => { if (!el.firstChild) el.append(strokeCard(el.dataset.card, +el.dataset.size || 240, { autoPlay: el.dataset.auto === '1' })); });
}
window.addEventListener('hashchange', route);

const tabsHTML = (base, tabs, cur) => `<div class="tabs">${tabs.map(([k, n]) => `<a class="tab ${k === cur ? 'active' : ''}" href="#${base}/${k}">${n}</a>`).join('')}</div>`;

/* ================= Trang chủ ================= */
function viewHome() {
  const done = Object.keys(S.done).length;
  const known = Object.values(S.known).filter(Boolean).length;
  const singles = ALLV.filter(w => [...w.h].length === 1 && HAS(w.h));
  const day = Math.floor(Date.now() / 864e5);
  const pick = singles[day % singles.length];
  const todayN = S.days[today()] || 0, due = dueCount();
  view.innerHTML = `
  <div class="hero">
    <div class="big-zh">你好</div>
    <div><h1>Học tiếng Trung từ con số 0</h1>
      <p>Lộ trình bám theo chương trình HSK 1: phát âm pinyin, thứ tự nét và bộ thủ, rồi 15 bài hội thoại có âm thanh. Mọi thứ chạy offline trên máy bạn.</p>
      <p style="margin-top:14px"><a class="btn" href="#/pinyin">Bắt đầu với Pinyin →</a></p></div>
  </div>
  <div class="grid g2" style="margin-top:18px">
    <div class="card"><h3>Mục tiêu hôm nay 🔥 ${streak()} ngày liên tiếp</h3>
      <p class="small muted">Đã luyện <b>${todayN}/${GOAL}</b> lượt (mỗi thẻ ôn hoặc câu trả lời tính 1 lượt)</p>
      <div class="progress"><i style="width:${Math.min(100, todayN / GOAL * 100)}%"></i></div>
      <p class="small" style="margin-top:10px">${due ? `Có <b>${due}</b> từ đến hạn ôn lại.` : 'Chưa có từ nào đến hạn ôn.'}</p>
      <p style="margin-top:8px"><a class="btn sm primary" href="#/review">${due ? 'Ôn từ đến hạn' : 'Vào ôn tập'}</a> <a class="btn sm" href="#/listen">Nghe chép pinyin</a></p></div>
    <div class="card"><h3>Tiến độ của bạn</h3>
      <p class="small muted">Bài đã hoàn thành: <b>${done}/${LESSONS.length}</b></p>
      <div class="progress"><i style="width:${done / LESSONS.length * 100}%"></i></div>
      <p class="small muted" style="margin-top:10px">Từ đã thuộc: <b>${known}/${ALLV.length}</b></p>
      <div class="progress"><i style="width:${known / ALLV.length * 100}%"></i></div></div>
    <div class="card center"><h3>Chữ hôm nay</h3><div data-card="${esc(pick.h)}" data-size="200" data-auto="1"></div>
      <p style="margin-top:8px"><b style="color:var(--red)">${esc(pick.p)}</b> · ${esc(pick.v)} ${spk(pick.say || pick.h)}</p></div>
  </div>
  <h2>Lộ trình học</h2>
  <div class="path">
    <a class="card" href="#/pinyin"><span class="n">1</span><div><b>Phát âm Pinyin</b><div class="small muted">21 thanh mẫu, 36 vận mẫu, 4 thanh điệu và quy tắc biến điệu. Bấm vào từng ô để nghe.</div></div></a>
    <a class="card" href="#/writing"><span class="n">2</span><div><b>Nét và quy tắc viết</b><div class="small muted">12 nét cơ bản, 9 quy tắc bút thuận, cấu trúc chữ Hán, xem hoạt hình từng nét.</div></div></a>
    <a class="card" href="#/radicals"><span class="n">3</span><div><b>Bộ thủ</b><div class="small muted">${RADS.length} bộ thủ thường dùng kèm tên Hán Việt, nghĩa và ví dụ có âm thanh.</div></div></a>
    <a class="card" href="#/lessons"><span class="n">4</span><div><b>15 bài HSK 1</b><div class="small muted">Hội thoại có người đọc, từ vựng, ngữ pháp và bài tập sau mỗi bài.</div></div></a>
    <a class="card" href="#/review"><span class="n">5</span><div><b>Ôn tập &amp; luyện viết</b><div class="small muted">Thẻ ghi nhớ, tập viết từng nét có chấm điểm.</div></div></a>
  </div>
  <div class="callout"><b>Về âm thanh:</b> trang dùng giọng tiếng Trung có sẵn trong trình duyệt. Microsoft Edge trên Windows có giọng tự nhiên (Xiaoxiao, Yunxi) chất lượng tốt nhất. Trạng thái giọng đọc hiện ở góc trên bên phải; vào ⚙ Cài đặt để chọn giọng hoặc chỉnh tốc độ.</div>`;
}

/* ================= Bài thanh điệu ================= */
function animateCurve(svg) {
  const path = svg.querySelector('path'); if (!path) return;
  let dot = svg.querySelector('.tdot');
  if (!dot) { dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', '7'); dot.setAttribute('class', 'tdot'); dot.setAttribute('fill', '#e9b44c'); dot.setAttribute('stroke', '#2a2622'); svg.append(dot); }
  const len = path.getTotalLength(), t0 = performance.now(), dur = 850;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), pt = path.getPointAtLength(len * p);
    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
    if (p < 1 && svg.isConnected) requestAnimationFrame(step); else setTimeout(() => dot.remove(), 600);
  };
  requestAnimationFrame(step);
}
function placeMark(syl, t) {
  const vs = 'aeiouü', M = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  let idx = syl.indexOf('a');
  if (idx < 0) idx = syl.indexOf('o');
  if (idx < 0) idx = syl.indexOf('e');
  if (idx < 0) { const pos = [...syl].map((c, i) => vs.includes(c) ? i : -1).filter(i => i >= 0); idx = pos[pos.length - 1]; }
  return syl.slice(0, idx) + M[syl[idx]][t - 1] + syl.slice(idx + 1);
}
const markOptions = (syl, t) => {
  const M = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  return [...new Set([...syl].map((c, i) => M[c] ? syl.slice(0, i) + M[c][t - 1] + syl.slice(i + 1) : null).filter(Boolean))];
};

/* Trình làm bài trắc nghiệm trong cửa sổ: qs = [{ prompt, say, opts, answer, note }] */
function quizModal(title, qs, again) {
  let n = 0, score = 0;
  const body = openModal('');
  const next = () => {
    if (n >= qs.length) {
      body.innerHTML = `<div class="center"><h3>${esc(title)}</h3><div class="score">${score}/${qs.length}</div><p>${score >= qs.length * .8 ? 'Rất tốt! 🎉' : score >= qs.length * .5 ? 'Khá ổn, luyện thêm nhé.' : 'Hãy xem lại phần lý thuyết rồi thử lại.'}</p><button class="btn primary" id="qzAgain">Chơi lại</button></div>`;
      $('#qzAgain').onclick = again; return;
    }
    const q = qs[n];
    body.innerHTML = `<div class="quiz"><div class="qprog"><i style="width:${n / qs.length * 100}%"></i></div><h3 class="center">${esc(title)} · Câu ${n + 1}/${qs.length}</h3>
      <div class="center" style="margin:10px"><div style="font-size:1.1rem">${q.prompt}</div>${q.say ? '<button class="btn primary" id="qzPlay" style="margin-top:8px">🔊 Nghe lại</button>' : ''}</div>
      <div class="opts" style="grid-template-columns:1fr 1fr">${q.opts.map(o => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><p id="qzFb" class="center" style="min-height:2.4em;margin-top:10px"></p></div>`;
    if (q.say) { const p = () => Voice.speak(q.say, 'A', 0.8); $('#qzPlay').onclick = p; setTimeout(p, 250); }
    $$('.opt', body).forEach(b => b.addEventListener('click', () => {
      const ok = b.dataset.o === q.answer;
      $$('.opt', body).forEach(x => { x.disabled = true; if (x.dataset.o === q.answer) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong'); else score++;
      bump(); save();
      $('#qzFb').innerHTML = (ok ? '✅ Đúng! ' : '❌ Chưa đúng. ') + (q.note || '');
      n++; setTimeout(next, 1700);
    }));
  };
  next();
}
function comboQuiz() {
  const P = window.PINYIN, T = window.TONES;
  const label = k => 'Thanh ' + k.replace('-', ' + Thanh ');
  const qs = shuffle(P.toneCombos).slice(0, 10).map(c => {
    const others = shuffle(P.toneCombos.filter(x => x[0] !== c[0])).slice(0, 3).map(x => label(x[0]));
    return { prompt: 'Nghe từ hai âm tiết, đây là cặp thanh nào?', say: c[1], answer: label(c[0]), opts: shuffle([label(c[0]), ...others]), note: `${c[1]} ${c[2]} (${c[3]})` };
  });
  quizModal('Nghe đoán cặp thanh', qs, comboQuiz);
}
function markQuiz() {
  const T = window.TONES;
  const qs = shuffle(T.marks).slice(0, 10).map(([syl, t]) => {
    const ans = placeMark(syl, t);
    return { prompt: `Đặt dấu <b>thanh ${t}</b> vào âm tiết <b>${esc(syl)}</b>. Cách viết đúng?`, answer: ans, opts: shuffle(markOptions(syl, t)), note: 'Quy tắc: a > o, e > i, u, ü; iu, ui đánh vào chữ sau.' };
  }).filter(q => q.opts.length > 1);
  quizModal('Đặt dấu thanh', qs, markQuiz);
}
function sandhiQuiz() {
  const all = window.TONES.sandhi.flatMap(s => s.ex).filter(e => e[1] !== e[2]);
  const qs = shuffle(all).slice(0, Math.min(8, all.length)).map(e => ({ prompt: `Từ <b class="kai" style="font-size:1.5rem">${esc(e[0])}</b> (viết ${esc(e[1])}). Thực tế đọc thế nào?`, say: e[0], answer: e[2], opts: shuffle([e[1], e[2]]), note: `Đọc: ${e[2]} (${e[3]})` }));
  quizModal('Biến điệu', qs, sandhiQuiz);
}

function viewTones(tab = 'learn') {
  const T = window.TONES, P = window.PINYIN;
  const tabs = [['learn', '1. Làm quen'], ['four', '2. Bốn thanh + thanh nhẹ'], ['pairs', '3. Cặp dễ nhầm'], ['sandhi', '4. Biến điệu'], ['drill', '5. Luyện tập'], ['video', '🎬 Video giảng']];
  const w = x => `<button class="chip" data-say="${esc(x[0])}"><span class="c-hz">${esc(x[0])}</span><span class="c-py">${esc(x[1])}</span><span class="c-vi">${esc(x[2])}</span></button>`;
  let h = `<div class="page-head"><h1>Bài thanh điệu (声调)</h1><p>Thanh điệu là linh hồn của tiếng Trung. Học đủ 5 bước: làm quen, từng thanh, cặp dễ nhầm, biến điệu, luyện tập. Hoặc xem video giảng.</p></div>${tabsHTML('/tones', tabs, tab)}`;
  if (tab === 'learn') {
    h += `<div class="card gcard">${T.intro.map(p => `<p>${p}</p>`).join('')}</div>
      <h2>Bốn thanh trên thang 5 mức</h2><p class="muted small">Bấm vào từng ô để nghe và xem chấm vàng chạy theo đường cao độ.</p>
      <div class="grid g4">${T.list.map(t => `<div class="card tonebox" data-tone="${t.n}" style="cursor:pointer"><div style="color:var(--ink)">${window.toneCurve(t.shape, t.color)}</div><h3 style="color:${t.color}">Thanh ${t.n}: ${t.shape}</h3><div class="kai" style="font-size:2rem">${t.words[0][0]}</div><b style="color:var(--red)">${t.py}</b> · ${t.words[0][2]}</div>`).join('')}</div>
      <div class="row" style="margin:12px 0"><button class="btn primary" id="tAll">▶ Nghe cả bốn thanh</button></div>
      <h2>So với tiếng Việt</h2><table class="t"><tr><th>Thanh</th><th>Mức</th><th>Gần với</th><th>Lưu ý</th></tr>${T.compare.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>
      ${tipBox(T.tips, '💡 Mẹo luyện thanh điệu')}
      <p><a class="btn primary" href="#/tones/four">Học từng thanh →</a></p>`;
  } else if (tab === 'four') {
    h += T.list.map(t => `<div class="card gcard" style="border-left:5px solid ${t.color}"><div class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:16px"><div data-tone="${t.n}" style="width:130px;flex:none;cursor:pointer;color:var(--ink)" title="Bấm để nghe">${window.toneCurve(t.shape, t.color)}</div>
      <div><h3 style="margin:0">${esc(t.name)}</h3><div class="muted small">Mức cao độ: ${t.shape.split('').join(' → ')}</div></div></div>
      <h4>Cách phát âm</h4><ol>${t.how.map(x => `<li>${x}</li>`).join('')}</ol>
      <h4>Lỗi người Việt hay gặp</h4><ul>${t.mistakes.map(x => `<li>${x}</li>`).join('')}</ul>
      <div class="callout"><b>💡 Mẹo:</b> ${t.gesture}</div>
      <div class="chips">${t.words.map(w).join('')}</div></div>`).join('');
    h += `<div class="card gcard"><h3>Thanh nhẹ (轻声)</h3><p>${T.neutral.desc}</p>
      <table class="t"><tr><th>Vị trí</th><th>Ví dụ</th><th>Nghĩa</th><th>Độ cao âm nhẹ</th></tr>${T.neutral.rows.map(r => `<tr><td>${r[0]}</td><td>${spk(r[2])} <b class="kai">${r[2]}</b> ${r[1]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</table>
      <div class="chips" style="margin-top:10px">${T.neutral.words.map(w).join('')}</div></div>`;
  } else if (tab === 'pairs') {
    const sets = [['妈', '麻', '马', '骂', ['mā', 'má', 'mǎ', 'mà']], ['八', '拔', '把', '爸', ['bā', 'bá', 'bǎ', 'bà']], ['衣', '姨', '椅', '意', ['yī', 'yí', 'yǐ', 'yì']], ['诗', '时', '史', '是', ['shī', 'shí', 'shǐ', 'shì']]];
    h += `<h2 style="margin-top:0">Cùng âm, đủ bốn thanh</h2><div class="grid g2">${sets.map((s, i) => `<div class="card"><div class="chips">${[0, 1, 2, 3].map(k => `<button class="chip" data-say="${s[k]}"><span class="c-hz">${s[k]}</span><span class="c-py">${s[4][k]}</span></button>`).join('')}</div><button class="btn sm" data-seq="${[0, 1, 2, 3].map(k => s[k]).join('')}" style="margin-top:8px">▶ Nghe cả bốn</button></div>`).join('')}</div>
      <h2>Cặp từ dễ nhầm</h2><p class="muted small">Chỉ khác thanh điệu hoặc khác một chút âm. Nghe lần lượt rồi nhại lại.</p>
      <div class="grid g2">${T.pairs.map(p => `<div class="card"><div class="chips">${p.map(w).join('')}</div><button class="btn sm" data-seq="${p.map(x => x[0]).join('|')}" style="margin-top:8px">▶ So sánh hai từ</button></div>`).join('')}</div>
      ${tipBox(['Nghe <b>cặp đối lập</b> nhiều lần: não sẽ dần phân biệt được hai thanh. Đây là bài tập hiệu quả nhất cho người mới.', 'Tự ghi âm các cặp này rồi nghe lại, so với giọng mẫu.', 'Hỏi giáo viên/bạn bè xem họ nghe bạn đang nói <b>买 (mua)</b> hay <b>卖 (bán)</b>: nói nhầm thanh có thể làm ngược hẳn ý!'])}`;
  } else if (tab === 'sandhi') {
    h += T.sandhi.map(s => `<div class="card gcard"><h3>${esc(s.t)}</h3><p>${s.rule}</p>${s.ex.map(e => `<div class="exline">${spk(e[0])}<span class="e-h">${esc(e[0])}</span><span class="e-p">${esc(e[1])} → <b>${esc(e[2])}</b></span><span class="e-v">${esc(e[3])}</span></div>`).join('')}</div>`).join('');
    h += `<div class="card gcard"><h3>Bán thanh 3 (半三声)</h3><p>Thanh 3 đứng trước thanh 1, 2, 4 hoặc thanh nhẹ chỉ đọc nửa đầu (hạ thấp, không nhích lên), vì vậy dấu viết là ˇ nhưng nghe như một nốt thấp, hơi dài.</p>${[['老师', 'lǎoshī', 'giáo viên'], ['语言', 'yǔyán', 'ngôn ngữ'], ['米饭', 'mǐfàn', 'cơm'], ['你们', 'nǐmen', 'các bạn']].map(e => `<div class="exline">${spk(e[0])}<span class="e-h">${e[0]}</span><span class="e-p">${e[1]}</span><span class="e-v">${e[2]}</span></div>`).join('')}</div>
      <div class="card gcard"><h3>Quy tắc đánh dấu thanh</h3><p>${T.markRule}</p><p class="small muted">Ví dụ: hǎo, xiǎng, duō, liú, guì, xiè. Làm bài tập đặt dấu ở phần Luyện tập.</p></div>
      ${tipBox(['Biến điệu chỉ xảy ra khi <b>nói</b>; sách vẫn viết dấu gốc. Hãy nghe và nhại, đừng cố đọc theo dấu in.', 'Gặp <b>3 thanh 3 liên tiếp</b> (我很好), thường đọc thành 2-2-3: wó hén hǎo.'])}`;
  } else if (tab === 'drill') {
    h += `<div class="grid g2">
      <div class="card"><h3>🎧 Nghe đoán thanh</h3><p class="small muted">Nghe một âm tiết, chọn thanh 1–4. 10 câu.</p><button class="btn primary" id="dToneGame">Bắt đầu</button></div>
      <div class="card"><h3>🎧 Nghe đoán cặp thanh</h3><p class="small muted">Nghe một từ hai âm tiết, chọn tổ hợp thanh. 10 câu.</p><button class="btn primary" id="dCombo">Bắt đầu</button></div>
      <div class="card"><h3>✏ Đặt dấu thanh</h3><p class="small muted">Dấu thanh đặt vào chữ cái nào? Luyện quy tắc a &gt; o, e &gt; i, u, ü.</p><button class="btn primary" id="dMark">Bắt đầu</button></div>
      <div class="card"><h3>🔁 Biến điệu</h3><p class="small muted">Nghe và chọn cách đọc thực tế của 不, 一 và hai thanh 3.</p><button class="btn primary" id="dSandhi">Bắt đầu</button></div></div>
      <h2>Bảng 16 tổ hợp thanh hai âm tiết</h2><p class="muted small">Hàng = thanh âm tiết đầu, cột = thanh âm tiết sau. Bấm để nghe.</p>
      <table class="tone-table"><tr><td></td>${[1, 2, 3, 4].map(n => `<td class="center"><b>Thanh ${n}</b></td>`).join('')}</tr>
      ${[1, 2, 3, 4].map(a => `<tr><td><b>Thanh ${a}</b></td>${[1, 2, 3, 4].map(b => { const c = P.toneCombos.find(x => x[0] === a + '-' + b); return `<td><button data-say="${esc(c[1])}"><span class="hz">${esc(c[1])}</span><small style="color:var(--red)">${esc(c[2])}</small><br><small class="muted">${esc(c[3])}</small></button></td>`; }).join('')}</tr>`).join('')}</table>
      ${tipBox(['Chọn một hàng mỗi ngày, đọc to cả 4 ô của hàng đó 3 lần.', 'Đặc biệt chú ý hàng và cột <b>thanh 3</b>: đó là chỗ người học hay sai nhất (bán thanh 3 và biến điệu 3 + 3).'])}`;
  } else {
    h += '<div id="lecBox"></div>';
  }
  view.innerHTML = h;
  if (tab === 'learn' || tab === 'four') {
    $$('[data-tone]', view).forEach(el => el.addEventListener('click', () => {
      const t = T.list[+el.dataset.tone - 1];
      const svg = el.querySelector('svg'); animateCurve(svg); Voice.speak(t.words[0][0], 'A', 0.7);
    }));
    const all = $('#tAll');
    if (all) all.onclick = () => {
      const cards = $$('[data-tone]', view);
      Voice.seq(T.list.map((t, i) => ({ text: t.words[0][0], el: cards[i] })), { start: it => { it.el.classList.add('playing'); animateCurve(it.el.querySelector('svg')); }, end: it => it.el.classList.remove('playing') }, 500);
    };
  }
  if (tab === 'pairs') $$('[data-seq]', view).forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.seq, parts = s.includes('|') ? s.split('|') : [...s];
    Voice.seq(parts.map(t => ({ text: t })), {}, 500);
  }));
  if (tab === 'drill') {
    $('#dToneGame').onclick = toneGame; $('#dCombo').onclick = comboQuiz; $('#dMark').onclick = markQuiz; $('#dSandhi').onclick = sandhiQuiz;
  }
  if (tab === 'video' && window.Lecture) window.Lecture.mount($('#lecBox'), null, { title: 'Bài thanh điệu', slides: T.slides() });
}

/* ================= Pinyin ================= */
function viewPinyin(tab = 'initials') {
  const P = window.PINYIN;
  const tabs = [['initials', 'Thanh mẫu (21)'], ['finals', 'Vận mẫu (36)'], ['tones', 'Thanh điệu'], ['rules', 'Quy tắc & biến điệu']];
  let h = `<div class="page-head"><h1>Phát âm Pinyin</h1><p>Pinyin là hệ phiên âm chữ Latin của tiếng Trung. Một âm tiết = <b>thanh mẫu</b> (phụ âm đầu) + <b>vận mẫu</b> (phần vần) + <b>thanh điệu</b>. Bấm vào mỗi ô để nghe.</p></div>${tabsHTML('/pinyin', tabs, tab)}`;
  const card = it => `<div class="card pcard" data-say="${esc(it.ex)}"><div class="big">${esc(it.l)}</div><div class="ex"><b>${esc(it.ex)}</b> ${esc(it.py)} · ${esc(it.vi)}<div class="tip">${esc(it.tip)}</div></div></div>`;
  if (tab === 'initials') {
    h += P.initials.map(g => `<div class="group-title">${esc(g.group)}</div><div class="grid g2">${g.items.map(card).join('')}</div>`).join('');
    h += `<div class="callout">${esc(P.initialsNote)}</div>`;
  } else if (tab === 'finals') {
    h += P.finals.map(g => `<div class="group-title">${esc(g.group)}</div><div class="grid g2">${g.items.map(card).join('')}</div>`).join('');
    h += `<h2>Lưu ý chính tả</h2><div class="card"><ul>${P.finalsNotes.map(n => `<li>${n}</li>`).join('')}</ul></div>`;
  } else if (tab === 'tones') {
    const lv = n => 78 - (n - 1) * 16;
    const svg = shape => {
      const pts = shape.split('').map(Number);
      const xs = pts.length === 2 ? [18, 92] : [18, 55, 92];
      const poly = pts.map((p, i) => `${xs[i]},${lv(p)}`).join(' ');
      const guides = [1, 2, 3, 4, 5].map(n => `<line x1="10" x2="100" y1="${lv(n)}" y2="${lv(n)}" stroke="var(--line)" stroke-width="1"/>`).join('');
      return `<svg viewBox="0 0 110 90">${guides}${shape ? `<polyline points="${poly}" fill="none" stroke="var(--red)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${xs[pts.length - 1]}" cy="${lv(pts[pts.length - 1])}" r="6" fill="var(--red)"/>` : ''}</svg>`;
    };
    h += `<div class="grid g3">${P.tones.map(t => `<div class="card tonebox" data-say="${esc(t.ex)}" style="cursor:pointer">${t.shape ? svg(t.shape) : '<div style="height:90px;display:grid;place-items:center;color:var(--muted)">· · ·</div>'}
      <h3>${esc(t.name)}</h3><div class="kai" style="font-size:2.2rem">${esc(t.ex)}</div><b style="color:var(--red)">${esc(t.py)}</b> · ${esc(t.vi)}
      <p class="small muted" style="margin-top:8px">${esc(t.desc)}</p></div>`).join('')}</div>`;
    h += `<div class="callout">Người Việt có 6 thanh nhưng tiếng Trung có 4 thanh + thanh nhẹ. Cao độ khác nhau giúp phân biệt nghĩa: <b>mā</b> (mẹ), <b>má</b> (gai), <b>mǎ</b> (ngựa), <b>mà</b> (mắng).</div>
      <p><a class="btn primary" href="#/tones">🎵 Vào Bài thanh điệu đầy đủ →</a></p><h2>Luyện 16 tổ hợp thanh điệu hai âm tiết</h2><p class="muted small">Hàng = thanh của âm tiết đầu, cột = thanh của âm tiết sau.</p>
      <table class="tone-table"><tr><td></td>${[1, 2, 3, 4].map(n => `<td class="center"><b>Thanh ${n}</b></td>`).join('')}</tr>
      ${[1, 2, 3, 4].map(a => `<tr><td><b>Thanh ${a}</b></td>${[1, 2, 3, 4].map(b => { const c = P.toneCombos.find(x => x[0] === a + '-' + b); return `<td><button data-say="${esc(c[1])}"><span class="hz">${esc(c[1])}</span><small style="color:var(--red)">${esc(c[2])}</small><br><small class="muted">${esc(c[3])}</small></button></td>`; }).join('')}</tr>`).join('')}</table>
      <h2>Trò chơi: nghe và đoán thanh điệu</h2>
      <p class="muted">Nghe một âm tiết rồi chọn đúng thanh điệu. 10 câu.</p><button class="btn primary" id="toneGame">▶ Bắt đầu chơi</button>`;
  } else {
    h += P.rules.map(r => `<div class="card gcard"><h3>${esc(r.t)}</h3><p>${r.body}</p>${r.ex.map(e => `<div class="exline">${spk(e[0])}<span class="e-h">${esc(e[0])}</span><span class="e-p">${esc(e[1])}</span><span class="e-v">${esc(e[2])}</span></div>`).join('')}</div>`).join('');
  }
  view.innerHTML = h;
  const tg = $('#toneGame'); if (tg) tg.addEventListener('click', toneGame);
}
function toneGame() {
  const sets = [['妈', '麻', '马', '骂'], ['八', '拔', '把', '爸'], ['衣', '姨', '椅', '意'], ['诗', '时', '史', '是']];
  const PY = [['mā', 'má', 'mǎ', 'mà'], ['bā', 'bá', 'bǎ', 'bà'], ['yī', 'yí', 'yǐ', 'yì'], ['shī', 'shí', 'shǐ', 'shì']];
  let n = 0, score = 0, cur;
  const body = openModal('');
  const next = () => {
    if (n >= 10) {
      body.innerHTML = `<div class="center"><div class="score">${score}/10</div><p>${score >= 8 ? 'Tai rất tốt!' : score >= 5 ? 'Khá ổn, nghe thêm nhé.' : 'Hãy nghe lại phần thanh điệu rồi thử lại.'}</p><button class="btn primary" id="tgAgain">Chơi lại</button></div>`;
      $('#tgAgain').onclick = () => { n = 0; score = 0; next(); };
      return;
    }
    cur = { s: Math.floor(Math.random() * 4), t: Math.floor(Math.random() * 4) };
    body.innerHTML = `<div class="quiz"><div class="qprog"><i style="width:${n * 10}%"></i></div><h3 class="center">Câu ${n + 1}/10 · Đây là thanh mấy?</h3>
      <div class="center" style="margin:12px"><button class="btn primary" id="tgPlay">🔊 Nghe lại</button></div>
      <div class="opts" style="grid-template-columns:1fr 1fr">${['1 · ˉ cao đều', '2 · ˊ lên', '3 · ˇ xuống-lên', '4 · ˋ xuống'].map((x, i) => `<button class="opt" data-i="${i}">${x}</button>`).join('')}</div><p id="tgFb" class="center" style="min-height:2em;margin-top:10px"></p></div>`;
    const play = () => Voice.speak(sets[cur.s][cur.t], 'A', 0.8);
    $('#tgPlay').onclick = play; setTimeout(play, 250);
    $$('.opt', body).forEach(b => b.addEventListener('click', () => {
      const ok = +b.dataset.i === cur.t;
      $$('.opt', body).forEach(x => { x.disabled = true; if (+x.dataset.i === cur.t) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong'); else score++;
      $('#tgFb').innerHTML = `${ok ? '✅ Đúng!' : '❌ Chưa đúng.'} Âm vừa nghe: <b>${sets[cur.s][cur.t]} ${PY[cur.s][cur.t]}</b>`;
      n++; setTimeout(next, 1400);
    }));
  };
  next();
}

/* ================= Nét & quy tắc viết ================= */
function viewWriting(tab = 'strokes') {
  const W = window.WRITING;
  const tabs = [['strokes', '12 nét cơ bản'], ['rules', 'Quy tắc bút thuận'], ['structure', 'Cấu trúc & nguồn gốc']];
  let h = `<div class="page-head"><h1>Nét và quy tắc viết chữ Hán</h1><p>Viết đúng thứ tự nét giúp chữ đẹp, nhớ lâu và dễ tra từ điển. Bấm vào chữ mẫu để xem hoạt hình từng nét và tập viết.</p></div>${tabsHTML('/writing', tabs, tab)}`;
  if (tab === 'strokes') {
    h += `<div class="grid g2">${W.strokes.map(s => `<div class="card"><div class="row" style="flex-wrap:nowrap"><div class="strokebig">${esc(s.sym)}</div><div><h3 style="margin:0">${esc(s.n)} <span class="muted small">${esc(s.py)}</span></h3><div class="small">${esc(s.vi)}</div></div></div>
      <p class="small muted" style="margin:8px 0">${esc(s.desc)}</p>${chips(s.ex)}</div>`).join('')}</div>`;
  } else if (tab === 'rules') {
    h += W.rules.map((r, i) => `<div class="card gcard"><h3>${i + 1}. ${esc(r.t)}</h3><p class="muted">${esc(r.note)}</p>
      <div class="grid g2">${r.ex.map(e => `<div><div class="row" style="flex-wrap:nowrap">${chip(e[0], e[1], e[2])}</div><div data-strip="${esc(e[0])}" style="margin-top:6px"></div></div>`).join('')}</div></div>`).join('');
  } else {
    h += `<h2 style="margin-top:0">Cấu trúc chữ Hán</h2><div class="grid g2">${W.structures.map(s => `<div class="card"><h3>${esc(s.n)}</h3><p class="small muted">${esc(s.desc)}</p>${chips(s.ex)}</div>`).join('')}</div>
      <h2>Bốn cách tạo chữ (六书)</h2><div class="grid g2">${W.liushu.map(s => `<div class="card"><h3>${esc(s.n)}</h3><p class="small muted">${esc(s.desc)}</p>${chips(s.ex)}</div>`).join('')}</div>
      <div class="callout">Hơn 80% chữ Hán là chữ <b>hình thanh</b>: biết bộ thủ giúp đoán nghĩa, biết phần âm giúp đoán cách đọc. Xem phần <a href="#/radicals">Bộ thủ</a>.</div>`;
  }
  view.innerHTML = h;
}

/* ================= Bộ thủ ================= */
function viewRadicals() {
  let cat = 'all', q = '';
  const cats = (window.RADICALS || []).map(g => g.cat);
  view.innerHTML = `<div class="page-head"><h1>Bộ thủ (部首)</h1>
    <p>Bộ thủ là thành phần dùng để sắp xếp chữ trong từ điển, thường gợi ý nghĩa của chữ. Từ điển Khang Hy có 214 bộ; ở đây là ${RADS.length} bộ và biến thể thường gặp nhất. Bấm vào một bộ để xem nét viết và các chữ thuộc bộ đó.</p></div>
    <div class="filterbar"><input class="input" id="rq" type="search" placeholder="Tìm bộ thủ (vd: nước, thuỷ, 氵, shui)…" style="flex:1;min-width:200px">
    <select class="input" id="rc"><option value="all">Tất cả nhóm</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
    <div id="rlist"></div>
    <h2>Bộ thủ dễ nhầm</h2><div class="grid g2">${(window.RADICAL_NOTES || []).map(n => `<div class="card"><h3>${esc(n.t)}</h3><p class="small">${n.body}</p>${chips(n.ex)}</div>`).join('')}</div>`;
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const draw = () => {
    const qq = norm(q.trim());
    const groups = (window.RADICALS || []).filter(g => cat === 'all' || g.cat === cat).map(g => {
      const items = g.items.filter(it => !qq || [it.r, it.orig, it.hv, it.vi, it.py, ...it.ex.map(e => e[0] + e[2])].some(s => norm(s).includes(qq)));
      return items.length ? `<div class="group-title">${esc(g.cat)} <span class="muted small">(${items.length})</span></div><div class="grid g4">${items.map(it => `<button class="card rcard" data-rad="${esc(it.r)}"><div class="r">${esc(it.r)}</div><div class="r-py">${esc(it.py)}</div><div class="r-hv">${esc(it.hv)}</div><div class="r-vi">${esc(it.vi)}</div><span class="spk" role="button" tabindex="0" data-say="${esc(it.orig || it.r)}" title="Nghe" aria-label="Nghe">🔊</span></button>`).join('')}</div>` : '';
    }).join('');
    $('#rlist').innerHTML = groups || '<p class="muted">Không tìm thấy bộ thủ phù hợp.</p>';
  };
  $('#rq').addEventListener('input', e => { q = e.target.value; draw(); });
  $('#rc').addEventListener('change', e => { cat = e.target.value; draw(); });
  draw();
}

/* ================= Tiến độ học phần ================= */
const PARTS = [['video', 'Video bài giảng'], ['dialogue', 'Hội thoại'], ['vocab', 'Từ vựng'], ['grammar', 'Ngữ pháp'], ['practice', 'Luyện tập']];
const partDone = (id, p) => !!(S.parts && S.parts[id] && S.parts[id][p]);
const lessonParts = id => PARTS.filter(([p]) => partDone(id, p)).length;
function setPart(id, p, on) {
  S.parts = S.parts || {}; S.parts[id] = S.parts[id] || {};
  if (on) S.parts[id][p] = 1; else delete S.parts[id][p];
  if (lessonParts(id) === PARTS.length) S.done[id] = true; else delete S.done[id];
  save();
}
const courseParts = () => LESSONS.reduce((n, L) => n + lessonParts(L.id), 0);
const coursePct = () => Math.round(courseParts() / (LESSONS.length * PARTS.length) * 100);
const courseDone = () => courseParts() === LESSONS.length * PARTS.length;
const bar = pct => `<div class="qprog" style="margin:6px 0"><i style="width:${pct}%"></i></div>`;
function resetCourse() { S.done = {}; S.parts = {}; S.quiz = {}; save(); }

/* ================= Danh sách bài & bài học ================= */
function viewLessons() {
  const pct = coursePct(), full = courseDone(), ex = S.exam;
  view.innerHTML = `<div class="page-head"><h1>15 bài HSK 1</h1><p>Mỗi bài có 5 phần: video bài giảng, hội thoại, từ vựng, ngữ pháp và luyện tập. Hoàn thành đủ cả 75 phần để mở <b>bài kiểm tra cuối khoá</b>.</p></div>
  <div class="card" style="margin-bottom:14px"><div class="row" style="justify-content:space-between"><b>Tiến độ khoá HSK 1: ${pct}%</b><span class="small muted">${courseParts()}/${LESSONS.length * PARTS.length} phần</span></div>${bar(pct)}
    <div class="row" style="gap:10px;align-items:center;flex-wrap:wrap">${full ? '<a class="btn primary" href="#/exam">🏆 Làm bài kiểm tra cuối khoá</a>' : '<span class="btn" style="opacity:.55;cursor:not-allowed" title="Hoàn thành 100% các phần để mở">🔒 Bài kiểm tra cuối khoá</span>'}
    ${ex && ex.passed ? `<span class="tag green">✔ Đã đạt ${ex.best}%</span>` : ''}${ex && ex.attempts && !ex.passed ? `<span class="small muted">Đã thi ${ex.attempts} lần, điểm cao nhất ${ex.best}%</span>` : ''}</div></div>
  <div class="grid g2">${LESSONS.map(L => { const n = lessonParts(L.id); return `<a class="card lcard" href="#/lesson/${L.id}/video"><div class="no">BÀI ${L.id}</div><div class="zh-t">${esc(L.h)}</div><div class="small" style="color:var(--red)">${esc(L.p)}</div><div class="small muted">${esc(L.v)}</div><div class="small muted" style="margin-top:6px">${esc(L.goal)}</div>${bar(n / PARTS.length * 100)}<div class="small muted">${n}/${PARTS.length} phần${S.done[L.id] ? ' · <b style="color:var(--green,#2a8)">✔ Hoàn thành</b>' : ''}</div>${S.quiz[L.id] != null ? `<div class="small" style="margin-top:4px"><span class="tag green">Bài tập: ${S.quiz[L.id]}%</span></div>` : ''}</a>`; }).join('')}</div>`;
}

function viewLesson(id, tab = 'video') {
  const L = LESSONS.find(x => x.id === +id);
  if (!L) { view.innerHTML = '<p>Không tìm thấy bài học.</p>'; return; }
  const tabs = PARTS.map(([k, n]) => [k, (partDone(L.id, k) ? '✔ ' : '') + n]);
  const prev = LESSONS.find(x => x.id === L.id - 1), next = LESSONS.find(x => x.id === L.id + 1);
  let h = `<div class="page-head"><div class="muted small"><a href="#/lessons">← Danh sách bài</a> · BÀI ${L.id}/${LESSONS.length}</div>
    <h1><span class="kai">${esc(L.h)}</span> <span style="font-size:1rem;color:var(--red);font-weight:500">${esc(L.p)}</span></h1><p>${esc(L.v)} · ${esc(L.goal)}</p>${bar(lessonParts(L.id) / PARTS.length * 100)}<div class="small muted">Tiến độ bài: ${lessonParts(L.id)}/${PARTS.length} phần</div></div>${tabsHTML('/lesson/' + L.id, tabs, tab)}`;
  if (tab === 'dialogue') {
    h += `<div class="row" style="margin-bottom:12px"><label class="btn sm ${S.prefs.showPy ? 'on' : ''}"><input type="checkbox" id="tPy" ${S.prefs.showPy ? 'checked' : ''} hidden> Pinyin</label>
      <label class="btn sm ${S.prefs.showVi ? 'on' : ''}"><input type="checkbox" id="tVi" ${S.prefs.showVi ? 'checked' : ''} hidden> Tiếng Việt</label>
      <span class="muted small">Bấm một câu để nghe lại · A và B là hai giọng khác nhau</span></div>
      <div id="dlgs" class="${S.prefs.showPy ? '' : 'hide-py'} ${S.prefs.showVi ? '' : 'hide-vi'}">${L.dialogues.map((d, di) => `<section class="dlg"><h3>${esc(d.title)}</h3>
      <div class="row" style="margin-bottom:6px"><button class="btn sm" data-playall="${di}">▶ Nghe cả đoạn</button><button class="btn sm ghost" data-stopall>■ Dừng</button></div>
      ${d.lines.map((ln, li) => `<div class="line ${ln.s === 'B' ? 'b' : ''}" data-di="${di}" data-li="${li}" style="cursor:pointer"><div class="who">${ln.s}</div><div class="txt"><div class="l-h">${esc(ln.h)}</div><div class="l-p">${esc(ln.p)}</div><div class="l-v">${esc(ln.v)}</div></div><button class="spk" aria-label="Nghe">🔊</button></div>`).join('')}</section>`).join('')}</div>
      ${L.culture ? `<div class="callout"><b>Văn hoá:</b> ${esc(L.culture)}</div>` : ''}`;
  } else if (tab === 'vocab') {
    h += `<div class="row" style="margin-bottom:12px"><button class="btn sm" id="vAll">▶ Nghe tất cả</button><label class="btn sm ${S.prefs.showPy ? 'on' : ''}"><input type="checkbox" id="vPy" ${S.prefs.showPy ? 'checked' : ''} hidden> Pinyin</label><label class="btn sm ${S.prefs.showVi ? 'on' : ''}"><input type="checkbox" id="vVi" ${S.prefs.showVi ? 'checked' : ''} hidden> Nghĩa</label><span class="muted small">Bấm chữ Hán để xem cách viết</span></div>
      <div id="vlist" class="vlist ${S.prefs.showPy ? '' : 'hide-py'} ${S.prefs.showVi ? '' : 'hide-vi'}">${L.vocab.map(w => { const k = w.h + w.p; return `<div class="wrow"><div class="w-h" data-char="${esc(w.h)}" data-py="${esc(w.p)}" data-vi="${esc(w.v)}" data-sw="${esc(w.say || '')}" title="Xem nét viết">${esc(w.h)}</div>${spk(w.say || w.h)}
        <div class="w-mid"><div class="w-p">${esc(w.p)} ${w.ext ? '<span class="tag">mở rộng</span>' : ''}</div><div class="w-v">${esc(w.v)} <span class="muted small">· ${esc(w.t)}</span></div>${w.hv ? `<div class="w-hv">Hán Việt: ${esc(w.hv)}</div>` : ''}</div>
        <button class="known ${S.known[k] ? 'on' : ''}" data-known="${esc(k)}">${S.known[k] ? '✔ Đã thuộc' : 'Chưa thuộc'}</button></div>`; }).join('')}</div>`;
    if (L.numbers) {
      h += `<h2>Số đếm</h2><div class="chips">${L.numbers.map(n => `<button class="chip" data-char="${esc(n[1])}" data-py="${esc(n[2])}" data-vi="${esc(n[0])}"><span class="c-hz">${esc(n[1])}</span><span class="c-py">${esc(n[2])}</span><span class="c-vi">${esc(n[0])}</span></button>`).join('')}</div>`;
    }
  } else if (tab === 'grammar') {
    h += L.grammar.map((g, i) => `<div class="card gcard"><h3>${i + 1}. ${esc(g.t)}</h3><p>${g.body}</p>
      ${g.table ? `<table class="t"><tr>${g.table[0].map(c => `<th>${esc(c)}</th>`).join('')}</tr>${g.table.slice(1).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>` : ''}
      ${(g.ex || []).map(e => `<div class="exline">${spk(e.h)}<div><div class="e-h">${esc(e.h)}</div><div class="e-p">${esc(e.p)}</div><div class="e-v">${esc(e.v)}</div></div></div>`).join('')}</div>`).join('');
  } else if (tab === 'video') {
    h += `<div id="lecBox"></div>`;
  } else {
    h += `<div id="quizBox"></div>`;
  }
  const pdone = partDone(L.id, tab), nextPart = PARTS[PARTS.findIndex(x => x[0] === tab) + 1];
  h += `<div class="row" style="margin-top:26px;gap:10px;align-items:center;flex-wrap:wrap">${tab === 'practice' && !pdone ? '<span class="callout" style="margin:0">Làm bài luyện tập và đạt từ <b>60%</b> để hoàn thành phần này.</span>' : `<button class="btn ${pdone ? 'on' : 'primary'}" id="doneBtn">${pdone ? '✔ Đã hoàn thành phần này (bấm để bỏ)' : '✔ Đánh dấu hoàn thành phần này'}</button>`}
    ${pdone && nextPart ? `<a class="btn primary" href="#/lesson/${L.id}/${nextPart[0]}">Phần tiếp: ${nextPart[1]} →</a>` : ''}${S.done[L.id] ? '<span class="tag green">🎉 Đã hoàn thành cả bài</span>' : ''}${S.done[L.id] && courseDone() ? '<a class="btn primary" href="#/exam">🏆 Làm bài kiểm tra cuối khoá</a>' : ''}</div>
    <div class="lessonnav">${prev ? `<a class="btn" href="#/lesson/${prev.id}/video">← Bài ${prev.id}</a>` : '<span></span>'}${next ? `<a class="btn primary" href="#/lesson/${next.id}/video">Bài ${next.id} →</a>` : '<a class="btn primary" href="#/review">Sang ôn tập →</a>'}</div>`;
  view.innerHTML = h;

  const db = $('#doneBtn'); if (db) db.addEventListener('click', () => { setPart(L.id, tab, !partDone(L.id, tab)); viewLesson(id, tab); injectTips('lesson', [id, tab]); });
  const bindToggle = (cb, key, target, cls) => { const c = $(cb); if (!c) return; c.addEventListener('change', () => { S.prefs[key] = c.checked; save(); $(target).classList.toggle(cls, !c.checked); c.parentElement.classList.toggle('on', c.checked); }); };
  bindToggle('#tPy', 'showPy', '#dlgs', 'hide-py'); bindToggle('#tVi', 'showVi', '#dlgs', 'hide-vi');
  bindToggle('#vPy', 'showPy', '#vlist', 'hide-py'); bindToggle('#vVi', 'showVi', '#vlist', 'hide-vi');

  if (tab === 'dialogue') {
    const lineText = (di, li) => { const ln = L.dialogues[di].lines[li]; return [ln.say || ln.h, ln.s]; };
    $$('.line', view).forEach(el => el.addEventListener('click', () => {
      const [t, r] = lineText(+el.dataset.di, +el.dataset.li);
      el.classList.add('playing'); Voice.speak(t, r).then(() => el.classList.remove('playing'));
    }));
    const playAll = di => {
      const els = $$(`.line[data-di="${di}"]`, view);
      const items = els.map((el, i) => { const [text, role] = lineText(di, i); return { text, role, el }; });
      Voice.seq(items, {
        start: it => { it.el.classList.add('playing'); it.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
        end: it => it.el.classList.remove('playing'),
      });
    };
    $$('[data-playall]', view).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); playAll(+b.dataset.playall); }));
    $$('[data-stopall]', view).forEach(b => b.addEventListener('click', () => Voice.stop()));
  }
  if (tab === 'vocab') {
    $$('[data-known]', view).forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.known; S.known[k] = !S.known[k]; if (!S.known[k]) delete S.known[k]; save();
      b.classList.toggle('on', !!S.known[k]); b.textContent = S.known[k] ? '✔ Đã thuộc' : 'Chưa thuộc';
    }));
    $('#vAll').addEventListener('click', () => {
      const rows = $$('.wrow', view);
      Voice.seq(L.vocab.map((w, i) => ({ text: w.say || w.h, el: rows[i] })), {
        start: it => { it.el.style.outline = '2px solid var(--red)'; it.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
        end: it => { it.el.style.outline = ''; },
      }, 450);
    });
  }
  if (tab === 'practice') runLessonQuiz(L);
  if (tab === 'video' && window.Lecture) window.Lecture.mount($('#lecBox'), L);
}

/* ================= Bài tập ================= */
function sample(arr, n) { return shuffle(arr).slice(0, n); }
function distract(list, exclude, field, n = 3) {
  const out = [];
  for (const w of shuffle(list)) {
    if (exclude.includes(w[field]) || out.includes(w[field])) continue;
    out.push(w[field]); if (out.length >= n) break;
  }
  return out;
}
function buildQuestions(L, nW = 8, nO = 3) {
  const vs = (L ? L.vocab : ALLV).filter(w => w.h !== '们' && w.h !== '了' && w.h !== '的');
  const types = ['listen', 'hz2vi', 'vi2hz', 'hz2py'];
  const qs = sample(vs, Math.min(nW, vs.length)).map((w, i) => {
    const type = types[i % types.length];
    const pool = ALLV.filter(x => x.h !== w.h);
    if (type === 'listen') return { type, w, prompt: '🔊 Nghe và chọn nghĩa đúng', say: w.say || w.h, answer: w.v, opts: shuffle([w.v, ...distract(pool, [w.v], 'v')]) };
    if (type === 'hz2vi') return { type, w, prompt: 'Chữ này có nghĩa là gì?', hz: w.h, say: w.say || w.h, answer: w.v, opts: shuffle([w.v, ...distract(pool, [w.v], 'v')]) };
    if (type === 'vi2hz') return { type, w, prompt: 'Chọn chữ Hán đúng cho nghĩa:', big: w.v, answer: w.h, opts: shuffle([w.h, ...distract(pool, [w.h], 'h')]), hzOpts: true };
    return { type, w, prompt: 'Chọn pinyin đúng cho chữ:', hz: w.h, say: w.say || w.h, answer: w.p, opts: shuffle([w.p, ...distract(pool.filter(x => x.p !== w.p), [w.p], 'p')]) };
  });
  const lines = (L ? L.dialogues : LESSONS.flatMap(x => x.dialogues)).flatMap(d => d.lines).filter(l => l.g && l.g.split(' ').length >= 3);
  sample(lines, Math.min(nO, lines.length)).forEach(l => qs.push({ type: 'order', prompt: 'Sắp xếp các từ thành câu đúng:', big: l.v, say: l.say || l.h, tokens: l.g.split(' '), answer: l.g.split(' ').join(' ') }));
  return qs;
}
function runLessonQuiz(L) {
  const box = $('#quizBox');
  runQuizEngine(box, buildQuestions(L), (score, total) => {
    const pct = Math.round(score / total * 100);
    const best = Math.max(pct, S.quiz[L.id] || 0); S.quiz[L.id] = best;
    const was = partDone(L.id, 'practice');
    if (pct >= 60 && !was) setPart(L.id, 'practice', true); else save();
    box.innerHTML = `<div class="quiz center"><div class="score">${score}/${total}</div>${pct >= 60 ? (was ? '' : `<p><span class="tag green">✔ Đã hoàn thành phần Luyện tập</span> <button class="btn sm primary" id="qRefresh">Cập nhật tiến độ</button></p>`) : '<p class="muted small">Cần từ 60% để hoàn thành phần này.</p>'}<p>${pct >= 80 ? 'Xuất sắc! 🎉' : pct >= 50 ? 'Khá tốt, ôn lại những câu sai nhé.' : 'Hãy xem lại từ vựng và hội thoại rồi thử lại.'}</p><p class="muted small">Điểm cao nhất: ${best}%</p>
      <div class="row" style="justify-content:center"><button class="btn primary" id="qAgain">Làm lại</button><a class="btn" href="#/lesson/${L.id}/vocab">Xem lại từ vựng</a></div></div>`;
    $('#qAgain').onclick = () => runLessonQuiz(L);
    const rf = $('#qRefresh'); if (rf) rf.onclick = () => { viewLesson(L.id, 'practice'); injectTips('lesson', [L.id, 'practice']); };
  });
}
function runQuizEngine(box, qs, finishFn) {
  let i = 0, score = 0;
  const finish = () => finishFn(score, qs.length);
  const show = () => {
    if (i >= qs.length) return finish();
    const q = qs[i];
    let h = `<div class="quiz"><div class="qprog"><i style="width:${i / qs.length * 100}%"></i></div><div class="muted small center">Câu ${i + 1}/${qs.length}</div><div class="qprompt"><div class="q-t">${esc(q.prompt)}</div>
      ${q.hz ? `<div class="q-hz">${esc(q.hz)}</div>` : ''}${q.big ? `<div style="font-size:1.4rem;margin-top:6px"><b>${esc(q.big)}</b></div>` : ''}${q.say ? `<div style="margin-top:8px"><button class="btn sm" id="qSay">🔊 Nghe</button></div>` : ''}</div>`;
    if (q.type === 'order') {
      h += `<div class="answer-area" id="ans"></div><div class="row" id="pool" style="justify-content:center;margin:12px 0">${shuffle(q.tokens.map((t, k) => ({ t, k }))).map(o => `<button class="tok" data-k="${o.k}">${esc(o.t)}</button>`).join('')}</div>
        <div class="row" style="justify-content:center"><button class="btn" id="qReset">Làm lại</button><button class="btn primary" id="qCheck">Kiểm tra</button></div><p id="qFb" class="center" style="min-height:2em;margin-top:10px"></p>`;
    } else {
      h += `<div class="opts">${q.opts.map((o, k) => `<button class="opt" data-o="${esc(o)}">${q.hzOpts ? `<span class="hz">${esc(o)}</span>` : esc(o)}</button>`).join('')}</div><p id="qFb" class="center" style="min-height:2em;margin-top:10px"></p>`;
    }
    h += '</div>';
    box.innerHTML = h;
    const sayBtn = $('#qSay'); if (sayBtn) { sayBtn.onclick = () => Voice.speak(q.say); if (q.type === 'listen') setTimeout(() => Voice.speak(q.say), 250); }
    const nextBtn = () => { const b = document.createElement('div'); b.className = 'center'; b.innerHTML = '<button class="btn primary" id="qNext">Tiếp theo →</button>'; $('#qFb').after(b); $('#qNext').onclick = () => { i++; show(); }; $('#qNext').focus(); };
    if (q.type === 'order') {
      const chosen = [];
      const pool = $('#pool'), ans = $('#ans');
      pool.addEventListener('click', e => { const b = e.target.closest('.tok'); if (!b || b.disabled) return; chosen.push(b.dataset.k); b.hidden = true; ans.insertAdjacentHTML('beforeend', `<button class="tok" data-k="${b.dataset.k}">${esc(b.textContent)}</button>`); });
      ans.addEventListener('click', e => { const b = e.target.closest('.tok'); if (!b) return; chosen.splice(chosen.indexOf(b.dataset.k), 1); pool.querySelector(`[data-k="${b.dataset.k}"]`).hidden = false; b.remove(); });
      $('#qReset').onclick = () => { chosen.length = 0; ans.innerHTML = ''; $$('.tok', pool).forEach(x => x.hidden = false); };
      $('#qCheck').onclick = () => {
        if (chosen.length !== q.tokens.length) { $('#qFb').textContent = 'Hãy dùng hết các từ.'; return; }
        const ok = chosen.map(k => q.tokens[+k]).join(' ') === q.answer;
        if (ok) score++;
        bump(); save();
        $('#qFb').innerHTML = ok ? '✅ Chính xác!' : `❌ Đáp án: <b class="kai" style="font-size:1.3rem">${esc(q.answer.replace(/ /g, ''))}</b>`;
        $$('.tok, #qCheck, #qReset', box).forEach(x => x.disabled = true); Voice.speak(q.say); nextBtn();
      };
    } else {
      $$('.opt', box).forEach(b => b.addEventListener('click', () => {
        const ok = b.dataset.o === q.answer;
        $$('.opt', box).forEach(x => { x.disabled = true; if (x.dataset.o === q.answer) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong'); else score++;
        bump(); save();
        $('#qFb').innerHTML = ok ? '✅ Chính xác!' : '❌ Chưa đúng.';
        if (q.say && q.type !== 'listen') Voice.speak(q.say);
        nextBtn();
      }));
    }
  };
  show();
}

/* ================= Kiểm tra cuối khoá ================= */
const EXAM_PASS = 80;
function viewExam() {
  const ex = S.exam;
  if (!courseDone()) {
    const miss = LESSONS.filter(L => lessonParts(L.id) < PARTS.length);
    view.innerHTML = `<div class="page-head"><h1>🏆 Kiểm tra cuối khoá HSK 1</h1><p>Bài kiểm tra sẽ mở khi bạn hoàn thành 100% các phần học (hiện tại: <b>${coursePct()}%</b>).</p></div>
      <div class="card">${bar(coursePct())}<p>Còn thiếu:</p><div class="chips">${miss.map(L => `<a class="chip" href="#/lesson/${L.id}/video" style="min-width:0"><span class="c-hz" style="font-size:1rem">Bài ${L.id}</span><span class="c-vi">${lessonParts(L.id)}/${PARTS.length} phần</span></a>`).join('')}</div></div>`;
    return;
  }
  view.innerHTML = `<div class="page-head"><h1>🏆 Kiểm tra cuối khoá HSK 1</h1><p>Bạn đã hoàn thành 100% các phần học. Bài kiểm tra gồm <b>20 câu</b> (nghe, nghĩa, pinyin, chữ Hán, sắp xếp câu) lấy từ cả 15 bài.</p></div>
    <div class="card"><ul><li>Đạt từ <b>${EXAM_PASS}%</b> (16/20 câu) là <b>đạt</b>.</li><li>Nếu <b>không đạt</b>, toàn bộ tiến độ khoá (các phần đã hoàn thành, điểm bài tập) sẽ được <b>reset để học lại từ Bài 1</b>.${ex && ex.passed ? ' Bạn đã từng đạt nên lần thi lại này sẽ không bị reset.' : ''}</li></ul>
      ${ex ? `<p class="small muted">Đã thi ${ex.attempts} lần · điểm cao nhất ${ex.best}%${ex.passed ? ' · ✔ đã đạt' : ''}</p>` : ''}<button class="btn primary" id="exStart">Bắt đầu làm bài</button></div><div id="exBox"></div>`;
  $('#exStart').onclick = () => {
    $('#exStart').parentElement.hidden = true;
    const box = $('#exBox');
    runQuizEngine(box, buildQuestions(null, 16, 4), (score, total) => {
      const pct = Math.round(score / total * 100), pass = pct >= EXAM_PASS, had = S.exam && S.exam.passed;
      S.exam = { attempts: ((S.exam && S.exam.attempts) || 0) + 1, best: Math.max(pct, (S.exam && S.exam.best) || 0), passed: !!(had || pass), last: pct, date: today() };
      let reset = false;
      if (!pass && !had) { resetCourse(); reset = true; } else save();
      box.innerHTML = pass
        ? `<div class="quiz center"><div class="score">${score}/${total} · ${pct}%</div><h2>🎉 Đạt! Chúc mừng bạn hoàn thành khoá HSK 1</h2><p>Bạn đã nắm chắc nền tảng HSK 1. Hãy tiếp tục luyện nói và ôn từ vựng đều đặn.</p><div class="row" style="justify-content:center"><a class="btn primary" href="#/speak">🎤 Luyện nói</a><a class="btn" href="#/review">Ôn từ vựng</a></div></div>`
        : `<div class="quiz center"><div class="score" style="color:var(--red)">${score}/${total} · ${pct}%</div><h2>Chưa đạt (cần ${EXAM_PASS}%)</h2><p>${reset ? 'Tiến độ khoá đã được <b>reset</b>. Hãy học lại từ Bài 1, bạn sẽ nhớ chắc hơn.' : 'Lần này chưa đạt, nhưng tiến độ cũ được giữ vì bạn đã từng đạt.'}</p><div class="row" style="justify-content:center"><a class="btn primary" href="#/lesson/1/video">Học lại từ Bài 1</a></div></div>`;
    });
  };
}

/* ================= Ôn từ vựng (thẻ ghi nhớ) ================= */
function viewReview() {
  const sel = new Set(LESSONS.map(l => l.id));
  let mode = 'hz', onlyNew = false, onlyDue = false;
  view.innerHTML = `<div class="page-head"><h1>Ôn từ vựng</h1><p>Chọn các bài muốn ôn, rồi lật thẻ. Đánh dấu "Đã nhớ" hoặc "Chưa nhớ" để trang ghi nhận từ nào bạn đã thuộc.</p></div>
    <div class="card"><h3>Chọn bài</h3><div class="chips" id="rv-l">${LESSONS.map(l => `<button class="btn sm on" data-l="${l.id}">Bài ${l.id}</button>`).join('')}</div>
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" id="rv-all">Chọn tất cả</button><button class="btn sm ghost" id="rv-none">Bỏ chọn</button></div>
    <h3 style="margin-top:16px">Kiểu thẻ</h3><div class="row" id="rv-m">
      <button class="btn sm on" data-m="hz">Chữ Hán → nghĩa</button><button class="btn sm" data-m="vi">Nghĩa → chữ Hán</button><button class="btn sm" data-m="listen">Nghe → chữ &amp; nghĩa</button></div>
    <label class="row small" style="margin-top:12px"><input type="checkbox" id="rv-new"> Chỉ ôn những từ chưa thuộc</label>
    <label class="row small" style="margin-top:6px"><input type="checkbox" id="rv-due"> Chỉ ôn từ đến hạn (ôn lặp lại ngắt quãng) · hiện có <b>${dueCount()}</b> từ</label>
    <p style="margin-top:14px"><button class="btn primary" id="rv-go">Bắt đầu ôn</button> <span class="muted small" id="rv-n"></span></p></div><div id="flash"></div>`;
  const deckOf = () => ALLV.filter(w => sel.has(w.lesson) && w.h !== '们' && (!onlyNew || !S.known[w.key]) && (!onlyDue || isDue(w.key)));
  const upd = () => { $('#rv-n').textContent = `${deckOf().length} từ`; $$('#rv-l .btn').forEach(b => b.classList.toggle('on', sel.has(+b.dataset.l))); };
  $('#rv-l').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b) return; const n = +b.dataset.l; sel.has(n) ? sel.delete(n) : sel.add(n); upd(); });
  $('#rv-all').onclick = () => { LESSONS.forEach(l => sel.add(l.id)); upd(); };
  $('#rv-none').onclick = () => { sel.clear(); upd(); };
  $('#rv-m').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; mode = b.dataset.m; $$('#rv-m .btn').forEach(x => x.classList.toggle('on', x === b)); });
  $('#rv-new').addEventListener('change', e => { onlyNew = e.target.checked; upd(); });
  $('#rv-due').addEventListener('change', e => { onlyDue = e.target.checked; upd(); });
  upd();
  $('#rv-go').onclick = () => {
    const deck = shuffle(deckOf());
    if (!deck.length) { toast('Chưa có từ nào để ôn.'); return; }
    let i = 0, flipped = false, ok = 0, bad = 0;
    const box = $('#flash');
    const draw = () => {
      if (i >= deck.length) {
        draw.cur = null;
        box.innerHTML = `<div class="flash card center" style="margin-top:18px"><div class="score">${ok}/${deck.length}</div><p>Đã nhớ ${ok} · Chưa nhớ ${bad}</p><button class="btn primary" id="fAgain">Ôn lại</button></div>`;
        $('#fAgain').onclick = () => $('#rv-go').click(); return;
      }
      const w = deck[i];
      const front = mode === 'hz' ? `<div class="f-hz">${esc(w.h)}</div><div class="muted small">Nghĩa là gì? (bấm để lật)</div>`
        : mode === 'vi' ? `<div class="f-v">${esc(w.v)}</div><div class="muted small">Chữ Hán nào? (bấm để lật)</div>`
        : `<div class="f-hz" style="font-size:3rem">🔊</div><div class="muted small">Nghe và nhớ nghĩa (bấm để lật)</div>`;
      const back = `<div class="f-hz">${esc(w.h)}</div><div class="f-p">${esc(w.p)}</div><div class="f-v">${esc(w.v)}</div>${w.hv ? `<div class="f-hv small">Hán Việt: ${esc(w.hv)}</div>` : ''}`;
      box.innerHTML = `<div class="flash" style="margin-top:18px"><div class="qprog"><i style="width:${i / deck.length * 100}%"></i></div><div class="muted small center">${i + 1}/${deck.length}</div>
        <div class="card fcard" id="fc">${flipped ? back : front}</div>
        <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="fSay">🔊 Nghe</button>${flipped ? '<button class="btn" id="fNo">✖ Chưa nhớ</button><button class="btn primary" id="fYes">✔ Đã nhớ</button>' : '<button class="btn primary" id="fFlip">Lật thẻ</button>'}</div>
        <p class="muted small center" style="margin-top:8px">Phím tắt: Space lật · ← chưa nhớ · → đã nhớ</p></div>`;
      $('#fSay').onclick = () => Voice.speak(w.say || w.h);
      if (!flipped && mode === 'listen') setTimeout(() => Voice.speak(w.say || w.h), 200);
      const flip = () => { flipped = true; draw(); Voice.speak(w.say || w.h); };
      $('#fc').onclick = () => { if (!flipped) flip(); };
      if (!flipped) $('#fFlip').onclick = flip;
      else {
        const rate = good => { rateWord(w.key, good); good ? ok++ : bad++; save(); i++; flipped = false; draw(); };
        $('#fYes').onclick = () => rate(true); $('#fNo').onclick = () => rate(false);
      }
      draw.cur = { flipped, flip, rate: flipped ? (g => { rateWord(w.key, g); g ? ok++ : bad++; save(); i++; flipped = false; draw(); }) : null };
    };
    const onKey = e => {
      if (!draw.cur || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); if (!draw.cur.flipped) draw.cur.flip(); }
      else if (e.key === 'ArrowRight' && draw.cur.rate) draw.cur.rate(true);
      else if (e.key === 'ArrowLeft' && draw.cur.rate) draw.cur.rate(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = cleanup; cleanup = () => { document.removeEventListener('keydown', onKey); if (prev) prev(); };
    draw();
  };
}

/* ================= Luyện viết chữ ================= */
function viewWrite(ch) {
  const chars = [];
  const seen = new Set();
  LESSONS.forEach(L => L.vocab.forEach(w => [...w.h].forEach(c => { if (HAS(c) && !seen.has(c)) { seen.add(c); chars.push({ c, lesson: L.id }); } })));
  const cur = ch && HAS([...ch][0]) ? [...ch][0] : chars[0].c;
  const info = ALLV.find(w => w.h === cur) || ALLV.find(w => w.h.includes(cur));
  view.innerHTML = `<div class="page-head"><h1>Luyện viết chữ</h1><p>Chọn một chữ, bấm <b>✍ Tập viết</b> rồi viết từng nét bằng chuột hoặc ngón tay. Viết sai nét, trang sẽ gợi ý.</p></div>
    <div class="grid writegrid">
    <div class="card center"><div class="row" style="justify-content:center;margin-bottom:10px"><input class="input" id="wIn" maxlength="1" placeholder="Gõ 1 chữ Hán" style="width:130px;text-align:center;font-size:1.2rem" value="${esc(cur)}"><button class="btn" id="wGo">Mở</button></div>
    <div id="wBox"></div>${info ? `<p style="margin-top:8px"><b style="color:var(--red)">${esc(info.p)}</b> · ${esc(info.v)} ${spk(info.say || info.h)}</p>` : ''}<div data-strip="${esc(cur)}" style="margin-top:8px"></div></div>
    <div class="card"><h3>Chữ trong 15 bài</h3><div class="chips">${chars.map(o => `<a class="chip ${o.c === cur ? '' : ''}" href="#/write/${encodeURIComponent(o.c)}" style="${o.c === cur ? 'border-color:var(--red);background:var(--red-soft)' : ''}"><span class="c-hz">${esc(o.c)}</span><span class="c-vi">Bài ${o.lesson}</span></a>`).join('')}</div></div></div>`;
  $('#wBox').append(strokeCard(cur, 300, { startQuiz: true }));
  const go = () => { const v = [...$('#wIn').value.trim()][0]; if (!v) return; if (!HAS(v)) { toast('Chưa có dữ liệu nét cho chữ này.'); return; } location.hash = '#/write/' + encodeURIComponent(v); };
  $('#wGo').onclick = go; $('#wIn').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

/* ================= Tra từ ================= */
function viewDict() {
  view.innerHTML = `<div class="page-head"><h1>Tra từ nhanh</h1><p>Tìm trong ${DICT.filter(d => d.word).length} từ và ${DICT.filter(d => !d.word).length} câu, cụm từ của 15 bài. Gõ <b>tiếng Việt</b> (có hoặc không dấu), <b>pinyin không dấu</b> (vd: ni hao) hoặc chữ Hán. Có thể bôi đen chữ Hán ở bất kỳ đâu để nghe và xem nghĩa.</p></div>
    <div class="filterbar"><input class="input" id="dq" type="search" placeholder="Vd: chào, ni hao, cảm ơn, 老师…" style="flex:1;min-width:200px" autofocus autocomplete="off"></div><div id="dres"></div>`;
  const draw = () => {
    const raw = $('#dq').value.trim(), q = normTxt(raw);
    if (!q) { $('#dres').innerHTML = '<p class="muted">Nhập từ khoá để tìm.</p>'; return; }
    const score = d => {
      const py = normTxt(d.p.replace(/[.,?!，。？！]/g, '')), v = normTxt(d.v), hv = normTxt(d.hv), z = zhOnly(d.h);
      let s = 0;
      if (raw && z === zhOnly(raw)) s = 100; else if (raw && z.includes(zhOnly(raw)) && zhOnly(raw)) s = 60;
      if (py === q || v === q || hv === q) s = Math.max(s, 95);
      else if (py.startsWith(q) || v.startsWith(q)) s = Math.max(s, 80);
      else if (py.includes(q) || v.includes(q) || hv.includes(q)) s = Math.max(s, 50);
      return s ? s + (d.word ? 10 : 0) - Math.min(20, z.length) / 4 : 0;
    };
    const hits = DICT.map(d => [score(d), d]).filter(x => x[0] > 0).sort((x, y) => y[0] - x[0]).map(x => x[1]);
    $('#dres').innerHTML = hits.length ? `<p class="muted small">${hits.length} kết quả${hits.length > 80 ? ' (hiện 80 đầu)' : ''}</p><div class="vlist">${hits.slice(0, 80).map(w => `<div class="wrow"><div class="w-h" data-char="${esc(zhOnly(w.h))}" data-py="${esc(w.p)}" data-vi="${esc(w.v)}" data-sw="${esc(w.say || '')}" title="Xem nét viết" style="${w.word ? '' : 'font-size:1.2rem'}">${esc(w.h)}</div>${spk(w.say || w.h)}
      <div class="w-mid"><div class="w-p">${esc(w.p)}</div><div class="w-v">${esc(w.v)} <span class="muted small">· ${esc(w.t)}</span></div>${w.hv ? `<div class="w-hv">Hán Việt: ${esc(w.hv)}</div>` : ''}</div>
      <a class="tag" href="#/lesson/${w.lesson}/vocab">Bài ${w.lesson}</a></div>`).join('')}</div>` : '<p class="muted">Không tìm thấy. Thử gõ ngắn hơn hoặc dùng pinyin không dấu.</p>';
  };
  $('#dq').addEventListener('input', draw); draw();
}

/* ================= Hỏi đáp: kho câu giao tiếp, tìm kiếm có gợi ý ================= */
const askCard = c => `<div class="exline">${spk(c.h)}<div><div class="e-h">${esc(c.h)}</div><div class="e-p">${esc(c.p)}</div><div class="e-v">${esc(c.v)}</div></div></div>`;
const askSections = secs => secs.map(s => s.divider ? `<div class="group-title">${esc(s.divider)}</div>` : `<div class="card gcard" style="margin-top:10px"><h3>${esc(s.title)}</h3>${s.cards.map(askCard).join('')}</div>`).join('');
const nrm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\u3400-\u9fff]+/g, ' ').trim();
let _pdb = null;
function getPDB() {
  if (_pdb) return _pdb;
  const seen = new Set(); _pdb = [];
  (window.PHRASE_GROUPS || []).forEach(([cat, ic, list]) => list.forEach(([h, p, v, tags]) => {
    const k = zhOnly(h); if (!k || seen.has(k)) return; seen.add(k);
    _pdb.push({ h, p, v, cat, ic, hay: ' ' + nrm([v, p, tags || '', cat].join(' ')) + ' ' + k });
  }));
  DICT.filter(d => !d.word).forEach(d => {
    const k = zhOnly(d.h); if (!k || seen.has(k)) return; seen.add(k);
    _pdb.push({ h: d.h, p: d.p, v: d.v, cat: 'Hội thoại và ví dụ trong bài', ic: '📘', lesson: d.lesson, hay: ' ' + nrm(d.v + ' ' + d.p + ' hoi thoai bai ' + d.lesson) + ' ' + k });
  });
  return _pdb;
}
function searchPhrases(q, limit = 40) {
  const toks = nrm(q).split(' ').filter(Boolean);
  if (!toks.length) return [];
  return getPDB().map(it => {
    let sc = 0;
    for (const t of toks) {
      if (!it.hay.includes(t)) return [0, it];
      sc += it.hay.includes(' ' + t) ? 3 : 1;
    }
    const v = nrm(it.v);
    if (v.startsWith(toks.join(' '))) sc += 4;
    return [sc - Math.min(it.h.length, 30) / 100, it];
  }).filter(x => x[0] > 0).sort((x, y) => y[0] - x[0]).slice(0, limit).map(x => x[1]);
}
function viewAsk() {
  let run = 0;
  cleanup = () => { run++; };
  const ex = (window.ASKBOT && window.ASKBOT.examples) || [];
  const total = getPDB().length;
  view.innerHTML = `<div class="page-head"><h1>Câu giao tiếp: nói thế nào?</h1>
    <p>Kho <b>${total}</b> câu giao tiếp tiếng Trung có pinyin, nghĩa tiếng Việt và giọng đọc. Gõ tiếng Việt (có hoặc không dấu), pinyin hoặc chữ Hán, các gợi ý liên quan hiện ngay khi bạn gõ. Có thể gõ cả câu hỏi như <i>"hỏi thăm sức khoẻ ông nội"</i> để nhận mẫu câu theo từng người thân.</p></div>
    <div class="card"><input class="input" id="aq" type="search" placeholder="Vd: cảm ơn, ni hao, hỏi đường, ông nội, 谢谢…" style="width:100%" autocomplete="off" autofocus>
      <div class="chips" style="margin-top:10px">${ex.map(t => `<button class="chip" data-ex="${esc(t)}" style="min-width:0"><span class="c-vi" style="font-size:.85rem">${esc(t)}</span></button>`).join('')}</div></div>
    <div id="aout" style="margin-top:14px"></div>`;
  const out = $('#aout');
  const browse = () => {
    out.innerHTML = '<h2>Tất cả nhóm câu giao tiếp</h2>' + (window.PHRASE_GROUPS || []).map(([cat, ic, list]) => `<details class="card" style="margin-top:8px"><summary><b>${ic} ${esc(cat)}</b> <span class="muted small">(${list.length})</span></summary>${list.map(r => askCard({ h: r[0], p: r[1], v: r[2] })).join('')}</details>`).join('');
  };
  const draw = () => {
    const q = $('#aq').value.trim();
    if (!q) { browse(); return; }
    const hits = searchPhrases(q), res = window.ASKBOT.answer(q);
    let h = '';
    if (res) h += `<details class="card" open><summary><b>💡 Gợi ý theo tình huống</b></summary><p>${res.intro}</p>${res.note ? `<p class="small muted">Ghi chú: ${esc(res.note)}</p>` : ''}${askSections(res.sections)}${res.tips.length ? tipBox(res.tips) : ''}</details>`;
    if (hits.length) h += `<h2 style="margin-top:16px">Câu liên quan trong kho (${hits.length}${hits.length >= 40 ? '+' : ''})</h2><p><button class="btn sm" id="aAll">▶ Nghe các câu đầu</button></p><div class="card gcard">${hits.map(it => `${askCard(it)}<div class="small muted" style="margin:-4px 0 4px 44px">${it.ic || ''} ${esc(it.cat)}${it.lesson ? ` · <a href="#/lesson/${it.lesson}/dialogue">Bài ${it.lesson}</a>` : ''}</div>`).join('')}</div>`;
    if (!h) h = `<p class="muted">Chưa tìm thấy câu phù hợp. Thử gõ ngắn hơn, dùng pinyin không dấu, hoặc chọn một gợi ý bên trên. Bạn cũng có thể duyệt theo nhóm khi xoá ô tìm kiếm.</p>`;
    out.innerHTML = h;
    const all = $('#aAll', out);
    if (all) all.onclick = async () => { const id = ++run; for (const it of hits.slice(0, 8)) { if (id !== run) break; await Voice.speak(zhOnly(it.h)); } };
    if (hits.length || res) bump();
  };
  let tm; $('#aq').addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(draw, 120); });
  view.addEventListener('click', e => { const x = e.target.closest('[data-ex]'); if (x) { e.preventDefault(); $('#aq').value = x.dataset.ex; draw(); } });
  draw();
}

/* ================= Luyện nói: nhận giọng nói, chấm đạt / không đạt ================= */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const SPEAK_PASS = 75;
function lcsLen(a, b) {
  const m = a.length, n = b.length; if (!m || !n) return 0;
  let prev = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) { const cur = [0]; for (let j = 1; j <= n; j++) cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]); prev = cur; }
  return prev[n];
}
/* Điểm 0–100: độ giống giữa câu chuẩn và câu nhận được (chỉ so chữ Hán) */
function speakScore(target, said) {
  const t = [...zhOnly(target)], s = [...zhOnly(said)];
  if (!t.length || !s.length) return 0;
  return Math.round(2 * lcsLen(t, s) / (t.length + s.length) * 100);
}
function speakDiff(target, said) {
  const t = [...zhOnly(target)], s = new Set([...zhOnly(said)]);
  return t.map(c => `<span class="kai" style="color:${s.has(c) ? 'var(--green,#2a8)' : 'var(--red)'}">${esc(c)}</span>`).join('');
}
function speakPool(mode, lesson) {
  if (mode === 'words') return (lesson ? LESSONS.find(l => l.id === +lesson).vocab : ALLV).filter(w => zhOnly(w.h).length >= 1 && !/[…]/.test(w.h)).map(w => ({ h: w.h, p: w.p, v: w.v }));
  if (mode === 'lines') return DICT.filter(d => !d.word && (!lesson || d.lesson === +lesson)).map(d => ({ h: d.h, p: d.p, v: d.v }));
  return getPDB().filter(it => !/[…\/]/.test(it.h)).map(it => ({ h: it.h, p: it.p, v: it.v }));
}
function viewSpeak() {
  cleanup = () => { try { rec && rec.abort(); } catch (e) { } rec = null; };
  let rec = null, items = [], idx = 0, res = [];
  view.innerHTML = `<div class="page-head"><h1>🎤 Luyện nói</h1><p>Nghe câu mẫu, bấm micro rồi đọc lại. Trang nhận diện giọng nói của bạn, so với câu chuẩn và chấm <b>Đạt</b> khi giống từ ${SPEAK_PASS}% trở lên. Mỗi lượt luyện gồm 10 câu; đạt từ 7/10 câu là lượt đạt.</p></div>
    <div class="card"><div class="row" style="gap:8px;flex-wrap:wrap"><select class="input" id="sMode"><option value="phrases">Câu giao tiếp</option><option value="lines">Câu trong hội thoại bài học</option><option value="words">Từ vựng</option></select>
      <select class="input" id="sLes"><option value="">Tất cả các bài</option>${LESSONS.map(l => `<option value="${l.id}">Bài ${l.id}</option>`).join('')}</select>
      <button class="btn primary" id="sGo">Bắt đầu lượt luyện</button></div>
      ${SR ? '' : '<p class="callout" style="margin-top:10px">Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Hãy dùng <b>Chrome hoặc Edge</b> bản mới (cần có mạng và cho phép micro). Hiện bạn vẫn luyện được ở chế độ <b>tự đánh giá</b>.</p>'}
      <p class="small muted" style="margin-bottom:0">Lưu ý: nhận diện giọng nói do trình duyệt thực hiện (Chrome/Edge gửi âm thanh tới máy chủ của hãng). Điểm chỉ mang tính tham khảo, sai khác nhỏ về vùng giọng vẫn có thể bị tính là lỗi.</p></div>
    <div id="sBox" style="margin-top:14px"></div>`;
  const box = $('#sBox');
  const finish = () => {
    const pass = res.filter(r => r.ok).length, ok = pass >= 7;
    S.speak = S.speak || { runs: 0, passed: 0, best: 0 }; S.speak.runs++; if (ok) S.speak.passed++; S.speak.best = Math.max(S.speak.best, pass); save(); bump();
    box.innerHTML = `<div class="quiz center"><div class="score">${pass}/${items.length}</div><h2 style="color:${ok ? 'var(--green,#2a8)' : 'var(--red)'}">${ok ? '✔ ĐẠT' : '✘ CHƯA ĐẠT'}</h2><p class="muted small">Cần ít nhất 7/10 câu đạt. Lượt đạt: ${S.speak.passed}/${S.speak.runs} · tốt nhất ${S.speak.best}/10</p>
      <table class="t" style="margin:8px auto;text-align:left"><tr><th>Câu</th><th>Điểm</th><th></th></tr>${res.map(r => `<tr><td><span class="kai">${esc(r.h)}</span><br><span class="small muted">${esc(r.v)}</span></td><td>${r.score == null ? '—' : r.score + '%'}${r.self ? ' <span class="small muted">(tự đánh giá)</span>' : ''}</td><td>${r.ok ? '✔' : '✘'}</td></tr>`).join('')}</table>
      <div class="row" style="justify-content:center"><button class="btn primary" id="sAgain">Luyện lượt mới</button></div></div>`;
    $('#sAgain').onclick = start;
  };
  const show = () => {
    if (idx >= items.length) return finish();
    const it = items[idx], target = zhOnly(it.h);
    box.innerHTML = `<div class="quiz"><div class="qprog"><i style="width:${idx / items.length * 100}%"></i></div><div class="muted small center">Câu ${idx + 1}/${items.length}</div>
      <div class="qprompt center"><div class="q-hz kai" style="font-size:2.2rem">${esc(it.h)}</div><div style="color:var(--red);font-weight:600">${esc(it.p)}</div><div class="muted">${esc(it.v)}</div>
      <div class="row" style="justify-content:center;margin-top:10px"><button class="btn sm" id="sHear">🔊 Nghe mẫu</button><button class="btn sm" id="sSlow">🐢 Nghe chậm</button></div></div>
      <div class="center" style="margin:12px 0">${SR ? '<button class="btn primary" id="sRec" style="font-size:1.1rem;padding:10px 22px">🎤 Bấm và đọc</button>' : '<button class="btn" id="sOk">✔ Tôi đọc đạt</button> <button class="btn" id="sNo">✘ Chưa đạt</button>'}</div>
      <div id="sFb" class="center" style="min-height:3em"></div></div>`;
    $('#sHear').onclick = () => Voice.speak(target);
    $('#sSlow').onclick = () => Voice.speak(target, 'A', 0.55);
    const next = (r) => { res.push({ ...it, ...r }); idx++; show(); };
    const nextBtn = r => { $('#sFb').insertAdjacentHTML('beforeend', '<div style="margin-top:8px"><button class="btn primary" id="sNext">Câu tiếp →</button> <button class="btn" id="sRetry">Thử lại</button></div>'); $('#sNext').onclick = () => next(r); $('#sRetry').onclick = () => { $('#sFb').innerHTML = ''; $('#sRec').disabled = false; }; };
    if (!SR) { $('#sOk').onclick = () => next({ score: null, ok: true, self: true }); $('#sNo').onclick = () => next({ score: null, ok: false, self: true }); return; }
    $('#sRec').onclick = () => {
      Voice.stop();
      const btn = $('#sRec'); btn.disabled = true; btn.textContent = '🎙️ Đang nghe… hãy đọc';
      rec = new SR(); rec.lang = 'zh-CN'; rec.interimResults = false; rec.maxAlternatives = 5; rec.continuous = false;
      let got = false;
      rec.onresult = ev => {
        got = true;
        const alts = [...ev.results[0]].map(x => x.transcript);
        const best = alts.map(t => [speakScore(target, t), t]).sort((x, y) => y[0] - x[0])[0];
        const ok = best[0] >= SPEAK_PASS;
        btn.textContent = '🎤 Bấm và đọc';
        $('#sFb').innerHTML = `<div style="font-size:1.1rem">Bạn đọc: <b class="kai">${esc(best[1])}</b></div><div style="margin:6px 0">${speakDiff(target, best[1])} <span class="small muted">(xanh: đúng · đỏ: thiếu hoặc sai)</span></div><div style="font-size:1.4rem;font-weight:700;color:${ok ? 'var(--green,#2a8)' : 'var(--red)'}">${ok ? '✔ ĐẠT' : '✘ CHƯA ĐẠT'} · ${best[0]}%</div>`;
        nextBtn({ score: best[0], ok, said: best[1] });
      };
      rec.onerror = ev => {
        const m = { 'not-allowed': 'Chưa cho phép dùng micro. Hãy bấm biểu tượng khoá trên thanh địa chỉ và cho phép micro.', 'service-not-allowed': 'Trình duyệt không cho dùng nhận diện giọng nói ở trang này.', 'no-speech': 'Không nghe thấy giọng nói. Hãy thử lại gần micro hơn.', 'network': 'Cần có kết nối mạng để nhận diện giọng nói.', 'audio-capture': 'Không tìm thấy micro.' }[ev.error] || ('Lỗi nhận diện: ' + ev.error);
        got = true; btn.disabled = false; btn.textContent = '🎤 Bấm và đọc'; $('#sFb').innerHTML = `<span style="color:var(--red)">${esc(m)}</span>`;
      };
      rec.onend = () => { if (!got) { btn.disabled = false; btn.textContent = '🎤 Bấm và đọc'; $('#sFb').innerHTML = '<span style="color:var(--red)">Không nghe thấy giọng nói. Hãy thử lại.</span>'; } };
      try { rec.start(); } catch (err) { btn.disabled = false; btn.textContent = '🎤 Bấm và đọc'; }
    };
    setTimeout(() => Voice.speak(target), 200);
  };
  const start = () => {
    const pool = speakPool($('#sMode').value, $('#sLes').value);
    if (pool.length < 3) { box.innerHTML = '<p class="muted">Không đủ câu để luyện. Hãy chọn "Tất cả các bài".</p>'; return; }
    items = sample(pool, Math.min(10, pool.length)); idx = 0; res = []; show();
  };
  $('#sGo').onclick = start;
}

/* ================= Nghe chép pinyin ================= */
const TONE_MAP = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', v: 'ǖǘǚǜ' };
/* Chuyển pinyin bất kỳ (có dấu / số thanh / không thanh) thành { base, tones } */
function parsePinyin(s) {
  let base = '', tones = '';
  for (const c0 of String(s).toLowerCase().replace(/s+/g, '')) {
    const c = c0 === 'ü' ? 'v' : c0;
    let hit = false;
    for (const [b, t] of Object.entries(TONE_MAP)) { const i = t.indexOf(c); if (i >= 0) { base += b; tones += (i + 1); hit = true; break; } }
    if (hit) continue;
    if (/[0-5]/.test(c)) { tones += c; continue; }
    base += c;
  }
  return { base, tones: tones.replace(/5/g, '') };
}
function viewListen() {
  const pool = ALLV.filter(w => w.h !== '们' && w.t !== 'hậu tố');
  view.innerHTML = `<div class="page-head"><h1>Nghe và gõ pinyin</h1><p>Nghe một từ rồi gõ pinyin. Có thể gõ có dấu thanh (nǐ hǎo), số thanh (ni3 hao3) hoặc không thanh (ni hao); trang sẽ báo bạn đúng âm, đúng thanh hay chưa.</p></div><div id="lbox" class="quiz"></div>`;
  let n = 0, score = 0;
  const box = $('#lbox'), total = Math.min(10, pool.length);
  const qs = shuffle(pool).slice(0, total);
  const next = () => {
    if (n >= total) {
      box.innerHTML = `<div class="center"><div class="score">${score}/${total}</div><p>${score >= 8 ? 'Tai rất tốt! 🎉' : 'Nghe thêm và thử lại nhé.'}</p><button class="btn primary" id="lAgain">Chơi lại</button></div>`;
      $('#lAgain').onclick = viewListen; return;
    }
    const w = qs[n], say = w.say || w.h;
    box.innerHTML = `<div class="qprog"><i style="width:${n / total * 100}%"></i></div><div class="muted small center">Câu ${n + 1}/${total}</div>
      <div class="center" style="margin:14px"><button class="btn primary" id="lPlay">🔊 Nghe</button> <button class="btn sm" id="lSlow">Chậm</button></div>
      <div class="row" style="justify-content:center"><input class="input" id="lIn" autocomplete="off" placeholder="Gõ pinyin…" style="width:min(260px,70%);text-align:center;font-size:1.2rem"><button class="btn primary" id="lOk">Kiểm tra</button></div>
      <p id="lFb" class="center" style="min-height:3em;margin-top:12px"></p>`;
    $('#lPlay').onclick = () => Voice.speak(say); $('#lSlow').onclick = () => Voice.speak(say, 'A', 0.55);
    setTimeout(() => Voice.speak(say), 250);
    const inp = $('#lIn'); inp.focus();
    let checked = false;
    const check = () => {
      if (checked) { n++; next(); return; }
      const v = inp.value.trim(); if (!v) return;
      checked = true;
      const a = parsePinyin(v), b = parsePinyin(w.p);
      const baseOk = a.base === b.base;
      const toneOk = a.tones === b.tones;
      let msg;
      if (baseOk && toneOk) { score++; msg = a.tones ? '✅ Chính xác cả âm lẫn thanh!' : '✅ Chính xác!'; }
      else if (baseOk && !a.tones) { score++; msg = '✅ Đúng âm. Lần sau thử gõ cả thanh điệu nhé.'; }
      else if (baseOk) msg = '⚠ Đúng âm nhưng sai thanh điệu.';
      else msg = '❌ Chưa đúng.';
      bump(); save();
      $('#lFb').innerHTML = `${msg}<br>Đáp án: <b class="kai" style="font-size:1.3rem">${esc(w.h)}</b> <b style="color:var(--red)">${esc(w.p)}</b> · ${esc(w.v)}`;
      $('#lOk').textContent = 'Tiếp theo →'; inp.disabled = true; $('#lOk').focus();
    };
    $('#lOk').onclick = check;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  };
  next();
}

/* ================= Cài đặt ================= */
function openSettings() {
  const body = openModal('');
  const vs = Voice.zh;
  body.innerHTML = `<h2 style="margin-top:0">Cài đặt</h2>
    <label class="small muted">Giọng đọc tiếng Trung</label>
    <select class="input" id="sVoice" style="width:100%;margin-bottom:12px"><option value="">Tự động chọn giọng tốt nhất</option>${vs.map(v => `<option value="${esc(v.voiceURI)}" ${S.prefs.voice === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select>
    <label class="small muted">Tốc độ đọc: <b id="sRv">${S.prefs.rate.toFixed(2)}</b></label>
    <input type="range" id="sRate" min="0.5" max="1.2" step="0.05" value="${S.prefs.rate}" style="width:100%;margin-bottom:12px">
    <label class="small muted">Giao diện</label>
    <select class="input" id="sTheme" style="width:100%;margin-bottom:12px"><option value="">Theo hệ thống</option><option value="light" ${S.prefs.theme === 'light' ? 'selected' : ''}>Sáng</option><option value="dark" ${S.prefs.theme === 'dark' ? 'selected' : ''}>Tối</option></select>
    <div class="row"><button class="btn primary" id="sTest">🔊 Thử giọng (你好,我叫明)</button><button class="btn" id="sReset">Xoá tiến độ học</button></div>
    ${vs.length ? '' : `<div class="callout red" style="margin-top:14px"><b>Chưa tìm thấy giọng tiếng Trung.</b><br>Cách khắc phục: dùng trình duyệt <b>Microsoft Edge</b> (có sẵn giọng Xiaoxiao, Yunxi). Hoặc trên Windows: Settings → Time &amp; language → Language &amp; region → Add a language → Chinese (Simplified) → bật Text-to-speech, rồi khởi động lại trình duyệt.</div>`}
    <p class="small muted" style="margin-top:14px">Bạn cũng có thể bỏ file MP3 vào thư mục <code>audio/</code> và khai báo trong <code>audio/manifest.js</code> để dùng thay giọng trình duyệt.</p>`;
  $('#sVoice').onchange = e => { S.prefs.voice = e.target.value; save(); Voice.status(); };
  $('#sRate').oninput = e => { S.prefs.rate = +e.target.value; $('#sRv').textContent = S.prefs.rate.toFixed(2); save(); };
  $('#sTheme').onchange = e => { S.prefs.theme = e.target.value; save(); applyTheme(); };
  $('#sTest').onclick = () => Voice.speak('你好,我叫明。');
  $('#sReset').onclick = () => { if (confirm('Xoá toàn bộ tiến độ (bài đã học, điểm bài tập, từ đã thuộc)?')) { S.done = {}; S.parts = {}; S.exam = null; S.quiz = {}; S.known = {}; S.srs = {}; S.days = {}; save(); closeModal(); route(); } };
}
$('#settingsBtn').addEventListener('click', openSettings);
$('#voiceStatus').addEventListener('click', openSettings);
$('#voiceStatus').style.cursor = 'pointer';

window.HANYU = { Voice, strokeCard, esc, $, $$, S, save, bump, HAS, toast, ALLV };

/* ================= Khởi động ================= */
Voice.init();
route();
})();
