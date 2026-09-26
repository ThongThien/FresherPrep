# Hướng dẫn người học FresherPrep

Tài liệu này mô tả các chức năng dành cho người học đang có trong hệ thống. Các trạng thái và kết quả học tập do backend quyết định; giao diện không tự tạo điểm số hoặc tự đánh dấu hoàn thành.

Tên route, enum và field kỹ thuật được giữ nguyên trong dấu mã để khớp chính xác với hệ thống; toàn bộ phần hướng dẫn và giải thích được viết bằng tiếng Việt.

## 1. Vai trò và luồng học chính

Tài khoản mới có vai trò `USER`. Luồng học chuẩn:

```text
Đăng ký hoặc đăng nhập
→ tham gia lộ trình đã xuất bản
→ học lesson theo thứ tự
→ đạt yêu cầu đọc
→ làm assessment nếu lesson có yêu cầu
→ hoàn thành lesson
→ theo dõi tiến độ lộ trình
```

Các vai trò khác:

- `CONTRIBUTOR`: có thêm khu vực đóng góp nội dung. Xem [Hướng dẫn cộng tác viên](./CONTRIBUTOR_GUIDE.md).
- `ADMIN`: có thêm khu vực quản trị. Xem [Hướng dẫn quản trị](./ADMIN_GUIDE.md).

Việc ẩn hoặc hiện menu không phải cơ chế bảo mật. Backend vẫn kiểm tra quyền ở từng API.

## 2. Đăng ký, đăng nhập và phiên làm việc

### Đăng ký

Mở `/register`, nhập tên hiển thị, email và mật khẩu từ 8 đến 72 ký tự. Email phải hợp lệ và chưa tồn tại. Sau khi đăng ký thành công, hệ thống đăng nhập và chuyển vào khu vực học tập.

Mật khẩu được backend băm trước khi lưu, không lưu dạng văn bản thuần.

### Đăng nhập

Mở `/login` và nhập email, mật khẩu. Nếu trước đó người dùng bị chuyển tới trang đăng nhập từ một trang được bảo vệ, hệ thống sẽ quay lại trang phù hợp sau khi xác thực.

Frontend lưu access token và refresh token trong cookie `HttpOnly`; mã JavaScript phía trình duyệt không đọc trực tiếp được token. Khi access token hết hạn, lớp BFF thử refresh một lần rồi gửi lại request. Refresh token cũ không thể tái sử dụng sau khi đã được xoay vòng.

### Đăng xuất

Chọn **Đăng xuất** tại header hoặc trang hồ sơ. Backend thu hồi refresh token và frontend xóa cookie xác thực. Thao tác này không xóa tài khoản hoặc lịch sử học.

Nếu tài khoản bị vô hiệu hóa hoặc role bị thay đổi, token cũ không tiếp tục giữ quyền cũ ở request tiếp theo.

## 3. Điều hướng

Khu vực người học gồm:

- **Dashboard**: `/dashboard`
- **Lộ trình học**: `/learning-paths`
- **Quiz**: `/quizzes`
- **Trò chơi học tập**: `/games`
- **Tiến độ**: `/progress`
- **Hồ sơ**: `/profile`

Giao diện hỗ trợ tiếng Việt/tiếng Anh và Light/Dark/System. Ngôn ngữ giao diện không tự dịch nội dung lesson, question hoặc answer lấy từ backend.

## 4. Trang tổng quan và thành tựu

Trang tổng quan tổng hợp dữ liệu thật từ các bảng tiến độ, lộ trình và lượt làm bài kiểm tra, gồm:

- lộ trình đang học;
- bài học nên tiếp tục;
- hoạt động bài học và bài kiểm tra gần đây;
- số liệu học tập;
- các thành tựu phù hợp với dữ liệu hiện có.

Thành tựu được suy ra từ tiến độ, không phải hệ thống XP, coin hoặc leaderboard riêng. Nếu một nguồn dữ liệu phụ bị lỗi, section tương ứng có thể retry mà không làm hỏng toàn bộ Dashboard.

## 5. Cấu trúc kiến thức và lộ trình học

Nội dung được tổ chức theo:

```text
Technology → Category → Topic → Subtopic
```

Người học tiếp cận cấu trúc này thông qua các lộ trình, bài học và phạm vi bài kiểm tra đã xuất bản.

### Xem và tham gia lộ trình

Mở `/learning-paths` để xem các lộ trình `PUBLISHED`. Trang chi tiết hiển thị công nghệ, danh sách bài học theo `displayOrder`, bài học bắt buộc/tùy chọn và tiến độ hiện tại.

Chọn **Tham gia** để tạo membership. Một user không thể tham gia cùng một lộ trình hai lần. Lộ trình không còn ở trạng thái `PUBLISHED` không nhận thành viên mới.

