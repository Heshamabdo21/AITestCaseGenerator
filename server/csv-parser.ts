import type { UserStory, InsertTestCase } from "@shared/schema";

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
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const testCases: CsvTestCase[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCsvLine(line);
    if (values.length < headers.length) continue;
    
    const testCase: CsvTestCase = {
      id: values[0] || '',
      workItemType: values[1] || '',
      title: values[2] || '',
      testStep: values[3] || '',
      stepAction: values[4] || '',
      stepExpected: values[5] || '',
      areaPath: values[6] || '',
      assignedTo: values[7] || '',
      state: values[8] || ''
    };
    
    testCases.push(testCase);
  }
  
  return testCases;
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
    if (csvCase.title && csvCase.workItemType === 'Test Case') {
      if (!groupedSteps.has(csvCase.title)) {
        groupedSteps.set(csvCase.title, []);
      }
      groupedSteps.get(csvCase.title)!.push(csvCase);
    }
  });
  
  const testCases: InsertTestCase[] = [];
  
  groupedSteps.forEach((steps, title) => {
    // Combine all steps into comprehensive test case
    const prerequisites: string[] = [];
    const testSteps: string[] = [];
    let expectedResult = '';
    
    steps.forEach((step, index) => {
      if (step.stepAction) {
        if (step.stepAction.toLowerCase().includes('precondition')) {
          prerequisites.push(`${index + 1}. ${step.stepAction}`);
        } else {
          testSteps.push(`${index + 1}. ${step.stepAction}`);
        }
      }
      
      if (step.stepExpected) {
        if (expectedResult) {
          expectedResult += `\n${step.stepExpected}`;
        } else {
          expectedResult = step.stepExpected;
        }
      }
    });
    
    // Determine test case type based on content analysis
    let testType = 'Positive';
    const titleLower = title.toLowerCase();
    if (titleLower.includes('negative') || titleLower.includes('error') || titleLower.includes('invalid')) {
      testType = 'Negative';
    } else if (titleLower.includes('security') || titleLower.includes('unauthorized')) {
      testType = 'Security';
    } else if (titleLower.includes('performance') || titleLower.includes('load')) {
      testType = 'Performance';
    }
    
    const testCase: InsertTestCase = {
      title: `${testType} Test: ${title}`,
      objective: `Imported test case to verify: ${title}`,
      prerequisites: prerequisites.length > 0 ? prerequisites.join('\n') : 'No specific prerequisites defined',
      testSteps: testSteps.length > 0 ? testSteps.join('\n') : 'Execute the test scenario as described',
      expectedResult: expectedResult || 'Test should complete successfully according to specified criteria',
      priority: steps[0]?.state === 'Design' ? 'High' : 'Medium',
      testType: 'web',
      status: 'pending',
      userStoryId: userStoryId,
      azureTestCaseId: steps[0]?.id || null
    };
    
    testCases.push(testCase);
  });
  
  return testCases;
}

export function enhanceImportedTestCase(baseTestCase: InsertTestCase): InsertTestCase[] {
  const enhancedCases: InsertTestCase[] = [];
  
  // Create enhanced positive test case
  const positiveCase: InsertTestCase = {
    ...baseTestCase,
    title: baseTestCase.title.replace('Test:', 'Positive Test:'),
    objective: `Enhanced positive testing - ${baseTestCase.objective}`,
    prerequisites: [
      'ENHANCED PREREQUISITES:',
      ...(Array.isArray(baseTestCase.prerequisites) ? baseTestCase.prerequisites : [baseTestCase.prerequisites]),
      '',
      'ADDITIONAL REQUIREMENTS:',
      '- Verify test environment stability',
      '- Confirm user permissions are properly configured',
      '- Ensure all dependent services are operational'
    ],
    testSteps: [
      'ENHANCED TEST EXECUTION:',
      ...(Array.isArray(baseTestCase.testSteps) ? baseTestCase.testSteps : [baseTestCase.testSteps]),
      '',
      'ADDITIONAL VALIDATION STEPS:',
      '- Verify UI responsiveness and loading indicators',
      '- Test data persistence and accuracy',
      '- Confirm proper error handling for edge cases',
      '- Validate multi-language support if applicable'
    ],
    expectedResult: `COMPREHENSIVE EXPECTED RESULTS:
${baseTestCase.expectedResult}

ADDITIONAL VALIDATIONS:
✓ All UI elements function correctly
✓ Data integrity is maintained
✓ Performance meets acceptable standards
✓ Security measures are enforced
✓ User experience is optimized`
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
✓ Graceful degradation occurs when needed`
  };
  
  enhancedCases.push(positiveCase, negativeCase);
  return enhancedCases;
}