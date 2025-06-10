package com.testcase.generator.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * User Story model representing Azure DevOps work items
 */
public class UserStory {
    private Long id;
    private String azureId;
    private String title;
    private String description;
    private String state;
    private String assignedTo;
    private String priority;
    private String createdDate;
    private List<String> tags;
    private Long configId;
    
    // Constructors
    public UserStory() {}
    
    public UserStory(String azureId, String title, String description, String state) {
        this.azureId = azureId;
        this.title = title;
        this.description = description;
        this.state = state;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getAzureId() { return azureId; }
    public void setAzureId(String azureId) { this.azureId = azureId; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public String getCreatedDate() { return createdDate; }
    public void setCreatedDate(String createdDate) { this.createdDate = createdDate; }
    
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    
    public Long getConfigId() { return configId; }
    public void setConfigId(Long configId) { this.configId = configId; }
    
    @Override
    public String toString() {
        return "UserStory{" +
                "id=" + id +
                ", azureId='" + azureId + '\'' +
                ", title='" + title + '\'' +
                ", state='" + state + '\'' +
                ", priority='" + priority + '\'' +
                '}';
    }
}