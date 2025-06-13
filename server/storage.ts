import { 
  azureConfigs, 
  userStories, 
  testCases, 
  testDataConfigs, 
  environmentConfigs, 
  aiConfigurations,
  testPlans,
  testSuites,
  testCaseLinks,
  testCaseFeedback,
  aiContext,
  type AzureConfig,
  type UserStory,
  type TestCase,
  type TestDataConfig,
  type EnvironmentConfig,
  type AiConfiguration,
  type TestPlan,
  type TestSuite,
  type TestCaseLink,
  type TestCaseFeedback,
  type AiContext,
  type InsertAzureConfig,
  type InsertUserStory,
  type InsertTestCase,
  type InsertTestDataConfig,
  type InsertEnvironmentConfig,
  type InsertAiConfiguration,
  type InsertTestPlan,
  type InsertTestSuite,
  type InsertTestCaseLink,
  type InsertTestCaseFeedback,
  type InsertAiContext
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
  deleteAllTestCases(): Promise<number>;
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

  // Data management methods
  clearAllDemoData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    const [result] = await db.insert(azureConfigs).values(config).returning();
    return result;
  }

  async getAzureConfig(id: number): Promise<AzureConfig | undefined> {
    const [result] = await db.select().from(azureConfigs).where(eq(azureConfigs.id, id));
    return result;
  }

  async getLatestAzureConfig(): Promise<AzureConfig | undefined> {
    const [result] = await db.select().from(azureConfigs).orderBy(desc(azureConfigs.createdAt)).limit(1);
    return result;
  }

  async updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig | undefined> {
    const [result] = await db.update(azureConfigs).set(config).where(eq(azureConfigs.id, id)).returning();
    return result;
  }

  async createUserStory(story: InsertUserStory): Promise<UserStory> {
    const [result] = await db.insert(userStories).values(story).returning();
    return result;
  }

  async upsertUserStory(story: InsertUserStory): Promise<UserStory> {
    const [existing] = await db.select().from(userStories).where(eq(userStories.azureId, story.azureId));
    
    if (existing) {
      const [updated] = await db.update(userStories).set(story).where(eq(userStories.azureId, story.azureId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(userStories).values(story).returning();
      return created;
    }
  }

  async getUserStories(configId?: number): Promise<UserStory[]> {
    if (configId) {
      return db.select().from(userStories).where(eq(userStories.configId, configId));
    }
    return db.select().from(userStories);
  }

  async getUserStory(id: number): Promise<UserStory | undefined> {
    const [result] = await db.select().from(userStories).where(eq(userStories.id, id));
    return result;
  }

  async getUserStoriesByIds(ids: number[]): Promise<UserStory[]> {
    return db.select().from(userStories).where(eq(userStories.id, ids[0])); // Simplified for now
  }

  async clearUserStories(configId: number): Promise<void> {
    await db.delete(userStories).where(eq(userStories.configId, configId));
  }

  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const [result] = await db.insert(testCases).values(testCase).returning();
    return result;
  }

  async getTestCases(userStoryId?: number): Promise<TestCase[]> {
    if (userStoryId) {
      return db.select().from(testCases).where(eq(testCases.userStoryId, userStoryId));
    }
    return db.select().from(testCases);
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    const [result] = await db.select().from(testCases).where(eq(testCases.id, id));
    return result;
  }

  async updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const [result] = await db.update(testCases).set(testCase).where(eq(testCases.id, id)).returning();
    return result;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    const result = await db.delete(testCases).where(eq(testCases.id, id));
    return result.rowCount > 0;
  }

  async deleteAllTestCases(): Promise<number> {
    const result = await db.delete(testCases);
    return result.rowCount || 0;
  }

  async getTestCasesByIds(ids: number[]): Promise<TestCase[]> {
    return db.select().from(testCases).where(eq(testCases.id, ids[0])); // Simplified for now
  }

  // Placeholder implementations for other methods
  async createTestPlan(testPlan: InsertTestPlan): Promise<TestPlan> {
    throw new Error("Test plans not yet implemented in database storage");
  }

  async getTestPlans(configId?: number): Promise<TestPlan[]> {
    return [];
  }

  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    return undefined;
  }

  async clearTestPlans(configId: number): Promise<void> {
    // Implementation pending
  }

  async createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite> {
    throw new Error("Test suites not yet implemented in database storage");
  }

  async getTestSuites(testPlanId?: number): Promise<TestSuite[]> {
    return [];
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    return undefined;
  }

  async clearTestSuites(configId: number): Promise<void> {
    // Implementation pending
  }

  async createTestCaseLink(link: InsertTestCaseLink): Promise<TestCaseLink> {
    throw new Error("Test case links not yet implemented in database storage");
  }

  async getTestCaseLinks(testCaseId: number): Promise<TestCaseLink[]> {
    return [];
  }

  async deleteTestCaseLink(id: number): Promise<boolean> {
    return false;
  }

  async createTestCaseFeedback(feedback: InsertTestCaseFeedback): Promise<TestCaseFeedback> {
    throw new Error("Test case feedback not yet implemented in database storage");
  }

  async getTestCaseFeedback(testCaseId: number): Promise<TestCaseFeedback[]> {
    return [];
  }

  async getAllFeedback(): Promise<TestCaseFeedback[]> {
    return [];
  }

  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    throw new Error("AI context not yet implemented in database storage");
  }

  async getAiContext(configId: number): Promise<AiContext | undefined> {
    return undefined;
  }

  async createTestDataConfig(config: InsertTestDataConfig): Promise<TestDataConfig> {
    const [result] = await db.insert(testDataConfigs).values(config).returning();
    return result;
  }

  async getTestDataConfig(configId: number): Promise<TestDataConfig | undefined> {
    const [result] = await db.select().from(testDataConfigs).where(eq(testDataConfigs.configId, configId));
    return result;
  }

  async updateTestDataConfig(configId: number, config: Partial<InsertTestDataConfig>): Promise<TestDataConfig | undefined> {
    const [result] = await db.update(testDataConfigs).set(config).where(eq(testDataConfigs.configId, configId)).returning();
    return result;
  }

  async createEnvironmentConfig(config: InsertEnvironmentConfig): Promise<EnvironmentConfig> {
    const [result] = await db.insert(environmentConfigs).values(config).returning();
    return result;
  }

  async getEnvironmentConfig(configId: number): Promise<EnvironmentConfig | undefined> {
    const [result] = await db.select().from(environmentConfigs).where(eq(environmentConfigs.configId, configId));
    return result;
  }

  async updateEnvironmentConfig(configId: number, config: Partial<InsertEnvironmentConfig>): Promise<EnvironmentConfig | undefined> {
    const [result] = await db.update(environmentConfigs).set(config).where(eq(environmentConfigs.configId, configId)).returning();
    return result;
  }

  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const [result] = await db.insert(aiConfigurations).values(config).returning();
    return result;
  }

  async getAiConfiguration(configId: number): Promise<AiConfiguration | undefined> {
    const [result] = await db.select().from(aiConfigurations).where(eq(aiConfigurations.configId, configId));
    return result;
  }

  async updateAiConfiguration(configId: number, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration | undefined> {
    const [result] = await db.update(aiConfigurations).set(config).where(eq(aiConfigurations.configId, configId)).returning();
    return result;
  }

  async clearAllDemoData(): Promise<void> {
    // Clear all tables in reverse dependency order
    await db.delete(testCases);
    await db.delete(userStories);
    await db.delete(testDataConfigs);
    await db.delete(environmentConfigs);
    await db.delete(aiConfigurations);
    await db.delete(azureConfigs);
  }
}

// Export storage instance based on database availability
export const storage = db ? new DatabaseStorage() : null;

if (!storage) {
  console.error("❌ Database storage not available - falling back to simple storage");
}