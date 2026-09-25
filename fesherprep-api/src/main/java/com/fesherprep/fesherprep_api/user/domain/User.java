package com.fesherprep.fesherprep_api.user.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"))
@Check(name = "ck_users_normalized_email", constraints = "email = lower(trim(email))")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @NotBlank
    @Email
    @Size(max = 254)
    @Column(nullable = false, length = 254)
    private String email;

    @JsonIgnore
    @NotBlank
    @Size(max = 255)
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @NotBlank
    @Size(max = 100)
    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private UserRole role = UserRole.USER;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean active = true;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public User(String email, String passwordHash, String displayName) {
        this.email = normalizeEmail(email);
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash");
        this.displayName = Objects.requireNonNull(displayName, "displayName").trim();
    }

    public void changeDisplayName(String displayName) {
        this.displayName = Objects.requireNonNull(displayName, "displayName").trim();
    }

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash");
    }

    public void changeRole(UserRole role) {
        this.role = Objects.requireNonNull(role, "role");
    }

    public void changeActive(boolean active) {
        this.active = active;
    }

    @PrePersist
    @PreUpdate
    private void normalize() {
        email = normalizeEmail(email);
    }

    private static String normalizeEmail(String email) {
        return Objects.requireNonNull(email, "email").trim().toLowerCase(Locale.ROOT);
    }
}
