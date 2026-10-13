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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.Random;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JavaMailSender mailSender;

    @Value("${resend.api.key:${RESEND_API_KEY:}}")
    private String resendApiKey;

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

        // Deliver email via Resend (HTTPS 443) or SMTP fallback
        sendOtpEmail(email, otp);
    }

    private void sendOtpEmail(String email, String otp) {
        log.info("==================================================");
        log.info("🔑 [CIVICLINK OTP] Generated OTP for {}: {}", email, otp);
        log.info("==================================================");

        // 1. Prefer Resend HTTP API (Port 443 HTTPS - never blocked by Render Free Tier)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            try {
                sendViaResend(resendApiKey.trim(), email, otp);
                return;
            } catch (Exception e) {
                log.error("Failed to send email via Resend API: {}", e.getMessage());
            }
        }

        // 2. Fallback to JavaMailSender SMTP (works locally or on unblocked hosts)
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("CivicLink — Password Reset OTP");
            message.setText("Your CivicLink password reset OTP is: " + otp
                    + "\n\nThis code expires in 15 minutes."
                    + "\n\nIf you did not request this, please ignore this email.");
            mailSender.send(message);
            log.info("✅ SMTP email sent successfully to {}", email);
        } catch (Exception e) {
            log.warn("⚠️ SMTP failed (Render free tier blocks SMTP ports 25/465/587). Error: {}", e.getMessage());
            throw new RuntimeException("Email delivery failed. Please configure RESEND_API_KEY in Render environment settings.");
        }
    }

    private void sendViaResend(String apiKey, String toEmail, String otp) throws Exception {
        String jsonPayload = String.format("""
            {
              "from": "CivicLink <onboarding@resend.dev>",
              "to": ["%s"],
              "subject": "CivicLink — Password Reset OTP",
              "html": "<div style=\\"font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;\\"><h2 style=\\"color: #1e293b;\\">CivicLink Password Reset</h2><p style=\\"color: #475569;\\">You requested a password reset. Use the following 6-digit OTP code:</p><div style=\\"font-size: 2rem; font-weight: bold; letter-spacing: 0.3em; text-align: center; color: #3b82f6; margin: 24px 0; padding: 12px; background: #f8fafc; border-radius: 6px;\\">%s</div><p style=\\"color: #64748b; font-size: 0.875rem;\\">This code expires in 15 minutes. If you did not request this, please ignore this email.</p></div>"
            }
            """, toEmail, otp);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("✅ Resend email delivered successfully to {}", toEmail);
        } else {
            log.error("❌ Resend API error (HTTP {}): {}", response.statusCode(), response.body());
            throw new RuntimeException("Resend API failed: " + response.body());
        }
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
