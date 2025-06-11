import { 
  AzureConfig, 
  InsertAzureConfig, 
  UserStory, 
  InsertUserStory, 
  TestCase, 
  InsertTestCase,
  TestPlan,
  InsertTestPlan,
  TestSuite,
  InsertTestSuite,
  TestCaseLink,
  InsertTestCaseLink,
  TestCaseFeedback,
  InsertTestCaseFeedback,
  AiContext,
  InsertAiContext,
  TestDataConfig,
  InsertTestDataConfig,
  EnvironmentConfig,
  InsertEnvironmentConfig,
  AiConfiguration,
  InsertAiConfiguration
} from "@shared/schema";

export interface IStorage {
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

import { db } from "./db";
import { eq, inArray, desc } from "drizzle-orm";
import { 
  azureConfigs, 
  userStories, 
  testCases, 
  testPlans, 
  testSuites, 
  testCaseLinks, 
  testCaseFeedback, 
  aiContext,
  testDataConfigs,
  environmentConfigs,
  aiConfigurations
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private checkDatabase() {
    if (!db) {
      throw new Error("Database connection not available. Please configure a valid DATABASE_URL.");
    }
  }

  // Azure Config methods
  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    this.checkDatabase();
    const [result] = await db.insert(azureConfigs).values(config).returning();
    return result;
  }

