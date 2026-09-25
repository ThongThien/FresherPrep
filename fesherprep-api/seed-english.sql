BEGIN;

SET LOCAL search_path TO fresherprep, public;

-- Safe compatibility update for databases created before JOB 22.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS language varchar(8) NOT NULL DEFAULT 'VI';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category varchar(16) NOT NULL DEFAULT 'TECHNICAL';
CREATE INDEX IF NOT EXISTS idx_questions_admin_filter ON questions (language, category, status, difficulty);

-- English -> Grammar/Vocabulary/TOEIC -> leaf SUBTOPIC nodes.
INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
VALUES
    (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
     'TECHNOLOGY', NULL, 'English', 'english', 1, 'PUBLISHED')
ON CONFLICT (slug) DO UPDATE SET
    node_type = EXCLUDED.node_type, parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name, display_order = EXCLUDED.display_order,
    status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP;

WITH category_seed(name, slug, display_order) AS (
    VALUES
        ('Grammar', 'english-grammar', 0),
        ('Vocabulary', 'english-vocabulary', 1),
        ('TOEIC', 'english-toeic', 2)
)
INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
       'CATEGORY', english.id, seed.name, seed.slug, seed.display_order, 'PUBLISHED'
FROM category_seed seed
JOIN knowledge_nodes english ON english.slug = 'english'
ON CONFLICT (slug) DO UPDATE SET
    node_type = EXCLUDED.node_type, parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name, display_order = EXCLUDED.display_order,
    status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP;

WITH subtopic_seed(parent_slug, name, slug, display_order) AS (
    VALUES
        ('english-grammar', 'Tenses', 'english-grammar-tenses', 0),
        ('english-grammar', 'Articles', 'english-grammar-articles', 1),
        ('english-grammar', 'Prepositions', 'english-grammar-prepositions', 2),
        ('english-grammar', 'Pronouns', 'english-grammar-pronouns', 3),
        ('english-grammar', 'Adjectives & Adverbs', 'english-grammar-adjectives-adverbs', 4),
        ('english-grammar', 'Conjunctions', 'english-grammar-conjunctions', 5),
        ('english-grammar', 'Conditionals', 'english-grammar-conditionals', 6),
        ('english-grammar', 'Passive Voice', 'english-grammar-passive-voice', 7),
        ('english-grammar', 'Relative Clauses', 'english-grammar-relative-clauses', 8),
        ('english-grammar', 'Subject-Verb Agreement', 'english-grammar-subject-verb-agreement', 9),
        ('english-vocabulary', 'Workplace', 'english-vocabulary-workplace', 0),
        ('english-vocabulary', 'Business', 'english-vocabulary-business', 1),
        ('english-vocabulary', 'Technology', 'english-vocabulary-technology', 2),
        ('english-vocabulary', 'Software Development', 'english-vocabulary-software-development', 3),
        ('english-vocabulary', 'Communication', 'english-vocabulary-communication', 4),
        ('english-vocabulary', 'Common English', 'english-vocabulary-common', 5),
        ('english-toeic', 'Part 1', 'english-toeic-part-1', 0),
        ('english-toeic', 'Part 2', 'english-toeic-part-2', 1),
        ('english-toeic', 'Part 3', 'english-toeic-part-3', 2),
        ('english-toeic', 'Part 4', 'english-toeic-part-4', 3),
        ('english-toeic', 'Part 5', 'english-toeic-part-5', 4),
        ('english-toeic', 'Part 6', 'english-toeic-part-6', 5),
        ('english-toeic', 'Part 7', 'english-toeic-part-7', 6)
)
INSERT INTO knowledge_nodes
    (id, created_at, updated_at, node_type, parent_id, name, slug, display_order, status)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
       'SUBTOPIC', parent.id, seed.name, seed.slug, seed.display_order, 'PUBLISHED'
FROM subtopic_seed seed
JOIN knowledge_nodes parent ON parent.slug = seed.parent_slug
ON CONFLICT (slug) DO UPDATE SET
    node_type = EXCLUDED.node_type, parent_id = EXCLUDED.parent_id,
    name = EXCLUDED.name, display_order = EXCLUDED.display_order,
    status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP;

