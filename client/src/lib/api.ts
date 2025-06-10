import { apiRequest } from "./queryClient";
import type { 
  AzureConfig, 
  InsertAzureConfig, 
  UserStory, 
  TestCase, 
  GenerateTestCaseRequest 
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
};
