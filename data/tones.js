/* Bài thanh điệu + các mẹo học (tips) cho từng phần */

/* Vẽ đường cao độ. shape: chuỗi mức cao độ 1–5, ví dụ '214' */
window.toneCurve = function (shape, color, opts) {
  opts = opts || {};
  const lv = n => 78 - (n - 1) * 16;
  const pts = String(shape).split('').map(Number);
  const xs = pts.length === 1 ? [55] : pts.length === 2 ? [18, 92] : [18, 55, 92];
  const guides = [1, 2, 3, 4, 5].map(n => `<line x1="10" x2="100" y1="${lv(n)}" y2="${lv(n)}" stroke="${opts.grid || 'currentColor'}" stroke-opacity=".25" stroke-width="1"/><text x="2" y="${lv(n) + 3}" font-size="8" fill="currentColor" opacity=".5">${n}</text>`).join('');
  let d = '', dot = '';
  if (pts.length >= 2) {
    d = pts.map((p, i) => (i ? 'L' : 'M') + xs[i] + ' ' + lv(p)).join(' ');
    /* thanh 3 và thanh 2 vẽ cong mềm */
    if (pts.length === 3) d = `M${xs[0]} ${lv(pts[0])} Q ${xs[1] - 8} ${lv(pts[1]) + 14} ${xs[1]} ${lv(pts[1])} T ${xs[2]} ${lv(pts[2])}`;
    dot = `<circle cx="${xs[pts.length - 1]}" cy="${lv(pts[pts.length - 1])}" r="5" fill="${color}"/>`;
  }
  return `<svg viewBox="0 0 110 90" class="tcurve">${guides}${d ? `<path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${dot}` : ''}</svg>`;
};

