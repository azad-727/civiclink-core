package com.civiclink.routing_service;

import com.civiclink.routing_service.Model.Intersection;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoutingRepository extends Neo4jRepository<Intersection,String> {
    @Query("MATCH p = (start:Intersection {id: $startId})-[:CONNECTED_TO*1..10]-(end:Intersection {id: $endId}) " +
            "WHERE NONE(r IN relationships(p) WHERE r.hasPothole = true) " +
            "WITH p ORDER BY length(p) ASC LIMIT 1 " +
            "UNWIND nodes(p) AS n " +
            "RETURN n.id")
    List<String> findSafeRoutes(@Param("startId") String startId,@Param("endId") String endId);
}
