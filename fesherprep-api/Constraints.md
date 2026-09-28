# FresherPrep — Ràng buộc

## 1. Sản phẩm

- Nền tảng miễn phí cho Java Backend Intern chuẩn bị năng lực Fresher.
- Không có Junior track, thanh toán hoặc giới hạn nhân tạo lượt học/Quiz.
- Không tuyên bố progress/readiness là bảo đảm đậu phỏng vấn.
- Không tự động dịch nội dung Lesson/Question do tác giả nhập.

## 2. Công nghệ hiện tại

### Backend

- Java, Spring Boot, Spring Security.
- Spring Data JPA/Hibernate, Bean Validation.
- Modular monolith theo domain; Controller chỉ binding/gọi Service.
- PostgreSQL trên Supabase, schema `fresherprep`.
- JWT access token + refresh token.
- Redis là cache tùy chọn/fallback được; không phải nguồn sự thật.
- Supabase Storage dùng cho Pet/Lesson assets.

### Frontend

- Next.js App Router, TypeScript.
- Server/BFF route và API client hiện có phải được tái sử dụng.
- Design tokens/components hiện có; responsive và accessible cơ bản.
- Light/Dark/Coder/System theme và UI tiếng Việt/tiếng Anh.

Không thay stack hoặc thêm dependency lớn nếu chức năng hiện tại đã giải quyết được yêu cầu.

## 3. Kiến trúc và domain

### CC-01 — Modular monolith

Không tách microservice, queue hoặc event platform khi chưa có nhu cầu vận hành thực tế.

### CC-02 — Cây kiến thức cố định bốn cấp

```text
TECHNOLOGY → CATEGORY → TOPIC → SUBTOPIC
```

Mọi nhánh phải đúng quan hệ type. Lesson/Question tham chiếu `SUBTOPIC`; chúng không phải node thứ năm trong cùng bảng.

### CC-03 — Nội dung tái sử dụng

Question có thể dùng trong nhiều Quiz. Lesson có thể dùng trong nhiều Learning Path. Không sao chép nội dung chỉ để thay đổi ngữ cảnh.

### CC-04 — Lịch sử bất biến

Attempt phải lưu QuestionVersion và snapshot Quiz/Question tại thời điểm start. Không chỉnh sửa version đã dùng để thay đổi lịch sử.

### CC-05 — Status

Các transition phải tuân theo domain hiện tại cho `DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`. Không publish bằng cập nhật trực tiếp status để bỏ qua validation.

## 4. Dữ liệu

- Entity/schema hiện tại là source of truth; không thêm cột/bảng khi có thể suy ra dữ liệu đúng và hiệu quả.
- Foreign key, unique constraint và optimistic locking phải được giữ.
- Slug/code là định danh nghiệp vụ ổn định và duy nhất trong phạm vi đã khai báo.
- Collection có thể tăng theo thời gian phải pagination.
- Không trả Entity trực tiếp nếu DTO kiểm soát dữ liệu tốt hơn.
- Dashboard, achievement và path completion được derive; chưa có bảng aggregate riêng.
- Runtime data (refresh token, progress, join, attempts, answers, user pet) phải sinh qua nghiệp vụ/API, không qua seed.
- Script setup phải idempotent và chỉ cleanup đúng bộ seed legacy đã định danh; không xóa dữ liệu production khác.

## 5. Question và Quiz

- `Question.code` và `Quiz.code` đã tồn tại; không tạo lại/đổi tên.
- QuestionVersion bất biến; update nội dung tạo revision mới.
- Mỗi version có đúng 4 option, position 1–4 và đúng 1 correct.
- Question publish cần published version hợp lệ và Subtopic publish.
- Quiz `FIXED` giữ display position; `RULE_BASED` phải đủ question publish theo từng rule.
- Attempt snapshot QuestionVersion; backend chấm score/pass/fail.
- Không expose correct option trong active attempt.
- Không thay đổi kiến trúc:

```text
Start → lưu snapshot → answers cục bộ → submit một lần
→ backend grade → result
```

- Không thêm answer autosave, request theo từng answer hoặc selected-answer persistence trước submit.
- Client timeout không được dùng để tự quyết điểm; enforcement cuối cùng phải dựa vào contract backend hiện có.

