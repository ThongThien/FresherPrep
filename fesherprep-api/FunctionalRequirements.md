# FresherPrep — Yêu cầu chức năng

Phần cốt lõi gồm tài khoản, tài liệu, Question Bank, quiz, lộ trình và dashboard. Coding practice, interview/AI, thành tựu và bookmark là chức năng tùy chọn; chỉ tạo bảng tương ứng khi triển khai.

## 1. Tài khoản và phân quyền

### FR-01 — Xác thực

Hệ thống hỗ trợ đăng ký, đăng nhập, đăng xuất, refresh token và phiên đăng nhập đã xác thực.

### FR-02 — Vai trò

Mỗi tài khoản có một vai trò, lưu tại `users.role` bằng enum `user_roles` gồm `USER` và `ADMIN`. Tài khoản đăng ký mới mặc định là `USER`. Không tạo bảng `roles` hoặc bảng liên kết `user_roles`.

Backend phải bảo vệ thao tác admin; không tin role do frontend gửi lên. Quyền sử dụng chức năng thông thường của admin được cấu hình ở backend. Thiết kế này dùng một role cho mỗi user.

## 2. Kiến thức và tài liệu

### FR-03 — Cây kiến thức

Tổ chức nội dung theo **Technology → Category → Topic → Subtopic**. Java là công nghệ được triển khai trong V1. Cây phải hỗ trợ truy vấn node cha/con và mở rộng về sau.

### FR-04 — Lesson

Lesson có tiêu đề, nội dung, ví dụ code tùy chọn, subtopic chính, trạng thái xuất bản và thứ tự học. Có thể khai báo prerequisite nếu bài học cần kiến thức trước.

### FR-05 — Theo dõi đọc và hoàn thành

Hệ thống lưu tiến độ theo user và lesson, gồm trạng thái, thời điểm truy cập, thời gian hoạt động và phần trăm scroll lớn nhất. Đọc đủ điều kiện chưa tự động hoàn tất lesson: người dùng còn phải đạt bài kiểm tra gắn với lesson.

### FR-06 — Lộ trình

V1 có một lộ trình Java Intern hướng tới sẵn sàng phỏng vấn Fresher. Người dùng xem được thứ tự lesson, mục bắt buộc và tiến độ. Không có lộ trình Junior.

## 3. Question Bank và Quiz

### FR-07 — Question Bank

Câu hỏi được lưu độc lập với quiz để tái sử dụng. Mỗi câu trắc nghiệm V1 có đúng bốn lựa chọn, đúng một đáp án, giải thích đáp án đúng và giải thích vì sao lựa chọn sai không phù hợp. Câu hỏi gắn với subtopic, difficulty và trạng thái xuất bản.

Ba đáp án nhiễu phải được biên soạn cùng câu hỏi và phù hợp với cùng chủ đề kiến thức. Hệ thống không lấy lựa chọn sai từ câu hỏi khác hoặc từ topic khác.

Question có phiên bản để lịch sử làm bài tham chiếu đúng nội dung đã hiển thị tại thời điểm đó.

### FR-08 — Tạo quiz

Quiz có thể là bài kiểm tra gắn với một lesson (cần đạt điểm tối thiểu để hoàn tất lesson), quiz tổng hợp lấy câu theo quy tắc (topic/subtopic, số lượng, difficulty), hoặc quiz cố định do admin chọn sẵn. Backend chọn câu và không trả đáp án đúng trước khi nộp.

### FR-09 — Lịch sử làm quiz

Mỗi lần làm tạo một attempt với thời điểm bắt đầu/nộp, điểm, trạng thái và lịch sử câu trả lời. Danh sách câu, thứ tự và phiên bản câu hỏi của attempt phải ổn định.

### FR-10 — Chấm điểm và ôn tập

Backend xác định đúng/sai và tính điểm. Sau khi nộp, người dùng xem giải thích không giới hạn, làm lại quiz và ôn các câu sai.

## 4. Dashboard; thành tựu và bookmark tùy chọn

### FR-11 — Dashboard người học

Dashboard hiển thị số lượt quiz đã hoàn thành; tổng câu đã trả lời, số đúng và sai; số lesson đã hoàn thành; tiến độ theo topic/subtopic; thanh tiến độ Java Intern → sẵn sàng Fresher; hoạt động gần đây và topic yếu.

Các số liệu được query từ `lesson_progress`, `quiz_attempts`, `quiz_attempt_questions` và `quiz_attempt_answers`, kết hợp với cây kiến thức/lộ trình. Chỉ thống kê kết quả quiz đã nộp; câu bỏ trống được tách khỏi số câu đã trả lời. Khi JOIN nhiều quan hệ một-nhiều, cần tổng hợp từng nguồn trước hoặc đếm theo đúng khóa để tránh nhân số liệu.

