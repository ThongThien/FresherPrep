package com.fesherprep.fesherprep_api.user.service;

import com.fesherprep.fesherprep_api.auth.domain.RefreshToken;
import com.fesherprep.fesherprep_api.config.JwtProperties;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.dto.*;
import com.fesherprep.fesherprep_api.user.repository.RefreshTokenRepository;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
@Validated
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final Clock clock;

    @Transactional
    public AuthenticationResponse register(@Valid RegisterRequest request) {
        String email = FresherPrepUserDetailsService.normalizeEmail(request.email());
        validatePassword(request.password());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyUsedException();
        }

        User user = new User(email, passwordEncoder.encode(request.password()), request.displayName());
        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw new EmailAlreadyUsedException();
        }
        return new AuthenticationResponse(UserResponse.from(user), issueTokens(user));
    }

    @Transactional
    public AuthenticationResponse login(@Valid LoginRequest request) {
        String email = FresherPrepUserDetailsService.normalizeEmail(request.email());
        validatePassword(request.password());
        authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(email, request.password())
        );
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user no longer exists"));
        return new AuthenticationResponse(UserResponse.from(user), issueTokens(user));
    }

    @Transactional
    public TokenPairResponse refresh(@Valid RefreshTokenRequest request) {
        Instant now = clock.instant();
        RefreshToken token = refreshTokenRepository.findByTokenHashForUpdate(hashToken(request.refreshToken()))
                .filter(candidate -> candidate.isActiveAt(now) && candidate.getUser().isActive())
                .orElseThrow(InvalidRefreshTokenException::new);

        token.revoke(now);
        return issueTokens(token.getUser());
    }

    @Transactional
    public void logout(@Valid RefreshTokenRequest request) {
        Instant now = clock.instant();
        refreshTokenRepository.findByTokenHashForUpdate(hashToken(request.refreshToken()))
                .filter(candidate -> candidate.isActiveAt(now))
                .ifPresent(candidate -> candidate.revoke(now));
    }

    private TokenPairResponse issueTokens(User user) {
        JwtService.AccessToken accessToken = jwtService.createAccessToken(user);
        String rawRefreshToken = generateRefreshToken();
        RefreshToken refreshToken = new RefreshToken(
                user,
                hashToken(rawRefreshToken),
                clock.instant().plus(jwtProperties.refreshTokenTtl())
        );
        refreshTokenRepository.save(refreshToken);
        return new TokenPairResponse(accessToken.value(), accessToken.expiresAt(), rawRefreshToken);
    }

    private static void validatePassword(String password) {
        int byteLength = password.getBytes(StandardCharsets.UTF_8).length;
        if (byteLength < 8 || byteLength > 72) {
            throw new IllegalArgumentException("Password must contain between 8 and 72 UTF-8 bytes");
        }
    }

    private static String generateRefreshToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
