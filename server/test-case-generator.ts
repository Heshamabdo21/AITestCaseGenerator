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
    if (!aiConfig) return ['Positive', 'Negative', 'Edge Case', 'Security'].includes(testType.type);
    
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
  if (aiConfig?.enableWebPortalTests) platforms.push('web');
  if (aiConfig?.enableMobileAppTests) platforms.push('mobile');
  if (aiConfig?.enableApiTests) platforms.push('api');
  
  // If no specific platforms selected, default to web
  if (platforms.length === 0) platforms.push('web');

  for (const testType of testCaseTypes) {
    for (const platform of platforms) {
      const platformLabel = platform === 'web' ? 'Web Portal' : 
                           platform === 'mobile' ? 'Mobile App' : 'API';
      const testCaseTitle = `${testType.type} Test Case (${platformLabel}): ${story.title}`;
      const objective = story.acceptanceCriteria 
        ? `${testType.type} testing for ${platformLabel} to verify that the feature meets the following acceptance criteria: ${story.acceptanceCriteria}`
        : `${testType.type} testing for ${platformLabel} functionality described in the user story`;

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

    // Generate comprehensive test steps and expected results based on CSV analysis
    let testSteps: string[] = [];
    let testStepsStructured: TestStep[] = [];
    let expectedResult = "";

    if (testType.type === 'Positive') {
      if (platform === 'web') {
        testStepsStructured = [
          {
            stepNumber: 1,
            action: "Verify user has required permissions for the web page/feature under test",
            expectedResult: "User account has appropriate permissions and access rights confirmed"
          },
          {
            stepNumber: 2,
            action: "Ensure test environment is accessible and stable via web browser",
            expectedResult: "Test environment loads successfully without errors"
          },
          {
            stepNumber: 3,
            action: "Open the specified web browser in the configured environment",
            expectedResult: "Web browser launches and displays properly"
          },
          {
            stepNumber: 4,
            action: "Navigate to the web application login page",
            expectedResult: "Login page loads correctly with all required elements visible"
          },
          {
            stepNumber: 5,
            action: "Login using valid test credentials with appropriate user role",
            expectedResult: "User successfully authenticates and gains access to the application"
          },
          {
            stepNumber: 6,
            action: "Access the main navigation menu/sidebar in the web portal",
            expectedResult: "Navigation menu displays with appropriate options for user role"
          },
          {
            stepNumber: 7,
            action: "Navigate to the target page/module as specified in user story",
            expectedResult: "Target page loads successfully with all required functionality visible"
          }
        ];
        testSteps = testStepsStructured.map(step => `${step.stepNumber}. ${step.action}`);
      } else if (platform === 'mobile') {
        testStepsStructured = [
          {
            stepNumber: 1,
            action: "Verify user has required permissions for the mobile app feature under test",
            expectedResult: "User account has appropriate mobile app permissions confirmed"
          },
          {
            stepNumber: 2,
            action: "Ensure mobile device/emulator is properly configured",
            expectedResult: "Mobile device/emulator is set up correctly with proper network connectivity"
          },
          {
            stepNumber: 3,
            action: "Launch the mobile application on the test device",
            expectedResult: "Mobile app launches successfully without crashes or errors"
          },
          {
            stepNumber: 4,
            action: "Navigate to the login screen if required",
            expectedResult: "Login screen displays correctly with all required input fields"
          },
          {
            stepNumber: 5,
            action: "Login using valid test credentials with appropriate user role",
            expectedResult: "User successfully authenticates and accesses the mobile app"
          },
          {
            stepNumber: 6,
            action: "Access the main navigation (menu, tabs, or drawer)",
            expectedResult: "Navigation interface displays with appropriate options for user role"
          },
          {
            stepNumber: 7,
            action: "Navigate to the target screen/feature as specified in user story",
            expectedResult: "Target mobile screen loads successfully with all required functionality"
          }
        ];
        testSteps = testStepsStructured.map(step => `${step.stepNumber}. ${step.action}`);
      } else if (platform === 'api') {
        testSteps = [
          "PRECONDITIONS:",
          "1. Verify API endpoints are accessible and properly configured",
          "2. Ensure test environment has valid API authentication tokens",
          "3. Confirm all required API services and dependencies are running",
          "4. Set up API testing tools (Postman, curl, or automated scripts)",
          "",
          "API TEST EXECUTION STEPS:",
          "5. Authenticate with the API using valid credentials/tokens",
          "6. Prepare valid request payloads according to API documentation",
          "7. Send API requests to the endpoints specified in user story",
          "8. Validate response status codes and response structure",
          "9. Verify response data matches expected business logic"
        ];
      }
      
      let stepNumber = platform === 'api' ? 10 : (platform === 'mobile' ? 10 : 9);
      if (criteriaLines.length > 0) {
        criteriaLines.forEach((criteria) => {
          if (criteria.trim()) {
            if (platform === 'api') {
              testSteps.push(`${stepNumber}. Execute API call: ${criteria.trim().replace(/\s+/g, ' ')}`);
              testSteps.push(`${stepNumber + 1}. Verify API response is successful and data structure is correct`);
            } else if (platform === 'mobile') {
              testSteps.push(`${stepNumber}. Perform mobile action: ${criteria.trim().replace(/\s+/g, ' ')}`);
              testSteps.push(`${stepNumber + 1}. Verify the mobile interface responds correctly`);
            } else {
              testSteps.push(`${stepNumber}. Execute web action: ${criteria.trim().replace(/\s+/g, ' ')}`);
              testSteps.push(`${stepNumber + 1}. Verify the action completes successfully and UI responds correctly`);
            }
            stepNumber += 2;
          }
        });
      } else {
        if (platform === 'api') {
          testSteps.push(`${stepNumber}. Execute the main API functionality described in the user story`);
          testSteps.push(`${stepNumber + 1}. Verify API response status codes are correct`);
          testSteps.push(`${stepNumber + 2}. Confirm response data structure matches API documentation`);
          testSteps.push(`${stepNumber + 3}. Validate response data against business rules`);
        } else if (platform === 'mobile') {
          testSteps.push(`${stepNumber}. Perform the main mobile functionality described in the user story`);
          testSteps.push(`${stepNumber + 1}. Verify all mobile screen elements load correctly`);
          testSteps.push(`${stepNumber + 2}. Confirm data is displayed in mobile-optimized format`);
          testSteps.push(`${stepNumber + 3}. Test all touch interactions and gestures`);
        } else {
          testSteps.push(`${stepNumber}. Perform the main web functionality described in the user story`);
          testSteps.push(`${stepNumber + 1}. Verify all page elements load correctly`);
          testSteps.push(`${stepNumber + 2}. Confirm data is displayed in the expected format`);
          testSteps.push(`${stepNumber + 3}. Test all interactive elements (buttons, links, forms)`);
        }
      }
      
      testSteps.push("", "VALIDATION STEPS:");
      if (platform === 'api') {
        testSteps.push(`${stepNumber + 4}. Verify API response headers are correct`);
        testSteps.push(`${stepNumber + 5}. Confirm all required response fields are present`);
        testSteps.push(`${stepNumber + 6}. Test error handling for invalid requests`);
        testSteps.push(`${stepNumber + 7}. Verify data consistency across API calls`);
        testSteps.push(`${stepNumber + 8}. Test API rate limiting if applicable`);
      } else if (platform === 'mobile') {
        testSteps.push(`${stepNumber + 4}. Verify mobile screen orientation handling`);
        testSteps.push(`${stepNumber + 5}. Confirm all required mobile UI elements are present`);
        testSteps.push(`${stepNumber + 6}. Test pull-to-refresh functionality if applicable`);
        testSteps.push(`${stepNumber + 7}. Verify offline/online mode transitions`);
        testSteps.push(`${stepNumber + 8}. Test multi-language support on mobile`);
      } else {
        testSteps.push(`${stepNumber + 4}. Verify page title and headers are displayed correctly`);
        testSteps.push(`${stepNumber + 5}. Confirm all required columns/fields are present`);
        testSteps.push(`${stepNumber + 6}. Test search functionality if applicable`);
        testSteps.push(`${stepNumber + 7}. Verify data filtering and sorting work correctly`);
        testSteps.push(`${stepNumber + 8}. Test multi-language support if required`);
      }
      
      if (platform === 'api') {
        expectedResult = `API POSITIVE TEST EXPECTED RESULTS:
✓ API authentication is successful with valid credentials
✓ API endpoints respond with correct HTTP status codes (200, 201, etc.)
✓ Response data structure matches API documentation specifications
✓ All required response fields are present and correctly formatted
✓ API response times are within acceptable limits (< 500ms)
✓ Data returned follows business logic and validation rules
✓ Error handling works correctly for invalid requests
✓ API rate limiting functions as designed
✓ No server errors or exceptions occur during normal operation`;
      } else if (platform === 'mobile') {
        expectedResult = `MOBILE APP POSITIVE TEST EXPECTED RESULTS:
✓ Mobile app launches successfully on target device
✓ User authentication works correctly on mobile interface
✓ All mobile screens load completely with correct title: "${story.title}"
✓ Mobile UI elements render correctly and are touch-responsive
✓ Data is displayed in mobile-optimized format
✓ Touch interactions and gestures work appropriately
✓ Screen orientation changes are handled correctly
✓ Pull-to-refresh functionality works as expected
✓ Offline/online mode transitions function correctly
✓ Mobile-specific features work without crashes
✓ App performance is acceptable on target devices`;
      } else {
        expectedResult = `WEB PORTAL POSITIVE TEST EXPECTED RESULTS:
✓ User successfully accesses the web page with proper permissions
✓ Page loads completely with correct title: "${story.title}"
✓ All web UI elements render correctly and are functional
✓ Data is displayed in the correct format and structure
✓ All interactive elements respond appropriately
✓ Search and filtering functions work as expected
✓ Multi-language support functions correctly (Arabic/English)
✓ No errors or exceptions occur during normal operation
✓ Web page performance meets acceptable standards`;
      }
      
    } else if (testType.type === 'Negative') {
      testSteps = [
        "NEGATIVE TEST SCENARIOS:",
        "1. AUTHENTICATION FAILURES:",
        "   - Attempt login with invalid/expired credentials",
        "   - Test with locked/suspended user accounts",
        "   - Try accessing pages without proper authentication",
        "",
        "2. AUTHORIZATION VIOLATIONS:",
        "   - Access restricted pages without required permissions",
        "   - Attempt actions beyond user role capabilities",
        "   - Test cross-user data access attempts",
        "",
        "3. INPUT VALIDATION TESTS:",
        "   - Submit forms with empty required fields",
        "   - Input invalid characters in text fields",
        "   - Test with SQL injection attempts",
        "   - Input excessively long strings",
        "   - Use special characters and script tags",
        "",
        "4. UI INTERACTION FAILURES:",
        "   - Double-click submit buttons rapidly",
        "   - Navigate using browser back/forward during operations",
        "   - Test with disabled JavaScript",
        "   - Attempt operations during network interruptions",
        "",
        "5. DATA INTEGRITY TESTS:",
        "   - Modify form data using browser developer tools",
        "   - Submit requests with missing CSRF tokens",
        "   - Test concurrent user modifications",
        "   - Attempt to access deleted/non-existent records"
      ];
      
      expectedResult = `NEGATIVE TEST EXPECTED RESULTS:
✓ Invalid login attempts are rejected with clear error messages
✓ Unauthorized access attempts are blocked and logged
✓ Form validation prevents submission of invalid data
✓ Appropriate error messages guide user correction
✓ System remains stable and functional under error conditions
✓ No sensitive information is exposed in error messages
✓ Security measures prevent injection and XSS attacks
✓ Data integrity is maintained during error scenarios
✓ User sessions are handled securely during failures
✓ System logs security violations appropriately`;
      
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
        "COMPREHENSIVE SECURITY TESTING:",
        "",
        "1. AUTHENTICATION SECURITY:",
        "   - Test password complexity requirements",
        "   - Verify account lockout mechanisms after failed attempts",
        "   - Test session timeout functionality",
        "   - Verify secure password reset procedures",
        "   - Test multi-factor authentication if implemented",
        "",
        "2. AUTHORIZATION TESTING:",
        "   - Verify role-based access controls (RBAC)",
        "   - Test horizontal privilege escalation attempts",
        "   - Test vertical privilege escalation attempts",
        "   - Verify permission inheritance and delegation",
        "   - Test access to sensitive data based on user roles",
        "",
        "3. INPUT VALIDATION SECURITY:",
        "   - Test SQL injection in all input fields",
        "   - Test NoSQL injection attempts",
        "   - Verify XSS prevention (stored, reflected, DOM-based)",
        "   - Test command injection vulnerabilities",
        "   - Test file upload security (if applicable)",
        "",
        "4. SESSION MANAGEMENT:",
        "   - Test session fixation vulnerabilities",
        "   - Verify secure session token generation",
        "   - Test concurrent session handling",
        "   - Verify proper session invalidation on logout",
        "   - Test session hijacking prevention",
        "",
        "5. DATA PROTECTION:",
        "   - Verify sensitive data encryption at rest",
        "   - Test data transmission encryption (HTTPS/TLS)",
        "   - Verify PII (Personal Identifiable Information) protection",
        "   - Test data masking for unauthorized users",
        "   - Verify secure data deletion procedures",
        "",
        "6. CSRF AND SECURITY HEADERS:",
        "   - Test Cross-Site Request Forgery protection",
        "   - Verify security headers (CSP, HSTS, X-Frame-Options)",
        "   - Test clickjacking protection",
        "   - Verify referrer policy implementation"
      ];
      
      expectedResult = `SECURITY TEST EXPECTED RESULTS:
✓ Strong authentication mechanisms prevent unauthorized access
✓ Role-based access controls enforce proper authorization
✓ All input validation prevents injection attacks successfully
✓ Session management is secure and tamper-resistant
✓ Sensitive data is properly encrypted and protected
✓ CSRF tokens prevent cross-site request forgery
✓ Security headers provide additional protection layers
✓ No privilege escalation vulnerabilities exist
✓ Data privacy regulations are met (GDPR, local laws)
✓ Security logging captures all relevant events
✓ System maintains security under concurrent user load
✓ Password policies enforce strong authentication`;
      
    } else if (testType.type === 'Performance') {
      testSteps = [
        "COMPREHENSIVE PERFORMANCE TESTING:",
        "",
        "1. LOAD TIME MEASUREMENTS:",
        "   - Measure initial page load time (< 3 seconds target)",
        "   - Test time to interactive (TTI) metrics",
        "   - Measure largest contentful paint (LCP)",
        "   - Test cumulative layout shift (CLS)",
        "   - Verify first input delay (FID) responsiveness",
        "",
        "2. STRESS TESTING:",
        "   - Test with 10, 50, 100, 500 concurrent users",
        "   - Monitor system behavior under peak load conditions",
        "   - Test database connection pool limits",
        "   - Verify graceful degradation under stress",
        "   - Test recovery after load spikes",
        "",
        "3. RESOURCE UTILIZATION:",
        "   - Monitor CPU usage during operations",
        "   - Test memory consumption and garbage collection",
        "   - Monitor database query execution times",
        "   - Test network bandwidth utilization",
        "   - Verify caching mechanisms effectiveness",
        "",
        "4. SCALABILITY TESTING:",
        "   - Test horizontal scaling capabilities",
        "   - Verify load balancer performance",
        "   - Test auto-scaling triggers and responses",
        "   - Monitor performance across different server instances",
        "",
        "5. MOBILE AND NETWORK TESTING:",
        "   - Test performance on slow network connections (3G, 4G)",
        "   - Verify mobile device performance",
        "   - Test offline functionality if applicable",
        "   - Monitor performance with network interruptions"
      ];
      
      expectedResult = `PERFORMANCE TEST EXPECTED RESULTS:
✓ Page load times consistently under 3 seconds
✓ API response times under 500ms for standard operations
✓ System maintains 99.9% uptime under normal load
✓ Database queries execute within 100ms average
✓ Memory usage remains stable without leaks
✓ CPU utilization stays below 80% under peak load
✓ System handles 500+ concurrent users efficiently
✓ Graceful degradation occurs under extreme load
✓ Mobile performance meets responsive design standards
✓ Network optimization reduces bandwidth usage
✓ Caching improves performance by 40%+ for repeat requests
✓ Auto-scaling responds within 2 minutes of load changes`;
    } else if (testType.type === 'Usability') {
      testSteps = [
        "USABILITY AND USER EXPERIENCE TESTING:",
        "",
        "1. NAVIGATION AND LAYOUT:",
        "   - Test intuitive menu navigation and structure",
        "   - Verify consistent layout across all pages",
        "   - Test breadcrumb navigation functionality",
        "   - Verify responsive design on different screen sizes",
        "   - Test accessibility features (WCAG compliance)",
        "",
        "2. FORM USABILITY:",
        "   - Test form field labels and placeholders clarity",
        "   - Verify helpful error messages and validation",
        "   - Test tab order and keyboard navigation",
        "   - Verify auto-complete and auto-save features",
        "   - Test form submission confirmation messages",
        "",
        "3. CONTENT AND READABILITY:",
        "   - Verify text readability and font sizes",
        "   - Test color contrast for accessibility",
        "   - Verify content organization and hierarchy",
        "   - Test multi-language content display",
        "   - Verify help text and tooltips effectiveness",
        "",
        "4. INTERACTION DESIGN:",
        "   - Test button and link visual feedback",
        "   - Verify loading indicators during operations",
        "   - Test drag-and-drop functionality if applicable",
        "   - Verify modal and popup behavior",
        "   - Test keyboard shortcuts and hotkeys"
      ];
      
      expectedResult = `USABILITY TEST EXPECTED RESULTS:
✓ Navigation is intuitive and users find features easily
✓ Layout is consistent and professional across all pages
✓ Forms are easy to complete with clear validation
✓ Error messages guide users toward correct actions
✓ Accessibility standards are met for all users
✓ Content is readable with proper contrast and typography
✓ Multi-language support enhances user experience
✓ Interactive elements provide clear visual feedback
✓ Loading states inform users of system processing
✓ Help documentation is accessible and useful
✓ Mobile experience is optimized for touch interaction
✓ Users can complete tasks efficiently without confusion`;
      
    } else if (testType.type === 'UI') {
      testSteps = [
        "USER INTERFACE TESTING:",
        "",
        "1. VISUAL ELEMENTS TESTING:",
        "   - Verify all buttons, links, and interactive elements are visible",
        "   - Test button states (normal, hover, active, disabled)",
        "   - Verify form field styling and alignment",
        "   - Test image loading and display quality",
        "   - Verify icon consistency and clarity",
        "",
        "2. LAYOUT AND RESPONSIVENESS:",
        "   - Test responsive design on different screen sizes",
        "   - Verify element positioning and alignment",
        "   - Test scroll behavior and overflow handling",
        "   - Verify header and footer consistency",
        "   - Test sidebar and navigation menu behavior",
        "",
        "3. INTERACTIVE ELEMENTS:",
        "   - Test dropdown menus and select boxes",
        "   - Verify modal dialogs and popups",
        "   - Test accordion and collapsible elements",
        "   - Verify tooltip and help text display",
        "   - Test tab navigation and content switching",
        "",
        "4. FORM UI VALIDATION:",
        "   - Test field focus and blur states",
        "   - Verify error message styling and positioning",
        "   - Test form validation visual indicators",
        "   - Verify submit button states during processing",
        "   - Test progress indicators and loading states"
      ];
      
      expectedResult = `UI TEST EXPECTED RESULTS:
✓ All visual elements render correctly and consistently
✓ Interactive elements respond appropriately to user actions
✓ Layout maintains integrity across different screen sizes
✓ Form elements display proper validation states
✓ Loading indicators provide clear user feedback
✓ Color scheme and typography are consistent
✓ Icons and images load properly without distortion
✓ Hover and focus states enhance user experience
✓ Modal dialogs display correctly and are accessible
✓ Navigation elements are intuitive and functional
✓ Error messages are clearly visible and helpful
✓ UI components follow design system guidelines`;
      
    } else if (testType.type === 'API') {
      testSteps = [
        "API TESTING:",
        "",
        "1. ENDPOINT FUNCTIONALITY:",
        "   - Test all CRUD operations (Create, Read, Update, Delete)",
        "   - Verify API endpoint accessibility and response codes",
        "   - Test request methods (GET, POST, PUT, DELETE, PATCH)",
        "   - Verify request and response payload formats",
        "   - Test API versioning and backward compatibility",
        "",
        "2. DATA VALIDATION:",
        "   - Test input parameter validation",
        "   - Verify required field enforcement",
        "   - Test data type validation (string, number, boolean)",
        "   - Verify response data structure and completeness",
        "   - Test character encoding and special characters",
        "",
        "3. ERROR HANDLING:",
        "   - Test invalid request formats (400 Bad Request)",
        "   - Verify authentication failures (401 Unauthorized)",
        "   - Test permission violations (403 Forbidden)",
        "   - Verify resource not found scenarios (404 Not Found)",
        "   - Test server error handling (500 Internal Server Error)",
        "",
        "4. PERFORMANCE AND SECURITY:",
        "   - Test API response times under normal load",
        "   - Verify rate limiting and throttling mechanisms",
        "   - Test authentication token validation",
        "   - Verify CORS policy implementation",
        "   - Test API security headers and encryption",
        "",
        "5. INTEGRATION TESTING:",
        "   - Test API calls from frontend application",
        "   - Verify database integration and data persistence",
        "   - Test third-party API integrations",
        "   - Verify webhook and callback functionality"
      ];
      
      expectedResult = `API TEST EXPECTED RESULTS:
✓ All API endpoints respond with correct HTTP status codes
✓ Request and response payloads follow defined schemas
✓ Authentication and authorization work correctly
✓ Data validation prevents invalid inputs
✓ Error responses provide clear and helpful messages
✓ API performance meets acceptable response time standards
✓ Rate limiting protects against abuse
✓ CORS policies allow legitimate cross-origin requests
✓ API documentation matches actual implementation
✓ Integration with frontend and database functions properly
✓ Third-party API calls handle errors gracefully
✓ Security measures protect against common vulnerabilities`;
      
    } else if (testType.type === 'Compatibility') {
      testSteps = [
        "CROSS-PLATFORM COMPATIBILITY TESTING:",
        "",
        "1. BROWSER COMPATIBILITY:",
        "   - Test on Chrome (latest 2 versions)",
        "   - Test on Firefox (latest 2 versions)",
        "   - Test on Safari (latest 2 versions)",
        "   - Test on Edge (latest 2 versions)",
        "   - Verify functionality on older browser versions",
        "",
        "2. OPERATING SYSTEM TESTING:",
        "   - Test on Windows 10/11",
        "   - Test on macOS (latest 2 versions)",
        "   - Test on Linux distributions (Ubuntu, CentOS)",
        "   - Verify mobile OS compatibility (iOS, Android)",
        "",
        "3. DEVICE TESTING:",
        "   - Test on desktop computers (various resolutions)",
        "   - Test on tablets (iPad, Android tablets)",
        "   - Test on smartphones (various screen sizes)",
        "   - Verify touch interface functionality",
        "",
        "4. INTEGRATION COMPATIBILITY:",
        "   - Test with third-party integrations",
        "   - Verify API compatibility with external systems",
        "   - Test plugin and extension compatibility",
        "   - Verify database compatibility across versions"
      ];
      
      expectedResult = `COMPATIBILITY TEST EXPECTED RESULTS:
✓ Application functions consistently across all major browsers
✓ Features work properly on different operating systems
✓ Mobile and tablet interfaces are fully functional
✓ Touch gestures work correctly on mobile devices
✓ Responsive design adapts to all screen sizes
✓ Third-party integrations function without conflicts
✓ API calls work correctly across different environments
✓ Database operations are consistent across platforms
✓ Print functionality works on all supported browsers
✓ File downloads work correctly on all platforms
✓ Keyboard shortcuts function across operating systems
✓ No browser-specific bugs or rendering issues exist`;
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
      objective: `${testType.description} - ${objective}`,
      prerequisites: prerequisites.join('\n'),
      testSteps: testSteps.join('\n'),
      testStepsStructured: testStepsStructured.length > 0 ? testStepsStructured : null,
      expectedResult,
      testPassword: testDataConfig?.password || null, // Use password from test data config
      requiredPermissions,
      priority: testType.priority,
      testType: platform,
      status: "pending" as const,
      userStoryId: story.id,
      azureTestCaseId: null,
    });
    }
  }

  return testCases;
}