Thành tựu là phần hiển thị tùy chọn, được tính từ dữ liệu đã có và quy tắc backend. Ví dụ: huy hiệu “Hoàn thành 10 lượt quiz” xuất hiện khi user có ít nhất 10 attempt đã nộp. Không cần bảng `achievements` hoặc `user_achievements`. Nếu thay đổi điều kiện hoặc dữ liệu nguồn, thành tựu hiển thị có thể thay đổi; thiết kế hiện tại không lưu lịch sử trao thành tựu cố định.

Streak là tùy chọn. Có thể tính streak làm quiz theo ngày nộp attempt và múi giờ thống nhất. `lesson_progress` chỉ lưu trạng thái/thời gian tổng hợp nên không đủ để tái dựng mọi ngày đọc; muốn tính streak bao gồm hoạt động đọc thì cần bổ sung lịch sử hoạt động khi triển khai. Hiện tại chưa tạo bảng `user_activity_days`.

Dashboard không phụ thuộc coding hoặc interview/AI. Chỉ bổ sung thống kê của các phần này khi triển khai; chưa cần bảng tổng hợp dashboard riêng.

### FR-12 — Cách tính tiến độ đầu ra

Tiến độ lộ trình dựa trên lesson/bài kiểm tra bắt buộc đã đạt và trọng số do lộ trình khai báo. Có thể hiển thị riêng điểm readiness từ bài đánh giá cuối lộ trình. Thanh tiến độ là tín hiệu học tập, không phải lời bảo đảm đậu phỏng vấn.

Hoàn thành lộ trình cốt lõi không yêu cầu coding, interview/AI hoặc thành tựu.

### FR-13 — Bookmark (tùy chọn)

Khi triển khai bookmark, người dùng có thể lưu lesson và câu hỏi quiz. Bookmark câu hỏi phỏng vấn chỉ áp dụng khi có module interview. Bookmark là lựa chọn riêng của user nên cần lưu dữ liệu khi bật chức năng này.

## 5. Coding practice (tùy chọn)

Chỉ áp dụng các yêu cầu và tạo bảng của mục này khi triển khai coding practice.

### FR-14 — Bài tập Java

Bài coding có đề bài, ví dụ, constraints, starter code và test cases. Lưu từng submission và kết quả. V1 dùng mô hình đánh giá đơn giản; không xây dựng hạ tầng chấm code cạnh tranh đầy đủ.

## 6. Luyện phỏng vấn và AI (tùy chọn)

Chỉ áp dụng các yêu cầu và tạo bảng của mục này khi triển khai interview/AI.

### FR-15 — Interview session

Người dùng chọn topic/hình thức phỏng vấn Intern, nhận câu hỏi và gửi câu trả lời dạng văn bản.

### FR-16 — Rubric

Câu hỏi phỏng vấn có tiêu chí đánh giá phù hợp mục tiêu Intern/Fresher: ý chính cần có, ý bổ sung, lỗi thường gặp và câu trả lời tham khảo.

### FR-17 — AI đánh giá

Backend gửi câu trả lời cùng rubric tới dịch vụ AI và nhận phản hồi có cấu trúc: điểm, ý đã đạt, ý còn thiếu/sai, góp ý và lesson đề xuất. API key chỉ nằm ở backend; phản hồi AI phải được kiểm tra trước khi lưu.

### FR-18 — Lịch sử interview

Lưu session, câu hỏi, câu trả lời gốc, rubric/ngữ cảnh và kết quả đánh giá để người dùng xem lại.

## 7. Quản trị nội dung và thống kê

### FR-19 — Quản lý nội dung

Admin tạo, sửa, xem trước, xuất bản và lưu trữ cây kiến thức, lesson, question, quiz và lộ trình. Quản lý bài coding và câu hỏi/rubric interview chỉ áp dụng khi triển khai module tương ứng.

### FR-20 — Trạng thái nội dung

Nội dung hỗ trợ `DRAFT → REVIEW → PUBLISHED → ARCHIVED`. Người dùng thường chỉ xem nội dung đã xuất bản.

### FR-21 — Thống kê admin

Admin xem nội dung được làm nhiều, câu hay sai, topic yếu và thống kê hoàn thành cơ bản. Các số liệu này được tổng hợp từ lịch sử hoạt động.

## 8. Danh sách bảng database cho phạm vi V1

Danh sách gồm **19 bảng thuộc phần cốt lõi** và **14 bảng tùy chọn** cho coding, interview/AI và bookmark. Chưa cần tạo bảng tùy chọn khi xây dựng phần cốt lõi. Dashboard, tiến độ tổng hợp và thành tựu được truy vấn/tính từ dữ liệu gốc.

### Tài khoản và quyền

| Bảng | Mục đích |
|---|---|
| `users` | Tài khoản, thông tin người dùng và cột `role` kiểu enum `user_roles` (`USER`, `ADMIN`) |
| `refresh_tokens` | Quản lý phiên/refresh token; `user_id` tham chiếu `users.id` |

