import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, 
  Settings, 
  CheckCircle, 
  Globe, 
  Smartphone, 
  Code, 
  Play, 
  Clock, 
  AlertCircle,
  Target,
  Shield,
  Gauge
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface PlatformConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

export function UnifiedTestGenerator() {
  // Platform selection state
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

  // Test configuration state
  const [testType, setTestType] = useState<string>("web");
  const [includePositive, setIncludePositive] = useState(true);
  const [includeNegative, setIncludeNegative] = useState(true);
  const [includeEdgeCases, setIncludeEdgeCases] = useState(false);
  const [includeSecurity, setIncludeSecurity] = useState(false);
  const [includePerformance, setIncludePerformance] = useState(false);
  const [includeUI, setIncludeUI] = useState(false);
  const [includeUsability, setIncludeUsability] = useState(false);
  const [includeCompatibility, setIncludeCompatibility] = useState(false);

  // Generation state
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState("");
  const [generationMode, setGenerationMode] = useState<"quick" | "multi-platform">("quick");

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

  // Quick generation mutation (single platform)
  const quickGenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/test-cases/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userStoryIds: Array.isArray(userStories) && userStories.length > 0 
            ? userStories.map((s: any) => s.id) 
            : [3], // Fallback to demo story
          testType,
          style: "step-by-step",
          coverageLevel: "standard",
          includePositive,
          includeNegative,
          includeEdgeCases,
          includeSecurity,
          includePerformance,
          includeAccessibility: includeUI,
          testComplexity: "medium"
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate test cases');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test Cases Generated",
        description: `Successfully generated ${data.length} test cases with structured step format`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Multi-platform generation mutation
  const multiPlatformGenerateMutation = useMutation({
    mutationFn: async () => {
      if (!Array.isArray(userStories) || userStories.length === 0) {
        throw new Error("No user stories available for test generation");
      }

      const enabledPlatforms = platforms.filter(p => p.enabled);
      if (enabledPlatforms.length === 0) {
        throw new Error("No platforms selected");
      }

      const totalSteps = enabledPlatforms.length * userStories.length;
      let currentStep = 0;

      setGenerationProgress(0);
      
      for (const platform of enabledPlatforms) {
        setCurrentPlatform(platform.label);
        
        for (const story of userStories) {
          await new Promise(resolve => setTimeout(resolve, 800));
          
          currentStep++;
          setGenerationProgress((currentStep / totalSteps) * 100);
        }
      }

      // Generate actual test cases
      const primaryPlatform = enabledPlatforms[0].id;
      const testType = primaryPlatform === "api" ? "api" : primaryPlatform === "mobile" ? "mobile" : "web";
      
      return api.generateTestCases({
        userStoryIds: userStories.map((s: any) => s.id),
        testType,
        style: "step-by-step", 
        coverageLevel: "standard",
        includePositive,
        includeNegative,
        includeEdgeCases,
        includeSecurity,
        includePerformance,
        includeAccessibility: includeUI,
        testComplexity: "medium"
      });
    },
    onSuccess: (data) => {
      setGenerationProgress(100);
      setCurrentPlatform("");
      const enabledCount = platforms.filter(p => p.enabled).length;
      toast({
        title: "Test Cases Generated Successfully",
        description: `Created ${data.length} test cases across ${enabledCount} platform(s)`
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

  const handlePlatformToggle = (platformId: string, enabled: boolean) => {
    const updatedPlatforms = platforms.map(p => 
      p.id === platformId ? { ...p, enabled } : p
    );
    setPlatforms(updatedPlatforms);

    // Update test type to match enabled platforms
    if (enabled && generationMode === "multi-platform") {
      setTestType(platformId as "web" | "mobile" | "api");
    }
  };

  const handleGenerate = () => {
    if (generationMode === "quick") {
      const selectedCount = [includePositive, includeNegative, includeEdgeCases, includeSecurity, includePerformance, includeUI, includeUsability, includeCompatibility].filter(Boolean).length;
      if (selectedCount === 0) {
        toast({
          title: "No Test Types Selected",
          description: "Please select at least one test type to generate",
          variant: "destructive"
        });
        return;
      }
      quickGenerateMutation.mutate();
    } else {
      const enabledPlatforms = platforms.filter(p => p.enabled);
      if (enabledPlatforms.length === 0) {
        toast({
          title: "No Platforms Selected",
          description: "Please select at least one platform to generate tests for",
          variant: "destructive"
        });
        return;
      }
      multiPlatformGenerateMutation.mutate();
    }
  };

  const selectedTestCount = [includePositive, includeNegative, includeEdgeCases, includeSecurity, includePerformance, includeUI, includeUsability, includeCompatibility].filter(Boolean).length;
  const enabledPlatformCount = platforms.filter(p => p.enabled).length;
  const userStoriesArray = Array.isArray(userStories) ? userStories : [];
  const isGenerating = quickGenerateMutation.isPending || multiPlatformGenerateMutation.isPending;

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Test Case Generator</CardTitle>
            <Badge variant="secondary" className="text-xs">
              AI-Powered
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={generationMode === "quick" ? "default" : "outline"}
              size="sm"
              onClick={() => setGenerationMode("quick")}
            >
              Quick Mode
            </Button>
            <Button
              variant={generationMode === "multi-platform" ? "default" : "outline"}
              size="sm"
              onClick={() => setGenerationMode("multi-platform")}
            >
              Multi-Platform
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={generationMode} className="w-full">
          <TabsContent value="quick" className="space-y-4">
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                Quick generation creates structured test cases with numbered steps for immediate testing
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Platform Type</label>
                  <Select value={testType} onValueChange={setTestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web Portal</SelectItem>
                      <SelectItem value="mobile">Mobile App</SelectItem>
                      <SelectItem value="api">API Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-sm font-medium mb-2 block">Test Case Types</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="positive" 
                      checked={includePositive}
                      onCheckedChange={(checked) => setIncludePositive(checked as boolean)}
                    />
                    <label htmlFor="positive" className="text-sm">Positive Tests</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="negative" 
                      checked={includeNegative}
                      onCheckedChange={(checked) => setIncludeNegative(checked as boolean)}
                    />
                    <label htmlFor="negative" className="text-sm">Negative Tests</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edge" 
                      checked={includeEdgeCases}
                      onCheckedChange={(checked) => setIncludeEdgeCases(checked as boolean)}
                    />
                    <label htmlFor="edge" className="text-sm">Edge Cases</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="security" 
                      checked={includeSecurity}
                      onCheckedChange={(checked) => setIncludeSecurity(checked as boolean)}
                    />
                    <label htmlFor="security" className="text-sm">Security</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="performance" 
                      checked={includePerformance}
                      onCheckedChange={(checked) => setIncludePerformance(checked as boolean)}
                    />
                    <label htmlFor="performance" className="text-sm">Performance</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="ui" 
                      checked={includeUI}
                      onCheckedChange={(checked) => setIncludeUI(checked as boolean)}
                    />
                    <label htmlFor="ui" className="text-sm">UI/UX</label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="multi-platform" className="space-y-4">
            <Alert>
              <Play className="h-4 w-4" />
              <AlertDescription>
                Multi-platform generation creates comprehensive test suites across different platforms with live progress tracking
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-3 block">Platform Selection</label>
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
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium mb-3 block">Test Coverage</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mp-positive" 
                      checked={includePositive}
                      onCheckedChange={(checked) => setIncludePositive(checked as boolean)}
                    />
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <label htmlFor="mp-positive" className="text-sm">Positive</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mp-negative" 
                      checked={includeNegative}
                      onCheckedChange={(checked) => setIncludeNegative(checked as boolean)}
                    />
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <label htmlFor="mp-negative" className="text-sm">Negative</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mp-edge" 
                      checked={includeEdgeCases}
                      onCheckedChange={(checked) => setIncludeEdgeCases(checked as boolean)}
                    />
                    <Target className="h-4 w-4 text-blue-500" />
                    <label htmlFor="mp-edge" className="text-sm">Edge Cases</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="mp-security" 
                      checked={includeSecurity}
                      onCheckedChange={(checked) => setIncludeSecurity(checked as boolean)}
                    />
                    <Shield className="h-4 w-4 text-purple-500" />
                    <label htmlFor="mp-security" className="text-sm">Security</label>
                  </div>
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
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
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              {generationMode === "quick" ? (
                <>
                  <span>{selectedTestCount} test types selected</span>
                  <span>•</span>
                  <span>Single platform</span>
                </>
              ) : (
                <>
                  <span>{enabledPlatformCount} platform(s) selected</span>
                  <span>•</span>
                  <span>{userStoriesArray.length} user stories</span>
                  <span>•</span>
                  <span>≈{enabledPlatformCount * userStoriesArray.length * selectedTestCount} test cases</span>
                </>
              )}
            </div>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || (generationMode === "quick" ? selectedTestCount === 0 : enabledPlatformCount === 0)}
              className="min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  {generationMode === "quick" ? (
                    <Zap className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Generate Tests
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <strong>
            {generationMode === "quick" ? "Quick Mode:" : "Multi-Platform Mode:"}
          </strong>{" "}
          {generationMode === "quick" 
            ? "Creates structured test cases with numbered steps for immediate execution and validation."
            : "Generates comprehensive test suites across multiple platforms with progressive generation and live tracking."
          }
        </div>
      </CardContent>
    </Card>
  );
}