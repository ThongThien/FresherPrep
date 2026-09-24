# FresherPrep — Phạm vi sản phẩm

## 1. Mục tiêu

FresherPrep là nền tảng web miễn phí, phi thương mại, giúp sinh viên/người mới học Java chuẩn bị phỏng vấn vị trí Java Intern và đạt kiến thức cần thiết để vượt qua phỏng vấn Java Fresher.

Đối tượng và mục tiêu:

- Đối tượng: ứng viên Java Intern hoặc người đang chuẩn bị ứng tuyển.
- Kết quả học tập: nắm kiến thức Java ở mức Fresher và sẵn sàng phỏng vấn.
- Không xây dựng cấp bậc hoặc lộ trình riêng cho Junior.

Luồng học chính:

**Đọc tài liệu → Làm câu hỏi của bài → Đạt yêu cầu → Ôn quiz tổng hợp → Luyện phỏng vấn → Theo dõi mức độ sẵn sàng.**

## 2. Phạm vi V1

V1 tập trung vào nội dung Java thường gặp khi phỏng vấn Intern/Fresher:

- Java Core và cú pháp cơ bản
- OOP
- Exception Handling
- Collections
- Generics
- Java 8: Lambda, Stream, Optional
- Cơ bản về Multithreading/Concurrency và JVM
- SQL/PostgreSQL cơ bản
- Spring Core, Spring Boot, REST API
- JPA/Hibernate và Spring Security cơ bản

Chỉ cần nội dung Java trong V1. SQL/PostgreSQL là kiến thức hỗ trợ phỏng vấn Java, không mở rộng sản phẩm thành nền tảng học nhiều ngôn ngữ.

## 3. Cấu trúc học tập

Nội dung được tổ chức theo:

**Technology → Category → Topic → Subtopic → Lesson**

Ví dụ:

```text
Java
└── Java Core
    └── Collections
        ├── ArrayList
        └── HashMap
```

Một lesson thuộc một subtopic chính. Cấu trúc kiến thức có thể bỏ qua tầng không cần thiết, nhưng phải giữ quan hệ cha/con để lọc nội dung và tổng hợp tiến độ.

V1 chỉ có một lộ trình: **Java Intern → Sẵn sàng phỏng vấn Fresher**. Fresher là mục tiêu kiến thức/đầu ra, không phải một cấp tài khoản hoặc lộ trình song song. `Difficulty` của câu hỏi (Easy/Medium/Hard) là độ khó riêng và không thay thế mục tiêu đầu ra này.

## 4. Hình thức học và luyện tập

1. **Tài liệu (Lesson):** giải thích kiến thức theo subtopic, có ví dụ code khi phù hợp.
2. **Câu hỏi theo bài:** người học phải hoàn thành phần đọc và đạt bài kiểm tra gắn với lesson để lesson được tính hoàn thành.
3. **Quiz tổng hợp:** trắc nghiệm một đáp án đúng, mỗi câu có bốn lựa chọn; quiz lấy câu theo topic/subtopic.
4. **Coding practice:** bài tập Java quy mô nhỏ, phục vụ luyện kỹ năng thường gặp khi phỏng vấn.
5. **Interview practice:** câu hỏi phỏng vấn dạng văn bản, có rubric và phản hồi AI mang tính tham khảo.

Thi chính thức, hệ thống chấm code quy mô lớn, và nội dung cho cấp Junior là ngoài phạm vi V1.

## 5. Phạm vi người dùng

Người dùng có thể đăng ký/đăng nhập, theo dõi lộ trình, đọc tài liệu, làm bài kiểm tra và quiz không giới hạn, xem giải thích, ôn câu sai, theo dõi lịch sử, luyện coding/phỏng vấn, xem điểm yếu/thành tựu và bookmark nội dung.

## 6. Phạm vi quản trị

Admin quản lý nội dung không cần sửa mã nguồn: cây kiến thức, lesson, Question Bank, quiz, coding exercises, câu hỏi/rubric phỏng vấn, lộ trình, trạng thái xuất bản và thống kê sử dụng cơ bản.

## 7. Ngoài phạm vi V1

- Lộ trình Junior hoặc nhiều cấp nghề nghiệp.
- Nhiều ngôn ngữ lập trình.
- Mạng xã hội/cộng đồng và thu phí.
- Nền tảng chấm code cạnh tranh quy mô lớn.
- LMS doanh nghiệp, gamification nâng cao, microservices.
- Ứng dụng mobile native.

## 8. Nguyên tắc sản phẩm

Mọi chức năng phải hỗ trợ ít nhất một mục tiêu: **học Java, luyện Java, đánh giá kiến thức Java, hoặc chuẩn bị phỏng vấn Intern/Fresher**. Tiến độ “sẵn sàng Fresher” là chỉ báo học tập trong ứng dụng, không phải chứng nhận tuyển dụng.
