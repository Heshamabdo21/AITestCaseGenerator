import { 
  azureConfigs, 
  userStories, 
  testCases,
  type AzureConfig,
  type InsertAzureConfig,
  type UserStory,
  type InsertUserStory,
  type TestCase,
  type InsertTestCase
} from "@shared/schema";

export interface IStorage {
  // Azure Config methods
  createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig>;
  getAzureConfig(id: number): Promise<AzureConfig | undefined>;
  getLatestAzureConfig(): Promise<AzureConfig | undefined>;
  updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig | undefined>;

  // User Stories methods
  createUserStory(story: InsertUserStory): Promise<UserStory>;
  getUserStories(configId?: number): Promise<UserStory[]>;
  getUserStory(id: number): Promise<UserStory | undefined>;
  getUserStoriesByIds(ids: number[]): Promise<UserStory[]>;
  clearUserStories(configId: number): Promise<void>;

  // Test Cases methods
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  getTestCases(userStoryId?: number): Promise<TestCase[]>;
  getTestCase(id: number): Promise<TestCase | undefined>;
  updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined>;
  deleteTestCase(id: number): Promise<boolean>;
  getTestCasesByIds(ids: number[]): Promise<TestCase[]>;
}

export class MemStorage implements IStorage {
  private azureConfigs: Map<number, AzureConfig> = new Map();
  private userStories: Map<number, UserStory> = new Map();
  private testCases: Map<number, TestCase> = new Map();
  private currentConfigId = 1;
  private currentStoryId = 1;
  private currentTestCaseId = 1;

  // Azure Config methods
  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    const id = this.currentConfigId++;
    const azureConfig: AzureConfig = {
      ...config,
      id,
      createdAt: new Date(),
    };
    this.azureConfigs.set(id, azureConfig);
    return azureConfig;
  }

  async getAzureConfig(id: number): Promise<AzureConfig | undefined> {
    return this.azureConfigs.get(id);
  }

  async getLatestAzureConfig(): Promise<AzureConfig | undefined> {
    const configs = Array.from(this.azureConfigs.values());
    return configs.sort((a, b) => b.id - a.id)[0];
  }

  async updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig | undefined> {
    const existing = this.azureConfigs.get(id);
    if (!existing) return undefined;

    const updated: AzureConfig = { ...existing, ...config };
    this.azureConfigs.set(id, updated);
    return updated;
  }

  // User Stories methods
  async createUserStory(story: InsertUserStory): Promise<UserStory> {
    const id = this.currentStoryId++;
    const userStory: UserStory = {
      ...story,
      id,
    };
    this.userStories.set(id, userStory);
    return userStory;
  }

  async getUserStories(configId?: number): Promise<UserStory[]> {
    const stories = Array.from(this.userStories.values());
    if (configId !== undefined) {
      return stories.filter(story => story.configId === configId);
    }
    return stories;
  }

  async getUserStory(id: number): Promise<UserStory | undefined> {
    return this.userStories.get(id);
  }

  async getUserStoriesByIds(ids: number[]): Promise<UserStory[]> {
    const stories: UserStory[] = [];
    for (const id of ids) {
      const story = this.userStories.get(id);
      if (story) stories.push(story);
    }
    return stories;
  }

  async clearUserStories(configId: number): Promise<void> {
    const storiesToDelete = Array.from(this.userStories.entries())
      .filter(([_, story]) => story.configId === configId)
      .map(([id]) => id);
    
    storiesToDelete.forEach(id => this.userStories.delete(id));
  }

  // Test Cases methods
  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const id = this.currentTestCaseId++;
    const test: TestCase = {
      ...testCase,
      id,
      createdAt: new Date(),
    };
    this.testCases.set(id, test);
    return test;
  }

  async getTestCases(userStoryId?: number): Promise<TestCase[]> {
    const tests = Array.from(this.testCases.values());
    if (userStoryId !== undefined) {
      return tests.filter(test => test.userStoryId === userStoryId);
    }
    return tests;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.testCases.get(id);
  }

  async updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const existing = this.testCases.get(id);
    if (!existing) return undefined;

    const updated: TestCase = { ...existing, ...testCase };
    this.testCases.set(id, updated);
    return updated;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    return this.testCases.delete(id);
  }

  async getTestCasesByIds(ids: number[]): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    for (const id of ids) {
      const test = this.testCases.get(id);
      if (test) tests.push(test);
    }
    return tests;
  }
}

export const storage = new MemStorage();
