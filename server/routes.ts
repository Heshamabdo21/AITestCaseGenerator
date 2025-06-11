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

      const apiUrl = `${organizationUrl}/${project}/_apis/wit/workitems?api-version=7.0&$top=1`;
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

  // Fetch user stories from Azure DevOps
  app.get("/api/user-stories", async (req, res) => {
    try {
      const config = await storage.getLatestAzureConfig();
      if (!config) {
        return res.status(404).json({ message: "No Azure DevOps configuration found" });
      }

      // Clear existing user stories for this config
      await storage.clearUserStories(config.id);

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
        
        const userStory = await storage.createUserStory({
          azureId: item.id.toString(),
          title: item.fields["System.Title"],
          description: item.fields["System.Description"] || "",
          acceptanceCriteria: item.fields["Microsoft.VSTS.Common.AcceptanceCriteria"] || "",
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
      const userStories = await storage.getUserStoriesByIds(request.userStoryIds);

      if (userStories.length === 0) {
        return res.status(404).json({ message: "No user stories found" });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const openai = new OpenAI({ 
        apiKey: config.openaiKey || process.env.OPENAI_API_KEY 
      });

      const generatedTestCases: TestCase[] = [];

      for (const story of userStories) {
        const prompt = `Generate test cases for the following user story:

Title: ${story.title}
Description: ${story.description}
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

  const httpServer = createServer(app);
  return httpServer;
}
