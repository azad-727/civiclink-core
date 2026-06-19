package com.civiclink.auth_service.model;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.UUID;

@Document(collection="users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String username;
    private String passwordHash;
    private Role role;
    private Instant createdAt;

    public User(){}

    public User(String email,String username,String passwordHash, Role role){
        this.id="USR-" + UUID.randomUUID().toString();
        this.email=email;
        this.username=username;
        this.passwordHash=passwordHash;
        this.role=role;
        this.createdAt=Instant.now();
    }
    public String getId() { return id;}
    public String getEmail(){return email;}
    public String getUsername(){return username;}
    public String getPasswordHash(){return passwordHash;}
    public Role getRole(){return role;}
    public Instant getCreatedAt(){ return createdAt;}



}
