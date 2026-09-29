import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [, , inputArgument, outputArgument = "seed_eng_toeic.sql"] = process.argv;
if (!inputArgument) throw new Error("Usage: node scripts/generate-toeic-seed.mjs <source.txt> [output.sql]");

const inputPath = resolve(inputArgument);
const outputPath = resolve(outputArgument);
const lines = readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
const questions = [];
let quizNumber = null;

for (let index = 0; index < lines.length; index++) {
  const line = lines[index].trim();
  const quizMatch = /^QUIZ\s+(\d+)$/.exec(line);
  if (quizMatch) { quizNumber = Number(quizMatch[1]); continue; }

  const questionMatch = /^C\u00e2u\s+(\d+)\s+\[([^\]]+)]\s+\u2014\s+10 \u0111i\u1ec3m$/.exec(line);
  if (!questionMatch) continue;
  if (quizNumber === null) throw new Error(`Question found before a QUIZ heading at line ${index + 1}`);

  const questionNumber = Number(questionMatch[1]);
  const sourceCategory = questionMatch[2].trim();
  const block = [];
  for (index += 1; index < lines.length; index++) {
    const candidate = lines[index].trim();
    if (/^C\u00e2u\s+\d+\s+\[/.test(candidate) || /^QUIZ\s+\d+$/.test(candidate)) { index -= 1; break; }
    if (/^={20,}$/.test(candidate)) continue;
    block.push(lines[index].trimEnd());
  }

  while (block.length && !block[0].trim()) block.shift();
  while (block.length && !block.at(-1).trim()) block.pop();

  const optionIndexes = ["A", "B", "C", "D"].map((letter) => block.findIndex((value) => value.startsWith(`${letter}. `)));
  if (optionIndexes.some((value) => value < 0)) throw new Error(`Quiz ${quizNumber}, question ${questionNumber}: expected options A-D`);
  for (let option = 1; option < optionIndexes.length; option++) {
    if (optionIndexes[option] !== optionIndexes[0] + option) throw new Error(`Quiz ${quizNumber}, question ${questionNumber}: options A-D must be consecutive`);
  }

  const answerIndex = block.findIndex((value) => /^\u0110\u00e1p \u00e1n:\s*[A-D]\s*$/.test(value));
  const explanationLabel = "Gi\u1ea3i th\u00edch:";
  const explanationIndex = block.findIndex((value) => value.startsWith(explanationLabel));
  if (answerIndex < 0 || explanationIndex < 0 || explanationIndex <= answerIndex) throw new Error(`Quiz ${quizNumber}, question ${questionNumber}: answer or explanation is missing`);

  const content = block.slice(0, optionIndexes[0]).join("\n").trim();
  const options = optionIndexes.map((position) => block[position].slice(3).trim());
  const answerLetter = block[answerIndex].match(/[A-D]/)?.[0];
  const explanation = [block[explanationIndex].slice(explanationLabel.length).trim(), ...block.slice(explanationIndex + 1).map((value) => value.trim()).filter(Boolean)].join(" ").trim();

  if (!content || !explanation || options.some((value) => !value) || !answerLetter) throw new Error(`Quiz ${quizNumber}, question ${questionNumber}: empty content detected`);
  if (new Set(options).size !== 4) throw new Error(`Quiz ${quizNumber}, question ${questionNumber}: duplicate options detected`);

  questions.push({
    quizNumber, questionNumber, sourceCategory,
    category: mapCategory(sourceCategory),
    difficulty: ["EASY", "EASY", "MEDIUM", "MEDIUM", "HARD"][(questionNumber - 1) % 5],
    content, options, correctPosition: answerLetter.charCodeAt(0) - 64, explanation,
  });
}

const distinctQuestionCount = validate(questions);
writeFileSync(outputPath, buildSql(questions, distinctQuestionCount), "utf8");
process.stdout.write(`Created ${outputPath} from ${questions.length} validated questions.\n`);

function mapCategory(category) {
  if (category === "NG\u1eee PH\u00c1P") return "GRAMMAR";
  if (category === "T\u1eea V\u1ef0NG") return "VOCABULARY";
  return "TOEIC";
}

function validate(items) {
  if (items.length !== 500) throw new Error(`Expected 500 questions, found ${items.length}`);
  const quizNumbers = [...new Set(items.map((item) => item.quizNumber))].sort((a, b) => a - b);
  if (quizNumbers.join(",") !== "1,2,3,4,5,6,7,8,9,10") {
    throw new Error(`Expected quizzes 1-10, found: ${quizNumbers.join(",")}`);
  }
  for (const quiz of quizNumbers) {
    const quizQuestions = items.filter((item) => item.quizNumber === quiz);
    if (quizQuestions.length !== 50) throw new Error(`Quiz ${quiz} has ${quizQuestions.length} questions`);
    const numbers = quizQuestions.map((item) => item.questionNumber).sort((a, b) => a - b);
    if (numbers.some((value, index) => value !== index + 1)) {
      throw new Error(`Quiz ${quiz} must contain question numbers 1-50 exactly once`);
    }
  }
  const normalized = items.map((item) => item.content.replace(/\s+/g, " ").trim().toLowerCase());
  const distinctCount = new Set(normalized).size;
  if (distinctCount !== 500) {
    const duplicates = items.filter((item, index) => normalized.indexOf(normalized[index]) !== index);
    const examples = duplicates.slice(0, 10)
      .map((item) => `quiz ${item.quizNumber}, question ${item.questionNumber}`)
      .join("; ");
    process.stderr.write(
      `Warning: source contains ${500 - distinctCount} duplicate contents: ${examples}\n`,
    );
  }
  return distinctCount;
}

function literal(value) {
  if (value.includes("\0")) throw new Error("NUL is not valid in PostgreSQL text");
  return `'${value.replaceAll("'", "''")}'`;
}

function code(item) {
  return `ENG-TOEIC-${String(item.quizNumber).padStart(2, "0")}-Q${String(item.questionNumber).padStart(2, "0")}`;
}

function buildSql(items, distinctQuestionCount) {
  const rows = items.map((item) => `    (${item.quizNumber}, ${item.questionNumber}, ${literal(code(item))}, ${literal(item.difficulty)}, ${literal(item.category)}, ${literal(item.content)}, ${literal(item.explanation)}, ${literal(item.options[0])}, ${literal(item.options[1])}, ${literal(item.options[2])}, ${literal(item.options[3])}, ${item.correctPosition})`).join(",\n");
  return `BEGIN;

SET LOCAL search_path TO fresherprep, public;

-- Generated from toeic_10_quizzes_500_questions.txt.
-- Source validation: 10 quizzes, 50 unique questions per quiz, four unique
-- options, one answer and one Vietnamese explanation per question.

DO \$\$
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
\$\$;

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
${rows};

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

DO \$\$
BEGIN
    IF (SELECT count(*) FROM questions WHERE code LIKE 'ENG-TOEIC-%') <> 500 THEN
        RAISE EXCEPTION 'Expected 500 ENG TOEIC questions';
    END IF;
    IF (SELECT count(DISTINCT version.content)
        FROM question_versions version
        JOIN questions question ON question.id = version.question_id
        WHERE question.code LIKE 'ENG-TOEIC-%') <> ${distinctQuestionCount} THEN
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
\$\$;

COMMIT;
`;
}
