BEGIN;

SET LOCAL search_path TO fresherprep, public;

-- Generated from toeic_10_quizzes_500_questions.txt.
-- Source validation: 10 quizzes, 50 unique questions per quiz, four unique
-- options, one answer and one Vietnamese explanation per question.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM quiz_attempts attempt
        JOIN quizzes quiz ON quiz.id = attempt.quiz_id
        WHERE quiz.code LIKE 'ENG-TOEIC-TEST-%'
    ) OR EXISTS (
        SELECT 1 FROM pet_reward_events reward
        JOIN quizzes quiz ON quiz.id = reward.source_id
        WHERE reward.activity_type = 'QUIZ_PASSED'
          AND quiz.code LIKE 'ENG-TOEIC-TEST-%'
    ) THEN
        RAISE EXCEPTION 'Seed stopped: existing ENG TOEIC quizzes already have runtime attempts or Pet rewards';
    END IF;
END
$$;

DELETE FROM quiz_fixed_questions fixed USING quizzes quiz
WHERE fixed.quiz_id = quiz.id AND quiz.code LIKE 'ENG-TOEIC-TEST-%';
DELETE FROM quiz_rules rule USING quizzes quiz
WHERE rule.quiz_id = quiz.id AND quiz.code LIKE 'ENG-TOEIC-TEST-%';
DELETE FROM quizzes WHERE code LIKE 'ENG-TOEIC-TEST-%';

UPDATE questions SET published_version_id = NULL, status = 'DRAFT', updated_at = CURRENT_TIMESTAMP
WHERE code LIKE 'ENG-TOEIC-%';
DELETE FROM question_options option USING question_versions version, questions question
WHERE option.question_version_id = version.id AND version.question_id = question.id
  AND question.code LIKE 'ENG-TOEIC-%';
DELETE FROM question_versions version USING questions question
WHERE version.question_id = question.id AND question.code LIKE 'ENG-TOEIC-%';
DELETE FROM questions WHERE code LIKE 'ENG-TOEIC-%';

INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
        'TECHNOLOGY', NULL, 'English', 'eng', 1, 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, node_type = 'TECHNOLOGY',
    parent_id = NULL, display_order = 1, status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP;

INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'CATEGORY',
        (SELECT id FROM knowledge_nodes WHERE slug = 'eng'),
        'TOEIC Practice', 'eng-toeic-practice', 0, 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name,
    node_type = 'CATEGORY', display_order = 0, status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP;

INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'TOPIC',
        (SELECT id FROM knowledge_nodes WHERE slug = 'eng-toeic-practice'),
        'TOEIC 800', 'eng-toeic-800', 0, 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name,
    node_type = 'TOPIC', display_order = 0, status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP;

INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'SUBTOPIC',
       (SELECT id FROM knowledge_nodes WHERE slug = 'eng-toeic-800'),
       format('Practice Test %s', lpad(number::text, 2, '0')),
       format('eng-toeic-test-%s', lpad(number::text, 2, '0')),
       number - 1, 'PUBLISHED'
FROM generate_series(1, 10) number
ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name,
    node_type = 'SUBTOPIC', display_order = EXCLUDED.display_order,
    status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP;

CREATE TEMP TABLE toeic_source (
    quiz_number integer NOT NULL,
    question_number integer NOT NULL,
    code varchar(50) NOT NULL,
    difficulty varchar(10) NOT NULL,
    category varchar(16) NOT NULL,
    content text NOT NULL,
    explanation text NOT NULL,
    option_1 text NOT NULL,
    option_2 text NOT NULL,
    option_3 text NOT NULL,
    option_4 text NOT NULL,
    correct_position integer NOT NULL,
    PRIMARY KEY (quiz_number, question_number),
    UNIQUE (code)
) ON COMMIT DROP;

