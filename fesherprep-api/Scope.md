# FresherPrep — Phạm vi dự án

## 1. Mục tiêu

FresherPrep là nền tảng miễn phí giúp người học Java Backend ở mức Intern ôn kiến thức, học theo lộ trình và chuẩn bị đạt năng lực Fresher.

Luồng học chính:

```text
Cây kiến thức → Learning Path → Lesson → Điều kiện đọc
→ Quiz/Assessment → Hoàn thành Lesson → Tiến độ Learning Path
```

Sản phẩm không cam kết kết quả tuyển dụng và không có lộ trình Junior trong phạm vi hiện tại.

## 2. Vai trò

- **USER**: học lesson, làm quiz, theo dõi tiến độ, bình luận và sử dụng Pet/Learning Games.
- **CONTRIBUTOR**: có quyền USER; tạo bản nháp nội dung được cho phép, gửi kiểm duyệt và theo dõi kết quả.
- **ADMIN**: quản lý tài khoản, cây kiến thức, nội dung, kiểm duyệt, bình luận/thông báo và cấu hình Pet.

Phân quyền phải được kiểm tra ở backend. Việc đổi role chỉ thay đổi quyền, không tự làm mất phiên đăng nhập còn hợp lệ.

## 3. Phạm vi chức năng hiện tại

### 3.1. Tài khoản và bảo mật

- Đăng ký, đăng nhập, refresh access token, logout/revoke refresh token.
- Lấy và cập nhật thông tin người dùng hiện tại.
- Mật khẩu được băm; dùng JWT access token và refresh token.
- Giới hạn tần suất các endpoint xác thực.
- Java knowledge challenge có thời hạn được kích hoạt khi đăng nhập thất bại đáng ngờ.
- Phân biệt rõ `401` chưa/xác thực không còn hợp lệ và `403` không đủ quyền.

### 3.2. Nội dung học

Cây kiến thức có đúng bốn tầng:

```text
TECHNOLOGY → CATEGORY → TOPIC → SUBTOPIC
```

Ví dụ:

```text
Java
└── Java Core
    └── Collections
        ├── ArrayList
        └── HashMap
```

`SUBTOPIC` không phải `LESSON`. Một subtopic có thể có nhiều lesson; mỗi lesson thuộc đúng một subtopic.

Lesson hỗ trợ nội dung HTML giàu định dạng đã sanitize, ảnh từ Supabase Storage, prerequisite, thời gian đọc tối thiểu, phần trăm cuộn tối thiểu và assessment quiz.

### 3.3. Lộ trình và tiến độ

- Learning Path gồm các lesson có thứ tự, cờ bắt buộc và trọng số.
- User có thể tham gia một path một lần và xem các path đã tham gia.
- Lesson progress lưu active time, last viewed, max scroll và thời điểm đạt điều kiện đọc.
- Lesson không có assessment hoàn thành khi đạt điều kiện đọc.
- Lesson có assessment chỉ hoàn thành khi vừa đạt điều kiện đọc vừa pass quiz.
- Path progress/completion được suy ra từ lesson hiện tại, không cần bảng tổng hợp riêng.

### 3.4. Question Bank và Quiz

- Question là câu hỏi logic, có `code` duy nhất, thuộc một subtopic và có nhiều phiên bản bất biến.
- Phiên bản question chứa nội dung, giải thích và đúng bốn lựa chọn, trong đó đúng một lựa chọn chính xác.
- Quiz hỗ trợ `FIXED` và `RULE_BASED`, có loại, ngôn ngữ, category, điểm tối đa, tỷ lệ pass và thời lượng nếu được cấu hình.
- Khi bắt đầu attempt, backend snapshot quiz, question version, thứ tự và subtopic.
- User giữ đáp án cục bộ khi đang làm và submit một lần; backend chấm điểm, xác định pass/fail và lưu lịch sử.
- Không triển khai answer autosave hoặc lưu từng lựa chọn lên server trước khi submit.

### 3.5. Contributor và kiểm duyệt

- Contributor tạo/sửa nội dung nháp trong phạm vi được cấp và chỉ sửa bản nháp của mình.
- Contributor gửi nội dung vào review; không được tự approve hoặc publish.
- Admin xem review queue, approve/publish hoặc reject kèm lý do.
- Lưu submission và review event để truy vết trạng thái.

### 3.6. Tương tác và thông báo

- User xem, tạo, sửa và xóa bình luận của chính mình trên Lesson/Quiz.
- Admin xem bình luận mới qua notification, mở đúng nội dung và đánh dấu đã đọc.
- Chưa yêu cầu WebSocket; unread count được lấy theo API.

### 3.7. Dashboard, Progress và Learning Games

- Dashboard/progress tổng hợp từ lesson progress, learning path và quiz attempts.
- Achievement được suy ra từ dữ liệu học thật, không có bảng achievement riêng.
- Flashcard và Matching tái sử dụng nội dung đã xuất bản; không có leaderboard, multiplayer hoặc spaced repetition.

### 3.8. Learning Pet

- Hoạt động học hợp lệ tạo Learning Points; points đổi thành Food.
- User chọn pet, cho ăn để tăng Energy và nâng cấp khi đủ điều kiện.
- Backend là nguồn sự thật cho points, food, energy và level.
- Admin quản lý cấu hình thưởng, tỷ lệ quy đổi, pet, level và trạng thái pet của user.
- Ảnh Pet dùng Supabase Storage; đường dẫn asset được lưu tập trung, không lưu binary trong database.

### 3.9. SQL Practice

- User học SQL qua danh sách bài mở khóa tuần tự từ dễ đến khó.
- Mỗi bài có đề, schema 4 bảng, gợi ý, trình nhập SQL, kết quả và giải thích sau khi đúng.
- SQL user chỉ chạy trong H2 in-memory cô lập, bằng tài khoản read-only, allowlist table, timeout và giới hạn dòng; không chạy trên PostgreSQL production.
- Hoàn thành lần đầu tạo Pet reward idempotent; domain đã có loại ngôn ngữ `JAVA` làm nền, nhưng chưa chạy/chấm code Java.

### 3.10. Giao diện

- Next.js App Router, responsive và accessible cơ bản.
- UI hỗ trợ tiếng Việt/tiếng Anh; nội dung học từ backend không tự động dịch.
- Hỗ trợ Light, Dark, Coder và System theme.
- Có khu vực User, Contributor và Admin riêng nhưng dùng chung design system.

## 4. Ngoài phạm vi hiện tại

- Chấm/chạy code Java không tin cậy.
- Phỏng vấn AI, rubric AI và gọi model để chấm.
- Junior track, thanh toán, leaderboard, multiplayer.
- OAuth/social login, quên mật khẩu và xác minh email nếu backend chưa hỗ trợ.
- Realtime notification, recommendation engine hoặc LMS doanh nghiệp.
- Tự động dịch lesson/question.
- Native mobile app và microservices.

## 5. Khởi tạo dữ liệu

`initial-setup.sql` chỉ tạo:

- root `Java`;
- 8 category placeholder, mỗi category có 10 topic, mỗi topic có 20 subtopic;
- cấu hình Pet và bộ level ban đầu.

Script không tạo user, lesson thật, question/version/option, quiz, learning path hoặc runtime progress/attempt. Admin đổi tên và publish các node placeholder; sau đó Admin/Contributor chỉ cần gắn lesson thật vào đúng subtopic.
