package com.fesherprep.fesherprep_api.practice.service;

import com.fesherprep.fesherprep_api.practice.dto.SqlResultTableResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;
import java.util.regex.Pattern;

@Component
public class SqlPracticeExecutionEngine {
    private static final String URL =
            "jdbc:h2:mem:fresherprep_sql_practice;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE";
    private static final String ADMIN_URL = URL + ";DB_CLOSE_DELAY=-1";
    private static final String READER = "practice_reader";
    private static final int MAX_ROWS = 100;
    private static final Pattern START = Pattern.compile("(?is)^\\s*select\\b");
    private static final Pattern FORBIDDEN = Pattern.compile(
            "(?is)(--|/\\*|\\*/|;\\s*\\S|\\b(insert|update|delete|merge|drop|alter|create|truncate|grant|revoke|call|execute|runSCRIPT|script|shutdown|backup|file_read|csvread|csvwrite|link_schema)\\b|information_schema|pg_catalog|sys\\.)");
    private static final Pattern TABLE_REFERENCE = Pattern.compile(
            "(?is)\\b(?:from|join)\\s+([a-zA-Z_][a-zA-Z0-9_]*)");
    private static final Set<String> TABLES = Set.of("departments", "employees", "customers", "customer_orders");

    private final String readerPassword = UUID.randomUUID().toString();

    @PostConstruct
    void initialize() {
        try {
            Class.forName("org.h2.Driver");
            try (Connection connection = DriverManager.getConnection(ADMIN_URL, "sa", "");
                 Statement statement = connection.createStatement()) {
                String script = new ClassPathResource("sql-practice-dataset.sql")
                        .getContentAsString(StandardCharsets.UTF_8);
                for (String sql : script.split(";")) {
                    if (!sql.isBlank()) statement.execute(sql);
                }
                statement.execute("CREATE USER IF NOT EXISTS " + READER + " PASSWORD '" + readerPassword + "'");
                for (String table : TABLES) statement.execute("GRANT SELECT ON " + table + " TO " + READER);
            }
        } catch (Exception exception) {
            throw new IllegalStateException("Could not initialize the isolated SQL practice sandbox", exception);
        }
    }

    public Comparison executeAndCompare(String userQuery, String referenceQuery) {
        String safeQuery = validate(userQuery);
        try (Connection connection = DriverManager.getConnection(URL, READER, readerPassword)) {
            connection.setReadOnly(true);
            SqlResultTableResponse actual = run(connection, safeQuery);
            SqlResultTableResponse expected = run(connection, validate(referenceQuery));
            return new Comparison(actual.equals(expected), actual, null);
        } catch (SQLException exception) {
            String message = Optional.ofNullable(exception.getMessage()).orElse("Invalid SQL");
            int details = message.indexOf('[');
            return new Comparison(false, null,
                    "Query could not run: " + (details > 0 ? message.substring(0, details).strip() : message));
        }
    }

    private static String validate(String query) {
        String normalized = Objects.requireNonNull(query, "Query is required").strip();
        if (normalized.length() > 2000) throw new IllegalArgumentException("SQL query is too long");
        if (!START.matcher(normalized).find()) {
            throw new IllegalArgumentException("Only a single SELECT statement is allowed");
        }
        if (FORBIDDEN.matcher(normalized).find()) {
            throw new IllegalArgumentException("The query contains a blocked SQL operation");
        }
        String withoutTrailingSemicolon = normalized.endsWith(";")
                ? normalized.substring(0, normalized.length() - 1).strip() : normalized;
        var references = TABLE_REFERENCE.matcher(withoutTrailingSemicolon);
        while (references.find()) {
            if (!TABLES.contains(references.group(1).toLowerCase(Locale.ROOT))) {
                throw new IllegalArgumentException("Only the practice dataset tables may be queried");
            }
        }
        return withoutTrailingSemicolon;
    }

    private static SqlResultTableResponse run(Connection connection, String sql) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(2);
            statement.setMaxRows(MAX_ROWS);
            try (ResultSet resultSet = statement.executeQuery(sql)) {
                ResultSetMetaData metadata = resultSet.getMetaData();
                List<String> columns = new ArrayList<>();
                for (int index = 1; index <= metadata.getColumnCount(); index++) {
                    columns.add(metadata.getColumnLabel(index).toLowerCase(Locale.ROOT));
                }
                List<List<String>> rows = new ArrayList<>();
                while (resultSet.next()) {
                    List<String> row = new ArrayList<>();
                    for (int index = 1; index <= metadata.getColumnCount(); index++) {
                        Object value = resultSet.getObject(index);
                        row.add(normalize(value));
                    }
                    rows.add(List.copyOf(row));
                }
                return new SqlResultTableResponse(List.copyOf(columns), List.copyOf(rows));
            }
        }
    }

    private static String normalize(Object value) {
        if (value == null) return "NULL";
        if (value instanceof BigDecimal decimal) return decimal.stripTrailingZeros().toPlainString();
        return value.toString();
    }

    public record Comparison(boolean correct, SqlResultTableResponse result, String error) {
    }
}
