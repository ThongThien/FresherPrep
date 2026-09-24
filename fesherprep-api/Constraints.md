# FresherPrep — Ràng buộc

## 1. Ràng buộc sản phẩm

- Dự án phi thương mại, cung cấp học liệu miễn phí.
- Không chức năng học cốt lõi nào phụ thuộc thanh toán.
- Không giới hạn nhân tạo số lần quiz, retry hoặc xem giải thích.
- Đối tượng V1 là ứng viên Java Intern; mục tiêu kiến thức là sẵn sàng phỏng vấn Fresher.
- Không có lộ trình hoặc nội dung dành riêng cho Junior trong V1.
- Chỉ tập trung nội dung Java và kiến thức hỗ trợ phỏng vấn Java.

## 2. Ràng buộc công nghệ

### Frontend

- Next.js
- TypeScript
- Giao diện responsive

### Backend

- Java, Spring Boot, Spring Security
- Spring Data JPA/Hibernate
- REST API, DTO
- Validation và xử lý exception tập trung

### Database

- Supabase PostgreSQL
- Backend sở hữu business logic.
- Hạn chế phụ thuộc sâu vào tính năng riêng của Supabase khi không có lý do rõ ràng.

### Triển khai

Ưu tiên GitHub/GitHub Actions, Vercel cho frontend khi phù hợp, Supabase PostgreSQL và dịch vụ backend miễn phí/chi phí thấp.

## 3. Ràng buộc kiến trúc

### CC-01 — Monolith theo module

V1 dùng Spring Boot modular monolith; không thêm microservices nếu chưa có yêu cầu thực tế.

### CC-02 — Tổ chức theo nghiệp vụ

Ưu tiên module theo feature/domain, ví dụ:

```text
AUTH, USER, KNOWLEDGE, LESSON, QUESTION, QUIZ,
CODING, INTERVIEW, PROGRESS, ACHIEVEMENT, ADMIN
```

### CC-03 — Cây kiến thức linh hoạt

Hỗ trợ **Technology → Category → Topic → Subtopic → Lesson**. Có thể biểu diễn node bằng `parent_id`; không buộc mọi nhánh phải có đủ mọi cấp. Java là dữ liệu trong mô hình kiến thức, không phải cấu trúc hard-code.

### CC-04 — Nội dung tái sử dụng

Lesson và Question là nội dung độc lập, được liên kết với subtopic và ngữ cảnh học. Question có thể xuất hiện trong nhiều quiz mà không bị nhân bản.

### CC-05 — Giữ lịch sử

Quiz attempt phải tham chiếu đúng phiên bản question và thứ tự đã làm. Câu trả lời interview, rubric và kết quả AI cần được lưu đủ để giải thích đánh giá đã tạo ra.

## 4. Ràng buộc bảo mật

- Hash mật khẩu an toàn.
- Quản lý JWT/refresh token an toàn.
- Backend bắt buộc kiểm tra quyền admin.
- Không tin role từ frontend.
- AI API key/secret chỉ được lưu và sử dụng ở backend.
- Validate toàn bộ input từ người dùng.
- Không trả đáp án quiz trước khi nộp bài.
- Không chạy code không tin cậy trực tiếp trong tiến trình Spring Boot.

## 5. Ràng buộc dữ liệu

- Dùng foreign key và constraint phù hợp.
- Các entity lưu trữ chính có timestamps.
- Tạo index cho các đường truy vấn phổ biến: user, lesson, subtopic, quiz, attempt và trạng thái nội dung.
- Dùng pagination cho danh sách có thể lớn.
- Không gom toàn bộ dữ liệu thành JSON. Chỉ dùng JSON/JSONB cho cấu trúc thực sự linh hoạt, ví dụ payload đánh giá AI đã validate.
- Có thể dùng bảng phiên bản cho Question để attempt cũ không đổi khi nội dung được chỉnh sửa.
- Không tạo bảng dashboard/progress tổng hợp trong V1; query từ `lesson_progress`, `quiz_attempts`, `quiz_attempt_answers`, coding và interview history. Chỉ thêm cache sau khi đo được nhu cầu hiệu năng.

## 6. Ràng buộc nội dung

- Admin quản lý nội dung mà không sửa source code.
- Nội dung hỗ trợ vòng đời `DRAFT → REVIEW → PUBLISHED → ARCHIVED`.
- Mỗi quiz question trắc nghiệm có 4 lựa chọn, 1 đáp án đúng và giải thích; 3 phương án nhiễu thuộc cùng question và hợp lý trong cùng topic.
- Hệ thống cho phép thư viện Java phát triển mà không phải thiết kế lại luồng học.

## 7. Ràng buộc AI

- AI chỉ được gọi qua backend.
- Dùng contract có cấu trúc khi khả thi và validate output trước khi lưu.
- Lỗi AI không được làm hỏng lịch sử interview hoặc ngăn lưu câu trả lời gốc.
- Không phụ thuộc AI để chấm quiz trắc nghiệm hoặc vận hành nội dung học cốt lõi.
- Đánh giá interview dựa trên rubric cho mục tiêu Intern/Fresher; feedback là tham khảo.

## 8. Ràng buộc UX

Ứng dụng ưu tiên lộ trình học rõ ràng, dễ tìm hành động tiếp theo, giải thích dễ đọc, phân cấp thị giác tốt, responsive và điều hướng đơn giản. Giao diện người học phải giống sản phẩm học tập, không giống trang quản trị.

## 9. Kiểm soát phạm vi

Không đưa sớm các thành phần sau vào kiến trúc cốt lõi:

- Junior track hoặc nhiều ngôn ngữ lập trình.
- Microservices, Kafka/event-driven hoặc cache phức tạp.
- Hạ tầng chấm code cạnh tranh quy mô lớn.
- Recommendation engine nâng cao.
- Hệ thống cộng đồng/xã hội phức tạp.
- LMS doanh nghiệp hoặc gamification nâng cao.

## 10. Nguyên tắc kỹ thuật

**Giữ V1 đủ đơn giản để một developer xây dựng và bảo trì, đồng thời giữ ranh giới domain/API sạch để có thể mở rộng khi có nhu cầu thật.**
