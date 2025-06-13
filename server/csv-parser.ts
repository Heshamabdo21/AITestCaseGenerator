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
  
  // Validate required headers
  const requiredFields = ['id', 'title', 'workitemtype'];
  const missingFields = requiredFields.filter(field => 
    !headers.some(header => header.includes(field))
  );
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required CSV columns: ${missingFields.join(', ')}`);
  }
  
  // Create header mapping for flexible column order
  const headerMap = createHeaderMapping(headers);
  const testCases: CsvTestCase[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.split(',').every(cell => !cell.trim())) continue;
    
    const values = parseCsvLine(line);
    if (values.length === 0) continue;
    
    try {
      const testCase = mapCsvRowToTestCase(values, headerMap);
      if (testCase.id && testCase.title) {
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
    } else if (cleanHeader.includes('workitemtype') || cleanHeader.includes('type')) {
      mapping.workItemType = index;
    } else if (cleanHeader.includes('title') || cleanHeader.includes('name')) {
      mapping.title = index;
    } else if (cleanHeader.includes('teststep') || cleanHeader.includes('step')) {
      mapping.testStep = index;
    } else if (cleanHeader.includes('stepaction') || cleanHeader.includes('action')) {
      mapping.stepAction = index;
    } else if (cleanHeader.includes('stepexpected') || cleanHeader.includes('expected')) {
      mapping.stepExpected = index;
    } else if (cleanHeader.includes('areapath') || cleanHeader.includes('area')) {
      mapping.areaPath = index;
    } else if (cleanHeader.includes('assignedto') || cleanHeader.includes('assigned')) {
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
  
  // Create enhanced positive test case
  const positiveCase: InsertTestCase = {
    ...baseTestCase,
    title: baseTestCase.title.replace('Test:', 'Positive Test:'),
    objective: `Enhanced positive testing - ${baseTestCase.objective}`,
    prerequisites: `ENHANCED PREREQUISITES:
${baseTestCase.prerequisites}

ADDITIONAL REQUIREMENTS:
- Verify test environment stability
- Confirm user permissions are properly configured
- Ensure all dependent services are operational`,
    testSteps: `ENHANCED TEST EXECUTION:
${baseTestCase.testSteps}

ADDITIONAL VALIDATION STEPS:
- Verify UI responsiveness and loading indicators
- Test data persistence and accuracy
- Confirm proper error handling for edge cases
- Validate multi-language support if applicable`,
    expectedResult: `COMPREHENSIVE EXPECTED RESULTS:
${baseTestCase.expectedResult}

ADDITIONAL VALIDATIONS:
✓ All UI elements function correctly
✓ Data integrity is maintained
✓ Performance meets acceptable standards
✓ Security measures are enforced
✓ User experience is optimized`,
    testPassword: baseTestCase.testPassword, // Inherit from base test case
    requiredPermissions: baseTestCase.requiredPermissions // Inherit permissions
  };
  
  // Create comprehensive negative test case
  const negativeCase: InsertTestCase = {
    ...baseTestCase,
    title: baseTestCase.title.replace('Test:', 'Negative Test:'),
    objective: `Negative testing to ensure error handling - ${baseTestCase.objective}`,
    prerequisites: `NEGATIVE TEST PREREQUISITES:
${baseTestCase.prerequisites}

ADDITIONAL SETUP:
- Prepare invalid test data scenarios
- Configure error monitoring tools
- Set up boundary condition test cases`,
    testSteps: `NEGATIVE TEST SCENARIOS:
1. Test with invalid user credentials
2. Attempt unauthorized access to restricted features
3. Submit forms with missing required fields
4. Input invalid data formats and special characters
5. Test with network interruptions
6. Attempt concurrent operations that may conflict
7. Test system behavior under resource constraints

BASED ON ORIGINAL FLOW:
${baseTestCase.testSteps}`,
    expectedResult: `NEGATIVE TEST EXPECTED RESULTS:
✓ Invalid inputs are rejected with clear error messages
✓ Unauthorized access attempts are blocked
✓ System remains stable under error conditions
✓ Appropriate user guidance is provided
✓ Security measures prevent malicious activities
✓ Data integrity is maintained during failures
✓ Graceful degradation occurs when needed`,
    testPassword: baseTestCase.testPassword, // Inherit from base test case
    requiredPermissions: baseTestCase.requiredPermissions // Inherit permissions
  };
  
  enhancedCases.push(positiveCase, negativeCase);
  return enhancedCases;
}