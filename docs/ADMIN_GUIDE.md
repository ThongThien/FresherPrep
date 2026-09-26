# Hướng dẫn quản trị viên FresherPrep

Tài liệu này mô tả nghiệp vụ quản trị đang được triển khai. Mọi thao tác quản trị yêu cầu tài khoản `ADMIN`; backend kiểm tra quyền độc lập với giao diện.

Tên route, enum và field kỹ thuật được giữ nguyên trong dấu mã để khớp chính xác với hệ thống; toàn bộ phần hướng dẫn và giải thích được viết bằng tiếng Việt. Quy trình dành cho người đóng góp được mô tả riêng tại [Hướng dẫn cộng tác viên](./CONTRIBUTOR_GUIDE.md).

## 1. Truy cập và khu vực quản trị

Mở `/admin` hoặc chọn **Quản trị** từ App Shell. User không có role `ADMIN` bị từ chối ở cả route giao diện và API.

Các khu vực hiện có:

- Tổng quan;
- Cây kiến thức;
- Lộ trình học;
- Bài học;
- Câu hỏi;
- Bài kiểm tra;
- kiểm duyệt nội dung cộng tác viên;
- Người dùng;
- trang UI Foundation phục vụ kiểm tra component, không phải nghiệp vụ dữ liệu.

## 2. Hai vòng đời trạng thái

### Trạng thái nội dung

- `DRAFT`: bản nháp có thể sửa.
- `REVIEW`: đang chờ kiểm tra/xuất bản.
- `PUBLISHED`: được dùng trong luồng người học khi parent/reference cũng hợp lệ.
- `ARCHIVED`: giữ lịch sử nhưng không còn xuất hiện trong discovery thông thường.

### Trạng thái contribution

- `DRAFT`: Contributor đang soạn.
- `PENDING_REVIEW`: đã gửi Admin duyệt, Contributor không được sửa.
- `REJECTED`: bị trả lại kèm lý do, có thể chỉnh sửa và gửi lại.
- `PUBLISHED`: Admin đã duyệt và nội dung thật đã được publish.

Hai nhóm trạng thái liên quan nhưng không phải cùng một enum. Không chỉnh trực tiếp database để bỏ qua workflow.

## 3. Quy tắc chung

### Xóa và lưu lịch sử

Ưu tiên archive khi dữ liệu đã có quan hệ hoặc lịch sử. Backend có thể từ chối xóa nếu có child, progress, path item, prerequisite, assessment, version hoặc quiz attempt.

### Định danh

- UUID luôn do hệ thống quản lý.
- Knowledge slug, Lesson slug và Question code được backend sinh khi tạo và giữ ổn định.
- Learning Path slug và Quiz code là field Admin có thể nhập/sửa theo contract hiện tại; phải unique.
- Đổi tên/title không tự đổi định danh ổn định đã sinh.

## 4. Quản lý cây kiến thức

Mở `/admin/knowledge`. Cây bắt buộc theo cấu trúc:

```text
TECHNOLOGY → CATEGORY → TOPIC → SUBTOPIC
```

Technology là root. Các node khác phải có parent đúng loại. Admin có thể tạo, xem, đổi name/type/parent hợp lệ, display order, status, publish, archive và xóa khi an toàn.

Quy tắc chính:

- không tạo quan hệ sai tầng hoặc vòng lặp;
- publish parent trước child;
- không archive parent khi còn published child;
- node chỉ được xóa khi không còn child/reference được bảo vệ;
- slug hệ thống không sửa qua form update.

## 5. Quản lý lộ trình học

Mở `/admin/learning-paths`.

Learning Path có name, slug, Technology và status. Technology được chọn khi tạo; update hiện tại chỉ đổi các field contract cho phép.

Mỗi item liên kết một Lesson và có:

- `displayOrder`: thứ tự học;
- `required`: có thuộc điều kiện hoàn thành path hay không;
- `weight`: trọng số tính phần trăm.

