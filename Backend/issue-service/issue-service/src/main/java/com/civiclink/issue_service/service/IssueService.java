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

import java.util.ArrayList;
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
    public Issue createIssue(IssueRequest request, String citizenEmail) {
        Issue issue = new Issue();
        issue.setTitle(request.getTitle());
        issue.setDescriptions(request.getDescription());
        issue.setCategory(request.getCategory());
        issue.setImageUrl(request.getImageLink());
        issue.setStatus("OPEN");
        issue.setReportedBy(citizenEmail);

        GeoJsonPoint geoJsonPoint = new GeoJsonPoint(request.getLongitude(), request.getLatitude());
        issue.setLocation(geoJsonPoint);
        Issue savedIssue = issueRepository.save(issue);
        triggerAiValidation(savedIssue.getId(), savedIssue.getImageUrl());
        return savedIssue;
    }


    public Map<String, Object> checkForDuplicates(String description, double latitude, double longitude) {
        try {
            // Fetch up to 20 nearby issues within 2km to compare against
            Point centerPoint = new Point(longitude, latitude);
            Distance searchRadius = new Distance(2.0, Metrics.KILOMETERS);
            List<Issue> nearbyIssues = issueRepository.findByLocationNear(centerPoint, searchRadius);

            // Build the payload for the AI service
            Map<String, Object> newIssuePayload = new HashMap<>();
            newIssuePayload.put("issue_id", "new-check");
            newIssuePayload.put("description", description);
            newIssuePayload.put("lat", latitude);
            newIssuePayload.put("lng", longitude);

            List<Map<String, Object>> recentIssuesList = new ArrayList<>();
            for (Issue i : nearbyIssues) {
                if (i.getDescriptions() == null || i.getDescriptions().isBlank()) continue;
                Map<String, Object> entry = new HashMap<>();
                entry.put("issue_id", i.getId());
                entry.put("description", i.getDescriptions());
                entry.put("lat", i.getLocation().getY());
                entry.put("lng", i.getLocation().getX());
                recentIssuesList.add(entry);
                if (recentIssuesList.size() >= 20) break;
            }

            // If no nearby issues to compare against, no duplicate possible
            if (recentIssuesList.isEmpty()) {
                Map<String, Object> noDuplicate = new HashMap<>();
                noDuplicate.put("is_duplicate", false);
                noDuplicate.put("potential_duplicates", new ArrayList<>());
                return noDuplicate;
            }

            Map<String, Object> aiRequestBody = new HashMap<>();
            aiRequestBody.put("new_issue", newIssuePayload);
            aiRequestBody.put("recent_issues", recentIssuesList);

            String aiUrl = "http://civiclink-ai:8084/api/v1/ai/detect-duplicate";
            ResponseEntity<Map> aiResponse = restTemplate.postForEntity(aiUrl, aiRequestBody, Map.class);

            if (aiResponse.getStatusCode().is2xxSuccessful() && aiResponse.getBody() != null) {
                return aiResponse.getBody();
            }
        } catch (Exception e) {
            System.err.println("Duplicate check AI call failed: " + e.getMessage());
        }

        // Fallback: treat as no duplicate if AI is unreachable
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("is_duplicate", false);
        fallback.put("potential_duplicates", new ArrayList<>());
        return fallback;
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
    /**
     * AMC Officer / Admin: fetch all issues, optionally filtered by status and/or category.
     * Both filters are optional; either, both, or neither may be supplied.
     */
    public List<Issue> getIssuesForAdmin(String status, String category) {
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasCategory = category != null && !category.isBlank();

        if (hasStatus && hasCategory) {
            return issueRepository.findByStatusAndCategoryOrderByCreatedAtDesc(status.toUpperCase(), category);
        } else if (hasStatus) {
            return issueRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        } else if (hasCategory) {
            return issueRepository.findByCategoryOrderByCreatedAtDesc(category);
        } else {
            return issueRepository.findAllByOrderByCreatedAtDesc();
        }
    }

    /**
     * AMC Officer / Admin: dashboard summary — total count plus breakdowns by status and category.
     */
    public Map<String, Object> getAdminStats() {
        List<Map<String, Object>> byStatus = issueRepository.countIssuesByStatus();
        List<Map<String, Object>> byCategory = issueRepository.countIssuesByCategory();

        long total = byStatus.stream()
                .mapToLong(m -> ((Number) m.getOrDefault("count", 0)).longValue())
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalIssues", total);
        stats.put("byStatus", byStatus);
        stats.put("byCategory", byCategory);
        return stats;
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