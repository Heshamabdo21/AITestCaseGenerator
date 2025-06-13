import { useState } from "react";
import { WorkflowProgress } from "@/components/workflow-progress";
import { ConfigurationPanel } from "@/components/configuration-panel";
import { EnhancedUserStories } from "@/components/enhanced-user-stories";
import { TestCasesSection } from "@/components/test-cases-section";
import { TestDataPanel } from "@/components/test-data-panel";
import { EnvironmentPanel } from "@/components/environment-panel";
import { UnifiedAiConfiguration } from "@/components/unified-ai-configuration";
import { TestCoverageConfiguration } from "@/components/test-coverage-configuration";
import { CsvImportPanel } from "@/components/csv-import-panel";
import { DemoBanner } from "@/components/demo-banner";
import { PlatformTestShowcase } from "@/components/platform-test-showcase";
import { PlatformTutorial } from "@/components/platform-tutorial";
import { UnifiedTestGenerator } from "@/components/unified-test-generator";

import { CopyFeedback } from "@/components/copy-feedback";
import { ModeToggle } from "@/components/mode-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bot, User, TestTube, Target } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleConfigurationSaved = () => {
    setCurrentStep(2);
  };

  const handleTestCasesGenerated = () => {
    setCurrentStep(4);
  };

  const handleReset = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="text-primary-foreground text-lg" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">AI Test Case Generator</h1>
                <p className="text-sm text-muted-foreground">Powered by Azure DevOps Integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/demo">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <TestTube size={16} />
                  Test Demo
                </Button>
              </Link>
              <div data-tour="theme-toggle">
                <ModeToggle />
              </div>
              <span className="text-sm text-muted-foreground">test-user@company.com</span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-primary-foreground text-sm" size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <DemoBanner />
        <WorkflowProgress currentStep={currentStep} onReset={handleReset} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="azure" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="azure">Azure & AI</TabsTrigger>
                <TabsTrigger value="coverage">Test Coverage</TabsTrigger>
                <TabsTrigger value="test">Test Setup</TabsTrigger>
                <TabsTrigger value="import">CSV Import</TabsTrigger>
              </TabsList>
              
              <TabsContent value="azure" className="space-y-4">
                <ConfigurationPanel onConfigurationSaved={handleConfigurationSaved} />
                <UnifiedAiConfiguration />
              </TabsContent>
              
              <TabsContent value="coverage" className="space-y-4">
                <TestCoverageConfiguration />
              </TabsContent>
              
              <TabsContent value="test" className="space-y-4">
                <TestDataPanel />
                <EnvironmentPanel />
              </TabsContent>
              
              <TabsContent value="import" className="space-y-4">
                <CsvImportPanel />
              </TabsContent>
              

            </Tabs>
          </div>

          {/* Main Work Area */}
          <div className="lg:col-span-2 space-y-8">
            <UnifiedTestGenerator data-tour="test-generator" />
            <EnhancedUserStories onTestCasesGenerated={handleTestCasesGenerated} />
            <TestCasesSection />
          </div>
        </div>
      </div>
    </div>
  );
}
