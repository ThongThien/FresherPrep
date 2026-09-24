package com.fesherprep.fesherprep_api.quiz.domain;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

import java.util.Objects;

@Entity
@Table(name = "quiz_rules", indexes = @Index(name = "idx_quiz_rules_quiz", columnList = "quiz_id"))
@Check(constraints = "question_count > 0")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizRule extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "knowledge_node_id", nullable = false)
    private KnowledgeNode knowledgeNode;

    // Null means any difficulty within this node's subtree.
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Difficulty difficulty;

    @Column(name = "question_count", nullable = false)
    private int questionCount;

    QuizRule(Quiz quiz, KnowledgeNode node, Difficulty difficulty, int questionCount) {
        this.quiz = Objects.requireNonNull(quiz);
        update(node, difficulty, questionCount);
    }

    void update(KnowledgeNode node, Difficulty difficulty, int questionCount) {
        if (questionCount < 1) {
            throw new IllegalArgumentException("Question count must be positive");
        }
        this.knowledgeNode = Objects.requireNonNull(node);
        this.difficulty = difficulty;
        this.questionCount = questionCount;
    }

    public boolean matches(Question question) {
        return (difficulty == null || difficulty == question.getDifficulty())
                && contains(knowledgeNode, question.getSubtopic());
    }

    boolean overlaps(KnowledgeNode node, Difficulty otherDifficulty) {
        boolean sameDifficulty = difficulty == null || otherDifficulty == null || difficulty == otherDifficulty;
        return sameDifficulty && (contains(knowledgeNode, node) || contains(node, knowledgeNode));
    }

    private static boolean contains(KnowledgeNode ancestor, KnowledgeNode node) {
        for (KnowledgeNode current = node; current != null; current = current.getParent()) {
            if (ancestor.hasSameIdentityAs(current)) {
                return true;
            }
        }
        return false;
    }
}
