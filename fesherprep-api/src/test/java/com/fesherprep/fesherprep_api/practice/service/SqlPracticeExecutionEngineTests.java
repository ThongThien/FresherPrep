package com.fesherprep.fesherprep_api.practice.service;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import static org.junit.jupiter.api.Assertions.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SqlPracticeExecutionEngineTests {
    private SqlPracticeExecutionEngine engine;

    @BeforeAll
    void setUp() {
        engine = new SqlPracticeExecutionEngine();
        engine.initialize();
    }

    @Test
    void executesReadOnlyQueryAgainstIsolatedDataset() {
        var comparison = engine.executeAndCompare(
                "SELECT id, full_name FROM employees ORDER BY id",
                "SELECT id, full_name FROM employees ORDER BY id");
        assertTrue(comparison.correct(), comparison.error());
        assertEquals(5, comparison.result().rows().size());
    }

    @Test
    void rejectsMutationStatements() {
        assertThrows(IllegalArgumentException.class,
                () -> engine.executeAndCompare("DELETE FROM employees", "SELECT id FROM employees"));
    }

    @Test
    void rejectsTablesOutsideAllowList() {
        assertThrows(IllegalArgumentException.class,
                () -> engine.executeAndCompare("SELECT * FROM users", "SELECT id FROM employees"));
    }

    @Test
    void doesNotMarkDifferentResultsCorrect() {
        var comparison = engine.executeAndCompare(
                "SELECT id FROM employees WHERE id = 1",
                "SELECT id FROM employees ORDER BY id");
        assertFalse(comparison.correct());
    }
}
