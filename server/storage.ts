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
  private azureConfigs: Map<number, AzureConfig> = new Map();
  private userStories: Map<number, UserStory> = new Map();
  private testCases: Map<number, TestCase> = new Map();
  private testPlans: Map<number, TestPlan> = new Map();
  private testSuites: Map<number, TestSuite> = new Map();
  private testCaseLinks: Map<number, TestCaseLink> = new Map();
  private testCaseFeedback: Map<number, TestCaseFeedback> = new Map();
  private aiContext: Map<number, AiContext> = new Map();
  private testDataConfigs: Map<number, TestDataConfig> = new Map();
  private environmentConfigs: Map<number, EnvironmentConfig> = new Map();
  private aiConfigurations: Map<number, AiConfiguration> = new Map();
  
  private nextId = 1;

  // Azure Config methods
  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    const id = this.nextId++;
    const azureConfig: AzureConfig = { id, ...config, createdAt: new Date(), updatedAt: new Date() };
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
    const updated: AzureConfig = { ...existing, ...config, updatedAt: new Date() };
    this.azureConfigs.set(id, updated);
    return updated;
  }

  // User Stories methods
  async createUserStory(story: InsertUserStory): Promise<UserStory> {
    const id = this.nextId++;
    const userStory: UserStory = { id, ...story, createdAt: new Date(), updatedAt: new Date() };
    this.userStories.set(id, userStory);
    return userStory;
  }

  async upsertUserStory(story: InsertUserStory): Promise<UserStory> {
    const existing = Array.from(this.userStories.values()).find(s => s.azureId === story.azureId);
    if (existing) {
      const updated: UserStory = { ...existing, ...story, updatedAt: new Date() };
      this.userStories.set(existing.id, updated);
      return updated;
    } else {
      return this.createUserStory(story);
    }
  }

  async getUserStories(configId?: number): Promise<UserStory[]> {
    const stories = Array.from(this.userStories.values());
    return configId ? stories.filter(s => s.configId === configId) : stories;
  }

  async getUserStory(id: number): Promise<UserStory | undefined> {
    return this.userStories.get(id);
  }

  async getUserStoriesByIds(ids: number[]): Promise<UserStory[]> {
    return ids.map(id => this.userStories.get(id)).filter(Boolean) as UserStory[];
  }

  async clearUserStories(configId: number): Promise<void> {
    const toDelete = Array.from(this.userStories.entries()).filter(([_, story]) => story.configId === configId);
    toDelete.forEach(([id]) => this.userStories.delete(id));
  }

  // Test Cases methods
  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const id = this.nextId++;
    const tc: TestCase = { id, ...testCase, createdAt: new Date(), updatedAt: new Date() };
    this.testCases.set(id, tc);
    return tc;
  }

  async getTestCases(userStoryId?: number): Promise<TestCase[]> {
    const cases = Array.from(this.testCases.values());
    return userStoryId ? cases.filter(tc => tc.userStoryId === userStoryId) : cases;
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    return this.testCases.get(id);
  }

  async updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const existing = this.testCases.get(id);
    if (!existing) return undefined;
    const updated: TestCase = { ...existing, ...testCase, updatedAt: new Date() };
    this.testCases.set(id, updated);
    return updated;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    return this.testCases.delete(id);
  }

  async getTestCasesByIds(ids: number[]): Promise<TestCase[]> {
    return ids.map(id => this.testCases.get(id)).filter(Boolean) as TestCase[];
  }

  // Test Plans methods
  async createTestPlan(testPlan: InsertTestPlan): Promise<TestPlan> {
    const id = this.nextId++;
    const tp: TestPlan = { id, ...testPlan, createdAt: new Date(), updatedAt: new Date() };
    this.testPlans.set(id, tp);
    return tp;
  }

  async getTestPlans(configId?: number): Promise<TestPlan[]> {
    const plans = Array.from(this.testPlans.values());
    return configId ? plans.filter(tp => tp.configId === configId) : plans;
  }

  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    return this.testPlans.get(id);
  }

  async clearTestPlans(configId: number): Promise<void> {
    const toDelete = Array.from(this.testPlans.entries()).filter(([_, plan]) => plan.configId === configId);
    toDelete.forEach(([id]) => this.testPlans.delete(id));
  }

  // Test Suites methods
  async createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite> {
    const id = this.nextId++;
    const ts: TestSuite = { id, ...testSuite, createdAt: new Date(), updatedAt: new Date() };
    this.testSuites.set(id, ts);
    return ts;
  }

  async getTestSuites(testPlanId?: number): Promise<TestSuite[]> {
    const suites = Array.from(this.testSuites.values());
    return testPlanId ? suites.filter(ts => ts.testPlanId === testPlanId) : suites;
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    return this.testSuites.get(id);
  }

  async clearTestSuites(configId: number): Promise<void> {
    const toDelete = Array.from(this.testSuites.entries()).filter(([_, suite]) => suite.configId === configId);
    toDelete.forEach(([id]) => this.testSuites.delete(id));
  }

  // Test Case Links methods
  async createTestCaseLink(link: InsertTestCaseLink): Promise<TestCaseLink> {
    const id = this.nextId++;
    const tcl: TestCaseLink = { id, ...link, createdAt: new Date() };
    this.testCaseLinks.set(id, tcl);
    return tcl;
  }

  async getTestCaseLinks(testCaseId: number): Promise<TestCaseLink[]> {
    return Array.from(this.testCaseLinks.values()).filter(link => link.testCaseId === testCaseId);
  }

  async deleteTestCaseLink(id: number): Promise<boolean> {
    return this.testCaseLinks.delete(id);
  }

  // Test Case Feedback methods
  async createTestCaseFeedback(feedback: InsertTestCaseFeedback): Promise<TestCaseFeedback> {
    const id = this.nextId++;
    const tcf: TestCaseFeedback = { id, ...feedback, createdAt: new Date() };
    this.testCaseFeedback.set(id, tcf);
    return tcf;
  }

  async getTestCaseFeedback(testCaseId: number): Promise<TestCaseFeedback[]> {
    return Array.from(this.testCaseFeedback.values()).filter(fb => fb.testCaseId === testCaseId);
  }

  async getAllFeedback(): Promise<TestCaseFeedback[]> {
    return Array.from(this.testCaseFeedback.values());
  }

  // AI Context methods
  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    const existing = Array.from(this.aiContext.values()).find(c => c.configId === context.configId);
    if (existing) {
      const updated: AiContext = { ...existing, ...context, updatedAt: new Date() };
      this.aiContext.set(existing.id, updated);
      return updated;
    } else {
      const id = this.nextId++;
      const ac: AiContext = { id, ...context, createdAt: new Date(), updatedAt: new Date() };
      this.aiContext.set(id, ac);
      return ac;
    }
  }

  async getAiContext(configId: number): Promise<AiContext | undefined> {
    return Array.from(this.aiContext.values()).find(c => c.configId === configId);
  }

  // Test Data Config methods
  async createTestDataConfig(config: InsertTestDataConfig): Promise<TestDataConfig> {
    const id = this.nextId++;
    const tdc: TestDataConfig = { id, ...config, createdAt: new Date(), updatedAt: new Date() };
    this.testDataConfigs.set(id, tdc);
    return tdc;
  }

  async getTestDataConfig(configId: number): Promise<TestDataConfig | undefined> {
    return Array.from(this.testDataConfigs.values()).find(c => c.configId === configId);
  }

  async updateTestDataConfig(configId: number, config: Partial<InsertTestDataConfig>): Promise<TestDataConfig | undefined> {
    const existing = Array.from(this.testDataConfigs.values()).find(c => c.configId === configId);
    if (!existing) return undefined;
    const updated: TestDataConfig = { ...existing, ...config, updatedAt: new Date() };
    this.testDataConfigs.set(existing.id, updated);
    return updated;
  }

  // Environment Config methods
  async createEnvironmentConfig(config: InsertEnvironmentConfig): Promise<EnvironmentConfig> {
    const id = this.nextId++;
    const ec: EnvironmentConfig = { id, ...config, createdAt: new Date(), updatedAt: new Date() };
    this.environmentConfigs.set(id, ec);
    return ec;
  }

  async getEnvironmentConfig(configId: number): Promise<EnvironmentConfig | undefined> {
    return Array.from(this.environmentConfigs.values()).find(c => c.configId === configId);
  }

  async updateEnvironmentConfig(configId: number, config: Partial<InsertEnvironmentConfig>): Promise<EnvironmentConfig | undefined> {
    const existing = Array.from(this.environmentConfigs.values()).find(c => c.configId === configId);
    if (!existing) return undefined;
    const updated: EnvironmentConfig = { ...existing, ...config, updatedAt: new Date() };
    this.environmentConfigs.set(existing.id, updated);
    return updated;
  }

  // AI Configuration methods
  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const id = this.nextId++;
    const ac: AiConfiguration = { id, ...config, createdAt: new Date(), updatedAt: new Date() };
    this.aiConfigurations.set(id, ac);
    return ac;
  }

  async getAiConfiguration(configId: number): Promise<AiConfiguration | undefined> {
    return Array.from(this.aiConfigurations.values()).find(c => c.configId === configId);
  }

  async updateAiConfiguration(configId: number, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration | undefined> {
    const existing = Array.from(this.aiConfigurations.values()).find(c => c.configId === configId);
    if (!existing) return undefined;
    const updated: AiConfiguration = { ...existing, ...config, updatedAt: new Date() };
    this.aiConfigurations.set(existing.id, updated);
    return updated;
  }
}

// Use memory storage as fallback when database is not available
export const storage = db ? new DatabaseStorage() : new MemoryStorage();