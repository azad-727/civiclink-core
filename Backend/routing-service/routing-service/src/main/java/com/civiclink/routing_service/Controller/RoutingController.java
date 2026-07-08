package com.civiclink.routing_service.Controller;

import com.civiclink.routing_service.Model.Intersection;
import com.civiclink.routing_service.RoutingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/routing")
public  class RoutingController {

    public  final RoutingRepository routingRepository;

    public RoutingController(RoutingRepository routingRepository){
        this.routingRepository = routingRepository;
    }

    @GetMapping("/safe-path")
    public ResponseEntity<?> getSafeRoute(@RequestParam String startId,@RequestParam String endId){
        List<Intersection> safePath= routingRepository.findSafeRoutes(startId,endId);
        if(safePath==null || safePath.isEmpty()){
               return ResponseEntity.badRequest().body("No safe path found between the given intersections.");
        }
        return ResponseEntity.ok(safePath);
    }
    @GetMapping("/nearest")
    public ResponseEntity<?> getNearestIntersection(@RequestParam double lat, @RequestParam double lng){
        Intersection nearest = routingRepository.findNearestIntersection(lat, lng);
        if(nearest == null){
            return ResponseEntity.badRequest().body("No intersections found in the database.");
        }
        return ResponseEntity.ok(nearest);
    }
}
