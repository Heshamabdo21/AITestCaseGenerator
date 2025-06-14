import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Azure DevOps Configuration
export const azureConfigs = pgTable("azure_configs", {
  id: serial("id").primaryKey(),
  organizationUrl: text("organization_url").notNull(),
  patToken: text("pat_token").notNull(),
  project: text("project").notNull(),
  iterationPath: text("iteration_path"), // Optional iteration path for filtering user stories
  testPlanId: text("test_plan_id"), // Optional test plan ID for test case creation
  testPlanName: text("test_plan_name"), // Optional test plan name for display
  testSuiteStrategy: text("test_suite_strategy").default("user_story"), // "user_story", "test_type", "single"
  createTestSuites: boolean("create_test_suites").default(true),
  openaiKey: text("openai_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Stories from Azure DevOps
export const userStories = pgTable("user_stories", {
  id: serial("id").primaryKey(),
  azureId: text("azure_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  acceptanceCriteria: text("acceptance_criteria"),
  state: text("state").notNull(),
  assignedTo: text("assigned_to"),
  priority: text("priority"),
  createdDate: text("created_date"),
  tags: json("tags").$type<string[]>().default([]),
  configId: integer("config_id").references(() => azureConfigs.id),
});

// Test Step structure for individual steps with expected results
export interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
}

// Generated Test Cases
export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  objective: text("objective").notNull(),
  prerequisites: text("prerequisites").notNull(),
  testSteps: text("test_steps").notNull(), // Keep as text for compatibility
  testStepsStructured: json("test_steps_structured").$type<TestStep[]>(), // New structured format
  expectedResult: text("expected_result").notNull(), // Overall expected result
  testPassword: text("test_password"), // Password for test execution
  requiredPermissions: text("required_permissions"), // Required permissions for test execution
  priority: text("priority").notNull(),
  testType: text("test_type").notNull().default("web"), // web, api, mobile
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  userStoryId: integer("user_story_id").references(() => userStories.id),
  azureTestCaseId: text("azure_test_case_id"), // Set when added to Azure DevOps
  createdAt: timestamp("created_at").defaultNow(),
});

// Test Data Configuration
export const testDataConfigs = pgTable("test_data_configs", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").references(() => azureConfigs.id),
  username: text("username"),
  password: text("password"),
  webPortalUrl: text("web_portal_url"),
  permissions: json("permissions").$type<string[]>().default([]),
  additionalData: json("additional_data").$type<Record<string, any>>().default({}),
  uploadedFiles: json("uploaded_files").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Environment Configuration
export const environmentConfigs = pgTable("environment_configs", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").references(() => azureConfigs.id),
  operatingSystem: text("operating_system").notNull(), // windows, linux, mac
  osVersion: text("os_version"),
  webBrowser: text("web_browser"), // chrome, firefox, safari, edge
  browserVersion: text("browser_version"),
  mobileDevice: text("mobile_device"), // ios, android
  mobileVersion: text("mobile_version"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Configuration
export const aiConfigurations = pgTable("ai_configurations", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").references(() => azureConfigs.id),
  includePositiveTests: boolean("include_positive_tests").default(true),
  includeNegativeTests: boolean("include_negative_tests").default(true),
  includeEdgeCases: boolean("include_edge_cases").default(true),
  includeSecurityCases: boolean("include_security_cases").default(true),
  includePerformanceTests: boolean("include_performance_tests").default(true),
  includeUiTests: boolean("include_ui_tests").default(true),
  includeUsabilityTests: boolean("include_usability_tests").default(true),
  includeApiTests: boolean("include_api_tests").default(true),
  includeCompatibilityTests: boolean("include_compatibility_tests").default(true),
  testComplexity: text("test_complexity").default("medium"), // simple, medium, complex
  additionalInstructions: text("additional_instructions"),
  // Test type preferences
  enableWebPortalTests: boolean("enable_web_portal_tests").default(true),
  enableMobileAppTests: boolean("enable_mobile_app_tests").default(false),
  enableApiTests: boolean("enable_api_tests").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports
export const insertAzureConfigSchema = createInsertSchema(azureConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertUserStorySchema = createInsertSchema(userStories).omit({
  id: true,
});

export const insertTestCaseSchema = createInsertSchema(testCases).omit({
  id: true,
  createdAt: true,
});

export const insertTestDataConfigSchema = createInsertSchema(testDataConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertEnvironmentConfigSchema = createInsertSchema(environmentConfigs).omit({
  id: true,
  createdAt: true,
});

export const insertAiConfigurationSchema = createInsertSchema(aiConfigurations).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type AzureConfig = typeof azureConfigs.$inferSelect;
export type InsertAzureConfig = z.infer<typeof insertAzureConfigSchema>;

export type UserStory = typeof userStories.$inferSelect;
export type InsertUserStory = z.infer<typeof insertUserStorySchema>;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

export type TestDataConfig = typeof testDataConfigs.$inferSelect;
export type InsertTestDataConfig = z.infer<typeof insertTestDataConfigSchema>;

export type EnvironmentConfig = typeof environmentConfigs.$inferSelect;
export type InsertEnvironmentConfig = z.infer<typeof insertEnvironmentConfigSchema>;

export type AiConfiguration = typeof aiConfigurations.$inferSelect;
export type InsertAiConfiguration = z.infer<typeof insertAiConfigurationSchema>;

// Azure DevOps Work Item structure
export type AzureWorkItem = {
  id: number;
  fields: {
    "System.Title": string;
    "System.Description"?: string;
    "Microsoft.VSTS.Common.AcceptanceCriteria"?: string;
    "System.State": string;
    "System.AssignedTo"?: {
      displayName: string;
    };
    "Microsoft.VSTS.Common.Priority"?: number;
    "System.CreatedDate": string;
    "System.Tags"?: string;
  };
};

// Test Plans and Test Suites
export const testPlans = pgTable("test_plans", {
  id: serial("id").primaryKey(),
  azureId: text("azure_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  state: text("state").notNull(),
  configId: integer("config_id").references(() => azureConfigs.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const testSuites = pgTable("test_suites", {
  id: serial("id").primaryKey(),
  azureId: text("azure_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  testPlanId: integer("test_plan_id").references(() => testPlans.id),
  configId: integer("config_id").references(() => azureConfigs.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced test cases with linking and feedback
export const testCaseLinks = pgTable("test_case_links", {
  id: serial("id").primaryKey(),
  testCaseId: integer("test_case_id").references(() => testCases.id),
  linkedUserStoryId: text("linked_user_story_id").notNull(),
  linkType: text("link_type").notNull().default("tests"), // tests, blocks, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const testCaseFeedback = pgTable("test_case_feedback", {
  id: serial("id").primaryKey(),
  testCaseId: integer("test_case_id").references(() => testCases.id),
  feedbackType: text("feedback_type").notNull(), // improvement, issue, positive
  feedbackText: text("feedback_text").notNull(),
  userEmail: text("user_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Context and Learning
export const aiContext = pgTable("ai_context", {
  id: serial("id").primaryKey(),
  projectContext: json("project_context").$type<string[]>().default([]),
  domainKnowledge: json("domain_knowledge").$type<string[]>().default([]),
  testingPatterns: json("testing_patterns").$type<string[]>().default([]),
  customInstructions: text("custom_instructions"),
  configId: integer("config_id").references(() => azureConfigs.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Test case generation request with enhanced options
export const generateTestCaseRequestSchema = z.object({
  userStoryIds: z.array(z.number()),
  testType: z.enum(["web", "api", "mobile"]).default("web"),
  style: z.enum(["gherkin", "step-by-step", "scenario-based"]).default("step-by-step"),
  coverageLevel: z.enum(["comprehensive", "standard", "minimal"]).default("standard"),
  includePositive: z.boolean().default(true),
  includeNegative: z.boolean().default(true),
  includeEdgeCases: z.boolean().default(true),
  includeSecurity: z.boolean().default(false),
  includePerformance: z.boolean().default(false),
  includeAccessibility: z.boolean().default(false),
  testComplexity: z.enum(["simple", "medium", "complex"]).default("medium"),
  targetTestPlan: z.string().optional(),
  targetTestSuite: z.string().optional(),
  customContext: z.string().optional(),
});

// Schema exports for new tables
export const insertTestPlanSchema = createInsertSchema(testPlans).omit({
  id: true,
  createdAt: true,
});

export const insertTestSuiteSchema = createInsertSchema(testSuites).omit({
  id: true,
  createdAt: true,
});

export const insertTestCaseLinkSchema = createInsertSchema(testCaseLinks).omit({
  id: true,
  createdAt: true,
});

export const insertTestCaseFeedbackSchema = createInsertSchema(testCaseFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertAiContextSchema = createInsertSchema(aiContext).omit({
  id: true,
  updatedAt: true,
});

// Type exports for new models
export type TestPlan = typeof testPlans.$inferSelect;
export type InsertTestPlan = z.infer<typeof insertTestPlanSchema>;

export type TestSuite = typeof testSuites.$inferSelect;
export type InsertTestSuite = z.infer<typeof insertTestSuiteSchema>;

export type TestCaseLink = typeof testCaseLinks.$inferSelect;
export type InsertTestCaseLink = z.infer<typeof insertTestCaseLinkSchema>;

export type TestCaseFeedback = typeof testCaseFeedback.$inferSelect;
export type InsertTestCaseFeedback = z.infer<typeof insertTestCaseFeedbackSchema>;

export type AiContext = typeof aiContext.$inferSelect;
export type InsertAiContext = z.infer<typeof insertAiContextSchema>;

export type GenerateTestCaseRequest = z.infer<typeof generateTestCaseRequestSchema>;
