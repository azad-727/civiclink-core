package com.civiclink.issue_service.repository;

import com.civiclink.issue_service.model.Issue;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.repository.MongoRepository;

import javax.xml.stream.Location;
import java.util.List;

public interface IssueRepository extends MongoRepository<Issue,String> {

    List<Issue> findByLocationNear(Point point, Distance distance);

    List<Issue> findByReportedBy(String userId);
}
