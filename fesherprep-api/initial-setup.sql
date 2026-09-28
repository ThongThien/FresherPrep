-- FresherPrep initial setup.
-- Chạy sau khi Hibernate đã tạo schema fresherprep.
--
-- Script chỉ tạo:
--   1 TECHNOLOGY Java (PUBLISHED)
--   8 CATEGORY placeholder (DRAFT)
--   10 TOPIC cho mỗi CATEGORY (80 TOPIC, DRAFT)
--   20 SUBTOPIC cho mỗi TOPIC (1.600 SUBTOPIC, DRAFT)
--   Pet settings + 1 Pet/3 level ban đầu
--
-- Script KHÔNG tạo user, lesson, learning path, question/version/option,
-- quiz/rule, attempt, progress hay dữ liệu runtime.
-- Dùng ON CONFLICT DO NOTHING để chạy lại không ghi đè nội dung Admin đã sửa.
--
-- Lưu ý:
--   SUBTOPIC không phải LESSON.
--   Một SUBTOPIC có thể chứa nhiều LESSON; mỗi LESSON thuộc đúng một SUBTOPIC.

BEGIN;

SET LOCAL search_path TO fresherprep, public;

-- Root công nghệ duy nhất trong setup hiện tại.
INSERT INTO knowledge_nodes (
    id, created_at, updated_at, node_type, parent_id,
    name, slug, display_order, status
)
VALUES (
    gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
    'TECHNOLOGY', NULL, 'Java', 'java', 0, 'PUBLISHED'
)
ON CONFLICT (slug) DO NOTHING;

-- 8 Category placeholder. Admin đổi name sau; slug được giữ ổn định.
WITH category_seed AS (
    SELECT number
    FROM generate_series(1, 8) AS number
)
INSERT INTO knowledge_nodes (
    id, created_at, updated_at, node_type, parent_id,
    name, slug, display_order, status
)
SELECT
    gen_random_uuid(),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'CATEGORY',
    java.id,
    format('CATEGORY %s', seed.number),
    format('java-category-%s', lpad(seed.number::text, 2, '0')),
    seed.number - 1,
    'DRAFT'
FROM category_seed seed
JOIN knowledge_nodes java
    ON java.slug = 'java'
   AND java.node_type = 'TECHNOLOGY'
ON CONFLICT (slug) DO NOTHING;

-- Mỗi Category có 10 Topic placeholder.
WITH topic_seed AS (
    SELECT category_number, topic_number
    FROM generate_series(1, 8) AS category_number
    CROSS JOIN generate_series(1, 10) AS topic_number
)
INSERT INTO knowledge_nodes (
    id, created_at, updated_at, node_type, parent_id,
    name, slug, display_order, status
)
SELECT
    gen_random_uuid(),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'TOPIC',
    category.id,
    format('TOPIC %s', seed.topic_number),
    format(
        'java-category-%s-topic-%s',
        lpad(seed.category_number::text, 2, '0'),
        lpad(seed.topic_number::text, 2, '0')
    ),
    seed.topic_number - 1,
    'DRAFT'
FROM topic_seed seed
JOIN knowledge_nodes category
    ON category.slug = format(
        'java-category-%s',
        lpad(seed.category_number::text, 2, '0')
    )
   AND category.node_type = 'CATEGORY'
ON CONFLICT (slug) DO NOTHING;

-- Mỗi Topic có 20 Subtopic placeholder.
WITH subtopic_seed AS (
    SELECT category_number, topic_number, subtopic_number
    FROM generate_series(1, 8) AS category_number
    CROSS JOIN generate_series(1, 10) AS topic_number
    CROSS JOIN generate_series(1, 20) AS subtopic_number
)
INSERT INTO knowledge_nodes (
    id, created_at, updated_at, node_type, parent_id,
    name, slug, display_order, status
)
SELECT
    gen_random_uuid(),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'SUBTOPIC',
    topic.id,
    format('SUBTOPIC %s', seed.subtopic_number),
    format(
        'java-category-%s-topic-%s-subtopic-%s',
        lpad(seed.category_number::text, 2, '0'),
        lpad(seed.topic_number::text, 2, '0'),
        lpad(seed.subtopic_number::text, 2, '0')
    ),
    seed.subtopic_number - 1,
    'DRAFT'
