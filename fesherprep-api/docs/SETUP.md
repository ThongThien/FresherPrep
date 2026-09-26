# Thiết lập backend và Supabase

## Phạm vi hiện tại

Backend tổ chức theo modular monolith: một ứng dụng Spring Boot, một database PostgreSQL, package chia theo chức năng. Bản này xây dựng entity cho 19 bảng cốt lõi: tài khoản, cây kiến thức, lesson, lộ trình, Question Bank và lịch sử quiz. Coding, interview/AI, bookmark và bảng thành tựu chưa được triển khai.

Entity là nền tảng dữ liệu. Các API đăng ký/đăng nhập, JWT, đọc bài, chọn câu và dashboard sẽ được triển khai trên nền tảng này. Cấu hình bảo mật hiện tại chỉ mở `GET /actuator/health`; những đường dẫn còn lại bị chặn tới khi có luồng xác thực và phân quyền tương ứng. Mật khẩu được chuẩn bị để hash bằng `PasswordEncoder` BCrypt; refresh token chỉ lưu SHA-256 dạng hex, không lưu token gốc.

## Điền `.env`

File `.env` đã được tạo ở thư mục gốc và được Git bỏ qua. `.env.example` là bản mẫu có thể đưa vào Git. Các giá trị `YOUR_...` và `REPLACE_...` cần được thay bằng thông tin dự án thật; chúng không phải thông tin kết nối đã hoạt động.

Trong Supabase Dashboard, mở **Connect → Session pooler**, sau đó điền:

| Biến | Giá trị |
|---|---|
| `APP_PROFILE` | `dev` để tạo/cập nhật bảng; `prod` để chỉ kiểm tra schema |
| `SERVER_PORT` | `8080` hoặc cổng muốn sử dụng |
| `SUPABASE_DB_URL` | `jdbc:postgresql://<host-session-pooler>:5432/postgres?sslmode=require` |
| `SUPABASE_DB_USERNAME` | Production: runtime role tối thiểu, ví dụ `fresherprep_runtime.<project-ref>`; chỉ dùng `postgres.<project-ref>` cho migration/admin đã review |
| `SUPABASE_DB_PASSWORD` | Mật khẩu database của dự án Supabase |

