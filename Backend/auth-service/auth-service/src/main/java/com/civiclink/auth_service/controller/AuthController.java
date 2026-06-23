package com.civiclink.auth_service.controller;

import com.civiclink.auth_service.dto.AuthResponse;
import com.civiclink.auth_service.dto.LoginRequest;
import com.civiclink.auth_service.dto.RegisterRequest;
import com.civiclink.auth_service.dto.TokenRefreshRequest;
import com.civiclink.auth_service.model.RefreshToken;
import com.civiclink.auth_service.model.User;
import com.civiclink.auth_service.repository.UserRepository;
import com.civiclink.auth_service.security.JwtUtil;
import com.civiclink.auth_service.service.AuthService;
import com.civiclink.auth_service.service.RefreshTokenService;
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
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, JwtUtil jwtUtil, RefreshTokenService refreshTokenService, UserRepository userRepository){
        this.authService=authService;
        this.jwtUtil=jwtUtil;
        this.refreshTokenService=refreshTokenService;
        this.userRepository=userRepository;
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

            RefreshToken refreshToken=refreshTokenService.createRefreshToken(user.getId());
            // 3. Return the token and user data to the React frontend
            return ResponseEntity.ok(new AuthResponse(
                    token,
                    refreshToken.getToken(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name()
            ));
        } catch (IllegalArgumentException e) {
            // If the password or email is wrong, return a 401 Unauthorized
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRefreshRequest request) {
        try {
            RefreshToken refreshToken = refreshTokenService.findByToken(request.refreshToken())
                    .orElseThrow(() -> new IllegalArgumentException("Refresh token not found."));

            refreshTokenService.verifyExpiration(refreshToken);

            // Using our custom MongoDB literal query override
            User user = userRepository.findByCustomId(refreshToken.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User associated with token no longer exists."));

            String newToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

            return ResponseEntity.ok(new AuthResponse(
                    newToken,
                    refreshToken.getToken(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Session Error: " + e.getMessage());
        }
    }
}
