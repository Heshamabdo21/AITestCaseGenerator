import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAzureConfigSchema, 
  generateTestCaseRequestSchema,
  insertTestCaseSchema,
  type AzureWorkItem,
  type UserStory,
  type TestCase
} from "@shared/schema";
import OpenAI from "openai";
import { parseCsvTestCases, convertCsvToTestCases, enhanceImportedTestCase } from "./csv-parser";
import multer from "multer";

// Helper function to get or create a test suite in Azure DevOps
async function getOrCreateTestSuite(
  organizationUrl: string,
  project: string,
  testPlanId: string,
  suiteName: string,
  authHeader: string
): Promise<{ id: number; name: string } | null> {
  try {
    // First, get all existing suites in the test plan
    const suitesApiUrl = `${organizationUrl}/${project}/_apis/testplan/Plans/${testPlanId}/suites?api-version=7.0`;
    
    const suitesResponse = await fetch(suitesApiUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!suitesResponse.ok) {
      console.log(`Failed to fetch suites for test plan ${testPlanId}. Status: ${suitesResponse.status}`);
      return null;
    }

    const suitesData = await suitesResponse.json();
    const existingSuites = suitesData.value || [];
    
    // Look for existing suite with the same name
    const existingSuite = existingSuites.find((suite: any) => 
      suite.name === suiteName && suite.suiteType === 'StaticTestSuite'
    );
    
    if (existingSuite) {
      console.log(`Found existing test suite: ${existingSuite.name} (ID: ${existingSuite.id})`);
      return { id: existingSuite.id, name: existingSuite.name };
    }

    // If no existing suite found, create a new one
    console.log(`Creating new test suite: ${suiteName}`);
    
    // Get the root suite to use as parent
    const rootSuite = existingSuites.find((suite: any) => 
      suite.suiteType === 'StaticTestSuite' && (suite.name === 'Root Suite' || suite.parentSuite === null)
    ) || existingSuites[0];

    if (!rootSuite) {
      console.log(`No root suite found in test plan ${testPlanId}`);
      return null;
    }

    // Create new test suite
    const createSuiteUrl = `${organizationUrl}/${project}/_apis/testplan/Plans/${testPlanId}/suites?api-version=7.0`;
    
    const createSuiteBody = {
      suiteType: 'StaticTestSuite',
      name: suiteName,
      parentSuite: {
        id: rootSuite.id
      }
    };

    const createResponse = await fetch(createSuiteUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createSuiteBody)
    });

    if (createResponse.ok) {
      const newSuite = await createResponse.json();
      console.log(`Successfully created test suite: ${newSuite.name} (ID: ${newSuite.id})`);
      return { id: newSuite.id, name: newSuite.name };
    } else {
      const errorText = await createResponse.text();
      console.log(`Failed to create test suite. Status: ${createResponse.status}, Error: ${errorText}`);
      
      // Fall back to root suite if creation fails
      return { id: rootSuite.id, name: rootSuite.name };
    }
  } catch (error) {
    console.log(`Error in getOrCreateTestSuite: ${error}`);
    return null;
  }
}

