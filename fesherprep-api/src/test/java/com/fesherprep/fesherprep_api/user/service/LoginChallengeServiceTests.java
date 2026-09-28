package com.fesherprep.fesherprep_api.user.service;

import com.fesherprep.fesherprep_api.config.LoginChallengeProperties;
import com.fesherprep.fesherprep_api.user.dto.LoginChallengeResponse;
import org.junit.jupiter.api.Test;

import java.time.*;

import static org.junit.jupiter.api.Assertions.*;

class LoginChallengeServiceTests {
    private static final String EMAIL = "user@example.com";
    private static final String CLIENT = "127.0.0.1";

    @Test
    void requiresChallengeOnlyAfterConfiguredFailureThreshold() {
        LoginChallengeProperties properties = properties();
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        LoginChallengeService service = new LoginChallengeService(properties, clock);

        assertTrue(service.recordAuthenticationFailure(EMAIL, CLIENT).isEmpty());
        assertTrue(service.recordAuthenticationFailure(EMAIL, CLIENT).isEmpty());
        assertTrue(service.recordAuthenticationFailure(EMAIL, CLIENT).isPresent());
    }

    @Test
    void acceptsCorrectAnswerOnceAndRejectsChallengeReuse() {
        LoginChallengeService service = challengedService();
        LoginChallengeResponse challenge = thirdFailure(service);

        assertDoesNotThrow(() -> service.verifyIfRequired(
                EMAIL, CLIENT, challenge.id(), answerFor(challenge)
        ));
        assertThrows(LoginChallengeRequiredException.class, () -> service.verifyIfRequired(
                EMAIL, CLIENT, challenge.id(), answerFor(challenge)
        ));
    }

    @Test
    void rejectsExpiredChallenge() {
        LoginChallengeProperties properties = properties();
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        LoginChallengeService service = new LoginChallengeService(properties, clock);
        LoginChallengeResponse challenge = thirdFailure(service);

        clock.advance(Duration.ofMinutes(4));

        assertThrows(LoginChallengeRequiredException.class, () -> service.verifyIfRequired(
                EMAIL, CLIENT, challenge.id(), answerFor(challenge)
        ));
    }

    private static LoginChallengeService challengedService() {
        return new LoginChallengeService(
                properties(),
                new MutableClock(Instant.parse("2026-01-01T00:00:00Z"))
        );
    }

    private static LoginChallengeResponse thirdFailure(LoginChallengeService service) {
        service.recordAuthenticationFailure(EMAIL, CLIENT);
        service.recordAuthenticationFailure(EMAIL, CLIENT);
        return service.recordAuthenticationFailure(EMAIL, CLIENT).orElseThrow();
    }

    private static LoginChallengeProperties properties() {
        LoginChallengeProperties properties = new LoginChallengeProperties();
        properties.setFailureThreshold(3);
        properties.setTtl(Duration.ofMinutes(3));
        return properties;
    }

    private static String answerFor(LoginChallengeResponse challenge) {
        String hint = challenge.hint();
        if (hint.contains("5 letters")) return "class";
        if (hint.contains("3 letters")) return "new";
        if (hint.contains("starts with 'ex'")) return "extends";
        if (hint.contains("starts with 'bool'")) return "boolean";
        if (hint.contains("4-letter")) return "main";
        throw new AssertionError("Unknown challenge hint: " + hint);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
