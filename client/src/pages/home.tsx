import { useState } from "react";
import { WorkflowProgress } from "@/components/workflow-progress";
import { ConfigurationPanel } from "@/components/configuration-panel";
import { UserStoriesSection } from "@/components/user-stories-section";
import { TestCasesSection } from "@/components/test-cases-section";
import { TestDataPanel } from "@/components/test-data-panel";
import { EnvironmentPanel } from "@/components/environment-panel";
import { UnifiedAiConfiguration } from "@/components/unified-ai-configuration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Test Case Generator</h1>
                <p className="text-sm text-gray-600">Powered by Azure DevOps Integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">test-user@company.com</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-white text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <WorkflowProgress currentStep={currentStep} onReset={handleReset} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Tabs defaultValue="azure" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="azure">Azure & AI</TabsTrigger>
                <TabsTrigger value="test">Test Setup</TabsTrigger>
              </TabsList>
              
              <TabsContent value="azure" className="space-y-4">
                <ConfigurationPanel onConfigurationSaved={handleConfigurationSaved} />
                <UnifiedAiConfiguration />
              </TabsContent>
              
              <TabsContent value="test" className="space-y-4">
                <TestDataPanel />
                <EnvironmentPanel />
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Work Area */}
          <div className="lg:col-span-2 space-y-8">
            <UserStoriesSection onTestCasesGenerated={handleTestCasesGenerated} />
            <TestCasesSection />
          </div>
        </div>
      </div>
    </div>
  );
}
