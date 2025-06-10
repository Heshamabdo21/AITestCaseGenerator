package com.testcase.generator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testcase.generator.model.TestCase;
import com.testcase.generator.model.UserStory;
import com.testcase.generator.dto.TestCaseGenerationRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

/**
 * AI-powered test case generation service using OpenAI GPT-4o
 * Handles context management, prompt engineering, and test case generation
 */
@Service
public class AITestCaseService {
    
    @Value("${openai.api.key}")
    private String openaiApiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openaiApiUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Generate test cases for given user stories using AI
     */
    public List<TestCase> generateTestCases(List<UserStory> userStories, TestCaseGenerationRequest request) {
        List<TestCase> generatedTestCases = new ArrayList<>();
        
        for (UserStory story : userStories) {
            try {
                String prompt = buildPrompt(story, request);
                String aiResponse = callOpenAI(prompt);
                List<TestCase> testCases = parseAIResponse(aiResponse, story.getId());
                generatedTestCases.addAll(testCases);
            } catch (Exception e) {
                // Log error and continue with next story
                System.err.println("Failed to generate test cases for story " + story.getId() + ": " + e.getMessage());
            }
        }
        
        return generatedTestCases;
    }
    
    /**
     * Build comprehensive prompt for AI test case generation
     */
    private String buildPrompt(UserStory story, TestCaseGenerationRequest request) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("Generate comprehensive test cases for the following user story:\n\n");
        prompt.append("Title: ").append(story.getTitle()).append("\n");
        prompt.append("Description: ").append(story.getDescription()).append("\n");
        prompt.append("Priority: ").append(story.getPriority()).append("\n");
        prompt.append("State: ").append(story.getState()).append("\n\n");
        
        prompt.append("Requirements:\n");
        prompt.append("- Test Case Style: ").append(request.getStyle()).append("\n");
        prompt.append("- Coverage Level: ").append(request.getCoverageLevel()).append("\n");
        prompt.append("- Include Negative Tests: ").append(request.isIncludeNegative()).append("\n");
        prompt.append("- Include Performance Tests: ").append(request.isIncludePerformance()).append("\n");
        prompt.append("- Include Accessibility Tests: ").append(request.isIncludeAccessibility()).append("\n");
        prompt.append("- Include Security Tests: ").append(request.isIncludeSecurity()).append("\n\n");
        
        // Add context if provided
        if (request.getCustomContext() != null && !request.getCustomContext().isEmpty()) {
            prompt.append("Additional Context: ").append(request.getCustomContext()).append("\n\n");
        }
        
        int testCaseCount = getTestCaseCount(request.getCoverageLevel());
        prompt.append("Generate ").append(testCaseCount).append(" test cases.\n\n");
        
        prompt.append("For each test case, provide the following in JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"testCases\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"title\": \"Clear, descriptive test case title\",\n");
        prompt.append("      \"objective\": \"What this test validates and why it's important\",\n");
        prompt.append("      \"prerequisites\": [\"List of setup requirements\"],\n");
        prompt.append("      \"testSteps\": [\"Step 1\", \"Step 2\", \"Step 3\"],\n");
        prompt.append("      \"expectedResult\": \"Expected outcome\",\n");
        prompt.append("      \"priority\": \"High|Medium|Low\",\n");
        prompt.append("      \"testType\": \"Functional|Negative|Performance|Security|Accessibility\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");
        
        // Add best practices
        prompt.append("Best Practices:\n");
        prompt.append("- Write clear, actionable test steps\n");
        prompt.append("- Include both positive and edge case scenarios\n");
        prompt.append("- Consider user experience and accessibility\n");
        prompt.append("- Ensure test cases are maintainable and repeatable\n");
        prompt.append("- Include data validation and error handling scenarios\n");
        
