package com.fesherprep.fesherprep_api.user.service;

import com.fesherprep.fesherprep_api.learningpath.repository.UserLearningPathRepository;
import com.fesherprep.fesherprep_api.lesson.repository.LessonProgressRepository;
import com.fesherprep.fesherprep_api.quiz.repository.QuizAttemptRepository;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.domain.UserRole;
import com.fesherprep.fesherprep_api.user.dto.UpdateUserRoleRequest;
import com.fesherprep.fesherprep_api.user.repository.RefreshTokenRepository;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTests {
    @Mock
    private UserRepository userRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private UserLearningPathRepository userLearningPathRepository;
    @Mock
    private LessonProgressRepository lessonProgressRepository;
    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void roleChangeKeepsRefreshTokenSoTheUserCanReceiveTheNewRole() {
        UUID adminId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        authenticate(adminId);
        User target = mock(User.class);
        when(target.getRole()).thenReturn(UserRole.USER);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));
        UserService service = service();

        service.changeAdminRole(targetId, new UpdateUserRoleRequest(UserRole.CONTRIBUTOR));

        verify(target).changeRole(UserRole.CONTRIBUTOR);
        verify(refreshTokenRepository, never()).revokeActiveByUserId(any(), any());
    }

    @Test
    void adminStillCannotRemoveTheirOwnAdministrativeRole() {
        UUID adminId = UUID.randomUUID();
        authenticate(adminId);
        UserService service = service();

        assertThrows(
                IllegalStateException.class,
                () -> service.changeAdminRole(adminId, new UpdateUserRoleRequest(UserRole.USER))
        );

        verifyNoInteractions(userRepository);
    }

    private UserService service() {
        return new UserService(
                userRepository,
                refreshTokenRepository,
                userLearningPathRepository,
                lessonProgressRepository,
                quizAttemptRepository,
                Clock.systemUTC()
        );
    }

    private static void authenticate(UUID userId) {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(userId.toString(), null, java.util.List.of())
        );
    }
}
