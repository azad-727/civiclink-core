package com.civiclink.routing_service.Model;

import org.springframework.data.annotation.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node
public class Intersection {

    @Id
    private String id;

    private String name;
    private double lat;
    private double lng;

    public Intersection(){}
    public String getId(){
        return id;
    }
    public void setId(String id){
        this.id=id;
    }
}
