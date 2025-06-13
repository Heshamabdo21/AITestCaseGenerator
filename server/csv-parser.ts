import type { UserStory, InsertTestCase, TestStep } from "@shared/schema";

export interface CsvTestCase {
  id: string;
  workItemType: string;
  title: string;
  testStep: string;
  stepAction: string;
  stepExpected: string;
  areaPath: string;
  assignedTo: string;
  state: string;
}

export function parseCsvTestCases(csvContent: string): CsvTestCase[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  
  // Create header mapping for flexible column order
  const headerMap = createHeaderMapping(headers);
  
  // Validate that we can map the essential fields
  if (headerMap.title === undefined) {
    console.warn('Could not map title field');
    console.warn('Available headers:', headers);
  }
  const testCases: CsvTestCase[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.split(',').every(cell => !cell.trim())) continue;
    
    const values = parseCsvLine(line);
    if (values.length === 0) continue;
    
    try {
      const testCase = mapCsvRowToTestCase(values, headerMap);
      // Accept rows with either ID or title, as some rows might be continuation of test steps
      if (testCase.title || testCase.id || testCase.stepAction) {
        testCases.push(testCase);
      }
    } catch (error) {
      console.warn(`Skipping invalid row ${i + 1}: ${error}`);
    }
  }
  
  if (testCases.length === 0) {
    throw new Error('No valid test cases found in CSV file');
  }
  
  return testCases;
}

function createHeaderMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Map various possible column names to our standard fields
    if (cleanHeader.includes('id') || cleanHeader.includes('workitemid')) {
      mapping.id = index;
    } else if (cleanHeader.includes('workitemtype') || cleanHeader === 'type' || header.toLowerCase().includes('work item type')) {
      mapping.workItemType = index;
    } else if (cleanHeader.includes('title') || cleanHeader.includes('name')) {
      mapping.title = index;
    } else if (cleanHeader.includes('teststep') || cleanHeader === 'step' || header.toLowerCase().includes('test step')) {
      mapping.testStep = index;
    } else if (cleanHeader.includes('stepaction') || cleanHeader.includes('action') || header.toLowerCase().includes('step action')) {
      mapping.stepAction = index;
    } else if (cleanHeader.includes('stepexpected') || cleanHeader.includes('expected') || header.toLowerCase().includes('step expected')) {
      mapping.stepExpected = index;
    } else if (cleanHeader.includes('areapath') || cleanHeader.includes('area') || header.toLowerCase().includes('area path')) {
      mapping.areaPath = index;
    } else if (cleanHeader.includes('assignedto') || cleanHeader.includes('assigned') || header.toLowerCase().includes('assigned to')) {
      mapping.assignedTo = index;
    } else if (cleanHeader.includes('state') || cleanHeader.includes('status')) {
      mapping.state = index;
    }
  });
  
  return mapping;
}

function mapCsvRowToTestCase(values: string[], headerMap: Record<string, number>): CsvTestCase {
  return {
    id: getValue(values, headerMap.id) || '',
    workItemType: getValue(values, headerMap.workItemType) || 'Test Case',
    title: getValue(values, headerMap.title) || '',
    testStep: getValue(values, headerMap.testStep) || '',
    stepAction: getValue(values, headerMap.stepAction) || '',
    stepExpected: getValue(values, headerMap.stepExpected) || '',
    areaPath: getValue(values, headerMap.areaPath) || '',
    assignedTo: getValue(values, headerMap.assignedTo) || '',
    state: getValue(values, headerMap.state) || 'Active'
  };
}

