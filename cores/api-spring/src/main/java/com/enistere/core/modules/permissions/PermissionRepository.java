package com.enistere.core.modules.permissions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    Optional<Permission> findByName(String name);

    @Query("SELECT DISTINCT p.name FROM User u JOIN u.roles r JOIN r.permissions p WHERE u.id = :userId")
    List<String> findPermissionNamesByUserId(@Param("userId") UUID userId);
}
