package com.fesherprep.fesherprep_api.learningpath.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_learning_paths", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_learning_paths_user_path", columnNames = { "user_id", "learning_path_id" })
}, indexes = {
        @Index(name = "idx_user_learning_paths_path", columnList = "learning_path_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserLearningPath extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learning_path_id", nullable = false, updatable = false)
    private LearningPath learningPath;

    public UserLearningPath(User user, LearningPath learningPath) {
        this.user = Objects.requireNonNull(user, "User is required");
        this.learningPath = Objects.requireNonNull(learningPath, "Learning path is required");
    }
}
