# Hướng dẫn cộng tác viên FresherPrep

Tài liệu này dành cho tài khoản có vai trò `CONTRIBUTOR`. Cộng tác viên tạo nội dung nháp và gửi quản trị viên kiểm duyệt; không có quyền tự xuất bản.

Tên route, enum và field kỹ thuật được giữ nguyên trong dấu mã để khớp chính xác với hệ thống; toàn bộ phần hướng dẫn và giải thích được viết bằng tiếng Việt. Quy tắc duyệt phía quản trị viên nằm trong [Hướng dẫn quản trị viên](./ADMIN_GUIDE.md).

## 1. Truy cập và phạm vi quyền

Sau khi Admin gán role `CONTRIBUTOR`, menu **Đóng góp nội dung** xuất hiện và dẫn tới `/contributor`.

Cộng tác viên được phép:

- xem contribution do chính mình tạo;
- tạo/sửa Lesson draft;
- tạo/sửa Question draft và tạo QuestionVersion;
- tạo/sửa Quiz draft;
- cấu hình fixed questions hoặc rules cho quiz của mình;
- gửi nội dung đi kiểm duyệt;
- xem trạng thái, lý do từ chối và lịch sử review;
- tạo revision mới cho Question đã publish.

Cộng tác viên không được:

- sửa contribution của người khác;
- quản lý Knowledge tree hoặc Learning Path;
- quản lý user/role;
- duyệt, từ chối hoặc publish nội dung;
- sửa published Lesson/Quiz qua contributor workflow;
- bỏ qua validation bằng cách gọi API trực tiếp.

## 2. Vòng đời nội dung đóng góp

```text
DRAFT
→ PENDING_REVIEW
→ PUBLISHED
hoặc
→ REJECTED
→ chỉnh sửa
→ DRAFT
→ gửi lại
```

- `DRAFT`: được sửa và cấu hình.
- `PENDING_REVIEW`: đã gửi; tạm khóa chỉnh sửa.
- `REJECTED`: có comment từ Admin; được sửa và gửi lại.
- `PUBLISHED`: đã được Admin duyệt và xuất bản.

Mọi lần tạo, sửa, submit, reject, approve và publish đều được ghi vào lịch sử review.

## 3. Danh sách nội dung đóng góp

Workspace hiển thị danh sách phân trang, mặc định 20 bản ghi mỗi trang. Có thể lọc theo review status, mở chi tiết, xem content snapshot và review history.

Chỉ contribution thuộc tài khoản hiện tại được trả về. ID của contribution khác không cấp quyền truy cập.

## 4. Tạo bản nháp bài học

Chọn content type `LESSON`, sau đó nhập:

- Subtopic ID hợp lệ;
- title;
- content;
- display order;
- minimum read seconds;
- required scroll percent.

Lesson luôn phải thuộc node `SUBTOPIC`. Backend sinh slug riêng và tạo entity ở trạng thái `DRAFT`.

Lưu ý nghiệp vụ:

- minimum read seconds hiện chỉ phục vụ theo dõi;
- required scroll percent quyết định reading qualification;
- Contributor không gán prerequisite hoặc assessment trong workspace hiện tại; Admin thực hiện các quan hệ này;
- sau khi lesson được publish, Contributor không sửa trực tiếp lesson đó.

## 5. Tạo bản nháp câu hỏi

Question thuộc một Subtopic và có difficulty. Workspace hiện tạo question kỹ thuật tiếng Việt với metadata `VI` và `TECHNICAL`.

Version đầu tiên yêu cầu:

- nội dung câu hỏi;
- explanation;
- đúng bốn option;
- chọn đúng một correct option.

Backend yêu cầu version number liên tục và position 1–4. Question code do backend sinh, Contributor không tự đặt.

QuestionVersion là bất biến để bảo vệ attempt history. Khi Question đã publish, chọn **Tạo revision** để tạo version kế tiếp; không sửa version cũ.

## 6. Tạo bản nháp bài kiểm tra

Nhập:

- title;
- quiz type;
- selection mode;
- pass percentage.

