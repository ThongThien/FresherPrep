-- FresherPrep initial static setup.
-- This script is idempotent and intentionally creates no lessons, questions,
-- question versions/options, users, progress, attempts, or other runtime data.

BEGIN;

SET LOCAL search_path TO fresherprep, public;

-- Root knowledge nodes only. Child nodes can be managed later from Admin.
INSERT INTO knowledge_nodes (
    id, created_at, updated_at, node_type, parent_id,
    name, slug, display_order, status
)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'TECHNOLOGY', NULL,
     'Java', 'java', 0, 'PUBLISHED'),
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'TECHNOLOGY', NULL,
     'English', 'english', 1, 'PUBLISHED')
ON CONFLICT (slug) DO NOTHING;

-- English assessment shell:
-- 50 questions, maximum score 500, passing score 350 (70%).
-- It remains DRAFT until all questions and published versions are ready.
INSERT INTO quizzes (
    id, created_at, updated_at, title, type, code, selection_mode,
    pass_percentage, language, category, maximum_score, duration_seconds, status
)
VALUES (
    gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
    'English Fresher Assessment', 'READINESS', 'EN-FRESHER-ASSESSMENT-001',
    'RULE_BASED', 70, 'EN', 'MIXED', 500, NULL, 'DRAFT'
)
ON CONFLICT (code) DO NOTHING;

-- Balanced difficulty distribution for the 50-question assessment.
-- Each future question must belong to a published SUBTOPIC below the English root.
WITH rule_seed(difficulty, question_count) AS (
    VALUES
        ('EASY', 17),
        ('MEDIUM', 17),
        ('HARD', 16)
)
INSERT INTO quiz_rules (
    id, created_at, quiz_id, knowledge_node_id, difficulty, question_count
)
SELECT
    gen_random_uuid(), CURRENT_TIMESTAMP, quiz.id, english.id,
    seed.difficulty, seed.question_count
FROM rule_seed seed
JOIN quizzes quiz
    ON quiz.code = 'EN-FRESHER-ASSESSMENT-001'
   AND quiz.selection_mode = 'RULE_BASED'
JOIN knowledge_nodes english
    ON english.slug = 'english'
WHERE NOT EXISTS (
    SELECT 1
    FROM quiz_rules existing
    WHERE existing.quiz_id = quiz.id
      AND existing.knowledge_node_id = english.id
      AND existing.difficulty = seed.difficulty
);

-- Initial Pet configuration. Existing Admin changes are preserved on rerun.
INSERT INTO pet_settings (
    id, lesson_completion_points, quiz_pass_points, points_per_food,
    energy_per_food, updated_at, version
)
VALUES (1, 10, 20, 10, 20, CURRENT_TIMESTAMP, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pets (
    id, code, name_vi, name_en, description_vi, description_en,
    learning_meaning_vi, learning_meaning_en, active, display_order, created_at, version
)
VALUES (
    gen_random_uuid(), 'JAVA_SEEDLING', 'Mam Java', 'Java Seedling',
    'Nguoi ban dong hanh bat dau hanh trinh Java.', 'A companion beginning its Java journey.',
    'Tuong trung cho nen tang va thoi quen hoc deu dan.', 'Represents foundations and consistent learning.',
    true, 1, CURRENT_TIMESTAMP, 0
) ON CONFLICT (code) DO NOTHING;

INSERT INTO pet_level_configs (
    id, pet_id, level_order, name_vi, name_en, description_vi, description_en,
    required_energy, asset_reference, created_at
)
SELECT gen_random_uuid(), pet.id, seed.level_order, seed.name_vi, seed.name_en,
       seed.description_vi, seed.description_en, seed.required_energy, seed.asset_reference, CURRENT_TIMESTAMP
FROM pets pet
CROSS JOIN (VALUES
    (1, 'Mam Java', 'Java Seedling', 'Bat dau hanh trinh.', 'Beginning the journey.', 100, 'pets/java-seedling/lv1.webp'),
    (2, 'Nha tham hiem Code', 'Code Explorer', 'Truong thanh qua hoc tap.', 'Growing through learning.', 250, 'pets/java-seedling/lv2.webp'),
    (3, 'Ve binh Backend', 'Backend Guardian', 'San sang cho thu thach Fresher.', 'Ready for Fresher challenges.', 0, 'pets/java-seedling/lv3.webp')
) AS seed(level_order, name_vi, name_en, description_vi, description_en, required_energy, asset_reference)
WHERE pet.code = 'JAVA_SEEDLING'
ON CONFLICT (pet_id, level_order) DO NOTHING;

COMMIT;
