package com.fesherprep.fesherprep_api.user.service;

import com.fesherprep.fesherprep_api.auth.domain.RefreshToken;
import com.fesherprep.fesherprep_api.config.JwtProperties;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.dto.RefreshTokenRequest;
import com.fesherprep.fesherprep_api.user.dto.TokenPairResponse;
import com.fesherprep.fesherprep_api.user.repository.RefreshTokenRepository;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.*;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthServiceRefreshTests {
    @Test
    void concurrentStyleRefreshesUsingTheSameCookieBothSucceedWithinGraceWindow() {
        Instant now = Instant.parse("2026-09-28T08:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        User user = new User("admin@example.com", "hashed-password", "Admin");
        RefreshToken stored = new RefreshToken(user, "a".repeat(64), now.plus(Duration.ofDays(30)));
        RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
        JwtService jwtService = mock(JwtService.class);
        when(tokens.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(stored));
        when(tokens.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.createAccessToken(user))
                .thenReturn(new JwtService.AccessToken("access-token", now.plusSeconds(900)));

        AuthService service = new AuthService(
                mock(UserRepository.class),
                tokens,
                mock(PasswordEncoder.class),
                mock(AuthenticationManager.class),
                mock(LoginChallengeService.class),
                jwtService,
                new JwtProperties("fresherprep", "unused", Duration.ofMinutes(15), Duration.ofDays(30)),
                clock
        );

        TokenPairResponse first = service.refresh(new RefreshTokenRequest("same-browser-cookie"));
        TokenPairResponse second = service.refresh(new RefreshTokenRequest("same-browser-cookie"));

        assertNotEquals(first.refreshToken(), second.refreshToken());
        assertTrue(stored.isActiveAt(now));
        verify(tokens, times(2)).save(any(RefreshToken.class));
    }
}
