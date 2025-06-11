import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAzureConfigSchema, 
  generateTestCaseRequestSchema,
  type AzureWorkItem,
  type UserStory,
  type TestCase
} from "@shared/schema";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
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

      // First, get work item IDs using a query
      const queryUrl = `${config.organizationUrl}/${config.project}/_apis/wit/wiql?api-version=7.0`;
      const queryPayload = {
        query: "SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' ORDER BY [System.CreatedDate] DESC"
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
        throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const workItems: AzureWorkItem[] = data.value || [];

      // Store user stories in memory
      const userStories: UserStory[] = [];
      for (const item of workItems) {
        const tags = item.fields["System.Tags"] ? item.fields["System.Tags"].split(";").map(t => t.trim()) : [];
        
        // Extract acceptance criteria from the description or dedicated field
        const acceptanceCriteria = item.fields["Microsoft.VSTS.Common.AcceptanceCriteria"] || 
                                 item.fields["System.Description"] || 
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

      // Get test data and environment configurations
      const azureConfig = await storage.getLatestAzureConfig();
      let testDataConfig = null;
      let environmentConfig = null;
      
      if (azureConfig) {
        testDataConfig = await storage.getTestDataConfig(azureConfig.id);
        environmentConfig = await storage.getEnvironmentConfig(azureConfig.id);
      }

      // Create and store test cases based on user stories
      for (const story of userStories) {
        console.log(`Processing story: ${story.id} - ${story.title}`);
        console.log(`Acceptance Criteria: ${story.acceptanceCriteria || 'Not provided'}`);
        
        // Create test case using acceptance criteria
        const testCaseTitle = `Test Case: ${story.title}`;
        const objective = story.acceptanceCriteria 
          ? `Verify that the feature meets the following acceptance criteria: ${story.acceptanceCriteria}`
          : "Test the functionality described in the user story";
        
        // Build comprehensive prerequisites including test data and environment
        const prerequisites = [
          "System Prerequisites:",
          "- Application is deployed and accessible",
          "- User has valid login credentials with appropriate permissions"
        ];

        if (testDataConfig) {
          prerequisites.push("Test Data Requirements:");
          if (testDataConfig.username) prerequisites.push(`- Test Username: ${testDataConfig.username}`);
          if (testDataConfig.password) prerequisites.push(`- Test Password: Available in test environment`);
          if (testDataConfig.webPortalUrl) prerequisites.push(`- Web Portal URL: ${testDataConfig.webPortalUrl}`);
          if (testDataConfig.additionalData) prerequisites.push(`- Additional Data: ${JSON.stringify(testDataConfig.additionalData)}`);
        }

        if (environmentConfig) {
          prerequisites.push("Environment Configuration:");
          if (environmentConfig.operatingSystem) prerequisites.push(`- OS: ${environmentConfig.operatingSystem}`);
          if (environmentConfig.webBrowser) prerequisites.push(`- Browser: ${environmentConfig.webBrowser}`);
          if (environmentConfig.browserVersion) prerequisites.push(`- Browser Version: ${environmentConfig.browserVersion}`);
          if (environmentConfig.osVersion) prerequisites.push(`- OS Version: ${environmentConfig.osVersion}`);
        }

        // Generate detailed test steps based on acceptance criteria
        const testSteps = [];
        
        if (story.acceptanceCriteria) {
          const cleanCriteria = story.acceptanceCriteria.replace(/<[^>]*>/g, '').trim();
          const criteriaLines = cleanCriteria.split(/AC\d+:/).filter(line => line.trim());
          
          testSteps.push("Setup:");
          testSteps.push("1. Open browser and navigate to the application URL");
          testSteps.push("2. Login with valid test credentials");
          testSteps.push("3. Navigate to the relevant page/module");
          
          testSteps.push("Test Execution:");
          criteriaLines.forEach((criteria, index) => {
            if (criteria.trim()) {
              testSteps.push(`${index + 4}. Test: ${criteria.trim()}`);
            }
          });
          
          testSteps.push("Verification:");
          testSteps.push(`${testSteps.length + 1}. Verify all acceptance criteria are met`);
          testSteps.push(`${testSteps.length + 1}. Verify no unexpected errors or behaviors occur`);
          
          if (request.includeNegative) {
            testSteps.push("Negative Testing:");
            testSteps.push(`${testSteps.length + 1}. Test with invalid inputs (if applicable)`);
            testSteps.push(`${testSteps.length + 1}. Verify appropriate error messages are displayed`);
          }
        } else {
          testSteps.push("1. Navigate to the application");
          testSteps.push("2. Login with test credentials");
          testSteps.push("3. Access the feature under test");
          testSteps.push("4. Perform the required functionality");
          testSteps.push("5. Verify the expected behavior");
          testSteps.push("6. Test edge cases and error scenarios");
        }

        const expectedResult = story.acceptanceCriteria 
          ? `All acceptance criteria are satisfied: ${story.acceptanceCriteria.replace(/<[^>]*>/g, '').trim()}`
          : "Feature functions correctly according to requirements";

        const testCaseData = {
          title: testCaseTitle,
          objective: objective,
          prerequisites: prerequisites,
          testSteps: testSteps,
          expectedResult: expectedResult,
          priority: story.priority || "Medium",
          status: "Draft",
          testType: request.testType || "Functional",
          userStoryId: story.id,
          azureTestCaseId: null,
        };

        // Store the test case in storage
        const createdTestCase = await storage.createTestCase(testCaseData);
        generatedTestCases.push(createdTestCase);
        console.log(`Created test case with ID: ${createdTestCase.id}`);
      }

      // Skip OpenAI processing for now - using mock data instead
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
          // Create test case in Azure DevOps
          const testSteps = testCase.testSteps || [];
          const workItem = {
            fields: {
              "System.WorkItemType": "Test Case",
              "System.Title": testCase.title,
              "Microsoft.VSTS.TCM.Steps": testSteps.map((step, index) => ({
                id: index + 1,
                action: step,
                expectedResult: index === testSteps.length - 1 ? testCase.expectedResult : ""
              })),
              "System.Description": testCase.objective,
              "Microsoft.VSTS.Common.Priority": testCase.priority === "High" ? 1 : testCase.priority === "Medium" ? 2 : 3,
            }
          };

          const apiUrl = `${config.organizationUrl}/${config.project}/_apis/wit/workitems/$Test Case?api-version=7.0`;
          const authHeader = `Basic ${Buffer.from(`:${config.patToken}`).toString('base64')}`;

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json-patch+json'
            },
            body: JSON.stringify([
              {
                op: "add",
                path: "/fields/System.Title",
                value: testCase.title
              },
              {
                op: "add", 
                path: "/fields/System.Description",
                value: testCase.objective
              },
              {
                op: "add",
                path: "/fields/Microsoft.VSTS.Common.Priority", 
                value: testCase.priority === "High" ? 1 : testCase.priority === "Medium" ? 2 : 3
              }
            ])
          });

          if (response.ok) {
            const azureTestCase = await response.json();
            await storage.updateTestCase(testCase.id, { azureTestCaseId: azureTestCase.id.toString() });
            results.push({ testCaseId: testCase.id, azureId: azureTestCase.id, success: true });
          } else {
            results.push({ testCaseId: testCase.id, success: false, error: `Azure API error: ${response.status}` });
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

  const httpServer = createServer(app);
  return httpServer;
}