Workspace hiện dùng language `VI`, category `TECHNICAL`, maximum score 100 và chưa nhập time limit từ form Contributor.

Backend sinh quiz code. Contributor không tự ghi code.

### Bài kiểm tra `FIXED`

Nhập ID của published Question để thêm vào cấu hình. Position được thêm theo thứ tự hiện tại. Không được thêm question trùng hoặc question không tương thích.

### Bài kiểm tra `RULE_BASED`

Nhập Knowledge Node ID và số lượng question. Backend kiểm tra node, scope và khả năng chọn đủ question khi submit/publish.

Nếu cấu hình chưa hợp lệ hoặc không đủ question, nội dung không thể vượt qua bước chuẩn bị review/publish.

## 7. Sửa và gửi duyệt

Chỉ contribution `DRAFT` hoặc `REJECTED` được sửa. Riêng Question `PUBLISHED` có thể bắt đầu revision mới.

Trước khi chọn **Gửi duyệt**:

1. kiểm tra nội dung chi tiết;
2. kiểm tra đúng Subtopic;
3. kiểm tra bốn đáp án và correct option của Question;
4. kiểm tra fixed questions hoặc rules của Quiz;
5. xử lý toàn bộ lỗi validation đang hiển thị.

Khi submit thành công:

- submission chuyển `PENDING_REVIEW`;
- entity nội dung chuyển sang trạng thái review phù hợp;
- thời điểm gửi được lưu;
- Contributor không thể tiếp tục chỉnh sửa cho tới khi có kết quả.

## 8. Kết quả kiểm duyệt

### Được duyệt

Admin validate và publish nội dung trong một transaction. Submission chuyển `PUBLISHED`; nội dung có thể xuất hiện trong luồng người học nếu toàn bộ parent/reference cũng hợp lệ.

### Bị từ chối

Submission chuyển `REJECTED` và hiển thị lý do. Entity nội dung được đưa về `DRAFT`. Mở chi tiết, chọn sửa, xử lý comment rồi gửi lại.

Không tạo contribution mới chỉ để né comment nếu đó vẫn là cùng một nội dung.

## 9. Tạo phiên bản mới cho câu hỏi đã xuất bản

Question là loại nội dung duy nhất trong contributor workflow hiện hỗ trợ bắt đầu revision sau khi publish:

1. mở Question có status `PUBLISHED`;
2. chọn **Tạo revision**;
3. nhập nội dung/version mới;
4. lưu để submission quay lại `DRAFT`;
5. gửi Admin duyệt lại.

Published version hiện tại tiếp tục phục vụ quiz cho tới khi revision mới được duyệt. Attempt cũ luôn giữ version snapshot cũ.

## 10. Lỗi thường gặp

### Không thấy menu cộng tác viên

Tài khoản chưa có role `CONTRIBUTOR`, đã bị inactive hoặc phiên còn role cũ. Đăng nhập lại sau khi Admin đổi role.

### Không sửa được nội dung

Kiểm tra status. `PENDING_REVIEW` bị khóa; published Lesson/Quiz không hỗ trợ contributor revision; contribution của người khác luôn bị từ chối.

### Submit bị lỗi

Kiểm tra Subtopic, version/options, quiz configuration và reference đã publish. Backend không chấp nhận draft không đủ điều kiện review.

### Không đủ question cho rule

Giảm question count hoặc nhờ Admin/Contributor bổ sung published Questions đúng scope và difficulty.

### Bị từ chối

Đọc `reviewComment` và review history, sửa đúng nội dung được yêu cầu rồi gửi lại. Lý do từ chối là bắt buộc phía Admin.

## 11. Nguyên tắc nội dung

- Viết title/question rõ ràng và đúng phạm vi Subtopic.
- Ba đáp án sai phải hợp lý trong cùng chủ đề, không dùng đáp án lạc domain.
- Explanation phải giúp người học hiểu vì sao đúng/sai.
- Không chèn secret, dữ liệu cá nhân hoặc nội dung chưa được phép sử dụng.
- Không tạo duplicate chỉ để vượt qua validation hoặc quy trình review.
