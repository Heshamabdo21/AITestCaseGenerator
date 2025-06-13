import type { UserStory, TestDataConfig, EnvironmentConfig, AiConfiguration, TestStep } from "@shared/schema";

interface TestCaseStructure {
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Functional' | 'Non-Functional';
  description: string;
}

export function generateSeparateTestCases(
  story: UserStory, 
  testDataConfig: TestDataConfig | null, 
  environmentConfig: EnvironmentConfig | null,
  aiConfig: AiConfiguration | null = null
) {
  // Define all possible test case types
  const allTestCaseTypes: TestCaseStructure[] = [
    { type: 'Positive', priority: 'High', category: 'Functional', description: 'Valid scenarios with expected inputs' },
    { type: 'Negative', priority: 'High', category: 'Functional', description: 'Invalid inputs and error handling' },
    { type: 'Edge Case', priority: 'Medium', category: 'Functional', description: 'Boundary conditions and limits' },
    { type: 'Security', priority: 'High', category: 'Non-Functional', description: 'Authentication, authorization, and data protection' },
    { type: 'Performance', priority: 'Medium', category: 'Non-Functional', description: 'Load, response time, and scalability' },
    { type: 'UI', priority: 'Medium', category: 'Functional', description: 'User interface elements and interactions' },
    { type: 'Usability', priority: 'Medium', category: 'Functional', description: 'User experience and ease of use validation' },
    { type: 'API', priority: 'High', category: 'Functional', description: 'API endpoints, requests, and responses' },
    { type: 'Compatibility', priority: 'Low', category: 'Non-Functional', description: 'Cross-browser and device testing' }
  ];

  // Filter test case types based on AI configuration
  const testCaseTypes = allTestCaseTypes.filter(testType => {
    if (!aiConfig) return ['Positive', 'Negative', 'Edge Case'].includes(testType.type);
    
    switch (testType.type) {
      case 'Positive':
        return aiConfig.includePositiveTests;
      case 'Negative':
        return aiConfig.includeNegativeTests;
      case 'Edge Case':
        return aiConfig.includeEdgeCases;
      case 'Security':
        return aiConfig.includeSecurityCases;
      case 'Performance':
        return aiConfig.includePerformanceTests;
      case 'UI':
        return aiConfig.includeUiTests;
      case 'Usability':
        return aiConfig.includeUsabilityTests;
      case 'API':
        return aiConfig.includeApiTests;
      case 'Compatibility':
        return aiConfig.includeCompatibilityTests;
      default:
        return false;
    }
  });

  const testCases = [];

  // Clean acceptance criteria for processing
  const cleanCriteria = story.acceptanceCriteria 
    ? story.acceptanceCriteria
        .replace(/<[^>]*>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim()
    : "";
  
  const criteriaLines = cleanCriteria ? cleanCriteria.split(/AC\d+:/).filter(line => line.trim()) : [];

  // Determine which platforms to generate tests for
  const platforms = [];
  if (aiConfig?.enableWebPortalTests !== false) platforms.push('web');
  if (aiConfig?.enableMobileAppTests) platforms.push('mobile');
  if (aiConfig?.enableApiTests) platforms.push('api');
  
  // If no specific platforms selected, default to web
  if (platforms.length === 0) platforms.push('web');

  for (const testType of testCaseTypes) {
    for (const platform of platforms) {
      const platformLabel = platform === 'web' ? 'Web Portal' : 
                           platform === 'mobile' ? 'Mobile App' : 'API';
      const testCaseTitle = `${testType.type} Test Case (${platformLabel}): ${story.title}`;
      
      // Focus strictly on the user story's specific requirements
      let objective = `${testType.type} testing to verify: ${story.title}`;
      
      if (story.description && story.description.trim()) {
        objective += `\n\nDescription: ${story.description.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim()}`;
      }
      
      if (story.acceptanceCriteria && story.acceptanceCriteria.trim()) {
        const cleanCriteria = story.acceptanceCriteria
          .replace(/<[^>]*>/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&nbsp;/g, ' ')
          .trim();
        
        const criteriaLines = cleanCriteria.split(/AC\d+:/).filter(line => line.trim());
        
        if (criteriaLines.length > 0) {
          objective += `\n\nAcceptance Criteria to verify:`;
          criteriaLines.forEach((criteria, index) => {
            objective += `\nAC${index + 1}: ${criteria.trim()}`;
          });
        } else {
          objective += `\n\nAcceptance Criteria: ${cleanCriteria}`;
        }
      }

      // Build focused prerequisites based on the user story
      const prerequisites = [
        "PREREQUISITES FOR THIS USER STORY:",
        "- User has required permissions to access the functionality described in this story",
        "- System environment is configured for testing the specific feature"
      ];

      if (testDataConfig) {
        prerequisites.push("");
        prerequisites.push("TEST DATA CONFIGURATION:");
        if (testDataConfig.username) prerequisites.push(`- Test Username: ${testDataConfig.username}`);
        if (testDataConfig.password) prerequisites.push(`- Test Password: Configured in secure test environment`);
        if (testDataConfig.webPortalUrl) prerequisites.push(`- Web Portal URL: ${testDataConfig.webPortalUrl}`);
      }

      if (environmentConfig) {
        prerequisites.push("");
        prerequisites.push("ENVIRONMENT CONFIGURATION:");
        if (environmentConfig.operatingSystem) prerequisites.push(`- Operating System: ${environmentConfig.operatingSystem}`);
        if (environmentConfig.webBrowser) prerequisites.push(`- Web Browser: ${environmentConfig.webBrowser}`);
      }

      // Generate test steps based on test type and user story
      let testSteps: string[] = [];
      let testStepsStructured: TestStep[] = [];
      let expectedResult = "";

      if (testType.type === 'Positive') {
        // Create test steps focused specifically on this user story
        if (story.acceptanceCriteria && criteriaLines.length > 0) {
          testStepsStructured = [
            {
              stepNumber: 1,
              action: "Access the system with appropriate user permissions",
              expectedResult: "User successfully gains access to test the specific functionality"
            }
          ];
          
          // Add specific test steps based on acceptance criteria only
          criteriaLines.forEach((criteria: string, index: number) => {
            const cleanCriteria = criteria.trim();
            testStepsStructured.push({
              stepNumber: 2 + index,
              action: `Verify acceptance criteria: ${cleanCriteria}`,
              expectedResult: `The requirement is met: ${cleanCriteria}`
            });
          });
          
        } else {
          // Generate test steps based on user story title and description only
          testStepsStructured = [
            {
              stepNumber: 1,
              action: "Access the system to test the functionality described in the user story",
              expectedResult: "User can access the relevant feature or page"
            },
            {
              stepNumber: 2,
              action: `Verify the implementation of: ${story.title}`,
              expectedResult: `The system implements the functionality as described: ${story.title}`
            }
          ];
        }
        
        testSteps = testStepsStructured.map(step => `${step.stepNumber}. ${step.action}`);
        expectedResult = `All acceptance criteria for the user story "${story.title}" are successfully verified and met.`;
        
      } else if (testType.type === 'Negative') {
        // Negative test cases focused on user story edge cases and error scenarios
        testStepsStructured = [
          {
            stepNumber: 1,
            action: `Test invalid scenarios for: ${story.title}`,
            expectedResult: "System handles invalid inputs appropriately with proper error messages"
          },
          {
            stepNumber: 2,
            action: "Attempt operations with insufficient permissions or invalid data",
            expectedResult: "System prevents unauthorized actions and displays appropriate error messages"
          }
        ];
        
        if (story.acceptanceCriteria && criteriaLines.length > 0) {
          criteriaLines.forEach((criteria: string, index: number) => {
            const cleanCriteria = criteria.trim();
            testStepsStructured.push({
              stepNumber: 3 + index,
              action: `Test negative scenarios for: ${cleanCriteria}`,
              expectedResult: `System properly handles edge cases and errors for: ${cleanCriteria}`
            });
          });
        }
        
        testSteps = testStepsStructured.map(step => `${step.stepNumber}. ${step.action}`);
        expectedResult = `All error scenarios for "${story.title}" are properly handled with appropriate error messages and system stability.`;
        
      } else {
        // Other test types (Edge Case, Security, Performance, etc.)
        testStepsStructured = [
          {
            stepNumber: 1,
            action: `Perform ${testType.type.toLowerCase()} testing for: ${story.title}`,
            expectedResult: `${testType.type} requirements are met for the user story functionality`
          }
        ];
        
        if (story.acceptanceCriteria && criteriaLines.length > 0) {
          criteriaLines.forEach((criteria: string, index: number) => {
            const cleanCriteria = criteria.trim();
            testStepsStructured.push({
              stepNumber: 2 + index,
              action: `Verify ${testType.type.toLowerCase()} aspects of: ${cleanCriteria}`,
              expectedResult: `${testType.type} requirements are satisfied for: ${cleanCriteria}`
            });
          });
        }
        
        testSteps = testStepsStructured.map(step => `${step.stepNumber}. ${step.action}`);
        expectedResult = `All ${testType.type.toLowerCase()} requirements for "${story.title}" are successfully verified and meet quality standards.`;
      }

      // Generate required permissions based on test type and test data config
      let requiredPermissions = '';
      if (testDataConfig?.permissions && Array.isArray(testDataConfig.permissions)) {
        requiredPermissions = testDataConfig.permissions.join(', ');
      } else {
        // Default permissions based on test type
        switch (testType.type) {
          case 'Security':
            requiredPermissions = 'admin, security-admin, audit-read';
            break;
          case 'Performance':
            requiredPermissions = 'read-write, performance-monitor';
            break;
          case 'API':
            requiredPermissions = 'api-access, read-write';
            break;
          case 'Negative':
            requiredPermissions = 'read-write, error-simulation';
            break;
          default:
            requiredPermissions = 'read-write, basic-user';
        }
      }

      testCases.push({
        title: testCaseTitle,
        objective,
        prerequisites: prerequisites.join('\n'),
        testSteps: testSteps.join('\n'),
        testStepsStructured: testStepsStructured.length > 0 ? testStepsStructured : null,
        expectedResult,
        testPassword: testDataConfig?.password || "TestPassword123",
        requiredPermissions,
        priority: testType.priority,
        testType: platform,
        status: "pending" as const,
        userStoryId: story.id
      });
    }
  }

  return testCases;
}