FROM subtopic_seed seed
JOIN knowledge_nodes topic
    ON topic.slug = format(
        'java-category-%s-topic-%s',
        lpad(seed.category_number::text, 2, '0'),
        lpad(seed.topic_number::text, 2, '0')
    )
   AND topic.node_type = 'TOPIC'
ON CONFLICT (slug) DO NOTHING;

-- Cấu hình Pet mặc định. Chạy lại không ghi đè cấu hình Admin đã thay đổi.
INSERT INTO pet_settings (
    id,
    lesson_completion_points,
    quiz_pass_points,
    points_per_food,
    energy_per_food,
    updated_at,
    version
)
VALUES (
    1, 10, 20, 10, 20, CURRENT_TIMESTAMP, 0
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pets (
    id,
    code,
    name_vi,
    name_en,
    description_vi,
    description_en,
    learning_meaning_vi,
    learning_meaning_en,
    active,
    display_order,
    created_at,
    version
)
VALUES (
    gen_random_uuid(),
    'JAVA_SEEDLING',
    'Mầm Java',
    'Java Seedling',
    'Người bạn đồng hành bắt đầu hành trình Java.',
    'A companion beginning its Java journey.',
    'Tượng trưng cho nền tảng và thói quen học đều đặn.',
    'Represents foundations and consistent learning.',
    true,
    1,
    CURRENT_TIMESTAMP,
    0
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO pet_level_configs (
    id,
    pet_id,
    level_order,
    name_vi,
    name_en,
    description_vi,
    description_en,
    required_energy,
    asset_reference,
    created_at
)
SELECT
    gen_random_uuid(),
    pet.id,
    seed.level_order,
    seed.name_vi,
    seed.name_en,
    seed.description_vi,
    seed.description_en,
    seed.required_energy,
    seed.asset_reference,
    CURRENT_TIMESTAMP
FROM pets pet
CROSS JOIN (
    VALUES
        (
            1,
            'Mầm Java',
            'Java Seedling',
            'Bắt đầu hành trình.',
            'Beginning the journey.',
            100,
            'pets/java-seedling/lv1.webp'
        ),
        (
            2,
            'Nhà thám hiểm Code',
            'Code Explorer',
            'Trưởng thành qua học tập.',
            'Growing through learning.',
            250,
            'pets/java-seedling/lv2.webp'
        ),
        (
            3,
            'Vệ binh Backend',
            'Backend Guardian',
            'Sẵn sàng cho thử thách Fresher.',
            'Ready for Fresher challenges.',
            0,
            'pets/java-seedling/lv3.webp'
        )
) AS seed(
    level_order,
    name_vi,
    name_en,
    description_vi,
    description_en,
    required_energy,
    asset_reference
)
WHERE pet.code = 'JAVA_SEEDLING'
ON CONFLICT (pet_id, level_order) DO NOTHING;

-- Question/Quiz không cần dòng setup giả:
-- - Question code unique, thuộc SUBTOPIC, có version bất biến.
-- - Một version hợp lệ có đúng 4 option (position 1..4), đúng 1 correct.
-- - Quiz FIXED/RULE_BASED chỉ publish khi cấu hình hợp lệ.
-- - RULE_BASED phải đủ số Question PUBLISHED theo từng rule.
-- - Assessment Lesson dùng Quiz type LESSON và pass percentage 80.
-- Các yêu cầu này được enforce bởi schema + Service khi Admin/Contributor tạo nội dung thật.

COMMIT;
