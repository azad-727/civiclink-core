package com.civiclink.auth_service.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {

        // We wrap your message in a JSON object: { "message": "Email is already in use" }
        Map<String, String> errorResponse = Map.of("message", ex.getMessage());

        // Return a 400 Bad Request with the JSON body
        return ResponseEntity.badRequest().body(errorResponse);
    }
}
