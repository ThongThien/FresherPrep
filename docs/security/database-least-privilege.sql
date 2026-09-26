-- Review and execute with the Supabase database owner/admin account.
-- Replace the password placeholder before execution. Do not commit the real password.
-- The application must use this role only with spring.jpa.hibernate.ddl-auto=validate.

CREATE ROLE fresherprep_runtime
    LOGIN
    PASSWORD '<GENERATE_AND_STORE_OUTSIDE_GIT>'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOINHERIT
    NOBYPASSRLS;

GRANT CONNECT ON DATABASE postgres TO fresherprep_runtime;
GRANT USAGE ON SCHEMA fresherprep TO fresherprep_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA fresherprep
    TO fresherprep_runtime;
GRANT USAGE, SELECT
    ON ALL SEQUENCES IN SCHEMA fresherprep
    TO fresherprep_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA fresherprep
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fresherprep_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA fresherprep
    GRANT USAGE, SELECT ON SEQUENCES TO fresherprep_runtime;

REVOKE CREATE ON SCHEMA fresherprep FROM fresherprep_runtime;

-- Verify before changing the application connection string:
-- SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls
-- FROM pg_roles WHERE rolname = 'fresherprep_runtime';
-- Expected: all four privilege flags are false.
