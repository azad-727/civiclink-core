package com.civiclink.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TokenRefreshRequest(@JsonProperty("refreshToken") String refreshToken) { }