function getValue(values: string[], index: number | undefined): string {
  if (index === undefined || index >= values.length) return '';
  return values[index]?.trim().replace(/^"|"$/g, '') || '';
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

export function convertCsvToTestCases(csvTestCases: CsvTestCase[], userStoryId: number): InsertTestCase[] {
  const groupedSteps = new Map<string, CsvTestCase[]>();
  
  // Group test steps by title
  csvTestCases.forEach(csvCase => {
    if (csvCase.title && (csvCase.workItemType === 'Test Case' || csvCase.workItemType.toLowerCase().includes('test'))) {
      if (!groupedSteps.has(csvCase.title)) {
        groupedSteps.set(csvCase.title, []);
      }
      groupedSteps.get(csvCase.title)!.push(csvCase);
    }
  });
  
  const testCases: InsertTestCase[] = [];
  
  groupedSteps.forEach((steps, title) => {
    const processedTestCase = processTestCaseGroup(steps, title, userStoryId);
    testCases.push(processedTestCase);
  });
  
  return testCases;
}

function processTestCaseGroup(steps: CsvTestCase[], title: string, userStoryId: number): InsertTestCase {
  const prerequisites: string[] = [];
  const testSteps: string[] = [];
  const testStepsStructured: TestStep[] = [];
  let expectedResult = '';
  let stepNumber = 1;
  
  // Sort steps if they have numeric indicators
  const sortedSteps = steps.sort((a, b) => {
    const aNum = extractStepNumber(a.testStep);
    const bNum = extractStepNumber(b.testStep);
    return aNum - bNum;
  });
  
  sortedSteps.forEach((step, index) => {
    if (step.stepAction) {
      const action = step.stepAction.trim();
      
      if (isPrerequisite(action)) {
        prerequisites.push(formatPrerequisite(action, index + 1));
      } else if (action) {
        const structuredStep: TestStep = {
          stepNumber: stepNumber,
          action: enhanceStepAction(action),
          expectedResult: step.stepExpected || generateDefaultExpected(action, stepNumber)
        };
        testStepsStructured.push(structuredStep);
        testSteps.push(`${stepNumber}. ${enhanceStepAction(action)}`);
        stepNumber++;
      }
    }
    
    if (step.stepExpected) {
      const expected = step.stepExpected.trim();
      if (expected) {
        expectedResult = expectedResult ? `${expectedResult}\n${expected}` : expected;
      }
    }
  });
  
  const analysis = analyzeTestCase(title, steps);
  
  return {
    title: formatTestCaseTitle(title, analysis.category),
    objective: generateObjective(title, analysis),
    prerequisites: formatPrerequisites(prerequisites),
    testSteps: testSteps.length > 0 ? testSteps.join('\n') : 'Execute the test scenario as described',
    testStepsStructured: testStepsStructured.length > 0 ? testStepsStructured : null,
    expectedResult: expectedResult || generateDefaultExpectedResult(analysis),
    testPassword: null,
    requiredPermissions: determinePermissions(analysis),
    priority: determinePriority(steps, analysis),
    testType: determineTestType(analysis),
    status: 'pending',
    userStoryId: userStoryId,
    azureTestCaseId: steps[0]?.id || null
  };
}

function extractStepNumber(stepText: string): number {
  const match = stepText.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 999;
}

function isPrerequisite(action: string): boolean {
  const prereqKeywords = ['precondition', 'prerequisite', 'setup', 'prepare', 'configure', 'initialize'];
  return prereqKeywords.some(keyword => action.toLowerCase().includes(keyword));
}

function formatPrerequisite(action: string, index: number): string {
  return `${index}. ${action.replace(/^(precondition|prerequisite):\s*/i, '')}`;
}

function enhanceStepAction(action: string): string {
  // Clean up and enhance action descriptions
  let enhanced = action.trim();
  
  // Add proper formatting for common actions
  if (enhanced.toLowerCase().startsWith('navigate')) {
    enhanced = `🔗 ${enhanced}`;
  } else if (enhanced.toLowerCase().includes('click') || enhanced.toLowerCase().includes('press')) {
    enhanced = `🖱️ ${enhanced}`;
  } else if (enhanced.toLowerCase().includes('enter') || enhanced.toLowerCase().includes('input')) {
    enhanced = `⌨️ ${enhanced}`;
  } else if (enhanced.toLowerCase().includes('verify') || enhanced.toLowerCase().includes('validate')) {
    enhanced = `✅ ${enhanced}`;
  }
  
  return enhanced;
}

function generateDefaultExpected(action: string, stepNumber: number): string {
  if (action.toLowerCase().includes('navigate')) {
    return 'Page loads successfully and displays expected content';
  } else if (action.toLowerCase().includes('click')) {
    return 'Element responds appropriately to click action';
  } else if (action.toLowerCase().includes('enter') || action.toLowerCase().includes('input')) {
    return 'Data is accepted and processed correctly';
  } else if (action.toLowerCase().includes('verify')) {
    return 'Verification passes with expected results';
  }
  return `Step ${stepNumber} completes successfully with expected behavior`;
}

function analyzeTestCase(title: string, steps: CsvTestCase[]): TestCaseAnalysis {
  const titleLower = title.toLowerCase();
  const allText = `${title} ${steps.map(s => `${s.stepAction} ${s.stepExpected}`).join(' ')}`.toLowerCase();
  
  let category = 'Functional';
  let complexity = 'Medium';
  let riskLevel = 'Low';
  
  // Determine category
  if (titleLower.includes('negative') || allText.includes('error') || allText.includes('invalid')) {
    category = 'Negative';
    riskLevel = 'Medium';
  } else if (titleLower.includes('security') || allText.includes('unauthorized') || allText.includes('permission')) {
    category = 'Security';
    riskLevel = 'High';
  } else if (titleLower.includes('performance') || allText.includes('load') || allText.includes('speed')) {
    category = 'Performance';
    complexity = 'High';
  } else if (titleLower.includes('integration') || allText.includes('api') || allText.includes('service')) {
    category = 'Integration';
    complexity = 'High';
  } else if (titleLower.includes('ui') || titleLower.includes('interface') || allText.includes('display')) {
    category = 'UI';
  }
  
  // Determine complexity
  if (steps.length > 10) {
    complexity = 'High';
  } else if (steps.length > 5) {
    complexity = 'Medium';
  } else {
    complexity = 'Low';
  }
  
  return { category, complexity, riskLevel };
}

interface TestCaseAnalysis {
  category: string;
  complexity: string;
  riskLevel: string;
}

function formatTestCaseTitle(title: string, category: string): string {
  if (title.toLowerCase().startsWith(category.toLowerCase())) {
    return title;
  }
  return `${category} Test: ${title}`;
}

function generateObjective(title: string, analysis: TestCaseAnalysis): string {
  return `Validate ${analysis.category.toLowerCase()} functionality for: ${title}. This ${analysis.complexity.toLowerCase()}-complexity test ensures ${analysis.riskLevel.toLowerCase()} risk scenarios are properly handled.`;
}

function formatPrerequisites(prerequisites: string[]): string {
  if (prerequisites.length === 0) {
    return `SETUP REQUIREMENTS:
- Test environment is accessible and stable
- User has appropriate access permissions
- Required test data is available
- All dependent services are operational`;
  }
  
  return `IMPORTED PREREQUISITES:
${prerequisites.join('\n')}

ADDITIONAL SETUP:
- Verify test environment readiness
- Confirm user access and permissions`;
}

function generateDefaultExpectedResult(analysis: TestCaseAnalysis): string {
  const baseExpected = 'Test execution completes successfully with all validation criteria met';
  
  switch (analysis.category) {
    case 'Security':
      return `${baseExpected}. Security controls function properly and unauthorized access is prevented.`;
    case 'Performance':
      return `${baseExpected}. Performance metrics meet acceptable thresholds.`;
    case 'Negative':
      return `Error conditions are handled gracefully with appropriate user feedback. ${baseExpected}.`;
    case 'Integration':
      return `${baseExpected}. Data flow between systems is accurate and reliable.`;
    default:
      return `${baseExpected}. All functional requirements are satisfied.`;
  }
}

function determinePermissions(analysis: TestCaseAnalysis): string {
  switch (analysis.category) {
    case 'Security':
      return 'admin, security-test';
    case 'Performance':
      return 'read-write, performance-test';
    case 'Integration':
      return 'read-write, api-access';
    default:
      return 'read-write, basic-user';
  }
}

function determinePriority(steps: CsvTestCase[], analysis: TestCaseAnalysis): string {
  if (analysis.riskLevel === 'High' || analysis.category === 'Security') {
    return 'High';
  }
  
  const hasDesignState = steps.some(step => step.state === 'Design');
  if (hasDesignState) {
    return 'High';
  }
  
  return analysis.complexity === 'High' ? 'Medium' : 'Low';
}

function determineTestType(analysis: TestCaseAnalysis): string {
  switch (analysis.category) {
    case 'Performance':
      return 'performance';
    case 'Security':
      return 'security';
    case 'Integration':
      return 'api';
    default:
      return 'web';
  }
}

export function enhanceImportedTestCase(baseTestCase: InsertTestCase): InsertTestCase[] {
  const enhancedCases: InsertTestCase[] = [];
  
  // Create enhanced positive test case with comprehensive validation
  const positiveCase: InsertTestCase = {
    ...baseTestCase,
    title: baseTestCase.title.replace('Test:', 'Enhanced Positive Test:'),
    objective: `Comprehensive positive testing - ${baseTestCase.objective}`,
    prerequisites: generateEnhancedPrerequisites(baseTestCase.prerequisites || '', 'positive'),
    testSteps: generateEnhancedTestSteps(baseTestCase.testSteps || '', 'positive'),
    expectedResult: generateEnhancedExpectedResults(baseTestCase.expectedResult || '', 'positive'),
    testPassword: baseTestCase.testPassword,
    requiredPermissions: baseTestCase.requiredPermissions,
    priority: 'High'
  };
  
  // Create comprehensive negative test case
  const negativeCase: InsertTestCase = {
    ...baseTestCase,
    title: baseTestCase.title.replace('Test:', 'Comprehensive Negative Test:'),
    objective: `Negative testing and error handling validation - ${baseTestCase.objective}`,
    prerequisites: generateEnhancedPrerequisites(baseTestCase.prerequisites || '', 'negative'),
    testSteps: generateEnhancedTestSteps(baseTestCase.testSteps || '', 'negative'),
    expectedResult: generateEnhancedExpectedResults(baseTestCase.expectedResult || '', 'negative'),
    testPassword: baseTestCase.testPassword,
    requiredPermissions: baseTestCase.requiredPermissions,
    priority: 'Medium',
    testType: 'security'
  };
  
  // Create edge case test if the base test case is complex enough
  if (baseTestCase.testStepsStructured && baseTestCase.testStepsStructured.length > 3) {
    const edgeCaseTest: InsertTestCase = {
      ...baseTestCase,
      title: baseTestCase.title.replace('Test:', 'Edge Case Test:'),
      objective: `Edge case and boundary testing - ${baseTestCase.objective}`,
      prerequisites: generateEnhancedPrerequisites(baseTestCase.prerequisites || '', 'edge'),
      testSteps: generateEnhancedTestSteps(baseTestCase.testSteps || '', 'edge'),
      expectedResult: generateEnhancedExpectedResults(baseTestCase.expectedResult || '', 'edge'),
      testPassword: baseTestCase.testPassword,
      requiredPermissions: baseTestCase.requiredPermissions,
      priority: 'Low'
    };
    enhancedCases.push(edgeCaseTest);
  }
  
  enhancedCases.push(positiveCase, negativeCase);
  return enhancedCases;
}

function generateEnhancedPrerequisites(originalPrereqs: string, testType: 'positive' | 'negative' | 'edge'): string {
  const basePrereqs = originalPrereqs || 'Basic test environment setup required';
  
  switch (testType) {
    case 'positive':
      return `ENHANCED POSITIVE TEST PREREQUISITES:
${basePrereqs}

ADDITIONAL REQUIREMENTS:
- Test environment is fully operational and stable
- All user permissions are properly configured and verified
- Test data is validated and complete
- All dependent services and APIs are accessible
- Browser compatibility testing tools are available
- Performance monitoring tools are configured`;

    case 'negative':
      return `NEGATIVE TEST PREREQUISITES:
${basePrereqs}

ADDITIONAL SETUP FOR ERROR TESTING:
- Invalid test data sets are prepared
- Error monitoring and logging tools are active
- Network simulation tools for connectivity testing
- Security testing tools for unauthorized access scenarios
- Backup and recovery procedures are verified
- Error response validation tools are ready`;

    case 'edge':
      return `EDGE CASE TEST PREREQUISITES:
${basePrereqs}

BOUNDARY TESTING SETUP:
- Extreme data sets (minimum/maximum values) are prepared
- Stress testing tools are configured
- Load testing environment is available
- Resource constraint simulation tools
- Concurrent user testing capabilities
- Performance degradation monitoring tools`;

    default:
      return basePrereqs;
  }
}

function generateEnhancedTestSteps(originalSteps: string, testType: 'positive' | 'negative' | 'edge'): string {
  const baseSteps = originalSteps || 'Execute the test scenario';
  
  switch (testType) {
    case 'positive':
      return `ENHANCED POSITIVE TEST EXECUTION:
${baseSteps}

ADDITIONAL VALIDATION STEPS:
1. Verify UI responsiveness and visual consistency
2. Validate data persistence and accuracy across sessions
3. Test cross-browser compatibility
4. Confirm proper loading indicators and user feedback
5. Validate accessibility features (keyboard navigation, screen readers)
6. Test responsive design on different screen sizes
7. Verify proper handling of special characters and internationalization
8. Confirm performance meets acceptable standards
9. Test integration with external services
10. Validate security measures and data protection`;

    case 'negative':
      return `COMPREHENSIVE NEGATIVE TEST SCENARIOS:
1. Authentication and Authorization Tests:
   - Test with invalid credentials
   - Attempt unauthorized access to restricted features
   - Test session timeout handling

2. Input Validation Tests:
   - Submit forms with missing required fields
   - Input invalid data formats and special characters
   - Test SQL injection and XSS prevention
   - Exceed maximum input lengths

3. System Reliability Tests:
   - Test with network interruptions
   - Simulate server errors and timeouts
   - Test concurrent operations that may conflict
   - Test system behavior under resource constraints

4. Error Handling Validation:
   - Verify appropriate error messages are displayed
   - Test error recovery mechanisms
   - Validate logging of error conditions

ORIGINAL TEST FLOW (for comparison):
${baseSteps}`;

    case 'edge':
      return `EDGE CASE AND BOUNDARY TESTING:
1. Data Boundary Tests:
   - Test with minimum and maximum allowed values
   - Test with empty and null data
   - Test with extremely large data sets

2. Performance Boundary Tests:
   - Test with maximum number of concurrent users
   - Test with minimal system resources
   - Test with slow network connections

3. Timing and Sequence Tests:
   - Test rapid sequential operations
   - Test operations with varying delays
   - Test interrupt and resume scenarios

4. Configuration Edge Cases:
   - Test with unusual system configurations
   - Test with different locale and timezone settings
   - Test with various browser configurations

ORIGINAL TEST FLOW (baseline):
${baseSteps}`;

    default:
      return baseSteps;
  }
}

function generateEnhancedExpectedResults(originalResults: string, testType: 'positive' | 'negative' | 'edge'): string {
  const baseResults = originalResults || 'Test completes successfully';
  
  switch (testType) {
    case 'positive':
      return `COMPREHENSIVE POSITIVE TEST RESULTS:
${baseResults}

ENHANCED VALIDATION CRITERIA:
• All UI elements function correctly and consistently
• Data integrity is maintained throughout the process
• Performance meets or exceeds acceptable standards
• Security measures are properly enforced
• User experience is intuitive and accessible
• Cross-browser compatibility is confirmed
• Responsive design works across all device types
• Integration with external services is seamless
• Error handling gracefully manages unexpected situations
• Accessibility standards are met for inclusive design`;

    case 'negative':
      return `NEGATIVE TEST EXPECTED OUTCOMES:
ERROR HANDLING VALIDATION:
• Invalid inputs are rejected with clear, helpful error messages
• Unauthorized access attempts are blocked and logged
• System remains stable and secure under error conditions
• User is provided with appropriate guidance for error resolution
• Security vulnerabilities are not exposed during failures
• Data integrity is maintained even during error scenarios
• System gracefully degrades when services are unavailable
• Recovery mechanisms function properly after errors
• All error conditions are properly logged for analysis
• User sessions are handled securely during error states

COMPARISON WITH NORMAL FLOW:
${baseResults}`;

    case 'edge':
      return `EDGE CASE TEST OUTCOMES:
BOUNDARY CONDITION VALIDATION:
• System handles extreme data values without failure
• Performance remains acceptable under stress conditions
• Concurrent operations are managed without data corruption
• Resource constraints are handled gracefully
• System maintains functionality across various configurations
• Error boundaries prevent system crashes
• Recovery mechanisms work under extreme conditions
• Data consistency is maintained at system limits
• User experience remains functional under edge conditions
• System logging captures boundary condition events

BASELINE COMPARISON:
${baseResults}`;

    default:
      return baseResults;
  }
}