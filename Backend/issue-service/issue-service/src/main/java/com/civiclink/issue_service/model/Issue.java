package com.civiclink.issue_service.model;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Data
@Document(collection = "issues")
public class Issue {
    @Id
    private String id;

    private String title;
    private String descriptions;
    private String category;
    private String status;

    private String imageUrl;

    private String reportedBy;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;
    private int aiSeverityScore = 0; // Scale 1-10 (e.g., 9 = Massive Sinkhole)
    private String aiAnalysisNotes;
    private int verificationCount = 0;
    private Set<String> verifiedByUsers = new HashSet<>();
    private Instant createdAt = Instant.now();


}
