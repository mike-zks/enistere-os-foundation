package com.enistere.core.modules.permissions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    Optional<Permission> findByName(String name);

    @Query(value = """
        SELECT DISTINCT p.name
        FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = :userId
        ORDER BY p.name
        """, nativeQuery = true)
    List<String> findNamesByUserId(@Param("userId") UUID userId);

    @Query(value = """
        SELECT EXISTS (
            SELECT 1
            FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            JOIN user_roles ur ON ur.role_id = rp.role_id
            WHERE ur.user_id = :userId AND p.name = :name
        )
        """, nativeQuery = true)
    boolean existsByUserIdAndName(@Param("userId") UUID userId, @Param("name") String name);
}