Quy tắc:

- không thêm một lesson hai lần;
- display order không trùng; khi đổi vị trí service sắp lại an toàn;
- weight phải dương;
- path đã publish chỉ chứa lesson đã publish;
- path đã có user tham gia không được hard-delete.

Tiến độ được tính theo weight của required items. Path hoàn thành khi có required items và tất cả required items đã hoàn thành.

Thứ tự item cũng là thứ tự mở khóa lesson đối với user đã tham gia: lesson đứng sau bị khóa bởi lesson chưa hoàn thành đầu tiên.

## 6. Quản lý bài học

Mở `/admin/lessons`. Lesson phải thuộc một `SUBTOPIC`.

Field chính:

- title và content;
- display order;
- system slug;
- `minimumReadSeconds`;
- `requiredScrollPercent`;
- status.

`minimumReadSeconds` hiện là metadata theo dõi, không phải điều kiện pass. `requiredScrollPercent` quyết định reading qualification.

### Bài học tiên quyết

Admin có thể thêm/xóa prerequisite. Backend từ chối:

- self-reference;
- duplicate;
- cycle;
- lesson không tồn tại;
- prerequisite chưa publish cho một lesson đã publish.

### Bài đánh giá

Mỗi lesson có tối đa một assessment quiz. Assessment hợp lệ phải:

- tham chiếu quiz tồn tại;
- là quiz type `LESSON`;
- có pass percentage 80%;
- có phạm vi question phù hợp với Subtopic của lesson;
- được publish trước khi lesson có assessment được publish.

Muốn thay assessment, xóa quan hệ cũ rồi gán quiz mới. Xóa quan hệ không xóa quiz hoặc attempt lịch sử.

### Điều kiện hoàn thành

- Không assessment: reading qualified là completed.
- Có assessment: phải reading qualified **và** pass assessment.

Không xem active time là điều kiện hoàn thành. Không xem pass assessment đơn lẻ là đủ nếu user chưa đạt mức cuộn.

## 7. Quản lý ngân hàng câu hỏi

Mở `/admin/questions`. Mô hình:

```text
Question logic → QuestionVersion bất biến → 4 QuestionOption
```

Question có Subtopic, code unique, difficulty, language, category, status và `publishedVersionId`.

Mỗi version phải có:

- version number kế tiếp hợp lệ;
- question content và explanation;
- đúng bốn option ở position 1–4;
- đúng một option correct;
- explanation cho từng option.

Không sửa version đã có theo kiểu mutable update. Khi thay nội dung, tạo revision/version mới. Publish một version sẽ cập nhật `publishedVersionId`. Attempt đã bắt đầu vẫn giữ `questionVersionId` cũ nên lịch sử không thay đổi.

Question đã có version history hoặc được quiz tham chiếu không hard-delete tùy tiện; dùng archive khi cần giữ lịch sử.

## 8. Quản lý bài kiểm tra

Mở `/admin/quizzes`.

Field chính:

- code unique, title;
- type: `LESSON`, `TOPIC`, `MIXED`, `READINESS`;
- selection mode: `FIXED` hoặc `RULE_BASED`;
- language, category;
- pass percentage, maximum score;
- time limit tùy chọn;
- status.

### FIXED

Admin thêm question với position dương và không trùng. Question phải có published version hợp lệ và tương thích scope/language/category của quiz.

### RULE_BASED

Mỗi rule có knowledge node, difficulty tùy chọn và `questionCount` dương. Rule không được overlap gây chọn trùng/không rõ ràng. Khi publish và khi start, backend đều kiểm tra đủ question hợp lệ.

### Snapshot và timeout

Khi start, backend lưu danh sách question thực tế, version, thứ tự, subtopic, quiz title và pass threshold vào attempt. Không chọn lại sau reload.

Deadline do backend quyết định. Answer nhận sau `expiresAt` bị bỏ qua và attempt được chốt tại deadline. Không thay đổi sang autosave/per-answer architecture.

