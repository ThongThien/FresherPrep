package com.fesherprep.fesherprep_api;

import jakarta.persistence.Entity;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.boot.spi.MetadataImplementor;
import org.hibernate.dialect.PostgreSQLDialect;
import org.hibernate.engine.jdbc.connections.internal.UserSuppliedConnectionProviderImpl;
import org.hibernate.mapping.Table;
import org.hibernate.tool.schema.internal.SchemaCreatorImpl;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.util.ClassUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FesherprepApiApplicationTests {

    private static final Set<String> CORE_TABLES = Set.of(
            "users", "refresh_tokens",
            "knowledge_nodes", "lessons", "lesson_prerequisites", "lesson_progress",
            "learning_paths", "learning_path_items", "user_learning_paths",
            "questions", "question_versions", "question_options",
            "quizzes", "quiz_rules", "quiz_fixed_questions", "lesson_assessments",
            "quiz_attempts", "quiz_attempt_questions", "quiz_attempt_answers"
    );

    @Test
    void coreMappingsGeneratePostgresqlSchemaWithoutDatabaseConnection() throws Exception {
        StandardServiceRegistry registry = new StandardServiceRegistryBuilder()
                .applySetting("hibernate.dialect", PostgreSQLDialect.class.getName())
                .applySetting("hibernate.boot.allow_jdbc_metadata_access", false)
                .applySetting("hibernate.connection.provider_class", UserSuppliedConnectionProviderImpl.class)
                .applySetting("hibernate.physical_naming_strategy", PhysicalNamingStrategySnakeCaseImpl.class)
                .applySetting("hibernate.default_schema", "fresherprep")
                .applySetting("hibernate.hbm2ddl.auto", "none")
                .disableAutoClose()
                .build();

        try {
            MetadataSources sources = new MetadataSources(registry);
            var scanner = new ClassPathScanningCandidateComponentProvider(false);
            scanner.addIncludeFilter(new AnnotationTypeFilter(Entity.class));
            for (var candidate : scanner.findCandidateComponents("com.fesherprep.fesherprep_api")) {
                sources.addAnnotatedClass(ClassUtils.forName(candidate.getBeanClassName(), getClass().getClassLoader()));
            }

            MetadataImplementor metadata = (MetadataImplementor) sources.buildMetadata();
            // Resolve associations and validate duplicate/invalid column mappings without Supabase credentials.
            metadata.validate();

            Set<String> mappedTables = metadata.collectTableMappings().stream()
                    .filter(Table::isPhysicalTable)
                    .map(Table::getName)
                    .collect(Collectors.toSet());
            assertEquals(CORE_TABLES, mappedTables,
                    "Only the 19 core tables should be mapped; roles and optional modules must not create tables");

            var commands = new SchemaCreatorImpl(registry).generateCreationCommands(metadata, true);
            Set<String> createdTables = commands.stream()
                    .filter(command -> command.startsWith("create table "))
                    .map(command -> command.substring("create table ".length()).split("\\s+", 2)[0])
                    .map(tableName -> tableName.substring(tableName.lastIndexOf('.') + 1))
                    .collect(Collectors.toSet());
            assertEquals(CORE_TABLES, createdTables,
                    "Every mapped core table must produce PostgreSQL DDL");
            assertTrue(commands.contains("create schema fresherprep"),
                    "DDL must create the same application schema configured for Supabase");
            assertTrue(commands.stream().anyMatch(command -> command.contains(" foreign key ")),
                    "Schema generation must include the relationships between core tables");

            // Build runtime mappings as well: catches callbacks/proxies missed by metadata-only validation.
            try (var sessionFactory = metadata.buildSessionFactory()) {
                assertEquals(CORE_TABLES.size(), sessionFactory.getMetamodel().getEntities().size());
            }

            Path schema = Path.of("target", "generated-schema.sql");
            Files.createDirectories(schema.getParent());
            Files.writeString(schema, String.join(";\n\n", commands) + ";\n", StandardCharsets.UTF_8);
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }

}
