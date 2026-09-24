BEGIN;

SET LOCAL search_path TO fresherprep, public;

-- Idempotent seed: stable slugs/codes are upserted; runtime/user data is untouched.

-- ---------------------------------------------------------------------------
-- Knowledge tree
-- Current model has four node types. SUBTOPIC nodes cannot have children, so
-- Java Basics/Java Execution and Inheritance/Polymorphism are sibling subtopics.
-- ---------------------------------------------------------------------------

INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'TECHNOLOGY', NULL, 'Java', 'java', 0, 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET
    node_type = EXCLUDED.node_type,
    parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'CATEGORY', (SELECT id FROM knowledge_nodes WHERE slug = 'java'),
     'Java Fundamentals', 'java-fundamentals', 0, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'CATEGORY', (SELECT id FROM knowledge_nodes WHERE slug = 'java'),
     'OOP', 'oop', 1, 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET
    node_type = EXCLUDED.node_type,
    parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'TOPIC', (SELECT id FROM knowledge_nodes WHERE slug = 'java-fundamentals'),
     'Java Overview', 'java-overview', 0, 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET
    node_type = EXCLUDED.node_type,
    parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'SUBTOPIC', (SELECT id FROM knowledge_nodes WHERE slug = 'java-overview'),
     'Java Basics', 'java-basics', 0, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'SUBTOPIC', (SELECT id FROM knowledge_nodes WHERE slug = 'java-overview'),
     'Java Execution', 'java-execution', 1, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'SUBTOPIC', (SELECT id FROM knowledge_nodes WHERE slug = 'oop'),
     'Inheritance', 'inheritance', 0, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'SUBTOPIC', (SELECT id FROM knowledge_nodes WHERE slug = 'oop'),
     'Polymorphism', 'polymorphism', 1, 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET
    node_type = EXCLUDED.node_type,
    parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- Lessons and prerequisites
-- ---------------------------------------------------------------------------

INSERT INTO lessons
    (id, created_at, updated_at, subtopic_id, title, slug, content, status,
     display_order, minimum_read_seconds, required_scroll_percent)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     (SELECT id FROM knowledge_nodes WHERE slug = 'java-basics'),
     'Java Basics Overview', 'java-basics-overview',
     'Java source code is compiled into bytecode and executed by the Java Virtual Machine.',
     'PUBLISHED', 0, 45, 80),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     (SELECT id FROM knowledge_nodes WHERE slug = 'java-execution'),
     'Java Execution and JIT', 'java-execution-and-jit',
     'The JVM interprets bytecode and the JIT compiler optimizes frequently executed code.',
     'PUBLISHED', 0, 60, 85),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     (SELECT id FROM knowledge_nodes WHERE slug = 'inheritance'),
     'Java Inheritance', 'java-inheritance',
     'Inheritance lets a class reuse and specialize behavior from a parent class using extends.',
     'PUBLISHED', 0, 60, 80),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     (SELECT id FROM knowledge_nodes WHERE slug = 'polymorphism'),
     'Java Polymorphism', 'java-polymorphism',
     'Polymorphism allows a parent reference to invoke overridden behavior of a child object.',
     'PUBLISHED', 0, 60, 85)
ON CONFLICT (slug) DO UPDATE SET
    subtopic_id = EXCLUDED.subtopic_id,
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    display_order = EXCLUDED.display_order,
    minimum_read_seconds = EXCLUDED.minimum_read_seconds,
    required_scroll_percent = EXCLUDED.required_scroll_percent,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO lesson_prerequisites
    (id, created_at, lesson_id, prerequisite_lesson_id)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP,
     (SELECT id FROM lessons WHERE slug = 'java-execution-and-jit'),
     (SELECT id FROM lessons WHERE slug = 'java-basics-overview')),
    (gen_random_uuid(), CURRENT_TIMESTAMP,
     (SELECT id FROM lessons WHERE slug = 'java-polymorphism'),
     (SELECT id FROM lessons WHERE slug = 'java-inheritance'))
