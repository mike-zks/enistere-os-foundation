package com.enistere.core.modules.roles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(String name);

    @Query(value = """
        SELECT r.name
        FROM roles r
        JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = :userId
        ORDER BY r.name
        """, nativeQuery = true)
    List<String> findNamesByUserId(@Param("userId") UUID userId);

    @Query(value = """
        SELECT EXISTS (
            SELECT 1
            FROM roles r
            JOIN user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id = :userId AND r.name = :name
        )
        """, nativeQuery = true)
    boolean existsByUserIdAndName(@Param("userId") UUID userId, @Param("name") String name);
}
