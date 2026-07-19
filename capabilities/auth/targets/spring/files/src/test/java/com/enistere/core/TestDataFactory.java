package com.enistere.core;

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
    private final PasswordEncoder passwordEncoder;

    public TestDataFactory(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String uniqueEmail() {
        return "test-" + UUID.randomUUID().toString().substring(0, 8) + "@enistere.test";
    }

    @Transactional
    public User createUser(String email, String rawPassword) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        return userRepository.save(u);
    }

}
