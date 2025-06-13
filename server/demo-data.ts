import type { InsertUserStory, InsertAzureConfig, InsertAiConfiguration } from "@shared/schema";
import { simpleStorage } from "./simple-storage";

export async function initializeDemoData() {
  try {
    // Check if any configuration already exists
    const existingConfig = await simpleStorage.getLatestAzureConfig();
    if (existingConfig) {
      return; // Configuration already exists, skip initialization
    }

    // No demo data will be created - only authentic Azure DevOps data will be displayed
    console.log("✓ No demo data initialized - only authentic Azure DevOps data will be displayed");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}