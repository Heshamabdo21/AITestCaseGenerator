import type { InsertUserStory, InsertAzureConfig, InsertAiConfiguration } from "@shared/schema";
import { simpleStorage } from "./simple-storage";

export async function initializeDemoData() {
  try {
    // Check if demo data already exists
    const existingConfig = await simpleStorage.getLatestAzureConfig();
    if (existingConfig) {
      return; // Demo data already initialized
    }

    // Create demo Azure configuration
    const demoConfig: InsertAzureConfig = {
      organizationUrl: "https://dev.azure.com/demo-org",
      patToken: "demo-pat-token",
      project: "Sample Project",
      iterationPath: "Sample\\Sprint 1",
      testPlanId: "12345",
      testPlanName: "Demo Test Plan",
      testSuiteStrategy: "user_story",
      createTestSuites: true,
      openaiKey: "demo-openai-key"
    };

    const azureConfig = await simpleStorage.createAzureConfig(demoConfig);

    // Create demo AI configuration with test type preferences
    const demoAiConfig: InsertAiConfiguration = {
      configId: azureConfig.id,
      includePositiveTests: true,
      includeNegativeTests: true,
      includeEdgeCases: true,
      includeSecurityCases: false,
      includePerformanceTests: false,
      includeUiTests: true,
      includeUsabilityTests: false,
      includeApiTests: false,
      includeCompatibilityTests: false,
      testComplexity: "medium",
      additionalInstructions: "Focus on user-friendly test cases",
      enableWebPortalTests: true,
      enableMobileAppTests: true,
      enableApiTests: false
    };

    await simpleStorage.createAiConfiguration(demoAiConfig);

    // Create demo user stories
    const demoUserStories: InsertUserStory[] = [
      {
        azureId: "US001",
        title: "User Login and Authentication",
        description: "As a user, I want to log into the system securely so that I can access my dashboard",
        acceptanceCriteria: `AC1: User can enter username and password
AC2: System validates credentials
AC3: User is redirected to dashboard on successful login
AC4: Error message is shown for invalid credentials`,
        state: "Active",
        assignedTo: "Demo Tester",
        priority: "High",
        createdDate: new Date().toISOString(),
        tags: ["authentication", "security"],
        configId: azureConfig.id
      },
      {
        azureId: "US002", 
        title: "Product Search and Filtering",
        description: "As a customer, I want to search and filter products so that I can find items quickly",
        acceptanceCriteria: `AC1: User can enter search terms in search box
AC2: Results are filtered based on search criteria
AC3: User can apply additional filters (category, price, brand)
AC4: Search results are displayed with pagination`,
        state: "Active",
        assignedTo: "Demo Tester",
        priority: "Medium",
        createdDate: new Date().toISOString(),
        tags: ["search", "products"],
        configId: azureConfig.id
      },
      {
        azureId: "US003",
        title: "Shopping Cart Management",
        description: "As a customer, I want to manage items in my shopping cart so that I can review my purchases",
        acceptanceCriteria: `AC1: User can add products to cart
AC2: User can view cart contents
AC3: User can update quantities
AC4: User can remove items from cart
AC5: Cart total is calculated correctly`,
        state: "Active", 
        assignedTo: "Demo Tester",
        priority: "High",
        createdDate: new Date().toISOString(),
        tags: ["cart", "ecommerce"],
        configId: azureConfig.id
      }
    ];

    for (const story of demoUserStories) {
      await simpleStorage.createUserStory(story);
    }

    // Create demo test data configuration with password
    await simpleStorage.createTestDataConfig({
      configId: azureConfig.id,
      username: "testuser@demo.com",
      password: "TestPass123!",
      webPortalUrl: "https://demo-portal.example.com"
    });

    console.log("Demo data initialized successfully");
  } catch (error) {
    console.error("Error initializing demo data:", error);
  }
}