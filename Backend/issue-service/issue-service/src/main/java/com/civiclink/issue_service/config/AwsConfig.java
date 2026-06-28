package com.civiclink.issue_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class AwsConfig {
    @Bean
    public S3Presigner s3Presigner(){
         return S3Presigner.builder()
                 .credentialsProvider(DefaultCredentialsProvider.create())
                 .region(Region.AP_SOUTH_1)
                 .build();
    }
}