ON CONFLICT (lesson_id, prerequisite_lesson_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Learning path
-- ---------------------------------------------------------------------------

INSERT INTO learning_paths
    (id, created_at, updated_at, name, slug, technology_id, status)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'Java Backend Fresher', 'java-backend-fresher',
     (SELECT id FROM knowledge_nodes WHERE slug = 'java'), 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    technology_id = EXCLUDED.technology_id,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH path_items(lesson_slug, display_order, required, weight) AS (
    VALUES
        ('java-basics-overview', 1, TRUE, 1),
        ('java-execution-and-jit', 2, TRUE, 1),
        ('java-inheritance', 3, TRUE, 1),
        ('java-polymorphism', 4, TRUE, 1)
)
INSERT INTO learning_path_items
    (id, created_at, learning_path_id, lesson_id, display_order, required, weight)
SELECT
    gen_random_uuid(), CURRENT_TIMESTAMP, learning_path.id, lesson.id,
    seed.display_order, seed.required, seed.weight
FROM path_items seed
JOIN learning_paths learning_path ON learning_path.slug = 'java-backend-fresher'
JOIN lessons lesson ON lesson.slug = seed.lesson_slug
ON CONFLICT (learning_path_id, lesson_id) DO UPDATE SET
    display_order = EXCLUDED.display_order,
    required = EXCLUDED.required,
    weight = EXCLUDED.weight;

-- ---------------------------------------------------------------------------
-- Logical questions. published_version_id is assigned after versions/options.
-- ---------------------------------------------------------------------------

WITH question_seed(code, subtopic_slug, difficulty) AS (
    VALUES
        ('JAVA-BASIC-001', 'java-basics', 'EASY'),
        ('JAVA-EXEC-001', 'java-execution', 'MEDIUM'),
        ('JAVA-INHERIT-001', 'inheritance', 'MEDIUM'),
        ('JAVA-POLY-001', 'polymorphism', 'MEDIUM')
)
INSERT INTO questions
    (id, created_at, updated_at, subtopic_id, code, difficulty, status, published_version_id)
SELECT
    gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
    node.id, seed.code, seed.difficulty, 'PUBLISHED', NULL
FROM question_seed seed
JOIN knowledge_nodes node ON node.slug = seed.subtopic_slug
ON CONFLICT (code) DO UPDATE SET
    subtopic_id = EXCLUDED.subtopic_id,
    difficulty = EXCLUDED.difficulty,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH version_seed(code, content, explanation) AS (
    VALUES
        ('JAVA-BASIC-001',
         'Which component executes Java bytecode?',
         'The Java Virtual Machine loads and executes Java bytecode.'),
        ('JAVA-EXEC-001',
         'What is the primary purpose of the JIT compiler?',
         'The JIT compiler converts frequently executed bytecode into optimized native code.'),
        ('JAVA-INHERIT-001',
         'Which keyword is used for class inheritance in Java?',
         'A Java class inherits from another class with the extends keyword.'),
        ('JAVA-POLY-001',
         'Which mechanism enables runtime polymorphism in Java?',
         'Overridden instance methods are selected using the runtime type of the object.')
)
INSERT INTO question_versions
    (id, created_at, question_id, version_number, content, explanation)
SELECT
    gen_random_uuid(), CURRENT_TIMESTAMP, question.id, 1,
    seed.content, seed.explanation
FROM version_seed seed
JOIN questions question ON question.code = seed.code
ON CONFLICT (question_id, version_number) DO NOTHING;

WITH option_seed(code, position, content, is_correct, explanation) AS (
    VALUES
        ('JAVA-BASIC-001', 1, 'JVM', TRUE, 'Correct: the JVM executes Java bytecode.'),
        ('JAVA-BASIC-001', 2, 'JDK documentation', FALSE, 'Documentation describes APIs but does not execute bytecode.'),
        ('JAVA-BASIC-001', 3, 'Maven', FALSE, 'Maven is a build and dependency management tool.'),
        ('JAVA-BASIC-001', 4, 'Git', FALSE, 'Git is a version control system.'),

        ('JAVA-EXEC-001', 1, 'To store source code', FALSE, 'Source files are stored by the file system.'),
        ('JAVA-EXEC-001', 2, 'To optimize hot bytecode into native code', TRUE, 'Correct: JIT compilation improves runtime performance.'),
        ('JAVA-EXEC-001', 3, 'To manage Git branches', FALSE, 'Git branch management is unrelated to JVM execution.'),
        ('JAVA-EXEC-001', 4, 'To design database tables', FALSE, 'Database design is unrelated to JIT compilation.'),

        ('JAVA-INHERIT-001', 1, 'implements', FALSE, 'implements is used when a class implements an interface.'),
        ('JAVA-INHERIT-001', 2, 'inherits', FALSE, 'inherits is not a Java keyword.'),
        ('JAVA-INHERIT-001', 3, 'extends', TRUE, 'Correct: class inheritance uses extends.'),
        ('JAVA-INHERIT-001', 4, 'instanceof', FALSE, 'instanceof checks an object type at runtime.'),

        ('JAVA-POLY-001', 1, 'Method overriding', TRUE, 'Correct: overriding enables runtime method dispatch.'),
        ('JAVA-POLY-001', 2, 'Method overloading only', FALSE, 'Overloading is resolved at compile time.'),
        ('JAVA-POLY-001', 3, 'Variable shadowing', FALSE, 'Variable shadowing does not provide runtime dispatch.'),
        ('JAVA-POLY-001', 4, 'Package imports', FALSE, 'Imports only make type names available to source code.')
)
INSERT INTO question_options
    (id, created_at, question_version_id, position, content, is_correct, explanation)
SELECT
    gen_random_uuid(), CURRENT_TIMESTAMP, version.id,
    seed.position, seed.content, seed.is_correct, seed.explanation
FROM option_seed seed
JOIN questions question ON question.code = seed.code
JOIN question_versions version
    ON version.question_id = question.id AND version.version_number = 1
ON CONFLICT (question_version_id, position) DO NOTHING;

UPDATE questions question
SET published_version_id = version.id,
    status = 'PUBLISHED',
    updated_at = CURRENT_TIMESTAMP
FROM question_versions version
WHERE version.question_id = question.id
  AND version.version_number = 1
  AND question.code IN (
      'JAVA-BASIC-001',
      'JAVA-EXEC-001',
      'JAVA-INHERIT-001',
      'JAVA-POLY-001'
  );

-- ---------------------------------------------------------------------------
-- Quizzes
-- ---------------------------------------------------------------------------

INSERT INTO quizzes
    (id, created_at, updated_at, title, type, code, selection_mode, pass_percentage, status)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'Java Basics Fixed Quiz', 'TOPIC', 'JAVA-BASIC-FIXED-001', 'FIXED', 70, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'Java OOP Rule Quiz', 'MIXED', 'JAVA-OOP-RULE-001', 'RULE_BASED', 70, 'PUBLISHED')
ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    type = EXCLUDED.type,
    selection_mode = EXCLUDED.selection_mode,
    pass_percentage = EXCLUDED.pass_percentage,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH fixed_seed(question_code, position) AS (
    VALUES
        ('JAVA-BASIC-001', 1),
        ('JAVA-EXEC-001', 2)
)
INSERT INTO quiz_fixed_questions
    (id, created_at, quiz_id, question_id, position)
