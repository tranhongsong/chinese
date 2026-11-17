/* Tuỳ chọn: gắn sẵn video cho từng bài. Giá trị có thể là link YouTube / TikTok / Bilibili, hoặc file .mp4 trong thư mục video/.
   Một bài có thể có nhiều video (dùng mảng). Khoá là số bài (1–15) hoặc 'tones' cho bài thanh điệu.
   Ví dụ:
   window.VIDEO_MAP = {
     1: 'https://www.youtube.com/watch?v=XXXXXXXXXXX',
     2: ['bai02.mp4', 'https://www.tiktok.com/@kenh/video/1234567890'],
     tones: 'https://www.youtube.com/watch?v=YYYYYYYYYYY',
   };
   Ngoài ra, bạn có thể dán link trực tiếp trong trang (tab Video bài giảng), link sẽ được lưu trên máy. */
window.VIDEO_MAP = {};
