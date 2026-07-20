package com.civiclink.issue_service.repository;

import com.civiclink.issue_service.model.Issue;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;

import javax.xml.stream.Location;
import java.util.List;
import java.util.Map;

public interface IssueRepository extends MongoRepository<Issue,String> {

    List<Issue> findByLocationNear(Point point, Distance distance);

    List<Issue> findByReportedBy(String userId);
    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$reportedBy', 'count': { '$sum': 1 } } }",
            "{ '$sort': { 'count': -1 } }",
            "{ '$limit': 5 }",
            "{ '$project': { 'email': '$_id', 'count': 1, '_id': 0 } }"
    })
    List<Map<String, Object>> findTopContributors();

    List<Issue> findAllByOrderByCreatedAtDesc();
    List<Issue> findByStatusOrderByCreatedAtDesc(String status);
    List<Issue> findByCategoryOrderByCreatedAtDesc(String category);
    List<Issue> findByStatusAndCategoryOrderByCreatedAtDesc(String status, String category);

    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$status', 'count': { '$sum': 1 } } }",
            "{ '$project': { 'status': '$_id', 'count': 1, '_id': 0 } }"
    })
    List<Map<String, Object>> countIssuesByStatus();

    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$category', 'count': { '$sum': 1 } } }",
            "{ '$project': { 'category': '$_id', 'count': 1, '_id': 0 } }"
    })
    List<Map<String, Object>> countIssuesByCategory();


}

