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
      tags: Array.isArray(story.tags) ? story.tags : null,
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
      prerequisites: Array.isArray(testCase.prerequisites) ? testCase.prerequisites : null,
      testSteps: Array.isArray(testCase.testSteps) ? testCase.testSteps : null,
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

  // Test Plans methods
  async createTestPlan(testPlan: InsertTestPlan): Promise<TestPlan> {
    const id = this.currentTestPlanId++;
    const plan: TestPlan = {
      ...testPlan,
      id,
      createdAt: new Date(),
    };
    this.testPlans.set(id, plan);
    return plan;
  }

  async getTestPlans(configId?: number): Promise<TestPlan[]> {
    const plans = Array.from(this.testPlans.values());
    if (configId !== undefined) {
      return plans.filter(plan => plan.configId === configId);
    }
    return plans;
  }

  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    return this.testPlans.get(id);
  }

  async clearTestPlans(configId: number): Promise<void> {
    const plansToDelete = Array.from(this.testPlans.entries())
      .filter(([_, plan]) => plan.configId === configId)
      .map(([id]) => id);
    
    plansToDelete.forEach(id => this.testPlans.delete(id));
  }

  // Test Suites methods
  async createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite> {
    const id = this.currentTestSuiteId++;
    const suite: TestSuite = {
      ...testSuite,
      id,
      createdAt: new Date(),
    };
    this.testSuites.set(id, suite);
    return suite;
  }

  async getTestSuites(testPlanId?: number): Promise<TestSuite[]> {
    const suites = Array.from(this.testSuites.values());
    if (testPlanId !== undefined) {
      return suites.filter(suite => suite.testPlanId === testPlanId);
    }
    return suites;
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    return this.testSuites.get(id);
  }

  async clearTestSuites(configId: number): Promise<void> {
    const suitesToDelete = Array.from(this.testSuites.entries())
      .filter(([_, suite]) => suite.configId === configId)
      .map(([id]) => id);
    
    suitesToDelete.forEach(id => this.testSuites.delete(id));
  }

  // Test Case Links methods
  async createTestCaseLink(link: InsertTestCaseLink): Promise<TestCaseLink> {
    const id = this.currentLinkId++;
    const testCaseLink: TestCaseLink = {
      ...link,
      id,
      createdAt: new Date(),
    };
    this.testCaseLinks.set(id, testCaseLink);
    return testCaseLink;
  }

  async getTestCaseLinks(testCaseId: number): Promise<TestCaseLink[]> {
    return Array.from(this.testCaseLinks.values())
      .filter(link => link.testCaseId === testCaseId);
  }

  async deleteTestCaseLink(id: number): Promise<boolean> {
    return this.testCaseLinks.delete(id);
  }

  // Test Case Feedback methods
  async createTestCaseFeedback(feedback: InsertTestCaseFeedback): Promise<TestCaseFeedback> {
    const id = this.currentFeedbackId++;
    const testCaseFeedback: TestCaseFeedback = {
      ...feedback,
      id,
      createdAt: new Date(),
    };
    this.testCaseFeedback.set(id, testCaseFeedback);
    return testCaseFeedback;
  }

  async getTestCaseFeedback(testCaseId: number): Promise<TestCaseFeedback[]> {
    return Array.from(this.testCaseFeedback.values())
      .filter(feedback => feedback.testCaseId === testCaseId);
  }

  async getAllFeedback(): Promise<TestCaseFeedback[]> {
    return Array.from(this.testCaseFeedback.values());
  }

  // AI Context methods
  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    // Find existing context for this config
    const existing = Array.from(this.aiContexts.values())
      .find(ctx => ctx.configId === context.configId);
    
    if (existing) {
      const updated: AiContext = {
        ...existing,
        ...context,
        updatedAt: new Date(),
      };
      this.aiContexts.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentContextId++;
      const newContext: AiContext = {
        ...context,
        id,
        updatedAt: new Date(),
      };
      this.aiContexts.set(id, newContext);
      return newContext;
    }
  }

  async getAiContext(configId: number): Promise<AiContext | undefined> {
    return Array.from(this.aiContexts.values())
      .find(context => context.configId === configId);
  }
}

export const storage = new MemStorage();
