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
  InsertAiContext
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
  aiContext 
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  // Azure Config methods
  async createAzureConfig(config: InsertAzureConfig): Promise<AzureConfig> {
    const [result] = await db.insert(azureConfigs).values(config).returning();
    return result;
  }

  async getAzureConfig(id: number): Promise<AzureConfig | undefined> {
    const [result] = await db.select().from(azureConfigs).where(eq(azureConfigs.id, id));
    return result || undefined;
  }

  async getLatestAzureConfig(): Promise<AzureConfig | undefined> {
    const [result] = await db.select().from(azureConfigs).orderBy(desc(azureConfigs.id)).limit(1);
    return result || undefined;
  }

  async updateAzureConfig(id: number, config: Partial<InsertAzureConfig>): Promise<AzureConfig | undefined> {
    const [result] = await db.update(azureConfigs).set(config).where(eq(azureConfigs.id, id)).returning();
    return result || undefined;
  }

  // User Stories methods
  async createUserStory(story: InsertUserStory): Promise<UserStory> {
    const [result] = await db.insert(userStories).values(story).returning();
    return result;
  }

  async getUserStories(configId?: number): Promise<UserStory[]> {
    if (configId) {
      return await db.select().from(userStories).where(eq(userStories.configId, configId));
    }
    return await db.select().from(userStories);
  }

  async getUserStory(id: number): Promise<UserStory | undefined> {
    const [result] = await db.select().from(userStories).where(eq(userStories.id, id));
    return result || undefined;
  }

  async getUserStoriesByIds(ids: number[]): Promise<UserStory[]> {
    if (ids.length === 0) return [];
    return await db.select().from(userStories).where(inArray(userStories.id, ids));
  }

  async clearUserStories(configId: number): Promise<void> {
    await db.delete(userStories).where(eq(userStories.configId, configId));
  }

  // Test Cases methods
  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const [result] = await db.insert(testCases).values(testCase).returning();
    return result;
  }

  async getTestCases(userStoryId?: number): Promise<TestCase[]> {
    if (userStoryId) {
      return await db.select().from(testCases).where(eq(testCases.userStoryId, userStoryId));
    }
    return await db.select().from(testCases);
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    const [result] = await db.select().from(testCases).where(eq(testCases.id, id));
    return result || undefined;
  }

  async updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const [result] = await db.update(testCases).set(testCase).where(eq(testCases.id, id)).returning();
    return result || undefined;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    const result = await db.delete(testCases).where(eq(testCases.id, id));
    return (result as any).rowCount > 0;
  }

  async getTestCasesByIds(ids: number[]): Promise<TestCase[]> {
    if (ids.length === 0) return [];
    return await db.select().from(testCases).where(inArray(testCases.id, ids));
  }

  // Test Plans methods
  async createTestPlan(testPlan: InsertTestPlan): Promise<TestPlan> {
    const [result] = await db.insert(testPlans).values(testPlan).returning();
    return result;
  }

  async getTestPlans(configId?: number): Promise<TestPlan[]> {
    if (configId) {
      return await db.select().from(testPlans).where(eq(testPlans.configId, configId));
    }
    return await db.select().from(testPlans);
  }

  async getTestPlan(id: number): Promise<TestPlan | undefined> {
    const [result] = await db.select().from(testPlans).where(eq(testPlans.id, id));
    return result || undefined;
  }

  async clearTestPlans(configId: number): Promise<void> {
    await db.delete(testPlans).where(eq(testPlans.configId, configId));
  }

  // Test Suites methods
  async createTestSuite(testSuite: InsertTestSuite): Promise<TestSuite> {
    const [result] = await db.insert(testSuites).values(testSuite).returning();
    return result;
  }

  async getTestSuites(testPlanId?: number): Promise<TestSuite[]> {
    if (testPlanId) {
      return await db.select().from(testSuites).where(eq(testSuites.testPlanId, testPlanId));
    }
    return await db.select().from(testSuites);
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    const [result] = await db.select().from(testSuites).where(eq(testSuites.id, id));
    return result || undefined;
  }

  async clearTestSuites(configId: number): Promise<void> {
    await db.delete(testSuites).where(eq(testSuites.configId, configId));
  }

  // Test Case Links methods
  async createTestCaseLink(link: InsertTestCaseLink): Promise<TestCaseLink> {
    const [result] = await db.insert(testCaseLinks).values(link).returning();
    return result;
  }

  async getTestCaseLinks(testCaseId: number): Promise<TestCaseLink[]> {
    return await db.select().from(testCaseLinks).where(eq(testCaseLinks.testCaseId, testCaseId));
  }

  async deleteTestCaseLink(id: number): Promise<boolean> {
    const result = await db.delete(testCaseLinks).where(eq(testCaseLinks.id, id));
    return (result as any).rowCount > 0;
  }

  // Test Case Feedback methods
  async createTestCaseFeedback(feedback: InsertTestCaseFeedback): Promise<TestCaseFeedback> {
    const [result] = await db.insert(testCaseFeedback).values(feedback).returning();
    return result;
  }

  async getTestCaseFeedback(testCaseId: number): Promise<TestCaseFeedback[]> {
    return await db.select().from(testCaseFeedback).where(eq(testCaseFeedback.testCaseId, testCaseId));
  }

  async getAllFeedback(): Promise<TestCaseFeedback[]> {
    return await db.select().from(testCaseFeedback);
  }

  // AI Context methods
  async createOrUpdateAiContext(context: InsertAiContext): Promise<AiContext> {
    const existing = await db.select().from(aiContext).where(eq(aiContext.configId, context.configId!)).limit(1);
    
    if (existing.length > 0) {
      const [result] = await db.update(aiContext).set(context).where(eq(aiContext.configId, context.configId!)).returning();
      return result;
    } else {
      const [result] = await db.insert(aiContext).values(context).returning();
      return result;
    }
  }

  async getAiContext(configId: number): Promise<AiContext | undefined> {
    const [result] = await db.select().from(aiContext).where(eq(aiContext.configId, configId));
    return result || undefined;
  }
}

export const storage = new DatabaseStorage();