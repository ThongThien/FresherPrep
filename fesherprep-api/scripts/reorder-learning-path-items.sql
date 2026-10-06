-- Reorder every existing learning path by the knowledge tree:
-- Category -> Topic -> Subtopic -> Lesson display order.
-- The two-phase update avoids collisions with
-- uk_learning_path_items_order (learning_path_id, display_order).

BEGIN;

WITH temporary_positions AS (
    SELECT
        item.id,
        MAX(item.display_order) OVER (PARTITION BY item.learning_path_id)
            + ROW_NUMBER() OVER (
                PARTITION BY item.learning_path_id
                ORDER BY item.id
            )::integer AS temporary_order
    FROM fresherprep.learning_path_items item
)
UPDATE fresherprep.learning_path_items item
SET display_order = temporary_positions.temporary_order
FROM temporary_positions
WHERE item.id = temporary_positions.id;

WITH RECURSIVE hierarchy AS (
    SELECT
        node.id AS leaf_id,
        node.parent_id,
        ARRAY[
            CASE node.node_type
                WHEN 'TECHNOLOGY' THEN '0'
                WHEN 'CATEGORY' THEN '1'
                WHEN 'TOPIC' THEN '2'
                ELSE '3'
            END || ':' || LPAD(node.display_order::text, 10, '0')
                || ':' || LOWER(node.name) || ':' || node.id::text
        ] AS sort_path
    FROM fresherprep.knowledge_nodes node
    WHERE node.node_type = 'SUBTOPIC'

    UNION ALL

    SELECT
        hierarchy.leaf_id,
        parent.parent_id,
        ARRAY[
            CASE parent.node_type
                WHEN 'TECHNOLOGY' THEN '0'
                WHEN 'CATEGORY' THEN '1'
                WHEN 'TOPIC' THEN '2'
                ELSE '3'
            END || ':' || LPAD(parent.display_order::text, 10, '0')
                || ':' || LOWER(parent.name) || ':' || parent.id::text
        ] || hierarchy.sort_path
    FROM hierarchy
    JOIN fresherprep.knowledge_nodes parent
      ON parent.id = hierarchy.parent_id
),
subtopic_paths AS (
    SELECT leaf_id, sort_path
    FROM hierarchy
    WHERE parent_id IS NULL
),
ordered_items AS (
    SELECT
        item.id,
        ROW_NUMBER() OVER (
            PARTITION BY item.learning_path_id
            ORDER BY
                subtopic_paths.sort_path,
                lesson.display_order,
                lesson.created_at,
                lesson.id
        ) - 1 AS final_order
    FROM fresherprep.learning_path_items item
    JOIN fresherprep.lessons lesson
      ON lesson.id = item.lesson_id
    JOIN subtopic_paths
      ON subtopic_paths.leaf_id = lesson.subtopic_id
)
UPDATE fresherprep.learning_path_items item
SET display_order = ordered_items.final_order::integer
FROM ordered_items
WHERE item.id = ordered_items.id;

COMMIT;

-- Verification: each path must start at 0 and have no gaps.
SELECT
    learning_path_id,
    COUNT(*) AS item_count,
    MIN(display_order) AS first_order,
    MAX(display_order) AS last_order,
    COUNT(DISTINCT display_order) AS distinct_orders
FROM fresherprep.learning_path_items
GROUP BY learning_path_id
ORDER BY learning_path_id;
