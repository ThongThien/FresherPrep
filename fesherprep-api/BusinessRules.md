# FresherPrep — Quy tắc nghiệp vụ

## 1. Sản phẩm và quyền

### BR-01 — Đối tượng

FresherPrep phục vụ Java Backend Intern và mục tiêu đạt năng lực Fresher; không có level Junior trong phạm vi hiện tại.

### BR-02 — Miễn phí

Luồng học cốt lõi, xem lại nội dung, retry Quiz và xem giải thích không phụ thuộc thanh toán.

### BR-03 — Role

`USER`, `CONTRIBUTOR`, `ADMIN` là các role loại trừ nhau tại một thời điểm. Role do backend/database quyết định, không nhận từ request client.

### BR-04 — Authentication khác Authorization

JWT/refresh token hợp lệ xác định phiên; quyền hiện tại xác định hành động được phép. Đổi role không làm phiên mất hiệu lực. Thiếu quyền trả `403`, không biến thành `401` hoặc tự logout.

## 2. Cây kiến thức và Lesson

### BR-05 — Cây bốn tầng bắt buộc

Quan hệ hợp lệ duy nhất:

```text
TECHNOLOGY (không có parent)
→ CATEGORY
→ TOPIC
→ SUBTOPIC
```

Không bỏ tầng và không gắn node vào parent sai type.

### BR-06 — Lesson khác Subtopic

Subtopic là đơn vị phân loại kiến thức; Lesson là nội dung học. Một Lesson thuộc đúng một Subtopic, còn một Subtopic có thể chứa nhiều Lesson.

### BR-07 — Trạng thái nội dung

Nội dung dùng `DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`. User thường chỉ thấy `PUBLISHED`; parent của nội dung publish phải publish khi domain yêu cầu.

### BR-08 — Xóa cây

Chỉ node `DRAFT` hoặc `ARCHIVED` được xóa. Admin phải xác nhận ở UI; backend xóa toàn bộ descendants trong cùng subtree. Ràng buộc dữ liệu tham chiếu phải chặn việc làm mất Lesson/Question ngoài ý muốn.

### BR-09 — Nội dung Lesson an toàn

HTML Lesson phải được sanitize ở backend. Ảnh lưu ở object storage, database chỉ lưu URL/path. Lesson cũ dạng plain text vẫn được hỗ trợ.

### BR-10 — Reading qualification

Lesson đạt điều kiện đọc khi cả `activeSeconds >= minimumReadSeconds` và `maxScrollPercent >= requiredScrollPercent`. Client không được gửi `readQualified=true`.

### BR-11 — Hoàn thành Lesson

- Không có assessment: hoàn thành khi đạt reading qualification.
- Có assessment: phải đạt reading qualification và pass assessment Quiz.
- Assessment Quiz phải là type `LESSON`; tỷ lệ pass hiện tại là 80%.

### BR-12 — Prerequisite

Prerequisite phải trỏ đến Lesson tồn tại, không self-reference và không tạo duplicate. Không publish Lesson khi prerequisite của nó chưa publish.

## 3. Question Bank

### BR-13 — Question logic và version

Question có code duy nhất, thuộc đúng một Subtopic. Nội dung/options nằm trong QuestionVersion bất biến; chỉnh sửa tạo version mới để không thay đổi attempt lịch sử.

### BR-14 — Bốn lựa chọn

Mỗi version có đúng 4 option, position 1–4 duy nhất và đúng 1 đáp án đúng. Các đáp án nhiễu phải hợp lý trong cùng ngữ cảnh câu hỏi, không trộn đáp án từ topic không liên quan.

### BR-15 — Publish Question

Chỉ publish một version thuộc chính Question đó, có content/explanation/options hợp lệ và Subtopic đã publish. `published_version_id` là version dùng cho attempt mới.

### BR-16 — Difficulty

`EASY`, `MEDIUM`, `HARD` mô tả độ khó câu hỏi, không đại diện cho level Intern/Fresher.

## 4. Quiz và Attempt

### BR-17 — Hai selection mode

- `FIXED`: dùng đúng Question và display position đã cấu hình.
- `RULE_BASED`: chọn Question publish theo knowledge node, difficulty tùy chọn và question count.
- Thiếu số lượng theo rule phải trả business error; không tạo attempt thiếu câu.

### BR-18 — Backend snapshot

Khi start, backend cố định QuestionVersion, thứ tự, Subtopic và thông tin Quiz. Reload hoặc Question Bank thay đổi không được thay bộ câu của attempt đã tạo.

