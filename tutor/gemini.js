/* Thay cho server.js: gọi Gemini trực tiếp từ trình duyệt bằng khoá API của chính bạn.
   Khoá chỉ lưu trong localStorage của thiết bị này, không gửi đi đâu ngoài Google.
   tutorFetch() giả lập 3 đường /api/styles, /api/status, /api/chat của bản máy chủ cũ. */
(function () {
  const KEY_NAME = 'xm.geminiKey';
  const MODELS = ['gemini-3.5-flash-lite'];
  const FIRST_TOKEN_MS = 15000;
  const cool = {}; // model -> thời điểm được thử lại

  const store = {
    get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} }
  };

  function askKey(force) {
    let key = store.get(KEY_NAME);
    if (key && !force) return key;
    const v = window.prompt(
      'Dán khoá Gemini API của bạn (miễn phí tại https://aistudio.google.com/apikey).\n' +
      'Khoá chỉ lưu trên thiết bị này. Để trống rồi OK để xoá khoá.', key);
    if (v === null) return key;
    key = v.trim();
    store.set(KEY_NAME, key);
    return key;
  }

  function json(status, obj) {
    return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  }

  async function openStream(model, key, body, signal) {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':streamGenerateContent?alt=sse',
      { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body, signal });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      const err = new Error((d.error && d.error.message) || ('Lỗi API ' + r.status));
      err.status = r.status;
      throw err;
    }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    async function* deltas() {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          let obj;
          try { obj = JSON.parse(line.slice(5)); } catch (e) { continue; }
          if (obj.error) throw new Error(obj.error.message || 'Lỗi luồng dữ liệu');
          const parts = (obj.candidates && obj.candidates[0] && obj.candidates[0].content && obj.candidates[0].content.parts) || [];
          const text = parts.map((p) => p.text || '').join('');
          if (text) yield text;
        }
      }
    }
    const it = deltas();
    const first = await it.next();
    if (first.done) throw new Error('Gemini không trả về nội dung');
    return { it, first: first.value, abort: () => reader.cancel().catch(() => {}) };
  }

  async function chat(opts) {
    const P = window.Persona;
    const key = askKey(false);
    if (!key) return json(400, { error: 'Chưa có khoá Gemini API. Bấm nút 🔑 Khoá API để nhập.' });

    let messages = (opts.messages || []).slice(-30).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) }));
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length) return json(400, { error: 'Không có tin nhắn' });

    const audio = opts.audio && opts.audio.mime === 'audio/wav' ? opts.audio : null;
    const persona = P.buildPersona(opts.style, opts.seed, opts.level);
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: persona.system }] },
      contents: messages.map((m, i) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: audio && i === messages.length - 1 && m.role !== 'assistant'
          ? [{ inlineData: { mimeType: audio.mime, data: audio.data } }, { text: P.AUDIO_INSTRUCTION }]
          : [{ text: m.content }]
      })),
      generationConfig: { maxOutputTokens: 900, temperature: 1.0 }
    });

    const now = Date.now();
    let order = MODELS.filter((m) => (cool[m] || 0) <= now);
    if (!order.length) order = MODELS.slice();
    let winner = null, lastError = 'Gemini không phản hồi';
    for (const model of order) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), FIRST_TOKEN_MS);
      if (opts.signal) opts.signal.addEventListener('abort', () => ac.abort(), { once: true });
      try {
        const s = await openStream(model, key, body, ac.signal);
        clearTimeout(timer);
        winner = s;
        break;
      } catch (e) {
        clearTimeout(timer);
        if (opts.signal && opts.signal.aborted) throw e;
        const st = e.status;
        lastError = e.name === 'AbortError' ? 'Gemini trả lời quá chậm'
          : st === 429 ? e.message + ' (hết lượt miễn phí, đợi một phút rồi thử lại)'
          : (st === 400 || st === 403) && /api key|permission/i.test(e.message) ? 'Khoá API không hợp lệ. Bấm 🔑 Khoá API để nhập lại.'
          : e.message;
        if (st === 429 || st >= 500 || st === 404 || e.name === 'AbortError') cool[model] = Date.now() + 60000;
        if (st === 400 || st === 403) break; // lỗi khoá: thử model khác cũng vô ích
      }
    }
    if (!winner) return json(502, { error: lastError });

    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(c) {
        const w = (o) => c.enqueue(enc.encode(JSON.stringify(o) + '\n'));
        w({ meta: { style: persona.label, level: persona.level } });
        w({ t: winner.first });
        try {
          for await (const t of winner.it) w({ t });
          w({ done: true });
        } catch (e) {
          w({ error: 'Kết nối tới Gemini bị ngắt: ' + e.message });
        }
        c.close();
      },
      cancel() { winner.abort(); }
    });
    return new Response(stream, { status: 200, headers: { 'Content-Type': 'application/x-ndjson' } });
  }

  window.tutorFetch = function (url, init) {
    const P = window.Persona;
    if (url === '/api/styles') {
      return Promise.resolve(json(200, {
        styles: P.STYLES.map((s) => ({ id: s.id, label: s.label })),
        levels: Object.keys(P.LEVELS).map((id) => ({ id, label: P.LEVELS[id].label })),
        audioInput: true
      }));
    }
    if (url === '/api/status') {
      return Promise.resolve(json(200, { provider: 'gemini', chosen: MODELS[0], results: [] }));
    }
    if (url === '/api/chat') {
      const b = JSON.parse(init.body);
      b.signal = init.signal;
      return chat(b).catch((e) => { throw e; });
    }
    return Promise.reject(new Error('Đường dẫn không hỗ trợ: ' + url));
  };

  /* Tra nhanh một từ/cụm chữ Hán: trả về { py, vi }. context = câu chứa từ đó, giúp chọn nghĩa đúng. */
  const lookCache = {};
  async function lookup(text, context) {
    const ck = text + '|' + (context || '');
    if (lookCache[ck]) return lookCache[ck];
    const key = store.get(KEY_NAME);
    if (!key) throw new Error('Chưa có khoá API (bấm 🔑 Khoá API).');
    const prompt = 'Chữ Hán: ' + text + (context ? '\nTrong câu: ' + context : '') +
      '\nTrả về JSON {"py": pinyin có dấu thanh, các âm tiết cách nhau bằng dấu cách, "vi": nghĩa tiếng Việt ngắn gọn (nếu có thể kèm âm Hán Việt)} cho đúng phần chữ Hán đã chọn.';
    let lastErr;
    for (const model of MODELS) {
      try {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
          method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.2, responseMimeType: 'application/json' } }),
          signal: AbortSignal.timeout(12000) });
        const d = await r.json();
        if (!r.ok) throw new Error((d.error && d.error.message) || ('Lỗi API ' + r.status));
        const t = (d.candidates[0].content.parts || []).map((p) => p.text || '').join('');
        const o = JSON.parse(t.replace(/^[^{]*|[^}]*$/g, ''));
        return (lookCache[ck] = { py: String(o.py || ''), vi: String(o.vi || '') });
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Không tra được');
  }

  window.TutorAPI = { askKey, lookup };
})();