WITH question_seed(code, subtopic_slug, difficulty, category) AS (
    VALUES
        ('ENG-GRAM-TENSE-001', 'english-grammar-tenses', 'MEDIUM', 'GRAMMAR'),
        ('ENG-GRAM-ARTICLE-001', 'english-grammar-articles', 'EASY', 'GRAMMAR'),
        ('ENG-GRAM-SVA-001', 'english-grammar-subject-verb-agreement', 'MEDIUM', 'GRAMMAR'),
        ('ENG-GRAM-COND-001', 'english-grammar-conditionals', 'HARD', 'GRAMMAR'),
        ('ENG-GRAM-PASSIVE-001', 'english-grammar-passive-voice', 'MEDIUM', 'GRAMMAR'),
        ('ENG-VOC-WORK-001', 'english-vocabulary-workplace', 'EASY', 'VOCABULARY'),
        ('ENG-VOC-BUSINESS-001', 'english-vocabulary-business', 'MEDIUM', 'VOCABULARY'),
        ('ENG-VOC-TECH-001', 'english-vocabulary-technology', 'MEDIUM', 'VOCABULARY'),
        ('ENG-VOC-COMM-001', 'english-vocabulary-communication', 'EASY', 'VOCABULARY'),
        ('ENG-TOEIC-P2-001', 'english-toeic-part-2', 'EASY', 'TOEIC'),
        ('ENG-TOEIC-P5-001', 'english-toeic-part-5', 'MEDIUM', 'TOEIC'),
        ('ENG-TOEIC-P7-001', 'english-toeic-part-7', 'HARD', 'TOEIC')
)
INSERT INTO questions
    (id, created_at, updated_at, subtopic_id, code, difficulty, language, category, status, published_version_id)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
       node.id, seed.code, seed.difficulty, 'EN', seed.category, 'PUBLISHED', NULL
FROM question_seed seed
JOIN knowledge_nodes node ON node.slug = seed.subtopic_slug
ON CONFLICT (code) DO UPDATE SET
    subtopic_id = EXCLUDED.subtopic_id,
    difficulty = EXCLUDED.difficulty,
    language = EXCLUDED.language,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

WITH version_seed(code, content, explanation) AS (
    VALUES
        ('ENG-GRAM-TENSE-001',
         'By the time the meeting started, the team _____ the deployment plan.',
         'Use the past perfect for an action completed before another past event: the team had finalized the plan before the meeting started.'),
        ('ENG-GRAM-ARTICLE-001',
         'She gave _____ honest assessment of the project risks.',
         'Use “an” before a vowel sound. “Honest” begins with a silent h, so its first sound is a vowel.'),
        ('ENG-GRAM-SVA-001',
         'Neither the developers nor the project manager _____ available today.',
         'With neither...nor, the verb normally agrees with the nearer subject. “Project manager” is singular, so “is” is correct.'),
        ('ENG-GRAM-COND-001',
         'If we _____ the requirement earlier, we would have avoided the rework.',
         'This is a third conditional about an unreal past situation: if + past perfect, followed by would have + past participle.'),
        ('ENG-GRAM-PASSIVE-001',
         'Choose the correct passive sentence for: “The QA team found the defect yesterday.”',
         'The simple past passive uses was/were + past participle. The object “the defect” becomes the subject.'),
        ('ENG-VOC-WORK-001',
         'In “We must meet the deadline on Friday,” what does “deadline” mean?',
         'A deadline is the latest time or date by which a task must be completed.'),
        ('ENG-VOC-BUSINESS-001',
         'The manager asked whether the proposal was financially feasible. What does “feasible” mean?',
         '“Feasible” describes something that is practical and possible to carry out successfully.'),
        ('ENG-VOC-TECH-001',
         'A scalable service can handle _____.',
         'In software, scalability is the ability to handle increased workload by adding or using resources effectively.'),
        ('ENG-VOC-COMM-001',
         'Which sentence best uses the verb “clarify”?',
         'To clarify means to make information clearer or easier to understand.'),
        ('ENG-TOEIC-P2-001',
         'When will the updated schedule be available?',
         'A suitable response directly answers “when” with a time. “By tomorrow afternoon” provides that information.'),
        ('ENG-TOEIC-P5-001',
         'All employees must submit their expense reports _____ Friday.',
         'Use “by” for a deadline meaning no later than a particular time.'),
        ('ENG-TOEIC-P7-001',
         'Notice: The software maintenance window has been moved from Tuesday evening to Thursday evening. Employees should save their work and log out before 7:00 p.m. on Thursday. Why was this notice written?',
         'The notice informs employees that scheduled maintenance has changed to Thursday and tells them how to prepare.')
)
INSERT INTO question_versions
    (id, created_at, question_id, version_number, content, explanation)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, question.id, 1, seed.content, seed.explanation
