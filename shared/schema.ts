import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Azure DevOps Configuration
export const azureConfigs = pgTable("azure_configs", {
  id: serial("id").primaryKey(),
  organizationUrl: text("organization_url").notNull(),
  patToken: text("pat_token").notNull(),
  project: text("project").notNull(),
  openaiKey: text("openai_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Stories from Azure DevOps
export const userStories = pgTable("user_stories", {
  id: serial("id").primaryKey(),
  azureId: text("azure_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  state: text("state").notNull(),
  assignedTo: text("assigned_to"),
  priority: text("priority"),
  createdDate: text("created_date"),
  tags: json("tags").$type<string[]>().default([]),
  configId: integer("config_id").references(() => azureConfigs.id),
});

// Generated Test Cases
export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  objective: text("objective").notNull(),
  prerequisites: json("prerequisites").$type<string[]>().default([]),
  testSteps: json("test_steps").$type<string[]>().default([]),
  expectedResult: text("expected_result").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  userStoryId: integer("user_story_id").references(() => userStories.id),
  azureTestCaseId: text("azure_test_case_id"), // Set when added to Azure DevOps
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

// Type exports
export type AzureConfig = typeof azureConfigs.$inferSelect;
export type InsertAzureConfig = z.infer<typeof insertAzureConfigSchema>;

export type UserStory = typeof userStories.$inferSelect;
export type InsertUserStory = z.infer<typeof insertUserStorySchema>;

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;

// Azure DevOps Work Item structure
export type AzureWorkItem = {
  id: number;
  fields: {
    "System.Title": string;
    "System.Description"?: string;
    "System.State": string;
    "System.AssignedTo"?: {
      displayName: string;
    };
    "Microsoft.VSTS.Common.Priority"?: number;
    "System.CreatedDate": string;
    "System.Tags"?: string;
  };
};

// Test case generation request
export const generateTestCaseRequestSchema = z.object({
  userStoryIds: z.array(z.number()),
  style: z.enum(["gherkin", "step-by-step", "scenario-based"]).default("step-by-step"),
  coverageLevel: z.enum(["comprehensive", "standard", "minimal"]).default("standard"),
  includeNegative: z.boolean().default(true),
  includePerformance: z.boolean().default(false),
});

export type GenerateTestCaseRequest = z.infer<typeof generateTestCaseRequestSchema>;
