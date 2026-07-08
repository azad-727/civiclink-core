package com.civiclink.auth_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthServiceApplication {

	public static void main(String[] args) {

        System.out.println("DEBUG MONGO_URI = " + System.getenv("MONGO_URI"));
        SpringApplication.run(AuthServiceApplication.class, args);
	}

}