  async getAzureConfig(id: number): Promise<AzureConfig | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(azureConfigs).where(eq(azureConfigs.id, id));
    return result || undefined;
  }

  async getLatestAzureConfig(): Promise<AzureConfig | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(azureConfigs).orderBy(desc(azureConfigs.id)).limit(1);
    return result || undefined;
  }

  async updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig | undefined> {
    this.checkDatabase();
    const [result] = await db.update(azureConfigs).set(config).where(eq(azureConfigs.id, id)).returning();
    return result || undefined;
  }

  // User Stories methods
  async createUserStory(story: InsertUserStory): Promise<UserStory> {
    this.checkDatabase();
    const [result] = await db.insert(userStories).values(story).returning();
    return result;
  }

  async upsertUserStory(story: InsertUserStory): Promise<UserStory> {
    this.checkDatabase();
    // First try to find existing story by azureId
    const existing = await db.select().from(userStories).where(eq(userStories.azureId, story.azureId)).limit(1);
    
    if (existing.length > 0) {
      // Update existing story
      const [result] = await db.update(userStories)
        .set(story)
        .where(eq(userStories.azureId, story.azureId))
        .returning();
      return result;
    } else {
      // Create new story
      const [result] = await db.insert(userStories).values(story).returning();
      return result;
    }
  }

  async getUserStories(configId?: number): Promise<UserStory[]> {
    this.checkDatabase();
    if (configId) {
      return await db.select().from(userStories).where(eq(userStories.configId, configId));
    }
    return await db.select().from(userStories);
  }

  async getUserStory(id: number): Promise<UserStory | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(userStories).where(eq(userStories.id, id));
    return result || undefined;
  }

  async getUserStoriesByIds(ids: number[]): Promise<UserStory[]> {
    this.checkDatabase();
    if (ids.length === 0) return [];
    return await db.select().from(userStories).where(inArray(userStories.id, ids));
  }

  async clearUserStories(configId: number): Promise<void> {
    this.checkDatabase();
    await db.delete(userStories).where(eq(userStories.configId, configId));
  }

  // Test Cases methods
  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    this.checkDatabase();
    const [result] = await db.insert(testCases).values(testCase).returning();
    return result;
  }

  async getTestCases(userStoryId?: number): Promise<TestCase[]> {
    this.checkDatabase();
    if (userStoryId) {
      return await db.select().from(testCases).where(eq(testCases.userStoryId, userStoryId));
    }
    return await db.select().from(testCases);
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(testCases).where(eq(testCases.id, id));
    return result || undefined;
  }

  async updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    this.checkDatabase();
    const [result] = await db.update(testCases).set(testCase).where(eq(testCases.id, id)).returning();
    return result || undefined;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    this.checkDatabase();
    const result = await db.delete(testCases).where(eq(testCases.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getTestCasesByIds(ids: number[]): Promise<TestCase[]> {
    this.checkDatabase();
    if (ids.length === 0) return [];
    return await db.select().from(testCases).where(inArray(testCases.id, ids));
  }

  // Test Plans methods
  async createTestPlan(testPlan: InsertTestPlan): Promise<TestPlan> {
    this.checkDatabase();
    const [result] = await db.insert(testPlans).values(testPlan).returning();
    return result;
  }

  async getTestPlans(configId?: number): Promise<TestPlan[]> {
    this.checkDatabase();
    if (configId) {
      return await db.select().from(testPlans).where(eq(testPlans.configId, configId));
    }
    return await db.select().from(testPlans);
  }

  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(testPlans).where(eq(testPlans.id, id));
    return result || undefined;
  }

  async clearTestPlans(configId: number): Promise<void> {
    this.checkDatabase();
    await db.delete(testPlans).where(eq(testPlans.configId, configId));
  }

  // Test Suites methods
  async createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite> {
    this.checkDatabase();
    const [result] = await db.insert(testSuites).values(testSuite).returning();
    return result;
  }

  async getTestSuites(testPlanId?: number): Promise<TestSuite[]> {
    this.checkDatabase();
    if (testPlanId) {
      return await db.select().from(testSuites).where(eq(testSuites.testPlanId, testPlanId));
    }
    return await db.select().from(testSuites);
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(testSuites).where(eq(testSuites.id, id));
    return result || undefined;
  }

  async clearTestSuites(configId: number): Promise<void> {
    this.checkDatabase();
    await db.delete(testSuites).where(eq(testSuites.configId, configId));
  }

  // Test Case Links methods
  async createTestCaseLink(link: InsertTestCaseLink): Promise<TestCaseLink> {
    this.checkDatabase();
    const [result] = await db.insert(testCaseLinks).values(link).returning();
    return result;
  }

  async getTestCaseLinks(testCaseId: number): Promise<TestCaseLink[]> {
    this.checkDatabase();
    return await db.select().from(testCaseLinks).where(eq(testCaseLinks.testCaseId, testCaseId));
  }

  async deleteTestCaseLink(id: number): Promise<boolean> {
    this.checkDatabase();
    const result = await db.delete(testCaseLinks).where(eq(testCaseLinks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Test Case Feedback methods
  async createTestCaseFeedback(feedback: InsertTestCaseFeedback): Promise<TestCaseFeedback> {
    this.checkDatabase();
    const [result] = await db.insert(testCaseFeedback).values(feedback).returning();
    return result;
  }

  async getTestCaseFeedback(testCaseId: number): Promise<TestCaseFeedback[]> {
    this.checkDatabase();
    return await db.select().from(testCaseFeedback).where(eq(testCaseFeedback.testCaseId, testCaseId));
  }

  async getAllFeedback(): Promise<TestCaseFeedback[]> {
    this.checkDatabase();
    return await db.select().from(testCaseFeedback);
  }

  // AI Context methods
  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    this.checkDatabase();
    const existing = await db.select().from(aiContext).where(eq(aiContext.configId, context.configId!)).limit(1);
    
    if (existing.length > 0) {
      const [result] = await db.update(aiContext)
        .set(context)
        .where(eq(aiContext.configId, context.configId!))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(aiContext).values(context).returning();
      return result;
    }
  }

  async getAiContext(configId: number): Promise<AiContext | undefined> {
    this.checkDatabase();
    const results = await db.select().from(aiContext).where(eq(aiContext.configId, configId));
    return results[0] || undefined;
  }

  // Test Data Config methods
  async createTestDataConfig(config: InsertTestDataConfig): Promise<TestDataConfig> {
    this.checkDatabase();
    const [result] = await db.insert(testDataConfigs).values(config).returning();
    return result;
  }

  async getTestDataConfig(configId: number): Promise<TestDataConfig | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(testDataConfigs).where(eq(testDataConfigs.configId, configId));
    return result || undefined;
  }

  async updateTestDataConfig(configId: number, config: Partial<InsertTestDataConfig>): Promise<TestDataConfig | undefined> {
    this.checkDatabase();
    const [result] = await db.update(testDataConfigs).set(config).where(eq(testDataConfigs.configId, configId)).returning();
    return result || undefined;
  }

  // Environment Config methods
  async createEnvironmentConfig(config: InsertEnvironmentConfig): Promise<EnvironmentConfig> {
    this.checkDatabase();
    const [result] = await db.insert(environmentConfigs).values(config).returning();
    return result;
  }

  async getEnvironmentConfig(configId: number): Promise<EnvironmentConfig | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(environmentConfigs).where(eq(environmentConfigs.configId, configId));
    return result || undefined;
  }

  async updateEnvironmentConfig(configId: number, config: Partial<InsertEnvironmentConfig>): Promise<EnvironmentConfig | undefined> {
    this.checkDatabase();
    const [result] = await db.update(environmentConfigs).set(config).where(eq(environmentConfigs.configId, configId)).returning();
    return result || undefined;
  }

  // AI Configuration methods
  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    this.checkDatabase();
    const [result] = await db.insert(aiConfigurations).values(config).returning();
    return result;
  }

  async getAiConfiguration(configId: number): Promise<AiConfiguration | undefined> {
    this.checkDatabase();
    const [result] = await db.select().from(aiConfigurations).where(eq(aiConfigurations.configId, configId));
    return result || undefined;
  }

  async updateAiConfiguration(configId: number, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration | undefined> {
    this.checkDatabase();
    const [result] = await db.update(aiConfigurations).set(config).where(eq(aiConfigurations.configId, configId)).returning();
    return result || undefined;
  }
}

