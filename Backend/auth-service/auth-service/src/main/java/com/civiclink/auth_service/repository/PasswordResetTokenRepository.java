package com.civiclink.auth_service.repository;

import com.civiclink.auth_service.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByEmailAndOtpAndUsedFalse(String email, String otp);
    void deleteByEmail(String email);
}
