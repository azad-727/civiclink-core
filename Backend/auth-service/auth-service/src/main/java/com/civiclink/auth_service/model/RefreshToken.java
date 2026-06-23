package com.civiclink.auth_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "refresh_tokens")
public class RefreshToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    private String userId;

    private Instant expiryDate;

    public RefreshToken(){}

    public void setId(String id) {this.id = id;}

    public String getId(){ return id;}

    public String getToken() {return token;}

    public void setToken(String token) {this.token = token;}

    public String getUserId() {return userId;}

    public void setUserId(String userId) {this.userId = userId;}

    public Instant getExpiryDate() {return expiryDate;}

    public void setExpiryDate(Instant expiryDate) {this.expiryDate = expiryDate;}




}
