package com.enistere.core.modules.files;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;

/**
 * Grants Files permissions to a test user.
 *
 * <p>The capability declares the permission names it guards with; provisioning
 * them is an operational concern, exactly as on the NestJS side — no migration
 * seeds {@code files.*}, so a test that wants a permission must create it. That
 * is also why every grant here is idempotent: tests share a database.
 */
final class FilesTestAccess {

    private FilesTestAccess() {
    }

    static void grant(JdbcTemplate jdbc, UUID userId, String... permissions) {
        String roleName = "files-test-" + userId;
        jdbc.update(
            "INSERT INTO roles (name, description) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
            roleName, "Files integration test role");
        UUID roleId = jdbc.queryForObject(
            "SELECT id FROM roles WHERE name = ?", UUID.class, roleName);
        jdbc.update(
            "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            userId, roleId);

        for (String permission : permissions) {
            jdbc.update(
                "INSERT INTO permissions (name, description) VALUES (?, ?) ON CONFLICT (name) DO NOTHING",
                permission, "Files capability permission");
            UUID permissionId = jdbc.queryForObject(
                "SELECT id FROM permissions WHERE name = ?", UUID.class, permission);
            jdbc.update(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                roleId, permissionId);
        }
    }
}