### Học tuần tự

Trong lộ trình đã tham gia, bài học sau bị khóa cho tới khi bài học chưa hoàn thành đầu tiên đứng trước nó được hoàn thành. Backend kiểm tra quy tắc này khi:

- mở bài học;
- xem bài học tiên quyết;
- bắt đầu tiến độ;
- cập nhật tiến độ.

Không thể bỏ qua khóa chỉ bằng cách nhập URL bài học trực tiếp.

### Tiến độ lộ trình

Phần trăm được tính trên các bài học `required` và `weight`:

```text
tổng trọng số của bài học bắt buộc đã hoàn thành
÷ tổng trọng số của toàn bộ bài học bắt buộc
× 100
```

Lộ trình hoàn thành khi có ít nhất một bài học bắt buộc và tất cả bài học bắt buộc đều hoàn thành. Bài học tùy chọn vẫn xuất hiện trong tiến độ nhưng không thay thế bài học bắt buộc.

## 6. Đọc bài học và ghi nhận tiến độ

Chỉ bài học `PUBLISHED` dưới cây kiến thức hợp lệ mới dành cho người học. Trang bài học có nội dung đọc, khối mã nguồn, bài học tiên quyết, tiến độ và điều hướng trước/sau khi có đủ ngữ cảnh lộ trình.

### Bắt đầu và tiếp tục

Khi mở bài học, frontend gọi thao tác bắt đầu hoặc tiếp tục. Mỗi cặp người dùng + bài học chỉ có một bản ghi `lesson_progress`; tải lại trang không tạo bản ghi trùng.

Các dữ liệu chính:

- `activeSeconds`: thời gian hoạt động đã được backend chấp nhận;
- `lastViewedAt`: lần ghi nhận gần nhất;
- `maxScrollPercent`: mức cuộn cao nhất;
- `readQualifiedAt`: thời điểm đạt yêu cầu đọc.

### Thời gian hoạt động

Thời gian chỉ tăng khi trang bài học đang mở, tab đang hiển thị và tài liệu đang hoạt động. Frontend gửi theo đợt, không gửi mỗi giây. Backend chỉ nhận số giây phù hợp với khoảng thời gian thực giữa hai lần đồng bộ.

Hiện tại `minimumReadSeconds` là dữ liệu theo dõi/tham khảo, không quyết định đạt hay trượt lesson.

### Đạt yêu cầu đọc

Bài học đạt yêu cầu đọc khi `maxScrollPercent` đạt `requiredScrollPercent`. Khi đó backend đặt `readQualifiedAt`. Cuộn trang chỉ là một phần điều kiện hoàn thành nếu bài học có bài đánh giá.

## 7. Bài đánh giá và hoàn thành bài học

Mỗi bài học có thể có tối đa một bài kiểm tra đánh giá.

Quy tắc hoàn thành hiện tại:

| Loại bài học | Điều kiện hoàn thành |
|---|---|
| Không có bài đánh giá | Đạt yêu cầu đọc |
| Có bài đánh giá | Đạt yêu cầu đọc **và** có ít nhất một lượt làm bài đánh giá đạt yêu cầu |

Vì vậy, đạt bài đánh giá nhưng chưa đạt mức cuộn vẫn chưa hoàn thành bài học; đạt mức cuộn nhưng chưa đạt bài đánh giá cũng chưa hoàn thành.

Giao diện chỉ mở hành động làm bài đánh giá sau khi đạt yêu cầu đọc. Bài đánh giá dùng ngưỡng đạt do backend trả về; cấu hình hiện tại yêu cầu 80%.

Nếu chưa đạt, người học có thể tạo lượt làm mới. Việc làm lại không xóa thời gian đọc hoặc lượt làm cũ. Khi bài học hoàn thành, bài học tiếp theo trong lộ trình tuần tự mới được mở.

## 8. Làm bài kiểm tra

### Loại chọn câu hỏi

- `FIXED`: dùng danh sách câu hỏi và thứ tự do người quản trị cấu hình.
- `RULE_BASED`: backend chọn câu hỏi theo node kiến thức, độ khó và số lượng tại thời điểm bắt đầu.

Nếu quy tắc không đủ câu hỏi hợp lệ đã xuất bản, backend từ chối tạo lượt làm thay vì tạo bài thiếu câu.

### Snapshot khi bắt đầu

Backend lưu cố định vào lượt làm:

- tiêu đề và ngưỡng đạt của bài kiểm tra;
- điểm tối đa, ngôn ngữ, category và thời lượng;
- danh sách câu hỏi thực tế;
- `questionVersionId`, thứ tự và subtopic.