window.TONES = {
  intro: [
    'Tiếng Trung phổ thông (Quan thoại) có <b>4 thanh điệu</b> và <b>1 thanh nhẹ</b>. Cùng một âm tiết, đổi thanh là đổi nghĩa hoàn toàn: <b>mā</b> (mẹ), <b>má</b> (gai, tê), <b>mǎ</b> (ngựa), <b>mà</b> (mắng).',
    'Điểm khác với tiếng Việt: tiếng Việt có 6 thanh, phân biệt cả <b>độ cao</b> lẫn <b>chất giọng</b> (nặng, ngã bị ngắt, hỏi gãy). Tiếng Trung chỉ phân biệt bằng <b>đường đi của độ cao</b>, giọng luôn trơn tru, không ngắt giọng.',
    'Để mô tả, người ta chia giọng nói thành <b>5 mức</b>: 1 = thấp nhất, 5 = cao nhất của giọng bạn. Mỗi thanh là một con số: thanh 1 = 55, thanh 2 = 35, thanh 3 = 214, thanh 4 = 51.',
  ],
  compare: [
    ['Thanh 1 (ˉ)', '55', 'Ngang, nhưng cao hơn nhiều', 'Giữ cao đều, không tụt xuống như thanh ngang khi nói nhanh.'],
    ['Thanh 2 (ˊ)', '35', 'Dấu sắc', 'Bắt đầu từ mức giữa, lên rõ ràng, không dừng nửa chừng.'],
    ['Thanh 3 (ˇ)', '214', 'Dấu hỏi', 'Xuống thấp rồi nhích lên, nhưng liền mạch, không ngắt cổ họng như dấu ngã.'],
    ['Thanh 4 (ˋ)', '51', 'Ngắn gọn như tiếng quát', 'Bắt đầu từ trên cao rồi rơi hẳn xuống. Không giống dấu huyền (thấp, trôi xuống từ từ).'],
  ],
  list: [
    {
      n: 1, name: 'Thanh 1 · 阴平 yīnpíng', shape: '55', color: '#2e7d4f', py: 'mā', gesture: 'Đưa bàn tay ngang tầm trán, kéo thẳng sang phải.',
      how: ['Chọn một nốt cao thoải mái trong giọng bạn (mức 5) và giữ nguyên.', 'Giữ đều từ đầu đến cuối, hơi dài hơn dấu ngang tiếng Việt.', 'Hình dung đang hát một nốt cao đều “aaa…”.'],
      mistakes: ['Giọng tụt dần ở cuối âm tiết, nghe như thanh 4 nhẹ.', 'Đọc quá thấp như thanh ngang thường ngày của tiếng Việt.'],
      words: [['妈', 'mā', 'mẹ'], ['他', 'tā', 'anh ấy'], ['书', 'shū', 'sách'], ['家', 'jiā', 'nhà'], ['天', 'tiān', 'trời, ngày'], ['喝', 'hē', 'uống'], ['说', 'shuō', 'nói'], ['高', 'gāo', 'cao']],
    },
    {
      n: 2, name: 'Thanh 2 · 阳平 yángpíng', shape: '35', color: '#b8860b', py: 'má', gesture: 'Đặt tay ngang ngực, hất chéo lên phía trán.',
      how: ['Bắt đầu ở mức giữa (3), rồi lên cao (5).', 'Giống khi hỏi ngạc nhiên: “Hả?”, “Gì cơ?”.', 'Lên liền một mạch, không dừng giữa chừng.'],
      mistakes: ['Lên quá ít, nghe như thanh 1 thấp.', 'Bắt đầu quá thấp rồi mới lên, thành thanh 3.'],
      words: [['麻', 'má', 'gai, tê'], ['来', 'lái', 'đến'], ['人', 'rén', 'người'], ['学', 'xué', 'học'], ['钱', 'qián', 'tiền'], ['茶', 'chá', 'trà'], ['年', 'nián', 'năm'], ['谁', 'shéi', 'ai']],
    },
    {
      n: 3, name: 'Thanh 3 · 上声 shǎngshēng', shape: '214', color: '#3366aa', py: 'mǎ', gesture: 'Tay vạch chữ V mềm: xuống thấp rồi nhích lên. Có thể gật đầu nhẹ khi đọc.',
      how: ['Bắt đầu thấp vừa (2), hạ xuống thấp nhất (1), rồi nhích lên (4).', 'Đọc chậm và trầm, như đang suy nghĩ “ừm…”.', '<b>Quan trọng:</b> trong câu, thanh 3 đứng trước âm tiết khác chỉ đọc <b>nửa đầu</b> (hạ xuống thấp rồi dừng), gọi là “bán thanh 3” (半三声). Chỉ khi đứng cuối câu hoặc đọc riêng mới đọc đủ cả đường.'],
      mistakes: ['Chỉ đi lên, thành thanh 2.', 'Ngắt cổ họng như dấu ngã tiếng Việt.', 'Nhích lên quá cao ở cuối.'],
      words: [['马', 'mǎ', 'ngựa'], ['你', 'nǐ', 'bạn'], ['我', 'wǒ', 'tôi'], ['好', 'hǎo', 'tốt'], ['水', 'shuǐ', 'nước'], ['九', 'jiǔ', 'chín'], ['五', 'wǔ', 'năm (số 5)'], ['请', 'qǐng', 'mời, xin']],
    },
    {
      n: 4, name: 'Thanh 4 · 去声 qùshēng', shape: '51', color: '#c0392b', py: 'mà', gesture: 'Tay chặt dứt khoát từ trên xuống dưới.',
      how: ['Bắt đầu thật cao (5), rồi rơi nhanh xuống thấp nhất (1).', 'Ngắn và mạnh như quát “Đi!” hoặc nói “Không!”.', 'Phải xuất phát từ trên cao, nếu mở đầu thấp sẽ mất thanh.'],
      mistakes: ['Bắt đầu chưa đủ cao, nghe như dấu huyền thấp.', 'Rơi chậm và kéo dài, nghe như thanh 3.'],
      words: [['骂', 'mà', 'mắng'], ['是', 'shì', 'là'], ['不', 'bù', 'không'], ['大', 'dà', 'to'], ['四', 'sì', 'bốn (số 4)'], ['看', 'kàn', 'xem'], ['去', 'qù', 'đi'], ['爸', 'bà', 'bố']],
    },
  ],
  neutral: {
    desc: 'Thanh nhẹ (轻声) không có dấu, đọc <b>ngắn và nhẹ</b>. Độ cao phụ thuộc vào thanh của âm tiết đứng trước nó.',
    rows: [['Sau thanh 1', 'māma', '妈妈', 'mẹ', 'Thấp hơn một chút (≈ 2)'], ['Sau thanh 2', 'péngyou', '朋友', 'bạn bè', 'Ở mức giữa (≈ 3)'], ['Sau thanh 3', 'nǐmen', '你们', 'các bạn', 'Khá cao (≈ 4)'], ['Sau thanh 4', 'bàba', '爸爸', 'bố', 'Thấp (≈ 1)']],
    words: [['吗', 'ma', 'từ nghi vấn'], ['的', 'de', 'của'], ['呢', 'ne', 'còn…thì sao?'], ['们', 'men', 'hậu tố số nhiều'], ['谢谢', 'xièxie', 'cảm ơn']],
  },
  pairs: [
    [['买', 'mǎi', 'mua'], ['卖', 'mài', 'bán']],
    [['水', 'shuǐ', 'nước'], ['睡', 'shuì', 'ngủ']],
    [['是', 'shì', 'là'], ['十', 'shí', 'mười']],
    [['四', 'sì', 'bốn'], ['死', 'sǐ', 'chết']],
    [['起', 'qǐ', 'dậy'], ['气', 'qì', 'khí, giận']],
    [['大', 'dà', 'to'], ['打', 'dǎ', 'đánh']],
    [['睡觉', 'shuìjiào', 'đi ngủ'], ['水饺', 'shuǐjiǎo', 'bánh chẻo']],
    [['问', 'wèn', 'hỏi'], ['文', 'wén', 'văn']],
  ],
  sandhi: [
    { t: 'Hai thanh 3 đi liền: thanh 3 đầu đọc thành thanh 2', rule: 'Viết vẫn giữ dấu thanh 3, nhưng khi đọc: 3 + 3 → 2 + 3.', ex: [['你好', 'nǐ hǎo', 'ní hǎo', 'xin chào'], ['水果', 'shuǐguǒ', 'shuíguǒ', 'trái cây'], ['很好', 'hěn hǎo', 'hén hǎo', 'rất tốt']] },
    { t: '不 (bù): trước thanh 4 đọc thành bú', rule: '不 vốn là thanh 4. Đứng trước một âm tiết thanh 4 thì đọc thanh 2. Trước thanh 1, 2, 3 vẫn đọc bù.', ex: [['不是', 'bù shì', 'bú shì', 'không phải'], ['不去', 'bù qù', 'bú qù', 'không đi'], ['不好', 'bù hǎo', 'bù hǎo', 'không tốt (giữ nguyên)']] },
    { t: '一 (yī): đổi thanh theo âm tiết sau', rule: 'Đọc riêng, đếm số, hoặc ở cuối: yī. Trước thanh 4: yí. Trước thanh 1, 2, 3: yì.', ex: [['一个', 'yī ge', 'yí ge', 'một cái (trước thanh 4 / thanh nhẹ: yí)'], ['一天', 'yī tiān', 'yì tiān', 'một ngày'], ['一起', 'yī qǐ', 'yì qǐ', 'cùng nhau']] },
  ],
  marks: [
    ['xiang', 3], ['hao', 3], ['liu', 2], ['gui', 4], ['xie', 4], ['duo', 1], ['lüe', 4], ['hui', 4], ['qiu', 2], ['zhong', 1], ['lao', 3], ['tuo', 2], ['nei', 3], ['jiu', 3], ['shui', 3],
  ],
  markRule: 'Thứ tự ưu tiên đặt dấu: <b>a</b> &gt; <b>o, e</b> &gt; <b>i, u, ü</b>. Riêng <b>iu</b> và <b>ui</b>: đặt dấu ở chữ cái đứng sau (liú, guì).',
  tips: [
    'Mỗi ngày dành <b>5 phút chỉ tập thanh điệu</b> trước khi học từ: đọc các cặp mā má mǎ mà và bā bá bǎ bà thành tiếng.',
    '<b>Ghi âm giọng mình</b> rồi so với giọng mẫu. Tai ta nghe giọng người khác tốt hơn tự nghe chính mình.',
    '<b>Phóng đại</b> khi mới tập: lên cao hơn, xuống thấp hơn thường lệ. Sau đó sẽ tự thu về mức tự nhiên.',
    'Học thanh điệu <b>cùng với từ</b>, đừng học rời. Hãy nhớ “老师 lǎoshī” là một nhịp 3-1, không phải hai âm riêng lẻ.',
    'Dùng bàn tay vạch hình đường cao độ khi nói. Cơ thể ghi nhớ đường đi của giọng rất tốt.',
  ],
};

