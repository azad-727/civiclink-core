package com.civiclink.auth_service.service;

import com.civiclink.auth_service.dto.LoginRequest;
import com.civiclink.auth_service.dto.RegisterRequest;
import com.civiclink.auth_service.model.Role;
import com.civiclink.auth_service.model.User;
import com.civiclink.auth_service.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    AuthService(UserRepository userRepo,PasswordEncoder encoder){
        this.passwordEncoder=encoder;
        this.userRepo=userRepo;
    }

    public User registerUser(RegisterRequest request){
        if(userRepo.existsByEmail(request.email())){
            throw new IllegalArgumentException("Email is already in use");
        }
        String hashedPassword=passwordEncoder.encode(request.password());
        User newUser=new User(request.email(),request.username(),hashedPassword, Role.CITIZEN);

        return userRepo.save(newUser);
    }

    public User authenticateUser(LoginRequest request){
        System.out.println("--- LOGIN ATTEMPT ---");
        System.out.println("1. Incoming email: [" + request.email() + "]");
        System.out.println("2. Incoming password: [" + request.password() + "]");

        User user=userRepo.findByEmail(request.email())

                .orElseThrow(()->{
                    System.out.println("-> ERROR: Email not found in the MongoDB database.");
                    return new IllegalArgumentException("Invalid email or password.");});

        System.out.println("3. User found in DB! Assigned Role: " + user.getRole());
        System.out.println("4. Stored DB Hash: " + user.getPasswordHash());

        if(!passwordEncoder.matches(request.password(),user.getPasswordHash())){
            System.out.println("-> ERROR: BCrypt rejects the password match.");
                    throw new IllegalArgumentException("Invalid email or password.");
        }
        System.out.println("-> SUCCESS: Password matches! Issuing token...");
        return user;
    }

}