Nhóm này chỉ có hai bảng. `user_roles` là kiểu enum, không phải table.

### Cây kiến thức, lesson và lộ trình

| Bảng                   | Mục đích                                               |
| ---------------------- | ------------------------------------------------------ |
| `knowledge_nodes`      | Cây Technology/Category/Topic/Subtopic; có `parent_id` |
| `lessons`              | Tài liệu theo subtopic                                 |
| `lesson_prerequisites` | Quan hệ bài học tiên quyết, nếu có                     |
| `lesson_progress`      | Tiến độ đọc, thời gian và trạng thái lesson theo user  |
| `learning_paths`       | Định nghĩa lộ trình Java Intern → Fresher-ready        |
| `learning_path_items`  | Lesson bắt buộc, thứ tự và trọng số trong lộ trình     |
| `user_learning_paths`  | Lộ trình người dùng bắt đầu theo dõi                   |

### Question Bank, quiz và lịch sử

| Bảng                     | Mục đích                                             |
| ------------------------ | ---------------------------------------------------- |
| `questions`              | Metadata câu hỏi và subtopic                         |
| `question_versions`      | Nội dung/lời giải theo phiên bản                     |
| `question_options`       | Bốn lựa chọn cho phiên bản câu hỏi và cờ đáp án đúng |
| `quizzes`                | Quiz lesson, quiz tổng hợp hoặc readiness assessment |
| `quiz_rules`             | Quy tắc chọn câu theo node, số lượng và difficulty   |
| `quiz_fixed_questions`   | Câu hỏi cố định do admin chọn                        |
| `lesson_assessments`     | Gắn lesson với quiz bắt buộc và điểm đạt             |
| `quiz_attempts`          | Một lần làm quiz của một user                        |
| `quiz_attempt_questions` | Câu/phiên bản/thứ tự đã chọn trong attempt           |
| `quiz_attempt_answers`   | Câu trả lời và kết quả chấm của user                 |

### Coding practice (tùy chọn — 4 bảng)

| Bảng                  | Mục đích                                   |
| --------------------- | ------------------------------------------ |
| `coding_exercises`    | Đề bài và starter code                     |
| `coding_test_cases`   | Test công khai/ẩn dùng để đánh giá         |
| `coding_submissions`  | Code người dùng gửi và trạng thái thực thi |
| `coding_test_results` | Kết quả từng test case                     |

### Interview và đánh giá AI (tùy chọn — 7 bảng)

| Bảng                          | Mục đích                                          |
| ----------------------------- | ------------------------------------------------- |
| `interview_questions`         | Câu hỏi phỏng vấn theo subtopic                   |
| `interview_rubrics`           | Hướng dẫn chấm cho từng câu hỏi                   |
| `interview_rubric_criteria`   | Các tiêu chí cụ thể trong rubric                  |
| `interview_sessions`          | Một phiên luyện phỏng vấn                         |
| `interview_session_questions` | Câu hỏi và thứ tự trong session                   |
| `interview_answers`           | Câu trả lời gốc của user                          |
| `ai_evaluations`              | Điểm, model, trạng thái và kết quả AI đã xác thực |

### Thành tựu và bookmark (tùy chọn — 3 bảng bookmark)

Thành tựu được tính theo FR-11 và không cần bảng riêng. Chỉ tạo các bảng dưới đây khi triển khai bookmark; `interview_question_bookmarks` còn phụ thuộc module interview.

| Bảng                           | Mục đích                                 |
| ------------------------------ | ---------------------------------------- |
| `lesson_bookmarks`             | Lesson được user lưu                     |
| `question_bookmarks`           | Question được user lưu                   |
| `interview_question_bookmarks` | Interview question được user lưu         |

Không tạo bảng `achievements`, `user_achievements`, `user_activity_days`, `dashboard_stats`, `topic_progress` hoặc `user_node_progress` trong thiết kế hiện tại. Có thể thêm cache tổng hợp sau nếu đo đạc cho thấy truy vấn thực tế chậm.

## 9. Ảnh hưởng tới các bảng khác

- Các bảng nghiệp vụ vẫn tham chiếu `users.id`; dùng enum cho role không làm thay đổi các khóa ngoại này. Logic phân quyền đọc trực tiếp `users.role`.
- Bảng cốt lõi không có khóa ngoại bắt buộc tới bảng tùy chọn. Bảng tùy chọn có thể tham chiếu bảng cốt lõi nên có thể bổ sung sau.
- Tính thành tựu qua truy vấn không thay đổi quan hệ lesson/quiz/attempt. Cần giữ dữ liệu hoạt động gốc để tính đúng kết quả.
- Nếu đã triển khai quan hệ user-role nhiều-nhiều, cần chuyển dữ liệu sang `users.role` và cập nhật logic phân quyền trước khi bỏ bảng cũ. Việc sửa tài liệu này không tự thay đổi database đang chạy.
