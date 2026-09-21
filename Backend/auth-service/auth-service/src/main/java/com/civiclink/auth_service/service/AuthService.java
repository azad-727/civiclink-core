package com.civiclink.auth_service.service;

import com.civiclink.auth_service.dto.LoginRequest;
import com.civiclink.auth_service.dto.RegisterRequest;
import com.civiclink.auth_service.model.Role;
import com.civiclink.auth_service.model.User;
import com.civiclink.auth_service.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    AuthService(UserRepository userRepo, PasswordEncoder encoder) {
        this.passwordEncoder = encoder;
        this.userRepo = userRepo;
    }

    public User registerUser(RegisterRequest request) {
        if (userRepo.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already in use");
        }
        String hashedPassword = passwordEncoder.encode(request.password());
        User newUser = new User(request.email(), request.username(), hashedPassword, Role.CITIZEN);
        return userRepo.save(newUser);
    }

    public User authenticateUser(LoginRequest request) {
        log.info("Login attempt for email: {}", request.email());

        User user = userRepo.findByEmail(request.email())
                .orElseThrow(() -> {
                    log.warn("Login failed: email not found — {}", request.email());
                    return new IllegalArgumentException("Invalid email or password.");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Login failed: password mismatch for email — {}", request.email());
            throw new IllegalArgumentException("Invalid email or password.");
        }

        log.info("Login successful for email: {}", request.email());
        return user;
    }
}