FROM version_seed seed
JOIN questions question ON question.code = seed.code
ON CONFLICT (question_id, version_number) DO NOTHING;

WITH option_seed(code, position, content, is_correct, explanation) AS (
    VALUES
        ('ENG-GRAM-TENSE-001', 1, 'finalizes', FALSE, 'Simple present does not show completion before a past event.'),
        ('ENG-GRAM-TENSE-001', 2, 'had finalized', TRUE, 'Past perfect correctly marks the earlier completed action.'),
        ('ENG-GRAM-TENSE-001', 3, 'has finalized', FALSE, 'Present perfect does not fit the completed past-time sequence.'),
        ('ENG-GRAM-TENSE-001', 4, 'will finalize', FALSE, 'Future tense conflicts with “by the time the meeting started.”'),
        ('ENG-GRAM-ARTICLE-001', 1, 'a', FALSE, '“A” is used before a consonant sound, but honest begins with a vowel sound.'),
        ('ENG-GRAM-ARTICLE-001', 2, 'an', TRUE, '“An” is correct before the vowel sound at the start of honest.'),
        ('ENG-GRAM-ARTICLE-001', 3, 'the', FALSE, 'No previously identified assessment is being referenced.'),
        ('ENG-GRAM-ARTICLE-001', 4, 'no article', FALSE, 'A singular countable noun requires a determiner here.'),
        ('ENG-GRAM-SVA-001', 1, 'are', FALSE, 'The nearer subject “project manager” is singular.'),
        ('ENG-GRAM-SVA-001', 2, 'were', FALSE, 'The sentence describes the present, and the nearer subject is singular.'),
        ('ENG-GRAM-SVA-001', 3, 'is', TRUE, 'The singular verb agrees with the nearer singular subject.'),
        ('ENG-GRAM-SVA-001', 4, 'be', FALSE, 'The base form cannot serve as the finite verb in this sentence.'),
        ('ENG-GRAM-COND-001', 1, 'knew', FALSE, 'Second-conditional form refers to an unreal present or future, not a past result.'),
        ('ENG-GRAM-COND-001', 2, 'had known', TRUE, 'Past perfect is required in the if-clause of a third conditional.'),
        ('ENG-GRAM-COND-001', 3, 'have known', FALSE, 'The if-clause needs past perfect, not present perfect.'),
        ('ENG-GRAM-COND-001', 4, 'would know', FALSE, 'Would is not normally used in the if-clause here.'),
        ('ENG-GRAM-PASSIVE-001', 1, 'The defect found the QA team yesterday.', FALSE, 'This reverses the meaning and remains active.'),
        ('ENG-GRAM-PASSIVE-001', 2, 'The defect was found by the QA team yesterday.', TRUE, 'Was found is the correct simple past passive form.'),
        ('ENG-GRAM-PASSIVE-001', 3, 'The defect is found by the QA team yesterday.', FALSE, 'Present passive conflicts with the past-time marker yesterday.'),
        ('ENG-GRAM-PASSIVE-001', 4, 'The QA team was found the defect yesterday.', FALSE, 'This is not a valid passive construction.'),
        ('ENG-VOC-WORK-001', 1, 'A planned meeting', FALSE, 'A meeting may have a deadline, but it is not the meaning of deadline.'),
        ('ENG-VOC-WORK-001', 2, 'The final time for completing something', TRUE, 'This is the standard meaning of deadline.'),
        ('ENG-VOC-WORK-001', 3, 'A list of project members', FALSE, 'A project member list is unrelated to a deadline.'),
        ('ENG-VOC-WORK-001', 4, 'A delay caused by technical problems', FALSE, 'A delay may threaten a deadline but is not the deadline itself.'),
        ('ENG-VOC-BUSINESS-001', 1, 'Expensive but attractive', FALSE, 'Cost or appearance alone does not determine feasibility.'),
        ('ENG-VOC-BUSINESS-001', 2, 'Practical and possible', TRUE, 'Feasible means capable of being done successfully.'),
        ('ENG-VOC-BUSINESS-001', 3, 'Already approved', FALSE, 'A proposal can be feasible before it is approved.'),
        ('ENG-VOC-BUSINESS-001', 4, 'Legally required', FALSE, 'Feasible does not mean mandatory.'),
        ('ENG-VOC-TECH-001', 1, 'only one user at a time', FALSE, 'Supporting only one user does not demonstrate scalability.'),
        ('ENG-VOC-TECH-001', 2, 'increasing demand without unacceptable performance loss', TRUE, 'This describes the practical goal of scalability.'),
        ('ENG-VOC-TECH-001', 3, 'source code without compilation', FALSE, 'Compilation behavior is unrelated to scalability.'),
        ('ENG-VOC-TECH-001', 4, 'every programming language equally', FALSE, 'Language support does not define scalability.'),
        ('ENG-VOC-COMM-001', 1, 'Could you clarify which API version we should use?', TRUE, 'The speaker asks for unclear information to be made more precise.'),
        ('ENG-VOC-COMM-001', 2, 'We clarified the server into production.', FALSE, 'Clarify does not mean deploy or move a server.'),
        ('ENG-VOC-COMM-001', 3, 'The database clarified for two hours.', FALSE, 'Clarify is not used to describe database runtime.'),
        ('ENG-VOC-COMM-001', 4, 'Please clarify the file from the folder.', FALSE, 'Clarify does not mean remove a file.'),
        ('ENG-TOEIC-P2-001', 1, 'By tomorrow afternoon.', TRUE, 'This directly provides the requested time.'),
        ('ENG-TOEIC-P2-001', 2, 'In the conference room.', FALSE, 'This answers where, not when.'),
        ('ENG-TOEIC-P2-001', 3, 'Yes, the schedule is useful.', FALSE, 'This does not state when it will be available.'),
        ('ENG-TOEIC-P2-001', 4, 'The marketing department.', FALSE, 'This identifies a group, not a time.'),
        ('ENG-TOEIC-P5-001', 1, 'at', FALSE, 'At is used for a precise time, not a deadline ending on a day.'),
        ('ENG-TOEIC-P5-001', 2, 'by', TRUE, 'By Friday means no later than Friday.'),
        ('ENG-TOEIC-P5-001', 3, 'during', FALSE, 'During requires a period or event and does not express this deadline.'),
        ('ENG-TOEIC-P5-001', 4, 'among', FALSE, 'Among expresses position within a group.'),
        ('ENG-TOEIC-P7-001', 1, 'To announce a change to the maintenance schedule', TRUE, 'The main purpose is to communicate the new Thursday maintenance time.'),
        ('ENG-TOEIC-P7-001', 2, 'To request software purchase approval', FALSE, 'The notice does not discuss buying software.'),
        ('ENG-TOEIC-P7-001', 3, 'To invite employees to a Tuesday meeting', FALSE, 'No meeting invitation appears, and Tuesday is the old maintenance date.'),
        ('ENG-TOEIC-P7-001', 4, 'To report an employee login problem', FALSE, 'Logging out is an instruction, not a reported login issue.')
)
INSERT INTO question_options
    (id, created_at, question_version_id, position, content, is_correct, explanation)
SELECT gen_random_uuid(), CURRENT_TIMESTAMP, version.id,
       seed.position, seed.content, seed.is_correct, seed.explanation
FROM option_seed seed
JOIN questions question ON question.code = seed.code
JOIN question_versions version ON version.question_id = question.id AND version.version_number = 1
ON CONFLICT (question_version_id, position) DO NOTHING;

UPDATE questions question
SET published_version_id = version.id,
    status = 'PUBLISHED',
    language = 'EN',
    updated_at = CURRENT_TIMESTAMP
FROM question_versions version
WHERE version.question_id = question.id
  AND version.version_number = 1
  AND question.code LIKE 'ENG-%';

COMMIT;