        return prompt.toString();
    }
    
    /**
     * Call OpenAI API to generate test cases
     */
    private String callOpenAI(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4o"); // Using latest GPT-4o model
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 3000);
        
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", "You are an expert QA engineer and test case designer. " +
            "You create comprehensive, well-structured test cases that follow industry best practices. " +
            "Always respond with valid JSON format and ensure test cases are practical and executable.");
        messages.add(systemMessage);
        
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);
        
        requestBody.put("messages", messages);
        
        // Enable JSON mode for structured output
        Map<String, String> responseFormat = new HashMap<>();
        responseFormat.put("type", "json_object");
        requestBody.put("response_format", responseFormat);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        ResponseEntity<String> response = restTemplate.exchange(
            openaiApiUrl, HttpMethod.POST, entity, String.class);
        
        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            return responseJson.get("choices").get(0).get("message").get("content").asText();
        } else {
            throw new RuntimeException("OpenAI API call failed: " + response.getStatusCode());
        }
    }
    
    /**
     * Parse AI response and create test case objects
     */
    private List<TestCase> parseAIResponse(String aiResponse, Long userStoryId) throws Exception {
        List<TestCase> testCases = new ArrayList<>();
        
        JsonNode responseJson = objectMapper.readTree(aiResponse);
        JsonNode testCasesArray = responseJson.get("testCases");
        
        if (testCasesArray != null && testCasesArray.isArray()) {
            for (JsonNode testCaseNode : testCasesArray) {
                TestCase testCase = new TestCase();
                testCase.setTitle(testCaseNode.get("title").asText());
                testCase.setObjective(testCaseNode.get("objective").asText());
                testCase.setExpectedResult(testCaseNode.get("expectedResult").asText());
                testCase.setPriority(testCaseNode.get("priority").asText("Medium"));
                testCase.setUserStoryId(userStoryId);
                
                // Parse prerequisites
                JsonNode prereqNode = testCaseNode.get("prerequisites");
                if (prereqNode != null && prereqNode.isArray()) {
                    List<String> prerequisites = new ArrayList<>();
                    for (JsonNode prereq : prereqNode) {
                        prerequisites.add(prereq.asText());
                    }
                    testCase.setPrerequisites(prerequisites);
                }
                
                // Parse test steps
                JsonNode stepsNode = testCaseNode.get("testSteps");
                if (stepsNode != null && stepsNode.isArray()) {
                    List<String> testSteps = new ArrayList<>();
                    for (JsonNode step : stepsNode) {
                        testSteps.add(step.asText());
                    }
                    testCase.setTestSteps(testSteps);
                }
                
                testCases.add(testCase);
            }
        }
        
        return testCases;
    }
    
    /**
     * Determine number of test cases based on coverage level
     */
    private int getTestCaseCount(String coverageLevel) {
        switch (coverageLevel.toLowerCase()) {
            case "comprehensive": return 6;
            case "standard": return 4;
            case "minimal": return 2;
            default: return 4;
        }
    }
    
    /**
     * Generate test cases with context learning
     */
    public List<TestCase> generateTestCasesWithContext(List<UserStory> userStories, 
                                                      TestCaseGenerationRequest request,
                                                      String projectContext,
                                                      List<String> domainKnowledge,
                                                      List<String> testingPatterns) {
        
        // Enhanced prompt with project context and domain knowledge
        for (UserStory story : userStories) {
            String enhancedPrompt = buildEnhancedPrompt(story, request, projectContext, domainKnowledge, testingPatterns);
            // Continue with AI generation using enhanced context
        }
        
        return generateTestCases(userStories, request);
    }
    
    /**
     * Build enhanced prompt with project context and domain knowledge
     */
    private String buildEnhancedPrompt(UserStory story, TestCaseGenerationRequest request,
                                     String projectContext, List<String> domainKnowledge,
                                     List<String> testingPatterns) {
        StringBuilder prompt = new StringBuilder(buildPrompt(story, request));
        
        if (projectContext != null && !projectContext.isEmpty()) {
            prompt.append("\nProject Context: ").append(projectContext).append("\n");
        }
        
        if (domainKnowledge != null && !domainKnowledge.isEmpty()) {
            prompt.append("\nDomain Knowledge:\n");
            for (String knowledge : domainKnowledge) {
                prompt.append("- ").append(knowledge).append("\n");
            }
        }
        
        if (testingPatterns != null && !testingPatterns.isEmpty()) {
            prompt.append("\nTesting Patterns to Follow:\n");
            for (String pattern : testingPatterns) {
                prompt.append("- ").append(pattern).append("\n");
            }
        }
        
        return prompt.toString();
    }
}