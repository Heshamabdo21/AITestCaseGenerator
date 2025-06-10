package com.testcase.generator.dto;

import java.util.List;

/**
 * Request DTO for test case generation with AI
 */
public class TestCaseGenerationRequest {
    private List<Long> userStoryIds;
    private String style = "step-by-step"; // gherkin, step-by-step, scenario-based
    private String coverageLevel = "standard"; // comprehensive, standard, minimal
    private boolean includeNegative = true;
    private boolean includePerformance = false;
    private boolean includeAccessibility = false;
    private boolean includeSecurity = false;
    private String targetTestPlan;
    private String targetTestSuite;
    private String customContext;
    
    // Constructors
    public TestCaseGenerationRequest() {}
    
    public TestCaseGenerationRequest(List<Long> userStoryIds) {
        this.userStoryIds = userStoryIds;
    }
    
    // Getters and setters
    public List<Long> getUserStoryIds() { return userStoryIds; }
    public void setUserStoryIds(List<Long> userStoryIds) { this.userStoryIds = userStoryIds; }
    
    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }
    
    public String getCoverageLevel() { return coverageLevel; }
    public void setCoverageLevel(String coverageLevel) { this.coverageLevel = coverageLevel; }
    
    public boolean isIncludeNegative() { return includeNegative; }
    public void setIncludeNegative(boolean includeNegative) { this.includeNegative = includeNegative; }
    
    public boolean isIncludePerformance() { return includePerformance; }
    public void setIncludePerformance(boolean includePerformance) { this.includePerformance = includePerformance; }
    
    public boolean isIncludeAccessibility() { return includeAccessibility; }
    public void setIncludeAccessibility(boolean includeAccessibility) { this.includeAccessibility = includeAccessibility; }
    
    public boolean isIncludeSecurity() { return includeSecurity; }
    public void setIncludeSecurity(boolean includeSecurity) { this.includeSecurity = includeSecurity; }
    
    public String getTargetTestPlan() { return targetTestPlan; }
    public void setTargetTestPlan(String targetTestPlan) { this.targetTestPlan = targetTestPlan; }
    
    public String getTargetTestSuite() { return targetTestSuite; }
    public void setTargetTestSuite(String targetTestSuite) { this.targetTestSuite = targetTestSuite; }
    
    public String getCustomContext() { return customContext; }
    public void setCustomContext(String customContext) { this.customContext = customContext; }
}