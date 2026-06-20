package com.civiclink.auth_service.controller;

import com.civiclink.auth_service.dto.AuthResponse;
import com.civiclink.auth_service.dto.LoginRequest;
import com.civiclink.auth_service.dto.RegisterRequest;
import com.civiclink.auth_service.model.User;
import com.civiclink.auth_service.security.JwtUtil;
import com.civiclink.auth_service.service.AuthService;
import io.jsonwebtoken.Jwt;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    public AuthController(AuthService authService, JwtUtil jwtUtil){
        this.authService=authService;
        this.jwtUtil=jwtUtil;
    }
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request){
        try{
            authService.registerUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
        }catch (IllegalArgumentException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());

        }
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // 1. Verify credentials via the Service
            User user = authService.authenticateUser(request);

            // 2. Generate the JWT
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

            // 3. Return the token and user data to the React frontend
            return ResponseEntity.ok(new AuthResponse(
                    token,
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name()
            ));
        } catch (IllegalArgumentException e) {
            // If the password or email is wrong, return a 401 Unauthorized
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

}
