package com.civiclink.issue_service.controller;

import com.civiclink.issue_service.Dto.IssueRequest;
import com.civiclink.issue_service.model.Issue;
import com.civiclink.issue_service.service.IssueService;
import jakarta.validation.Valid;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/issues")
public class IssueController {

    private IssueService issueService;
    public IssueController(IssueService issueService){
        this.issueService=issueService;
    }
    @PostMapping()
    public ResponseEntity<Issue> reportIssue(@Valid @RequestBody IssueRequest request,@RequestHeader("X-User-Email") String userEmailId){
        Issue issue=issueService.createIssue(request,userEmailId);
        return ResponseEntity.ok(issue);
    }
    @PatchMapping("/{issueId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable("issueId") String id, @RequestParam("status") String status,
                                          @RequestHeader("X-User-Role") String userRole){
        if(!"ADMIN".equalsIgnoreCase(userRole)){
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admin can update issue status");
        }
        try{
            Issue updatedIssue=issueService.updateIssuesStatus(id,status);
            return ResponseEntity.ok(updatedIssue);
        }catch(Exception e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/nearby")
    public ResponseEntity<List<Issue>> getNearbyIssues(@RequestParam double longitude,
                                                       @RequestParam double latitude,
                                                       @RequestParam(defaultValue = "5.0") double radius )
    {
        List<Issue> issues=issueService.getNearByIssues(longitude,latitude,radius);
        return ResponseEntity.ok(issues);

    }

}
