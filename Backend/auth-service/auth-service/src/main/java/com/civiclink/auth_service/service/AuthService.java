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
        User user=userRepo.findByEmail(request.email())
                .orElseThrow(()-> new IllegalArgumentException("Invalid email or password."));

        if(!passwordEncoder.matches(request.password(),user.getPasswordHash())){
                    throw new IllegalArgumentException("Invalid email or password.");
        }
        return user;
    }

}
