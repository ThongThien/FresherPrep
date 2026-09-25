-- FresherPrep JOB 23 - English quiz/assessment sample data.
-- Idempotent and limited to English quiz codes owned by this seed.

BEGIN;

SET search_path TO fresherprep, public;

ALTER TABLE quizzes
    ADD COLUMN IF NOT EXISTS language varchar(8) NOT NULL DEFAULT 'VI',
    ADD COLUMN IF NOT EXISTS category varchar(24) NOT NULL DEFAULT 'TECHNICAL',
    ADD COLUMN IF NOT EXISTS maximum_score integer NOT NULL DEFAULT 100;

ALTER TABLE quiz_attempts
    ADD COLUMN IF NOT EXISTS language varchar(8) NOT NULL DEFAULT 'VI',
    ADD COLUMN IF NOT EXISTS category varchar(24) NOT NULL DEFAULT 'TECHNICAL',
    ADD COLUMN IF NOT EXISTS maximum_score integer NOT NULL DEFAULT 100;

CREATE INDEX IF NOT EXISTS idx_quizzes_language_category_status
    ON quizzes (language, category, status);

ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_category_check;
ALTER TABLE quizzes ADD CONSTRAINT quizzes_category_check
    CHECK (category IN ('TECHNICAL', 'GRAMMAR', 'VOCABULARY', 'TOEIC', 'MIXED'));

ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_category_check;
ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_category_check
    CHECK (category IN ('TECHNICAL', 'GRAMMAR', 'VOCABULARY', 'TOEIC', 'MIXED'));

UPDATE quiz_attempts attempt
SET language = quiz.language,
    category = quiz.category,
    maximum_score = quiz.maximum_score
FROM quizzes quiz
WHERE attempt.quiz_id = quiz.id
  AND (attempt.language IS DISTINCT FROM quiz.language
       OR attempt.category IS DISTINCT FROM quiz.category
       OR attempt.maximum_score IS DISTINCT FROM quiz.maximum_score);

INSERT INTO quizzes
    (id, created_at, updated_at, title, type, code, selection_mode,
     pass_percentage, language, category, maximum_score, status)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'English Grammar Practice', 'MIXED', 'EN-GRAMMAR-PRACTICE-001',
     'RULE_BASED', 70, 'EN', 'GRAMMAR', 500, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'English Vocabulary Practice', 'MIXED', 'EN-VOCABULARY-PRACTICE-001',
     'FIXED', 70, 'EN', 'VOCABULARY', 500, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'FresherPrep TOEIC Practice', 'MIXED', 'EN-TOEIC-PRACTICE-001',
     'FIXED', 70, 'EN', 'TOEIC', 500, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'English Mixed Assessment', 'MIXED', 'EN-MIXED-ASSESSMENT-001',
     'RULE_BASED', 70, 'EN', 'MIXED', 500, 'PUBLISHED')
ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    type = EXCLUDED.type,
    selection_mode = EXCLUDED.selection_mode,
    pass_percentage = EXCLUDED.pass_percentage,
    language = EXCLUDED.language,
    category = EXCLUDED.category,
    maximum_score = EXCLUDED.maximum_score,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH fixed_seed(quiz_code, question_code, position) AS (
    VALUES
        ('EN-VOCABULARY-PRACTICE-001', 'ENG-VOC-WORK-001', 1),
        ('EN-VOCABULARY-PRACTICE-001', 'ENG-VOC-BUSINESS-001', 2),
        ('EN-VOCABULARY-PRACTICE-001', 'ENG-VOC-TECH-001', 3),
        ('EN-VOCABULARY-PRACTICE-001', 'ENG-VOC-COMM-001', 4),
        ('EN-TOEIC-PRACTICE-001', 'ENG-TOEIC-P2-001', 1),
        ('EN-TOEIC-PRACTICE-001', 'ENG-TOEIC-P5-001', 2),
        ('EN-TOEIC-PRACTICE-001', 'ENG-TOEIC-P7-001', 3)
)
INSERT INTO quiz_fixed_questions
    (id, created_at, quiz_id, question_id, position)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, quiz.id, question.id, seed.position
FROM fixed_seed seed
JOIN quizzes quiz ON quiz.code = seed.quiz_code
JOIN questions question ON question.code = seed.question_code
WHERE question.language = 'EN'
  AND question.status = 'PUBLISHED'
ON CONFLICT (quiz_id, question_id) DO UPDATE SET
    position = EXCLUDED.position;

WITH rule_seed(quiz_code, node_slug, question_count) AS (
    VALUES
        ('EN-GRAMMAR-PRACTICE-001', 'english-grammar', 5),
        ('EN-MIXED-ASSESSMENT-001', 'english-grammar', 2),
        ('EN-MIXED-ASSESSMENT-001', 'english-vocabulary', 2),
        ('EN-MIXED-ASSESSMENT-001', 'english-toeic', 2)
)
INSERT INTO quiz_rules
    (id, created_at, quiz_id, knowledge_node_id, difficulty, question_count)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, quiz.id, node.id, NULL, seed.question_count
FROM rule_seed seed
JOIN quizzes quiz ON quiz.code = seed.quiz_code
JOIN knowledge_nodes node ON node.slug = seed.node_slug
WHERE NOT EXISTS (
    SELECT 1
    FROM quiz_rules existing
    WHERE existing.quiz_id = quiz.id
      AND existing.knowledge_node_id = node.id
      AND existing.difficulty IS NULL
);

WITH rule_seed(quiz_code, node_slug, question_count) AS (
    VALUES
        ('EN-GRAMMAR-PRACTICE-001', 'english-grammar', 5),
        ('EN-MIXED-ASSESSMENT-001', 'english-grammar', 2),
        ('EN-MIXED-ASSESSMENT-001', 'english-vocabulary', 2),
        ('EN-MIXED-ASSESSMENT-001', 'english-toeic', 2)
)
UPDATE quiz_rules rule
SET question_count = seed.question_count
FROM rule_seed seed
JOIN quizzes quiz ON quiz.code = seed.quiz_code
JOIN knowledge_nodes node ON node.slug = seed.node_slug
WHERE rule.quiz_id = quiz.id
  AND rule.knowledge_node_id = node.id
  AND rule.difficulty IS NULL;

COMMIT;
