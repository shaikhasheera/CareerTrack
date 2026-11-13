
package com.careertrack.controller;

import com.careertrack.entity.JobApplication;
import com.careertrack.entity.User;
import com.careertrack.repository.JobApplicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://localhost:5173")
public class JobApplicationController {

    private final JobApplicationRepository repository;

    public JobApplicationController(JobApplicationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<JobApplication> getAllApplications(
            @AuthenticationPrincipal User user) {

        return repository.findByUserId(user.getId());
    }

    @PostMapping
    public JobApplication addApplication(
            @RequestBody JobApplication application,
            @AuthenticationPrincipal User user) {

        application.setId(null);
        application.setUserId(user.getId());

        return repository.save(application);
    }

    @PutMapping("/{id}")
    public JobApplication updateApplication(
            @PathVariable Long id,
            @RequestBody JobApplication updatedApplication,
            @AuthenticationPrincipal User user) {

        JobApplication existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Application not found"));

        if (!existing.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Unauthorized access");
        }

        existing.setCompanyName(updatedApplication.getCompanyName());
        existing.setJobRole(updatedApplication.getJobRole());
        existing.setLocation(updatedApplication.getLocation());
        existing.setStatus(updatedApplication.getStatus());
        existing.setAppliedDate(updatedApplication.getAppliedDate());

        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    public String deleteApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        JobApplication existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Application not found"));

        if (!existing.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Unauthorized access");
        }

        repository.delete(existing);

        return "Application deleted successfully";
    }
}
