-- JOB 35 - SQL Practice application schema and initial exercises.
-- The executable dataset is isolated in H2 (sql-practice-dataset.sql), never production PostgreSQL.

BEGIN;
SET LOCAL search_path TO fresherprep, public;

ALTER TABLE pet_settings
    ADD COLUMN IF NOT EXISTS sql_practice_completion_points integer NOT NULL DEFAULT 10;

CREATE TABLE IF NOT EXISTS practice_exercises (
    id uuid PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    code varchar(50) NOT NULL UNIQUE,
    title varchar(200) NOT NULL,
    description text NOT NULL,
    language varchar(16) NOT NULL,
    difficulty varchar(16) NOT NULL,
    concepts varchar(200) NOT NULL,
    schema_description text NOT NULL,
    hint text NOT NULL,
    explanation text NOT NULL,
    reference_query text NOT NULL,
    display_order integer NOT NULL,
    status varchar(20) NOT NULL,
    CONSTRAINT ck_practice_language CHECK (language IN ('SQL', 'JAVA')),
    CONSTRAINT ck_practice_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'))
);
CREATE INDEX IF NOT EXISTS idx_practice_language_order
    ON practice_exercises(language, status, display_order);

CREATE TABLE IF NOT EXISTS user_practice_progress (
    id uuid PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id uuid NOT NULL REFERENCES users(id),
    exercise_id uuid NOT NULL REFERENCES practice_exercises(id),
    attempt_count integer NOT NULL DEFAULT 0,
    completed_at timestamptz,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT uk_user_practice_progress UNIQUE (user_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS practice_submissions (
    id uuid PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id uuid NOT NULL REFERENCES users(id),
    exercise_id uuid NOT NULL REFERENCES practice_exercises(id),
    submitted_query text NOT NULL,
    correct boolean NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_practice_submission_user_created
    ON practice_submissions(user_id, created_at);

WITH exercises(code, title, description, difficulty, concepts, schema_description, hint, explanation, reference_query, display_order) AS (
    VALUES
    ('SQL-001', 'Chọn danh sách nhân viên',
     'Trả về id, full_name và salary của toàn bộ nhân viên, sắp xếp theo id tăng dần.',
     'EASY', 'SELECT, ORDER BY',
     E'employees(id, full_name, department_id, salary, active)\ndepartments(id, name)\ncustomers(id, name, city)\ncustomer_orders(id, customer_id, total_amount, status, ordered_at)',
     'Bắt đầu bằng SELECT id, full_name, salary FROM employees.',
     'SELECT chọn đúng các cột cần thiết; ORDER BY id giúp kết quả có thứ tự ổn định.',
     'SELECT id, full_name, salary FROM employees ORDER BY id', 1),
    ('SQL-002', 'Lọc nhân viên đang hoạt động',
     'Tìm nhân viên đang hoạt động có salary từ 1300 trở lên. Trả về id, full_name, salary và sắp xếp salary giảm dần.',
     'EASY', 'SELECT, WHERE, ORDER BY',
     E'employees(id, full_name, department_id, salary, active)',
     'Kết hợp hai điều kiện bằng AND và dùng DESC.',
     'WHERE giới hạn active và salary; ORDER BY salary DESC đưa lương cao lên trước.',
     'SELECT id, full_name, salary FROM employees WHERE active = TRUE AND salary >= 1300 ORDER BY salary DESC', 2),
    ('SQL-003', 'Xếp hạng mức lương',
     'Trả về id, full_name, salary của nhân viên theo salary giảm dần; nếu bằng nhau thì id tăng dần.',
     'EASY', 'ORDER BY nhiều cột',
     E'employees(id, full_name, department_id, salary, active)',
     'ORDER BY có thể nhận nhiều cột, phân cách bằng dấu phẩy.',
     'SQL xét tiêu chí sắp xếp từ trái sang phải.',
     'SELECT id, full_name, salary FROM employees ORDER BY salary DESC, id', 3),
    ('SQL-004', 'Đếm nhân viên theo phòng ban',
     'Trả về department và employee_count cho mọi phòng ban, kể cả phòng chưa có nhân viên. Sắp xếp theo department id.',
     'MEDIUM', 'LEFT JOIN, COUNT, GROUP BY',
     E'departments(id, name)\nemployees(id, full_name, department_id, salary, active)',
     'Bắt đầu từ departments và LEFT JOIN employees.',
     'LEFT JOIN giữ mọi phòng ban; COUNT(e.id) không đếm giá trị NULL.',
     'SELECT d.name AS department, COUNT(e.id) AS employee_count FROM departments d LEFT JOIN employees e ON e.department_id = d.id GROUP BY d.id, d.name ORDER BY d.id', 4),
    ('SQL-005', 'Tổng tiền đơn đã thanh toán',
     'Trả về customer và total_spent, chỉ tính đơn PAID. Sắp xếp tổng tiền giảm dần.',
     'MEDIUM', 'JOIN, WHERE, SUM, GROUP BY',
     E'customers(id, name, city)\ncustomer_orders(id, customer_id, total_amount, status, ordered_at)',
     'JOIN customers với customer_orders rồi lọc status trước khi GROUP BY.',
     'SUM tổng hợp total_amount trong từng nhóm khách hàng.',
     'SELECT c.name AS customer, SUM(o.total_amount) AS total_spent FROM customers c JOIN customer_orders o ON o.customer_id = c.id WHERE o.status = ''PAID'' GROUP BY c.id, c.name ORDER BY total_spent DESC', 5),
    ('SQL-006', 'Lương trung bình theo phòng ban',
     'Trả về department và average_salary của các phòng có nhân viên. Sắp xếp theo department id.',
     'MEDIUM', 'JOIN, AVG, GROUP BY',
     E'departments(id, name)\nemployees(id, full_name, department_id, salary, active)',
     'Dùng INNER JOIN và AVG(salary).',
     'AVG tính trung bình trên các hàng của từng GROUP.',
     'SELECT d.name AS department, AVG(e.salary) AS average_salary FROM departments d JOIN employees e ON e.department_id = d.id GROUP BY d.id, d.name ORDER BY d.id', 6),
    ('SQL-007', 'Khách hàng có nhiều đơn',
     'Trả về customer và order_count cho khách có từ 2 đơn trở lên. Sắp xếp customer tăng dần.',
     'MEDIUM', 'JOIN, COUNT, GROUP BY, HAVING',
     E'customers(id, name, city)\ncustomer_orders(id, customer_id, total_amount, status, ordered_at)',
     'Điều kiện trên kết quả COUNT nằm trong HAVING, không phải WHERE.',
     'HAVING lọc sau GROUP BY nên phù hợp với điều kiện COUNT.',
     'SELECT c.name AS customer, COUNT(o.id) AS order_count FROM customers c JOIN customer_orders o ON o.customer_id = c.id GROUP BY c.id, c.name HAVING COUNT(o.id) >= 2 ORDER BY customer', 7),
    ('SQL-008', 'Nhân viên trên mức lương trung bình',
     'Trả về id, full_name, salary của nhân viên có salary lớn hơn mức trung bình toàn công ty. Sắp xếp salary giảm dần.',
     'HARD', 'AVG, basic subquery',
     E'employees(id, full_name, department_id, salary, active)',
     'Đặt SELECT AVG(salary) trong ngoặc ở vế phải của WHERE.',
     'Subquery tính một giá trị trung bình; query ngoài dùng giá trị đó để lọc.',
     'SELECT id, full_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees) ORDER BY salary DESC', 8)
)
INSERT INTO practice_exercises (
    id, created_at, code, title, description, language, difficulty, concepts,
    schema_description, hint, explanation, reference_query, display_order, status
)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, code, title, description, 'SQL', difficulty,
       concepts, schema_description, hint, explanation, reference_query, display_order, 'PUBLISHED'
FROM exercises
ON CONFLICT (code) DO NOTHING;

COMMIT;