INSERT INTO toeic_source VALUES
    (1, 1, 'ENG-TOEIC-01-Q01', 'EASY', 'GRAMMAR', 'The accounting team _____ the monthly report since Monday.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'have updated', 'has updated', 'is updating', 'will updated', 2),
    (1, 2, 'ENG-TOEIC-01-Q02', 'EASY', 'GRAMMAR', 'The monthly report must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'reviewed it', 'review', 'be reviewing', 'be reviewed', 4),
    (1, 3, 'ENG-TOEIC-01-Q03', 'MEDIUM', 'GRAMMAR', 'If the accounting team _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'will receive', 'receiving', 'received', 'receives', 4),
    (1, 4, 'ENG-TOEIC-01-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the monthly report is working with the accounting team.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'where', 'whom', 'which', 'who', 4),
    (1, 5, 'ENG-TOEIC-01-Q05', 'HARD', 'GRAMMAR', 'This version of the monthly report is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'accuracy', 'most accurate', 'accurately', 'more accurate', 4),
    (1, 6, 'ENG-TOEIC-01-Q06', 'EASY', 'GRAMMAR', 'The manager asked the accounting team _____ the monthly report again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'check to', 'to check', 'checked', 'checking', 2),
    (1, 7, 'ENG-TOEIC-01-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the monthly report before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'checked', 'check', 'checking', 'to checked', 3),
    (1, 8, 'ENG-TOEIC-01-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the accounting team _____ the monthly report.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'had completed', 'has completed', 'completes', 'will complete', 1),
    (1, 9, 'ENG-TOEIC-01-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the accounting team finishes the monthly report.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'until', 'despite', 'during', 'because of', 1),
    (1, 10, 'ENG-TOEIC-01-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'most clearly', 'more clearly', 'clarity', 'clear', 2),
    (1, 11, 'ENG-TOEIC-01-Q11', 'EASY', 'GRAMMAR', 'The monthly report needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'revised it', 'to be revised', 'to revising', 'revise', 2),
    (1, 12, 'ENG-TOEIC-01-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the monthly report _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'although', 'because of', 'unless', 'while', 2),
    (1, 13, 'ENG-TOEIC-01-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the monthly report.', 'Cấu trúc adjective + enough + to V.', 'held', 'hold', 'holding', 'to hold', 4),
    (1, 14, 'ENG-TOEIC-01-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the accounting team _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'are', 'is', 'be', 'was', 1),
    (1, 15, 'ENG-TOEIC-01-Q15', 'HARD', 'GRAMMAR', 'The monthly report _____ by the accounting team yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'approved', 'is approving', 'was approved', 'has approve', 3),
    (1, 16, 'ENG-TOEIC-01-Q16', 'EASY', 'VOCABULARY', '(head office) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'deadline', 'refund', 'agenda', 'branch', 2),
    (1, 17, 'ENG-TOEIC-01-Q17', 'EASY', 'VOCABULARY', '(head office) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'receipt', 'shift', 'forecast', 'vacancy', 1),
    (1, 18, 'ENG-TOEIC-01-Q18', 'MEDIUM', 'VOCABULARY', '(head office) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'entrance', 'target', 'route', 'manual', 2),
    (1, 19, 'ENG-TOEIC-01-Q19', 'MEDIUM', 'VOCABULARY', '(head office) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'fragile', 'accurate', 'crowded', 'temporary', 2),
    (1, 20, 'ENG-TOEIC-01-Q20', 'HARD', 'VOCABULARY', '(head office) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'subscribe', 'decorate', 'manufacture', 'postpone', 4),
    (1, 21, 'ENG-TOEIC-01-Q21', 'EASY', 'VOCABULARY', '(head office) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'damage', 'salary', 'attendance', 'permission', 1),
    (1, 22, 'ENG-TOEIC-01-Q22', 'EASY', 'VOCABULARY', '(head office) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'vacant', 'relevant', 'portable', 'annual', 2),
    (1, 23, 'ENG-TOEIC-01-Q23', 'MEDIUM', 'VOCABULARY', '(head office) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'borrow', 'assemble', 'notify', 'purchase', 3),
    (1, 24, 'ENG-TOEIC-01-Q24', 'MEDIUM', 'VOCABULARY', '(head office) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'repair', 'attach', 'expand', 'delay', 3),
    (1, 25, 'ENG-TOEIC-01-Q25', 'HARD', 'VOCABULARY', '(head office) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'manual', 'candidate', 'coupon', 'invoice', 1),
    (1, 26, 'ENG-TOEIC-01-Q26', 'EASY', 'TOEIC', '[Head Office]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'Certainly. I''ll email it after I check the figures.', 'The contract is on blue paper.', 'I traveled by train.', 'The cafeteria is downstairs.', 1),
    (1, 27, 'ENG-TOEIC-01-Q27', 'EASY', 'TOEIC', '[Head Office]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'In the equipment room.', 'At around two this afternoon.', 'Yes, the device is new.', 'For about three hours.', 2),
    (1, 28, 'ENG-TOEIC-01-Q28', 'MEDIUM', 'TOEIC', '[Head Office]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'In Conference Room A.', 'At ten o''clock.', 'Yes, I attended it.', 'Because the director is traveling on Thursday.', 4),
    (1, 29, 'ENG-TOEIC-01-Q29', 'MEDIUM', 'TOEIC', '[Head Office]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'The printer is upstairs.', 'It has four pages.', 'Not at all. I''ll look at it now.', 'Yesterday was busy.', 3),
    (1, 30, 'ENG-TOEIC-01-Q30', 'HARD', 'TOEIC', '[Head Office]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'Next to the receiving desk, please.', 'They arrived this morning.', 'There are eight boxes.', 'The driver called.', 1),
    (1, 31, 'ENG-TOEIC-01-Q31', 'EASY', 'TOEIC', '[Head Office]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'Not yet. I''m waiting for one receipt.', 'It has five pages.', 'At the finance office.', 'The trip was enjoyable.', 1),
    (1, 32, 'ENG-TOEIC-01-Q32', 'EASY', 'TOEIC', '[Head Office]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'It takes ten minutes.', 'On a secure server.', 'Every evening after the office closes.', 'For the IT team.', 3),
    (1, 33, 'ENG-TOEIC-01-Q33', 'MEDIUM', 'TOEIC', '[Head Office]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'At nine thirty.', 'For new clients.', 'Ms. Lee from the sales team.', 'In the showroom.', 3),
    (1, 34, 'ENG-TOEIC-01-Q34', 'MEDIUM', 'TOEIC', '[Head Office]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'I exchanged currency.', 'Yes, as long as you have the receipt.', 'The headset is wireless.', 'The box is cardboard.', 2),
    (1, 35, 'ENG-TOEIC-01-Q35', 'HARD', 'TOEIC', '[Head Office]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'The room seats twelve.', 'We ordered new chairs.', 'Your camera is black.', 'I''ll check the network connection right away.', 4),
    (1, 36, 'ENG-TOEIC-01-Q36', 'EASY', 'TOEIC', '[EMAIL]
The CRM training session will begin at 8:30 a.m. on Monday in Room A. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 2:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To return it to IT', 'To participate in a hands-on exercise', 'To replace the room computer', 'To show vacation photos', 2),
    (1, 37, 'ENG-TOEIC-01-Q37', 'EASY', 'TOEIC', '[EMAIL]
The CRM training session will begin at 8:30 a.m. on Monday in Room A. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 2:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A customer invoice', 'A parking permit', 'A new laptop', 'A short user guide', 4),
    (1, 38, 'ENG-TOEIC-01-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The west parking lot will be closed from October 6 through October 8 while new lighting is installed. Employees should use the visitor lot on King Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'New lighting will be installed', 'Customers requested more spaces', 'A product launch will occur', 'The lot will be sold', 1),
    (1, 39, 'ENG-TOEIC-01-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The west parking lot will be closed from October 6 through October 8 while new lighting is installed. Employees should use the visitor lot on King Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'Inside the warehouse', 'Beside the cafeteria', 'In the visitor lot', 'At the loading dock', 3),
    (1, 40, 'ENG-TOEIC-01-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning January, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A project code and manager approval', 'A hotel membership number', 'A customer signature', 'A paper airline ticket', 1),
    (1, 41, 'ENG-TOEIC-01-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning January, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are deleted immediately', 'They are automatically paid', 'They are returned for correction', 'They are sent to customers', 3),
    (1, 42, 'ENG-TOEIC-01-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at River City Hotel before November 10 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'Breakfast for two', 'Dinner every evening', 'Free airport transport', 'A third night free', 1),
    (1, 43, 'ENG-TOEIC-01-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at River City Hotel before November 10 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'It is available only on holidays', 'Guests must stay three nights', 'It must be booked after arrival', 'It must be reserved at least 24 hours ahead', 4),
    (1, 44, 'ENG-TOEIC-01-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Desk 12 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 3:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The cable is missing', 'The contract was deleted', 'The scanner has no power', 'The computer does not recognize the scanner', 4),
    (1, 45, 'ENG-TOEIC-01-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Desk 12 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 3:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'A printer is out of paper', 'The employee is buying a computer', 'The office closes permanently', 'A signed contract must be uploaded before the deadline', 4),
    (1, 46, 'ENG-TOEIC-01-Q46', 'EASY', 'TOEIC', '[Head Office] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Confirm the error details and check the payment service status.', 'Delete the account immediately.', 'Tell the customer to retry forever.', 'Ask for the customer''s password.', 1),
    (1, 47, 'ENG-TOEIC-01-Q47', 'EASY', 'TOEIC', '[Head Office] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'The cafeteria menu.', 'A customer''s invoice total.', 'Whether Wi-Fi is enabled and the correct network is selected.', 'The printer paper size.', 3),
    (1, 48, 'ENG-TOEIC-01-Q48', 'MEDIUM', 'TOEIC', '[Head Office] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Promise an unverified refund date.', 'Argue with the client.', 'Ignore the message.', 'Apologize, verify the order, and explain the replacement process.', 4),
    (1, 49, 'ENG-TOEIC-01-Q49', 'MEDIUM', 'TOEIC', '[Head Office] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The server or an upstream service is temporarily unavailable.', 'The monitor resolution is too high.', 'The request was permanently successful.', 'The keyboard is broken.', 1),
    (1, 50, 'ENG-TOEIC-01-Q50', 'HARD', 'TOEIC', '[Head Office] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Close unrelated windows and hide sensitive information.', 'Disable security controls.', 'Post internal passwords in chat.', 'Open private employee files.', 1),
    (2, 1, 'ENG-TOEIC-02-Q01', 'EASY', 'GRAMMAR', 'The sales department _____ the client list since Tuesday.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'is updating', 'will updated', 'have updated', 'has updated', 4),
    (2, 2, 'ENG-TOEIC-02-Q02', 'EASY', 'GRAMMAR', 'The client list must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'reviewed it', 'be reviewing', 'review', 'be reviewed', 4),
    (2, 3, 'ENG-TOEIC-02-Q03', 'MEDIUM', 'GRAMMAR', 'If the sales department _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'received', 'receives', 'receiving', 'will receive', 2),
    (2, 4, 'ENG-TOEIC-02-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the client list is working with the sales department.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'which', 'whom', 'who', 'where', 3),
    (2, 5, 'ENG-TOEIC-02-Q05', 'HARD', 'GRAMMAR', 'This version of the client list is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'accuracy', 'most accurate', 'more accurate', 'accurately', 3),
    (2, 6, 'ENG-TOEIC-02-Q06', 'EASY', 'GRAMMAR', 'The manager asked the sales department _____ the client list again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'to check', 'checked', 'checking', 'check to', 1),
    (2, 7, 'ENG-TOEIC-02-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the client list before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'checked', 'to checked', 'checking', 'check', 3),
    (2, 8, 'ENG-TOEIC-02-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the sales department _____ the client list.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'had completed', 'has completed', 'will complete', 'completes', 1),
    (2, 9, 'ENG-TOEIC-02-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the sales department finishes the client list.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'during', 'despite', 'until', 'because of', 3),
    (2, 10, 'ENG-TOEIC-02-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'more clearly', 'clarity', 'most clearly', 'clear', 1),
    (2, 11, 'ENG-TOEIC-02-Q11', 'EASY', 'GRAMMAR', 'The client list needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'revised it', 'to revising', 'revise', 'to be revised', 4),
    (2, 12, 'ENG-TOEIC-02-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the client list _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'because of', 'unless', 'although', 'while', 1),
    (2, 13, 'ENG-TOEIC-02-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the client list.', 'Cấu trúc adjective + enough + to V.', 'to hold', 'holding', 'hold', 'held', 1),
    (2, 14, 'ENG-TOEIC-02-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the sales department _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'are', 'be', 'was', 'is', 1),
    (2, 15, 'ENG-TOEIC-02-Q15', 'HARD', 'GRAMMAR', 'The client list _____ by the sales department yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'approved', 'is approving', 'was approved', 'has approve', 3),
    (2, 16, 'ENG-TOEIC-02-Q16', 'EASY', 'VOCABULARY', '(regional branch) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'refund', 'deadline', 'branch', 'agenda', 1),
    (2, 17, 'ENG-TOEIC-02-Q17', 'EASY', 'VOCABULARY', '(regional branch) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'vacancy', 'forecast', 'receipt', 'shift', 3),
    (2, 18, 'ENG-TOEIC-02-Q18', 'MEDIUM', 'VOCABULARY', '(regional branch) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'target', 'manual', 'route', 'entrance', 1),
    (2, 19, 'ENG-TOEIC-02-Q19', 'MEDIUM', 'VOCABULARY', '(regional branch) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'crowded', 'temporary', 'fragile', 'accurate', 4),
    (2, 20, 'ENG-TOEIC-02-Q20', 'HARD', 'VOCABULARY', '(regional branch) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'subscribe', 'manufacture', 'postpone', 'decorate', 3),
    (2, 21, 'ENG-TOEIC-02-Q21', 'EASY', 'VOCABULARY', '(regional branch) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'damage', 'attendance', 'permission', 'salary', 1),
    (2, 22, 'ENG-TOEIC-02-Q22', 'EASY', 'VOCABULARY', '(regional branch) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'portable', 'relevant', 'annual', 'vacant', 2),
    (2, 23, 'ENG-TOEIC-02-Q23', 'MEDIUM', 'VOCABULARY', '(regional branch) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'assemble', 'borrow', 'purchase', 'notify', 4),
    (2, 24, 'ENG-TOEIC-02-Q24', 'MEDIUM', 'VOCABULARY', '(regional branch) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'delay', 'repair', 'attach', 'expand', 4),
    (2, 25, 'ENG-TOEIC-02-Q25', 'HARD', 'VOCABULARY', '(regional branch) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'coupon', 'manual', 'candidate', 'invoice', 2),
    (2, 26, 'ENG-TOEIC-02-Q26', 'EASY', 'TOEIC', '[Branch A]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'Certainly. I''ll email it after I check the figures.', 'The contract is on blue paper.', 'The cafeteria is downstairs.', 'I traveled by train.', 1),
    (2, 27, 'ENG-TOEIC-02-Q27', 'EASY', 'TOEIC', '[Branch A]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'Yes, the device is new.', 'At around two this afternoon.', 'In the equipment room.', 'For about three hours.', 2),
    (2, 28, 'ENG-TOEIC-02-Q28', 'MEDIUM', 'TOEIC', '[Branch A]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'Because the director is traveling on Thursday.', 'Yes, I attended it.', 'At ten o''clock.', 'In Conference Room A.', 1),
    (2, 29, 'ENG-TOEIC-02-Q29', 'MEDIUM', 'TOEIC', '[Branch A]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'The printer is upstairs.', 'It has four pages.', 'Yesterday was busy.', 'Not at all. I''ll look at it now.', 4),
    (2, 30, 'ENG-TOEIC-02-Q30', 'HARD', 'TOEIC', '[Branch A]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'Next to the receiving desk, please.', 'The driver called.', 'They arrived this morning.', 'There are eight boxes.', 1),
    (2, 31, 'ENG-TOEIC-02-Q31', 'EASY', 'TOEIC', '[Branch A]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'The trip was enjoyable.', 'Not yet. I''m waiting for one receipt.', 'At the finance office.', 'It has five pages.', 2),
    (2, 32, 'ENG-TOEIC-02-Q32', 'EASY', 'TOEIC', '[Branch A]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'It takes ten minutes.', 'On a secure server.', 'For the IT team.', 'Every evening after the office closes.', 4),
    (2, 33, 'ENG-TOEIC-02-Q33', 'MEDIUM', 'TOEIC', '[Branch A]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'At nine thirty.', 'In the showroom.', 'Ms. Lee from the sales team.', 'For new clients.', 3),
    (2, 34, 'ENG-TOEIC-02-Q34', 'MEDIUM', 'TOEIC', '[Branch A]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'I exchanged currency.', 'Yes, as long as you have the receipt.', 'The headset is wireless.', 'The box is cardboard.', 2),
    (2, 35, 'ENG-TOEIC-02-Q35', 'HARD', 'TOEIC', '[Branch A]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'Your camera is black.', 'We ordered new chairs.', 'The room seats twelve.', 'I''ll check the network connection right away.', 4),
    (2, 36, 'ENG-TOEIC-02-Q36', 'EASY', 'TOEIC', '[EMAIL]
The safety training session will begin at 9:30 a.m. on Tuesday in Room B. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 3:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To show vacation photos', 'To participate in a hands-on exercise', 'To replace the room computer', 'To return it to IT', 2),
    (2, 37, 'ENG-TOEIC-02-Q37', 'EASY', 'TOEIC', '[EMAIL]
The safety training session will begin at 9:30 a.m. on Tuesday in Room B. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 3:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A new laptop', 'A parking permit', 'A short user guide', 'A customer invoice', 3),
    (2, 38, 'ENG-TOEIC-02-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The east parking lot will be closed from October 7 through October 9 while new lighting is installed. Employees should use the visitor lot on Oak Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'Customers requested more spaces', 'The lot will be sold', 'A product launch will occur', 'New lighting will be installed', 4),
    (2, 39, 'ENG-TOEIC-02-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The east parking lot will be closed from October 7 through October 9 while new lighting is installed. Employees should use the visitor lot on Oak Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'Inside the warehouse', 'At the loading dock', 'In the visitor lot', 'Beside the cafeteria', 3),
    (2, 40, 'ENG-TOEIC-02-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning February, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A hotel membership number', 'A project code and manager approval', 'A customer signature', 'A paper airline ticket', 2),
    (2, 41, 'ENG-TOEIC-02-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning February, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are returned for correction', 'They are automatically paid', 'They are sent to customers', 'They are deleted immediately', 1),
    (2, 42, 'ENG-TOEIC-02-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Central Plaza Hotel before November 11 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'A third night free', 'Free airport transport', 'Breakfast for two', 'Dinner every evening', 3),
    (2, 43, 'ENG-TOEIC-02-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Central Plaza Hotel before November 11 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'It is available only on holidays', 'Guests must stay three nights', 'It must be booked after arrival', 'It must be reserved at least 24 hours ahead', 4),
    (2, 44, 'ENG-TOEIC-02-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Room 4 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 4:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The scanner has no power', 'The cable is missing', 'The computer does not recognize the scanner', 'The contract was deleted', 3),
    (2, 45, 'ENG-TOEIC-02-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Room 4 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 4:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'A printer is out of paper', 'The office closes permanently', 'A signed contract must be uploaded before the deadline', 'The employee is buying a computer', 3),
    (2, 46, 'ENG-TOEIC-02-Q46', 'EASY', 'TOEIC', '[Branch A] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Ask for the customer''s password.', 'Delete the account immediately.', 'Tell the customer to retry forever.', 'Confirm the error details and check the payment service status.', 4),
    (2, 47, 'ENG-TOEIC-02-Q47', 'EASY', 'TOEIC', '[Branch A] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'A customer''s invoice total.', 'The printer paper size.', 'Whether Wi-Fi is enabled and the correct network is selected.', 'The cafeteria menu.', 3),
    (2, 48, 'ENG-TOEIC-02-Q48', 'MEDIUM', 'TOEIC', '[Branch A] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Promise an unverified refund date.', 'Ignore the message.', 'Apologize, verify the order, and explain the replacement process.', 'Argue with the client.', 3),
    (2, 49, 'ENG-TOEIC-02-Q49', 'MEDIUM', 'TOEIC', '[Branch A] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The server or an upstream service is temporarily unavailable.', 'The request was permanently successful.', 'The keyboard is broken.', 'The monitor resolution is too high.', 1),
    (2, 50, 'ENG-TOEIC-02-Q50', 'HARD', 'TOEIC', '[Branch A] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Open private employee files.', 'Post internal passwords in chat.', 'Disable security controls.', 'Close unrelated windows and hide sensitive information.', 4),
    (3, 1, 'ENG-TOEIC-03-Q01', 'EASY', 'GRAMMAR', 'The support team _____ the ticket summary since Wednesday.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'will updated', 'is updating', 'has updated', 'have updated', 3),
    (3, 2, 'ENG-TOEIC-03-Q02', 'EASY', 'GRAMMAR', 'The ticket summary must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'review', 'be reviewing', 'be reviewed', 'reviewed it', 3),
    (3, 3, 'ENG-TOEIC-03-Q03', 'MEDIUM', 'GRAMMAR', 'If the support team _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'received', 'receives', 'will receive', 'receiving', 2),
    (3, 4, 'ENG-TOEIC-03-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the ticket summary is working with the support team.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'who', 'where', 'whom', 'which', 1),
    (3, 5, 'ENG-TOEIC-03-Q05', 'HARD', 'GRAMMAR', 'This version of the ticket summary is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'accurately', 'most accurate', 'accuracy', 'more accurate', 4),
    (3, 6, 'ENG-TOEIC-03-Q06', 'EASY', 'GRAMMAR', 'The manager asked the support team _____ the ticket summary again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'checked', 'to check', 'checking', 'check to', 2),
    (3, 7, 'ENG-TOEIC-03-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the ticket summary before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'checked', 'check', 'to checked', 'checking', 4),
    (3, 8, 'ENG-TOEIC-03-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the support team _____ the ticket summary.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'has completed', 'had completed', 'will complete', 'completes', 2),
    (3, 9, 'ENG-TOEIC-03-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the support team finishes the ticket summary.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'despite', 'until', 'because of', 'during', 2),
    (3, 10, 'ENG-TOEIC-03-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'more clearly', 'clarity', 'clear', 'most clearly', 1),
    (3, 11, 'ENG-TOEIC-03-Q11', 'EASY', 'GRAMMAR', 'The ticket summary needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'revise', 'revised it', 'to be revised', 'to revising', 3),
    (3, 12, 'ENG-TOEIC-03-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the ticket summary _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'unless', 'while', 'although', 'because of', 4),
    (3, 13, 'ENG-TOEIC-03-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the ticket summary.', 'Cấu trúc adjective + enough + to V.', 'holding', 'to hold', 'held', 'hold', 2),
    (3, 14, 'ENG-TOEIC-03-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the support team _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'was', 'are', 'be', 'is', 2),
    (3, 15, 'ENG-TOEIC-03-Q15', 'HARD', 'GRAMMAR', 'The ticket summary _____ by the support team yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'is approving', 'was approved', 'approved', 'has approve', 2),
    (3, 16, 'ENG-TOEIC-03-Q16', 'EASY', 'VOCABULARY', '(service center) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'agenda', 'deadline', 'branch', 'refund', 4),
    (3, 17, 'ENG-TOEIC-03-Q17', 'EASY', 'VOCABULARY', '(service center) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'forecast', 'vacancy', 'receipt', 'shift', 3),
    (3, 18, 'ENG-TOEIC-03-Q18', 'MEDIUM', 'VOCABULARY', '(service center) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'entrance', 'manual', 'route', 'target', 4),
    (3, 19, 'ENG-TOEIC-03-Q19', 'MEDIUM', 'VOCABULARY', '(service center) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'accurate', 'fragile', 'crowded', 'temporary', 1),
    (3, 20, 'ENG-TOEIC-03-Q20', 'HARD', 'VOCABULARY', '(service center) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'subscribe', 'decorate', 'postpone', 'manufacture', 3),
    (3, 21, 'ENG-TOEIC-03-Q21', 'EASY', 'VOCABULARY', '(service center) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'damage', 'permission', 'salary', 'attendance', 1),
    (3, 22, 'ENG-TOEIC-03-Q22', 'EASY', 'VOCABULARY', '(service center) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'portable', 'annual', 'vacant', 'relevant', 4),
    (3, 23, 'ENG-TOEIC-03-Q23', 'MEDIUM', 'VOCABULARY', '(service center) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'purchase', 'borrow', 'notify', 'assemble', 3),
    (3, 24, 'ENG-TOEIC-03-Q24', 'MEDIUM', 'VOCABULARY', '(service center) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'expand', 'repair', 'delay', 'attach', 1),
    (3, 25, 'ENG-TOEIC-03-Q25', 'HARD', 'VOCABULARY', '(service center) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'candidate', 'invoice', 'manual', 'coupon', 3),
    (3, 26, 'ENG-TOEIC-03-Q26', 'EASY', 'TOEIC', '[Branch B]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'The contract is on blue paper.', 'The cafeteria is downstairs.', 'I traveled by train.', 'Certainly. I''ll email it after I check the figures.', 4),
    (3, 27, 'ENG-TOEIC-03-Q27', 'EASY', 'TOEIC', '[Branch B]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'Yes, the device is new.', 'At around two this afternoon.', 'For about three hours.', 'In the equipment room.', 2),
    (3, 28, 'ENG-TOEIC-03-Q28', 'MEDIUM', 'TOEIC', '[Branch B]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'In Conference Room A.', 'Because the director is traveling on Thursday.', 'At ten o''clock.', 'Yes, I attended it.', 2),
    (3, 29, 'ENG-TOEIC-03-Q29', 'MEDIUM', 'TOEIC', '[Branch B]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'Yesterday was busy.', 'It has four pages.', 'Not at all. I''ll look at it now.', 'The printer is upstairs.', 3),
    (3, 30, 'ENG-TOEIC-03-Q30', 'HARD', 'TOEIC', '[Branch B]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'The driver called.', 'They arrived this morning.', 'Next to the receiving desk, please.', 'There are eight boxes.', 3),
    (3, 31, 'ENG-TOEIC-03-Q31', 'EASY', 'TOEIC', '[Branch B]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'The trip was enjoyable.', 'At the finance office.', 'It has five pages.', 'Not yet. I''m waiting for one receipt.', 4),
    (3, 32, 'ENG-TOEIC-03-Q32', 'EASY', 'TOEIC', '[Branch B]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'On a secure server.', 'For the IT team.', 'It takes ten minutes.', 'Every evening after the office closes.', 4),
    (3, 33, 'ENG-TOEIC-03-Q33', 'MEDIUM', 'TOEIC', '[Branch B]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'Ms. Lee from the sales team.', 'At nine thirty.', 'For new clients.', 'In the showroom.', 1),
    (3, 34, 'ENG-TOEIC-03-Q34', 'MEDIUM', 'TOEIC', '[Branch B]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'I exchanged currency.', 'Yes, as long as you have the receipt.', 'The box is cardboard.', 'The headset is wireless.', 2),
    (3, 35, 'ENG-TOEIC-03-Q35', 'HARD', 'TOEIC', '[Branch B]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'We ordered new chairs.', 'The room seats twelve.', 'I''ll check the network connection right away.', 'Your camera is black.', 3),
    (3, 36, 'ENG-TOEIC-03-Q36', 'EASY', 'TOEIC', '[EMAIL]
The sales training session will begin at 10:30 a.m. on Wednesday in Room C. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 4:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To replace the room computer', 'To participate in a hands-on exercise', 'To show vacation photos', 'To return it to IT', 2),
    (3, 37, 'ENG-TOEIC-03-Q37', 'EASY', 'TOEIC', '[EMAIL]
The sales training session will begin at 10:30 a.m. on Wednesday in Room C. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 4:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A short user guide', 'A parking permit', 'A customer invoice', 'A new laptop', 1),
    (3, 38, 'ENG-TOEIC-03-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The north parking lot will be closed from October 8 through October 10 while new lighting is installed. Employees should use the visitor lot on River Road during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'New lighting will be installed', 'A product launch will occur', 'The lot will be sold', 'Customers requested more spaces', 1),
    (3, 39, 'ENG-TOEIC-03-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The north parking lot will be closed from October 8 through October 10 while new lighting is installed. Employees should use the visitor lot on River Road during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'Inside the warehouse', 'In the visitor lot', 'Beside the cafeteria', 'At the loading dock', 2),
    (3, 40, 'ENG-TOEIC-03-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning March, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A hotel membership number', 'A project code and manager approval', 'A customer signature', 'A paper airline ticket', 2),
    (3, 41, 'ENG-TOEIC-03-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning March, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are deleted immediately', 'They are automatically paid', 'They are sent to customers', 'They are returned for correction', 4),
    (3, 42, 'ENG-TOEIC-03-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Harbor Business Hotel before November 12 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'A third night free', 'Free airport transport', 'Breakfast for two', 'Dinner every evening', 3),
    (3, 43, 'ENG-TOEIC-03-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Harbor Business Hotel before November 12 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'It is available only on holidays', 'It must be reserved at least 24 hours ahead', 'Guests must stay three nights', 'It must be booked after arrival', 2),
    (3, 44, 'ENG-TOEIC-03-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Support Desk powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 5:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The cable is missing', 'The computer does not recognize the scanner', 'The scanner has no power', 'The contract was deleted', 2),
    (3, 45, 'ENG-TOEIC-03-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Support Desk powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 5:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'A printer is out of paper', 'The office closes permanently', 'A signed contract must be uploaded before the deadline', 'The employee is buying a computer', 3),
    (3, 46, 'ENG-TOEIC-03-Q46', 'EASY', 'TOEIC', '[Branch B] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Ask for the customer''s password.', 'Tell the customer to retry forever.', 'Confirm the error details and check the payment service status.', 'Delete the account immediately.', 3),
    (3, 47, 'ENG-TOEIC-03-Q47', 'EASY', 'TOEIC', '[Branch B] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'The cafeteria menu.', 'The printer paper size.', 'Whether Wi-Fi is enabled and the correct network is selected.', 'A customer''s invoice total.', 3),
    (3, 48, 'ENG-TOEIC-03-Q48', 'MEDIUM', 'TOEIC', '[Branch B] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Argue with the client.', 'Apologize, verify the order, and explain the replacement process.', 'Promise an unverified refund date.', 'Ignore the message.', 2),
    (3, 49, 'ENG-TOEIC-03-Q49', 'MEDIUM', 'TOEIC', '[Branch B] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The monitor resolution is too high.', 'The request was permanently successful.', 'The keyboard is broken.', 'The server or an upstream service is temporarily unavailable.', 4),
    (3, 50, 'ENG-TOEIC-03-Q50', 'HARD', 'TOEIC', '[Branch B] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Close unrelated windows and hide sensitive information.', 'Disable security controls.', 'Open private employee files.', 'Post internal passwords in chat.', 1),
    (4, 1, 'ENG-TOEIC-04-Q01', 'EASY', 'GRAMMAR', 'The HR department _____ the training schedule since Thursday.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'has updated', 'will updated', 'have updated', 'is updating', 1),
    (4, 2, 'ENG-TOEIC-04-Q02', 'EASY', 'GRAMMAR', 'The training schedule must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'reviewed it', 'be reviewing', 'review', 'be reviewed', 4),
    (4, 3, 'ENG-TOEIC-04-Q03', 'MEDIUM', 'GRAMMAR', 'If the HR department _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'receives', 'receiving', 'will receive', 'received', 1),
    (4, 4, 'ENG-TOEIC-04-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the training schedule is working with the HR department.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'who', 'whom', 'where', 'which', 1),
    (4, 5, 'ENG-TOEIC-04-Q05', 'HARD', 'GRAMMAR', 'This version of the training schedule is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'more accurate', 'accurately', 'accuracy', 'most accurate', 1),
    (4, 6, 'ENG-TOEIC-04-Q06', 'EASY', 'GRAMMAR', 'The manager asked the HR department _____ the training schedule again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'checked', 'checking', 'check to', 'to check', 4),
    (4, 7, 'ENG-TOEIC-04-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the training schedule before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'check', 'to checked', 'checked', 'checking', 4),
    (4, 8, 'ENG-TOEIC-04-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the HR department _____ the training schedule.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'had completed', 'will complete', 'has completed', 'completes', 1),
    (4, 9, 'ENG-TOEIC-04-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the HR department finishes the training schedule.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'because of', 'until', 'during', 'despite', 2),
    (4, 10, 'ENG-TOEIC-04-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'more clearly', 'most clearly', 'clear', 'clarity', 1),
    (4, 11, 'ENG-TOEIC-04-Q11', 'EASY', 'GRAMMAR', 'The training schedule needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'revise', 'to be revised', 'revised it', 'to revising', 2),
    (4, 12, 'ENG-TOEIC-04-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the training schedule _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'while', 'unless', 'because of', 'although', 3),
    (4, 13, 'ENG-TOEIC-04-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the training schedule.', 'Cấu trúc adjective + enough + to V.', 'holding', 'held', 'hold', 'to hold', 4),
    (4, 14, 'ENG-TOEIC-04-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the HR department _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'is', 'are', 'be', 'was', 2),
    (4, 15, 'ENG-TOEIC-04-Q15', 'HARD', 'GRAMMAR', 'The training schedule _____ by the HR department yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'has approve', 'was approved', 'is approving', 'approved', 2),
    (4, 16, 'ENG-TOEIC-04-Q16', 'EASY', 'VOCABULARY', '(online store) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'refund', 'agenda', 'deadline', 'branch', 1),
    (4, 17, 'ENG-TOEIC-04-Q17', 'EASY', 'VOCABULARY', '(online store) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'receipt', 'shift', 'vacancy', 'forecast', 1),
    (4, 18, 'ENG-TOEIC-04-Q18', 'MEDIUM', 'VOCABULARY', '(online store) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'manual', 'entrance', 'target', 'route', 3),
    (4, 19, 'ENG-TOEIC-04-Q19', 'MEDIUM', 'VOCABULARY', '(online store) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'temporary', 'accurate', 'fragile', 'crowded', 2),
    (4, 20, 'ENG-TOEIC-04-Q20', 'HARD', 'VOCABULARY', '(online store) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'postpone', 'manufacture', 'subscribe', 'decorate', 1),
    (4, 21, 'ENG-TOEIC-04-Q21', 'EASY', 'VOCABULARY', '(online store) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'permission', 'attendance', 'salary', 'damage', 4),
    (4, 22, 'ENG-TOEIC-04-Q22', 'EASY', 'VOCABULARY', '(online store) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'annual', 'vacant', 'portable', 'relevant', 4),
    (4, 23, 'ENG-TOEIC-04-Q23', 'MEDIUM', 'VOCABULARY', '(online store) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'notify', 'borrow', 'assemble', 'purchase', 1),
    (4, 24, 'ENG-TOEIC-04-Q24', 'MEDIUM', 'VOCABULARY', '(online store) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'expand', 'attach', 'repair', 'delay', 1),
    (4, 25, 'ENG-TOEIC-04-Q25', 'HARD', 'VOCABULARY', '(online store) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'coupon', 'invoice', 'manual', 'candidate', 3),
    (4, 26, 'ENG-TOEIC-04-Q26', 'EASY', 'TOEIC', '[Support Center]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'Certainly. I''ll email it after I check the figures.', 'The contract is on blue paper.', 'The cafeteria is downstairs.', 'I traveled by train.', 1),
    (4, 27, 'ENG-TOEIC-04-Q27', 'EASY', 'TOEIC', '[Support Center]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'Yes, the device is new.', 'In the equipment room.', 'For about three hours.', 'At around two this afternoon.', 4),
    (4, 28, 'ENG-TOEIC-04-Q28', 'MEDIUM', 'TOEIC', '[Support Center]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'Because the director is traveling on Thursday.', 'Yes, I attended it.', 'At ten o''clock.', 'In Conference Room A.', 1),
    (4, 29, 'ENG-TOEIC-04-Q29', 'MEDIUM', 'TOEIC', '[Support Center]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'Not at all. I''ll look at it now.', 'It has four pages.', 'The printer is upstairs.', 'Yesterday was busy.', 1),
    (4, 30, 'ENG-TOEIC-04-Q30', 'HARD', 'TOEIC', '[Support Center]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'They arrived this morning.', 'There are eight boxes.', 'Next to the receiving desk, please.', 'The driver called.', 3),
    (4, 31, 'ENG-TOEIC-04-Q31', 'EASY', 'TOEIC', '[Support Center]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'Not yet. I''m waiting for one receipt.', 'At the finance office.', 'The trip was enjoyable.', 'It has five pages.', 1),
    (4, 32, 'ENG-TOEIC-04-Q32', 'EASY', 'TOEIC', '[Support Center]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'Every evening after the office closes.', 'It takes ten minutes.', 'For the IT team.', 'On a secure server.', 1),
    (4, 33, 'ENG-TOEIC-04-Q33', 'MEDIUM', 'TOEIC', '[Support Center]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'Ms. Lee from the sales team.', 'At nine thirty.', 'For new clients.', 'In the showroom.', 1),
    (4, 34, 'ENG-TOEIC-04-Q34', 'MEDIUM', 'TOEIC', '[Support Center]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'I exchanged currency.', 'The headset is wireless.', 'The box is cardboard.', 'Yes, as long as you have the receipt.', 4),
    (4, 35, 'ENG-TOEIC-04-Q35', 'HARD', 'TOEIC', '[Support Center]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'We ordered new chairs.', 'The room seats twelve.', 'Your camera is black.', 'I''ll check the network connection right away.', 4),
    (4, 36, 'ENG-TOEIC-04-Q36', 'EASY', 'TOEIC', '[EMAIL]
The product training session will begin at 8:30 a.m. on Thursday in Lab 1. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 2:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To return it to IT', 'To replace the room computer', 'To show vacation photos', 'To participate in a hands-on exercise', 4),
    (4, 37, 'ENG-TOEIC-04-Q37', 'EASY', 'TOEIC', '[EMAIL]
The product training session will begin at 8:30 a.m. on Thursday in Lab 1. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 2:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A customer invoice', 'A parking permit', 'A new laptop', 'A short user guide', 4),
    (4, 38, 'ENG-TOEIC-04-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The south parking lot will be closed from October 9 through October 11 while new lighting is installed. Employees should use the visitor lot on Market Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'New lighting will be installed', 'Customers requested more spaces', 'The lot will be sold', 'A product launch will occur', 1),
    (4, 39, 'ENG-TOEIC-04-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The south parking lot will be closed from October 9 through October 11 while new lighting is installed. Employees should use the visitor lot on Market Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'At the loading dock', 'Beside the cafeteria', 'Inside the warehouse', 'In the visitor lot', 4),
    (4, 40, 'ENG-TOEIC-04-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning April, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A paper airline ticket', 'A customer signature', 'A hotel membership number', 'A project code and manager approval', 4),
    (4, 41, 'ENG-TOEIC-04-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning April, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are automatically paid', 'They are returned for correction', 'They are sent to customers', 'They are deleted immediately', 2),
    (4, 42, 'ENG-TOEIC-04-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Metro Inn before November 13 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'Breakfast for two', 'A third night free', 'Dinner every evening', 'Free airport transport', 1),
    (4, 43, 'ENG-TOEIC-04-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Metro Inn before November 13 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'Guests must stay three nights', 'It is available only on holidays', 'It must be booked after arrival', 'It must be reserved at least 24 hours ahead', 4),
    (4, 44, 'ENG-TOEIC-04-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Reception powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 3:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The contract was deleted', 'The cable is missing', 'The computer does not recognize the scanner', 'The scanner has no power', 3),
    (4, 45, 'ENG-TOEIC-04-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Reception powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 3:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'The office closes permanently', 'A signed contract must be uploaded before the deadline', 'A printer is out of paper', 'The employee is buying a computer', 2),
    (4, 46, 'ENG-TOEIC-04-Q46', 'EASY', 'TOEIC', '[Support Center] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Confirm the error details and check the payment service status.', 'Tell the customer to retry forever.', 'Delete the account immediately.', 'Ask for the customer''s password.', 1),
    (4, 47, 'ENG-TOEIC-04-Q47', 'EASY', 'TOEIC', '[Support Center] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'The printer paper size.', 'A customer''s invoice total.', 'The cafeteria menu.', 'Whether Wi-Fi is enabled and the correct network is selected.', 4),
    (4, 48, 'ENG-TOEIC-04-Q48', 'MEDIUM', 'TOEIC', '[Support Center] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Apologize, verify the order, and explain the replacement process.', 'Argue with the client.', 'Promise an unverified refund date.', 'Ignore the message.', 1),
    (4, 49, 'ENG-TOEIC-04-Q49', 'MEDIUM', 'TOEIC', '[Support Center] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The request was permanently successful.', 'The keyboard is broken.', 'The server or an upstream service is temporarily unavailable.', 'The monitor resolution is too high.', 3),
    (4, 50, 'ENG-TOEIC-04-Q50', 'HARD', 'TOEIC', '[Support Center] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Post internal passwords in chat.', 'Open private employee files.', 'Close unrelated windows and hide sensitive information.', 'Disable security controls.', 3),
    (5, 1, 'ENG-TOEIC-05-Q01', 'EASY', 'GRAMMAR', 'The IT team _____ the system log since Friday.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'is updating', 'have updated', 'will updated', 'has updated', 4),
    (5, 2, 'ENG-TOEIC-05-Q02', 'EASY', 'GRAMMAR', 'The system log must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'reviewed it', 'review', 'be reviewed', 'be reviewing', 3),
    (5, 3, 'ENG-TOEIC-05-Q03', 'MEDIUM', 'GRAMMAR', 'If the IT team _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'receives', 'received', 'receiving', 'will receive', 1),
    (5, 4, 'ENG-TOEIC-05-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the system log is working with the IT team.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'which', 'whom', 'who', 'where', 3),
    (5, 5, 'ENG-TOEIC-05-Q05', 'HARD', 'GRAMMAR', 'This version of the system log is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'accurately', 'accuracy', 'more accurate', 'most accurate', 3),
    (5, 6, 'ENG-TOEIC-05-Q06', 'EASY', 'GRAMMAR', 'The manager asked the IT team _____ the system log again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'to check', 'check to', 'checking', 'checked', 1),
    (5, 7, 'ENG-TOEIC-05-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the system log before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'checked', 'checking', 'check', 'to checked', 2),
    (5, 8, 'ENG-TOEIC-05-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the IT team _____ the system log.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'has completed', 'had completed', 'completes', 'will complete', 2),
    (5, 9, 'ENG-TOEIC-05-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the IT team finishes the system log.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'despite', 'because of', 'during', 'until', 4),
    (5, 10, 'ENG-TOEIC-05-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'clarity', 'clear', 'most clearly', 'more clearly', 4),
    (5, 11, 'ENG-TOEIC-05-Q11', 'EASY', 'GRAMMAR', 'The system log needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'revise', 'revised it', 'to revising', 'to be revised', 4),
    (5, 12, 'ENG-TOEIC-05-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the system log _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'because of', 'although', 'while', 'unless', 1),
    (5, 13, 'ENG-TOEIC-05-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the system log.', 'Cấu trúc adjective + enough + to V.', 'holding', 'held', 'hold', 'to hold', 4),
    (5, 14, 'ENG-TOEIC-05-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the IT team _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'was', 'are', 'is', 'be', 2),
    (5, 15, 'ENG-TOEIC-05-Q15', 'HARD', 'GRAMMAR', 'The system log _____ by the IT team yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'was approved', 'has approve', 'is approving', 'approved', 1),
    (5, 16, 'ENG-TOEIC-05-Q16', 'EASY', 'VOCABULARY', '(distribution center) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'agenda', 'deadline', 'refund', 'branch', 3),
    (5, 17, 'ENG-TOEIC-05-Q17', 'EASY', 'VOCABULARY', '(distribution center) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'vacancy', 'shift', 'receipt', 'forecast', 3),
    (5, 18, 'ENG-TOEIC-05-Q18', 'MEDIUM', 'VOCABULARY', '(distribution center) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'manual', 'entrance', 'target', 'route', 3),
    (5, 19, 'ENG-TOEIC-05-Q19', 'MEDIUM', 'VOCABULARY', '(distribution center) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'fragile', 'accurate', 'crowded', 'temporary', 2),
    (5, 20, 'ENG-TOEIC-05-Q20', 'HARD', 'VOCABULARY', '(distribution center) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'manufacture', 'decorate', 'postpone', 'subscribe', 3),
    (5, 21, 'ENG-TOEIC-05-Q21', 'EASY', 'VOCABULARY', '(distribution center) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'damage', 'salary', 'attendance', 'permission', 1),
    (5, 22, 'ENG-TOEIC-05-Q22', 'EASY', 'VOCABULARY', '(distribution center) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'annual', 'portable', 'relevant', 'vacant', 3),
    (5, 23, 'ENG-TOEIC-05-Q23', 'MEDIUM', 'VOCABULARY', '(distribution center) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'borrow', 'notify', 'purchase', 'assemble', 2),
    (5, 24, 'ENG-TOEIC-05-Q24', 'MEDIUM', 'VOCABULARY', '(distribution center) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'attach', 'delay', 'repair', 'expand', 4),
    (5, 25, 'ENG-TOEIC-05-Q25', 'HARD', 'VOCABULARY', '(distribution center) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'manual', 'invoice', 'candidate', 'coupon', 1),
    (5, 26, 'ENG-TOEIC-05-Q26', 'EASY', 'TOEIC', '[Training Center]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'I traveled by train.', 'The contract is on blue paper.', 'The cafeteria is downstairs.', 'Certainly. I''ll email it after I check the figures.', 4),
    (5, 27, 'ENG-TOEIC-05-Q27', 'EASY', 'TOEIC', '[Training Center]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'In the equipment room.', 'At around two this afternoon.', 'Yes, the device is new.', 'For about three hours.', 2),
    (5, 28, 'ENG-TOEIC-05-Q28', 'MEDIUM', 'TOEIC', '[Training Center]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'At ten o''clock.', 'Yes, I attended it.', 'In Conference Room A.', 'Because the director is traveling on Thursday.', 4),
    (5, 29, 'ENG-TOEIC-05-Q29', 'MEDIUM', 'TOEIC', '[Training Center]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'The printer is upstairs.', 'It has four pages.', 'Yesterday was busy.', 'Not at all. I''ll look at it now.', 4),
    (5, 30, 'ENG-TOEIC-05-Q30', 'HARD', 'TOEIC', '[Training Center]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'The driver called.', 'There are eight boxes.', 'They arrived this morning.', 'Next to the receiving desk, please.', 4),
    (5, 31, 'ENG-TOEIC-05-Q31', 'EASY', 'TOEIC', '[Training Center]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'The trip was enjoyable.', 'It has five pages.', 'Not yet. I''m waiting for one receipt.', 'At the finance office.', 3),
    (5, 32, 'ENG-TOEIC-05-Q32', 'EASY', 'TOEIC', '[Training Center]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'Every evening after the office closes.', 'It takes ten minutes.', 'For the IT team.', 'On a secure server.', 1),
    (5, 33, 'ENG-TOEIC-05-Q33', 'MEDIUM', 'TOEIC', '[Training Center]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'In the showroom.', 'At nine thirty.', 'Ms. Lee from the sales team.', 'For new clients.', 3),
    (5, 34, 'ENG-TOEIC-05-Q34', 'MEDIUM', 'TOEIC', '[Training Center]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'Yes, as long as you have the receipt.', 'The headset is wireless.', 'I exchanged currency.', 'The box is cardboard.', 1),
    (5, 35, 'ENG-TOEIC-05-Q35', 'HARD', 'TOEIC', '[Training Center]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'Your camera is black.', 'I''ll check the network connection right away.', 'We ordered new chairs.', 'The room seats twelve.', 2),
    (5, 36, 'ENG-TOEIC-05-Q36', 'EASY', 'TOEIC', '[EMAIL]
The customer-service training session will begin at 9:30 a.m. on Friday in Lab 2. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 3:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To replace the room computer', 'To return it to IT', 'To show vacation photos', 'To participate in a hands-on exercise', 4),
    (5, 37, 'ENG-TOEIC-05-Q37', 'EASY', 'TOEIC', '[EMAIL]
The customer-service training session will begin at 9:30 a.m. on Friday in Lab 2. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 3:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A short user guide', 'A new laptop', 'A parking permit', 'A customer invoice', 1),
    (5, 38, 'ENG-TOEIC-05-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The staff parking lot will be closed from October 10 through October 12 while new lighting is installed. Employees should use the visitor lot on Lake Avenue during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'New lighting will be installed', 'A product launch will occur', 'Customers requested more spaces', 'The lot will be sold', 1),
    (5, 39, 'ENG-TOEIC-05-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The staff parking lot will be closed from October 10 through October 12 while new lighting is installed. Employees should use the visitor lot on Lake Avenue during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'At the loading dock', 'In the visitor lot', 'Inside the warehouse', 'Beside the cafeteria', 2),
    (5, 40, 'ENG-TOEIC-05-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning May, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A hotel membership number', 'A project code and manager approval', 'A customer signature', 'A paper airline ticket', 2),
    (5, 41, 'ENG-TOEIC-05-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning May, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are deleted immediately', 'They are returned for correction', 'They are automatically paid', 'They are sent to customers', 2),
    (5, 42, 'ENG-TOEIC-05-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Parkview Hotel before November 14 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'A third night free', 'Breakfast for two', 'Dinner every evening', 'Free airport transport', 2),
    (5, 43, 'ENG-TOEIC-05-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Parkview Hotel before November 14 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'It must be booked after arrival', 'It must be reserved at least 24 hours ahead', 'Guests must stay three nights', 'It is available only on holidays', 2),
    (5, 44, 'ENG-TOEIC-05-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Office 3 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 4:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The contract was deleted', 'The computer does not recognize the scanner', 'The cable is missing', 'The scanner has no power', 2),
    (5, 45, 'ENG-TOEIC-05-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Office 3 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 4:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'A printer is out of paper', 'The office closes permanently', 'A signed contract must be uploaded before the deadline', 'The employee is buying a computer', 3),
    (5, 46, 'ENG-TOEIC-05-Q46', 'EASY', 'TOEIC', '[Training Center] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Tell the customer to retry forever.', 'Delete the account immediately.', 'Ask for the customer''s password.', 'Confirm the error details and check the payment service status.', 4),
    (5, 47, 'ENG-TOEIC-05-Q47', 'EASY', 'TOEIC', '[Training Center] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'The cafeteria menu.', 'A customer''s invoice total.', 'The printer paper size.', 'Whether Wi-Fi is enabled and the correct network is selected.', 4),
    (5, 48, 'ENG-TOEIC-05-Q48', 'MEDIUM', 'TOEIC', '[Training Center] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Ignore the message.', 'Promise an unverified refund date.', 'Apologize, verify the order, and explain the replacement process.', 'Argue with the client.', 3),
    (5, 49, 'ENG-TOEIC-05-Q49', 'MEDIUM', 'TOEIC', '[Training Center] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The monitor resolution is too high.', 'The request was permanently successful.', 'The keyboard is broken.', 'The server or an upstream service is temporarily unavailable.', 4),
    (5, 50, 'ENG-TOEIC-05-Q50', 'HARD', 'TOEIC', '[Training Center] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Close unrelated windows and hide sensitive information.', 'Post internal passwords in chat.', 'Disable security controls.', 'Open private employee files.', 1),
    (6, 1, 'ENG-TOEIC-06-Q01', 'EASY', 'GRAMMAR', 'The marketing team _____ the campaign plan since last week.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'has updated', 'have updated', 'will updated', 'is updating', 1),
    (6, 2, 'ENG-TOEIC-06-Q02', 'EASY', 'GRAMMAR', 'The campaign plan must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'reviewed it', 'be reviewed', 'be reviewing', 'review', 2),
    (6, 3, 'ENG-TOEIC-06-Q03', 'MEDIUM', 'GRAMMAR', 'If the marketing team _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'will receive', 'receives', 'received', 'receiving', 2),
    (6, 4, 'ENG-TOEIC-06-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the campaign plan is working with the marketing team.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'whom', 'where', 'who', 'which', 3),
    (6, 5, 'ENG-TOEIC-06-Q05', 'HARD', 'GRAMMAR', 'This version of the campaign plan is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'more accurate', 'most accurate', 'accurately', 'accuracy', 1),
    (6, 6, 'ENG-TOEIC-06-Q06', 'EASY', 'GRAMMAR', 'The manager asked the marketing team _____ the campaign plan again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'checked', 'check to', 'checking', 'to check', 4),
    (6, 7, 'ENG-TOEIC-06-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the campaign plan before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'checking', 'checked', 'to checked', 'check', 1),
    (6, 8, 'ENG-TOEIC-06-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the marketing team _____ the campaign plan.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'has completed', 'completes', 'had completed', 'will complete', 3),
    (6, 9, 'ENG-TOEIC-06-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the marketing team finishes the campaign plan.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'until', 'despite', 'during', 'because of', 1),
    (6, 10, 'ENG-TOEIC-06-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'clarity', 'more clearly', 'most clearly', 'clear', 2),
    (6, 11, 'ENG-TOEIC-06-Q11', 'EASY', 'GRAMMAR', 'The campaign plan needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'to be revised', 'to revising', 'revised it', 'revise', 1),
    (6, 12, 'ENG-TOEIC-06-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the campaign plan _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'unless', 'while', 'although', 'because of', 4),
    (6, 13, 'ENG-TOEIC-06-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the campaign plan.', 'Cấu trúc adjective + enough + to V.', 'hold', 'held', 'to hold', 'holding', 3),
    (6, 14, 'ENG-TOEIC-06-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the marketing team _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'is', 'was', 'are', 'be', 3),
    (6, 15, 'ENG-TOEIC-06-Q15', 'HARD', 'GRAMMAR', 'The campaign plan _____ by the marketing team yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'is approving', 'has approve', 'was approved', 'approved', 3),
    (6, 16, 'ENG-TOEIC-06-Q16', 'EASY', 'VOCABULARY', '(downtown office) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'branch', 'agenda', 'deadline', 'refund', 4),
    (6, 17, 'ENG-TOEIC-06-Q17', 'EASY', 'VOCABULARY', '(downtown office) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'shift', 'forecast', 'vacancy', 'receipt', 4),
    (6, 18, 'ENG-TOEIC-06-Q18', 'MEDIUM', 'VOCABULARY', '(downtown office) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'manual', 'entrance', 'route', 'target', 4),
    (6, 19, 'ENG-TOEIC-06-Q19', 'MEDIUM', 'VOCABULARY', '(downtown office) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'crowded', 'fragile', 'accurate', 'temporary', 3),
    (6, 20, 'ENG-TOEIC-06-Q20', 'HARD', 'VOCABULARY', '(downtown office) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'postpone', 'subscribe', 'decorate', 'manufacture', 1),
    (6, 21, 'ENG-TOEIC-06-Q21', 'EASY', 'VOCABULARY', '(downtown office) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'permission', 'attendance', 'salary', 'damage', 4),
    (6, 22, 'ENG-TOEIC-06-Q22', 'EASY', 'VOCABULARY', '(downtown office) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'relevant', 'vacant', 'annual', 'portable', 1),
    (6, 23, 'ENG-TOEIC-06-Q23', 'MEDIUM', 'VOCABULARY', '(downtown office) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'purchase', 'borrow', 'notify', 'assemble', 3),
    (6, 24, 'ENG-TOEIC-06-Q24', 'MEDIUM', 'VOCABULARY', '(downtown office) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'attach', 'delay', 'repair', 'expand', 4),
    (6, 25, 'ENG-TOEIC-06-Q25', 'HARD', 'VOCABULARY', '(downtown office) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'candidate', 'manual', 'coupon', 'invoice', 2),
    (6, 26, 'ENG-TOEIC-06-Q26', 'EASY', 'TOEIC', '[Sales Floor]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'I traveled by train.', 'Certainly. I''ll email it after I check the figures.', 'The contract is on blue paper.', 'The cafeteria is downstairs.', 2),
    (6, 27, 'ENG-TOEIC-06-Q27', 'EASY', 'TOEIC', '[Sales Floor]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'At around two this afternoon.', 'In the equipment room.', 'For about three hours.', 'Yes, the device is new.', 1),
    (6, 28, 'ENG-TOEIC-06-Q28', 'MEDIUM', 'TOEIC', '[Sales Floor]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'In Conference Room A.', 'At ten o''clock.', 'Yes, I attended it.', 'Because the director is traveling on Thursday.', 4),
    (6, 29, 'ENG-TOEIC-06-Q29', 'MEDIUM', 'TOEIC', '[Sales Floor]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'Not at all. I''ll look at it now.', 'It has four pages.', 'Yesterday was busy.', 'The printer is upstairs.', 1),
    (6, 30, 'ENG-TOEIC-06-Q30', 'HARD', 'TOEIC', '[Sales Floor]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'The driver called.', 'There are eight boxes.', 'They arrived this morning.', 'Next to the receiving desk, please.', 4),
    (6, 31, 'ENG-TOEIC-06-Q31', 'EASY', 'TOEIC', '[Sales Floor]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'It has five pages.', 'Not yet. I''m waiting for one receipt.', 'The trip was enjoyable.', 'At the finance office.', 2),
    (6, 32, 'ENG-TOEIC-06-Q32', 'EASY', 'TOEIC', '[Sales Floor]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'Every evening after the office closes.', 'For the IT team.', 'It takes ten minutes.', 'On a secure server.', 1),
    (6, 33, 'ENG-TOEIC-06-Q33', 'MEDIUM', 'TOEIC', '[Sales Floor]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'At nine thirty.', 'Ms. Lee from the sales team.', 'For new clients.', 'In the showroom.', 2),
    (6, 34, 'ENG-TOEIC-06-Q34', 'MEDIUM', 'TOEIC', '[Sales Floor]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'The box is cardboard.', 'The headset is wireless.', 'Yes, as long as you have the receipt.', 'I exchanged currency.', 3),
    (6, 35, 'ENG-TOEIC-06-Q35', 'HARD', 'TOEIC', '[Sales Floor]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'The room seats twelve.', 'Your camera is black.', 'I''ll check the network connection right away.', 'We ordered new chairs.', 3),
    (6, 36, 'ENG-TOEIC-06-Q36', 'EASY', 'TOEIC', '[EMAIL]
The security training session will begin at 10:30 a.m. on Monday in Room A. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 4:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To return it to IT', 'To participate in a hands-on exercise', 'To replace the room computer', 'To show vacation photos', 2),
    (6, 37, 'ENG-TOEIC-06-Q37', 'EASY', 'TOEIC', '[EMAIL]
The security training session will begin at 10:30 a.m. on Monday in Room A. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 4:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A new laptop', 'A parking permit', 'A customer invoice', 'A short user guide', 4),
    (6, 38, 'ENG-TOEIC-06-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The west parking lot will be closed from October 11 through October 13 while new lighting is installed. Employees should use the visitor lot on King Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'A product launch will occur', 'New lighting will be installed', 'Customers requested more spaces', 'The lot will be sold', 2),
    (6, 39, 'ENG-TOEIC-06-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The west parking lot will be closed from October 11 through October 13 while new lighting is installed. Employees should use the visitor lot on King Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'At the loading dock', 'Inside the warehouse', 'Beside the cafeteria', 'In the visitor lot', 4),
    (6, 40, 'ENG-TOEIC-06-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning June, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A hotel membership number', 'A paper airline ticket', 'A customer signature', 'A project code and manager approval', 4),
    (6, 41, 'ENG-TOEIC-06-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning June, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are automatically paid', 'They are sent to customers', 'They are deleted immediately', 'They are returned for correction', 4),
    (6, 42, 'ENG-TOEIC-06-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at River City Hotel before November 15 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'Dinner every evening', 'A third night free', 'Breakfast for two', 'Free airport transport', 3),
    (6, 43, 'ENG-TOEIC-06-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at River City Hotel before November 15 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'It is available only on holidays', 'It must be reserved at least 24 hours ahead', 'Guests must stay three nights', 'It must be booked after arrival', 2),
    (6, 44, 'ENG-TOEIC-06-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Desk 12 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 5:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The cable is missing', 'The computer does not recognize the scanner', 'The contract was deleted', 'The scanner has no power', 2),
    (6, 45, 'ENG-TOEIC-06-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Desk 12 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 5:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'A signed contract must be uploaded before the deadline', 'A printer is out of paper', 'The employee is buying a computer', 'The office closes permanently', 1),
    (6, 46, 'ENG-TOEIC-06-Q46', 'EASY', 'TOEIC', '[Sales Floor] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Tell the customer to retry forever.', 'Ask for the customer''s password.', 'Delete the account immediately.', 'Confirm the error details and check the payment service status.', 4),
    (6, 47, 'ENG-TOEIC-06-Q47', 'EASY', 'TOEIC', '[Sales Floor] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'A customer''s invoice total.', 'The printer paper size.', 'The cafeteria menu.', 'Whether Wi-Fi is enabled and the correct network is selected.', 4),
    (6, 48, 'ENG-TOEIC-06-Q48', 'MEDIUM', 'TOEIC', '[Sales Floor] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Apologize, verify the order, and explain the replacement process.', 'Argue with the client.', 'Ignore the message.', 'Promise an unverified refund date.', 1),
    (6, 49, 'ENG-TOEIC-06-Q49', 'MEDIUM', 'TOEIC', '[Sales Floor] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The monitor resolution is too high.', 'The request was permanently successful.', 'The server or an upstream service is temporarily unavailable.', 'The keyboard is broken.', 3),
    (6, 50, 'ENG-TOEIC-06-Q50', 'HARD', 'TOEIC', '[Sales Floor] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Post internal passwords in chat.', 'Open private employee files.', 'Disable security controls.', 'Close unrelated windows and hide sensitive information.', 4),
    (7, 1, 'ENG-TOEIC-07-Q01', 'EASY', 'GRAMMAR', 'The warehouse staff _____ the inventory record since this morning.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'will updated', 'has updated', 'have updated', 'is updating', 2),
    (7, 2, 'ENG-TOEIC-07-Q02', 'EASY', 'GRAMMAR', 'The inventory record must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'review', 'reviewed it', 'be reviewing', 'be reviewed', 4),
    (7, 3, 'ENG-TOEIC-07-Q03', 'MEDIUM', 'GRAMMAR', 'If the warehouse staff _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'will receive', 'receives', 'received', 'receiving', 2),
    (7, 4, 'ENG-TOEIC-07-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the inventory record is working with the warehouse staff.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'who', 'whom', 'where', 'which', 1),
    (7, 5, 'ENG-TOEIC-07-Q05', 'HARD', 'GRAMMAR', 'This version of the inventory record is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'accuracy', 'accurately', 'most accurate', 'more accurate', 4),
    (7, 6, 'ENG-TOEIC-07-Q06', 'EASY', 'GRAMMAR', 'The manager asked the warehouse staff _____ the inventory record again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'to check', 'checked', 'checking', 'check to', 1),
    (7, 7, 'ENG-TOEIC-07-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the inventory record before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'checking', 'checked', 'to checked', 'check', 1),
    (7, 8, 'ENG-TOEIC-07-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the warehouse staff _____ the inventory record.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'has completed', 'completes', 'had completed', 'will complete', 3),
    (7, 9, 'ENG-TOEIC-07-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the warehouse staff finishes the inventory record.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'until', 'because of', 'during', 'despite', 1),
    (7, 10, 'ENG-TOEIC-07-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'clear', 'clarity', 'most clearly', 'more clearly', 4),
    (7, 11, 'ENG-TOEIC-07-Q11', 'EASY', 'GRAMMAR', 'The inventory record needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'revise', 'revised it', 'to be revised', 'to revising', 3),
    (7, 12, 'ENG-TOEIC-07-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the inventory record _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'although', 'because of', 'unless', 'while', 2),
    (7, 13, 'ENG-TOEIC-07-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the inventory record.', 'Cấu trúc adjective + enough + to V.', 'held', 'holding', 'to hold', 'hold', 3),
    (7, 14, 'ENG-TOEIC-07-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the warehouse staff _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'are', 'be', 'was', 'is', 1),
    (7, 15, 'ENG-TOEIC-07-Q15', 'HARD', 'GRAMMAR', 'The inventory record _____ by the warehouse staff yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'was approved', 'has approve', 'approved', 'is approving', 1),
    (7, 16, 'ENG-TOEIC-07-Q16', 'EASY', 'VOCABULARY', '(training center) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'refund', 'branch', 'agenda', 'deadline', 1),
    (7, 17, 'ENG-TOEIC-07-Q17', 'EASY', 'VOCABULARY', '(training center) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'shift', 'forecast', 'receipt', 'vacancy', 3),
    (7, 18, 'ENG-TOEIC-07-Q18', 'MEDIUM', 'VOCABULARY', '(training center) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'entrance', 'target', 'manual', 'route', 2),
    (7, 19, 'ENG-TOEIC-07-Q19', 'MEDIUM', 'VOCABULARY', '(training center) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'fragile', 'temporary', 'crowded', 'accurate', 4),
    (7, 20, 'ENG-TOEIC-07-Q20', 'HARD', 'VOCABULARY', '(training center) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'decorate', 'manufacture', 'subscribe', 'postpone', 4),
    (7, 21, 'ENG-TOEIC-07-Q21', 'EASY', 'VOCABULARY', '(training center) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'permission', 'damage', 'attendance', 'salary', 2),
    (7, 22, 'ENG-TOEIC-07-Q22', 'EASY', 'VOCABULARY', '(training center) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'vacant', 'relevant', 'annual', 'portable', 2),
    (7, 23, 'ENG-TOEIC-07-Q23', 'MEDIUM', 'VOCABULARY', '(training center) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'notify', 'purchase', 'assemble', 'borrow', 1),
    (7, 24, 'ENG-TOEIC-07-Q24', 'MEDIUM', 'VOCABULARY', '(training center) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'delay', 'expand', 'attach', 'repair', 2),
    (7, 25, 'ENG-TOEIC-07-Q25', 'HARD', 'VOCABULARY', '(training center) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'invoice', 'coupon', 'candidate', 'manual', 4),
    (7, 26, 'ENG-TOEIC-07-Q26', 'EASY', 'TOEIC', '[Service Desk]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'Certainly. I''ll email it after I check the figures.', 'The contract is on blue paper.', 'The cafeteria is downstairs.', 'I traveled by train.', 1),
    (7, 27, 'ENG-TOEIC-07-Q27', 'EASY', 'TOEIC', '[Service Desk]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'At around two this afternoon.', 'In the equipment room.', 'For about three hours.', 'Yes, the device is new.', 1),
    (7, 28, 'ENG-TOEIC-07-Q28', 'MEDIUM', 'TOEIC', '[Service Desk]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'In Conference Room A.', 'Yes, I attended it.', 'Because the director is traveling on Thursday.', 'At ten o''clock.', 3),
    (7, 29, 'ENG-TOEIC-07-Q29', 'MEDIUM', 'TOEIC', '[Service Desk]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'The printer is upstairs.', 'Yesterday was busy.', 'Not at all. I''ll look at it now.', 'It has four pages.', 3),
    (7, 30, 'ENG-TOEIC-07-Q30', 'HARD', 'TOEIC', '[Service Desk]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'The driver called.', 'Next to the receiving desk, please.', 'There are eight boxes.', 'They arrived this morning.', 2),
    (7, 31, 'ENG-TOEIC-07-Q31', 'EASY', 'TOEIC', '[Service Desk]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'The trip was enjoyable.', 'Not yet. I''m waiting for one receipt.', 'It has five pages.', 'At the finance office.', 2),
    (7, 32, 'ENG-TOEIC-07-Q32', 'EASY', 'TOEIC', '[Service Desk]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'For the IT team.', 'On a secure server.', 'It takes ten minutes.', 'Every evening after the office closes.', 4),
    (7, 33, 'ENG-TOEIC-07-Q33', 'MEDIUM', 'TOEIC', '[Service Desk]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'Ms. Lee from the sales team.', 'For new clients.', 'In the showroom.', 'At nine thirty.', 1),
    (7, 34, 'ENG-TOEIC-07-Q34', 'MEDIUM', 'TOEIC', '[Service Desk]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'The headset is wireless.', 'Yes, as long as you have the receipt.', 'The box is cardboard.', 'I exchanged currency.', 2),
    (7, 35, 'ENG-TOEIC-07-Q35', 'HARD', 'TOEIC', '[Service Desk]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'Your camera is black.', 'We ordered new chairs.', 'I''ll check the network connection right away.', 'The room seats twelve.', 3),
    (7, 36, 'ENG-TOEIC-07-Q36', 'EASY', 'TOEIC', '[EMAIL]
The inventory training session will begin at 8:30 a.m. on Tuesday in Room B. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 2:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To return it to IT', 'To participate in a hands-on exercise', 'To show vacation photos', 'To replace the room computer', 2),
    (7, 37, 'ENG-TOEIC-07-Q37', 'EASY', 'TOEIC', '[EMAIL]
The inventory training session will begin at 8:30 a.m. on Tuesday in Room B. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 2:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A parking permit', 'A short user guide', 'A customer invoice', 'A new laptop', 2),
    (7, 38, 'ENG-TOEIC-07-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The east parking lot will be closed from October 12 through October 14 while new lighting is installed. Employees should use the visitor lot on Oak Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'The lot will be sold', 'A product launch will occur', 'New lighting will be installed', 'Customers requested more spaces', 3),
    (7, 39, 'ENG-TOEIC-07-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The east parking lot will be closed from October 12 through October 14 while new lighting is installed. Employees should use the visitor lot on Oak Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'In the visitor lot', 'Beside the cafeteria', 'Inside the warehouse', 'At the loading dock', 1),
    (7, 40, 'ENG-TOEIC-07-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning July, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A hotel membership number', 'A paper airline ticket', 'A project code and manager approval', 'A customer signature', 3),
    (7, 41, 'ENG-TOEIC-07-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning July, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are deleted immediately', 'They are automatically paid', 'They are returned for correction', 'They are sent to customers', 3),
    (7, 42, 'ENG-TOEIC-07-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Central Plaza Hotel before November 16 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'A third night free', 'Free airport transport', 'Breakfast for two', 'Dinner every evening', 3),
    (7, 43, 'ENG-TOEIC-07-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Central Plaza Hotel before November 16 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'It must be reserved at least 24 hours ahead', 'It must be booked after arrival', 'Guests must stay three nights', 'It is available only on holidays', 1),
    (7, 44, 'ENG-TOEIC-07-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Room 4 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 3:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The contract was deleted', 'The scanner has no power', 'The computer does not recognize the scanner', 'The cable is missing', 3),
    (7, 45, 'ENG-TOEIC-07-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Room 4 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 3:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'A signed contract must be uploaded before the deadline', 'The employee is buying a computer', 'The office closes permanently', 'A printer is out of paper', 1),
    (7, 46, 'ENG-TOEIC-07-Q46', 'EASY', 'TOEIC', '[Service Desk] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Tell the customer to retry forever.', 'Confirm the error details and check the payment service status.', 'Ask for the customer''s password.', 'Delete the account immediately.', 2),
    (7, 47, 'ENG-TOEIC-07-Q47', 'EASY', 'TOEIC', '[Service Desk] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'A customer''s invoice total.', 'Whether Wi-Fi is enabled and the correct network is selected.', 'The cafeteria menu.', 'The printer paper size.', 2),
    (7, 48, 'ENG-TOEIC-07-Q48', 'MEDIUM', 'TOEIC', '[Service Desk] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Promise an unverified refund date.', 'Argue with the client.', 'Apologize, verify the order, and explain the replacement process.', 'Ignore the message.', 3),
    (7, 49, 'ENG-TOEIC-07-Q49', 'MEDIUM', 'TOEIC', '[Service Desk] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The keyboard is broken.', 'The monitor resolution is too high.', 'The server or an upstream service is temporarily unavailable.', 'The request was permanently successful.', 3),
    (7, 50, 'ENG-TOEIC-07-Q50', 'HARD', 'TOEIC', '[Service Desk] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Disable security controls.', 'Close unrelated windows and hide sensitive information.', 'Open private employee files.', 'Post internal passwords in chat.', 2),
    (8, 1, 'ENG-TOEIC-08-Q01', 'EASY', 'GRAMMAR', 'The finance team _____ the budget file since yesterday.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'have updated', 'is updating', 'will updated', 'has updated', 4),
    (8, 2, 'ENG-TOEIC-08-Q02', 'EASY', 'GRAMMAR', 'The budget file must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'review', 'be reviewed', 'reviewed it', 'be reviewing', 2),
    (8, 3, 'ENG-TOEIC-08-Q03', 'MEDIUM', 'GRAMMAR', 'If the finance team _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'received', 'will receive', 'receives', 'receiving', 3),
    (8, 4, 'ENG-TOEIC-08-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the budget file is working with the finance team.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'which', 'who', 'where', 'whom', 2),
    (8, 5, 'ENG-TOEIC-08-Q05', 'HARD', 'GRAMMAR', 'This version of the budget file is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'accuracy', 'more accurate', 'most accurate', 'accurately', 2),
    (8, 6, 'ENG-TOEIC-08-Q06', 'EASY', 'GRAMMAR', 'The manager asked the finance team _____ the budget file again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'check to', 'to check', 'checked', 'checking', 2),
    (8, 7, 'ENG-TOEIC-08-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the budget file before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'check', 'to checked', 'checked', 'checking', 4),
    (8, 8, 'ENG-TOEIC-08-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the finance team _____ the budget file.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'completes', 'had completed', 'will complete', 'has completed', 2),
    (8, 9, 'ENG-TOEIC-08-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the finance team finishes the budget file.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'until', 'during', 'because of', 'despite', 1),
    (8, 10, 'ENG-TOEIC-08-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'more clearly', 'most clearly', 'clarity', 'clear', 1),
    (8, 11, 'ENG-TOEIC-08-Q11', 'EASY', 'GRAMMAR', 'The budget file needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'revise', 'revised it', 'to be revised', 'to revising', 3),
    (8, 12, 'ENG-TOEIC-08-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the budget file _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'while', 'because of', 'unless', 'although', 2),
    (8, 13, 'ENG-TOEIC-08-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the budget file.', 'Cấu trúc adjective + enough + to V.', 'held', 'holding', 'to hold', 'hold', 3),
    (8, 14, 'ENG-TOEIC-08-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the finance team _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'be', 'was', 'is', 'are', 4),
    (8, 15, 'ENG-TOEIC-08-Q15', 'HARD', 'GRAMMAR', 'The budget file _____ by the finance team yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'was approved', 'has approve', 'approved', 'is approving', 1),
    (8, 16, 'ENG-TOEIC-08-Q16', 'EASY', 'VOCABULARY', '(sales office) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'deadline', 'refund', 'agenda', 'branch', 2),
    (8, 17, 'ENG-TOEIC-08-Q17', 'EASY', 'VOCABULARY', '(sales office) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'receipt', 'shift', 'forecast', 'vacancy', 1),
    (8, 18, 'ENG-TOEIC-08-Q18', 'MEDIUM', 'VOCABULARY', '(sales office) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'manual', 'entrance', 'route', 'target', 4),
    (8, 19, 'ENG-TOEIC-08-Q19', 'MEDIUM', 'VOCABULARY', '(sales office) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'temporary', 'fragile', 'accurate', 'crowded', 3),
    (8, 20, 'ENG-TOEIC-08-Q20', 'HARD', 'VOCABULARY', '(sales office) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'manufacture', 'decorate', 'subscribe', 'postpone', 4),
    (8, 21, 'ENG-TOEIC-08-Q21', 'EASY', 'VOCABULARY', '(sales office) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'damage', 'attendance', 'salary', 'permission', 1),
    (8, 22, 'ENG-TOEIC-08-Q22', 'EASY', 'VOCABULARY', '(sales office) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'vacant', 'relevant', 'portable', 'annual', 2),
    (8, 23, 'ENG-TOEIC-08-Q23', 'MEDIUM', 'VOCABULARY', '(sales office) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'borrow', 'assemble', 'purchase', 'notify', 4),
    (8, 24, 'ENG-TOEIC-08-Q24', 'MEDIUM', 'VOCABULARY', '(sales office) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'attach', 'expand', 'repair', 'delay', 2),
    (8, 25, 'ENG-TOEIC-08-Q25', 'HARD', 'VOCABULARY', '(sales office) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'candidate', 'manual', 'coupon', 'invoice', 2),
    (8, 26, 'ENG-TOEIC-08-Q26', 'EASY', 'TOEIC', '[Project Office]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'The contract is on blue paper.', 'I traveled by train.', 'Certainly. I''ll email it after I check the figures.', 'The cafeteria is downstairs.', 3),
    (8, 27, 'ENG-TOEIC-08-Q27', 'EASY', 'TOEIC', '[Project Office]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'Yes, the device is new.', 'At around two this afternoon.', 'In the equipment room.', 'For about three hours.', 2),
    (8, 28, 'ENG-TOEIC-08-Q28', 'MEDIUM', 'TOEIC', '[Project Office]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'In Conference Room A.', 'Yes, I attended it.', 'At ten o''clock.', 'Because the director is traveling on Thursday.', 4),
    (8, 29, 'ENG-TOEIC-08-Q29', 'MEDIUM', 'TOEIC', '[Project Office]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'Not at all. I''ll look at it now.', 'Yesterday was busy.', 'The printer is upstairs.', 'It has four pages.', 1),
    (8, 30, 'ENG-TOEIC-08-Q30', 'HARD', 'TOEIC', '[Project Office]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'They arrived this morning.', 'There are eight boxes.', 'Next to the receiving desk, please.', 'The driver called.', 3),
    (8, 31, 'ENG-TOEIC-08-Q31', 'EASY', 'TOEIC', '[Project Office]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'It has five pages.', 'The trip was enjoyable.', 'At the finance office.', 'Not yet. I''m waiting for one receipt.', 4),
    (8, 32, 'ENG-TOEIC-08-Q32', 'EASY', 'TOEIC', '[Project Office]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'On a secure server.', 'Every evening after the office closes.', 'For the IT team.', 'It takes ten minutes.', 2),
    (8, 33, 'ENG-TOEIC-08-Q33', 'MEDIUM', 'TOEIC', '[Project Office]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'Ms. Lee from the sales team.', 'At nine thirty.', 'For new clients.', 'In the showroom.', 1),
    (8, 34, 'ENG-TOEIC-08-Q34', 'MEDIUM', 'TOEIC', '[Project Office]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'The box is cardboard.', 'I exchanged currency.', 'Yes, as long as you have the receipt.', 'The headset is wireless.', 3),
    (8, 35, 'ENG-TOEIC-08-Q35', 'HARD', 'TOEIC', '[Project Office]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'I''ll check the network connection right away.', 'The room seats twelve.', 'We ordered new chairs.', 'Your camera is black.', 1),
    (8, 36, 'ENG-TOEIC-08-Q36', 'EASY', 'TOEIC', '[EMAIL]
The billing training session will begin at 9:30 a.m. on Wednesday in Room C. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 3:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To show vacation photos', 'To replace the room computer', 'To participate in a hands-on exercise', 'To return it to IT', 3),
    (8, 37, 'ENG-TOEIC-08-Q37', 'EASY', 'TOEIC', '[EMAIL]
The billing training session will begin at 9:30 a.m. on Wednesday in Room C. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 3:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A parking permit', 'A new laptop', 'A customer invoice', 'A short user guide', 4),
    (8, 38, 'ENG-TOEIC-08-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The north parking lot will be closed from October 13 through October 15 while new lighting is installed. Employees should use the visitor lot on River Road during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'A product launch will occur', 'New lighting will be installed', 'Customers requested more spaces', 'The lot will be sold', 2),
    (8, 39, 'ENG-TOEIC-08-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The north parking lot will be closed from October 13 through October 15 while new lighting is installed. Employees should use the visitor lot on River Road during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'Beside the cafeteria', 'Inside the warehouse', 'At the loading dock', 'In the visitor lot', 4),
    (8, 40, 'ENG-TOEIC-08-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning August, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A customer signature', 'A paper airline ticket', 'A hotel membership number', 'A project code and manager approval', 4),
    (8, 41, 'ENG-TOEIC-08-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning August, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are deleted immediately', 'They are returned for correction', 'They are sent to customers', 'They are automatically paid', 2),
    (8, 42, 'ENG-TOEIC-08-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Harbor Business Hotel before November 17 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'Dinner every evening', 'Free airport transport', 'Breakfast for two', 'A third night free', 3),
    (8, 43, 'ENG-TOEIC-08-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Harbor Business Hotel before November 17 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'Guests must stay three nights', 'It must be reserved at least 24 hours ahead', 'It is available only on holidays', 'It must be booked after arrival', 2),
    (8, 44, 'ENG-TOEIC-08-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Support Desk powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 4:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The cable is missing', 'The computer does not recognize the scanner', 'The scanner has no power', 'The contract was deleted', 2),
    (8, 45, 'ENG-TOEIC-08-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Support Desk powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 4:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'A printer is out of paper', 'The employee is buying a computer', 'The office closes permanently', 'A signed contract must be uploaded before the deadline', 4),
    (8, 46, 'ENG-TOEIC-08-Q46', 'EASY', 'TOEIC', '[Project Office] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Delete the account immediately.', 'Tell the customer to retry forever.', 'Confirm the error details and check the payment service status.', 'Ask for the customer''s password.', 3),
    (8, 47, 'ENG-TOEIC-08-Q47', 'EASY', 'TOEIC', '[Project Office] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'Whether Wi-Fi is enabled and the correct network is selected.', 'A customer''s invoice total.', 'The cafeteria menu.', 'The printer paper size.', 1),
    (8, 48, 'ENG-TOEIC-08-Q48', 'MEDIUM', 'TOEIC', '[Project Office] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Argue with the client.', 'Ignore the message.', 'Promise an unverified refund date.', 'Apologize, verify the order, and explain the replacement process.', 4),
    (8, 49, 'ENG-TOEIC-08-Q49', 'MEDIUM', 'TOEIC', '[Project Office] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The keyboard is broken.', 'The monitor resolution is too high.', 'The request was permanently successful.', 'The server or an upstream service is temporarily unavailable.', 4),
    (8, 50, 'ENG-TOEIC-08-Q50', 'HARD', 'TOEIC', '[Project Office] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Post internal passwords in chat.', 'Disable security controls.', 'Open private employee files.', 'Close unrelated windows and hide sensitive information.', 4),
    (9, 1, 'ENG-TOEIC-09-Q01', 'EASY', 'GRAMMAR', 'The project team _____ the status report since the start of the month.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'has updated', 'will updated', 'have updated', 'is updating', 1),
    (9, 2, 'ENG-TOEIC-09-Q02', 'EASY', 'GRAMMAR', 'The status report must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'reviewed it', 'review', 'be reviewed', 'be reviewing', 3),
    (9, 3, 'ENG-TOEIC-09-Q03', 'MEDIUM', 'GRAMMAR', 'If the project team _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'received', 'will receive', 'receiving', 'receives', 4),
    (9, 4, 'ENG-TOEIC-09-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the status report is working with the project team.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'where', 'whom', 'which', 'who', 4),
    (9, 5, 'ENG-TOEIC-09-Q05', 'HARD', 'GRAMMAR', 'This version of the status report is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'accuracy', 'most accurate', 'more accurate', 'accurately', 3),
    (9, 6, 'ENG-TOEIC-09-Q06', 'EASY', 'GRAMMAR', 'The manager asked the project team _____ the status report again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'checked', 'checking', 'check to', 'to check', 4),
    (9, 7, 'ENG-TOEIC-09-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the status report before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'check', 'checked', 'to checked', 'checking', 4),
    (9, 8, 'ENG-TOEIC-09-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the project team _____ the status report.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'completes', 'had completed', 'has completed', 'will complete', 2),
    (9, 9, 'ENG-TOEIC-09-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the project team finishes the status report.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'during', 'because of', 'despite', 'until', 4),
    (9, 10, 'ENG-TOEIC-09-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'more clearly', 'clear', 'clarity', 'most clearly', 1),
    (9, 11, 'ENG-TOEIC-09-Q11', 'EASY', 'GRAMMAR', 'The status report needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'revised it', 'to revising', 'revise', 'to be revised', 4),
    (9, 12, 'ENG-TOEIC-09-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the status report _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'unless', 'although', 'because of', 'while', 3),
    (9, 13, 'ENG-TOEIC-09-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the status report.', 'Cấu trúc adjective + enough + to V.', 'holding', 'to hold', 'hold', 'held', 2),
    (9, 14, 'ENG-TOEIC-09-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the project team _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'be', 'is', 'are', 'was', 3),
    (9, 15, 'ENG-TOEIC-09-Q15', 'HARD', 'GRAMMAR', 'The status report _____ by the project team yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'approved', 'was approved', 'has approve', 'is approving', 2),
    (9, 16, 'ENG-TOEIC-09-Q16', 'EASY', 'VOCABULARY', '(support desk) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'branch', 'refund', 'deadline', 'agenda', 2),
    (9, 17, 'ENG-TOEIC-09-Q17', 'EASY', 'VOCABULARY', '(support desk) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'shift', 'receipt', 'forecast', 'vacancy', 2),
    (9, 18, 'ENG-TOEIC-09-Q18', 'MEDIUM', 'VOCABULARY', '(support desk) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'manual', 'route', 'entrance', 'target', 4),
    (9, 19, 'ENG-TOEIC-09-Q19', 'MEDIUM', 'VOCABULARY', '(support desk) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'temporary', 'fragile', 'crowded', 'accurate', 4),
    (9, 20, 'ENG-TOEIC-09-Q20', 'HARD', 'VOCABULARY', '(support desk) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'manufacture', 'decorate', 'subscribe', 'postpone', 4),
    (9, 21, 'ENG-TOEIC-09-Q21', 'EASY', 'VOCABULARY', '(support desk) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'damage', 'salary', 'permission', 'attendance', 1),
    (9, 22, 'ENG-TOEIC-09-Q22', 'EASY', 'VOCABULARY', '(support desk) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'portable', 'vacant', 'relevant', 'annual', 3),
    (9, 23, 'ENG-TOEIC-09-Q23', 'MEDIUM', 'VOCABULARY', '(support desk) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'borrow', 'assemble', 'notify', 'purchase', 3),
    (9, 24, 'ENG-TOEIC-09-Q24', 'MEDIUM', 'VOCABULARY', '(support desk) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'delay', 'attach', 'repair', 'expand', 4),
    (9, 25, 'ENG-TOEIC-09-Q25', 'HARD', 'VOCABULARY', '(support desk) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'coupon', 'manual', 'invoice', 'candidate', 2),
    (9, 26, 'ENG-TOEIC-09-Q26', 'EASY', 'TOEIC', '[Client Site]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'The contract is on blue paper.', 'I traveled by train.', 'Certainly. I''ll email it after I check the figures.', 'The cafeteria is downstairs.', 3),
    (9, 27, 'ENG-TOEIC-09-Q27', 'EASY', 'TOEIC', '[Client Site]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'In the equipment room.', 'Yes, the device is new.', 'For about three hours.', 'At around two this afternoon.', 4),
    (9, 28, 'ENG-TOEIC-09-Q28', 'MEDIUM', 'TOEIC', '[Client Site]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'Because the director is traveling on Thursday.', 'Yes, I attended it.', 'At ten o''clock.', 'In Conference Room A.', 1),
    (9, 29, 'ENG-TOEIC-09-Q29', 'MEDIUM', 'TOEIC', '[Client Site]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'Not at all. I''ll look at it now.', 'It has four pages.', 'Yesterday was busy.', 'The printer is upstairs.', 1),
    (9, 30, 'ENG-TOEIC-09-Q30', 'HARD', 'TOEIC', '[Client Site]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'The driver called.', 'Next to the receiving desk, please.', 'They arrived this morning.', 'There are eight boxes.', 2),
    (9, 31, 'ENG-TOEIC-09-Q31', 'EASY', 'TOEIC', '[Client Site]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'The trip was enjoyable.', 'At the finance office.', 'Not yet. I''m waiting for one receipt.', 'It has five pages.', 3),
    (9, 32, 'ENG-TOEIC-09-Q32', 'EASY', 'TOEIC', '[Client Site]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'On a secure server.', 'It takes ten minutes.', 'Every evening after the office closes.', 'For the IT team.', 3),
    (9, 33, 'ENG-TOEIC-09-Q33', 'MEDIUM', 'TOEIC', '[Client Site]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'For new clients.', 'In the showroom.', 'Ms. Lee from the sales team.', 'At nine thirty.', 3),
    (9, 34, 'ENG-TOEIC-09-Q34', 'MEDIUM', 'TOEIC', '[Client Site]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'Yes, as long as you have the receipt.', 'The headset is wireless.', 'I exchanged currency.', 'The box is cardboard.', 1),
    (9, 35, 'ENG-TOEIC-09-Q35', 'HARD', 'TOEIC', '[Client Site]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'The room seats twelve.', 'Your camera is black.', 'We ordered new chairs.', 'I''ll check the network connection right away.', 4),
    (9, 36, 'ENG-TOEIC-09-Q36', 'EASY', 'TOEIC', '[EMAIL]
The software training session will begin at 10:30 a.m. on Thursday in Lab 1. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 4:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To return it to IT', 'To participate in a hands-on exercise', 'To replace the room computer', 'To show vacation photos', 2),
    (9, 37, 'ENG-TOEIC-09-Q37', 'EASY', 'TOEIC', '[EMAIL]
The software training session will begin at 10:30 a.m. on Thursday in Lab 1. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 4:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A new laptop', 'A parking permit', 'A customer invoice', 'A short user guide', 4),
    (9, 38, 'ENG-TOEIC-09-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The south parking lot will be closed from October 14 through October 16 while new lighting is installed. Employees should use the visitor lot on Market Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'New lighting will be installed', 'The lot will be sold', 'Customers requested more spaces', 'A product launch will occur', 1),
    (9, 39, 'ENG-TOEIC-09-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The south parking lot will be closed from October 14 through October 16 while new lighting is installed. Employees should use the visitor lot on Market Street during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'In the visitor lot', 'At the loading dock', 'Inside the warehouse', 'Beside the cafeteria', 1),
    (9, 40, 'ENG-TOEIC-09-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning September, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A project code and manager approval', 'A paper airline ticket', 'A customer signature', 'A hotel membership number', 1),
    (9, 41, 'ENG-TOEIC-09-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning September, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are returned for correction', 'They are sent to customers', 'They are automatically paid', 'They are deleted immediately', 1),
    (9, 42, 'ENG-TOEIC-09-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Metro Inn before November 18 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'A third night free', 'Dinner every evening', 'Breakfast for two', 'Free airport transport', 3),
    (9, 43, 'ENG-TOEIC-09-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Metro Inn before November 18 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'It is available only on holidays', 'It must be reserved at least 24 hours ahead', 'It must be booked after arrival', 'Guests must stay three nights', 2),
    (9, 44, 'ENG-TOEIC-09-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Reception powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 5:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The contract was deleted', 'The scanner has no power', 'The computer does not recognize the scanner', 'The cable is missing', 3),
    (9, 45, 'ENG-TOEIC-09-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Reception powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 5:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'The employee is buying a computer', 'The office closes permanently', 'A signed contract must be uploaded before the deadline', 'A printer is out of paper', 3),
    (9, 46, 'ENG-TOEIC-09-Q46', 'EASY', 'TOEIC', '[Client Site] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Delete the account immediately.', 'Ask for the customer''s password.', 'Confirm the error details and check the payment service status.', 'Tell the customer to retry forever.', 3),
    (9, 47, 'ENG-TOEIC-09-Q47', 'EASY', 'TOEIC', '[Client Site] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'A customer''s invoice total.', 'The cafeteria menu.', 'The printer paper size.', 'Whether Wi-Fi is enabled and the correct network is selected.', 4),
    (9, 48, 'ENG-TOEIC-09-Q48', 'MEDIUM', 'TOEIC', '[Client Site] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Argue with the client.', 'Ignore the message.', 'Apologize, verify the order, and explain the replacement process.', 'Promise an unverified refund date.', 3),
    (9, 49, 'ENG-TOEIC-09-Q49', 'MEDIUM', 'TOEIC', '[Client Site] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The monitor resolution is too high.', 'The server or an upstream service is temporarily unavailable.', 'The keyboard is broken.', 'The request was permanently successful.', 2),
    (9, 50, 'ENG-TOEIC-09-Q50', 'HARD', 'TOEIC', '[Client Site] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Disable security controls.', 'Close unrelated windows and hide sensitive information.', 'Post internal passwords in chat.', 'Open private employee files.', 2),
    (10, 1, 'ENG-TOEIC-10-Q01', 'EASY', 'GRAMMAR', 'The service team _____ the customer record since June.', 'Chủ ngữ số ít dạng ''team/department/staff'' trong câu này được xem như một đơn vị; ''since'' gợi hiện tại hoàn thành: has + V3.', 'is updating', 'will updated', 'have updated', 'has updated', 4),
    (10, 2, 'ENG-TOEIC-10-Q02', 'EASY', 'GRAMMAR', 'The customer record must _____ before it is sent to the director.', 'Sau modal ''must'', câu bị động dùng ''must be + V3''.', 'be reviewing', 'review', 'reviewed it', 'be reviewed', 4),
    (10, 3, 'ENG-TOEIC-10-Q03', 'MEDIUM', 'GRAMMAR', 'If the service team _____ the file today, we can finish the task on time.', 'Mệnh đề if loại 1 dùng hiện tại đơn; mệnh đề chính có thể dùng ''can + V''.', 'receiving', 'will receive', 'received', 'receives', 4),
    (10, 4, 'ENG-TOEIC-10-Q04', 'MEDIUM', 'GRAMMAR', 'The employee _____ prepared the customer record is working with the service team.', '''Who'' thay cho người và làm chủ ngữ của mệnh đề quan hệ.', 'which', 'who', 'where', 'whom', 2),
    (10, 5, 'ENG-TOEIC-10-Q05', 'HARD', 'GRAMMAR', 'This version of the customer record is _____ than the previous one.', 'Có ''than'' nên dùng dạng so sánh hơn; với ''accurate'' dùng ''more accurate''.', 'accuracy', 'most accurate', 'more accurate', 'accurately', 3),
    (10, 6, 'ENG-TOEIC-10-Q06', 'EASY', 'GRAMMAR', 'The manager asked the service team _____ the customer record again.', 'Cấu trúc ''ask someone to do something'' dùng to-infinitive.', 'checked', 'to check', 'checking', 'check to', 2),
    (10, 7, 'ENG-TOEIC-10-Q07', 'EASY', 'GRAMMAR', 'Please finish _____ the customer record before the meeting.', '''Finish'' đi với V-ing: finish checking.', 'check', 'to checked', 'checking', 'checked', 3),
    (10, 8, 'ENG-TOEIC-10-Q08', 'MEDIUM', 'GRAMMAR', 'By the time the director arrived, the service team _____ the customer record.', 'Hành động hoàn tất trước một mốc quá khứ khác dùng quá khứ hoàn thành: had + V3.', 'will complete', 'completes', 'had completed', 'has completed', 3),
    (10, 9, 'ENG-TOEIC-10-Q09', 'MEDIUM', 'GRAMMAR', 'The office will remain open _____ the service team finishes the customer record.', '''Until'' nối hai mệnh đề và diễn tả kéo dài cho đến khi sự việc xảy ra.', 'because of', 'until', 'during', 'despite', 2),
    (10, 10, 'ENG-TOEIC-10-Q10', 'HARD', 'GRAMMAR', 'The supervisor explained the new procedure _____ than before.', 'Động từ ''explained'' cần trạng từ; có ''than'' nên dùng trạng từ so sánh hơn.', 'more clearly', 'clarity', 'most clearly', 'clear', 1),
    (10, 11, 'ENG-TOEIC-10-Q11', 'EASY', 'GRAMMAR', 'The customer record needs _____ before tomorrow''s meeting.', '''Need to be + V3'' diễn tả một việc cần được thực hiện.', 'to revising', 'revise', 'to be revised', 'revised it', 3),
    (10, 12, 'ENG-TOEIC-10-Q12', 'EASY', 'GRAMMAR', 'We postponed the review of the customer record _____ a scheduling conflict.', 'Sau chỗ trống là cụm danh từ nên dùng ''because of''.', 'although', 'unless', 'while', 'because of', 4),
    (10, 13, 'ENG-TOEIC-10-Q13', 'MEDIUM', 'GRAMMAR', 'The storage area is large enough _____ all copies of the customer record.', 'Cấu trúc adjective + enough + to V.', 'held', 'to hold', 'holding', 'hold', 2),
    (10, 14, 'ENG-TOEIC-10-Q14', 'MEDIUM', 'GRAMMAR', 'Neither the manager nor the members of the service team _____ available now.', 'Với neither...nor, động từ hòa hợp với chủ ngữ gần nhất; ''members'' là số nhiều.', 'are', 'was', 'is', 'be', 1),
    (10, 15, 'ENG-TOEIC-10-Q15', 'HARD', 'GRAMMAR', 'The customer record _____ by the service team yesterday.', 'Có ''yesterday'' và chủ ngữ nhận hành động nên dùng quá khứ đơn bị động: was + V3.', 'approved', 'has approve', 'was approved', 'is approving', 3),
    (10, 16, 'ENG-TOEIC-10-Q16', 'EASY', 'VOCABULARY', '(warehouse) The company offered a full _____ after the customer was charged twice.', 'refund = khoản hoàn tiền.', 'refund', 'deadline', 'agenda', 'branch', 1),
    (10, 17, 'ENG-TOEIC-10-Q17', 'EASY', 'VOCABULARY', '(warehouse) Please keep the original _____ if you may need to return the product.', 'receipt = biên nhận/hóa đơn mua hàng.', 'forecast', 'receipt', 'shift', 'vacancy', 2),
    (10, 18, 'ENG-TOEIC-10-Q18', 'MEDIUM', 'VOCABULARY', '(warehouse) The department exceeded its quarterly sales _____.', 'sales target = mục tiêu doanh số.', 'route', 'target', 'entrance', 'manual', 2),
    (10, 19, 'ENG-TOEIC-10-Q19', 'MEDIUM', 'VOCABULARY', '(warehouse) We need a more _____ estimate before approving the budget.', 'accurate = chính xác, phù hợp với estimate.', 'accurate', 'fragile', 'temporary', 'crowded', 1),
    (10, 20, 'ENG-TOEIC-10-Q20', 'HARD', 'VOCABULARY', '(warehouse) The manager decided to _____ the meeting until Friday.', 'postpone = hoãn.', 'decorate', 'manufacture', 'postpone', 'subscribe', 3),
    (10, 21, 'ENG-TOEIC-10-Q21', 'EASY', 'VOCABULARY', '(warehouse) The packaging helps prevent _____ during transportation.', 'damage = hư hỏng.', 'permission', 'salary', 'damage', 'attendance', 3),
    (10, 22, 'ENG-TOEIC-10-Q22', 'EASY', 'VOCABULARY', '(warehouse) Applicants should have _____ experience in customer service.', 'relevant experience = kinh nghiệm liên quan.', 'annual', 'vacant', 'relevant', 'portable', 3),
    (10, 23, 'ENG-TOEIC-10-Q23', 'MEDIUM', 'VOCABULARY', '(warehouse) Please _____ me when the replacement part arrives.', 'notify someone = thông báo cho ai.', 'borrow', 'purchase', 'assemble', 'notify', 4),
    (10, 24, 'ENG-TOEIC-10-Q24', 'MEDIUM', 'VOCABULARY', '(warehouse) The firm plans to _____ its services into another region.', 'expand = mở rộng.', 'repair', 'delay', 'expand', 'attach', 3),
    (10, 25, 'ENG-TOEIC-10-Q25', 'HARD', 'VOCABULARY', '(warehouse) Read the instruction _____ before operating the machine.', 'instruction manual = tài liệu hướng dẫn.', 'manual', 'candidate', 'invoice', 'coupon', 1),
    (10, 26, 'ENG-TOEIC-10-Q26', 'EASY', 'TOEIC', '[Operations Room]
A: Could you send me the revised contract by noon?
B: _____', 'Đây là lời yêu cầu; đáp án phù hợp là chấp nhận và nêu hành động sẽ làm.', 'The cafeteria is downstairs.', 'I traveled by train.', 'Certainly. I''ll email it after I check the figures.', 'The contract is on blue paper.', 3),
    (10, 27, 'ENG-TOEIC-10-Q27', 'EASY', 'TOEIC', '[Operations Room]
A: When is the technician expected to arrive?
B: _____', '''When'' hỏi thời điểm nên cần câu trả lời về thời gian.', 'For about three hours.', 'In the equipment room.', 'Yes, the device is new.', 'At around two this afternoon.', 4),
    (10, 28, 'ENG-TOEIC-10-Q28', 'MEDIUM', 'TOEIC', '[Operations Room]
A: Why was the meeting moved to Friday?
B: _____', '''Why'' hỏi lý do; ''Because...'' trả lời trực tiếp nguyên nhân.', 'Yes, I attended it.', 'Because the director is traveling on Thursday.', 'In Conference Room A.', 'At ten o''clock.', 2),
    (10, 29, 'ENG-TOEIC-10-Q29', 'MEDIUM', 'TOEIC', '[Operations Room]
A: Would you mind checking this invoice?
B: _____', '''Would you mind...?'' là lời nhờ; ''Not at all'' thể hiện đồng ý.', 'It has four pages.', 'Yesterday was busy.', 'Not at all. I''ll look at it now.', 'The printer is upstairs.', 3),
    (10, 30, 'ENG-TOEIC-10-Q30', 'HARD', 'TOEIC', '[Operations Room]
A: Where should I leave these boxes?
B: _____', '''Where'' hỏi địa điểm.', 'They arrived this morning.', 'The driver called.', 'There are eight boxes.', 'Next to the receiving desk, please.', 4),
    (10, 31, 'ENG-TOEIC-10-Q31', 'EASY', 'TOEIC', '[Operations Room]
A: Haven''t you submitted the expense report yet?
B: _____', 'Câu hỏi xác nhận trạng thái; ''Not yet'' trả lời trực tiếp.', 'Not yet. I''m waiting for one receipt.', 'At the finance office.', 'It has five pages.', 'The trip was enjoyable.', 1),
    (10, 32, 'ENG-TOEIC-10-Q32', 'EASY', 'TOEIC', '[Operations Room]
A: How often do you back up the database?
B: _____', '''How often'' hỏi tần suất.', 'On a secure server.', 'Every evening after the office closes.', 'It takes ten minutes.', 'For the IT team.', 2),
    (10, 33, 'ENG-TOEIC-10-Q33', 'MEDIUM', 'TOEIC', '[Operations Room]
A: Who will lead the product demonstration?
B: _____', '''Who'' hỏi người.', 'At nine thirty.', 'Ms. Lee from the sales team.', 'In the showroom.', 'For new clients.', 2),
    (10, 34, 'ENG-TOEIC-10-Q34', 'MEDIUM', 'TOEIC', '[Operations Room]
A: Can I exchange this headset without the box?
B: _____', 'Câu hỏi về khả năng/điều kiện đổi hàng; đáp án nêu điều kiện phù hợp.', 'Yes, as long as you have the receipt.', 'The headset is wireless.', 'I exchanged currency.', 'The box is cardboard.', 1),
    (10, 35, 'ENG-TOEIC-10-Q35', 'HARD', 'TOEIC', '[Operations Room]
A: The video call keeps disconnecting.
B: _____', 'Người A báo sự cố; phản hồi hợp lý là xử lý kết nối.', 'The room seats twelve.', 'We ordered new chairs.', 'Your camera is black.', 'I''ll check the network connection right away.', 4),
    (10, 36, 'ENG-TOEIC-10-Q36', 'EASY', 'TOEIC', '[EMAIL]
The onboarding training session will begin at 8:30 a.m. on Friday in Lab 2. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 2:00 p.m.. A short user guide will be emailed the day before.
Why should employees bring a laptop?', 'Đoạn email nói rõ laptop được dùng cho bài thực hành.', 'To replace the room computer', 'To show vacation photos', 'To return it to IT', 'To participate in a hands-on exercise', 4),
    (10, 37, 'ENG-TOEIC-10-Q37', 'EASY', 'TOEIC', '[EMAIL]
The onboarding training session will begin at 8:30 a.m. on Friday in Lab 2. Employees should bring a company laptop because the instructor will include a hands-on exercise. Staff who have client meetings may attend a repeat session at 2:00 p.m.. A short user guide will be emailed the day before.
What will be sent before the session?', 'Câu cuối cho biết một user guide ngắn sẽ được gửi trước buổi học.', 'A new laptop', 'A customer invoice', 'A parking permit', 'A short user guide', 4),
    (10, 38, 'ENG-TOEIC-10-Q38', 'MEDIUM', 'TOEIC', '[NOTICE]
The staff parking lot will be closed from October 15 through October 17 while new lighting is installed. Employees should use the visitor lot on Lake Avenue during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Why will the parking lot be closed?', 'Thông báo nêu nguyên nhân là lắp hệ thống chiếu sáng mới.', 'The lot will be sold', 'A product launch will occur', 'Customers requested more spaces', 'New lighting will be installed', 4),
    (10, 39, 'ENG-TOEIC-10-Q39', 'MEDIUM', 'TOEIC', '[NOTICE]
The staff parking lot will be closed from October 15 through October 17 while new lighting is installed. Employees should use the visitor lot on Lake Avenue during this period. Shuttle buses will stop there every 15 minutes between 7:00 and 9:30 a.m. The lot will reopen the following morning.
Where should employees park temporarily?', 'Nhân viên được hướng dẫn dùng visitor lot.', 'Beside the cafeteria', 'At the loading dock', 'In the visitor lot', 'Inside the warehouse', 3),
    (10, 40, 'ENG-TOEIC-10-Q40', 'HARD', 'TOEIC', '[MEMO]
Beginning October, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What must every expense report include?', 'Memo nêu hai thông tin bắt buộc là project code và manager approval.', 'A project code and manager approval', 'A customer signature', 'A hotel membership number', 'A paper airline ticket', 1),
    (10, 41, 'ENG-TOEIC-10-Q41', 'EASY', 'TOEIC', '[MEMO]
Beginning October, employees who travel for business must submit expense reports within ten days of returning. Digital copies of receipts are acceptable, but every report must include a project code and manager approval. Reports missing either item will be returned for correction. Questions should be sent to the Finance Help Desk.
What happens to reports missing required information?', 'Memo nói báo cáo thiếu thông tin sẽ được trả lại để sửa.', 'They are sent to customers', 'They are returned for correction', 'They are automatically paid', 'They are deleted immediately', 2),
    (10, 42, 'ENG-TOEIC-10-Q42', 'EASY', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Parkview Hotel before November 19 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is included in the advertised stay?', 'Ưu đãi bao gồm complimentary breakfast for two.', 'Free airport transport', 'Dinner every evening', 'A third night free', 'Breakfast for two', 4),
    (10, 43, 'ENG-TOEIC-10-Q43', 'MEDIUM', 'TOEIC', '[ADVERTISEMENT]
Book a two-night weekday stay at Parkview Hotel before November 19 and receive complimentary breakfast for two. Guests also have free access to the fitness center and business lounge. Airport transportation costs extra and must be reserved at least 24 hours in advance. The offer does not apply on public holidays.
What is required for airport transportation?', 'Đoạn quảng cáo yêu cầu đặt xe sân bay trước ít nhất 24 giờ.', 'It is available only on holidays', 'Guests must stay three nights', 'It must be booked after arrival', 'It must be reserved at least 24 hours ahead', 4),
    (10, 44, 'ENG-TOEIC-10-Q44', 'MEDIUM', 'TOEIC', '[EMAIL]
The scanner at Office 3 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 3:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
What problem is reported?', 'Thiết bị có nguồn nhưng máy tính không nhận scanner.', 'The contract was deleted', 'The scanner has no power', 'The cable is missing', 'The computer does not recognize the scanner', 4),
    (10, 45, 'ENG-TOEIC-10-Q45', 'HARD', 'TOEIC', '[EMAIL]
The scanner at Office 3 powers on, but the computer no longer recognizes it. I restarted both devices and changed the cable, but the problem remains. I have a signed contract that must be uploaded before 3:00 p.m.. Could a technician check the scanner before lunch? If not, please tell me where I can use another one.
Why is the issue urgent?', 'Người viết cần tải hợp đồng lên trước thời hạn.', 'The employee is buying a computer', 'A printer is out of paper', 'The office closes permanently', 'A signed contract must be uploaded before the deadline', 4),
    (10, 46, 'ENG-TOEIC-10-Q46', 'EASY', 'TOEIC', '[Operations Room] A customer sees ''payment failed'' after two attempts. What is the best first response?', 'Nên xác nhận chi tiết lỗi và trạng thái dịch vụ trước khi kết luận hoặc yêu cầu thao tác thêm.', 'Confirm the error details and check the payment service status.', 'Ask for the customer''s password.', 'Delete the account immediately.', 'Tell the customer to retry forever.', 1),
    (10, 47, 'ENG-TOEIC-10-Q47', 'EASY', 'TOEIC', '[Operations Room] Your laptop cannot connect to Wi-Fi, while coworkers can. What should you check first?', 'Khi lỗi chỉ xảy ra trên một máy, kiểm tra kết nối và network được chọn trên máy đó trước.', 'The printer paper size.', 'Whether Wi-Fi is enabled and the correct network is selected.', 'A customer''s invoice total.', 'The cafeteria menu.', 2),
    (10, 48, 'ENG-TOEIC-10-Q48', 'MEDIUM', 'TOEIC', '[Operations Room] A client reports receiving the wrong item. What is the best initial action?', 'Dịch vụ khách hàng nên xin lỗi, xác minh đơn và hướng dẫn quy trình xử lý.', 'Argue with the client.', 'Apologize, verify the order, and explain the replacement process.', 'Promise an unverified refund date.', 'Ignore the message.', 2),
    (10, 49, 'ENG-TOEIC-10-Q49', 'MEDIUM', 'TOEIC', '[Operations Room] An application returns HTTP 503. What does this usually indicate?', 'HTTP 503 thường chỉ dịch vụ tạm thời không thể xử lý request, có thể do quá tải, bảo trì hoặc upstream.', 'The keyboard is broken.', 'The monitor resolution is too high.', 'The request was permanently successful.', 'The server or an upstream service is temporarily unavailable.', 4),
    (10, 50, 'ENG-TOEIC-10-Q50', 'HARD', 'TOEIC', '[Operations Room] Before sharing your screen with a customer, what should you do?', 'Cần tránh để lộ thông tin nhạy cảm hoặc không liên quan khi chia sẻ màn hình.', 'Post internal passwords in chat.', 'Disable security controls.', 'Close unrelated windows and hide sensitive information.', 'Open private employee files.', 3);

INSERT INTO questions
    (id, created_at, updated_at, subtopic_id, code, difficulty, language,
     category, status, published_version_id)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, node.id,
       source.code, source.difficulty, 'EN', source.category, 'PUBLISHED', NULL
FROM toeic_source source
JOIN knowledge_nodes node
  ON node.slug = format('eng-toeic-test-%s', lpad(source.quiz_number::text, 2, '0'));

INSERT INTO question_versions
    (id, created_at, question_id, version_number, content, explanation)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, question.id, 1,
       source.content, source.explanation
FROM toeic_source source
JOIN questions question ON question.code = source.code;

INSERT INTO question_options
    (id, created_at, question_version_id, position, content, is_correct, explanation)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, version.id, option.position,
       option.content, option.position = source.correct_position, source.explanation
FROM toeic_source source
JOIN questions question ON question.code = source.code
JOIN question_versions version ON version.question_id = question.id AND version.version_number = 1
CROSS JOIN LATERAL (
    VALUES (1, source.option_1), (2, source.option_2),
           (3, source.option_3), (4, source.option_4)
) option(position, content);

UPDATE questions question
SET published_version_id = version.id, status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP
FROM question_versions version
WHERE version.question_id = question.id
  AND version.version_number = 1
  AND question.code LIKE 'ENG-TOEIC-%';

INSERT INTO quizzes
    (id, created_at, updated_at, title, type, code, selection_mode,
     pass_percentage, language, category, maximum_score, duration_seconds, status)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
       format('TOEIC Practice Test %s', lpad(number::text, 2, '0')),
       'TOPIC', format('ENG-TOEIC-TEST-%s', lpad(number::text, 2, '0')),
       'FIXED', 70, 'EN', 'MIXED', 500, NULL, 'PUBLISHED'
FROM generate_series(1, 10) number;

INSERT INTO quiz_fixed_questions
    (id, created_at, quiz_id, question_id, position)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, quiz.id, question.id, source.question_number
FROM toeic_source source
JOIN quizzes quiz
  ON quiz.code = format('ENG-TOEIC-TEST-%s', lpad(source.quiz_number::text, 2, '0'))
JOIN questions question ON question.code = source.code;

UPDATE pet_settings
SET quiz_pass_points = 30, updated_at = CURRENT_TIMESTAMP, version = version + 1
WHERE id = 1 AND quiz_pass_points <> 30;

DO $$
BEGIN
    IF (SELECT count(*) FROM questions WHERE code LIKE 'ENG-TOEIC-%') <> 500 THEN
        RAISE EXCEPTION 'Expected 500 ENG TOEIC questions';
    END IF;
    IF (SELECT count(DISTINCT version.content)
        FROM question_versions version
        JOIN questions question ON question.id = version.question_id
        WHERE question.code LIKE 'ENG-TOEIC-%') <> 491 THEN
        RAISE EXCEPTION 'Unexpected distinct ENG TOEIC question content count';
    END IF;
    IF EXISTS (
        SELECT quiz.id
        FROM quizzes quiz
        LEFT JOIN quiz_fixed_questions fixed ON fixed.quiz_id = quiz.id
        WHERE quiz.code LIKE 'ENG-TOEIC-TEST-%'
        GROUP BY quiz.id
        HAVING count(fixed.id) <> 50
    ) THEN
        RAISE EXCEPTION 'Every ENG TOEIC quiz must contain exactly 50 questions';
    END IF;
    IF EXISTS (
        SELECT version.id
        FROM question_versions version
        JOIN questions question ON question.id = version.question_id
        LEFT JOIN question_options option ON option.question_version_id = version.id
        WHERE question.code LIKE 'ENG-TOEIC-%'
        GROUP BY version.id
        HAVING count(option.id) <> 4
            OR count(option.id) FILTER (WHERE option.is_correct) <> 1
    ) THEN
        RAISE EXCEPTION 'Every ENG TOEIC question must have four options and one correct answer';
    END IF;
END
$$;

COMMIT;
