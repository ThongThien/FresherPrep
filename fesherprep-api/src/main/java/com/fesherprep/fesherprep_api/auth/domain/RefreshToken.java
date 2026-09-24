package com.fesherprep.fesherprep_api.auth.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "refresh_tokens", uniqueConstraints = @UniqueConstraint(name = "uk_refresh_tokens_hash", columnNames = "token_hash"), indexes = {
        @Index(name = "idx_refresh_tokens_user", columnList = "user_id"),
        @Index(name = "idx_refresh_tokens_expires", columnList = "expires_at")
})
@Check(name = "ck_refresh_tokens_dates", constraints = "expires_at > created_at and (revoked_at is null or revoked_at >= created_at)")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false, foreignKey = @ForeignKey(name = "fk_refresh_tokens_user"))
    private User user;

    // SHA-256 hex digest of a random refresh token, never its plaintext value.
    @JsonIgnore
    @NotNull
    @Pattern(regexp = "[0-9a-f]{64}")
    @Column(name = "token_hash", nullable = false, updatable = false, length = 64)
    private String tokenHash;

    @NotNull
    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    public RefreshToken(User user, String tokenHash, Instant expiresAt) {
        this.user = Objects.requireNonNull(user, "user");
        this.tokenHash = Objects.requireNonNull(tokenHash, "tokenHash");
        this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt");
    }

    public boolean isActiveAt(Instant instant) {
        return revokedAt == null && expiresAt.isAfter(Objects.requireNonNull(instant, "instant"));
    }

    public void revoke(Instant revokedAt) {
        Objects.requireNonNull(revokedAt, "revokedAt");
        if (getCreatedAt() != null && revokedAt.isBefore(getCreatedAt())) {
            throw new IllegalArgumentException("Revocation time cannot be before token creation");
        }
        if (this.revokedAt == null) {
            this.revokedAt = revokedAt;
        }
    }
}