// Helper function to get the root test suite (for when test suite creation is disabled)
async function getRootTestSuite(
  organizationUrl: string,
  project: string,
  testPlanId: string,
  authHeader: string
): Promise<{ id: number; name: string } | null> {
  try {
    const suitesApiUrl = `${organizationUrl}/${project}/_apis/testplan/Plans/${testPlanId}/suites?api-version=7.0`;
    
    const suitesResponse = await fetch(suitesApiUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!suitesResponse.ok) {
      console.log(`Failed to fetch suites for test plan ${testPlanId}. Status: ${suitesResponse.status}`);
      return null;
    }

    const suitesData = await suitesResponse.json();
    const existingSuites = suitesData.value || [];
    
    // Find the root suite
    const rootSuite = existingSuites.find((suite: any) => 
      suite.suiteType === 'StaticTestSuite' && (suite.name === 'Root Suite' || suite.parentSuite === null)
    ) || existingSuites[0];

    if (rootSuite) {
      console.log(`Using root test suite: ${rootSuite.name} (ID: ${rootSuite.id})`);
      return { id: rootSuite.id, name: rootSuite.name };
    }

    console.log(`No root suite found in test plan ${testPlanId}`);
    return null;
  } catch (error) {
    console.log(`Error in getRootTestSuite: ${error}`);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Helper function to generate import recommendations
  function generateImportRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    if (analysis.totalRows > 100) {
      recommendations.push("Large file detected. Consider breaking into smaller batches for better performance.");
    }
    
    if (analysis.hasTestSteps < analysis.totalRows * 0.5) {
      recommendations.push("Many rows are missing test step actions. Review data completeness before importing.");
    }
    
    if (analysis.hasExpectedResults < analysis.totalRows * 0.3) {
      recommendations.push("Consider adding expected results to improve test case quality.");
    }
    
    if (analysis.workItemTypes.length > 1) {
      recommendations.push(`Multiple work item types found: ${analysis.workItemTypes.join(', ')}. Only 'Test Case' types will be imported.`);
    }
    
    if (analysis.uniqueTitles < analysis.totalRows * 0.8) {
      recommendations.push("Many duplicate titles detected. Test steps will be grouped by title during import.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("CSV file looks good for import. All validation checks passed.");
    }
    
    return recommendations;
  }

  // Enhanced CSV Import endpoint with validation and preview
  app.post("/api/test-cases/import-csv", upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      const { enhanceTestCases = true, userStoryId } = req.body;
      const csvContent = req.file.buffer.toString('utf-8');
      
      // Validate and parse CSV
      const csvTestCases = parseCsvTestCases(csvContent);
      
      if (csvTestCases.length === 0) {
        return res.status(400).json({ message: "No valid test cases found in CSV" });
      }

      // Get or create user story
      let targetUserStory;
      if (userStoryId) {
        targetUserStory = await storage.getUserStory(parseInt(userStoryId));
        if (!targetUserStory) {
          return res.status(400).json({ message: "Invalid user story ID provided" });
        }
      } else {
        // Create a new user story for imported test cases
        targetUserStory = await storage.createUserStory({
          azureId: `imported-${Date.now()}`,
          title: `CSV Import - ${req.file.originalname}`,
          description: `Test cases imported from CSV file: ${req.file.originalname}`,
          acceptanceCriteria: "All imported test cases should be properly validated and executable",
          state: "Active",
          assignedTo: "QA Team",
          priority: "Medium",
          createdDate: new Date().toISOString(),
          tags: ["imported", "csv", "automated-import"],
          configId: 1
        });
      }

      const convertedTestCases = convertCsvToTestCases(csvTestCases, targetUserStory.id);
      const importedTestCases = [];
      const importStats = {
        total: 0,
        enhanced: 0,
        categories: {} as Record<string, number>
      };

      // Import base test cases
      for (const testCase of convertedTestCases) {
        const created = await storage.createTestCase(testCase);
        importedTestCases.push(created);
        importStats.total++;
        
        // Track categories
        const category = testCase.title.split(' ')[0];
        importStats.categories[category] = (importStats.categories[category] || 0) + 1;
        
        // Create enhanced versions if requested
        if (enhanceTestCases === 'true' || enhanceTestCases === true) {
          const enhancedCases = enhanceImportedTestCase(testCase);
          for (const enhanced of enhancedCases) {
            const enhancedCreated = await storage.createTestCase(enhanced);
            importedTestCases.push(enhancedCreated);
            importStats.enhanced++;
          }
        }
      }

      res.json({
        success: true,
        message: `Successfully imported ${importStats.total} test cases${importStats.enhanced > 0 ? ` with ${importStats.enhanced} enhanced variations` : ''}`,
        stats: importStats,
        testCases: importedTestCases,
        userStory: targetUserStory,
        fileName: req.file.originalname
      });
    } catch (error: any) {
      console.error('CSV Import Error:', error);
      res.status(500).json({ 
        success: false,
        message: `Import failed: ${error.message}`,
        details: error.stack
      });
    }
  });

  // CSV Preview endpoint for validation before import
  app.post("/api/test-cases/preview-csv", upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const csvTestCases = parseCsvTestCases(csvContent);
      
      // Generate preview without saving to storage
      const preview = csvTestCases.slice(0, 5).map(csvCase => ({
        originalData: csvCase,
        processedPreview: {
          title: csvCase.title,
          workItemType: csvCase.workItemType,
          stepAction: csvCase.stepAction?.substring(0, 100) + (csvCase.stepAction?.length > 100 ? '...' : ''),
          stepExpected: csvCase.stepExpected?.substring(0, 100) + (csvCase.stepExpected?.length > 100 ? '...' : '')
        }
      }));

      const analysis = {
        totalRows: csvTestCases.length,
        uniqueTitles: Array.from(new Set(csvTestCases.map(tc => tc.title))).length,
        workItemTypes: Array.from(new Set(csvTestCases.map(tc => tc.workItemType))),
        hasTestSteps: csvTestCases.filter(tc => tc.stepAction).length,
        hasExpectedResults: csvTestCases.filter(tc => tc.stepExpected).length
      };

      res.json({
        success: true,
        preview,
        analysis,
        fileName: req.file.originalname,
        recommendations: generateImportRecommendations(analysis)
      });
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        message: `Preview failed: ${error.message}` 
      });
    }
  });

  // Generate CSV template for test case import
  app.get("/api/test-cases/csv-template", (req, res) => {
    const template = `ID,WorkItemType,Title,TestStep,StepAction,StepExpected,AreaPath,AssignedTo,State
1,Test Case,Login Functionality Test,1,Navigate to login page,Login page displays correctly,MyProject\\UI,tester@company.com,Active
1,Test Case,Login Functionality Test,2,Enter valid username and password,Credentials are accepted,MyProject\\UI,tester@company.com,Active
1,Test Case,Login Functionality Test,3,Click login button,User is successfully logged in and redirected,MyProject\\UI,tester@company.com,Active
2,Test Case,Negative Login Test,1,Navigate to login page,Login page displays correctly,MyProject\\Security,tester@company.com,Design
2,Test Case,Negative Login Test,2,Enter invalid credentials,Error message is displayed,MyProject\\Security,tester@company.com,Design
3,Test Case,Performance Load Test,1,Precondition: Set up load testing environment,Environment is ready for testing,MyProject\\Performance,perf-tester@company.com,Active
3,Test Case,Performance Load Test,2,Execute load test with 100 concurrent users,System maintains response time under 2 seconds,MyProject\\Performance,perf-tester@company.com,Active`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="test_cases_template.csv"');
    res.send(template);
  });

  // Azure DevOps Configuration
  app.post("/api/azure-config", async (req, res) => {
    try {
      const configData = insertAzureConfigSchema.parse(req.body);
      const config = await storage.createAzureConfig(configData);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update Azure DevOps Configuration
  app.put("/api/azure-config/:id", async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      const configData = insertAzureConfigSchema.partial().parse(req.body);
      const config = await storage.updateAzureConfig(configId, configData);
      if (!config) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/azure-config/latest", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No configuration found" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Test Azure DevOps connection
  app.post("/api/azure-config/test", async (req, res) => {
    try {
      const { organizationUrl, patToken, project } = req.body;
      
      if (!organizationUrl || !patToken || !project) {
        return res.status(400).json({ message: "Missing required configuration" });
      }

      // Test with a simple project endpoint instead of work items
      const apiUrl = `${organizationUrl}/_apis/projects/${project}?api-version=7.0`;
      const authHeader = `Basic ${Buffer.from(`:${patToken}`).toString('base64')}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}`);
      }

      res.json({ success: true, message: "Connection successful" });
    } catch (error: any) {
      res.status(400).json({ message: `Connection failed: ${error.message}` });
    }
  });

  // Fetch projects from Azure DevOps
  app.post("/api/azure-devops/projects", async (req, res) => {
    try {
      const { organizationUrl, patToken } = req.body;
      
      if (!organizationUrl || !patToken) {
        return res.status(400).json({ message: "Missing organization URL or PAT token" });
      }

      const apiUrl = `${organizationUrl}/_apis/projects?api-version=7.0`;
      const authHeader = `Basic ${Buffer.from(`:${patToken}`).toString('base64')}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data.value || []);
    } catch (error: any) {
      res.status(400).json({ message: `Failed to fetch projects: ${error.message}` });
    }
  });

  // Fetch iteration paths from Azure DevOps
  app.post("/api/azure-devops/iterations", async (req, res) => {
    try {
      const { organizationUrl, patToken, project } = req.body;
      
      if (!organizationUrl || !patToken || !project) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const apiUrl = `${organizationUrl}/${project}/_apis/work/teamsettings/iterations?api-version=7.0`;
      const authHeader = `Basic ${Buffer.from(`:${patToken}`).toString('base64')}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data.value || []);
    } catch (error: any) {
      res.status(400).json({ message: `Failed to fetch iteration paths: ${error.message}` });
    }
  });

  // Fetch user stories from Azure DevOps
  app.get("/api/user-stories", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      // First, get work item IDs using a query with optional iteration path filter
      const queryUrl = `${config.organizationUrl}/${config.project}/_apis/wit/wiql?api-version=7.0`;
      
      let query = "SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'User Story'";
      if (config.iterationPath && config.iterationPath !== 'all' && config.iterationPath.trim() !== '') {
        query += ` AND [System.IterationPath] UNDER '${config.iterationPath}'`;
      }
      query += " ORDER BY [System.CreatedDate] DESC";
      
      const queryPayload = {
        query: query
      };

      const authHeader = `Basic ${Buffer.from(`:${config.patToken}`).toString('base64')}`;
      
      const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryPayload)
      });

      if (!queryResponse.ok) {
        throw new Error(`Azure DevOps Query API error: ${queryResponse.status} ${queryResponse.statusText}`);
      }

      const queryData = await queryResponse.json();
      const workItemIds = queryData.workItems?.map((item: any) => item.id) || [];

      if (workItemIds.length === 0) {
        return res.json([]);
      }

      // Now fetch the actual work items with their details
      const apiUrl = `${config.organizationUrl}/${config.project}/_apis/wit/workitems?ids=${workItemIds.slice(0, 50).join(',')}&api-version=7.0&$expand=All`;
      
      console.log(`Fetching work items from: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Azure DevOps API error: ${response.status} ${response.statusText}`);
        console.error(`Error details: ${errorText}`);
        console.error(`Request URL: ${apiUrl}`);
        throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
      }

      const data = await response.json();
      const workItems: AzureWorkItem[] = data.value || [];

      // Store user stories in memory
      const userStories: UserStory[] = [];
      for (const item of workItems) {
        const tags = item.fields["System.Tags"] ? item.fields["System.Tags"].split(";").map(t => t.trim()) : [];
        
        // Extract acceptance criteria from the available field
        const acceptanceCriteria = item.fields["Microsoft.VSTS.Common.AcceptanceCriteria"] || 
                                 (item.fields["System.Description"] && item.fields["System.Description"].includes("AC") ? item.fields["System.Description"] : "") ||
                                 "";
        
        const userStory = await storage.upsertUserStory({
          azureId: item.id.toString(),
          title: item.fields["System.Title"],
          description: item.fields["System.Description"] || "",
          acceptanceCriteria,
          state: item.fields["System.State"],
          assignedTo: item.fields["System.AssignedTo"]?.displayName || "",
          priority: item.fields["Microsoft.VSTS.Common.Priority"]?.toString() || "Medium",
          createdDate: item.fields["System.CreatedDate"],
          tags,
          configId: config.id,
        });
        
        userStories.push(userStory);
      }

      res.json(userStories);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to fetch user stories: ${error.message}` });
    }
  });

  // Get stored user stories
  app.get("/api/user-stories/stored", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No configuration found" });
      }

      const userStories = await storage.getUserStories(config.id);
      res.json(userStories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate test cases using AI
  app.post("/api/test-cases/generate", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const request = generateTestCaseRequestSchema.parse(req.body);
      console.log("Test case generation request:", JSON.stringify(request, null, 2));
      
      const userStories = await storage.getUserStoriesByIds(request.userStoryIds);
      console.log(`Found ${userStories.length} user stories for IDs:`, request.userStoryIds);
      console.log("User stories:", userStories.map(s => ({ id: s.id, title: s.title })));

      if (userStories.length === 0) {
        return res.status(404).json({ message: "No user stories found" });
      }

      // Temporarily bypass OpenAI to debug user story selection
      const generatedTestCases: TestCase[] = [];

      // Get test data, environment, and AI configurations
      const azureConfig = await storage.getLatestAzureConfig();
      let testDataConfig = null;
      let environmentConfig = null;
      let aiConfig = null;
      
      if (azureConfig) {
        testDataConfig = await storage.getTestDataConfig(azureConfig.id);
        environmentConfig = await storage.getEnvironmentConfig(azureConfig.id);
        aiConfig = await storage.getAiConfiguration(azureConfig.id);
      }

      // Import the test case generator
      const { generateSeparateTestCases } = await import('./test-case-generator');

      // Create and store test cases based on user stories
      for (const story of userStories) {
        console.log(`Processing story: ${story.id} - ${story.title}`);
        console.log(`Acceptance Criteria: ${story.acceptanceCriteria || 'Not provided'}`);
        
        // Generate separate test cases for each type using the generator
        const testCasesToCreate = generateSeparateTestCases(story, testDataConfig || null, environmentConfig || null, aiConfig || null);
        
        for (const testCaseData of testCasesToCreate) {
          const created = await storage.createTestCase(testCaseData);
          console.log(`Created ${testCaseData.title.split(':')[0]} test case with ID: ${created.id}`);
          generatedTestCases.push(created);
        }
      }

      // Skip OpenAI processing for now - using enhanced generator instead
      /*
      for (const story of userStories) {
        const prompt = `Generate test cases for the following user story:

Title: ${story.title}
Description: ${story.description}
Acceptance Criteria: ${story.acceptanceCriteria}
Priority: ${story.priority}

Requirements:
- Style: ${request.style}
- Coverage Level: ${request.coverageLevel}
- Include Negative Tests: ${request.includeNegative}
- Include Performance Tests: ${request.includePerformance}

Generate ${request.coverageLevel === 'comprehensive' ? '4-6' : request.coverageLevel === 'standard' ? '2-4' : '1-2'} test cases.

For each test case, provide the following in JSON format:
{
  "testCases": [
    {
      "title": "Test case title",
      "objective": "Clear objective of what this test validates",
      "prerequisites": ["List of prerequisites"],
      "testSteps": ["Step 1", "Step 2", "etc."],
      "expectedResult": "Expected outcome",
      "priority": "High|Medium|Low"
    }
  ]
}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert QA engineer specializing in comprehensive test case design. Generate detailed, executable test cases that follow industry best practices. Always respond in valid JSON format."
            },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        
        if (result.testCases && Array.isArray(result.testCases)) {
          for (const testCase of result.testCases) {
            const created = await storage.createTestCase({
              title: testCase.title,
              objective: testCase.objective,
              prerequisites: testCase.prerequisites || [],
              testSteps: testCase.testSteps || [],
              expectedResult: testCase.expectedResult,
              priority: testCase.priority || "Medium",
              status: "pending",
              userStoryId: story.id,
              azureTestCaseId: null,
            });
            generatedTestCases.push(created);
          }
        }
      }
      */

      res.json(generatedTestCases);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to generate test cases: ${error.message}` });
    }
  });

  // Get all test cases
  app.get("/api/test-cases", async (req, res) => {
    try {
      const testCases = await storage.getTestCases();
      res.json(testCases);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Export test cases to Excel
  app.get("/api/test-cases/export", async (req, res) => {
    try {
      const XLSX = await import('xlsx');
      const testCases = await storage.getTestCases();
      
      if (testCases.length === 0) {
        return res.status(400).json({ message: "No test cases to export" });
      }

      // Prepare data for Excel export
      const excelData = testCases.map((testCase, index) => ({
        'Test Case ID': `TC-${String(testCase.id).padStart(3, '0')}`,
        'Title': testCase.title,
        'Objective': testCase.objective,
        'Prerequisites': Array.isArray(testCase.prerequisites) ? testCase.prerequisites.join('\n') : testCase.prerequisites || '',
        'Test Steps': Array.isArray(testCase.testSteps) ? testCase.testSteps.map((step, i) => `${i + 1}. ${step}`).join('\n') : testCase.testSteps || '',
        'Expected Result': testCase.expectedResult,
        'Priority': testCase.priority,
        'Status': testCase.status,
        'Test Type': testCase.testType,
        'User Story ID': testCase.userStoryId,
        'Azure Test Case ID': testCase.azureTestCaseId || 'Not Linked',
        'Created Date': testCase.createdAt ? new Date(testCase.createdAt).toLocaleDateString() : ''
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Test Case ID
        { wch: 40 }, // Title
        { wch: 50 }, // Objective
        { wch: 40 }, // Prerequisites
        { wch: 60 }, // Test Steps
        { wch: 40 }, // Expected Result
        { wch: 12 }, // Priority
        { wch: 12 }, // Status
        { wch: 15 }, // Test Type
        { wch: 15 }, // User Story ID
        { wch: 20 }, // Azure Test Case ID
        { wch: 15 }  // Created Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers for file download
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `test-cases-export-${timestamp}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    } catch (error: any) {
      console.error('Excel export error:', error);
      res.status(500).json({ message: `Failed to export test cases: ${error.message}` });
    }
  });

  // Update test case status
  app.patch("/api/test-cases/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const testCase = await storage.updateTestCase(id, { status });
      if (!testCase) {
        return res.status(404).json({ message: "Test case not found" });
      }

      res.json(testCase);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add approved test cases to Azure DevOps
  app.post("/api/test-cases/add-to-azure", async (req, res) => {
    try {
      const { testCaseIds } = req.body;
      
      if (!testCaseIds || !Array.isArray(testCaseIds)) {
        return res.status(400).json({ message: "Invalid test case IDs" });
      }

      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const testCases = await storage.getTestCasesByIds(testCaseIds);
      const approvedTests = testCases.filter(tc => tc.status === "approved");

      if (approvedTests.length === 0) {
        return res.status(400).json({ message: "No approved test cases found" });
      }

      const results = [];
      
      for (const testCase of approvedTests) {
        try {
          // Get the linked user story for this test case
          let userStory = null;
          if (testCase.userStoryId && typeof testCase.userStoryId === 'number') {
            userStory = await storage.getUserStory(testCase.userStoryId);
          }
          
          // Get test data and environment configurations
          const testDataConfig = await storage.getTestDataConfig(config.id);
          const environmentConfig = await storage.getEnvironmentConfig(config.id);
          
          // Create test case in Azure DevOps with proper linking
          const testSteps = testCase.testSteps || [];
          const apiUrl = `${config.organizationUrl}/${config.project}/_apis/wit/workitems/$Test Case?api-version=7.0`;
          const authHeader = `Basic ${Buffer.from(`:${config.patToken}`).toString('base64')}`;

          // Build enhanced description with test data and environment info
          let enhancedDescription = testCase.objective;
          
          if (testDataConfig || environmentConfig) {
            enhancedDescription += "\n\n--- Configuration Details ---\n";
            
            if (testDataConfig) {
              enhancedDescription += "\nTest Data Configuration:\n";
              if (testDataConfig.username) enhancedDescription += `• Username: ${testDataConfig.username}\n`;
              if (testDataConfig.webPortalUrl) enhancedDescription += `• Portal URL: ${testDataConfig.webPortalUrl}\n`;
              if (testDataConfig.additionalData) enhancedDescription += `• Additional Data: ${JSON.stringify(testDataConfig.additionalData)}\n`;
            }
            
            if (environmentConfig) {
              enhancedDescription += "\nEnvironment Configuration:\n";
              if (environmentConfig.operatingSystem) enhancedDescription += `• Operating System: ${environmentConfig.operatingSystem}\n`;
              if (environmentConfig.webBrowser) enhancedDescription += `• Browser: ${environmentConfig.webBrowser}\n`;
              if (environmentConfig.browserVersion) enhancedDescription += `• Browser Version: ${environmentConfig.browserVersion}\n`;
              if (environmentConfig.osVersion) enhancedDescription += `• OS Version: ${environmentConfig.osVersion}\n`;
            }
          }

          // Build the patch operations for creating the test case
          const patchOperations = [
            {
              op: "add",
              path: "/fields/System.Title",
              value: testCase.title
            },
            {
              op: "add", 
              path: "/fields/System.Description",
              value: enhancedDescription
            },
            {
              op: "add",
              path: "/fields/Microsoft.VSTS.Common.Priority", 
              value: testCase.priority === "High" ? 1 : testCase.priority === "Medium" ? 2 : 3
            }
          ];

          // Add test steps if available, including configuration setup steps
          if (testCase.testSteps && typeof testCase.testSteps === 'string') {
            // Parse test steps from string format
            const testStepsArray = testCase.testSteps.split('\n').filter(step => step.trim());
            const enhancedSteps = testStepsArray.slice();
            
            // Add configuration verification steps at the beginning
            if (testDataConfig || environmentConfig) {
              enhancedSteps.unshift("CONFIGURATION VERIFICATION:");
              
              if (environmentConfig) {
                if (environmentConfig.webBrowser) {
                  enhancedSteps.splice(1, 0, `Verify browser is ${environmentConfig.webBrowser}${environmentConfig.browserVersion ? ' ' + environmentConfig.browserVersion : ''}`);
                }
                if (environmentConfig.operatingSystem) {
                  enhancedSteps.splice(1, 0, `Confirm operating system is ${environmentConfig.operatingSystem}${environmentConfig.osVersion ? ' ' + environmentConfig.osVersion : ''}`);
                }
              }
              
              if (testDataConfig) {
                if (testDataConfig.webPortalUrl) {
                  enhancedSteps.splice(1, 0, `Navigate to test portal: ${testDataConfig.webPortalUrl}`);
                }
                if (testDataConfig.username) {
                  enhancedSteps.splice(1, 0, `Prepare test credentials for user: ${testDataConfig.username}`);
                }
              }
              
              enhancedSteps.splice(1, 0, "");
            }
            
            const formattedSteps = enhancedSteps.map((step, index) => {
              const escapedStep = step.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              return `<step id="${index + 1}" type="ActionStep"><parameterizedString isformatted="true">&lt;DIV&gt;&lt;P&gt;${escapedStep}&lt;/P&gt;&lt;/DIV&gt;</parameterizedString><parameterizedString isformatted="true">&lt;DIV&gt;&lt;P&gt;${index === enhancedSteps.length - 1 ? testCase.expectedResult : 'Step completed successfully'}&lt;/P&gt;&lt;/DIV&gt;</parameterizedString><description/></step>`;
            }).join("");
            
            patchOperations.push({
              op: "add",
              path: "/fields/Microsoft.VSTS.TCM.Steps",
              value: `<steps id="0" last="${enhancedSteps.length}">${formattedSteps}</steps>`
            });
          }

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json-patch+json'
            },
            body: JSON.stringify(patchOperations)
          });

          if (response.ok) {
            const azureTestCase = await response.json();
            
            // Link the test case to the user story if both exist in Azure
            if (userStory && userStory.azureId) {
              try {
                const linkApiUrl = `${config.organizationUrl}/${config.project}/_apis/wit/workitems/${azureTestCase.id}?api-version=7.0`;
                
                const linkOperation = [{
                  op: "add",
                  path: "/relations/-",
                  value: {
                    rel: "Microsoft.VSTS.Common.TestedBy-Reverse",
                    url: `${config.organizationUrl}/${config.project}/_apis/wit/workItems/${userStory.azureId}`,
                    attributes: {
                      comment: `Test case created for user story: ${userStory.title}`
                    }
                  }
                }];

                const linkResponse = await fetch(linkApiUrl, {
                  method: 'PATCH',
                  headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json-patch+json'
                  },
                  body: JSON.stringify(linkOperation)
                });

                if (linkResponse.ok) {
                  console.log(`Successfully linked test case ${azureTestCase.id} to user story ${userStory.azureId}`);
                } else {
                  console.log(`Warning: Could not link test case to user story. Status: ${linkResponse.status}`);
                }
              } catch (linkError) {
                console.log("Warning: Could not create link to user story:", linkError);
              }
            }

            // Add test case to test plan if configured
            if (config.testPlanId && config.testPlanId !== 'none' && config.testPlanId.trim() !== '') {
              try {
                console.log(`Attempting to add test case ${azureTestCase.id} to test plan ${config.testPlanId}`);
                
                // Determine suite name based on configuration strategy
                let suiteName = 'Test Cases';
                
                if (config.createTestSuites && config.testSuiteStrategy) {
                  switch (config.testSuiteStrategy) {
                    case 'user_story':
                      suiteName = userStory ? 
                        `${userStory.title} (ID: ${userStory.azureId})` : 
                        'General Test Cases';
                      break;
                    case 'test_type':
                      suiteName = `${testCase.testType || 'Functional'} Tests`;
                      break;
                    case 'single':
                      suiteName = 'Generated Test Cases';
                      break;
                  }
                }
                
                // Get or create appropriate test suite (or use root if disabled)
                const targetSuite = config.createTestSuites ? 
                  await getOrCreateTestSuite(
                    config.organizationUrl,
                    config.project,
                    config.testPlanId,
                    suiteName,
                    authHeader
                  ) :
                  await getRootTestSuite(
                    config.organizationUrl,
                    config.project,
                    config.testPlanId,
                    authHeader
                  );
                
                if (targetSuite) {
                  console.log(`Using suite ${targetSuite.id} (${targetSuite.name}) for test case assignment`);
                  
                  // Add test case to the suite
                  const addTestCaseUrl = `${config.organizationUrl}/${config.project}/_apis/testplan/Plans/${config.testPlanId}/Suites/${targetSuite.id}/TestCase/${azureTestCase.id}?api-version=7.0`;
                  
                  const addTestCaseResponse = await fetch(addTestCaseUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': authHeader,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (addTestCaseResponse.ok) {
                    console.log(`Successfully added test case ${azureTestCase.id} to test plan ${config.testPlanId}, suite ${targetSuite.id}`);
                  } else {
                    const errorText = await addTestCaseResponse.text();
                    console.log(`Warning: Could not add test case to test plan. Status: ${addTestCaseResponse.status}, Error: ${errorText}`);
                  }
                } else {
                  console.log(`Could not find or create suitable suite in test plan ${config.testPlanId}`);
                }
              } catch (testPlanError) {
                console.log("Warning: Could not add test case to test plan:", testPlanError);
              }
            } else {
              console.log(`Test plan not configured or invalid. testPlanId: ${config.testPlanId}`);
            }
            
            await storage.updateTestCase(testCase.id, { azureTestCaseId: azureTestCase.id.toString() });
            results.push({ testCaseId: testCase.id, azureId: azureTestCase.id, success: true, userStoryLink: userStory?.azureId || null });
          } else {
            const errorText = await response.text();
            results.push({ testCaseId: testCase.id, success: false, error: `Azure API error: ${response.status} - ${errorText}` });
          }
        } catch (error: any) {
          results.push({ testCaseId: testCase.id, success: false, error: error.message });
        }
      }

      res.json({ 
        message: `Processed ${results.length} test cases`,
        results,
        successCount: results.filter(r => r.success).length
      });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to add test cases to Azure DevOps: ${error.message}` });
    }
  });

  // Test Data Configuration API
  app.post("/api/test-data-config", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const testDataConfig = await storage.createTestDataConfig({
        ...req.body,
        configId: config.id
      });
      res.json(testDataConfig);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/test-data-config", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const testDataConfig = await storage.getTestDataConfig(config.id);
      res.json(testDataConfig || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Environment Configuration API
  app.post("/api/environment-config", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const environmentConfig = await storage.createEnvironmentConfig({
        ...req.body,
        configId: config.id
      });
      res.json(environmentConfig);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/environment-config", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const environmentConfig = await storage.getEnvironmentConfig(config.id);
      res.json(environmentConfig || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Configuration API
  app.post("/api/ai-configuration", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const aiConfig = await storage.createAiConfiguration({
        ...req.body,
        configId: config.id
      });
      res.json(aiConfig);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/ai-configuration", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const aiConfig = await storage.getAiConfiguration(config.id);
      res.json(aiConfig || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update configuration endpoints
  app.patch("/api/test-data-config", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const updated = await storage.updateTestDataConfig(config.id, req.body);
      if (!updated) {
        // If no existing config, create a new one
        const newConfig = await storage.createTestDataConfig({
          ...req.body,
          configId: config.id
        });
        return res.json(newConfig);
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/environment-config", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const updated = await storage.updateEnvironmentConfig(config.id, req.body);
      if (!updated) {
        // If no existing config, create a new one
        const newConfig = await storage.createEnvironmentConfig({
          ...req.body,
          configId: config.id
        });
        return res.json(newConfig);
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/ai-configuration", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const updated = await storage.updateAiConfiguration(config.id, req.body);
      if (!updated) {
        // If no existing AI config, create a new one
        const newConfig = await storage.createAiConfiguration({
          ...req.body,
          configId: config.id
        });
        return res.json(newConfig);
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // AI Context API
  app.post("/api/ai-context", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const aiContext = await storage.createOrUpdateAiContext({
        ...req.body,
        configId: config.id
      });
      res.json(aiContext);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/ai-context", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const aiContext = await storage.getAiContext(config.id);
      res.json(aiContext || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get Azure DevOps test plans
  app.get("/api/azure/test-plans", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const apiUrl = `${config.organizationUrl}/${config.project}/_apis/testplan/plans?api-version=7.0`;
      const authHeader = `Basic ${Buffer.from(`:${config.patToken}`).toString('base64')}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Azure DevOps Test Plans API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const testPlans = data.value || [];

      res.json(testPlans.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        state: plan.state,
        startDate: plan.startDate,
        endDate: plan.endDate
      })));
    } catch (error: any) {
      res.status(500).json({ message: `Failed to fetch test plans: ${error.message}` });
    }
  });

  // Get Azure DevOps iteration paths
  app.get("/api/azure/iterations", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      const apiUrl = `${config.organizationUrl}/${config.project}/_apis/wit/classificationnodes/iterations?$depth=3&api-version=7.0`;
      const authHeader = `Basic ${Buffer.from(`:${config.patToken}`).toString('base64')}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Azure DevOps Iterations API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Flatten the iteration tree structure
      const flattenIterations = (node: any, parentPath = ''): any[] => {
        const currentPath = parentPath ? `${parentPath}\\${node.name}` : node.name;
        let iterations = [{
          id: node.id,
          name: node.name,
          path: currentPath,
          hasChildren: node.hasChildren
        }];

        if (node.children) {
          node.children.forEach((child: any) => {
            iterations = iterations.concat(flattenIterations(child, currentPath));
          });
        }

        return iterations;
      };

      const iterations = flattenIterations(data);
      res.json(iterations);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to fetch iterations: ${error.message}` });
    }
  });

  // Health check endpoint for Docker
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
