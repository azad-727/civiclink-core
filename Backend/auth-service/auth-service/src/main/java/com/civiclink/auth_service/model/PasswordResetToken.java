package com.civiclink.auth_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.Instant;

@Document(collection = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    private String id;
    private String email;
    private String otp;
    private Instant expiresAt;
    private boolean used;

    public PasswordResetToken() {}

    public PasswordResetToken(String email, String otp, Instant expiresAt) {
        this.email = email;
        this.otp = otp;
        this.expiresAt = expiresAt;
        this.used = false;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
}
