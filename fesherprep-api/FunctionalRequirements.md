# FresherPrep — Yêu cầu chức năng

## 1. Tài khoản, xác thực và quyền

### FR-01 — Tài khoản

User có thể đăng ký, đăng nhập, logout, refresh phiên, xem user hiện tại và cập nhật thông tin cơ bản. Email/username phải hợp lệ và duy nhất; mật khẩu không được lưu plaintext.

### FR-02 — Phiên đăng nhập

Backend cấp JWT access token ngắn hạn và refresh token có thể revoke. Frontend phải lưu token mới sau khi refresh thành công và chỉ xóa phiên khi refresh thật sự không hợp lệ/hết hạn/bị revoke hoặc user không còn hoạt động.

### FR-03 — Role

Hệ thống dùng enum `USER`, `CONTRIBUTOR`, `ADMIN` trong `users.role`. Đổi role không tự revoke refresh token. Endpoint thiếu quyền trả `403`; endpoint chưa xác thực hoặc phiên không hợp lệ trả `401`.

### FR-04 — Chống lạm dụng đăng nhập

Rate limit áp dụng cho register/login/refresh. Sau số lần thất bại được cấu hình, login yêu cầu Java knowledge challenge có ID, hạn dùng và trạng thái dùng một lần. Câu trả lời không nằm trong HTML/JavaScript frontend.

## 2. Cây kiến thức

### FR-05 — Cấu trúc

Admin quản lý cây bốn tầng bắt buộc:

```text
TECHNOLOGY → CATEGORY → TOPIC → SUBTOPIC
```

Node có name, slug duy nhất, type, status, display order và parent. Quan hệ cha/con sai type phải bị từ chối.

### FR-06 — Truy cập cây

Khách/User chỉ xem node `PUBLISHED`. Admin xem và quản lý mọi trạng thái. Contributor có thể chọn node phù hợp để tạo nội dung theo quyền hiện tại.

### FR-07 — Xóa node

Chỉ node `DRAFT` hoặc `ARCHIVED` được xóa. Khi Admin xác nhận, backend xóa node cùng cây con; nếu vẫn có dữ liệu nghiệp vụ tham chiếu thì phải trả conflict thay vì làm mất dữ liệu ngoài ý muốn.

## 3. Lesson

### FR-08 — Quản lý Lesson

Admin tạo, sửa, publish, archive, gán Lesson vào đúng một `SUBTOPIC`, đặt display order, minimum read seconds, required scroll percent và prerequisite. Không cho self-reference prerequisite.

### FR-09 — Nội dung giàu định dạng

Admin/Contributor dùng Rich Text Editor. Backend sanitize HTML trước khi lưu; loại bỏ script, event handler, iframe, `javascript:` URL và style nguy hiểm. Nội dung plain text cũ vẫn phải hiển thị được.

### FR-10 — Ảnh Lesson

Người có quyền upload ảnh hợp lệ lên Supabase Storage rồi chèn URL/path vào content. Validate MIME, dung lượng và quyền; database không lưu binary.

### FR-11 — Đọc và progress

User chỉ mở Lesson đã publish. Backend tạo tối đa một `lesson_progress` cho mỗi user + lesson, cập nhật `active_seconds`, `last_viewed_at`, `max_scroll_percent`, `read_qualified_at` và dùng optimistic locking.

### FR-12 — Hoàn thành Lesson

Reading qualification đạt khi đủ cả thời gian đọc tối thiểu và tỷ lệ cuộn. Lesson không có assessment hoàn thành khi đủ đọc. Lesson có assessment chỉ hoàn thành khi đủ đọc và có quiz attempt pass.

## 4. Learning Path

### FR-13 — Quản lý Path

Admin CRUD Learning Path, trạng thái publish/archive và items. Mỗi item gắn Lesson, có display order, required và weight; không trùng Lesson trong cùng Path.

### FR-14 — Học theo Path

User xem path publish, join một lần, xem path đã join và lesson theo thứ tự. Progress/completion được tính từ trạng thái Lesson theo required/weight hiện có, không nhận giá trị completion trực tiếp từ client.

## 5. Question Bank

### FR-15 — Logical Question

Admin quản lý Question có `code` duy nhất, difficulty, language, category, status và đúng một `SUBTOPIC`.

### FR-16 — Phiên bản Question

Question có nhiều `QuestionVersion` bất biến. Sửa nội dung tạo revision mới với version number kế tiếp; không sửa lịch sử đã dùng. `published_version_id` trỏ đến phiên bản đang xuất bản.

### FR-17 — Options và publish

Mỗi phiên bản hợp lệ có đúng 4 option, position 1–4 không trùng, đúng 1 option correct, content/explanation hợp lệ. Chỉ publish khi subtopic đã publish và phiên bản hợp lệ.

### FR-18 — Batch Question

Admin/Contributor có thể tạo batch theo contract hiện tại. Mỗi phần tử vẫn phải qua cùng validation code/subtopic/version/options; batch lỗi không được tạo dữ liệu nửa chừng.

## 6. Quiz và Attempt

### FR-19 — Quản lý Quiz

Admin quản lý Quiz với `code` duy nhất, title, type, selection mode, status, language, category, maximum score, pass percentage và duration khi có.

### FR-20 — FIXED và RULE_BASED

- `FIXED`: quản lý danh sách Question publish và display position duy nhất.
- `RULE_BASED`: mỗi rule chọn theo knowledge node, difficulty tùy chọn và question count dương.
- Không publish Quiz có cấu hình thiếu hoặc không hợp lệ.

