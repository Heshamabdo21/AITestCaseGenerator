import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Smartphone, Code, Play, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PlatformConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

export function LiveTestGenerator() {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([
    {
      id: "web",
      label: "Web Portal Tests",
      icon: <Globe className="h-4 w-4" />,
      description: "Browser-based UI testing with form interactions",
      enabled: true
    },
    {
      id: "mobile", 
      label: "Mobile App Tests",
      icon: <Smartphone className="h-4 w-4" />,
      description: "Touch-based testing for mobile devices",
      enabled: false
    },
    {
      id: "api",
      label: "API Tests", 
      icon: <Code className="h-4 w-4" />,
      description: "Backend endpoint validation and data testing",
      enabled: false
    }
  ]);

  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load user stories for test generation
  const { data: userStories = [] } = useQuery({
    queryKey: ['/api/user-stories/stored'],
    retry: false
  });

  // Load current AI configuration 
  const { data: aiConfig } = useQuery({
    queryKey: ['/api/ai-configuration'],
    retry: false
  });

  const updateAiConfigMutation = useMutation({
    mutationFn: async (platformUpdates: any) => {
      if (aiConfig) {
        return api.updateAiConfiguration({
          ...platformUpdates
        });
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
      if (!Array.isArray(userStories) || userStories.length === 0) {
        throw new Error("No user stories available for test generation");
      }

      // Simulate progressive generation for each platform
      const enabledPlatforms = platforms.filter(p => p.enabled);
      const totalSteps = enabledPlatforms.length * userStories.length;
      let currentStep = 0;

      setGenerationProgress(0);
      
      for (const platform of enabledPlatforms) {
        setCurrentPlatform(platform.label);
        
        for (const story of userStories) {
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 800));
          
          currentStep++;
          setGenerationProgress((currentStep / totalSteps) * 100);
        }
      }

      // Generate actual test cases
      return api.generateTestCases({
        userStoryIds: userStories.map((s: any) => s.id),
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
      setGenerationProgress(100);
      setCurrentPlatform("");
      toast({
        title: "Test Cases Generated Successfully",
        description: `Created ${data.length} test cases across ${platforms.filter(p => p.enabled).length} platform(s)`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
    },
    onError: (error: any) => {
      setGenerationProgress(0);
      setCurrentPlatform("");
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

    // Update AI configuration with platform preferences
    const platformUpdates = {
      enableWebPortalTests: updatedPlatforms.find(p => p.id === "web")?.enabled || false,
      enableMobileAppTests: updatedPlatforms.find(p => p.id === "mobile")?.enabled || false,
      enableApiTests: updatedPlatforms.find(p => p.id === "api")?.enabled || false
    };

    await updateAiConfigMutation.mutateAsync(platformUpdates);
  };

  const handleGenerateTests = () => {
    const enabledPlatforms = platforms.filter(p => p.enabled);
    if (enabledPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select at least one platform to generate tests for",
        variant: "destructive"
      });
      return;
    }

    generateTestsMutation.mutate();
  };

  const enabledCount = platforms.filter(p => p.enabled).length;
  const userStoriesArray = Array.isArray(userStories) ? userStories : [];
  const estimatedTestCases = enabledCount * userStoriesArray.length * 3; // 3 test types per story per platform

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="h-5 w-5 text-blue-600" />
          <span>Live Test Case Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Select platforms below and click Generate to create tailored test cases. Each platform produces different test scenarios.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="selection" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="selection">Platform Selection</TabsTrigger>
            <TabsTrigger value="preview">Generation Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-4">
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
                    <p className="text-xs text-muted-foreground">
                      {platform.description}
                    </p>
                    {platform.enabled && (
                      <Badge variant="default" className="mt-2 text-xs">
                        Active
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Ready to Generate</p>
                <p className="text-sm text-muted-foreground">
                  {enabledCount} platform(s) selected • {userStoriesArray.length} user stories • ≈{estimatedTestCases} test cases
                </p>
              </div>
              <Button 
                onClick={handleGenerateTests}
                disabled={generateTestsMutation.isPending || enabledCount === 0}
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>{generateTestsMutation.isPending ? "Generating..." : "Generate Tests"}</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {generateTestsMutation.isPending && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Generating test cases...</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
                {currentPlatform && (
                  <p className="text-sm text-muted-foreground">
                    Processing: {currentPlatform}
                  </p>
                )}
              </div>
            )}

            {!generateTestsMutation.isPending && enabledCount > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Test Generation Plan</h4>
                {platforms.filter(p => p.enabled).map((platform) => (
                  <div key={platform.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {platform.icon}
                      <span className="font-medium">{platform.label}</span>
                      <Badge variant="outline">
                        {userStoriesArray.length * 3} test cases
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Will generate positive, negative, and edge case scenarios specific to {platform.label.toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {enabledCount === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Select platforms to see generation preview</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}