// In-memory storage implementation as fallback
export class MemoryStorage implements IStorage {
  private data = {
    azureConfigs: new Map<number, AzureConfig>(),
    userStories: new Map<number, UserStory>(),
    testCases: new Map<number, TestCase>(),
    testPlans: new Map<number, TestPlan>(),
    testSuites: new Map<number, TestSuite>(),
    testCaseLinks: new Map<number, TestCaseLink>(),
    testCaseFeedback: new Map<number, TestCaseFeedback>(),
    aiContext: new Map<number, AiContext>(),
    testDataConfigs: new Map<number, TestDataConfig>(),
    environmentConfigs: new Map<number, EnvironmentConfig>(),
    aiConfigurations: new Map<number, AiConfiguration>()
  };
  
  private nextId = 1;

  // Azure Config methods
  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    const id = this.nextId++;
    const result: AzureConfig = {
      id,
      organizationUrl: config.organizationUrl,
      patToken: config.patToken,
      project: config.project,
      iterationPath: config.iterationPath || null,
      openaiKey: config.openaiKey,
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
    return configs.sort((a, b) => b.id - a.id)[0];
  }

  async updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig | undefined> {
    const existing = this.data.azureConfigs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...config };
    this.data.azureConfigs.set(id, updated);
    return updated;
  }

  // User Stories methods
  async createUserStory(story: InsertUserStory): Promise<UserStory> {
    const id = this.nextId++;
    const result: UserStory = {
      id,
      azureId: story.azureId,
      title: story.title,
      description: story.description || null,
      acceptanceCriteria: story.acceptanceCriteria || null,
      state: story.state,
      assignedTo: story.assignedTo || null,
      priority: story.priority || null,
      createdDate: story.createdDate || null,
      tags: story.tags || null,
      configId: story.configId || null
    };
    this.data.userStories.set(id, result);
    return result;
  }

  async upsertUserStory(story: InsertUserStory): Promise<UserStory> {
    const existing = Array.from(this.data.userStories.values()).find(s => s.azureId === story.azureId);
    if (existing) {
      const updated = { ...existing, ...story };
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
    console.log("MemoryStorage getUserStoriesByIds called with IDs:", ids);
    console.log("Available user stories in memory:", Array.from(this.data.userStories.keys()));
    const result = ids.map(id => this.data.userStories.get(id)).filter(Boolean) as UserStory[];
    console.log("Found user stories:", result.map(s => ({ id: s.id, title: s.title })));
    return result;
  }

  async clearUserStories(configId: number): Promise<void> {
    const toDelete = Array.from(this.data.userStories.entries()).filter(([_, story]) => story.configId === configId);
    toDelete.forEach(([id]) => this.data.userStories.delete(id));
  }

  // Test Cases methods
  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const id = this.nextId++;
    const result: TestCase = {
      id,
      title: testCase.title,
      objective: testCase.objective,
      prerequisites: testCase.prerequisites || null,
      testSteps: testCase.testSteps || null,
      expectedResult: testCase.expectedResult,
      priority: testCase.priority,
      testType: testCase.testType,
      status: testCase.status,
      userStoryId: testCase.userStoryId || null,
      azureTestCaseId: testCase.azureTestCaseId || null,
      createdAt: new Date()
    };
    this.data.testCases.set(id, result);
    return result;
  }

  async getTestCases(userStoryId?: number): Promise<TestCase[]> {
    const cases = Array.from(this.data.testCases.values());
    return userStoryId ? cases.filter(tc => tc.userStoryId === userStoryId) : cases;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.data.testCases.get(id);
  }

  async updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const existing = this.data.testCases.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...testCase };
    this.data.testCases.set(id, updated);
    return updated;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    return this.data.testCases.delete(id);
  }

  async getTestCasesByIds(ids: number[]): Promise<TestCase[]> {
    return ids.map(id => this.data.testCases.get(id)).filter(Boolean) as TestCase[];
  }

  // Test Plans methods
  async createTestPlan(testPlan: InsertTestPlan): Promise<TestPlan> {
    const id = this.nextId++;
    const result: TestPlan = {
      id,
      name: testPlan.name,
      azureId: testPlan.azureId,
      description: testPlan.description || null,
      state: testPlan.state,
      configId: testPlan.configId || null,
      createdAt: new Date()
    };
    this.data.testPlans.set(id, result);
    return result;
  }

  async getTestPlans(configId?: number): Promise<TestPlan[]> {
    const plans = Array.from(this.data.testPlans.values());
    return configId ? plans.filter(tp => tp.configId === configId) : plans;
  }

  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    return this.data.testPlans.get(id);
  }

  async clearTestPlans(configId: number): Promise<void> {
    const toDelete = Array.from(this.data.testPlans.entries()).filter(([_, plan]) => plan.configId === configId);
    toDelete.forEach(([id]) => this.data.testPlans.delete(id));
  }

  // Test Suites methods
  async createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite> {
    const id = this.nextId++;
    const result: TestSuite = {
      id,
      name: testSuite.name,
      azureId: testSuite.azureId,
      description: testSuite.description || null,
      configId: testSuite.configId || null,
      testPlanId: testSuite.testPlanId || null,
      createdAt: new Date()
    };
    this.data.testSuites.set(id, result);
    return result;
  }

  async getTestSuites(testPlanId?: number): Promise<TestSuite[]> {
    const suites = Array.from(this.data.testSuites.values());
    return testPlanId ? suites.filter(ts => ts.testPlanId === testPlanId) : suites;
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    return this.data.testSuites.get(id);
  }

  async clearTestSuites(configId: number): Promise<void> {
    const toDelete = Array.from(this.data.testSuites.entries()).filter(([_, suite]) => suite.configId === configId);
    toDelete.forEach(([id]) => this.data.testSuites.delete(id));
  }

  // Test Case Links methods
  async createTestCaseLink(link: InsertTestCaseLink): Promise<TestCaseLink> {
    const id = this.nextId++;
    const result: TestCaseLink = {
      id,
      testCaseId: link.testCaseId || null,
      linkedUserStoryId: link.linkedUserStoryId,
      linkType: link.linkType || "related",
      createdAt: new Date()
    };
    this.data.testCaseLinks.set(id, result);
    return result;
  }

  async getTestCaseLinks(testCaseId: number): Promise<TestCaseLink[]> {
    return Array.from(this.data.testCaseLinks.values()).filter(link => link.testCaseId === testCaseId);
  }

  async deleteTestCaseLink(id: number): Promise<boolean> {
    return this.data.testCaseLinks.delete(id);
  }

  // Test Case Feedback methods
  async createTestCaseFeedback(feedback: InsertTestCaseFeedback): Promise<TestCaseFeedback> {
    const id = this.nextId++;
    const result: TestCaseFeedback = {
      id,
      testCaseId: feedback.testCaseId || null,
      feedbackType: feedback.feedbackType,
      feedbackText: feedback.feedbackText,
      userEmail: feedback.userEmail || null,
      createdAt: new Date()
    };
    this.data.testCaseFeedback.set(id, result);
    return result;
  }

  async getTestCaseFeedback(testCaseId: number): Promise<TestCaseFeedback[]> {
    return Array.from(this.data.testCaseFeedback.values()).filter(fb => fb.testCaseId === testCaseId);
  }

  async getAllFeedback(): Promise<TestCaseFeedback[]> {
    return Array.from(this.data.testCaseFeedback.values());
  }

  // AI Context methods
  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    const existing = Array.from(this.data.aiContext.values()).find(c => c.configId === context.configId);
    if (existing) {
      const updated = { ...existing, ...context, updatedAt: new Date() };
      this.data.aiContext.set(existing.id, updated);
      return updated;
    }
    
    const id = this.nextId++;
    const result: AiContext = {
      id,
      configId: context.configId || null,
      projectContext: context.projectContext || null,
      domainKnowledge: context.domainKnowledge || null,
      testingPatterns: context.testingPatterns || null,
      customInstructions: context.customInstructions || null,
      updatedAt: new Date()
    };
    this.data.aiContext.set(id, result);
    return result;
  }

  async getAiContext(configId: number): Promise<AiContext | undefined> {
    return Array.from(this.data.aiContext.values()).find(c => c.configId === configId);
  }

  // Test Data Config methods
  async createTestDataConfig(config: InsertTestDataConfig): Promise<TestDataConfig> {
    const id = this.nextId++;
    const result: TestDataConfig = {
      id,
      configId: config.configId || null,
      username: config.username || null,
      password: config.password || null,
      webPortalUrl: config.webPortalUrl || null,
      permissions: config.permissions || null,
      additionalData: config.additionalData || null,
      uploadedFiles: config.uploadedFiles || null,
      createdAt: new Date()
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
    const updated = { ...existing, ...config };
    this.data.testDataConfigs.set(existing.id, updated);
    return updated;
  }

  // Environment Config methods
  async createEnvironmentConfig(config: InsertEnvironmentConfig): Promise<EnvironmentConfig> {
    const id = this.nextId++;
    const result: EnvironmentConfig = {
      id,
      configId: config.configId || null,
      operatingSystem: config.operatingSystem,
      osVersion: config.osVersion || null,
      webBrowser: config.webBrowser || null,
      browserVersion: config.browserVersion || null,
      mobileDevice: config.mobileDevice || null,
      mobileVersion: config.mobileVersion || null,
      createdAt: new Date()
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
    const updated = { ...existing, ...config };
    this.data.environmentConfigs.set(existing.id, updated);
    return updated;
  }

  // AI Configuration methods
  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const id = this.nextId++;
    const result: AiConfiguration = {
      id,
      configId: config.configId || null,
      includePositiveTests: config.includePositiveTests || null,
      includeNegativeTests: config.includeNegativeTests || null,
      includeEdgeCases: config.includeEdgeCases || null,
      includeSecurityCases: config.includeSecurityCases || null,
      testComplexity: config.testComplexity || null,
      additionalInstructions: config.additionalInstructions || null,
      createdAt: new Date()
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

// Use memory storage as fallback when database is not available
export const storage = db ? new DatabaseStorage() : new MemoryStorage();