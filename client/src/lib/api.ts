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

// Helper function to safely parse JSON responses
const safeJsonParse = async (response: Response) => {
  const text = await response.text();
  if (!text || text.trim() === '') {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse JSON response:', text);
    return null;
  }
};

export const api = {
  // Azure DevOps Configuration
  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    const response = await apiRequest("POST", "/api/azure-config", config);
    return safeJsonParse(response);
  },

  async getLatestAzureConfig(): Promise<AzureConfig> {
    const response = await apiRequest("GET", "/api/azure-config/latest");
    return safeJsonParse(response);
  },

  async updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig> {
    const response = await apiRequest("PUT", `/api/azure-config/${id}`, config);
    return safeJsonParse(response);
  },

  async testAzureConnection(config: { organizationUrl: string; patToken: string; project: string }): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest("POST", "/api/azure-config/test", config);
    return safeJsonParse(response);
  },

  async fetchAzureProjects(config: { organizationUrl: string; patToken: string }): Promise<Array<{ name: string; id: string }>> {
    const response = await apiRequest("POST", "/api/azure-devops/projects", config);
    return safeJsonParse(response);
  },

  async fetchIterationPaths(config: { organizationUrl: string; patToken: string; project: string }): Promise<Array<{ name: string; path: string }>> {
    const response = await apiRequest("POST", "/api/azure-devops/iterations", config);
    return safeJsonParse(response);
  },

  async fetchTestPlans(): Promise<Array<{ id: string; name: string; description: string }>> {
    const response = await apiRequest("GET", "/api/azure/test-plans");
    return safeJsonParse(response);
  },

  async fetchIterations(): Promise<Array<{ id: string; name: string; path: string }>> {
    const response = await apiRequest("GET", "/api/azure/iterations");
    return safeJsonParse(response);
  },

  // User Stories
  async fetchUserStories(): Promise<UserStory[]> {
    const response = await apiRequest("GET", "/api/user-stories");
    return safeJsonParse(response);
  },

  async getStoredUserStories(): Promise<UserStory[]> {
    const response = await apiRequest("GET", "/api/user-stories/stored");
    return safeJsonParse(response);
  },

  // Test Cases
  async generateTestCases(request: GenerateTestCaseRequest): Promise<TestCase[]> {
    const response = await apiRequest("POST", "/api/test-cases/generate", request);
    return safeJsonParse(response);
  },

  async getTestCases(): Promise<TestCase[]> {
    const response = await apiRequest("GET", "/api/test-cases");
    return safeJsonParse(response);
  },

  async updateTestCaseStatus(id: number, status: string): Promise<TestCase> {
    const response = await apiRequest("PATCH", `/api/test-cases/${id}`, { status });
    return safeJsonParse(response);
  },

  async addTestCasesToAzure(testCaseIds: number[]): Promise<{ message: string; results: any[]; successCount: number }> {
    const response = await apiRequest("POST", "/api/test-cases/add-to-azure", { testCaseIds });
    return safeJsonParse(response);
  },

  async exportTestCasesToExcel(): Promise<void> {
    const response = await fetch("/api/test-cases/export");
    if (!response.ok) {
      throw new Error("Failed to export test cases");
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'test-cases-export.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async deleteTestCase(testCaseId: number): Promise<{ message: string }> {
    const response = await apiRequest("DELETE", `/api/test-cases/${testCaseId}`);
    return safeJsonParse(response);
  },

  async deleteAllTestCases(): Promise<{ message: string }> {
    const response = await apiRequest("DELETE", "/api/test-cases");
    return safeJsonParse(response);
  },

  // Test Data Configuration
  async createTestDataConfig(config: InsertTestDataConfig): Promise<TestDataConfig> {
    const response = await apiRequest("POST", "/api/test-data-config", config);
    return safeJsonParse(response);
  },

  async getTestDataConfig(): Promise<TestDataConfig | null> {
    const response = await apiRequest("GET", "/api/test-data-config");
    return safeJsonParse(response);
  },

  async updateTestDataConfig(config: Partial<InsertTestDataConfig>): Promise<TestDataConfig> {
    const response = await apiRequest("PATCH", "/api/test-data-config", config);
    return safeJsonParse(response);
  },

  // Environment Configuration
  async createEnvironmentConfig(config: InsertEnvironmentConfig): Promise<EnvironmentConfig> {
    const response = await apiRequest("POST", "/api/environment-config", config);
    return safeJsonParse(response);
  },

  async getEnvironmentConfig(): Promise<EnvironmentConfig | null> {
    const response = await apiRequest("GET", "/api/environment-config");
    return safeJsonParse(response);
  },

  async updateEnvironmentConfig(config: Partial<InsertEnvironmentConfig>): Promise<EnvironmentConfig> {
    const response = await apiRequest("PATCH", "/api/environment-config", config);
    return safeJsonParse(response);
  },

  // AI Configuration
  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const response = await apiRequest("POST", "/api/ai-configuration", config);
    return safeJsonParse(response);
  },

  async getAiConfiguration(): Promise<AiConfiguration | null> {
    const response = await apiRequest("GET", "/api/ai-configuration");
    return safeJsonParse(response);
  },

  async updateAiConfiguration(config: Partial<InsertAiConfiguration>): Promise<AiConfiguration> {
    const response = await apiRequest("PATCH", "/api/ai-configuration", config);
    const result = await safeJsonParse(response);
    return result || config as AiConfiguration;
  },

  // AI Context
  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    const response = await apiRequest("POST", "/api/ai-context", context);
    return safeJsonParse(response);
  },

  async getAiContext(): Promise<AiContext | null> {
    const response = await apiRequest("GET", "/api/ai-context");
    return safeJsonParse(response);
  },

  // Export functionality
  async exportTestCases(): Promise<Blob> {
    const response = await fetch("/api/test-cases/export", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    return response.blob();
  },
};
