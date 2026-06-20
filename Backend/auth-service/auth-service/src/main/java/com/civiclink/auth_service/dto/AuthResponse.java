package com.civiclink.auth_service.dto;

public record AuthResponse(
        String token,
        String username,
        String email,
        String role
) {}
