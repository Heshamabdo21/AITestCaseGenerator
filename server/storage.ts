import { 
  azureConfigs, 
  userStories, 
  testCases,
  testPlans,
  testSuites,
  testCaseLinks,
  testCaseFeedback,
  aiContext,
  type AzureConfig,
  type InsertAzureConfig,
  type UserStory,
  type InsertUserStory,
  type TestCase,
  type InsertTestCase,
  type TestPlan,
  type InsertTestPlan,
  type TestSuite,
  type InsertTestSuite,
  type TestCaseLink,
  type InsertTestCaseLink,
  type TestCaseFeedback,
  type InsertTestCaseFeedback,
  type AiContext,
  type InsertAiContext
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

  // Test Plans methods
  createTestPlan(testPlan: InsertTestPlan): Promise<TestPlan>;
  getTestPlans(configId?: number): Promise<TestPlan[]>;
  getTestPlan(id: number): Promise<TestPlan | undefined>;
  clearTestPlans(configId: number): Promise<void>;

  // Test Suites methods
  createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite>;
  getTestSuites(testPlanId?: number): Promise<TestSuite[]>;
  getTestSuite(id: number): Promise<TestSuite | undefined>;
  clearTestSuites(configId: number): Promise<void>;

  // Test Case Links methods
  createTestCaseLink(link: InsertTestCaseLink): Promise<TestCaseLink>;
  getTestCaseLinks(testCaseId: number): Promise<TestCaseLink[]>;
  deleteTestCaseLink(id: number): Promise<boolean>;

  // Test Case Feedback methods
  createTestCaseFeedback(feedback: InsertTestCaseFeedback): Promise<TestCaseFeedback>;
  getTestCaseFeedback(testCaseId: number): Promise<TestCaseFeedback[]>;
  getAllFeedback(): Promise<TestCaseFeedback[]>;

  // AI Context methods
  createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext>;
  getAiContext(configId: number): Promise<AiContext | undefined>;
}

export class MemStorage implements IStorage {
  private azureConfigs: Map<number, AzureConfig> = new Map();
  private userStories: Map<number, UserStory> = new Map();
  private testCases: Map<number, TestCase> = new Map();
  private testPlans: Map<number, TestPlan> = new Map();
  private testSuites: Map<number, TestSuite> = new Map();
  private testCaseLinks: Map<number, TestCaseLink> = new Map();
  private testCaseFeedback: Map<number, TestCaseFeedback> = new Map();
  private aiContexts: Map<number, AiContext> = new Map();
  private currentConfigId = 1;
  private currentStoryId = 1;
  private currentTestCaseId = 1;
  private currentTestPlanId = 1;
  private currentTestSuiteId = 1;
  private currentLinkId = 1;
  private currentFeedbackId = 1;
  private currentContextId = 1;

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
      description: story.description || null,
      assignedTo: story.assignedTo || null,
      priority: story.priority || null,
      createdDate: story.createdDate || null,
      tags: story.tags || null,
      configId: story.configId || null,
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
      status: testCase.status || "pending",
      prerequisites: testCase.prerequisites || null,
      testSteps: testCase.testSteps || null,
      userStoryId: testCase.userStoryId || null,
      azureTestCaseId: testCase.azureTestCaseId || null,
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
