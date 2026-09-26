package com.fesherprep.fesherprep_api.config;

import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.domain.UserRole;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import tools.jackson.databind.ObjectMapper;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CurrentUserSecurityFilterTests {
    private final UserRepository repository = mock(UserRepository.class);
    private final CurrentUserSecurityFilter filter = new CurrentUserSecurityFilter(repository, new ObjectMapper());

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsAccessTokenAfterAccountDeactivation() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User("learner@example.com", "bcrypt-hash", "Learner");
        user.changeActive(false);
        when(repository.findById(userId)).thenReturn(Optional.of(user));
        authenticate(userId, "USER");

        MockHttpServletResponse response = invoke();

        assertEquals(401, response.getStatus());
        org.junit.jupiter.api.Assertions.assertTrue(response.getContentAsString().contains("SESSION_INVALIDATED"));
    }

    @Test
    void rejectsAccessTokenAfterRoleChange() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User("admin@example.com", "bcrypt-hash", "Admin");
        user.changeRole(UserRole.USER);
        when(repository.findById(userId)).thenReturn(Optional.of(user));
        authenticate(userId, "ADMIN");

        assertEquals(401, invoke().getStatus());
    }

    private MockHttpServletResponse invoke() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean invoked = new AtomicBoolean();
        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> invoked.set(true));
        assertFalse(invoked.get());
        return response;
    }

    private static void authenticate(UUID userId, String role) {
        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "HS256")
                .subject(userId.toString())
                .claim("role", role)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new JwtAuthenticationToken(jwt, AuthorityUtils.NO_AUTHORITIES)
        );
    }
}
