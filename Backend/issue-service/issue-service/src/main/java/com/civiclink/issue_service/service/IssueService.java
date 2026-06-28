package com.civiclink.issue_service.service;

import com.civiclink.issue_service.Dto.IssueRequest;
import com.civiclink.issue_service.model.Issue;
import com.civiclink.issue_service.repository.IssueRepository;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IssueService {
    private final IssueRepository issueRepository;

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
        return issueRepository.save(issue);
    }
    public List<Issue> getNearByIssues(double longitude, double latitude, double radiusInKm){
        Point centerPoint=new Point(longitude,latitude);
        Distance searchRadius=new Distance(radiusInKm, Metrics.KILOMETERS);

        return issueRepository.findByLocationNear(centerPoint,searchRadius);
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

}
