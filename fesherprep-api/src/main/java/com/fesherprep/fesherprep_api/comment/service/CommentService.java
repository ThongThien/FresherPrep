package com.fesherprep.fesherprep_api.comment.service;

import com.fesherprep.fesherprep_api.comment.domain.*;
import com.fesherprep.fesherprep_api.comment.dto.*;
import com.fesherprep.fesherprep_api.comment.repository.*;
import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.lesson.repository.LessonRepository;
import com.fesherprep.fesherprep_api.lesson.service.LessonNotFoundException;
import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.quiz.repository.QuizRepository;
import com.fesherprep.fesherprep_api.quiz.service.QuizNotFoundException;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.user.domain.*;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
@Validated
@RequiredArgsConstructor
public class CommentService {
    private final ContentCommentRepository commentRepository;
    private final AdminNotificationRepository notificationRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<CommentResponse> getLessonComments(UUID lessonId, Pageable pageable) {
        requirePublishedLesson(lessonId);
        User currentUser = currentUser();
        return commentRepository.findAllByLessonId(lessonId, pageable)
                .map(comment -> CommentResponse.from(comment, currentUser.getId()));
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<CommentResponse> getQuizComments(UUID quizId, Pageable pageable) {
        requirePublishedQuiz(quizId);
        User currentUser = currentUser();
        return commentRepository.findAllByQuizId(quizId, pageable)
                .map(comment -> CommentResponse.from(comment, currentUser.getId()));
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<CommentResponse> getMyComments(Pageable pageable) {
        User currentUser = currentUser();
        return commentRepository.findAllByAuthorId(currentUser.getId(), pageable)
                .map(comment -> CommentResponse.from(comment, currentUser.getId()));
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public CommentResponse createLessonComment(UUID lessonId, @Valid CommentRequest request) {
        User author = currentUser();
        ContentComment comment = commentRepository.saveAndFlush(
                new ContentComment(author, requirePublishedLesson(lessonId), request.content())
        );
        notifyAdmins(comment, author);
        return CommentResponse.from(comment, author.getId());
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public CommentResponse createQuizComment(UUID quizId, @Valid CommentRequest request) {
        User author = currentUser();
        ContentComment comment = commentRepository.saveAndFlush(
                new ContentComment(author, requirePublishedQuiz(quizId), request.content())
        );
        notifyAdmins(comment, author);
        return CommentResponse.from(comment, author.getId());
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public CommentResponse updateComment(UUID commentId, @Valid CommentRequest request) {
        User currentUser = currentUser();
        ContentComment comment = requireOwnedComment(commentId, currentUser);
        comment.edit(request.content(), clock.instant());
        return CommentResponse.from(comment, currentUser.getId());
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public void deleteComment(UUID commentId) {
        User currentUser = currentUser();
        commentRepository.delete(requireOwnedComment(commentId, currentUser));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<AdminNotificationResponse> getNotifications(Pageable pageable) {
        User admin = currentUser();
        return notificationRepository.findAllByRecipientId(admin.getId(), pageable)
                .map(AdminNotificationResponse::from);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse getUnreadCount() {
        return new UnreadNotificationCountResponse(
                notificationRepository.countByRecipientIdAndReadAtIsNull(currentUser().getId())
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public AdminNotificationResponse markNotificationRead(UUID notificationId) {
        User admin = currentUser();
        AdminNotification notification = notificationRepository
                .findByIdAndRecipientId(notificationId, admin.getId())
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));
        notification.markRead(clock.instant());
        return AdminNotificationResponse.from(notification);
    }

    private Lesson requirePublishedLesson(UUID lessonId) {
        return lessonRepository.findByIdAndStatus(lessonId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new LessonNotFoundException(lessonId));
    }

    private Quiz requirePublishedQuiz(UUID quizId) {
        return quizRepository.findByIdAndStatus(quizId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new QuizNotFoundException(quizId));
    }

    private ContentComment requireOwnedComment(UUID commentId, User currentUser) {
        ContentComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));
        if (!comment.getAuthor().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the comment author can modify this comment");
        }
        return comment;
    }

    private void notifyAdmins(ContentComment comment, User author) {
        List<AdminNotification> notifications = userRepository
                .findAllByRoleAndActiveTrue(UserRole.ADMIN).stream()
                .filter(admin -> !admin.getId().equals(author.getId()))
                .map(admin -> new AdminNotification(admin, comment))
                .toList();
        notificationRepository.saveAll(notifications);
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        return userRepository.findByEmail(authentication.getName())
                .filter(User::isActive)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException(
                        "Authenticated user is unavailable"
                ));
    }
}
