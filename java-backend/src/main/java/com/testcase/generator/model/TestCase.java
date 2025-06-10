package com.testcase.generator.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Test Case model for AI-generated test cases
 */
public class TestCase {
    private Long id;
    private String title;
    private String objective;
    private List<String> prerequisites;
    private List<String> testSteps;
    private String expectedResult;
    private String priority;
    private String status; // pending, approved, rejected
    private Long userStoryId;
    private String azureTestCaseId;
    private LocalDateTime createdAt;
    
    // Constructors
    public TestCase() {}
    
    public TestCase(String title, String objective, String expectedResult, String priority) {
        this.title = title;
        this.objective = objective;
        this.expectedResult = expectedResult;
        this.priority = priority;
        this.status = "pending";
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getObjective() { return objective; }
    public void setObjective(String objective) { this.objective = objective; }
    
    public List<String> getPrerequisites() { return prerequisites; }
    public void setPrerequisites(List<String> prerequisites) { this.prerequisites = prerequisites; }
    
    public List<String> getTestSteps() { return testSteps; }
    public void setTestSteps(List<String> testSteps) { this.testSteps = testSteps; }
    
    public String getExpectedResult() { return expectedResult; }
    public void setExpectedResult(String expectedResult) { this.expectedResult = expectedResult; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Long getUserStoryId() { return userStoryId; }
    public void setUserStoryId(Long userStoryId) { this.userStoryId = userStoryId; }
    
    public String getAzureTestCaseId() { return azureTestCaseId; }
    public void setAzureTestCaseId(String azureTestCaseId) { this.azureTestCaseId = azureTestCaseId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    @Override
    public String toString() {
        return "TestCase{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", priority='" + priority + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}