Quiz có attempt history hoặc đang được Lesson Assessment tham chiếu không được xóa tùy tiện.

## 9. Kiểm duyệt nội dung cộng tác viên

Mở `/admin/reviews`. Admin có thể lọc theo type, status, contributor và xem nội dung cùng lịch sử action.

Luồng duyệt:

```text
Contributor tạo/sửa DRAFT
→ gửi duyệt
→ PENDING_REVIEW
→ Admin duyệt và publish
   hoặc từ chối kèm lý do
```

### Duyệt

Chọn **Duyệt và xuất bản**. Backend khóa submission trong transaction, kiểm tra người duyệt không phải chính contributor, validate nội dung và publish entity tương ứng. Submission chuyển `PUBLISHED` và ghi review history.

### Từ chối

Lý do từ chối là bắt buộc. Nội dung thật được trả về trạng thái `DRAFT`, submission chuyển `REJECTED`, lưu reviewer, thời gian và comment. Contributor có thể sửa rồi gửi lại.

Admin không được tự duyệt contribution do chính mình sở hữu, kể cả khi tài khoản có quan hệ role đặc biệt.

## 10. Quản lý người dùng và vai trò

Mở `/admin/users`. Chức năng hiện có:

- danh sách phân trang;
- tìm theo display name/email;
- lọc `USER`, `CONTRIBUTOR`, `ADMIN`;
- lọc active/inactive;
- xem thống kê learning path, lesson, quiz và hoạt động gần đây;
- đổi role;
- activate/deactivate tài khoản.

Quy tắc an toàn:

- Admin không thể tự deactivate;
- Admin không thể tự bỏ quyền `ADMIN`;
- đổi role hoặc deactivate thu hồi refresh token đang hoạt động;
- request dùng access token với role/active state cũ bị từ chối;
- không trả password hash, refresh token hoặc secret trong response.

Gán `CONTRIBUTOR` để cấp quyền vào `/contributor`. Gán role không tự chuyển ownership của contribution cũ.

## 11. Trang tổng quan quản trị

`/admin` hiển thị tổng quan và liên kết nhanh tới các khu vực quản lý. Đây là visibility vận hành, không phải hệ thống analytics riêng. Nếu metric không tải được, giao diện báo unavailable thay vì tự tạo số.

## 12. Mã lỗi và xử lý sự cố

- `400`: request hoặc field không hợp lệ.
- `401`: chưa xác thực, token sai/hết hạn hoặc phiên không còn hợp lệ.
- `403`: đã đăng nhập nhưng không đủ quyền.
- `404`: resource không tồn tại hoặc không được phép lộ.
- `409`: duplicate hoặc trạng thái nghiệp vụ xung đột.
- `429`: vượt giới hạn request ở endpoint xác thực.

### Xuất bản thất bại

Kiểm tra parent đã publish, reference hợp lệ, question version, quiz capacity, prerequisite và assessment.

### Xóa thất bại

Ưu tiên archive. Kiểm tra child, progress, membership, prerequisite, assessment, version và attempt history.

### Bài học không hoàn thành như dự kiến

Kiểm tra `readQualifiedAt` trước. Nếu có assessment, kiểm tra thêm ít nhất một submitted attempt pass. Active seconds không phải điều kiện.

### Cộng tác viên không sửa được

Submission `PENDING_REVIEW` bị khóa chỉnh sửa. Nội dung `REJECTED` phải được mở lại từ workspace Contributor. Published lesson/quiz không sửa bằng contributor flow; published question chỉ tạo revision mới.

## 13. Lưu ý production

- Swagger/OpenAPI bị tắt trong profile production.
- Không dùng database owner làm runtime credential; dùng role tối thiểu.
- Không đưa secret vào frontend hoặc Git.
- Redis là cache tùy chọn, không phải nguồn dữ liệu gốc.
- Authorization phải giữ ở backend, không dựa vào menu ẩn.