SELECT
    gen_random_uuid(), CURRENT_TIMESTAMP, quiz.id, question.id, seed.position
FROM fixed_seed seed
JOIN quizzes quiz ON quiz.code = 'JAVA-BASIC-FIXED-001'
JOIN questions question ON question.code = seed.question_code
ON CONFLICT (quiz_id, question_id) DO UPDATE SET
    position = EXCLUDED.position;

UPDATE quiz_rules rule
SET question_count = 2
FROM quizzes quiz, knowledge_nodes node
WHERE rule.quiz_id = quiz.id
  AND rule.knowledge_node_id = node.id
  AND quiz.code = 'JAVA-OOP-RULE-001'
  AND node.slug = 'oop'
  AND rule.difficulty = 'MEDIUM';

INSERT INTO quiz_rules
    (id, created_at, quiz_id, knowledge_node_id, difficulty, question_count)
SELECT
    gen_random_uuid(), CURRENT_TIMESTAMP, quiz.id, node.id, 'MEDIUM', 2
FROM quizzes quiz
JOIN knowledge_nodes node ON node.slug = 'oop'
WHERE quiz.code = 'JAVA-OOP-RULE-001'
  AND NOT EXISTS (
      SELECT 1
      FROM quiz_rules existing
      WHERE existing.quiz_id = quiz.id
        AND existing.knowledge_node_id = node.id
        AND existing.difficulty = 'MEDIUM'
  );

COMMIT;
