package com.fesherprep.fesherprep_api.quiz.domain;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;
import com.fesherprep.fesherprep_api.question.domain.QuestionVersion.OptionDefinition;
import com.fesherprep.fesherprep_api.user.domain.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class QuizModelTests {
    private final KnowledgeNode technology = new KnowledgeNode(NodeType.TECHNOLOGY, "Java", "java", null, 0);
    private final KnowledgeNode core = new KnowledgeNode(NodeType.CATEGORY, "Core", "core", technology, 0);
    private final KnowledgeNode collections = new KnowledgeNode(NodeType.TOPIC, "Collections", "collections", core, 0);
    private final KnowledgeNode hashMap = new KnowledgeNode(NodeType.SUBTOPIC, "HashMap", "hashmap", collections, 0);
    private final KnowledgeNode arrayList = new KnowledgeNode(NodeType.SUBTOPIC, "ArrayList", "arraylist", collections, 1);
    private final KnowledgeNode databases = new KnowledgeNode(NodeType.TOPIC, "SQL", "sql", core, 1);
    private final KnowledgeNode joins = new KnowledgeNode(NodeType.SUBTOPIC, "Joins", "joins", databases, 0);
    private final User user = new User("learner@example.com", "hash-created-by-password-encoder", "Learner");

    @Test
    void questionRequiresExactlyFourExplainedOptionsAndOneCorrectAnswer() {
        Question question = new Question(hashMap, Difficulty.EASY);
        assertThrows(IllegalArgumentException.class,
                () -> new QuestionVersion(question, 1, "Question", "Explanation", choices(0).subList(0, 3)));
        List<OptionDefinition> multipleCorrect = List.of(
                new OptionDefinition("A", true, "Why A"),
                new OptionDefinition("B", true, "Why B"),
                new OptionDefinition("C", false, "Why C"),
                new OptionDefinition("D", false, "Why D"));
        assertThrows(IllegalArgumentException.class,
                () -> new QuestionVersion(question, 1, "Question", "Explanation", multipleCorrect));
        assertThrows(IllegalArgumentException.class,
                () -> new QuestionVersion(question, 1, "Question", "", choices(0)));
    }

    @Test
    void oldAttemptKeepsVersionOrderAndAnswerKeyWhenPublishedQuestionChanges() {
        QuestionVersion original = question(hashMap, Difficulty.EASY);
        Quiz quiz = fixedQuiz(QuizType.TOPIC, original);
        QuizAttempt attempt = new QuizAttempt(user, quiz, List.of(original));

        QuestionVersion revision = new QuestionVersion(original.getQuestion(), 2,
                "Edited question", "Edited explanation", choices(1));
        original.getQuestion().publish(revision);

        assertSame(original, attempt.getQuestions().getFirst().getQuestionVersion());
        assertThrows(UnsupportedOperationException.class, () -> attempt.getQuestions().clear());
        assertThrows(UnsupportedOperationException.class, () -> original.getOptions().clear());
        assertThrows(IllegalArgumentException.class, () -> new QuizAttempt(user, quiz, List.of(original)));

        attempt.submit(Map.of(attempt.getQuestions().getFirst(), original.getOptions().getFirst()));
        assertEquals(new BigDecimal("100.00"), attempt.getScorePercentage());
        assertTrue(attempt.isPassed());
        assertSame(revision, new QuizAttempt(user, quiz, List.of(revision))
                .getQuestions().getFirst().getQuestionVersion());
    }

    @Test
    void scoringCountsBlankQuestionsAsZeroAndSubmissionIsFinal() {
        QuestionVersion first = question(hashMap, Difficulty.EASY);
        QuestionVersion second = question(arrayList, Difficulty.MEDIUM);
        QuizAttempt attempt = new QuizAttempt(user, fixedQuiz(QuizType.TOPIC, first, second), List.of(first, second));

        attempt.submit(Map.of(attempt.getQuestions().getFirst(), first.getOptions().getFirst()));

        assertEquals(new BigDecimal("50.00"), attempt.getScorePercentage());
        assertFalse(attempt.isPassed());
        assertTrue(attempt.getQuestions().getFirst().getAnswer().isCorrect());
        assertNull(attempt.getQuestions().get(1).getAnswer());
        assertThrows(IllegalStateException.class, () -> attempt.submit(Map.of()));
    }

    @Test
    void foreignOptionIsRejectedBeforeAnyAnswerIsRecorded() {
        QuestionVersion first = question(hashMap, Difficulty.EASY);
        QuestionVersion second = question(arrayList, Difficulty.EASY);
        QuizAttempt attempt = new QuizAttempt(user, fixedQuiz(QuizType.TOPIC, first, second), List.of(first, second));
        var answers = new LinkedHashMap<QuizAttemptQuestion, com.fesherprep.fesherprep_api.question.domain.QuestionOption>();
        answers.put(attempt.getQuestions().getFirst(), first.getOptions().getFirst());
        answers.put(attempt.getQuestions().get(1), first.getOptions().getFirst());

        assertThrows(IllegalArgumentException.class, () -> attempt.submit(answers));
        assertEquals(AttemptStatus.IN_PROGRESS, attempt.getStatus());
        assertTrue(attempt.getQuestions().stream().allMatch(item -> item.getAnswer() == null));
    }

    @Test
    void mixedQuizEnforcesQuestionCountAndExplicitSubtopicRules() {
        QuestionVersion first = question(hashMap, Difficulty.EASY);
        QuestionVersion second = question(arrayList, Difficulty.MEDIUM);
        QuestionVersion foreign = question(joins, Difficulty.EASY);
        Quiz quiz = new Quiz("Collections mix", QuizType.MIXED, QuizSelectionMode.RULE_BASED, 80);
        quiz.addRule(hashMap, null, 1);
        quiz.addRule(arrayList, Difficulty.MEDIUM, 1);
        quiz.submitForReview();
        quiz.publish();

        assertDoesNotThrow(() -> new QuizAttempt(user, quiz, List.of(first, second)));
        assertThrows(IllegalArgumentException.class, () -> new QuizAttempt(user, quiz, List.of(first)));
        assertThrows(IllegalArgumentException.class, () -> new QuizAttempt(user, quiz, List.of(first, foreign)));
        assertThrows(IllegalArgumentException.class, () -> new QuizAttempt(user, quiz, List.of(first, first)));
    }

    @Test
    void oneTopicCanHaveSeparateDifficultyBucketsButNotOverlappingRules() {
        Quiz quiz = new Quiz("Topic quiz", QuizType.TOPIC, QuizSelectionMode.RULE_BASED, 80);
        quiz.addRule(hashMap, Difficulty.EASY, 3);
        quiz.addRule(hashMap, Difficulty.MEDIUM, 2);
        assertThrows(IllegalArgumentException.class, () -> quiz.addRule(hashMap, null, 1));
        assertThrows(IllegalArgumentException.class, () -> quiz.addRule(joins, Difficulty.HARD, 1));
        assertEquals(2, quiz.getRules().size());
    }

    @Test
    void fixedLessonAndTopicQuizzesCannotSilentlyMixUnrelatedScopes() {
        QuestionVersion first = question(hashMap, Difficulty.EASY);
        QuestionVersion sibling = question(arrayList, Difficulty.EASY);
        QuestionVersion foreign = question(joins, Difficulty.EASY);
        Quiz topicQuiz = new Quiz("Collections", QuizType.TOPIC, QuizSelectionMode.FIXED, 80);
        topicQuiz.addQuestion(first.getQuestion());
        topicQuiz.addQuestion(sibling.getQuestion());
        assertThrows(IllegalArgumentException.class, () -> topicQuiz.addQuestion(foreign.getQuestion()));

        Quiz lessonQuiz = new Quiz("HashMap check", QuizType.LESSON, QuizSelectionMode.FIXED, 80);
        lessonQuiz.addQuestion(first.getQuestion());
        assertThrows(IllegalArgumentException.class, () -> lessonQuiz.addQuestion(sibling.getQuestion()));
        Lesson wrongLesson = new Lesson(joins, "Joins", "joins-lesson", "SQL joins", 0, 60, 80);
        assertThrows(IllegalArgumentException.class, () -> new LessonAssessment(wrongLesson, lessonQuiz));
        Lesson correctLesson = new Lesson(hashMap, "HashMap", "hashmap-lesson", "HashMap basics", 0, 60, 80);
        assertEquals(80, new LessonAssessment(correctLesson, lessonQuiz).getPassPercentage());
        Quiz wrongThreshold = new Quiz("HashMap check", QuizType.LESSON, QuizSelectionMode.FIXED, 70);
        wrongThreshold.addQuestion(first.getQuestion());
        assertThrows(IllegalArgumentException.class, () -> new LessonAssessment(correctLesson, wrongThreshold));
    }

    @Test
    void draftContentCannotEnterPublicAttempts() {
        QuestionVersion question = question(hashMap, Difficulty.EASY);
        Quiz draftQuiz = new Quiz("Draft", QuizType.TOPIC, QuizSelectionMode.FIXED, 80);
        draftQuiz.addQuestion(question.getQuestion());
        assertThrows(IllegalArgumentException.class, () -> new QuizAttempt(user, draftQuiz, List.of(question)));

        Quiz publishedQuiz = fixedQuiz(QuizType.TOPIC, question);
        question.getQuestion().archive();
        assertThrows(IllegalArgumentException.class, () -> new QuizAttempt(user, publishedQuiz, List.of(question)));
    }

    @Test
    void movingKnowledgeNodesCannotMakeAnOutOfScopeQuestionCountTwice() {
        QuestionVersion overlapping = question(hashMap, Difficulty.EASY);
        QuestionVersion outside = question(joins, Difficulty.EASY);
        KnowledgeNode otherTopic = new KnowledgeNode(NodeType.TOPIC, "Other", "other", core, 2);
        KnowledgeNode movedSubtopic = new KnowledgeNode(NodeType.SUBTOPIC, "Moved", "moved", otherTopic, 0);
        QuestionVersion moved = question(movedSubtopic, Difficulty.EASY);
        Quiz quiz = new Quiz("Two scopes", QuizType.MIXED, QuizSelectionMode.RULE_BASED, 80);
        quiz.addRule(collections, null, 1);
        quiz.addRule(movedSubtopic, null, 1);
        quiz.submitForReview();
        quiz.publish();
        movedSubtopic.moveTo(collections);

        assertThrows(IllegalArgumentException.class, () -> new QuizAttempt(user, quiz, List.of(moved, outside)));
        assertThrows(IllegalArgumentException.class, () -> new QuizAttempt(user, quiz, List.of(moved, overlapping)));
    }

    private QuestionVersion question(KnowledgeNode node, Difficulty difficulty) {
        Question question = new Question(node, difficulty);
        QuestionVersion version = new QuestionVersion(question, 1, node.getName() + " question", "Explanation", choices(0));
        question.submitForReview();
        question.publish(version);
        return version;
    }

    private Quiz fixedQuiz(QuizType type, QuestionVersion... versions) {
        Quiz quiz = new Quiz("Fixed quiz", type, QuizSelectionMode.FIXED, 80);
        for (QuestionVersion version : versions) {
            quiz.addQuestion(version.getQuestion());
        }
        quiz.submitForReview();
        quiz.publish();
        return quiz;
    }

    private List<OptionDefinition> choices(int correctPosition) {
        return java.util.stream.IntStream.range(0, 4)
                .mapToObj(index -> new OptionDefinition("Choice " + index, index == correctPosition, "Why " + index))
                .toList();
    }
}
