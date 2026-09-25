package com.fesherprep.fesherprep_api.contribution.domain;

import com.fesherprep.fesherprep_api.user.domain.User;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ContentSubmissionTests {
    private final User contributor = new User("writer@example.com", "encoded-password", "Writer");
    private final User admin = new User("admin@example.com", "encoded-password", "Admin");

    @Test
    void draftMustBeSubmittedBeforeReviewAndRejectionCanBeRevised() {
        ContentSubmission submission = submission(ContributionContentType.LESSON);

        assertThrows(IllegalStateException.class,
                () -> submission.publish(admin, Instant.parse("2026-09-25T10:00:00Z")));
        submission.submit(Instant.parse("2026-09-25T10:00:00Z"));
        submission.reject(admin, "Add a concrete example", Instant.parse("2026-09-25T11:00:00Z"));

        assertEquals(ReviewStatus.REJECTED, submission.getStatus());
        assertEquals("Add a concrete example", submission.getReviewComment());
        submission.beginEditing();
        assertEquals(ReviewStatus.DRAFT, submission.getStatus());
        submission.submit(Instant.parse("2026-09-25T12:00:00Z"));
        submission.publish(admin, Instant.parse("2026-09-25T13:00:00Z"));
        assertEquals(ReviewStatus.PUBLISHED, submission.getStatus());
    }

    @Test
    void submittedAndPublishedContentCannotBeSilentlyEdited() {
        ContentSubmission submission = submission(ContributionContentType.QUIZ);
        submission.submit(Instant.now());
        assertThrows(IllegalStateException.class, submission::beginEditing);
        submission.publish(admin, Instant.now());
        assertThrows(IllegalStateException.class, submission::beginEditing);
    }

    @Test
    void onlyPublishedQuestionsCanStartRevisionInReviewModel() {
        ContentSubmission question = submission(ContributionContentType.QUESTION);
        assertThrows(IllegalStateException.class, question::beginPublishedQuestionRevision);
        question.submit(Instant.now());
        question.publish(admin, Instant.now());
        assertDoesNotThrow(question::beginPublishedQuestionRevision);
        assertEquals(ReviewStatus.DRAFT, question.getStatus());

        ContentSubmission lesson = submission(ContributionContentType.LESSON);
        lesson.submit(Instant.now());
        lesson.publish(admin, Instant.now());
        assertThrows(IllegalStateException.class, lesson::beginPublishedQuestionRevision);
    }

    @Test
    void rejectionRequiresFeedback() {
        ContentSubmission submission = submission(ContributionContentType.LESSON);
        submission.submit(Instant.now());
        assertThrows(IllegalArgumentException.class,
                () -> submission.reject(admin, "  ", Instant.now()));
        assertEquals(ReviewStatus.PENDING_REVIEW, submission.getStatus());
    }

    private ContentSubmission submission(ContributionContentType type) {
        return new ContentSubmission(type, UUID.randomUUID(), "Content title", contributor);
    }
}