Tải lại trang không chọn lại câu hỏi động. Việc quản trị viên xuất bản phiên bản mới không thay đổi lượt làm đã bắt đầu.

### Chọn đáp án và nộp bài

Đáp án đang chọn được giữ cục bộ trong trình duyệt và chỉ gửi một lần khi nộp bài. Hệ thống không tự lưu từng đáp án. Đáp án đúng và lời giải thích không được trả về khi lượt làm còn `IN_PROGRESS`.

Backend kiểm tra:

- lượt làm thuộc đúng người dùng;
- lựa chọn thuộc đúng câu hỏi trong lượt làm;
- lượt làm chưa được nộp;
- điểm và trạng thái đạt/chưa đạt được tính ở server.

Câu không trả lời được tính sai trong mẫu số.

### Bài kiểm tra có giới hạn thời gian

Đồng hồ đếm ngược dùng mốc `expiresAt` do backend tạo, nên tải lại trang không đặt lại thời gian. Khi đồng hồ về 0, frontend thực hiện nộp bài một lần.

Backend là nguồn quyết định thời hạn: đáp án đến server sau `expiresAt` bị bỏ qua và lượt làm được chốt tại thời hạn. Vì không tự lưu từng đáp án, người học cần giữ kết nối ổn định và nộp bài trước khi hết giờ.

### Kết quả và lịch sử

Sau khi nộp, trang kết quả có thể hiển thị điểm, phần trăm, đạt/chưa đạt, số câu đã trả lời/tổng số câu, lựa chọn của người dùng, đáp án đúng và lời giải thích. Lượt làm đã nộp là bất biến; nộp lại trả kết quả hiện có, không chấm lại bằng dữ liệu mới.

Lịch sử trên Trang tổng quan/Tiến độ phân biệt lượt đang làm và lượt đã nộp. Người dùng chỉ truy cập được lượt làm của chính mình.

## 9. Trang Tiến độ

Mở `/progress` để xem:

- lộ trình đã tham gia và phần trăm tiến độ theo trọng số;
- số bài học bắt buộc đã hoàn thành;
- bài học đang học hoặc đã hoàn thành;
- lượt làm bài kiểm tra gần đây, điểm và trạng thái đạt/chưa đạt.

Trang không tạo streak hoặc analytics giả. Một section phụ có thể lỗi độc lập và cho phép retry.

## 10. Trò chơi học tập

`/games` gồm:

- **Flashcard**: lật thẻ, chuyển trước/sau, đánh dấu đã nhớ/chưa nhớ.
- **Matching**: ghép thuật ngữ với định nghĩa, có trạng thái đúng/sai và hoàn thành.

Dữ liệu được tạo từ nội dung học hiện có khi đủ điều kiện. Đây là hoạt động ôn tập nhẹ; kết quả trò chơi không thay thế việc hoàn thành bài học, bài đánh giá hoặc lượt làm bài kiểm tra chính thức.

## 11. Hồ sơ và cài đặt

Trang `/profile` hiển thị tên, email, role, ngày tạo và avatar chữ cái. User có thể:

- đổi tên hiển thị;
- chọn Light, Dark hoặc System;
- chọn tiếng Việt hoặc tiếng Anh;
- đăng xuất.

Theme và ngôn ngữ được lưu trên trình duyệt hiện tại. Xóa site storage sẽ trở về tiếng Việt và System theme. Hệ thống hiện chưa cung cấp đổi mật khẩu, quên mật khẩu, xác minh email hoặc OAuth.

## 12. Xử lý sự cố

### Bị chuyển về đăng nhập

Phiên có thể đã hết hạn, refresh token bị thu hồi, tài khoản bị khóa hoặc role đã thay đổi. Đăng nhập lại; nếu tài khoản inactive, liên hệ Admin.

### Lesson bị khóa

Quay lại lộ trình và hoàn thành lesson khóa được giao diện hiển thị. Việc đạt yêu cầu đọc nhưng chưa pass assessment vẫn chưa mở lesson sau.

### Progress chưa cập nhật

Giữ trang lesson active để lần đồng bộ tiếp theo chạy hoặc dùng **Thử lại** khi có thông báo lỗi. Không tự reload liên tục vì thời gian được gửi theo đợt.

### Quiz không bắt đầu được

Quiz có thể chưa xuất bản, rule-based quiz không đủ question, hoặc đang có attempt cần tiếp tục. Đọc thông báo nghiệp vụ từ backend.

### Theme hoặc ngôn ngữ bị đặt lại

Lựa chọn chỉ lưu trên thiết bị/trình duyệt hiện tại. Kiểm tra quyền dùng `localStorage` và việc xóa dữ liệu website.
