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
            "RETURN n") // Changed from n.id to n
    List<Intersection> findSafeRoutes(@Param("startId") String startId, @Param("endId") String endId);
    // Finds the physically closest intersection, safely ignoring nodes with bad data
    @Query("MATCH (n:Intersection) " +
            "WHERE n.lat IS NOT NULL AND n.lng IS NOT NULL " + // Safety check 1: Ignore missing data
            "WITH n, point({latitude: toFloat(n.lat), longitude: toFloat(n.lng)}) AS p1, point({latitude: toFloat($lat), longitude: toFloat($lng)}) AS p2 " + // Safety check 2: Force numeric format
            "ORDER BY point.distance(p1, p2) ASC LIMIT 1 " +
            "RETURN n")
    Intersection findNearestIntersection(@Param("lat") double lat, @Param("lng") double lng);
}
