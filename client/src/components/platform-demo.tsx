import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Smartphone, Code, Play, CheckCircle, Zap } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Platform {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
  testCasePreview: {
    title: string;
    steps: string[];
    validation: string[];
  };
}

export function PlatformDemo() {
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: "web",
      label: "Web Portal Tests",
      icon: <Globe className="h-4 w-4" />,
      description: "Browser-based testing with UI interactions",
      enabled: true,
      testCasePreview: {
        title: "Web Login Authentication",
        steps: [
          "Open web browser and navigate to login page",
          "Enter username and password in form fields", 
          "Click login button and verify redirect",
          "Validate dashboard elements load correctly"
        ],
        validation: [
          "Login form displays correctly",
          "Session management works properly",
          "Multi-browser compatibility verified"
        ]
      }
    },
    {
      id: "mobile",
      label: "Mobile App Tests", 
      icon: <Smartphone className="h-4 w-4" />,
      description: "Touch-based testing for mobile devices",
      enabled: false,
      testCasePreview: {
        title: "Mobile Login Experience",
        steps: [
          "Launch mobile app on target device",
          "Tap on username and password input fields",
          "Use on-screen keyboard for text entry",
          "Tap login button with finger gesture"
        ],
        validation: [
          "Touch interactions respond correctly",
          "Screen orientation changes handled",
          "App performance acceptable on device"
        ]
      }
    },
    {
      id: "api",
      label: "API Tests",
      icon: <Code className="h-4 w-4" />,
      description: "Backend service validation", 
      enabled: false,
      testCasePreview: {
        title: "Authentication API Endpoint",
        steps: [
          "Send POST request to /api/auth/login",
          "Include username/password in JSON payload",
          "Verify response status code is 200",
          "Extract authentication token from response"
        ],
        validation: [
          "API returns proper HTTP status codes",
          "Response structure matches documentation",
          "Authentication tokens are valid"
        ]
      }
    }
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current Azure config for iteration path tracking
  const { data: azureConfig } = useQuery({
    queryKey: ['/api/azure-config/latest'],
    retry: false,
  });

  const { data: userStories = [] } = useQuery({
    queryKey: ['/api/user-stories/stored', (azureConfig as any)?.iterationPath],
    retry: false
  });

  const { data: aiConfig } = useQuery({
    queryKey: ['/api/ai-configuration'],
    retry: false
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (platformUpdates: any) => {
      if (aiConfig) {
        return api.updateAiConfiguration(platformUpdates);
      } else {
        return api.createAiConfiguration({
          includePositiveTests: true,
          includeNegativeTests: true,
          includeEdgeCases: true,
          includeSecurityCases: false,
          includePerformanceTests: false,
          includeUiTests: false,
          includeUsabilityTests: false,
          includeApiTests: false,
          includeCompatibilityTests: false,
          testComplexity: "medium",
          ...platformUpdates
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-configuration'] });
    }
  });

  const generateTestsMutation = useMutation({
    mutationFn: async () => {
      const userStoriesArray = Array.isArray(userStories) ? userStories : [];
      if (userStoriesArray.length === 0) {
        throw new Error("No user stories available");
      }

      return api.generateTestCases({
        userStoryIds: userStoriesArray.map((s: any) => s.id),
        testType: "web",
        style: "step-by-step",
        coverageLevel: "standard", 
        includePositive: true,
        includeNegative: true,
        includeEdgeCases: true,
        includeSecurity: false,
        includePerformance: false,
        includeAccessibility: false,
        testComplexity: "medium"
      });
    },
    onSuccess: (data) => {
      const enabledPlatforms = platforms.filter(p => p.enabled);
      toast({
        title: "Test Cases Generated",
        description: `Created ${data.length} test cases for ${enabledPlatforms.length} platform(s)`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handlePlatformToggle = async (platformId: string, enabled: boolean) => {
    const updatedPlatforms = platforms.map(p => 
      p.id === platformId ? { ...p, enabled } : p
    );
    setPlatforms(updatedPlatforms);

    const platformUpdates = {
      enableWebPortalTests: updatedPlatforms.find(p => p.id === "web")?.enabled || false,
      enableMobileAppTests: updatedPlatforms.find(p => p.id === "mobile")?.enabled || false,
      enableApiTests: updatedPlatforms.find(p => p.id === "api")?.enabled || false
    };

    await updateConfigMutation.mutateAsync(platformUpdates);
  };

  const handleGenerate = () => {
    const enabledPlatforms = platforms.filter(p => p.enabled);
    if (enabledPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected", 
        description: "Please select at least one platform",
        variant: "destructive"
      });
      return;
    }
    generateTestsMutation.mutate();
  };

  const enabledCount = platforms.filter(p => p.enabled).length;
  const userStoriesArray = Array.isArray(userStories) ? userStories : [];
  const estimatedTests = enabledCount * userStoriesArray.length * 3;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span>Platform Test Selection Demo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Select different platform combinations to see how test case generation adapts. Each platform creates specialized test scenarios.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="platforms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platforms">Platform Selection</TabsTrigger>
            <TabsTrigger value="preview">Test Previews</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <Card key={platform.id} className={`cursor-pointer transition-all ${
                  platform.enabled ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Checkbox
                        checked={platform.enabled}
                        onCheckedChange={(checked) => handlePlatformToggle(platform.id, !!checked)}
                      />
                      {platform.icon}
                      <span className="font-medium text-sm">{platform.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {platform.description}
                    </p>
                    {platform.enabled && (
                      <Badge variant="default" className="text-xs">
                        Active - Will generate {userStoriesArray.length * 3} tests
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Generation Summary</p>
                  <p className="text-sm text-muted-foreground">
                    {enabledCount} platform(s) • {userStoriesArray.length} user stories • {estimatedTests} total test cases
                  </p>
                </div>
                <Button 
                  onClick={handleGenerate}
                  disabled={generateTestsMutation.isPending || enabledCount === 0}
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>{generateTestsMutation.isPending ? "Generating..." : "Generate Tests"}</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {platforms.filter(p => p.enabled).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select platforms to see test case previews</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium">Test Case Previews</h4>
                {platforms.filter(p => p.enabled).map((platform) => (
                  <Card key={platform.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        {platform.icon}
                        <span className="font-medium">{platform.testCasePreview.title}</span>
                        <Badge variant="outline">{platform.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Test Steps</h5>
                        <div className="space-y-1">
                          {platform.testCasePreview.steps.map((step, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <Badge variant="secondary" className="text-xs mt-0.5 min-w-[20px] justify-center">
                                {index + 1}
                              </Badge>
                              <span className="text-xs">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm mb-2">Validations</h5>
                        <div className="space-y-1">
                          {platform.testCasePreview.validation.map((validation, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-xs">{validation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}