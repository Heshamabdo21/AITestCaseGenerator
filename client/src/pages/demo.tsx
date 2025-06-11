import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Play, TestTube, FileCheck } from "lucide-react";

interface TestCaseConfig {
  includePositiveTests: boolean;
  includeNegativeTests: boolean;
  includeEdgeCases: boolean;
  includeSecurityCases: boolean;
  includePerformanceTests: boolean;
  includeUiTests: boolean;
  includeUsabilityTests: boolean;
  includeApiTests: boolean;
  includeCompatibilityTests: boolean;
}

interface DemoUserStory {
  title: string;
  description: string;
  acceptanceCriteria: string;
}

export default function DemoPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<TestCaseConfig>({
    includePositiveTests: true,
    includeNegativeTests: true,
    includeEdgeCases: false,
    includeSecurityCases: false,
    includePerformanceTests: false,
    includeUiTests: false,
    includeUsabilityTests: false,
    includeApiTests: false,
    includeCompatibilityTests: false,
  });

  const [userStory, setUserStory] = useState<DemoUserStory>({
    title: "User Login Functionality",
    description: "As a user, I want to be able to log in to the system so that I can access my account",
    acceptanceCriteria: "AC1: User can enter username and password\nAC2: System validates credentials\nAC3: User is redirected to dashboard upon successful login\nAC4: Error message shown for invalid credentials"
  });

  const [generatedTestCases, setGeneratedTestCases] = useState<any[]>([]);

  const generateTestCasesMutation = useMutation({
    mutationFn: async () => {
      // First, create a temporary Azure config for demo
      const azureConfigResponse = await apiRequest("/api/azure-config", "POST", {
        organizationUrl: "https://dev.azure.com/demo",
        patToken: "demo-token",
        project: "demo-project",
        openaiKey: "demo-key"
      });
      const azureConfig = await azureConfigResponse.json();

      // Create AI configuration with selected options
      await apiRequest("/api/ai-configuration", "POST", {
        configId: azureConfig.id,
        ...config,
        testComplexity: "medium",
        additionalInstructions: "Demo test case generation"
      });

      // Create a demo user story
      const userStoryResponse = await apiRequest("/api/user-stories", "POST", {
        azureId: "demo-1",
        title: userStory.title,
        description: userStory.description,
        acceptanceCriteria: userStory.acceptanceCriteria,
        state: "Active",
        assignedTo: "Demo User",
        priority: "High",
        createdDate: new Date().toISOString(),
        tags: ["demo"],
        configId: azureConfig.id
      });
      const createdUserStory = await userStoryResponse.json();

      // Generate test cases
      const testCasesResponse = await apiRequest("/api/test-cases/generate", "POST", {
        userStoryIds: [createdUserStory.id]
      });
      return await testCasesResponse.json();
    },
    onSuccess: (data) => {
      setGeneratedTestCases(data);
      toast({
        title: "Test Cases Generated",
        description: `Successfully generated ${data.length} test cases based on your selections`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedTestTypes = Object.entries(config)
    .filter(([_, selected]) => selected)
    .map(([type, _]) => type.replace('include', '').replace('Tests', '').replace('Cases', ''))
    .join(', ');

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-600" />
          Test Case Generation Demo
        </h1>
        <p className="text-muted-foreground">
          Experience the new test case generation options with different test types
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              Test Case Configuration
            </CardTitle>
            <CardDescription>
              Select which types of test cases to generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Basic Test Types
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="positive"
                    checked={config.includePositiveTests}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includePositiveTests: !!checked }))
                    }
                  />
                  <Label htmlFor="positive" className="text-sm">Positive Tests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="negative"
                    checked={config.includeNegativeTests}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includeNegativeTests: !!checked }))
                    }
                  />
                  <Label htmlFor="negative" className="text-sm">Negative Tests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edge"
                    checked={config.includeEdgeCases}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includeEdgeCases: !!checked }))
                    }
                  />
                  <Label htmlFor="edge" className="text-sm">Edge Cases</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="security"
                    checked={config.includeSecurityCases}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includeSecurityCases: !!checked }))
                    }
                  />
                  <Label htmlFor="security" className="text-sm">Security Tests</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Advanced Test Types
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="performance"
                    checked={config.includePerformanceTests}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includePerformanceTests: !!checked }))
                    }
                  />
                  <Label htmlFor="performance" className="text-sm">Performance Tests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ui"
                    checked={config.includeUiTests}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includeUiTests: !!checked }))
                    }
                  />
                  <Label htmlFor="ui" className="text-sm">UI Tests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="usability"
                    checked={config.includeUsabilityTests}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includeUsabilityTests: !!checked }))
                    }
                  />
                  <Label htmlFor="usability" className="text-sm">Usability Tests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="api"
                    checked={config.includeApiTests}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includeApiTests: !!checked }))
                    }
                  />
                  <Label htmlFor="api" className="text-sm">API Tests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compatibility"
                    checked={config.includeCompatibilityTests}
                    onCheckedChange={(checked) =>
                      setConfig(prev => ({ ...prev, includeCompatibilityTests: !!checked }))
                    }
                  />
                  <Label htmlFor="compatibility" className="text-sm">Compatibility Tests</Label>
                </div>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Selected types:</span> {selectedTestTypes || 'None'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Story Input */}
        <Card>
          <CardHeader>
            <CardTitle>Sample User Story</CardTitle>
            <CardDescription>
              Customize the user story for test case generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={userStory.title}
                onChange={(e) => setUserStory(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter user story title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={userStory.description}
                onChange={(e) => setUserStory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter user story description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="criteria">Acceptance Criteria</Label>
              <Textarea
                id="criteria"
                value={userStory.acceptanceCriteria}
                onChange={(e) => setUserStory(prev => ({ ...prev, acceptanceCriteria: e.target.value }))}
                placeholder="Enter acceptance criteria"
                rows={4}
              />
            </div>
            
            <Button
              onClick={() => generateTestCasesMutation.mutate()}
              disabled={generateTestCasesMutation.isPending}
              className="w-full"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              {generateTestCasesMutation.isPending ? "Generating..." : "Generate Test Cases"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Generated Test Cases */}
      {generatedTestCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Test Cases ({generatedTestCases.length})</CardTitle>
            <CardDescription>
              Test cases generated based on your configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedTestCases.map((testCase, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">{testCase.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testCase.priority === 'High' ? 'bg-red-100 text-red-800' :
                      testCase.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {testCase.priority}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Objective:</strong> {testCase.objective}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong className="block mb-1">Prerequisites:</strong>
                      <pre className="whitespace-pre-wrap bg-muted p-2 rounded text-xs">
                        {testCase.prerequisites}
                      </pre>
                    </div>
                    <div>
                      <strong className="block mb-1">Expected Result:</strong>
                      <pre className="whitespace-pre-wrap bg-muted p-2 rounded text-xs">
                        {testCase.expectedResult}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <strong className="block mb-1">Test Steps:</strong>
                    <pre className="whitespace-pre-wrap bg-muted p-2 rounded text-xs max-h-40 overflow-y-auto">
                      {testCase.testSteps}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}