## 6. Lesson và nội dung

- Một Lesson thuộc đúng một Subtopic.
- Progress duy nhất theo user + lesson và cập nhật trong transaction.
- Reading qualification chỉ do backend suy ra từ active time + max scroll.
- Prerequisite không self-reference/duplicate.
- Rich content lưu HTML đã sanitize; cấm script, event handler, iframe không cần thiết, arbitrary CSS và URL scheme nguy hiểm.
- Image upload phải kiểm tra role, MIME và size; không lưu binary trong PostgreSQL.
- Nội dung plain text cũ phải tiếp tục render.

## 7. Authentication và Authorization

- Password dùng hash an toàn; không log/trả password.
- Access token invalid/expired có thể refresh; refresh thành công phải persist token mới trước khi retry.
- Refresh token invalid/revoked/expired mới làm session kết thúc.
- Đổi role không revoke refresh token hoặc invalidate session chỉ vì claim role cũ.
- Backend áp dụng quyền hiện tại; USER/CONTRIBUTOR gọi ADMIN endpoint nhận `403`.
- Ownership được kiểm tra ở Service/Repository, không dựa vào UUID khó đoán hoặc frontend.
- Secret, Supabase service key, JWT key và database credential chỉ ở biến môi trường phía server.
- CORS chỉ cho origin cấu hình; production không dùng wildcard credentials.
- Error response không lộ SQL, stack trace, filesystem path hoặc secret.

## 8. Contributor và Review

- Contributor không tự approve/publish, không sửa draft người khác và không quản lý user/role.
- Admin review phải giữ audit event.
- Reject reason bắt buộc theo workflow hiện tại.
- Approve vẫn chạy toàn bộ validation của loại nội dung.
- UI ẩn action không thay thế backend authorization.

## 9. Comment, Notification và Pet

- Comment edit/delete phải kiểm tra owner.
- Notification chỉ được đọc/mark-read bởi recipient phù hợp.
- Pet reward phải idempotent theo activity/source; retry không cộng trùng.
- Point/Food/Energy/Level không nhận dưới dạng giá trị đích từ client.
- Feed/upgrade và admin configuration phải transaction + authorization phù hợp.
- Asset Pet lưu ở Supabase Storage; database chỉ lưu path/metadata.

## 10. Cache và hiệu năng

- Redis chỉ cache dữ liệu không nhạy cảm phù hợp; key user-specific phải tách theo user.
- Cache miss/error fallback về PostgreSQL và không được bỏ qua authorization.
- Mutation phải evict/update cache liên quan.
- Không dùng fetch join collection tùy tiện cùng pagination.
- Chỉ tối ưu N+1 đã đo/quan sát; không hy sinh rule bảo mật.

## 11. UX

- Content first, interaction second, decoration last.
- Không redesign các flow đã ổn khi thêm feature mới.
- Loading/empty/error/retry và trạng thái disabled phải rõ.
- Màu sắc không là tín hiệu duy nhất; keyboard focus/touch target cần dùng được.
- Animation ngắn, tôn trọng `prefers-reduced-motion`.
- Không horizontal overflow ngoài code block/table có container cuộn chủ đích.

## 12. Khởi tạo và triển khai

- Hibernate/schema phải tồn tại trước khi chạy `initial-setup.sql`.
- Setup chỉ tạo Java root, placeholder Knowledge DRAFT và Pet configuration; không tạo học liệu thật.
- User đầu tiên được tạo bằng Register API; không seed plaintext password.
- Supabase bucket/policy và environment secret cần cấu hình riêng theo hướng dẫn triển khai.
- Swagger/Actuator/debug/test account/seed script không được public không kiểm soát ở production.
- HTTPS, security headers, backup, DB least privilege và secret rotation là checklist bắt buộc khi deploy.

## 13. Ngoài phạm vi kỹ thuật

- Coding judge/sandbox thực thi Java.
- AI interview/grading.
- OAuth, payment, leaderboard, multiplayer.
- WebSocket notification.
- Spaced repetition, recommendation engine, analytics phức tạp.
- Native mobile và hạ tầng microservice.
