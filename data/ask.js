/* Trợ lý hỏi đáp offline: hiểu yêu cầu tiếng Việt (có/không dấu) và ghép câu tiếng Trung mức HSK 1–2.
   window.ASKBOT.answer(text) -> { intro, sections:[{title, cards:[{h,p,v}]}], tips:[] } hoặc null nếu không hiểu.
   Thêm tình huống mới: bổ sung một mục vào mảng INTENTS (keys viết thường, không dấu, cách nhau bằng khoảng trắng). */
(function () {
  const norm = s => ' ' + String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9㐀-鿿]+/g, ' ').trim() + ' ';
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* Người được nhắc tới. polite = dùng 您 (nín). you = cách gọi trong tiếng Việt khi nói trực tiếp */
  const PEOPLE = [
    { k: ['ong noi', 'ong'], h: '爷爷', p: 'yéye', v: 'ông nội', you: 'ông', polite: 1, note: 'ông nội (bố của bố)' },
    { k: ['ong ngoai'], h: '外公', p: 'wàigōng', v: 'ông ngoại', you: 'ông', polite: 1, note: 'ông ngoại (bố của mẹ); miền Bắc Trung Quốc cũng hay gọi là 姥爷 lǎoye' },
    { k: ['ba noi', 'ba'], h: '奶奶', p: 'nǎinai', v: 'bà nội', you: 'bà', polite: 1, note: 'bà nội (mẹ của bố)' },
    { k: ['ba ngoai'], h: '外婆', p: 'wàipó', v: 'bà ngoại', you: 'bà', polite: 1, note: 'bà ngoại (mẹ của mẹ); cũng gọi là 姥姥 lǎolao' },
    { k: ['bo', 'cha', 'ba toi', 'bo toi'], h: '爸爸', p: 'bàba', v: 'bố', you: 'bố', polite: 1 },
    { k: ['me', 'ma toi', 'me toi'], h: '妈妈', p: 'māma', v: 'mẹ', you: 'mẹ', polite: 1 },
    { k: ['anh trai', 'anh'], h: '哥哥', p: 'gēge', v: 'anh trai', you: 'anh' },
    { k: ['chi gai', 'chi'], h: '姐姐', p: 'jiějie', v: 'chị gái', you: 'chị' },
    { k: ['em trai'], h: '弟弟', p: 'dìdi', v: 'em trai', you: 'em' },
    { k: ['em gai'], h: '妹妹', p: 'mèimei', v: 'em gái', you: 'em' },
    { k: ['chu'], h: '叔叔', p: 'shūshu', v: 'chú', you: 'chú', polite: 1 },
    { k: ['co', 'di', 'bac gai'], h: '阿姨', p: 'āyí', v: 'cô / dì', you: 'cô', polite: 1 },
    { k: ['thay giao', 'co giao', 'giao vien', 'thay', 'thay co'], h: '老师', p: 'lǎoshī', v: 'thầy / cô giáo', you: 'thầy/cô', polite: 1 },
    { k: ['con trai'], h: '儿子', p: 'érzi', v: 'con trai', you: 'con' },
    { k: ['con gai'], h: '女儿', p: 'nǚ’ér', v: 'con gái', you: 'con' },
    { k: ['chong'], h: '丈夫', p: 'zhàngfu', v: 'chồng', you: 'anh' },
    { k: ['vo'], h: '妻子', p: 'qīzi', v: 'vợ', you: 'em' },
    { k: ['ban be', 'ban toi', 'nguoi ban'], h: '朋友', p: 'péngyou', v: 'bạn bè', you: 'bạn' },
  ];
  /* Từ ngắn dễ nhầm với từ khác khi bỏ dấu (cô/có, chị/chỉ, bà/ba...) thì bắt buộc phải gõ đúng dấu */
  const NEED_ACCENT = { ba: 'bà', co: 'cô', di: 'dì', chu: 'chú', anh: 'anh', chi: 'chị', vo: 'vợ', chong: 'chồng', thay: 'thầy' };
  function findPerson(raw) {
    const low = ' ' + String(raw).toLowerCase().replace(/[^p{L}p{N}]+/g, ' ').trim() + ' ';
    const n = norm(raw);
    let best = null;
    for (const P of PEOPLE) for (const k of P.k) {
      if (!n.includes(' ' + k + ' ')) continue;
      if (NEED_ACCENT[k] && !low.includes(' ' + NEED_ACCENT[k] + ' ')) continue;
      if (!best || k.length > best.k.length) best = { P, k };
    }
    return best ? best.P : null;
  }

  /* ---- Tạo thẻ ---- */
  const C = (h, p, v) => ({ h, p, v });
  const A = P => (P && !P.polite) ? { h: '你', p: 'nǐ', v: P.you } : { h: '您', p: 'nín', v: P ? P.you : 'bạn (lịch sự)' };

  const INTENTS = [
    {
      id: 'health', title: 'hỏi thăm sức khoẻ', keys: ['suc khoe', 'khoe khong', 'co khoe', 'manh khoe', 'khoe manh', 'hoi tham', 'tham hoi', 'khoe', 'than the', 'dao nay the nao'],
      build(P) {
        const a = A(P), has = !!P;
        const voc = has ? P.h + '，' : '', vocp = has ? P.p + ', ' : '', vv = has ? cap(P.you) + ' ơi, ' : '';
        const who = has ? P.you : 'bạn';
        const s = [];
        s.push({ title: has ? `Hỏi thẳng ${P.v} (nói trực tiếp với ${P.you})` : 'Hỏi trực tiếp một người', cards: [
          C(`${voc}${a.h}身体好吗？`, `${vocp}${a.p} shēntǐ hǎo ma?`, `${vv}sức khoẻ của ${has ? P.you : 'bạn'} có tốt không ạ?`),
          C(`${voc}${a.h}最近好吗？`, `${vocp}${a.p} zuìjìn hǎo ma?`, `${vv}dạo này ${has ? P.you : 'bạn'} có khoẻ không ạ?`),
          C(`${voc}${a.h}身体怎么样？`, `${vocp}${a.p} shēntǐ zěnmeyàng?`, `${vv}sức khoẻ của ${has ? P.you : 'bạn'} thế nào ạ?`),
        ] });
        if (has) s.push({ title: `Hỏi người khác về sức khoẻ của ${P.v}`, cards: [
          C(`你${P.h}身体好吗？`, `Nǐ ${P.p} shēntǐ hǎo ma?`, `${cap(P.v)} của bạn sức khoẻ có tốt không?`),
          C(`${P.h}最近好吗？`, `${cap(P.p)} zuìjìn hǎo ma?`, `Dạo này ${P.v} có khoẻ không?`),
          C(`${P.h}身体怎么样？`, `${cap(P.p)} shēntǐ zěnmeyàng?`, `Sức khoẻ của ${P.v} thế nào?`),
        ] });
        s.push({ title: 'Lời chúc kèm theo', cards: [
          C(`祝${a.h}身体健康！`, `Zhù ${a.p} shēntǐ jiànkāng!`, `Chúc ${who} luôn mạnh khoẻ!`),
          C('多保重身体。', 'Duō bǎozhòng shēntǐ.', 'Nhớ giữ gìn sức khoẻ nhé. (bảo trọng)'),
        ] });
        s.push({ title: 'Người ta có thể trả lời', cards: [
          C('我身体很好，谢谢！', 'Wǒ shēntǐ hěn hǎo, xièxie!', 'Tôi khoẻ lắm, cảm ơn!'),
          C('还可以。', 'Hái kěyǐ.', 'Cũng tạm ổn.'),
          C('不太好，有点儿累。', 'Bú tài hǎo, yǒudiǎnr lèi.', 'Không khoẻ lắm, hơi mệt.'),
          C('谢谢你的关心。', 'Xièxie nǐ de guānxīn.', 'Cảm ơn sự quan tâm của bạn.'),
        ] });
        return s;
      },
      tips: ['Với người lớn tuổi (ông bà, bố mẹ, thầy cô) hãy dùng <b>您 nín</b> thay cho 你 nǐ để thể hiện sự kính trọng.', 'Người Trung Quốc thường gọi bằng xưng hô trước rồi mới hỏi: <b>爷爷，您…</b> giống tiếng Việt "Ông ơi, ông…".', '<b>身体 shēntǐ</b> = cơ thể/sức khoẻ; <b>最近 zuìjìn</b> = dạo này.']
    },
    {
      id: 'greet', title: 'chào hỏi', keys: ['xin chao', 'chao hoi', 'loi chao', 'chao buoi', 'hello', 'chao', 'chao ban'],
      build(P) {
        const s = [];
        if (P) s.push({ title: `Chào ${P.v}`, cards: [C(`${P.h}好！`, `${cap(P.p)} hǎo!`, `Chào ${P.v}!`), C(`${P.h}，您好！`.replace('您', A(P).h), `${P.p}, ${A(P).p} hǎo!`, `${cap(P.you)} ơi, con/cháu chào ${P.you} ạ!`)] });
        s.push({ title: 'Các câu chào thông dụng', cards: [
          C('你好！', 'Nǐ hǎo!', 'Xin chào! (thông thường)'), C('您好！', 'Nín hǎo!', 'Xin chào! (lịch sự, với người lớn tuổi)'), C('大家好！', 'Dàjiā hǎo!', 'Chào mọi người!'),
          C('老师好！', 'Lǎoshī hǎo!', 'Em chào thầy/cô ạ!'), C('早上好！', 'Zǎoshang hǎo!', 'Chào buổi sáng!'), C('晚上好！', 'Wǎnshang hǎo!', 'Chào buổi tối!'),
        ] });
        s.push({ title: 'Hỏi thăm và đáp', cards: [C('你好吗？', 'Nǐ hǎo ma?', 'Bạn khoẻ không?'), C('我很好，你呢？', 'Wǒ hěn hǎo, nǐ ne?', 'Tôi rất khoẻ, còn bạn?')] });
        return s;
      }, tips: ['你好 là câu chào mọi lúc; người Trung Quốc ít chào bạn bè thân bằng 你好, họ thường hỏi thẳng "吃饭了吗？".']
    },
    {
      id: 'thanks', title: 'cảm ơn', keys: ['cam on', 'tam on', 'da tai', 'cam tạ', 'cam ta'],
      build(P) { const a = A(P); return [{ title: 'Nói lời cảm ơn', cards: [C('谢谢！', 'Xièxie!', 'Cảm ơn!'), C(`谢谢${a.h}！`, `Xièxie ${a.p}!`, `Cảm ơn ${P ? P.you : 'bạn'}!`), ...(P ? [C(`谢谢${P.h}！`, `Xièxie ${P.p}!`, `Cảm ơn ${P.v}!`)] : []), C('非常感谢！', 'Fēicháng gǎnxiè!', 'Rất cảm ơn!')] }, { title: 'Đáp lại', cards: [C('不客气。', 'Bú kèqi.', 'Không có gì.'), C('不用谢。', 'Búyòng xiè.', 'Đừng khách sáo.')] }]; },
      tips: ['<b>不客气 bú kèqi</b>: chữ 不 đọc thanh 2 vì đứng trước thanh 4 (biến điệu).']
    },
    {
      id: 'sorry', title: 'xin lỗi', keys: ['xin loi', 'lam phien', 'xin phep', 'co loi', 'thu loi'],
      build() { return [{ title: 'Xin lỗi', cards: [C('对不起！', 'Duìbuqǐ!', 'Xin lỗi!'), C('不好意思。', 'Bù hǎoyìsi.', 'Ngại quá / xin lỗi (nhẹ nhàng).'), C('请问……', 'Qǐngwèn…', 'Xin hỏi…')] }, { title: 'Đáp lại', cards: [C('没关系。', 'Méi guānxi.', 'Không sao.')] }]; },
      tips: ['<b>对不起</b> dùng khi mắc lỗi thật; <b>不好意思</b> nhẹ hơn, dùng khi làm phiền hoặc đi nhờ qua.']
    },
    {
      id: 'name', title: 'hỏi và giới thiệu tên', keys: ['ten gi', 'ten la', 'hoi ten', 'ten ban', 'ten toi', 'gioi thieu', 'lam quen', 'ten'],
      build(P) { return [{ title: 'Hỏi tên', cards: [C('你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'Bạn tên là gì?'), C('您贵姓？', 'Nín guì xìng?', 'Xin hỏi quý danh? (rất lịch sự)')] }, { title: 'Giới thiệu bản thân', cards: [C('我叫……', 'Wǒ jiào …', 'Tôi tên là …'), C('我是越南人。', 'Wǒ shì Yuènán rén.', 'Tôi là người Việt Nam.'), C('认识你很高兴。', 'Rènshi nǐ hěn gāoxìng.', 'Rất vui được làm quen với bạn.')] }, ...(P ? [{ title: `Giới thiệu ${P.v}`, cards: [C(`这是我${P.h}。`, `Zhè shì wǒ ${P.p}.`, `Đây là ${P.v} của tôi.`)] }] : [])]; }
    },
    {
      id: 'age', title: 'hỏi tuổi', keys: ['bao nhieu tuoi', 'may tuoi', 'tuoi', 'nam nay bao nhieu'],
      build(P) { const a = A(P); return [{ title: 'Hỏi tuổi', cards: [C(`${a.h}今年多大？`, `${a.p} jīnnián duō dà?`, `${cap(P ? P.you : 'bạn')} năm nay bao nhiêu tuổi?`), C('你几岁？', 'Nǐ jǐ suì?', 'Con mấy tuổi? (hỏi trẻ em)')] }, { title: 'Trả lời', cards: [C('我今年二十岁。', 'Wǒ jīnnián èrshí suì.', 'Năm nay tôi hai mươi tuổi.')] }, ...(P ? [{ title: `Nói về tuổi của ${P.v}`, cards: [C(`我${P.h}今年七十岁。`, `Wǒ ${P.p} jīnnián qīshí suì.`, `${cap(P.v)} tôi năm nay bảy mươi tuổi.`)] }] : [])]; },
      tips: ['Hỏi người lớn tuổi nên nói <b>您多大年纪？</b> (nín duō dà niánjì) cho lịch sự.']
    },
    {
      id: 'eat', title: 'ăn uống', keys: ['an com', 'an gi', 'an chua', 'an sang', 'an trua', 'doi bung', 'bua an', 'an'],
      build(P) { const a = A(P); return [{ title: P ? `Mời ${P.v} ăn cơm` : 'Hỏi và mời ăn', cards: [C(P ? `${P.h}，吃饭了吗？` : '你吃饭了吗？', P ? `${P.p}, chī fàn le ma?` : 'Nǐ chī fàn le ma?', P ? `${cap(P.you)} ơi, ${P.you} ăn cơm chưa ạ?` : 'Bạn ăn cơm chưa?'), C(`${a.h}想吃什么？`, `${a.p} xiǎng chī shénme?`, `${cap(P ? P.you : 'bạn')} muốn ăn gì?`), C('我们去吃饭吧。', 'Wǒmen qù chī fàn ba.', 'Chúng ta đi ăn cơm nhé.')] }, { title: 'Trả lời', cards: [C('我想吃米饭。', 'Wǒ xiǎng chī mǐfàn.', 'Tôi muốn ăn cơm.'), C('我吃了。', 'Wǒ chī le.', 'Tôi ăn rồi.'), C('我饿了。', 'Wǒ è le.', 'Tôi đói rồi.')] }]; },
      tips: ['"吃饭了吗？" là câu hỏi thăm rất thân mật của người Trung Quốc, giống "ăn cơm chưa?" trong tiếng Việt.']
    },
    {
      id: 'drink', title: 'đồ uống', keys: ['uong', 'tra', 'nuoc', 'ca phe', 'cafe', 'khat'],
      build(P) { const a = A(P); return [{ title: 'Mời và hỏi', cards: [C(P ? `${P.h}，请喝茶。` : '请喝茶。', P ? `${P.p}, qǐng hē chá.` : 'Qǐng hē chá.', P ? `${cap(P.you)} ơi, mời ${P.you} uống trà.` : 'Mời uống trà.'), C(`${a.h}想喝什么？`, `${a.p} xiǎng hē shénme?`, `${cap(P ? P.you : 'bạn')} muốn uống gì?`)] }, { title: 'Trả lời', cards: [C('我想喝水。', 'Wǒ xiǎng hē shuǐ.', 'Tôi muốn uống nước.'), C('我喝茶。', 'Wǒ hē chá.', 'Tôi uống trà.'), C('我喝咖啡。', 'Wǒ hē kāfēi.', 'Tôi uống cà phê.')] }]; }
    },
    {
      id: 'origin', title: 'quê quán, quốc tịch', keys: ['nuoc nao', 'nguoi nuoc', 'quoc tich', 'nguoi viet', 'tu dau den', 'que o dau', 'nguoi o dau'],
      build() { return [{ title: 'Hỏi', cards: [C('你是哪国人？', 'Nǐ shì nǎ guó rén?', 'Bạn là người nước nào?')] }, { title: 'Trả lời', cards: [C('我是越南人。', 'Wǒ shì Yuènán rén.', 'Tôi là người Việt Nam.'), C('我是中国人。', 'Wǒ shì Zhōngguó rén.', 'Tôi là người Trung Quốc.'), C('我是学生。', 'Wǒ shì xuésheng.', 'Tôi là học sinh/sinh viên.')] }]; }
    },
    {
      id: 'bye', title: 'tạm biệt, hẹn gặp', keys: ['tam biet', 'hen gap', 'chao nhe', 've nhe', 'ngu ngon', 'chuc ngu'],
      build(P) { return [{ title: 'Tạm biệt', cards: [C(P ? `${P.h}，再见！` : '再见！', P ? `${P.p}, zàijiàn!` : 'Zàijiàn!', P ? `Chào ${P.v} nhé!` : 'Tạm biệt!'), C('明天见！', 'Míngtiān jiàn!', 'Ngày mai gặp nhé!'), C('晚安！', 'Wǎn’ān!', 'Chúc ngủ ngon!')] }]; }
    },
    {
      id: 'price', title: 'mua sắm, giá cả', keys: ['bao nhieu tien', 'gia bao nhieu', 'gia tien', 'mua', 'dat qua', 'tra gia', 're hon', 'mac'],
      build() { return [{ title: 'Hỏi giá và mua', cards: [C('这个多少钱？', 'Zhège duōshao qián?', 'Cái này bao nhiêu tiền?'), C('我要这个。', 'Wǒ yào zhège.', 'Tôi lấy cái này.'), C('我买一个。', 'Wǒ mǎi yí ge.', 'Tôi mua một cái.')] }, { title: 'Mặc cả', cards: [C('太贵了！', 'Tài guì le!', 'Đắt quá!'), C('便宜一点儿吧。', 'Piányi yìdiǎnr ba.', 'Rẻ hơn chút nhé.')] }]; }
    },
    {
      id: 'understand', title: 'không hiểu, nhờ nhắc lại', keys: ['khong hieu', 'nhac lai', 'noi lai', 'noi cham', 'khong nghe ro', 'chua nghe', 'noi tieng trung', 'bieu nghia'],
      build() { return [{ title: 'Khi chưa hiểu', cards: [C('我不懂。', 'Wǒ bù dǒng.', 'Tôi không hiểu.'), C('请再说一遍。', 'Qǐng zài shuō yí biàn.', 'Xin hãy nói lại một lần nữa.'), C('请说慢一点儿。', 'Qǐng shuō màn yìdiǎnr.', 'Xin hãy nói chậm một chút.'), C('这个汉字怎么读？', 'Zhège Hànzì zěnme dú?', 'Chữ Hán này đọc thế nào?')] }, { title: 'Nói về trình độ', cards: [C('我会说一点儿汉语。', 'Wǒ huì shuō yìdiǎnr Hànyǔ.', 'Tôi biết nói một chút tiếng Trung.'), C('你会说英语吗？', 'Nǐ huì shuō Yīngyǔ ma?', 'Bạn biết nói tiếng Anh không?')] }]; }
    },
    {
      id: 'live', title: 'nơi ở, đi đâu', keys: ['song o dau', 'nha o dau', 'dia chi', 'o dau', 'di dau', 'dang di', 've nha', 'di hoc', 'di lam'],
      build(P) { return [{ title: 'Hỏi', cards: [C(P ? `${P.h}住在哪儿？` : '你住在哪儿？', P ? `${cap(P.p)} zhù zài nǎr?` : 'Nǐ zhù zài nǎr?', P ? `${cap(P.v)} sống ở đâu?` : 'Bạn sống ở đâu?'), C(P ? `${P.h}去哪儿了？` : '你去哪儿？', P ? `${cap(P.p)} qù nǎr le?` : 'Nǐ qù nǎr?', P ? `${cap(P.v)} đi đâu rồi?` : 'Bạn đi đâu đấy?')] }, { title: 'Trả lời', cards: [C('我住在河内。', 'Wǒ zhù zài Hénèi.', 'Tôi sống ở Hà Nội.'), C('我去学校。', 'Wǒ qù xuéxiào.', 'Tôi đến trường.'), C('我回家。', 'Wǒ huí jiā.', 'Tôi về nhà.')] }]; }
    },
    {
      id: 'family', title: 'gia đình', keys: ['gia dinh', 'may nguoi', 'anh chi em', 'nha co', 'bo me'],
      build() { return [{ title: 'Nói về gia đình', cards: [C('你家有几口人？', 'Nǐ jiā yǒu jǐ kǒu rén?', 'Nhà bạn có mấy người?'), C('我家有五口人。', 'Wǒ jiā yǒu wǔ kǒu rén.', 'Nhà tôi có năm người.'), C('我有一个哥哥。', 'Wǒ yǒu yí ge gēge.', 'Tôi có một anh trai.'), C('这是我爸爸，这是我妈妈。', 'Zhè shì wǒ bàba, zhè shì wǒ māma.', 'Đây là bố tôi, đây là mẹ tôi.')] }]; }
    },
    {
      id: 'wish', title: 'lời chúc', keys: ['chuc mung', 'chuc', 'sinh nhat', 'nam moi', 'tet', 'vui ve', 'thanh cong'],
      build(P) { const a = A(P); return [{ title: 'Lời chúc thông dụng', cards: [C(`祝${a.h}生日快乐！`, `Zhù ${a.p} shēngrì kuàilè!`, `Chúc ${P ? P.you : 'bạn'} sinh nhật vui vẻ!`), C('新年快乐！', 'Xīnnián kuàilè!', 'Chúc mừng năm mới!'), C('春节快乐！', 'Chūnjié kuàilè!', 'Chúc mừng Tết Nguyên Đán!'), C(`祝${a.h}身体健康！`, `Zhù ${a.p} shēntǐ jiànkāng!`, `Chúc ${P ? P.you : 'bạn'} mạnh khoẻ!`), C('祝你学习进步！', 'Zhù nǐ xuéxí jìnbù!', 'Chúc bạn học tập tiến bộ!')] }]; }
    },
    {
      id: 'like', title: 'sở thích', keys: ['thich', 'so thich', 'yeu thich'],
      build() { return [{ title: 'Sở thích', cards: [C('你喜欢什么？', 'Nǐ xǐhuan shénme?', 'Bạn thích gì?'), C('我喜欢喝茶。', 'Wǒ xǐhuan hē chá.', 'Tôi thích uống trà.'), C('我喜欢学汉语。', 'Wǒ xǐhuan xué Hànyǔ.', 'Tôi thích học tiếng Trung.'), C('我不喜欢这个。', 'Wǒ bù xǐhuan zhège.', 'Tôi không thích cái này.')] }]; }
    },
    {
      id: 'time', title: 'thời gian', keys: ['may gio', 'bay gio', 'thu may', 'ngay may', 'hom nay', 'ngay mai', 'thoi gian'],
      build() { return [{ title: 'Hỏi thời gian', cards: [C('现在几点？', 'Xiànzài jǐ diǎn?', 'Bây giờ mấy giờ?'), C('现在三点。', 'Xiànzài sān diǎn.', 'Bây giờ là ba giờ.'), C('今天星期几？', 'Jīntiān xīngqī jǐ?', 'Hôm nay là thứ mấy?'), C('今天星期一。', 'Jīntiān xīngqīyī.', 'Hôm nay là thứ Hai.')] }]; }
    },
    {
      id: 'study', title: 'học tiếng Trung', keys: ['hoc tieng trung', 'hoc tieng han', 'tieng trung', 'tieng han', 'hoc tap', 'hoc hanh', 'hanyu'],
      build() { return [{ title: 'Nói về việc học', cards: [C('我在学汉语。', 'Wǒ zài xué Hànyǔ.', 'Tôi đang học tiếng Trung.'), C('汉语难吗？', 'Hànyǔ nán ma?', 'Tiếng Trung có khó không?'), C('我每天学习汉语。', 'Wǒ měi tiān xuéxí Hànyǔ.', 'Mỗi ngày tôi đều học tiếng Trung.'), C('老师，请问……', 'Lǎoshī, qǐngwèn…', 'Thưa thầy/cô, em xin hỏi…')] }]; }
    },
    {
      id: 'sick', title: 'bị ốm, không khoẻ', keys: ['bi om', 'om', 'benh', 'sot', 'khong khoe', 'kho chiu', 'nhuc dau', 'dau bung', 'di kham', 'bac si', 'benh vien'],
      build(P) { return [{ title: 'Hỏi thăm khi ốm', cards: [C(P ? `${P.h}，${A(P).h}哪儿不舒服？` : '你哪儿不舒服？', P ? `${P.p}, ${A(P).p} nǎr bù shūfu?` : 'Nǐ nǎr bù shūfu?', `${P ? cap(P.you) + ' ơi, ' + P.you : 'Bạn'} thấy khó chịu ở đâu?`), C('去医院吧。', 'Qù yīyuàn ba.', 'Đi bệnh viện đi.')] }, { title: 'Nói mình không khoẻ', cards: [C('我不舒服。', 'Wǒ bù shūfu.', 'Tôi thấy không khoẻ.'), C('我头疼。', 'Wǒ tóu téng.', 'Tôi đau đầu.'), C('我想看医生。', 'Wǒ xiǎng kàn yīshēng.', 'Tôi muốn đi khám bác sĩ.')] }]; }
    },
    {
      id: 'person', title: 'giới thiệu người thân', keys: ['day la', 'noi ve'],
      build(P) { return P ? [{ title: `Nói về ${P.v}`, cards: [C(`这是我${P.h}。`, `Zhè shì wǒ ${P.p}.`, `Đây là ${P.v} của tôi.`), C(`我${P.h}身体很好。`, `Wǒ ${P.p} shēntǐ hěn hǎo.`, `${cap(P.v)} tôi sức khoẻ rất tốt.`), C(`我爱我${P.h}。`, `Wǒ ài wǒ ${P.p}.`, `Tôi yêu quý ${P.v} của tôi.`)] }] : []; }
    },
  ];
  const byId = Object.fromEntries(INTENTS.map(i => [i.id, i]));

  function answer(text) {
    const n = norm(text), P = findPerson(text);
    if (n.trim().length < 2) return null;
    const scored = INTENTS.map(it => {
      let sc = 0; it.keys.forEach(k => { if (n.includes(' ' + norm(k).trim() + ' ')) sc = Math.max(sc, k.length); }); return [sc, it];
    }).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]);
    /* Nhắc đến người thân mà không rõ tình huống: gợi ý giới thiệu + hỏi thăm sức khoẻ */
    let picks = scored.slice(0, 2).map(x => x[1]);
    if (!picks.length && P) picks = [byId.person, byId.health];
    if (!picks.length) return null;
    /* "ba" (bà) có thể là nhầm lẫn: chỉ coi là người khi tình huống liên quan người thân */
    const sections = [], tips = [];
    picks.forEach((it, i) => {
      const secs = it.build(P);
      if (!secs.length) return;
      if (i > 0) sections.push({ divider: `Tình huống liên quan: ${it.title}` });
      sections.push(...secs);
      (it.tips || []).forEach(t => tips.includes(t) || tips.push(t));
    });
    if (!sections.length) return null;
    const intro = `Mình hiểu bạn muốn biết cách nói về <b>${picks[0].title}</b>${P ? ` với <b>${P.v}</b> (<span class="kai">${P.h}</span> ${P.p})` : ''}. Đây là cách nói:`;
    return { intro, sections, tips, person: P, note: P && P.note };
  }

  window.ASKBOT = { answer, INTENTS, PEOPLE, examples: ['Nếu tôi muốn hỏi thăm sức khỏe của ông nội tôi thì nói như thế nào?', 'Cách chào cô giáo', 'Làm sao để nói cảm ơn bà ngoại', 'Hỏi giá khi mua đồ', 'Xin lỗi và đáp lại thế nào', 'Mời mẹ ăn cơm', 'Giới thiệu bố tôi', 'Tôi không hiểu, nhờ nói chậm lại'] };
})();
