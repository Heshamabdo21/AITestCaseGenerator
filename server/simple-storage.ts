import type { 
  AzureConfig, InsertAzureConfig,
  UserStory, InsertUserStory,
  TestCase, InsertTestCase,
  TestPlan, InsertTestPlan,
  TestSuite, InsertTestSuite,
  TestCaseLink, InsertTestCaseLink,
  TestCaseFeedback, InsertTestCaseFeedback,
  AiContext, InsertAiContext,
  TestDataConfig, InsertTestDataConfig,
  EnvironmentConfig, InsertEnvironmentConfig,
  AiConfiguration, InsertAiConfiguration
} from '../shared/schema';

export interface ISimpleStorage {
  // Azure Config methods
  createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig>;
  getAzureConfig(id: number): Promise<AzureConfig | undefined>;
  getLatestAzureConfig(): Promise<AzureConfig | undefined>;
  updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig | undefined>;

  // User Stories methods
  createUserStory(story: InsertUserStory): Promise<UserStory>;
  upsertUserStory(story: InsertUserStory): Promise<UserStory>;
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

  // Test Data Config methods
  createTestDataConfig(config: InsertTestDataConfig): Promise<TestDataConfig>;
  getTestDataConfig(configId: number): Promise<TestDataConfig | undefined>;
  updateTestDataConfig(configId: number, config: Partial<InsertTestDataConfig>): Promise<TestDataConfig | undefined>;

  // Environment Config methods
  createEnvironmentConfig(config: InsertEnvironmentConfig): Promise<EnvironmentConfig>;
  getEnvironmentConfig(configId: number): Promise<EnvironmentConfig | undefined>;
  updateEnvironmentConfig(configId: number, config: Partial<InsertEnvironmentConfig>): Promise<EnvironmentConfig | undefined>;

  // AI Configuration methods
  createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration>;
  getAiConfiguration(configId: number): Promise<AiConfiguration | undefined>;
  updateAiConfiguration(configId: number, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration | undefined>;
}

export class SimpleMemoryStorage implements ISimpleStorage {
  private data = {
    azureConfigs: new Map<number, AzureConfig>(),
    userStories: new Map<number, UserStory>(),
    testCases: new Map<number, TestCase>(),
    testPlans: new Map<number, TestPlan>(),
    testSuites: new Map<number, TestSuite>(),
    testCaseLinks: new Map<number, TestCaseLink>(),
    testCaseFeedback: new Map<number, TestCaseFeedback>(),
    aiContexts: new Map<number, AiContext>(),
    testDataConfigs: new Map<number, TestDataConfig>(),
    environmentConfigs: new Map<number, EnvironmentConfig>(),
    aiConfigurations: new Map<number, AiConfiguration>(),
  };
  
  private nextId = 1;

  // Get memory usage stats for monitoring
  getMemoryStats() {
    return {
      azureConfigs: this.data.azureConfigs.size,
      userStories: this.data.userStories.size,
      testCases: this.data.testCases.size,
      testPlans: this.data.testPlans.size,
      testSuites: this.data.testSuites.size,
      totalItems: this.data.azureConfigs.size + this.data.userStories.size + this.data.testCases.size,
      nextId: this.nextId
    };
  }

  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    if (!config.organizationUrl || !config.project) {
      throw new Error('Organization URL and project are required');
    }
    
    const id = this.nextId++;
    const result: AzureConfig = {
      id,
      ...config,
      iterationPath: config.iterationPath || null,
      testPlanId: config.testPlanId || null,
      testPlanName: config.testPlanName || null,
      testSuiteStrategy: config.testSuiteStrategy || null,
      createTestSuites: config.createTestSuites || null,
      createdAt: new Date()
    };
    this.data.azureConfigs.set(id, result);
    return result;
  }

  async getAzureConfig(id: number): Promise<AzureConfig | undefined> {
    return this.data.azureConfigs.get(id);
  }

  async getLatestAzureConfig(): Promise<AzureConfig | undefined> {
    const configs = Array.from(this.data.azureConfigs.values());
    return configs.length > 0 ? configs[configs.length - 1] : undefined;
  }

