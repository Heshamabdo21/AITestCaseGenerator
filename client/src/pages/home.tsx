import { useState } from "react";
import { WorkflowProgress } from "@/components/workflow-progress";
import { ConfigurationPanel } from "@/components/configuration-panel";
import { UserStoriesSection } from "@/components/user-stories-section";
import { TestCasesSection } from "@/components/test-cases-section";

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
            <ConfigurationPanel onConfigurationSaved={handleConfigurationSaved} />
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
