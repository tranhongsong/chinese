# Hán ngữ nhập môn

Trang web học tiếng Trung cho người mới, chạy offline. Mở file `index.html` bằng **Microsoft Edge** (khuyên dùng vì có giọng Xiaoxiao, Yunxi tự nhiên) hoặc Chrome.

## Nội dung
- **Bài thanh điệu**: làm quen, từng thanh (đường cao độ, lỗi hay gặp của người Việt), cặp dễ nhầm, biến điệu, 4 trò luyện tập và video giảng.
- **Mẹo học** (💡) ở hầu hết các phần, và mẹo riêng cho từng bài trong 15 bài HSK 1.
- **Pinyin**: 21 thanh mẫu, 36 vận mẫu, thanh điệu (có trò chơi nghe đoán thanh), quy tắc biến điệu.
- **Nét và quy tắc viết**: 12 nét cơ bản, 9 quy tắc bút thuận, cấu trúc chữ, lục thư. Hoạt hình từng nét, tập viết có chấm lỗi (Hanzi Writer).
- **Bộ thủ**: 81 bộ và biến thể, tên Hán Việt, ví dụ có âm thanh, tìm kiếm.
- **15 bài HSK 1**: mỗi bài có **video bài giảng** (cô giáo ảo giảng như đứng lớp: bảng đen, phụ đề, hoạt hình nét chữ, đọc mẫu và cho thời gian đọc theo), hội thoại hai giọng, từ vựng, ngữ pháp, bài tập tự sinh.
- **Ôn tập**: thẻ ghi nhớ có ôn lặp lại ngắt quãng (từ đến hạn), luyện viết bất kỳ chữ nào.
- **Nghe & gõ pinyin**: nghe từ rồi gõ pinyin (có dấu, số thanh hoặc không thanh).
- **Tra từ**: tìm theo chữ Hán, pinyin không dấu hoặc nghĩa tiếng Việt.
- **Mục tiêu hằng ngày**: chuỗi ngày học liên tiếp, 20 lượt luyện mỗi ngày. Tiến độ lưu trong trình duyệt.

## Video bài giảng
Bài giảng tự sinh từ `data/lessons.js`. Phần tiếng Việt do giọng Vietnamese của trình duyệt đọc (Edge: cài giọng Vietnamese trong Windows → Speech), nếu máy không có giọng Việt thì hiện phụ đề. Muốn thêm video: dán link **YouTube, TikTok (link đầy đủ), Bilibili** hoặc file .mp4 ngay trong tab Video bài giảng (lưu trên máy bạn), hoặc khai báo sẵn trong `video/manifest.js`. Video được nhúng nên cần có mạng; nếu YouTube báo lỗi khi mở file trực tiếp, hãy chạy `node tools/serve.mjs` và vào http://localhost:5173.

## Âm thanh
Dùng giọng tiếng Trung của trình duyệt. Nếu muốn dùng file MP3 riêng, đặt vào `audio/` rồi khai báo trong `audio/manifest.js`.

## Thêm hoặc sửa nội dung
Sửa các file trong `data/`, sau đó chạy lại để cập nhật dữ liệu nét chữ cho chữ mới:

```bash
node tools/build.mjs
```

(Cần `npm install` trong thư mục `tools` một lần nếu thiếu `node_modules`.)

Dữ liệu nét chữ: hanzi-writer-data (Make Me a Hanzi, Arphic Public License). Thư viện: Hanzi Writer (MIT).

## Câu giao tiếp (#/ask)
Kho câu giao tiếp (data/phrases.js, thêm câu bằng cách chèn một dòng vào nhóm) cộng với toàn bộ câu hội thoại trong 15 bài. Gõ tiếng Việt, pinyin không dấu hoặc chữ Hán để hiện gợi ý ngay khi gõ; gõ câu hỏi như "hỏi thăm sức khoẻ ông nội" để nhận mẫu câu theo người thân (data/ask.js). Hoàn toàn offline, không dùng AI.

## Tiến độ và kiểm tra cuối khoá
Mỗi bài có 5 phần (video, hội thoại, từ vựng, ngữ pháp, luyện tập); đánh dấu hoàn thành từng phần (luyện tập cần đạt 60%). Hoàn thành 100% thì mở bài kiểm tra cuối khoá 20 câu; đạt từ 80%, nếu không đạt thì tiến độ khoá bị reset để học lại từ Bài 1.

## Luyện nói (#/speak)
Dùng nhận diện giọng nói của trình duyệt (Chrome/Edge, cần mạng và cho phép micro). Mỗi lượt 10 câu, đạt từ 75% mỗi câu, đạt 7/10 câu là lượt đạt. Trình duyệt không hỗ trợ thì dùng chế độ tự đánh giá.

## Đóng gói thành một file
`node tools/pack.mjs` tạo `HanNgu-HSK1.html` (khoảng 1,4 MB) chứa toàn bộ CSS, JS, dữ liệu và nét chữ. Chép file này đi đâu cũng mở được bằng cách bấm đúp. Sau khi sửa code hoặc dữ liệu, chạy lại lệnh để cập nhật. Video .mp4 trong thư mục `video/` không được gộp vào (link YouTube/TikTok vẫn dùng bình thường khi có mạng).

## Dùng trên điện thoại (iPhone, Android)
Trên máy tính, bấm đúp `Chay-tren-dien-thoai.bat` (hoặc chạy `node tools/serve.mjs 8080 --lan`). Cửa sổ sẽ in địa chỉ dạng `http://192.168.x.x:8080`. Đặt điện thoại cùng Wi-Fi, mở Safari/Chrome và gõ địa chỉ đó. Cần giữ cửa sổ mở trong lúc dùng. Trên iPhone, dùng nút Chia sẻ → Thêm vào Màn hình chính để có biểu tượng như ứng dụng.

## Bản quyền và giấy phép
Xem [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) và thư mục `licenses/`. Dự án dùng Hanzi Writer (MIT) và dữ liệu nét chữ theo Arphic Public License; "HSK" là nhãn hiệu của chủ sở hữu, dự án này độc lập và không được chứng nhận bởi họ. Nội dung bài học do tác giả biên soạn; hãy tự chọn giấy phép (ví dụ MIT hoặc CC BY-NC-SA) trước khi cho phép người khác tái sử dụng.
