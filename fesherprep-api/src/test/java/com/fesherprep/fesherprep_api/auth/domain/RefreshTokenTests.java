package com.fesherprep.fesherprep_api.auth.domain;

import com.fesherprep.fesherprep_api.user.domain.User;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class RefreshTokenTests {
    @Test
    void rotatedTokenRemainsUsableOnlyDuringTheShortGraceWindow() {
        Instant now = Instant.parse("2026-09-28T08:00:00Z");
        RefreshToken token = token(now);

        token.revoke(now.plusSeconds(5));

        assertTrue(token.isActiveAt(now.plusSeconds(4)));
        assertFalse(token.isActiveAt(now.plusSeconds(5)));
    }

    @Test
    void logoutCanImmediatelyRevokeATokenAlreadyScheduledForRotation() {
        Instant now = Instant.parse("2026-09-28T08:00:00Z");
        RefreshToken token = token(now);
        token.revoke(now.plusSeconds(5));

        token.revoke(now);

        assertFalse(token.isActiveAt(now));
        assertEquals(now, token.getRevokedAt());
    }

    private static RefreshToken token(Instant now) {
        return new RefreshToken(
                new User("refresh@example.com", "hashed-password", "Refresh User"),
                "a".repeat(64),
                now.plusSeconds(3600)
        );
    }
}
