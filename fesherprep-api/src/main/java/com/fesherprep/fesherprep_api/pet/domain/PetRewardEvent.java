package com.fesherprep.fesherprep_api.pet.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "pet_reward_events", uniqueConstraints = @UniqueConstraint(
        name = "uk_pet_reward_user_activity_source",
        columnNames = {"user_id", "activity_type", "source_id"}
), indexes = @Index(name = "idx_pet_rewards_user_created", columnList = "user_id,created_at"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PetRewardEvent extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, updatable = false, length = 40)
    private PetActivityType activityType;

    @Column(name = "source_id", nullable = false, updatable = false)
    private UUID sourceId;

    @PositiveOrZero
    @Column(name = "points_awarded", nullable = false, updatable = false)
    private int pointsAwarded;

    public PetRewardEvent(User user, PetActivityType activityType, UUID sourceId, int pointsAwarded) {
        this.user = Objects.requireNonNull(user, "User is required");
        this.activityType = Objects.requireNonNull(activityType, "Activity type is required");
        this.sourceId = Objects.requireNonNull(sourceId, "Activity source is required");
        if (pointsAwarded < 0) throw new IllegalArgumentException("Reward points cannot be negative");
        this.pointsAwarded = pointsAwarded;
    }
}