### BR-19 — Đáp án cục bộ, submit một lần

Trong lúc làm bài, lựa chọn ở client. Khi submit, client gửi toàn bộ answers một lần. Không autosave từng answer và không thêm kiến trúc selected-answer persistence trước submit.

### BR-20 — Backend chấm điểm

Client không được đặt `isCorrect`, score hoặc pass/fail. Backend xác minh option thuộc đúng QuestionVersion rồi tính kết quả từ snapshot và pass percentage của attempt.

### BR-21 — Ownership và trạng thái

User chỉ thao tác attempt của mình. Không answer cùng attempt question hai lần, không submit attempt đã submitted và không hiển thị correct answer trước submit.

### BR-22 — Lịch sử bất biến

Question version và kết quả grading trong attempt đã submit không bị sửa theo nội dung publish mới.

## 5. Learning Path và Progress

### BR-23 — Join duy nhất

Một User chỉ join một Learning Path một lần và chỉ join Path đang ở trạng thái cho phép.

### BR-24 — Thứ tự và item

Không trùng Lesson trong cùng Path. Display order phải ổn định; required và weight được dùng theo contract hiện tại.

### BR-25 — Progress suy ra

Lesson/path completion và Dashboard/Achievement được tính từ dữ liệu gốc. Không cho client đặt completion và không tạo bảng aggregate/achievement nếu chưa có nhu cầu đo được.

## 6. Contributor và Review

### BR-26 — Quyền sở hữu draft

Contributor chỉ tạo/sửa/submit draft của mình trong phạm vi được cấp. Contributor không quản lý user, không approve/reject và không publish trực tiếp.

### BR-27 — Tách người tạo và người duyệt

Admin thực hiện review. Người tạo không tự duyệt nội dung của mình; reject phải có lý do. Review event phải lưu actor và quyết định.

### BR-28 — Publish sau validation

Approve không được bỏ qua validation riêng của Lesson/Question/Quiz. Nội dung chỉ publish khi thỏa toàn bộ rule domain.

## 7. Comment và Notification

### BR-29 — Ownership Comment

Comment thuộc đúng một User và đúng một target Lesson hoặc Quiz. User chỉ sửa/xóa comment mình; backend kiểm tra ownership, không dựa vào nút ẩn trên frontend.

### BR-30 — Notification

Comment mới tạo notification cho Admin theo cơ chế hiện tại. Mark-read chỉ ảnh hưởng notification của Admin đang xác thực.

## 8. Learning Pet

### BR-31 — Backend là nguồn sự thật

Learning Points, Food, Energy, active Pet và level chỉ thay đổi qua service backend; client không được gửi giá trị đích.

### BR-32 — Reward idempotent

Một nguồn hoạt động học chỉ thưởng một lần. Refresh, retry hoặc request lặp không được tạo point/food trùng; `pet_reward_events` lưu khóa nguồn để chống duplicate.

### BR-33 — Cho ăn

Số Food tiêu thụ phải dương, không vượt Food hiện có. Energy tăng theo cấu hình backend và thao tác phải nhất quán trong transaction.

### BR-34 — Nâng cấp

Chỉ nâng cấp khi pet chưa đạt max level và Energy đạt ngưỡng level kế tiếp. Upgrade không gọi lại API chỉ để chạy animation.

### BR-35 — Asset

Pet image lấy từ asset path cấu hình/Supabase Storage. Thiếu ảnh dùng fallback UI; không làm thay đổi trạng thái Pet.

## 9. Bảo mật và vận hành

### BR-36 — Nội dung bảo vệ

Correct answers, password hash, refresh token, secret/storage credentials và stack trace không được trả cho client không phù hợp.

### BR-37 — Rate limit và challenge

Challenge chỉ là lớp chống abuse, có TTL và không chứa password. Challenge đúng không thay thế kiểm tra email/password.

### BR-38 — Cache không là nguồn sự thật

Redis có thể cache dữ liệu đọc; PostgreSQL và service validation vẫn là nguồn sự thật. Cache lỗi phải fallback an toàn, không làm sai quyền hoặc trả dữ liệu user khác.

### BR-39 — Khởi tạo không phải học liệu

Node do `initial-setup.sql` tạo là placeholder `DRAFT`. Admin đổi tên cây; Admin/Contributor biên soạn Lesson/Question/Quiz và publish theo workflow; script không giả làm nội dung thật.