### FR-21 — Assessment

Admin gắn tối đa một assessment Quiz cho Lesson. Quiz assessment phải có type `LESSON`, đã publish khi Lesson publish và dùng pass percentage 80 theo domain hiện tại.

### FR-22 — Start Attempt

Chỉ start Quiz publish. Backend chọn Question một lần, yêu cầu RULE_BASED đủ số lượng và lưu snapshot vào attempt: quiz title, pass percentage, language/category/score/duration, question, question version, subtopic và thứ tự. Reload không chọn lại câu.

### FR-23 — Submit và chấm điểm

Frontend giữ lựa chọn cục bộ rồi submit một lần. Backend kiểm tra ownership, answer thuộc attempt question, option thuộc đúng version, ngăn duplicate và submit lần hai; backend tính score, đúng/sai và pass/fail. Không trả đáp án đúng trong active attempt.

### FR-24 — Kết quả và lịch sử

User xem attempt của chính mình, lịch sử, số câu đúng/sai/chưa trả lời, score, pass/fail, đáp án và explanation sau khi submit. Admin không được dựa vào frontend để bảo vệ ownership.

## 7. Contributor và kiểm duyệt

### FR-25 — Workspace Contributor

Contributor tạo và sửa draft nội dung theo phạm vi service hiện tại, xem trạng thái của mình và gửi review. Contributor không được sửa draft của người khác, tự approve hoặc tự publish.

### FR-26 — Review

Admin xem review queue, approve để publish hoặc reject. Reject bắt buộc có lý do khi review comment được hỗ trợ. Hệ thống lưu `content_submissions` và `content_review_events` để truy vết reviewer, thời điểm và quyết định.

## 8. Bình luận và thông báo

### FR-27 — Comment

Authenticated user xem/tạo comment trên Lesson/Quiz; chỉ tác giả được sửa/xóa comment của mình, Admin có quyền quản trị theo endpoint hiện tại. Không cho gắn một comment đồng thời vào cả Lesson và Quiz.

### FR-28 — Admin Notification

Comment mới tạo notification cho Admin. Admin xem unread count/danh sách, mở đúng nội dung/comment và đánh dấu một hoặc nhiều notification đã đọc. Không bắt buộc realtime.

## 9. Dashboard, Progress và Learning Games

### FR-29 — Dashboard/Progress

Hiển thị path progress, Lesson đã hoàn thành/đang học và Quiz history từ dữ liệu thật. Achievement được derive từ progress hiện có; không bịa metric hoặc tạo bảng tổng hợp nếu chưa cần.

### FR-30 — Learning Games

Flashcard/Matching dùng nội dung đã publish. UI có progress, remembered/not remembered, matched/correct/incorrect/completion; không yêu cầu lưu game state, leaderboard hay spaced repetition.

## 10. Learning Pet

### FR-31 — Phần thưởng

Lesson completion và Quiz pass hợp lệ tạo Learning Points đúng một lần cho mỗi nguồn hoạt động. Points được quy đổi thành Food theo cấu hình backend.

### FR-32 — Nuôi và nâng cấp

User xem collection, chọn active pet, dùng Food để tăng Energy và upgrade khi đủ ngưỡng. Backend khóa/transaction các thao tác cần thiết, không nhận trực tiếp point/food/energy/level do client đặt.

### FR-33 — Quản trị Pet

Admin cấu hình điểm thưởng, points-per-food, energy-per-food, danh mục Pet, level, asset path, maximum level và có thể xem/quản lý trạng thái Pet user theo API hiện tại.

## 11. UI và vận hành

### FR-34 — Giao diện

Frontend hỗ trợ desktop/tablet/mobile, keyboard/focus cơ bản, loading/empty/error/retry, tiếng Việt/tiếng Anh và Light/Dark/Coder/System. Preference ngôn ngữ/theme được persist; nội dung học không tự dịch.

### FR-35 — Lỗi thống nhất

API dùng error response thống nhất gồm status, code, message, timestamp/field errors khi phù hợp. Validation `400`, authentication `401`, authorization `403`, not found `404`, conflict/state `409`.

### FR-36 — Initial setup

`initial-setup.sql` phải idempotent và chỉ tạo cấu trúc placeholder Java + Pet setup. Không seed user, Lesson, Question, option, Quiz, attempt hoặc progress. Node placeholder mặc định `DRAFT`.

## 12. Bảng dữ liệu hiện có

| Nhóm | Bảng |
|---|---|
| Tài khoản | `users`, `refresh_tokens` |
| Kiến thức/Lesson | `knowledge_nodes`, `lessons`, `lesson_prerequisites`, `lesson_progress` |
| Learning Path | `learning_paths`, `learning_path_items`, `user_learning_paths` |
| Question/Quiz | `questions`, `question_versions`, `question_options`, `quizzes`, `quiz_rules`, `quiz_fixed_questions`, `lesson_assessments`, `quiz_attempts`, `quiz_attempt_questions`, `quiz_attempt_answers` |
| Review | `content_submissions`, `content_review_events` |
| Tương tác | `content_comments`, `admin_notifications` |
| Pet | `pet_settings`, `pets`, `pet_level_configs`, `user_pets`, `pet_reward_events` |

Không có bảng coding, AI interview, bookmark, achievement, game progress hoặc dashboard aggregate trong phạm vi đã triển khai.
