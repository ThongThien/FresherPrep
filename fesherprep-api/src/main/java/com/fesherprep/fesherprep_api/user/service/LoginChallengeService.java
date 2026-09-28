package com.fesherprep.fesherprep_api.user.service;

import com.fesherprep.fesherprep_api.config.LoginChallengeProperties;
import com.fesherprep.fesherprep_api.user.dto.LoginChallengeResponse;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class LoginChallengeService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final List<Question> QUESTIONS = List.of(
            new Question(
                    "Từ khóa nào dùng để khai báo một lớp trong Java?",
                    "The keyword starts with 'cl' and has 5 letters.",
                    Set.of("class")
            ),
            new Question(
                    "Từ khóa nào dùng để tạo một object mới trong Java?",
                    "The keyword has 3 letters and starts with 'n'.",
                    Set.of("new")
            ),
            new Question(
                    "Từ khóa nào cho phép một class kế thừa class khác?",
                    "The keyword starts with 'ex' and ends with 's'.",
                    Set.of("extends")
            ),
            new Question(
                    "Kiểu dữ liệu Java nào chỉ có hai giá trị true hoặc false?",
                    "The type starts with 'bool'.",
                    Set.of("boolean")
            ),
            new Question(
                    "Tên method làm điểm bắt đầu của một ứng dụng Java là gì?",
                    "It is a 4-letter method name starting with 'm'.",
                    Set.of("main")
            )
    );

    private final LoginChallengeProperties properties;
    private final Clock clock;
    private final ConcurrentHashMap<String, FailureState> failures = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, ChallengeState> challenges = new ConcurrentHashMap<>();
    private final AtomicLong operationCounter = new AtomicLong();

    public LoginChallengeService(LoginChallengeProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public void verifyIfRequired(
            String email,
            String clientAddress,
            UUID challengeId,
            String answer
    ) {
        if (!properties.isEnabled()) return;
        Instant now = clock.instant();
        cleanupOccasionally(now);
        String clientKey = clientKey(email, clientAddress);
        FailureState state = failures.get(clientKey);
        if (state == null || state.failures() < threshold() || state.expiredAt(now, retention())) return;

        ChallengeState challenge = challengeId == null ? null : challenges.remove(challengeId);
        if (challenge == null
                || challenge.expiresAt().isBefore(now)
                || !MessageDigest.isEqual(
                        challenge.clientKey().getBytes(StandardCharsets.UTF_8),
                        clientKey.getBytes(StandardCharsets.UTF_8)
                )
                || !challenge.acceptedAnswers().contains(normalizeAnswer(answer))) {
            throw new LoginChallengeRequiredException(issue(clientKey, now));
        }
    }

    public Optional<LoginChallengeResponse> recordAuthenticationFailure(String email, String clientAddress) {
        if (!properties.isEnabled()) return Optional.empty();
        Instant now = clock.instant();
        cleanupOccasionally(now);
        String clientKey = clientKey(email, clientAddress);
        ensureFailureCapacity(now);
        FailureState state = failures.compute(clientKey, (ignored, current) -> {
            if (current == null || current.expiredAt(now, retention())) return new FailureState(1, now);
            return new FailureState(current.failures() + 1, now);
        });
        return state.failures() >= threshold() ? Optional.of(issue(clientKey, now)) : Optional.empty();
    }

    public void clear(String email, String clientAddress) {
        String clientKey = clientKey(email, clientAddress);
        failures.remove(clientKey);
        challenges.entrySet().removeIf(entry -> entry.getValue().clientKey().equals(clientKey));
    }

    private LoginChallengeResponse issue(String clientKey, Instant now) {
        ensureChallengeCapacity(now);
        Question question = QUESTIONS.get(RANDOM.nextInt(QUESTIONS.size()));
        UUID id = UUID.randomUUID();
        Instant expiresAt = now.plus(ttl());
        challenges.put(id, new ChallengeState(clientKey, question.acceptedAnswers(), expiresAt));
        return new LoginChallengeResponse(id, question.text(), question.hint(), expiresAt);
    }

    private void cleanupOccasionally(Instant now) {
        if ((operationCounter.incrementAndGet() & 127) != 0) return;
        failures.entrySet().removeIf(entry -> entry.getValue().expiredAt(now, retention()));
        challenges.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private void ensureFailureCapacity(Instant now) {
        int maximum = Math.max(100, properties.getMaxClients());
        if (failures.size() < maximum) return;
        failures.entrySet().removeIf(entry -> entry.getValue().expiredAt(now, retention()));
        if (failures.size() >= maximum) {
            failures.entrySet().stream().min(Map.Entry.comparingByValue(
                    Comparator.comparing(FailureState::lastFailedAt)
            )).ifPresent(entry -> failures.remove(entry.getKey(), entry.getValue()));
        }
    }

    private void ensureChallengeCapacity(Instant now) {
        int maximum = Math.max(100, properties.getMaxClients());
        if (challenges.size() < maximum) return;
        challenges.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
        if (challenges.size() >= maximum) {
            challenges.entrySet().stream().min(Map.Entry.comparingByValue(
                    Comparator.comparing(ChallengeState::expiresAt)
            )).ifPresent(entry -> challenges.remove(entry.getKey(), entry.getValue()));
        }
    }

    private int threshold() {
        return Math.max(1, properties.getFailureThreshold());
    }

    private java.time.Duration ttl() {
        return properties.getTtl().isNegative() || properties.getTtl().isZero()
                ? java.time.Duration.ofMinutes(3) : properties.getTtl();
    }

    private java.time.Duration retention() {
        return properties.getFailureRetention().isNegative() || properties.getFailureRetention().isZero()
                ? java.time.Duration.ofMinutes(15) : properties.getFailureRetention();
    }

    private static String clientKey(String email, String clientAddress) {
        String value = email + '|' + Objects.requireNonNullElse(clientAddress, "unknown");
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private static String normalizeAnswer(String answer) {
        if (answer == null) return "";
        return answer.strip().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private record Question(String text, String hint, Set<String> acceptedAnswers) {
    }

    private record ChallengeState(String clientKey, Set<String> acceptedAnswers, Instant expiresAt) {
    }

    private record FailureState(int failures, Instant lastFailedAt) {
        private boolean expiredAt(Instant now, java.time.Duration retention) {
            return lastFailedAt.plus(retention).isBefore(now);
        }
    }
}
