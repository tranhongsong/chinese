/* Dữ liệu phát âm: thanh mẫu, vận mẫu, thanh điệu, biến điệu */
window.PINYIN = {
  initials: [
    { group: 'Âm môi (双唇音 / 唇齿音)', items: [
      { l: 'b', ex: '八', py: 'bā', vi: 'tám', tip: 'Môi khép lại rồi mở, KHÔNG bật hơi. Gần "p" trong "pa" của tiếng Việt.' },
      { l: 'p', ex: '怕', py: 'pà', vi: 'sợ', tip: 'Giống b nhưng BẬT HƠI mạnh. Đặt tờ giấy trước miệng, đọc p thì giấy bay.' },
      { l: 'm', ex: '妈', py: 'mā', vi: 'mẹ', tip: 'Giống "m" trong "ma".' },
      { l: 'f', ex: '发', py: 'fā', vi: 'phát', tip: 'Răng trên chạm môi dưới, giống "ph" trong "phở".' },
    ]},
    { group: 'Âm đầu lưỡi (舌尖中音)', items: [
      { l: 'd', ex: '大', py: 'dà', vi: 'to', tip: 'Đầu lưỡi chạm lợi trên, KHÔNG bật hơi. Gần "t" trong "ta".' },
      { l: 't', ex: '他', py: 'tā', vi: 'anh ấy', tip: 'Giống d nhưng BẬT HƠI. Gần "th" trong "thơ" nhưng bật mạnh hơn.' },
      { l: 'n', ex: '那', py: 'nà', vi: 'kia', tip: 'Giống "n" trong "na".' },
      { l: 'l', ex: '拉', py: 'lā', vi: 'kéo', tip: 'Giống "l" trong "la".' },
    ]},
    { group: 'Âm gốc lưỡi (舌根音)', items: [
      { l: 'g', ex: '哥', py: 'gē', vi: 'anh trai', tip: 'Gốc lưỡi chạm vòm mềm, KHÔNG bật hơi. Gần "c/k" trong "cô".' },
      { l: 'k', ex: '可', py: 'kě', vi: 'có thể', tip: 'Giống g nhưng BẬT HƠI mạnh, như "k" trong "king" tiếng Anh.' },
      { l: 'h', ex: '喝', py: 'hē', vi: 'uống', tip: 'Ma sát ở cuống họng, nặng hơn "h" tiếng Việt, gần "kh".' },
    ]},
    { group: 'Âm mặt lưỡi (舌面音)', items: [
      { l: 'j', ex: '鸡', py: 'jī', vi: 'gà', tip: 'Mặt lưỡi áp vòm cứng, môi bành ra, KHÔNG bật hơi. Gần "chi" nhẹ.' },
      { l: 'q', ex: '七', py: 'qī', vi: 'bảy', tip: 'Giống j nhưng BẬT HƠI mạnh. Gần "chi" bật hơi.' },
      { l: 'x', ex: '西', py: 'xī', vi: 'tây', tip: 'Mặt lưỡi gần vòm cứng, ma sát nhẹ. Gần "xi" tiếng Việt, môi bành ra.' },
    ]},
    { group: 'Âm uốn lưỡi (翘舌音)', items: [
      { l: 'zh', ex: '知', py: 'zhī', vi: 'biết', tip: 'Cuộn đầu lưỡi lên chạm vòm cứng, KHÔNG bật hơi. Gần "tr" trong "tri".' },
      { l: 'ch', ex: '吃', py: 'chī', vi: 'ăn', tip: 'Giống zh nhưng BẬT HƠI mạnh.' },
      { l: 'sh', ex: '十', py: 'shí', vi: 'mười', tip: 'Đầu lưỡi cuộn lên, ma sát. Gần "s" cong lưỡi (miền Nam: "sa").' },
      { l: 'r', ex: '日', py: 'rì', vi: 'ngày', tip: 'Tư thế lưỡi như sh nhưng có rung dây thanh. Gần "r" giọng miền Nam, không rung lưỡi.' },
    ]},
    { group: 'Âm đầu lưỡi trước (舌尖前音)', items: [
      { l: 'z', ex: '字', py: 'zì', vi: 'chữ', tip: 'Đầu lưỡi áp mặt sau răng cửa, KHÔNG bật hơi. Như "ts" trong "cats".' },
      { l: 'c', ex: '次', py: 'cì', vi: 'lần', tip: 'Giống z nhưng BẬT HƠI mạnh.' },
      { l: 's', ex: '四', py: 'sì', vi: 'bốn', tip: 'Đầu lưỡi gần răng cửa, ma sát nhẹ. Gần "x/s" trong "xa".' },
    ]},
  ],
  initialsNote: 'Mẹo: 6 cặp phụ âm "không bật hơi / bật hơi" là điểm khó nhất với người Việt: b–p, d–t, g–k, j–q, zh–ch, z–c. Hãy nghe và nhại lại thật chậm.',

  finals: [
    { group: 'Vận mẫu đơn (单韵母)', items: [
      { l: 'a', ex: '啊', py: 'ā', vi: 'a (thán từ)', tip: 'Há miệng to, như "a" trong "ba".' },
      { l: 'o', ex: '喔', py: 'ō', vi: 'ồ', tip: 'Tròn môi, như "ô" trong "cô".' },
      { l: 'e', ex: '鹅', py: 'é', vi: 'ngỗng', tip: 'Miệng hơi mở, lưỡi lùi, giữa "ơ" và "ưa". Không phải "e" tiếng Việt.' },
      { l: 'i', ex: '一', py: 'yī', vi: 'một', tip: 'Như "i" trong "đi". (Đứng một mình viết là yi.)' },
      { l: 'u', ex: '五', py: 'wǔ', vi: 'năm', tip: 'Tròn môi nhỏ, như "u" trong "tu". (Đứng một mình viết là wu.)' },
      { l: 'ü', ex: '鱼', py: 'yú', vi: 'cá', tip: 'Đọc "i" nhưng tròn môi lại. Như "uy" kéo dài hơn một nguyên âm. (Đứng một mình viết là yu.)' },
    ]},
    { group: 'Vận mẫu kép (复韵母)', items: [
      { l: 'ai', ex: '爱', py: 'ài', vi: 'yêu', tip: 'Như "ai" trong "tai".' },
      { l: 'ei', ex: '黑', py: 'hēi', vi: 'đen', tip: 'Như "ây" trong "tây" nhưng "e" rõ hơn.' },
      { l: 'ao', ex: '好', py: 'hǎo', vi: 'tốt', tip: 'Như "ao" trong "cao".' },
      { l: 'ou', ex: '手', py: 'shǒu', vi: 'tay', tip: 'Như "âu" trong "câu".' },
    ]},
    { group: 'Vận mẫu mũi (鼻韵母)', items: [
      { l: 'an', ex: '山', py: 'shān', vi: 'núi', tip: 'Như "an" trong "ban".' },
      { l: 'en', ex: '人', py: 'rén', vi: 'người', tip: 'Như "ân/ơn" trong "ân".' },
      { l: 'ang', ex: '张', py: 'zhāng', vi: 'họ Trương', tip: 'Như "ang" trong "bang".' },
      { l: 'eng', ex: '灯', py: 'dēng', vi: 'đèn', tip: 'Như "âng" trong "tâng".' },
      { l: 'ong', ex: '中', py: 'zhōng', vi: 'giữa', tip: 'Như "ung" trong "chung" (ô-ng).' },
      { l: 'er', ex: '二', py: 'èr', vi: 'hai', tip: 'Cuộn đầu lưỡi lên khi đọc "ơ". Âm uốn lưỡi (儿化).' },
    ]},
    { group: 'Vận mẫu bắt đầu bằng i', items: [
      { l: 'ia', ex: '家', py: 'jiā', vi: 'nhà', tip: 'i + a, như "gia".' },
      { l: 'ie', ex: '姐', py: 'jiě', vi: 'chị gái', tip: 'i + ê, như "diê".' },
      { l: 'iao', ex: '小', py: 'xiǎo', vi: 'nhỏ', tip: 'i + ao, như "tiểu".' },
      { l: 'iu', ex: '六', py: 'liù', vi: 'sáu', tip: 'Viết tắt của iou. Đọc "i-ô-u".' },
      { l: 'ian', ex: '天', py: 'tiān', vi: 'trời', tip: 'i + an, đọc "i-ên".' },
      { l: 'in', ex: '心', py: 'xīn', vi: 'tim', tip: 'Như "in/tân": i + n.' },
      { l: 'iang', ex: '想', py: 'xiǎng', vi: 'nhớ, muốn', tip: 'i + ang, như "tương".' },
      { l: 'ing', ex: '听', py: 'tīng', vi: 'nghe', tip: 'i + ng, như "ting". Mũi sau.' },
      { l: 'iong', ex: '用', py: 'yòng', vi: 'dùng', tip: 'i + ong, như "dung".' },
    ]},
    { group: 'Vận mẫu bắt đầu bằng u', items: [
      { l: 'ua', ex: '花', py: 'huā', vi: 'hoa', tip: 'u + a, như "hoa".' },
      { l: 'uo', ex: '我', py: 'wǒ', vi: 'tôi', tip: 'u + o, như "ua" trong "ngoa".' },
      { l: 'uai', ex: '快', py: 'kuài', vi: 'nhanh', tip: 'u + ai, như "khoái".' },
      { l: 'ui', ex: '水', py: 'shuǐ', vi: 'nước', tip: 'Viết tắt của uei. Đọc "u-ây", như "thuỷ".' },
      { l: 'uan', ex: '船', py: 'chuán', vi: 'thuyền', tip: 'u + an, như "xuyên".' },
      { l: 'un', ex: '春', py: 'chūn', vi: 'mùa xuân', tip: 'Viết tắt của uen. Đọc "u-ân", như "xuân".' },
      { l: 'uang', ex: '床', py: 'chuáng', vi: 'giường', tip: 'u + ang, như "xoang".' },
      { l: 'ueng', ex: '翁', py: 'wēng', vi: 'ông già', tip: 'Chỉ đứng một mình (weng). Đọc "u-âng".' },
    ]},
    { group: 'Vận mẫu bắt đầu bằng ü', items: [
      { l: 'üe', ex: '月', py: 'yuè', vi: 'tháng', tip: 'ü + ê, như "duê". Sau j q x viết là ue.' },
      { l: 'üan', ex: '远', py: 'yuǎn', vi: 'xa', tip: 'ü + an. Sau j q x viết là uan.' },
      { l: 'ün', ex: '云', py: 'yún', vi: 'mây', tip: 'ü + n. Sau j q x viết là un.' },
    ]},
  ],
  finalsNotes: [
    '<b>y, w</b> dùng khi vận mẫu đứng một mình: i→yi, u→wu, ü→yu, ia→ya, ie→ye, ua→wa, uo→wo, üe→yue.',
    '<b>ü sau j, q, x</b> bỏ hai chấm: ju, qu, xu (vẫn đọc là ü). Sau n, l thì giữ hai chấm: nǚ, lǜ.',
    '<b>zi, ci, si / zhi, chi, shi, ri</b>: chữ "i" ở đây là âm "ư" kéo dài, không phải "i" thông thường.',
    '<b>iou, uei, uen</b> khi ghép với phụ âm đầu thì viết tắt: iu (liù), ui (shuǐ), un (chūn).',
  ],

  tones: [
    { n: 1, mark: 'ˉ', name: 'Thanh 1 (阴平)', desc: 'Cao và bằng, giữ ngang suốt. Giống thanh ngang cao, như hát nốt cao đều.', ex: '妈', py: 'mā', vi: 'mẹ', shape: '55' },
    { n: 2, mark: 'ˊ', name: 'Thanh 2 (阳平)', desc: 'Đi lên từ trung bình lên cao. Gần dấu sắc, như hỏi "hả?".', ex: '麻', py: 'má', vi: 'gai, tê', shape: '35' },
    { n: 3, mark: 'ˇ', name: 'Thanh 3 (上声)', desc: 'Hạ thấp rồi hơi lên. Gần dấu hỏi nhưng trầm và dài hơn. Khi đứng trước thanh khác thường chỉ đọc nửa đầu (xuống thấp).', ex: '马', py: 'mǎ', vi: 'ngựa', shape: '214' },
    { n: 4, mark: 'ˋ', name: 'Thanh 4 (去声)', desc: 'Rơi nhanh từ cao xuống thấp. Dứt khoát như ra lệnh, gần dấu nặng/huyền mạnh.', ex: '骂', py: 'mà', vi: 'mắng', shape: '51' },
    { n: 0, mark: '·', name: 'Thanh nhẹ (轻声)', desc: 'Ngắn, nhẹ, không có dấu. Độ cao tuỳ thanh điệu của âm tiết trước.', ex: '吗', py: 'ma', vi: 'từ nghi vấn', shape: '' },
  ],
  toneCombos: [
    // [thanh trước, thanh sau, từ, pinyin, nghĩa]
    ['1-1', '今天', 'jīntiān', 'hôm nay'], ['1-2', '中国', 'Zhōngguó', 'Trung Quốc'], ['1-3', '喝水', 'hē shuǐ', 'uống nước'], ['1-4', '高兴', 'gāoxìng', 'vui'],
    ['2-1', '明天', 'míngtiān', 'ngày mai'], ['2-2', '学习', 'xuéxí', 'học tập'], ['2-3', '游泳', 'yóuyǒng', 'bơi'], ['2-4', '学校', 'xuéxiào', 'trường học'],
    ['3-1', '老师', 'lǎoshī', 'giáo viên'], ['3-2', '起床', 'qǐchuáng', 'thức dậy'], ['3-3', '你好', 'nǐ hǎo', 'xin chào'], ['3-4', '米饭', 'mǐfàn', 'cơm'],
    ['4-1', '上班', 'shàngbān', 'đi làm'], ['4-2', '上学', 'shàngxué', 'đi học'], ['4-3', '电脑', 'diànnǎo', 'máy tính'], ['4-4', '再见', 'zàijiàn', 'tạm biệt'],
  ],
  rules: [
    { t: 'Quy tắc đánh dấu thanh', body: 'Dấu thanh đặt trên nguyên âm theo thứ tự ưu tiên: <b>a &gt; o, e &gt; i, u, ü</b>. Nếu i và u đi liền nhau thì đánh dấu lên chữ đứng sau.', ex: [['好', 'hǎo', 'đánh dấu trên a'], ['都', 'dōu', 'đánh dấu trên o'], ['九', 'jiǔ', 'iu: đánh dấu trên u'], ['会', 'huì', 'ui: đánh dấu trên i']] },
    { t: 'Hai thanh 3 đi liền', body: 'Khi hai âm tiết thanh 3 đứng cạnh nhau, âm đầu đọc thành thanh 2. Chữ viết vẫn giữ thanh 3.', ex: [['你好', 'nǐ hǎo', 'đọc: ní hǎo'], ['很好', 'hěn hǎo', 'đọc: hén hǎo'], ['水果', 'shuǐguǒ', 'đọc: shuíguǒ']] },
    { t: 'Biến điệu của 不 (bù)', body: '不 vốn là thanh 4. Trước một âm tiết thanh 4, nó đọc thành thanh 2 (bú).', ex: [['不是', 'bú shì', 'không phải'], ['不客气', 'bú kèqi', 'đừng khách sáo'], ['不好', 'bù hǎo', 'không tốt (giữ nguyên)']] },
    { t: 'Biến điệu của 一 (yī)', body: 'Đứng riêng hoặc cuối câu: yī. Trước thanh 4: <b>yí</b>. Trước thanh 1, 2, 3: <b>yì</b>.', ex: [['一个', 'yí ge', 'một cái'], ['一天', 'yì tiān', 'một ngày'], ['一起', 'yì qǐ', 'cùng nhau']] },
    { t: 'Thanh nhẹ', body: 'Nhiều từ có âm tiết sau đọc nhẹ, không đánh dấu: 谢谢 xièxie, 爸爸 bàba, 朋友 péngyou, 什么 shénme.', ex: [['谢谢', 'xièxie', 'cảm ơn'], ['爸爸', 'bàba', 'bố'], ['什么', 'shénme', 'cái gì']] },
  ],
};
