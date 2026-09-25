package com.fesherprep.fesherprep_api.user.service;

import com.fesherprep.fesherprep_api.learningpath.repository.UserLearningPathRepository;
import com.fesherprep.fesherprep_api.lesson.repository.LessonProgressRepository;
import com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus;
import com.fesherprep.fesherprep_api.quiz.repository.QuizAttemptRepository;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.domain.UserRole;
import com.fesherprep.fesherprep_api.user.dto.*;
import com.fesherprep.fesherprep_api.user.repository.RefreshTokenRepository;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Clock;
import java.util.Locale;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Validated
@RequiredArgsConstructor
public class UserService {
    private static final Set<String> ADMIN_SORT_FIELDS =
            Set.of("createdAt", "displayName", "email");
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserLearningPathRepository userLearningPathRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        return UserResponse.from(requireCurrentUser());
    }

    @Transactional
    public UserResponse updateCurrentUser(@Valid UpdateUserRequest request) {
        User user = requireCurrentUser();
        user.changeDisplayName(request.displayName());
        return UserResponse.from(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse updateRole(UUID userId, @Valid UpdateUserRoleRequest request) {
        User user = changeRole(userId, request.role());
        return UserResponse.from(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<AdminUserSummaryResponse> getAdminUsers(
            String search,
            UserRole role,
            Boolean active,
            Pageable pageable
    ) {
        Specification<User> specification = (root, query, builder) -> builder.conjunction();
        if (search != null && !search.isBlank()) {
            String pattern = "%" + escapeLike(search.strip().toLowerCase(Locale.ROOT)) + "%";
            specification = specification.and((root, query, builder) -> builder.or(
                    builder.like(builder.lower(root.get("email")), pattern, '\\'),
                    builder.like(builder.lower(root.get("displayName")), pattern, '\\')
            ));
        }
        if (role != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("role"), role));
        }
        if (active != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("active"), active));
        }
        return userRepository.findAll(specification, adminPageable(pageable))
                .map(AdminUserSummaryResponse::from);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public AdminUserDetailResponse getAdminUser(UUID userId) {
        User user = requireUser(userId);
        Pageable recentLessons = PageRequest.of(
                0, 5, Sort.by(Sort.Direction.DESC, "lastViewedAt")
        );
        Pageable recentAttempts = PageRequest.of(
                0, 5, Sort.by(Sort.Direction.DESC, "createdAt")
        );
        long submittedAttempts = quizAttemptRepository.countByUserIdAndStatus(
                userId, AttemptStatus.SUBMITTED
        );
        long passedAttempts = quizAttemptRepository.countPassedByUserId(userId);
        return new AdminUserDetailResponse(
                AdminUserSummaryResponse.from(user),
                userLearningPathRepository.countByUserId(userId),
                lessonProgressRepository.countByUserId(userId),
                lessonProgressRepository.countByUserIdAndReadQualifiedAtIsNotNull(userId),
                quizAttemptRepository.countByUserId(userId),
                submittedAttempts,
                passedAttempts,
                submittedAttempts - passedAttempts,
                lessonProgressRepository.findAllByUserId(userId, recentLessons)
                        .map(AdminLessonActivityResponse::from)
                        .getContent(),
                quizAttemptRepository.findAllByUserId(userId, recentAttempts)
                        .map(AdminQuizActivityResponse::from)
                        .getContent()
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public AdminUserSummaryResponse changeAdminStatus(
            UUID userId,
            @Valid ChangeUserStatusRequest request
    ) {
        if (userId.equals(currentUserId()) && !request.active()) {
            throw new IllegalStateException("You cannot deactivate your own account");
        }
        User user = requireUser(userId);
        user.changeActive(request.active());
        if (!request.active()) {
            refreshTokenRepository.revokeActiveByUserId(userId, clock.instant());
        }
        return AdminUserSummaryResponse.from(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public AdminUserSummaryResponse changeAdminRole(
            UUID userId,
            @Valid UpdateUserRoleRequest request
    ) {
        return AdminUserSummaryResponse.from(changeRole(userId, request.role()));
    }

    private User changeRole(UUID userId, UserRole role) {
        if (userId.equals(currentUserId()) && role != UserRole.ADMIN) {
            throw new IllegalStateException("You cannot remove your own administrative access");
        }
        User user = requireUser(userId);
        if (user.getRole() != role) {
            user.changeRole(role);
            refreshTokenRepository.revokeActiveByUserId(userId, clock.instant());
        }
        return user;
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new AuthenticationCredentialsNotFoundException("Invalid authenticated principal");
        }
    }

    private User requireCurrentUser() {
        return userRepository.findById(currentUserId())
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("Authenticated user no longer exists"));
    }

    private static Pageable adminPageable(Pageable pageable) {
        List<Sort.Order> orders = pageable.getSort().stream()
                .filter(order -> ADMIN_SORT_FIELDS.contains(order.getProperty()))
                .toList();
        Sort sort = orders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(orders);
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
