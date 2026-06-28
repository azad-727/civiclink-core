package com.civiclink.issue_service.Dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueRequest {

    @NotBlank(message = "Title is required cannot be Empty")
    private String title;
    @NotBlank(message = "Description is required cannot be Empty")
    private String description;
    @NotBlank(message = "Category is required cannot be Empty")
    private String category;
    @NotNull(message = "Latitude cannot be Empty")
    private Double latitude;
    @NotNull(message = "Longitude cannot be Empty")
    private Double longitude;
    @NotBlank(message="Image Link cannot be Empty")
    private String imageLink;


}