Copy chính xác host từ Dashboard vì không thể suy ra host chỉ từ region. Session pooler cổng `5432` phù hợp kết nối IPv4 và hỗ trợ prepared statements cho JPA. Với môi trường có IPv6, có thể dùng direct connection và username tương ứng trong Dashboard. [Hướng dẫn kết nối Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Backend kết nối trực tiếp PostgreSQL bằng JDBC nên không cần Supabase anon key/service-role API key cho bước này. `users` là tài khoản của ứng dụng Spring, chưa tích hợp Supabase Auth.

Spring đọc `.env` như file Java properties bằng `spring.config.import=optional:file:.env[.properties]`. Ghi `KEY=value`, không bọc giá trị bằng dấu nháy. Nếu mật khẩu chứa dấu `\`, ghi thành `\\`; mật khẩu được truyền riêng nên không cần URL-encode. Trên môi trường triển khai, có thể cung cấp các biến qua hệ điều hành/secret manager thay cho `.env`. [Cấu hình ngoài của Spring Boot](https://docs.spring.io/spring-boot/reference/features/external-config.html).

## Chạy và tạo bảng

Yêu cầu JDK hỗ trợ Java 21 và Maven wrapper của dự án. Chạy lệnh ở thư mục chứa `pom.xml` và `.env`:

```powershell
.\mvnw.cmd spring-boot:run
```

Với `APP_PROFILE=dev`, Hibernate dùng `ddl-auto=update` để tạo/cập nhật 19 bảng từ entity và tạo schema `fresherprep` khi chưa có. Tài khoản database phải có quyền tạo schema/bảng. Các bảng ứng dụng nằm trong schema này để tách khỏi `public` và các schema hệ thống của Supabase; chúng không cần được đưa vào danh sách schema công khai của Supabase Data API.

Với `APP_PROFILE=prod`, Hibernate dùng `ddl-auto=validate`: database cần có schema đã được chuẩn bị trước. `update` phục vụ phát triển; thay đổi production sẽ cần migration được kiểm tra trước, đặc biệt khi đổi tên/xóa cột hoặc đổi dữ liệu enum. Nếu không khai báo `APP_PROFILE`, cấu hình mặc định là `prod`.

Connection pool giới hạn 5 kết nối mỗi instance, tối thiểu 1. Open Session in View bị tắt: sau này service đọc quan hệ cần chạy trong transaction và chuyển dữ liệu sang DTO. Thời gian nghiệp vụ dùng `Instant`/UTC.

## Lựa chọn dữ liệu đã chốt

- Mỗi entity có UUID `id` và thời điểm `created_at`. Entity có nội dung chỉnh sửa mới bổ sung `updated_at` nếu cần.
- Mỗi user có một `UserRole` Java enum, mặc định `USER`, hoặc `ADMIN`. PostgreSQL lưu `users.role` dạng chuỗi kèm CHECK giới hạn giá trị; không có bảng role. Tên `user_roles` trong yêu cầu được hiểu là enum của mô hình, không phải PostgreSQL named type. Cách này để Hibernate quản lý schema trực tiếp mà không cần thêm SQL khởi tạo enum hoặc custom dialect.
- Question được tái sử dụng, có phiên bản; attempt tham chiếu phiên bản đã chọn. Bốn đáp án và giải thích thuộc cùng phiên bản question. Lịch sử giữ nguyên nội dung đã làm.
- Kết quả đọc lesson được lưu trong `lesson_progress`; hoàn thành lesson phải kết hợp điều kiện đọc với quiz bắt buộc đã đạt. Tiến độ tổng hợp và thành tựu được query từ lịch sử, không có bảng đếm riêng.
- Entity khai báo khóa ngoại, unique, CHECK và validation cho dữ liệu cần dùng. Kiểm tra quyền, phạm vi truy vấn nội dung `PUBLISHED`, chọn câu ngẫu nhiên và transaction của API vẫn phải được thực hiện khi xây dựng tầng service.

## Package và cách dùng entity

```text
com.fesherprep.fesherprep_api
├── auth/domain          RefreshToken
├── user/domain          User, UserRole
├── knowledge/domain     KnowledgeNode
├── lesson/domain        Lesson, LessonPrerequisite, LessonProgress
├── learningpath/domain  LearningPath, LearningPathItem, UserLearningPath
├── question/domain      Question, QuestionVersion, QuestionOption
├── quiz/domain          Quiz, quy tắc, liên kết và lịch sử làm bài
├── config               Cấu hình bảo mật
└── shared               ID/thời điểm tạo và trạng thái nội dung dùng chung
```

- `QuestionVersion` và các option bất biến sau khi tạo; sửa câu hỏi bằng phiên bản mới. Khi triển khai thao tác xuất bản trong transaction, lưu Question nháp, lưu phiên bản cùng bốn option, rồi gọi `Question.publish(version)` và cập nhật Question. Không cascade xóa lịch sử.
- `QuizAttempt` kiểm tra bộ câu đã chọn có đúng cấu hình quiz trước khi ghi nhận. `createdAt` chính là thời điểm bắt đầu attempt; `submittedAt` là thời điểm nộp. Điểm và ngưỡng đạt được lưu trong attempt; kết quả đạt được suy ra từ hai giá trị đó.
- `QuizAttempt.submit(...)` nhận các entity đã được backend tra cứu từ ID, tự xác định đúng/sai. Câu bỏ trống không có bản ghi answer nhưng vẫn nằm trong mẫu số tính điểm. Sau khi nộp không được sửa đáp án; làm lại tạo attempt mới.
- Ngưỡng đạt nằm tại `Quiz.passPercentage`; `LessonAssessment` tham chiếu quiz để dùng cùng ngưỡng, tránh lưu hai cấu hình trùng nhau. Hoàn thành lesson cần `readQualifiedAt` và ít nhất một attempt đạt của quiz bắt buộc. Trạng thái hoàn thành được query, không lưu cột đếm trùng.
- Mỗi rule quiz chọn một phạm vi node và difficulty; các phạm vi không được chồng nhau để một câu không bị tính vào hai nhóm. Cùng một subtopic có thể cấu hình số câu Easy/Medium khác nhau. Đánh giá nội dung ba đáp án nhiễu có hợp lý về kiến thức vẫn là trách nhiệm biên soạn/duyệt của admin.

## Kiểm tra trước khi kết nối Supabase

```powershell
.\mvnw.cmd -B -ntp test
```

Bộ kiểm tra chạy độc lập với database: kiểm tra điều kiện đọc, cấu hình quiz, chấm điểm, phiên bản lịch sử và dựng Hibernate mapping cho đúng 19 bảng. File `target/generated-schema.sql` là DDL PostgreSQL sinh từ entity để xem trước; kiểm tra không thực thi DDL này lên Supabase. Việc kết nối và tạo bảng thật cần các giá trị Supabase hợp lệ trong `.env`.
