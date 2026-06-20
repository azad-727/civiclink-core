package com.civiclink.auth_service.dto;

public record RegisterRequest(
    String email,
    String username,
    String password
){}
