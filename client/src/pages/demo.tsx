import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, Play, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface GeneratedTestCase {
  id: string;
  title: string;
  type: string;
  priority: string;
  description: string;
  steps: string;
  expectedResult: string;
}

export default function DemoPage() {
  const { toast } = useToast();
  
  const [config, setConfig] = useState<TestCaseConfig>({
    includePositiveTests: true,
    includeNegativeTests: true,
    includeEdgeCases: true,
    includeSecurityCases: false,
    includePerformanceTests: false,
    includeUiTests: true,
    includeUsabilityTests: false,
    includeApiTests: false,
    includeCompatibilityTests: false,
  });

  const [userStory, setUserStory] = useState<DemoUserStory>({
    title: "User Authentication Login",
    description: "As a user, I want to log into the system using my email and password so that I can access my account securely.",
    acceptanceCriteria: "Given a valid email and password, when I click login, then I should be redirected to the dashboard. Given invalid credentials, when I click login, then I should see an error message."
  });

  const [generatedTestCases, setGeneratedTestCases] = useState<GeneratedTestCase[]>([]);

  const generateTestCasesMutation = useMutation({
    mutationFn: async () => {
      // Simulate test case generation based on selected types
      const testCases: GeneratedTestCase[] = [];
      
      if (config.includePositiveTests) {
        testCases.push({
          id: "TC-001",
          title: "Valid User Login - Happy Path",
          type: "Positive",
          priority: "High",
          description: "Verify that a user can successfully log in with valid credentials",
          steps: "1. Navigate to login page\n2. Enter valid email address\n3. Enter correct password\n4. Click 'Login' button",
          expectedResult: "User is successfully authenticated and redirected to dashboard"
        });
      }

      if (config.includeNegativeTests) {
        testCases.push({
          id: "TC-002",
          title: "Invalid Password Login Attempt",
          type: "Negative",
          priority: "High",
          description: "Verify that login fails with incorrect password",
          steps: "1. Navigate to login page\n2. Enter valid email address\n3. Enter incorrect password\n4. Click 'Login' button",
          expectedResult: "Login fails and appropriate error message is displayed"
        });
      }

      if (config.includeEdgeCases) {
        testCases.push({
          id: "TC-003",
          title: "Empty Credentials Login Attempt",
          type: "Edge Case",
          priority: "Medium",
          description: "Verify system behavior when login attempted with empty fields",
          steps: "1. Navigate to login page\n2. Leave email field empty\n3. Leave password field empty\n4. Click 'Login' button",
          expectedResult: "Validation errors displayed for required fields"
        });
      }

      if (config.includeSecurityCases) {
        testCases.push({
          id: "TC-004",
          title: "SQL Injection Prevention",
          type: "Security",
          priority: "High",
          description: "Verify that SQL injection attempts are blocked",
          steps: "1. Navigate to login page\n2. Enter SQL injection payload in email field\n3. Enter any password\n4. Attempt login",
          expectedResult: "Login attempt fails safely without exposing system vulnerabilities"
        });
      }

      if (config.includeUiTests) {
        testCases.push({
          id: "TC-005",
          title: "Login Form UI Elements Validation",
          type: "UI",
          priority: "Medium",
          description: "Verify all UI elements are present and functional",
          steps: "1. Navigate to login page\n2. Verify email input field is present\n3. Verify password input field is present\n4. Verify login button is present and clickable",
          expectedResult: "All UI elements are properly displayed and functional"
        });
      }

      if (config.includePerformanceTests) {
        testCases.push({
          id: "TC-006",
          title: "Login Response Time Performance",
          type: "Performance",
          priority: "Medium",
          description: "Verify login process completes within acceptable time limits",
          steps: "1. Navigate to login page\n2. Enter valid credentials\n3. Measure time from clicking login to dashboard load\n4. Repeat test 10 times",
          expectedResult: "Average login time is under 2 seconds for 95% of attempts"
        });
      }

      if (config.includeUsabilityTests) {
        testCases.push({
          id: "TC-007",
          title: "Password Field Masking",
          type: "Usability",
          priority: "Low",
          description: "Verify password field properly masks input",
          steps: "1. Navigate to login page\n2. Click in password field\n3. Type any text\n4. Observe display",
          expectedResult: "Password input is masked with dots or asterisks"
        });
      }

      if (config.includeApiTests) {
        testCases.push({
          id: "TC-008",
          title: "Authentication API Endpoint Validation",
          type: "API",
          priority: "High",
          description: "Verify authentication API returns correct responses",
          steps: "1. Send POST request to /api/auth/login\n2. Include valid credentials in request body\n3. Verify response status\n4. Verify response contains auth token",
          expectedResult: "API returns 200 status with valid authentication token"
        });
      }

      if (config.includeCompatibilityTests) {
        testCases.push({
          id: "TC-009",
          title: "Cross-Browser Login Compatibility",
          type: "Compatibility",
          priority: "Medium",
          description: "Verify login works across different browsers",
          steps: "1. Test login in Chrome\n2. Test login in Firefox\n3. Test login in Safari\n4. Test login in Edge",
          expectedResult: "Login functionality works consistently across all tested browsers"
        });
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return testCases;
    },
    onSuccess: (data) => {
      setGeneratedTestCases(data);
      toast({
        title: "Test Cases Generated",
        description: `Successfully generated ${data.length} test cases`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate test cases. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'edge case': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'security': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'performance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ui': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'usability': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'api': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'compatibility': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Main
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Test Case Generation Demo</h1>
              <p className="text-muted-foreground">Experience AI-powered test case generation</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* User Story Input */}
            <Card>
              <CardHeader>
                <CardTitle>User Story</CardTitle>
                <CardDescription>Define the user story to generate test cases for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={userStory.title}
                    onChange={(e) => setUserStory({ ...userStory, title: e.target.value })}
                    placeholder="Enter user story title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={userStory.description}
                    onChange={(e) => setUserStory({ ...userStory, description: e.target.value })}
                    placeholder="Enter user story description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="criteria">Acceptance Criteria</Label>
                  <Textarea
                    id="criteria"
                    value={userStory.acceptanceCriteria}
                    onChange={(e) => setUserStory({ ...userStory, acceptanceCriteria: e.target.value })}
                    placeholder="Enter acceptance criteria"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Test Case Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Test Case Types</CardTitle>
                <CardDescription>Select which types of test cases to generate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(config).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => 
                          setConfig({ ...config, [key]: checked as boolean })
                        }
                      />
                      <Label htmlFor={key} className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('include ', '')}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => generateTestCasesMutation.mutate()}
              disabled={generateTestCasesMutation.isPending}
              className="w-full"
              size="lg"
            >
              {generateTestCasesMutation.isPending ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {generateTestCasesMutation.isPending ? "Generating..." : "Generate Test Cases"}
            </Button>
          </div>

          {/* Generated Test Cases */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated Test Cases</CardTitle>
                <CardDescription>
                  {generatedTestCases.length > 0 
                    ? `${generatedTestCases.length} test cases generated`
                    : "Configure and generate test cases to see results"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedTestCases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No test cases generated yet.</p>
                    <p>Configure your settings and click "Generate Test Cases" to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedTestCases.map((testCase) => (
                      <Card key={testCase.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {testCase.id}
                              </Badge>
                              <Badge className={getTypeColor(testCase.type)}>
                                {testCase.type}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getPriorityIcon(testCase.priority)}
                              <span className="text-xs text-muted-foreground">{testCase.priority}</span>
                            </div>
                          </div>
                          <CardTitle className="text-sm">{testCase.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1">DESCRIPTION</h4>
                            <p className="text-sm">{testCase.description}</p>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1">TEST STEPS</h4>
                            <div className="text-sm whitespace-pre-line">{testCase.steps}</div>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1">EXPECTED RESULT</h4>
                            <p className="text-sm">{testCase.expectedResult}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}