import { apiRequest } from "./queryClient";
import type { 
  AzureConfig, 
  InsertAzureConfig, 
  UserStory, 
  TestCase, 
  GenerateTestCaseRequest,
  TestDataConfig,
  EnvironmentConfig,
  AiConfiguration,
  AiContext,
  InsertTestDataConfig,
  InsertEnvironmentConfig,
  InsertAiConfiguration,
  InsertAiContext
} from "@shared/schema";

export const api = {
  // Azure DevOps Configuration
  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    const response = await apiRequest("POST", "/api/azure-config", config);
    return response.json();
  },

  async getLatestAzureConfig(): Promise<AzureConfig> {
    const response = await apiRequest("GET", "/api/azure-config/latest");
    return response.json();
  },

  async testAzureConnection(config: { organizationUrl: string; patToken: string; project: string }): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest("POST", "/api/azure-config/test", config);
    return response.json();
  },

  async fetchAzureProjects(config: { organizationUrl: string; patToken: string }): Promise<Array<{ name: string; id: string }>> {
    const response = await apiRequest("POST", "/api/azure-devops/projects", config);
    return response.json();
  },

  async fetchIterationPaths(config: { organizationUrl: string; patToken: string; project: string }): Promise<Array<{ name: string; path: string }>> {
    const response = await apiRequest("POST", "/api/azure-devops/iterations", config);
    return response.json();
  },

  // User Stories
  async fetchUserStories(): Promise<UserStory[]> {
    const response = await apiRequest("GET", "/api/user-stories");
    return response.json();
  },

  async getStoredUserStories(): Promise<UserStory[]> {
    const response = await apiRequest("GET", "/api/user-stories/stored");
    return response.json();
  },

  // Test Cases
  async generateTestCases(request: GenerateTestCaseRequest): Promise<TestCase[]> {
    const response = await apiRequest("POST", "/api/test-cases/generate", request);
    return response.json();
  },

  async getTestCases(): Promise<TestCase[]> {
    const response = await apiRequest("GET", "/api/test-cases");
    return response.json();
  },

  async updateTestCaseStatus(id: number, status: string): Promise<TestCase> {
    const response = await apiRequest("PATCH", `/api/test-cases/${id}`, { status });
    return response.json();
  },

  async addTestCasesToAzure(testCaseIds: number[]): Promise<{ message: string; results: any[]; successCount: number }> {
    const response = await apiRequest("POST", "/api/test-cases/add-to-azure", { testCaseIds });
    return response.json();
  },

  // Test Data Configuration
  async createTestDataConfig(config: InsertTestDataConfig): Promise<TestDataConfig> {
    const response = await apiRequest("POST", "/api/test-data-config", config);
    return response.json();
  },

  async getTestDataConfig(): Promise<TestDataConfig | null> {
    const response = await apiRequest("GET", "/api/test-data-config");
    return response.json();
  },

  async updateTestDataConfig(config: Partial<InsertTestDataConfig>): Promise<TestDataConfig> {
    const response = await apiRequest("PATCH", "/api/test-data-config", config);
    return response.json();
  },

  // Environment Configuration
  async createEnvironmentConfig(config: InsertEnvironmentConfig): Promise<EnvironmentConfig> {
    const response = await apiRequest("POST", "/api/environment-config", config);
    return response.json();
  },

  async getEnvironmentConfig(): Promise<EnvironmentConfig | null> {
    const response = await apiRequest("GET", "/api/environment-config");
    return response.json();
  },

  async updateEnvironmentConfig(config: Partial<InsertEnvironmentConfig>): Promise<EnvironmentConfig> {
    const response = await apiRequest("PATCH", "/api/environment-config", config);
    return response.json();
  },

  // AI Configuration
  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const response = await apiRequest("POST", "/api/ai-configuration", config);
    return response.json();
  },

  async getAiConfiguration(): Promise<AiConfiguration | null> {
    const response = await apiRequest("GET", "/api/ai-configuration");
    return response.json();
  },

  async updateAiConfiguration(config: Partial<InsertAiConfiguration>): Promise<AiConfiguration> {
    const response = await apiRequest("PATCH", "/api/ai-configuration", config);
    return response.json();
  },

  // AI Context
  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    const response = await apiRequest("POST", "/api/ai-context", context);
    return response.json();
  },

  async getAiContext(): Promise<AiContext | null> {
    const response = await apiRequest("GET", "/api/ai-context");
    return response.json();
  },
};
