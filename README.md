# LỚP HỌC HẠNH PHÚC _ PHẠM HẬU 🏫✨

Ứng dụng thông minh tích hợp **Quản Lý Lớp Học Hạnh Phúc & Sáng Tác Sách Nói Thiếu Nhi AI** do Giáo viên **Phạm Hậu** xây dựng và phát triển. Ứng dụng mang đến giải pháp toàn diện cho lớp học hạnh phúc: điểm danh thông minh, sơ đồ lớp tương tác, vòng quay gọi tên ngẫu nhiên, thi đua sao thưởng, đồng thời tự động sáng tác truyện tranh cổ tích với nhân vật chính là từng học sinh trong lớp bằng công nghệ Google Gemini AI.

---

## 🌟 Hệ Thống Tính Năng Đột Phá (Mới Hoàn Thiện)

### 1. ⚔️ Đấu Trường Ngôi Sao Giữa 4 Tổ Học Tập & Hộp Quà Bí Ẩn (Gamification)
- **Đua điểm sao theo thời gian thực**: So sánh tổng điểm sao và điểm trung bình giữa Tổ 1, Tổ 2, Tổ 3, Tổ 4.
- **Thanh cờ thi đua trực quan**: Bảng xếp hạng trực quan theo phong cách tên lửa vươn cao.
- **Thưởng điểm nhanh cả tổ**: Nút cộng +1⭐, +2⭐, +5⭐ cho toàn bộ thành viên trong tổ chỉ với 1 click, kèm hiệu ứng pháo hoa rực rỡ.
- **Hộp Quà Bí Ẩn (Mystery Box)**: 4 hộp quà may mắn ẩn chứa thử thách đọc thơ, câu đố vui học đường hoặc kho báu sao vàng bất ngờ sau các lượt phát biểu.

### 2. 🌳 Cây Hạnh Phúc Của Lớp (Procedural Happy Tree)
- Cây biểu tượng hạnh phúc sinh động bằng đồ họa SVG tương tác: Cây đơm hoa kết trái và nở những ngôi sao vàng lấp lánh tương ứng với tổng số sao tích lũy của toàn lớp.
- Thăng cấp cây (Level 1 -> 10) tạo động lực gắn kết tập thể cho học sinh.

### 3. 🤖 Trợ Lý Sư Phạm AI Đa Tác Tử (Teacher AI Assistant)
- **Soạn tin nhắn nhận xét phụ huynh tự động**: AI phân tích điểm sao, nhóm tổ và đặc điểm học sinh để soạn sẵn tin nhắn gửi Zalo/Sổ liên lạc phụ huynh với văn phong ấm áp, tràn ngập tình yêu thương và khích lệ.
- **Nút Copy 1 chạm gửi Zalo**: Tiết kiệm 90% thời gian cho thầy cô vào mỗi dịp tổng kết tuần.
- **Tự động sinh bộ câu hỏi đọc hiểu 5 mức độ**: Tạo câu hỏi nhận biết, thông hiểu, vận dụng và cảm xúc kết nối sau mỗi tiết đọc sách hoặc sinh hoạt lớp.

### 4. 🏅 Giấy Khen Học Sinh Hạnh Phúc Chuẩn Hoàng Gia (Print & Export)
- **Mẫu Giấy Khen Danh Dự khổ A4 trang trọng**: Có quốc hiệu, tiêu ngữ, tên trường, tên lớp, linh vật và tên học sinh, thành tích sao đạt được, danh hiệu vinh danh và chữ ký điện tử của Thầy giáo **Phạm Hậu**.
- Hỗ trợ xem trước và in trực tiếp ra giấy khen A4 ngang hoặc tải về file văn bản.

### 5. 📽️ Chế Độ Trình Chiếu Slide Bài Giảng (.pptx / Web Slide Mode)
- Trình chiếu toàn màn hình câu chuyện tranh cổ tích AI trên máy chiếu / màn hình TV của lớp học:
  - Cỡ chữ lớn, rõ ràng cho học sinh ngồi xa vẫn đọc tốt.
  - Hình ảnh minh họa độ nét cao, sắc nét.
  - Tích hợp giọng đọc AI truyền cảm cho từng trang.
  - Tích hợp câu hỏi gợi ý tương tác cho cả lớp cùng thảo luận.

### 6. 📚 Sách Nói Thiếu Nhi & Xưởng Vẽ Minh Họa AI
- **Sáng tác truyện theo học sinh**: Tự động đưa tên bạn nhỏ bất kỳ vào câu chuyện phiêu lưu kỳ thú.
- **Hệ thống AI Gemini 3 cấp độ Fallback**: `gemini-3-flash-preview` (Mặc định) -> `gemini-3-pro-preview` -> `gemini-2.5-flash`.
- **Đọc truyện tự động**: Giọng đọc AI Gemini TTS và Web Speech API trình duyệt dự phòng.
- **Xưởng vẽ tranh minh họa**: Tự động tạo tranh thiếu nhi màu nước/3D/cổ tích cho từng trang truyện.

---

## 🔑 Hướng Dẫn Cấu Hình API Key Google Gemini

Người dùng có thể tự nhập API Key cá nhân trực tiếp trên ứng dụng mà không cần cấu hình phức tạp:

1. Bấm vào nút đỏ **"Settings (API Key) - Lấy API key để sử dụng app"** trên thanh tiêu đề (Header).
2. Nhấp vào liên kết [Google AI Studio (aistudio.google.com/api-keys)](https://aistudio.google.com/api-keys) để lấy mã API Key miễn phí.
3. Dán mã API Key vào ô nhập và bấm **"Test"** để kiểm tra kết nối.
4. Chọn mô hình AI ưa thích (mặc định: `gemini-3-flash-preview`) rồi bấm **"Lưu Cài Đặt & Sử Dụng"**.
5. Mã API Key được lưu an toàn trong trình duyệt của bạn (Local Storage).

---

## 🚀 Hướng Dẫn Triển Khai Lên Vercel (Từ GitHub)

Dự án đã được cấu hình sẵn file `vercel.json` phục vụ Single Page Application (SPA):

1. **Đẩy mã nguồn lên GitHub**:
   ```bash
   git add .
   git commit -m "Cập nhật Lớp Học Hạnh Phúc _ Phạm Hậu"
   git push origin main
   ```

2. **Kết nối & Triển khai trên Vercel**:
   - Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
   - Chọn **"Add New Project"** -> Chọn repository vừa push.
   - **Framework Preset**: Chọn `Vite`.
   - **Build Command**: `vite build` hoặc `npm run build`.
   - **Output Directory**: `dist`.
   - Bấm **"Deploy"**.

---

## 👨‍🏫 Tác Giả & Bản Quyền
- **Ứng dụng**: LỚP HỌC HẠNH PHÚC _ PHẠM HẬU
- **Tác giả**: Thầy giáo **Phạm Hậu**
- **Đơn vị**: Lớp 12A6 · THPT Hồng Ngự 3
- Chúc quý thầy cô và các em học sinh có những giờ học tràn ngập niềm vui, tình yêu thương và sự gắn kết!
