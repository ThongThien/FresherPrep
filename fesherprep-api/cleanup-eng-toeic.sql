BEGIN;

SET LOCAL search_path TO fresherprep, public;

-- Removes only the unfinished dataset created by seed-eng-toeic.sql.
-- Safety: do not silently subtract already-applied Pet rewards from users.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pet_reward_events reward
        JOIN quizzes quiz ON quiz.id = reward.source_id
        WHERE reward.activity_type = 'QUIZ_PASSED'
          AND quiz.code LIKE 'ENG-TOEIC-TEST-%'
          AND reward.applied = TRUE
    ) THEN
        RAISE EXCEPTION
            'Cleanup stopped: an ENG TOEIC quiz already awarded Pet points. Reconcile that user balance first.';
    END IF;
END
$$;

-- Remove runtime rows if an unfinished attempt was accidentally created.
DELETE FROM quiz_attempt_answers answer
USING quiz_attempt_questions attempt_question, quiz_attempts attempt, quizzes quiz
WHERE answer.attempt_question_id = attempt_question.id
  AND attempt_question.attempt_id = attempt.id
  AND attempt.quiz_id = quiz.id
  AND quiz.code LIKE 'ENG-TOEIC-TEST-%';

DELETE FROM quiz_attempt_questions attempt_question
USING quiz_attempts attempt, quizzes quiz
WHERE attempt_question.attempt_id = attempt.id
  AND attempt.quiz_id = quiz.id
  AND quiz.code LIKE 'ENG-TOEIC-TEST-%';

DELETE FROM quiz_attempts attempt
USING quizzes quiz
WHERE attempt.quiz_id = quiz.id
  AND quiz.code LIKE 'ENG-TOEIC-TEST-%';

DELETE FROM pet_reward_events reward
USING quizzes quiz
WHERE reward.source_id = quiz.id
  AND reward.activity_type = 'QUIZ_PASSED'
  AND quiz.code LIKE 'ENG-TOEIC-TEST-%';

DELETE FROM lesson_assessments assessment
USING quizzes quiz
WHERE assessment.quiz_id = quiz.id
  AND quiz.code LIKE 'ENG-TOEIC-TEST-%';

DELETE FROM quiz_fixed_questions fixed
USING quizzes quiz
WHERE fixed.quiz_id = quiz.id
  AND quiz.code LIKE 'ENG-TOEIC-TEST-%';

DELETE FROM quiz_rules rule
USING quizzes quiz
WHERE rule.quiz_id = quiz.id
  AND quiz.code LIKE 'ENG-TOEIC-TEST-%';

DELETE FROM quizzes
WHERE code LIKE 'ENG-TOEIC-TEST-%';

UPDATE questions
SET published_version_id = NULL,
    status = 'DRAFT',
    updated_at = CURRENT_TIMESTAMP
WHERE code LIKE 'ENG-TOEIC-%';

DELETE FROM question_options option
USING question_versions version, questions question
WHERE option.question_version_id = version.id
  AND version.question_id = question.id
  AND question.code LIKE 'ENG-TOEIC-%';

DELETE FROM question_versions version
USING questions question
WHERE version.question_id = question.id
  AND question.code LIKE 'ENG-TOEIC-%';

DELETE FROM questions
WHERE code LIKE 'ENG-TOEIC-%';

DELETE FROM knowledge_nodes
WHERE slug LIKE 'eng-toeic-test-%'
  AND node_type = 'SUBTOPIC';

DELETE FROM knowledge_nodes
WHERE slug = 'eng-toeic-800'
  AND node_type = 'TOPIC';

DELETE FROM knowledge_nodes
WHERE slug = 'eng-toeic-practice'
  AND node_type = 'CATEGORY';

DELETE FROM knowledge_nodes
WHERE slug = 'eng'
  AND node_type = 'TECHNOLOGY';

-- seed-eng-toeic.sql changed the previous global Quiz reward from 20 to 30.
UPDATE pet_settings
SET quiz_pass_points = 20,
    updated_at = CURRENT_TIMESTAMP,
    version = version + 1
WHERE id = 1
  AND quiz_pass_points = 30;

COMMIT;
