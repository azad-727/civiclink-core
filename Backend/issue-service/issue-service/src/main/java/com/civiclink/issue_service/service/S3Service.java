package com.civiclink.issue_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;

@Service
public class S3Service {
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name}")
    private  String bucketName;

    public S3Service(S3Presigner s3Presigner){
        this.s3Presigner=s3Presigner;
    }

    public  String generatePresignedUploadUrl(String originalFileName){
        String uniqueFileName = UUID.randomUUID()+"_"+originalFileName;

        PutObjectRequest objectRequest=PutObjectRequest.builder()
                .bucket(bucketName)
                .key(uniqueFileName)
                .contentType("image/jpeg")
                .build();

        PutObjectPresignRequest presignRequest=PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5))
                .putObjectRequest(objectRequest)
                .build();
        PresignedPutObjectRequest presignedPutObjectRequest=s3Presigner.presignPutObject(presignRequest);
        return presignedPutObjectRequest.url().toString();
    }
}
