package com.civiclink.auth_service.service;

import com.civiclink.auth_service.dto.LoginRequest;
import com.civiclink.auth_service.dto.RegisterRequest;
import com.civiclink.auth_service.model.PasswordResetToken;
import com.civiclink.auth_service.model.Role;
import com.civiclink.auth_service.model.User;
import com.civiclink.auth_service.repository.PasswordResetTokenRepository;
import com.civiclink.auth_service.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Random;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JavaMailSender mailSender;

    AuthService(UserRepository userRepo, PasswordEncoder encoder,
                PasswordResetTokenRepository passwordResetTokenRepository,
                JavaMailSender mailSender) {
        this.passwordEncoder = encoder;
        this.userRepo = userRepo;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.mailSender = mailSender;
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

    public void initiatePasswordReset(String email) {
        // Check user exists
        userRepo.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));

        // Delete any existing token for this email
        passwordResetTokenRepository.deleteByEmail(email);

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        Instant expiresAt = Instant.now().plusSeconds(900); // 15 minutes

        // Save to MongoDB
        passwordResetTokenRepository.save(new PasswordResetToken(email, otp, expiresAt));

        // Send email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("CivicLink — Password Reset OTP");
        message.setText("Your CivicLink password reset OTP is: " + otp
                + "\n\nThis code expires in 15 minutes."
                + "\n\nIf you did not request this, please ignore this email.");
        mailSender.send(message);
    }

    public void resetPassword(String email, String otp, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository
            .findByEmailAndOtpAndUsedFalse(email, otp)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP."));

        if (Instant.now().isAfter(token.getExpiresAt())) {
            passwordResetTokenRepository.delete(token);
            throw new IllegalArgumentException("OTP has expired. Please request a new one.");
        }

        // Update the user's password
        User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        // Delete the used token
        passwordResetTokenRepository.delete(token);
    }
}