/* Bài giảng video thanh điệu (dùng chung trình phát với 15 bài) */
window.TONES.slides = function () {
  const T = window.TONES, S = [];
  const bd = (c, py) => window.toneCurve(py, c);
  S.push({
    label: 'Mở đầu',
    board: `<div class="lb-big kai" data-k="0">声调</div><div class="lb-py" data-k="0">shēngdiào</div><div class="lb-vi" data-k="1">Thanh điệu tiếng Trung</div>
      <div class="lb-goal" data-k="2">🎯 4 thanh + thanh nhẹ, cặp dễ nhầm, biến điệu</div>`,
    steps: [
      { lang: 'vi', text: 'Xin chào các bạn! Hôm nay chúng ta học bài quan trọng nhất của người mới bắt đầu: thanh điệu.' },
      { lang: 'zh', text: '声调', rate: 0.7, k: 0, sub: '声调  shēngdiào' },
      { lang: 'vi', text: 'Nghĩa là thanh điệu.', k: 1 },
      { lang: 'vi', text: 'Tiếng Trung có bốn thanh điệu và một thanh nhẹ. Đổi thanh là đổi nghĩa, nên chúng ta phải luyện thật kỹ.', k: 2 },
    ],
  });
  S.push({
    label: 'Bốn thanh qua chữ “ma”',
    board: `<div class="lb-tag">SO SÁNH</div><div class="lb-grid">${T.list.map((t, i) => `<div class="lb-cell" data-k="${i}" style="text-align:center">${bd(t.color, t.shape)}<span class="kai">${t.words[0][0]}</span><small>${t.py}</small><small>${t.words[0][2]}</small></div>`).join('')}</div>`,
    steps: [
      { lang: 'vi', text: 'Hãy nghe cùng một âm “ma” với bốn thanh khác nhau.' },
      ...T.list.map((t, i) => ({ lang: 'zh', text: t.words[0][0], rate: 0.6, k: i, sub: `${t.words[0][0]}  ${t.py}  ·  ${t.words[0][2]}` })),
      { lang: 'vi', text: 'Mẹ, gai, ngựa, mắng. Bốn nghĩa khác nhau hoàn toàn, chỉ vì thanh điệu.' },
    ],
  });
  T.list.forEach((t, i) => {
    S.push({
      label: `Thanh ${t.n}`,
      board: `<div class="lb-tag">THANH ${t.n}</div><div class="lb-strokes" data-k="0">${bd(t.color, t.shape).replace('class="tcurve"', 'class="tcurve" style="width:200px"')}</div>
        <div class="lb-vi" data-k="0">Mức cao độ: ${t.shape.split('').join(' → ')}</div>
        <ul class="lb-list" data-k="1">${t.how.map(h => `<li>${h}</li>`).join('')}</ul>
        <div class="lb-body" data-k="2"><b>Lỗi hay gặp:</b><br>${t.mistakes.map(m => '• ' + m).join('<br>')}</div>
        <div class="lb-grid" data-k="3" style="margin-top:8px">${t.words.slice(0, 4).map(w => `<div class="lb-cell"><span class="kai">${w[0]}</span><small>${w[1]}</small><small>${w[2]}</small></div>`).join('')}</div>`,
      steps: [
        { lang: 'vi', text: `Thanh số ${t.n}.`, k: 0 },
        { lang: 'zh', text: t.words[0][0], rate: 0.6, k: 0, sub: `${t.words[0][0]}  ${t.py}` },
        ...t.how.map(h => ({ lang: 'vi', text: h.replace(/<[^>]*>/g, '').replace(/“|”/g, ''), k: 1 })),
        { lang: 'vi', text: 'Lỗi hay gặp là:', k: 2 },
        ...t.mistakes.map(m => ({ lang: 'vi', text: m, k: 2 })),
        { lang: 'vi', text: 'Mẹo luyện tập: ' + t.gesture, k: 1 },
        { lang: 'vi', text: 'Bây giờ cô đọc vài từ mẫu, các bạn đọc theo nhé.', k: 3 },
        ...t.words.slice(0, 4).flatMap(w => [{ lang: 'zh', text: w[0], rate: 0.6, k: 3, sub: `${w[0]}  ${w[1]}  ·  ${w[2]}` }, { wait: 1200 }]),
      ],
    });
  });
  S.push({
    label: 'Thanh nhẹ',
    board: `<div class="lb-tag">THANH NHẸ</div><div class="lb-body" data-k="0">${T.neutral.desc}</div>
      <div class="lb-grid" data-k="1">${T.neutral.rows.map(r => `<div class="lb-cell"><span class="kai">${r[2]}</span><small>${r[1]}</small><small>${r[3]}</small><small>${r[4]}</small></div>`).join('')}</div>`,
    steps: [
      { lang: 'vi', text: 'Tiếp theo là thanh nhẹ. Thanh nhẹ đọc ngắn và nhẹ, không có dấu.', k: 0 },
      ...T.neutral.rows.map(r => ({ lang: 'zh', text: r[2], rate: 0.7, k: 1, sub: `${r[2]}  ${r[1]}  ·  ${r[3]}` })),
      { lang: 'vi', text: 'Chú ý: âm tiết sau là thanh nhẹ, chỉ đọc lướt.', k: 1 },
    ],
  });
  S.push({
    label: 'Biến điệu',
    board: `<div class="lb-tag">BIẾN ĐIỆU</div>${T.sandhi.map((s, i) => `<div class="lb-body" data-k="${i}"><b>${s.t}</b><br>${s.rule}<br>${s.ex.map(e => `<span class="kai" style="font-size:1.3rem">${e[0]}</span> ${e[1]} → <b>${e[2]}</b>`).join('<br>')}</div>`).join('')}`,
    steps: [
      { lang: 'vi', text: 'Cuối cùng là biến điệu: trong lời nói, một số thanh đổi khác với dấu viết.' },
      { lang: 'vi', text: 'Một: hai thanh ba đi liền nhau, thanh ba đầu đọc thành thanh hai.', k: 0 },
      ...T.sandhi[0].ex.flatMap(e => [{ lang: 'zh', text: e[0], rate: 0.7, k: 0, sub: `${e[0]}  ${e[1]} → ${e[2]}` }, { wait: 600 }]),
      { lang: 'vi', text: 'Hai: chữ 不 đứng trước thanh bốn thì đọc thành thanh hai.', k: 1 },
      ...T.sandhi[1].ex.flatMap(e => [{ lang: 'zh', text: e[0], rate: 0.7, k: 1, sub: `${e[0]}  ${e[1]} → ${e[2]}` }, { wait: 600 }]),
      { lang: 'vi', text: 'Ba: chữ 一 đổi thanh theo âm tiết đứng sau.', k: 2 },
      ...T.sandhi[2].ex.flatMap(e => [{ lang: 'zh', text: e[0], rate: 0.7, k: 2, sub: `${e[0]}  ${e[1]} → ${e[2]}` }, { wait: 600 }]),
    ],
  });
  S.push({
    label: 'Tổng kết',
    board: `<div class="lb-tag">TỔNG KẾT</div><ul class="lb-list" data-k="0">${T.tips.map(t => `<li>${t}</li>`).join('')}</ul>
      <p class="lb-actions" data-k="1"><a class="btn primary" href="#/tones/drill">Luyện tập thanh điệu →</a></p>`,
    steps: [
      { lang: 'vi', text: 'Vậy là chúng ta đã học xong thanh điệu. Hãy nhớ vài mẹo luyện tập.', k: 0 },
      ...T.tips.map(t => ({ lang: 'vi', text: t.replace(/<[^>]*>/g, '').replace(/[“”]/g, ''), k: 0 })),
      { lang: 'vi', text: 'Bây giờ hãy sang phần luyện tập nhé. Cảm ơn các bạn!', k: 1 },
    ],
  });
  return S;
};