  async updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig | undefined> {
    const existing = this.data.azureConfigs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...config };
    this.data.azureConfigs.set(id, updated);
    return updated;
  }

  async createUserStory(story: InsertUserStory): Promise<UserStory> {
    const id = this.nextId++;
    const result: UserStory = {
      id,
      ...story,
      description: story.description || null,
      acceptanceCriteria: story.acceptanceCriteria || null,
      assignedTo: story.assignedTo || null,
      priority: story.priority || null,
      createdDate: story.createdDate || null,
      tags: story.tags ? [...story.tags] : null,
      configId: story.configId || null
    };
    this.data.userStories.set(id, result);
    return result;
  }

  async upsertUserStory(story: InsertUserStory): Promise<UserStory> {
    const existing = Array.from(this.data.userStories.values()).find(s => s.azureId === story.azureId);
    if (existing) {
      const updated: UserStory = {
        ...existing,
        ...story,
        tags: story.tags ? [...story.tags] : null
      };
      this.data.userStories.set(existing.id, updated);
      return updated;
    }
    return this.createUserStory(story);
  }

  async getUserStories(configId?: number): Promise<UserStory[]> {
    const stories = Array.from(this.data.userStories.values());
    return configId ? stories.filter(s => s.configId === configId) : stories;
  }

  async getUserStory(id: number): Promise<UserStory | undefined> {
    return this.data.userStories.get(id);
  }

  async getUserStoriesByIds(ids: number[]): Promise<UserStory[]> {
    return ids.map(id => this.data.userStories.get(id)).filter(Boolean) as UserStory[];
  }

  async clearUserStories(configId: number): Promise<void> {
    const toDelete = Array.from(this.data.userStories.entries())
      .filter(([_, story]) => story.configId === configId)
      .map(([id]) => id);
    
    toDelete.forEach(id => this.data.userStories.delete(id));
  }

  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const id = this.nextId++;
    const result: TestCase = {
      id,
      ...testCase,
      createdAt: new Date()
    };
    this.data.testCases.set(id, result);
    return result;
  }

  async getTestCases(userStoryId?: number): Promise<TestCase[]> {
    const testCases = Array.from(this.data.testCases.values());
    return userStoryId ? testCases.filter(tc => tc.userStoryId === userStoryId) : testCases;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.data.testCases.get(id);
  }

  async updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const existing = this.data.testCases.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...testCase, updatedAt: new Date() };
    this.data.testCases.set(id, updated);
    return updated;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    return this.data.testCases.delete(id);
  }

  async getTestCasesByIds(ids: number[]): Promise<TestCase[]> {
    return ids.map(id => this.data.testCases.get(id)).filter(Boolean) as TestCase[];
  }

  async createTestPlan(testPlan: InsertTestPlan): Promise<TestPlan> {
    const id = this.nextId++;
    const result: TestPlan = {
      id,
      ...testPlan,
      createdAt: new Date()
    };
    this.data.testPlans.set(id, result);
    return result;
  }

  async getTestPlans(configId?: number): Promise<TestPlan[]> {
    const plans = Array.from(this.data.testPlans.values());
    return configId ? plans.filter(p => p.configId === configId) : plans;
  }

  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    return this.data.testPlans.get(id);
  }

  async clearTestPlans(configId: number): Promise<void> {
    const toDelete = Array.from(this.data.testPlans.entries())
      .filter(([_, plan]) => plan.configId === configId)
      .map(([id]) => id);
    
    toDelete.forEach(id => this.data.testPlans.delete(id));
  }

  async createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite> {
    const id = this.nextId++;
    const result: TestSuite = {
      id,
      ...testSuite,
      createdAt: new Date()
    };
    this.data.testSuites.set(id, result);
    return result;
  }

  async getTestSuites(testPlanId?: number): Promise<TestSuite[]> {
    const suites = Array.from(this.data.testSuites.values());
    return testPlanId ? suites.filter(s => s.testPlanId === testPlanId) : suites;
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    return this.data.testSuites.get(id);
  }

  async clearTestSuites(configId: number): Promise<void> {
    const toDelete = Array.from(this.data.testSuites.entries())
      .filter(([_, suite]) => suite.configId === configId)
      .map(([id]) => id);
    
    toDelete.forEach(id => this.data.testSuites.delete(id));
  }

  async createTestCaseLink(link: InsertTestCaseLink): Promise<TestCaseLink> {
    const id = this.nextId++;
    const result: TestCaseLink = {
      id,
      ...link,
      createdAt: new Date()
    };
    this.data.testCaseLinks.set(id, result);
    return result;
  }

  async getTestCaseLinks(testCaseId: number): Promise<TestCaseLink[]> {
    return Array.from(this.data.testCaseLinks.values()).filter(l => l.testCaseId === testCaseId);
  }

  async deleteTestCaseLink(id: number): Promise<boolean> {
    return this.data.testCaseLinks.delete(id);
  }

  async createTestCaseFeedback(feedback: InsertTestCaseFeedback): Promise<TestCaseFeedback> {
    const id = this.nextId++;
    const result: TestCaseFeedback = {
      id,
      ...feedback,
      createdAt: new Date()
    };
    this.data.testCaseFeedback.set(id, result);
    return result;
  }

  async getTestCaseFeedback(testCaseId: number): Promise<TestCaseFeedback[]> {
    return Array.from(this.data.testCaseFeedback.values()).filter(f => f.testCaseId === testCaseId);
  }

  async getAllFeedback(): Promise<TestCaseFeedback[]> {
    return Array.from(this.data.testCaseFeedback.values());
  }

  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    const existing = Array.from(this.data.aiContexts.values()).find(c => c.configId === context.configId);
    
    if (existing) {
      const updated = { 
        ...existing, 
        ...context, 
        projectContext: context.projectContext ? [...context.projectContext] : null,
        testingGuidelines: context.testingGuidelines ? [...context.testingGuidelines] : null,
        businessRules: context.businessRules ? [...context.businessRules] : null,
        updatedAt: new Date() 
      };
      this.data.aiContexts.set(existing.id, updated);
      return updated;
    } else {
      const id = this.nextId++;
      const result: AiContext = {
        id,
        ...context,
        projectContext: context.projectContext ? [...context.projectContext] : null,
        testingGuidelines: context.testingGuidelines ? [...context.testingGuidelines] : null,
        businessRules: context.businessRules ? [...context.businessRules] : null,
        updatedAt: new Date()
      };
      this.data.aiContexts.set(id, result);
      return result;
    }
  }

  async getAiContext(configId: number): Promise<AiContext | undefined> {
    return Array.from(this.data.aiContexts.values()).find(c => c.configId === configId);
  }

  async createTestDataConfig(config: InsertTestDataConfig): Promise<TestDataConfig> {
    const id = this.nextId++;
    const result: TestDataConfig = {
      id,
      ...config,
      testAccounts: config.testAccounts ? [...config.testAccounts] : null,
      apiEndpoints: config.apiEndpoints ? [...config.apiEndpoints] : null
    };
    this.data.testDataConfigs.set(id, result);
    return result;
  }

  async getTestDataConfig(configId: number): Promise<TestDataConfig | undefined> {
    return Array.from(this.data.testDataConfigs.values()).find(c => c.configId === configId);
  }

  async updateTestDataConfig(configId: number, config: Partial<InsertTestDataConfig>): Promise<TestDataConfig | undefined> {
    const existing = Array.from(this.data.testDataConfigs.values()).find(c => c.configId === configId);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...config,
      testAccounts: config.testAccounts ? [...config.testAccounts] : existing.testAccounts,
      apiEndpoints: config.apiEndpoints ? [...config.apiEndpoints] : existing.apiEndpoints
    };
    this.data.testDataConfigs.set(existing.id, updated);
    return updated;
  }

  async createEnvironmentConfig(config: InsertEnvironmentConfig): Promise<EnvironmentConfig> {
    const id = this.nextId++;
    const result: EnvironmentConfig = {
      id,
      ...config,
      permissions: config.permissions ? [...config.permissions] : null
    };
    this.data.environmentConfigs.set(id, result);
    return result;
  }

  async getEnvironmentConfig(configId: number): Promise<EnvironmentConfig | undefined> {
    return Array.from(this.data.environmentConfigs.values()).find(c => c.configId === configId);
  }

  async updateEnvironmentConfig(configId: number, config: Partial<InsertEnvironmentConfig>): Promise<EnvironmentConfig | undefined> {
    const existing = Array.from(this.data.environmentConfigs.values()).find(c => c.configId === configId);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...config,
      permissions: config.permissions ? [...config.permissions] : existing.permissions
    };
    this.data.environmentConfigs.set(existing.id, updated);
    return updated;
  }

  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const id = this.nextId++;
    const result: AiConfiguration = {
      id,
      ...config
    };
    this.data.aiConfigurations.set(id, result);
    return result;
  }

  async getAiConfiguration(configId: number): Promise<AiConfiguration | undefined> {
    return Array.from(this.data.aiConfigurations.values()).find(c => c.configId === configId);
  }

  async updateAiConfiguration(configId: number, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration | undefined> {
    const existing = Array.from(this.data.aiConfigurations.values()).find(c => c.configId === configId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...config };
    this.data.aiConfigurations.set(existing.id, updated);
    return updated;
  }
}

export const simpleStorage = new SimpleMemoryStorage();