# FresherPrep — Quy tắc nghiệp vụ

## BR-01 — Truy cập miễn phí

Nội dung học cốt lõi, giải thích, làm lại và ôn tập không bị giới hạn bởi gói trả phí hoặc quota lượt làm.

## BR-02 — Đối tượng và đầu ra

Sản phẩm phục vụ ứng viên Java Intern và người chuẩn bị phỏng vấn Fresher. V1 có một mục tiêu đầu ra là **sẵn sàng phỏng vấn Fresher**; không có cấp/lộ trình Junior.

## BR-03 — Luồng học

Luồng mặc định là:

**Đọc lesson → đạt bài kiểm tra lesson → ôn quiz tổng hợp → luyện phỏng vấn → xem tiến độ.**

Người dùng có thể quay lại nội dung đã hoàn thành bất kỳ lúc nào.

## BR-04 — Hoàn thành lesson

Lesson chỉ được tính hoàn thành khi người dùng đạt điều kiện đọc được cấu hình và đạt quiz bắt buộc gắn với lesson. Mở trang hoặc chỉ tăng thời gian xem không đủ để hoàn thành.

## BR-05 — Question có thể tái sử dụng

Question là nội dung độc lập, không thuộc độc quyền một quiz. Một question có thể được dùng trong quiz lesson, quiz topic, readiness assessment và luồng ôn tập.

## BR-06 — Quiz do backend tạo

Backend chọn câu theo quiz cố định hoặc quy tắc đã cấu hình. Frontend không được tự quyết đáp án đúng, tự thay bộ câu hỏi hoặc bỏ qua phạm vi topic/subtopic.

## BR-07 — Bốn lựa chọn cùng chủ đề

Mỗi quiz question V1 có đúng bốn lựa chọn và đúng một đáp án đúng. Ba đáp án nhiễu được lưu cùng phiên bản question đó, phải hợp lý trong cùng topic/subtopic; không lấy option từ question hoặc topic khác.

## BR-08 — Chấm đáp án ở backend

Backend xác định đúng/sai. Không tin cờ `isCorrect` hoặc điểm số do client gửi lên. Đáp án đúng không được trả trước khi attempt được nộp.

## BR-09 — Attempt ổn định

Khi attempt bắt đầu, danh sách câu, thứ tự và phiên bản question phải được cố định. Việc sửa Question Bank sau này không làm thay đổi lịch sử đã có.

## BR-10 — Giải thích bắt buộc

Question đã xuất bản phải có giải thích đáp án đúng và lý do các lựa chọn sai không phù hợp. Có thể bổ sung liên hệ kiến thức hoặc lưu ý phỏng vấn.

## BR-11 — Difficulty độc lập với mục tiêu đầu ra

`Difficulty` mô tả độ thử thách của question/bài học (ví dụ Easy/Medium/Hard). “Intern” mô tả đối tượng; “sẵn sàng Fresher” là mục tiêu lộ trình. Không dùng difficulty thay cho cấp nghề nghiệp hoặc ngược lại.

## BR-12 — Phạm vi topic

Quiz theo subtopic chỉ lấy question thuộc subtopic đó. Quiz trộn nhiều topic chỉ được phép khi cấu hình quiz khai báo rõ từng phạm vi và số câu.

## BR-13 — Tiến độ dựa trên lịch sử

Tiến độ dùng dữ liệu lesson, quiz, coding và interview đã lưu; không chỉ dựa vào điểm attempt gần nhất. Giữ lịch sử để người dùng theo dõi cải thiện.

## BR-14 — Dashboard được tổng hợp

Số quiz, câu đã trả lời/đúng/sai, lesson hoàn thành và tiến độ topic được tính từ dữ liệu hoạt động gốc. Không duy trì các bảng đếm trùng trong V1 nếu chưa cần tối ưu hiệu năng.

## BR-15 — Readiness là chỉ báo học tập

Điểm/thanh tiến độ Fresher-ready dựa trên lesson và assessment bắt buộc của lộ trình. Nó giúp người dùng xác định phần cần ôn, không đảm bảo kết quả tuyển dụng.

## BR-16 — AI chỉ hỗ trợ đánh giá phỏng vấn

AI đánh giá dựa trên rubric phù hợp mục tiêu Intern/Fresher. Feedback mang tính tham khảo; cần lưu câu trả lời gốc, rubric/ngữ cảnh và kết quả để người dùng xem lại. AI không chấm quiz trắc nghiệm thông thường.

## BR-17 — Nội dung đã xuất bản

Người dùng thường chỉ truy cập nội dung `PUBLISHED`. `DRAFT`, `REVIEW` và `ARCHIVED` chỉ dành cho admin hoặc chế độ preview được bảo vệ.

## BR-18 — Mở rộng có kiểm soát

Mô hình kiến thức tham chiếu Technology thay vì hard-code Java vào mọi quan hệ, nhưng V1 chỉ cần nội dung Java. Tính năng mới phải phục vụ học Java, luyện tập hoặc chuẩn bị phỏng vấn Intern/Fresher.

## BR-19 — Ưu tiên đơn giản

Recommendation nâng cao, adaptive difficulty, spaced repetition, nhiều ngôn ngữ và analytics phức tạp không phải điều kiện để hoàn thành luồng học cốt lõi.
