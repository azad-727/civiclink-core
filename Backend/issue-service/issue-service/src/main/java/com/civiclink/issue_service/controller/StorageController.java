package com.civiclink.issue_service.controller;

import com.civiclink.issue_service.service.S3Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/issues/storage")
public class StorageController {

    private final S3Service s3Service;

    public StorageController(S3Service s3Service){
        this.s3Service=s3Service;
    }
    @GetMapping("/presigned-url")
    public ResponseEntity<Map<String,String>> getPresignedUrl(@RequestParam String filename){
        String uploadUrl=s3Service.generatePresignedUploadUrl(filename);

        return ResponseEntity.ok(Map.of("presignedUrl",uploadUrl));
    }
}
