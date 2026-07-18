package com.enistere.core;

import com.enistere.core.modules.permissions.Permission;
import com.enistere.core.modules.permissions.PermissionRepository;
import com.enistere.core.modules.roles.Role;
import com.enistere.core.modules.roles.RoleRepository;
import com.enistere.core.modules.users.User;
import com.enistere.core.modules.users.UserRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@Profile("test")
public class TestDataFactory {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    public TestDataFactory(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String uniqueEmail() {
        return "test-" + UUID.randomUUID().toString().substring(0, 8) + "@enistere.test";
    }

    @Transactional
    public Permission createPermission(String name) {
        Permission p = new Permission();
        p.setName(name + "-" + UUID.randomUUID().toString().substring(0, 6));
        return permissionRepository.save(p);
    }

    @Transactional
    public Permission createPermissionExact(String name) {
        return permissionRepository.findByName(name).orElseGet(() -> {
            Permission p = new Permission();
            p.setName(name);
            return permissionRepository.save(p);
        });
    }

    @Transactional
    public Role createRole(String name) {
        Role r = new Role();
        r.setName(name + "-" + UUID.randomUUID().toString().substring(0, 6));
        return roleRepository.save(r);
    }

    @Transactional
    public Role createRoleWithPermission(String roleName, Permission permission) {
        Role r = createRole(roleName);
        r.getPermissions().add(permission);
        return roleRepository.save(r);
    }

    @Transactional
    public User createUser(String email, String rawPassword) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        return userRepository.save(u);
    }

    @Transactional
    public User createUserWithRole(String email, String rawPassword, Role role) {
        User u = createUser(email, rawPassword);
        u.getRoles().add(role);
        return userRepository.save(u);
    }
}
