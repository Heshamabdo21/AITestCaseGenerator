# AI-Powered Test Case Generator - Java Backend

## Overview
This Java Spring Boot application provides AI-powered test case generation with Azure DevOps integration. It features advanced context management, feedback loops, and comprehensive test case linking.

## Architecture

```
src/main/java/com/testcase/generator/
├── config/              # Configuration classes
├── controller/          # REST API controllers
├── dto/                # Data Transfer Objects
├── model/              # Domain models
├── service/            # Business logic
└── TestCaseGeneratorApplication.java
```

## Key Features

### 1. Azure DevOps Integration
- Full REST API integration with Azure DevOps
- Work item management (User Stories, Test Cases)
- Test Plans and Test Suites support
- Automatic linking between test cases and user stories

### 2. AI-Powered Test Case Generation
- OpenAI GPT-4o integration with context management
- Multiple test case styles: Gherkin, Step-by-step, Scenario-based
- Coverage levels: Comprehensive, Standard, Minimal
- Support for various test types: Functional, Negative, Performance, Security, Accessibility

### 3. Advanced Context Management
- Project-specific context learning
- Domain knowledge integration
- Testing pattern recognition
- Custom instruction support

### 4. Feedback Loop System
- User feedback collection for test case quality
- AI model improvement through feedback analysis
- Continuous learning capabilities

## Models

### UserStory
```java
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
}
```

### TestCase
```java
public class TestCase {
    private Long id;
    private String title;
    private String objective;
    private List<String> prerequisites;
    private List<String> testSteps;
    private String expectedResult;
    private String priority;
    private String status;
    private Long userStoryId;
    private String azureTestCaseId;
    private LocalDateTime createdAt;
}
```

### TestPlan & TestSuite
Support for Azure DevOps test organization with automatic linking.

## API Endpoints

### Azure DevOps Integration
- `GET /api/projects` - Fetch available projects
- `GET /api/user-stories` - Fetch user stories from Azure DevOps
- `GET /api/test-plans` - Fetch test plans
- `GET /api/test-suites/{planId}` - Fetch test suites for a plan

### Test Case Generation
- `POST /api/test-cases/generate` - Generate test cases using AI
- `POST /api/test-cases/generate-with-context` - Generate with enhanced context
- `PUT /api/test-cases/{id}/status` - Update test case status
- `POST /api/test-cases/add-to-azure` - Add approved cases to Azure DevOps

### Feedback & Learning
- `POST /api/feedback` - Submit test case feedback
- `GET /api/feedback/analytics` - Get feedback analytics
- `POST /api/context` - Update AI context and learning data

## Configuration

### Application Properties
```properties
# OpenAI Configuration
openai.api.key=${OPENAI_API_KEY}
openai.api.url=https://api.openai.com/v1/chat/completions

# Azure DevOps Configuration
azure.devops.organization.url=${AZURE_DEVOPS_ORG_URL}
azure.devops.pat.token=${AZURE_DEVOPS_PAT}
azure.devops.project=${AZURE_DEVOPS_PROJECT}

# Database Configuration
spring.datasource.url=${DATABASE_URL:jdbc:h2:mem:testdb}
spring.jpa.hibernate.ddl-auto=update
```

## Usage Examples

### 1. Generate Test Cases
```java
TestCaseGenerationRequest request = new TestCaseGenerationRequest();
request.setUserStoryIds(Arrays.asList(1L, 2L, 3L));
request.setStyle("step-by-step");
request.setCoverageLevel("comprehensive");
request.setIncludeNegative(true);
request.setIncludePerformance(true);
request.setIncludeAccessibility(true);
request.setIncludeSecurity(true);

List<TestCase> testCases = aiTestCaseService.generateTestCases(userStories, request);
```

### 2. Generate with Context
```java
List<TestCase> contextualTestCases = aiTestCaseService.generateTestCasesWithContext(
    userStories, 
    request,
    "E-commerce platform with microservices architecture",
    Arrays.asList("Payment processing", "User authentication", "Product catalog"),
    Arrays.asList("API testing", "UI automation", "Performance testing")
);
```

### 3. Azure DevOps Integration
```java
// Fetch user stories
List<UserStory> stories = azureDevOpsClient.getUserStories();

// Create test case in Azure DevOps
String azureTestCaseId = azureDevOpsClient.createTestCase(testCaseRequest);

// Link test case to user story
azureDevOpsClient.linkTestCaseToUserStory(azureTestCaseId, userStoryId);
```

## Advanced Features

### Context Learning
The system learns from:
- Project-specific terminology and patterns
- User feedback on generated test cases
- Testing methodologies and best practices
- Domain-specific requirements

### AI Prompt Engineering
- Dynamic prompt construction based on context
- Multi-shot prompting for consistency
- Temperature and token optimization
- JSON-structured output for reliability

### Quality Assurance
- Test case validation and scoring
- Automated quality metrics
- Feedback-driven improvements
- Best practice enforcement

## Integration with TypeScript Frontend

The Java backend seamlessly integrates with the TypeScript/React frontend:

1. **REST API Compatibility**: All endpoints match the TypeScript API client
2. **WebSocket Support**: Real-time updates for test generation progress
3. **Authentication**: Shared session management
4. **Data Synchronization**: Consistent data models across platforms

## Development Setup

1. **Prerequisites**
   - Java 17+
   - Maven 3.6+
   - Azure DevOps account with PAT token
   - OpenAI API key

2. **Build & Run**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

3. **Environment Variables**
   ```bash
   export OPENAI_API_KEY=your_openai_key
   export AZURE_DEVOPS_ORG_URL=https://dev.azure.com/yourorg
   export AZURE_DEVOPS_PAT=your_pat_token
   export AZURE_DEVOPS_PROJECT=your_project
   ```

## Testing Strategy

### Unit Tests
- Service layer testing with mocked dependencies
- AI prompt validation and response parsing
- Azure DevOps API integration testing

### Integration Tests
- End-to-end test case generation workflows
- Azure DevOps connectivity and operations
- Database persistence and retrieval

### Performance Tests
- AI response time optimization
- Bulk test case generation performance
- Azure DevOps API rate limiting handling

## Production Considerations

### Scalability
- Horizontal scaling with load balancers
- Database connection pooling
- AI API rate limiting and queuing

### Security
- API key encryption and rotation
- Azure DevOps token security
- Input validation and sanitization

### Monitoring
- Application performance monitoring
- AI API usage tracking
- Test case generation metrics
- User feedback analytics

This Java backend provides enterprise-grade test case generation capabilities with comprehensive Azure DevOps integration and advanced AI features.