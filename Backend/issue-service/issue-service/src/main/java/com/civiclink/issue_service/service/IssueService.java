package com.civiclink.issue_service.service;

import com.civiclink.issue_service.Dto.IssueRequest;
import com.civiclink.issue_service.model.Issue;
import com.civiclink.issue_service.repository.IssueRepository;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class IssueService {
    private final IssueRepository issueRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public IssueService(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }
    public Issue createIssue(IssueRequest request,String citizenEmail) {
        Issue issue=new Issue();
        issue.setTitle(request.getTitle());
        issue.setDescriptions(request.getDescription());
        issue.setCategory(request.getCategory());
        issue.setImageUrl(request.getImageLink());
        issue.setStatus("OPEN");
        issue.setReportedBy(citizenEmail);

        GeoJsonPoint geoJsonPoint=new GeoJsonPoint(request.getLongitude(),request.getLatitude());
        issue.setLocation(geoJsonPoint);
        Issue savedIssue=issueRepository.save(issue);
        triggerAiValidation(savedIssue.getId(), savedIssue.getImageUrl());
        return savedIssue;
    }

    public List<Issue> getNearByIssues(double longitude, double latitude, double radiusInKm){
        Point centerPoint=new Point(longitude,latitude);
        Distance searchRadius=new Distance(radiusInKm, Metrics.KILOMETERS);

        return issueRepository.findByLocationNear(centerPoint,searchRadius);
    }
    public List<Map<String, Object>> getTopContributors() {
        return issueRepository.findTopContributors();
    }
    private void triggerAiValidation(String issueId, String imageUrl) {
        new Thread(() -> {
            try {
                // Pointing to your FastAPI server[cite: 9]
                String aiEngineUrl = "http://civiclink-ai:8084/api/v1/ai/validate-image";

                Map<String, String> requestPayload = new HashMap<>();
                requestPayload.put("issue_id", issueId); // Matches ValidationRequest[cite: 10]
                requestPayload.put("image_url", imageUrl); // Matches ValidationRequest[cite: 10]

                ResponseEntity<Map> response = restTemplate.postForEntity(aiEngineUrl, requestPayload, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> aiData = response.getBody();
                    boolean isValid = (boolean) aiData.get("is_valid_civic_issue"); //[cite: 10]
                    double confidence = (double) aiData.get("max_confidence"); //[cite: 10]

                    Issue issueToUpdate = issueRepository.findById(issueId).orElse(null);
                    if (issueToUpdate != null) {
                        // Convert confidence (e.g., 0.85) to a 1-10 severity score
                        issueToUpdate.setAiSeverityScore((int) (confidence * 10));

                        if (isValid) {
                            issueToUpdate.setStatus("OPEN");
                        } else {
                            issueToUpdate.setStatus("REJECTED_BY_AI");
                        }
                        issueRepository.save(issueToUpdate);
                    }
                }
            } catch (Exception e) {
                System.err.println("AI Engine unreachable: " + e.getMessage());
            }
        }).start();
    }

    public Issue updateIssuesStatus(String issueId, String newStatus){
        Issue issue=issueRepository.findById(issueId)
                .orElseThrow(()->new IllegalArgumentException("Issue not found with id: "+issueId));
        String upperStatus=newStatus.toUpperCase();
        if (!upperStatus.equals("OPEN") &&
                !upperStatus.equals("IN_PROGRESS") &&
                !upperStatus.equals("RESOLVED") &&
                !upperStatus.equals("REJECTED")) {
            throw new IllegalArgumentException("Invalid status provided");
        }
        issue.setStatus(upperStatus);
        return issueRepository.save(issue);
    }
    public Issue getIssueDetails(String issueId){
        Issue request=issueRepository.findById(issueId)
                .orElseThrow(()->new IllegalArgumentException("Issue not found"));
        return request;
    }
    public List<Issue> getUserReportedIssues(String emailId){
        List<Issue> issues=issueRepository.findByReportedBy(emailId);
        return issues;
    }

    public Issue verifyIssue(String issueId, String userEmail) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found with id: " + issueId));

        if (issue.getVerifiedByUsers().contains(userEmail)) {
            throw new IllegalStateException("You have already verified this issue");
        }

        issue.getVerifiedByUsers().add(userEmail);
        issue.setVerificationCount(issue.getVerifiedByUsers().size());
        return issueRepository.save(issue);
    }

}