package com.enistere.core;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

class FlywayMigrationTest extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void migrations_applied_usersTableExists() {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'users'",
            Integer.class
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void migrations_applied_allTablesExist() {
        String[] expectedTables = {"users", "roles", "permissions", "user_roles", "role_permissions", "refresh_tokens"};
        for (String table : expectedTables) {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?",
                Integer.class, table
            );
            assertThat(count).as("Table '%s' should exist", table).isEqualTo(1);
        }
    }

    @Test
    void migrations_applied_usersEmailIndexExists() {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_email'",
            Integer.class
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void migrations_applied_refreshTokensHashIndexExists() {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'refresh_tokens' AND indexname = 'idx_refresh_tokens_token_hash'",
            Integer.class
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void migrations_applied_storedFilesTableExists() {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'stored_files'",
            Integer.class
        );
        assertThat(count).as("Table 'stored_files' should exist after V2 migration").isEqualTo(1);
    }

    @Test
    void migrations_applied_storedFilesColumnsExist() {
        String[] expectedColumns = {
            "id", "original_name", "storage_key", "bucket", "mime_type",
            "extension", "size", "category", "status", "owner_id", "subject_id",
            "created_at", "updated_at"
        };
        for (String column : expectedColumns) {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'stored_files' AND column_name = ?",
                Integer.class, column
            );
            assertThat(count).as("Column 'stored_files.%s' should exist", column).isEqualTo(1);
        }
    }

    @Test
    void migrations_applied_storedFilesIndexesExist() {
        String[] expectedIndexes = {
            "idx_stored_files_owner_id", "idx_stored_files_category", "idx_stored_files_status"
        };
        for (String index : expectedIndexes) {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'stored_files' AND indexname = ?",
                Integer.class, index
            );
            assertThat(count).as("Index '%s' should exist", index).isEqualTo(1);
        }
    }
}
