import type { UserStory, TestDataConfig, EnvironmentConfig } from "@shared/schema";

export function generateSeparateTestCases(
  story: UserStory, 
  testDataConfig: TestDataConfig | null, 
  environmentConfig: EnvironmentConfig | null
) {
  const testCaseTypes = [
    { type: 'Positive', priority: 'High' },
    { type: 'Negative', priority: 'Medium' },
    { type: 'Edge Case', priority: 'Medium' },
    { type: 'Security', priority: 'High' },
    { type: 'Performance', priority: 'Low' }
  ];

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

  for (const testType of testCaseTypes) {
    const testCaseTitle = `${testType.type} Test Case: ${story.title}`;
    const objective = story.acceptanceCriteria 
      ? `${testType.type} testing to verify that the feature meets the following acceptance criteria: ${story.acceptanceCriteria}`
      : `${testType.type} testing for the functionality described in the user story`;

    // Build comprehensive prerequisites
    const prerequisites = [
      "SYSTEM PREREQUISITES:",
      "- Application is deployed and accessible in test environment",
      "- All required services and dependencies are running",
      "- Network connectivity is stable and verified"
    ];

    if (testDataConfig) {
      prerequisites.push("");
      prerequisites.push("TEST DATA CONFIGURATION:");
      if (testDataConfig.username) prerequisites.push(`- Test Username: ${testDataConfig.username}`);
      if (testDataConfig.password) prerequisites.push(`- Test Password: Configured in secure test environment`);
      if (testDataConfig.webPortalUrl) prerequisites.push(`- Web Portal URL: ${testDataConfig.webPortalUrl}`);
      if (testDataConfig.additionalData) {
        prerequisites.push(`- Additional Test Data:`);
        try {
          const dataObj = typeof testDataConfig.additionalData === 'string' 
            ? JSON.parse(testDataConfig.additionalData) 
            : testDataConfig.additionalData;
          if (typeof dataObj === 'object' && dataObj !== null) {
            Object.entries(dataObj).forEach(([key, value]) => {
              prerequisites.push(`  • ${key}: ${value}`);
            });
          } else {
            prerequisites.push(`  • ${testDataConfig.additionalData}`);
          }
        } catch (e) {
          prerequisites.push(`  • ${testDataConfig.additionalData}`);
        }
      }
    }

    if (environmentConfig) {
      prerequisites.push("");
      prerequisites.push("ENVIRONMENT CONFIGURATION:");
      if (environmentConfig.operatingSystem) prerequisites.push(`- Operating System: ${environmentConfig.operatingSystem}`);
      if (environmentConfig.osVersion) prerequisites.push(`- OS Version: ${environmentConfig.osVersion}`);
      if (environmentConfig.webBrowser) prerequisites.push(`- Web Browser: ${environmentConfig.webBrowser}`);
      if (environmentConfig.browserVersion) prerequisites.push(`- Browser Version: ${environmentConfig.browserVersion}`);
    }

    prerequisites.push("");
    prerequisites.push("ACCESS REQUIREMENTS:");
    prerequisites.push("- Valid user account with appropriate test permissions");
    prerequisites.push("- Access to all required test modules and features");
    prerequisites.push("- Ability to create, modify, and delete test data as needed");

    // Generate type-specific test steps and expected results
    let testSteps: string[] = [];
    let expectedResult = "";

    if (testType.type === 'Positive') {
      testSteps = [
        "POSITIVE TEST EXECUTION:",
        "1. Ensure test environment is accessible and stable",
        "2. Open the specified web browser",
        "3. Navigate to the application URL",
        "4. Login using valid test credentials",
        "5. Navigate to the target page/module"
      ];
      
      let stepNumber = 6;
      criteriaLines.forEach((criteria) => {
        if (criteria.trim()) {
          testSteps.push(`${stepNumber}. Execute: ${criteria.trim().replace(/\s+/g, ' ')}`);
          testSteps.push(`${stepNumber + 1}. Verify successful completion`);
          stepNumber += 2;
        }
      });
      
      expectedResult = "POSITIVE TEST EXPECTED RESULTS:\n✓ All acceptance criteria are met successfully\n✓ System responds correctly to valid inputs\n✓ User interface functions as expected\n✓ Data is processed and displayed correctly";
      
    } else if (testType.type === 'Negative') {
      testSteps = [
        "NEGATIVE TEST EXECUTION:",
        "1. Prepare test environment",
        "2. Navigate to the application",
        "3. Attempt login with invalid credentials",
        "4. Test with empty or null input fields",
        "5. Try unauthorized access scenarios",
        "6. Input invalid data formats",
        "7. Test boundary value violations"
      ];
      
      expectedResult = "NEGATIVE TEST EXPECTED RESULTS:\n✓ System handles invalid inputs gracefully\n✓ Appropriate error messages are displayed\n✓ Unauthorized access is prevented\n✓ System remains stable under error conditions\n✓ No data corruption occurs";
      
    } else if (testType.type === 'Edge Case') {
      testSteps = [
        "EDGE CASE TEST EXECUTION:",
        "1. Set up test environment",
        "2. Test with minimum boundary values",
        "3. Test with maximum boundary values",
        "4. Test with special characters and Unicode",
        "5. Test with extremely long input strings",
        "6. Test concurrent user scenarios",
        "7. Test system behavior at capacity limits"
      ];
      
      expectedResult = "EDGE CASE EXPECTED RESULTS:\n✓ System handles boundary conditions correctly\n✓ Performance remains acceptable under edge conditions\n✓ No unexpected crashes or errors\n✓ Data integrity is maintained\n✓ User experience remains functional";
      
    } else if (testType.type === 'Security') {
      testSteps = [
        "SECURITY TEST EXECUTION:",
        "1. Verify authentication mechanisms",
        "2. Test authorization and access controls",
        "3. Check for SQL injection vulnerabilities",
        "4. Test XSS (Cross-Site Scripting) prevention",
        "5. Verify CSRF protection",
        "6. Test session management security",
        "7. Check data encryption and transmission"
      ];
      
      expectedResult = "SECURITY TEST EXPECTED RESULTS:\n✓ Authentication is secure and robust\n✓ Authorization controls function properly\n✓ No injection vulnerabilities exist\n✓ User data is protected\n✓ Sessions are managed securely\n✓ Data transmission is encrypted";
      
    } else if (testType.type === 'Performance') {
      testSteps = [
        "PERFORMANCE TEST EXECUTION:",
        "1. Establish baseline performance metrics",
        "2. Measure page load times",
        "3. Test response times under normal load",
        "4. Monitor resource utilization",
        "5. Test with multiple concurrent users",
        "6. Measure database query performance",
        "7. Verify system scalability"
      ];
      
      expectedResult = "PERFORMANCE TEST EXPECTED RESULTS:\n✓ Page loads within acceptable time limits\n✓ Response times meet performance criteria\n✓ System handles concurrent users efficiently\n✓ Resource utilization remains optimal\n✓ Database queries perform within thresholds\n✓ System scales appropriately under load";
    }

    testCases.push({
      title: testCaseTitle,
      objective,
      prerequisites,
      testSteps,
      expectedResult,
      priority: testType.priority,
      status: "pending" as const,
      userStoryId: story.id,
      azureTestCaseId: null,
    });
  }

  return testCases;
}