/* ===== Mẹo học theo từng phần ===== */
window.TIPS = {
  home: [
    'Mỗi ngày chia <b>10 phút nghe, 10 phút từ vựng, 10 phút viết</b>. Học đều từng ngày hiệu quả hơn dồn cuối tuần.',
    'Làm theo thứ tự: <b>Pinyin → Thanh điệu → Nét và bộ thủ → Bài học</b>. Nền phát âm vững sẽ giúp mọi bài sau dễ hơn rất nhiều.',
  ],
  initials: [
    'Thử với <b>tờ giấy mỏng</b> trước miệng: p, t, k, q, ch, c làm giấy bay (bật hơi); b, d, g, j, zh, z thì giấy gần như không động.',
    'Học theo <b>bộ ba dễ lẫn</b>: j-q-x (lưỡi phẳng, môi dẹt), zh-ch-sh-r (uốn lưỡi), z-c-s (đầu lưỡi chạm răng). Nghe cả bộ rồi so sánh với nhau.',
    'Đừng đọc pinyin như chữ quốc ngữ: <b>q</b> không đọc là “q” hay “kờ”, <b>x</b> không phải “x” của tiếng Việt, <b>zh</b> không đọc là “gi”. Hãy luôn nghe mẫu rồi nhại lại.',
  ],
  finals: [
    '<b>ü</b>: phát âm “i” rồi giữ nguyên lưỡi, chu tròn môi lại. Sau j, q, x, y viết là <b>u</b> nhưng vẫn đọc ü (ju = jü, xue = xüe).',
    '<b>-n</b> và <b>-ng</b>: -n đầu lưỡi chạm lợi trên (an, en, in), -ng cuống lưỡi chạm vòm mềm (ang, eng, ing). Cặp en–eng và in–ing hay bị lẫn, hãy nghe nhiều.',
    '<b>iu, ui, un</b> là dạng rút gọn khi có phụ âm đầu (liu = liou, gui = guei, lun = luen). Vẫn đọc đủ âm giữa nhẹ.',
    'Gặp vận mẫu khó, hãy đọc <b>chậm và kéo dài</b> từng thành phần (u – ɑ – n) rồi mới ghép nhanh lại.',
  ],
  tonesLink: [
    'Phần này chỉ là phần tóm tắt. Muốn học kỹ hơn, hãy vào <a href="#/tones"><b>Bài thanh điệu</b></a>: có đường cao độ, lỗi hay gặp của người Việt, cặp dễ nhầm, biến điệu, luyện tập và video giảng.',
  ],
  rules: [
    'Thuộc lòng thứ tự đặt dấu: <b>a &gt; o, e &gt; i, u, ü</b>; riêng iu, ui thì đặt dấu vào chữ sau. Làm bài luyện đặt dấu ở <a href="#/tones/drill">Luyện tập thanh điệu</a>.',
    'Biến điệu chỉ xảy ra khi <b>nói</b>. Sách vẫn viết dấu gốc (nǐ hǎo) nhưng bạn đọc ní hǎo. Khi tự học, hãy nghe mẫu để thấy rõ.',
  ],
  strokes: [
    'Hãy tập đúng <b>thứ tự nét ngay từ đầu</b>. Sửa thói quen viết sai về sau rất khó.',
    'Tập vẽ từng nét trên <b>giấy ô vuông (田字格)</b>; chữ Hán đẹp là chữ cân đối trong ô vuông.',
    'Dùng nút <b>Từng nét</b> để xem, sau đó bấm <b>Nét mờ</b> để tắt gợi ý và viết lại từ trí nhớ.',
  ],
  rules_write: [
    'Nhớ gọn: <b>trên trước dưới, trái trước phải, ngang trước sổ, phẩy trước mác, ngoài trước trong, vào nhà rồi mới đóng cửa</b> (国: viết khung, viết bên trong, rồi đóng nét cuối).',
    'Nếu không chắc, hãy mở hoạt hình nét của chữ đó rồi viết theo. Xem 3 lần là nhớ.',
  ],
  structure: [
    'Gặp chữ mới, hãy <b>tách thành mảnh</b>: bộ thủ (gợi nghĩa) + phần âm (gợi cách đọc). Ví dụ 妈 = 女 (nữ) + 马 (mǎ, ngựa, gợi âm mā).',
    'Hơn 80% chữ Hán là chữ hình thanh, nên biết 30 bộ thủ phổ biến là đã đọc đoán được rất nhiều chữ.',
  ],
  radicals: [
    'Học <b>5 bộ mỗi ngày</b>, theo nhóm nghĩa (nước, lửa, người, tay…), mỗi bộ gắn với 1 chữ quen thuộc: 氵→ 河 (sông), 亻→ 你.',
    'Vị trí hay gặp: <b>亻 氵 扌 讠</b> bên trái; <b>艹 竹</b> ở trên; <b>辶 廴</b> ở dưới-trái; <b>刂</b> bên phải.',
    'Khi gặp chữ lạ, thử tìm bộ thủ trước để đoán lĩnh vực nghĩa (có 氵 thường liên quan đến nước).',
  ],
  dialogue: [
    '<b>Nghe – nhại (shadowing):</b> nghe một câu, bấm dừng và đọc ngay theo, lặp 3 lần. Lần 2 che pinyin, lần 3 che cả tiếng Việt.',
    'Tự đóng <b>cả hai vai A và B</b>, hoặc học cùng bạn. Nói to, đừng chỉ đọc thầm.',
  ],
  vocab: [
    'Mỗi lần học <b>5–8 từ</b>, rồi ôn lại sau 1 ngày, 3 ngày, 1 tuần. Trang đã có lịch ôn ngắt quãng ở phần Ôn từ vựng.',
    'Học từ <b>trong câu</b> chứ không học rời: mỗi từ mới hãy tự đặt 1 câu ngắn.',
    'Âm Hán Việt giúp nhớ chữ (老师 = lão sư) nhưng nghĩa đôi khi khác, ví dụ 爱人 là “vợ/chồng”, không phải “người yêu”.',
  ],
  grammar: [
    'Học ngữ pháp bằng <b>mẫu câu</b>: thuộc 1 câu mẫu chuẩn, rồi thay từ để tạo câu mới.',
    'Thứ tự cơ bản: <b>Chủ ngữ + Thời gian + Nơi chốn + Động từ + Tân ngữ</b> (我 明天 在家 看书).',
  ],
  practice: [
    'Câu làm sai là câu có ích nhất. Làm lại bài đến khi đạt <b>80% trở lên</b> rồi mới sang bài sau.',
    'Với câu nghe: bấm <b>🔊 Nghe</b> thêm vài lần và nhại lại trước khi chọn đáp án.',
  ],
  review: [
    'Mỗi phiên chỉ nên <b>15–20 thẻ</b>. Ôn ngắn mỗi ngày tốt hơn ôn dồn một lần.',
    'Khi lật thẻ, <b>đọc to</b> từ đó và vẽ chữ lên không trung hoặc ra giấy.',
    'Bấm “Chưa nhớ” thật thà: thẻ sẽ quay lại sớm, đó chính là cách ôn hiệu quả.',
  ],
  write: [
    'Viết chậm, đúng thứ tự. Sai 2 lần là có gợi ý; sau khi thuộc, bấm <b>Nét mờ</b> để tắt khung mờ và viết từ trí nhớ.',
    'Mỗi chữ viết <b>3 lần liên tiếp</b>: lần 1 có gợi ý, lần 2 tắt gợi ý, lần 3 vừa viết vừa đọc to.',
  ],
  listen: [
    'Bấm <b>Chậm</b> trước, rồi nghe lại ở tốc độ thường. Tập gõ <b>số thanh</b> (ni3 hao3) để tai quen với thanh điệu.',
    'Nghe 2 lần mà vẫn không chắc? Hãy đoán âm trước, thanh sau; làm sai cũng giúp bạn nhớ.',
  ],
  dict: [
    'Gõ <b>pinyin không dấu</b> (ni hao) hoặc <b>tiếng Việt</b> (cảm ơn) đều tìm được. Bôi đen chữ Hán ở bất kỳ trang nào để nghe và xem nghĩa.',
  ],
  lesson: {
    1: ['<b>您</b> là cách nói kính trọng với người lớn tuổi hoặc cấp trên; với bạn bè dùng <b>你</b>.', '你好 viết nǐ hǎo nhưng đọc <b>ní hǎo</b> (hai thanh 3 đi liền, thanh đầu thành thanh 2).'],
    2: ['<b>吗</b> đặt cuối câu để biến câu trần thuật thành câu hỏi có/không; không cần đổi trật tự từ.', '我很好: <b>很</b> ở đây chỉ làm cầu nối trước tính từ, không nhất thiết nghĩa là “rất”.'],
    3: ['Từ để hỏi đứng <b>đúng chỗ của thông tin cần hỏi</b>: 你叫什么名字? → 我叫明。', 'Tên người Trung Quốc: <b>họ trước, tên sau</b> (王 小明: họ Vương, tên Tiểu Minh).'],
    4: ['<b>的</b> giống “của”, nhưng thường bỏ với quan hệ thân thiết: 我妈妈, 我们学校.', '<b>都</b> đứng <b>trước động từ</b>, không đứng cuối câu như “cả” trong tiếng Việt.'],
    5: ['Đếm bình thường dùng <b>二</b>, nhưng trước lượng từ dùng <b>两</b>: 两个人.', 'Số + lượng từ + danh từ là bắt buộc: <b>三个人</b>, không nói 三人 trong khẩu ngữ thường ngày.', '11–19 = 十 + số; 20–99 = số + 十 + số.'],
    6: ['<b>会</b> = biết (do học mà có): 我会说汉语. Để nói “có thể (được phép)” dùng <b>能</b> ở bài 10.', '<b>一点儿</b> đứng sau động từ/tính từ: 说慢一点儿 (nói chậm một chút).'],
    7: ['Ngày tháng theo thứ tự <b>lớn đến nhỏ</b>: năm → tháng → ngày → thứ.', '<b>没</b> phủ định 有 và quá khứ; <b>不</b> phủ định hiện tại/tương lai/thói quen.', '号 dùng khi nói, 日 dùng khi viết trang trọng.'],
    8: ['<b>想</b> + động từ = muốn làm gì: 我想喝茶. Hỏi: 你想喝什么?', '<b>和</b> chỉ nối danh từ, không dùng để nối hai động từ hay hai câu.'],
    9: ['<b>在 + nơi chốn + động từ</b>: nơi chốn đứng <b>trước</b> động từ (在北京工作).', '<b>请问</b> mở đầu lịch sự khi hỏi người lạ.'],
    10: ['Phân biệt: <b>会</b> (biết, kỹ năng), <b>能</b> (có thể, điều kiện cho phép), <b>想</b> (muốn).', 'Xin phép lịch sự: <b>我能……吗?</b>'],
    11: ['Giờ: số + <b>点</b>; 2 giờ nói <b>两点</b>, không nói 二点.', 'Thời gian đứng <b>trước động từ</b>: 我八点起床.'],
    12: ['<b>太……了</b> diễn tả “quá…” và thường mang cảm xúc: 太好了! 太贵了!', 'Tính từ làm vị ngữ thường có <b>很</b> đứng trước: 今天很热.'],
    13: ['<b>在 + động từ (+ 呢)</b> = đang làm gì: 他在看书呢.', 'Động từ nối tiếp xếp theo <b>thứ tự xảy ra</b>: 去商店买东西 (đi cửa hàng mua đồ).'],
    14: ['<b>了</b> sau động từ báo hành động <b>đã hoàn thành</b>, không phải thì quá khứ bắt buộc.', 'Phủ định dùng <b>没(有)</b> và bỏ 了: 我没买衣服.'],
    15: ['<b>是……的</b> nhấn mạnh thời gian/nơi chốn/phương tiện của việc <b>đã xảy ra</b>: 我是坐飞机来的.', '<b>坐</b> dùng với phương tiện ngồi bên trong (xe, tàu, máy bay); <b>骑</b> dùng với xe đạp, xe máy.'],
  },
};
