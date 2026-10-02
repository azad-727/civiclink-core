package com.civiclink.auth_service.dto;
public record ResetPasswordRequest(String email, String otp, String newPassword) {}
