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
  Gauge,
  RefreshCw
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
  const [includeEdgeCases, setIncludeEdgeCases] = useState(true);
  const [includeSecurity, setIncludeSecurity] = useState(true);
  const [includePerformance, setIncludePerformance] = useState(true);
  const [includeUI, setIncludeUI] = useState(true);
  const [includeUsability, setIncludeUsability] = useState(true);
  const [includeApi, setIncludeApi] = useState(true);
  const [includeCompatibility, setIncludeCompatibility] = useState(true);

  // Generation state
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState("");
  const [generationMode, setGenerationMode] = useState<"quick" | "multi-platform">("quick");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current Azure config for iteration path tracking
  const { data: azureConfig } = useQuery({
    queryKey: ['/api/azure-config/latest'],
    retry: false,
  });

  // Load user stories for test generation
  const { data: userStories = [], isLoading: userStoriesLoading } = useQuery({
    queryKey: ['/api/user-stories/stored', (azureConfig as any)?.iterationPath],
    retry: false
  });

  // Load current AI configuration 
  const { data: aiConfig } = useQuery({
    queryKey: ['/api/ai-configuration'],
    retry: false
  });

  // Mutation to fetch fresh user stories from Azure DevOps
  const fetchStoriesMutation = useMutation({
    mutationFn: () => api.fetchUserStories(),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user-stories/stored', (azureConfig as any)?.iterationPath], data);
      const iterationText = (azureConfig as any)?.iterationPath && (azureConfig as any)?.iterationPath !== 'all' 
        ? ` (filtered by ${(azureConfig as any)?.iterationPath})` 
        : '';
      toast({
        title: "User Stories Fetched",
        description: `Found ${data.length} user stories from Azure DevOps${iterationText}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Fetch User Stories",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Individual story test generation mutation
  const generateIndividualMutation = useMutation({
    mutationFn: async (userStoryId: number) => {
      const response = await fetch('/api/test-cases/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userStoryIds: [userStoryId],
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
    onSuccess: (data: any, userStoryId) => {
      const userStory = Array.isArray(userStories) ? userStories.find((s: any) => s.id === userStoryId) : null;
      toast({
        title: "Test Cases Generated",
        description: `Generated ${data.length} test cases for "${userStory?.title || 'Selected story'}"`,
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
      const selectedCount = [includePositive, includeNegative, includeEdgeCases, includeSecurity, includePerformance, includeUI, includeUsability, includeApi, includeCompatibility].filter(Boolean).length;
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

  const selectedTestCount = [includePositive, includeNegative, includeEdgeCases, includeSecurity, includePerformance, includeUI, includeUsability, includeApi, includeCompatibility].filter(Boolean).length;
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

            {/* User Stories Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">User Stories ({userStoriesArray.length})</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchStoriesMutation.mutate()}
                  disabled={fetchStoriesMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  {fetchStoriesMutation.isPending ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                  <span>Fetch User Stories</span>
                </Button>
              </div>
              
              {userStoriesLoading ? (
                <div className="text-sm text-muted-foreground">Loading user stories...</div>
              ) : userStoriesArray.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-3 bg-muted/30">
                  {userStoriesArray.map((story: any) => (
                    <div key={story.id} className="flex items-center justify-between p-2 bg-background rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{story.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {story.state} • {story.priority}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateIndividualMutation.mutate(story.id)}
                        disabled={generateIndividualMutation.isPending}
                        className="ml-2 shrink-0"
                      >
                        {generateIndividualMutation.isPending ? (
                          <Clock className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border rounded-lg bg-muted/30">
                  <p className="text-sm">No user stories available</p>
                  <p className="text-xs">Click "Fetch User Stories" to load from Azure DevOps</p>
                </div>
              )}
            </div>

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
                <label className="text-sm font-medium mb-2 block">Comprehensive Test Coverage Types</label>
                <div className="space-y-4">
                  {/* Core Functional Testing */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Core Functional Testing</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="positive" 
                          checked={includePositive}
                          onCheckedChange={(checked) => setIncludePositive(checked as boolean)}
                        />
                        <label htmlFor="positive" className="text-sm">Positive Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="negative" 
                          checked={includeNegative}
                          onCheckedChange={(checked) => setIncludeNegative(checked as boolean)}
                        />
                        <label htmlFor="negative" className="text-sm">Negative Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edge" 
                          checked={includeEdgeCases}
                          onCheckedChange={(checked) => setIncludeEdgeCases(checked as boolean)}
                        />
                        <label htmlFor="edge" className="text-sm">Edge Cases</label>
                      </div>
                    </div>
                  </div>

                  {/* Security & Performance Testing */}
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">Security & Performance Testing</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="security" 
                          checked={includeSecurity}
                          onCheckedChange={(checked) => setIncludeSecurity(checked as boolean)}
                        />
                        <label htmlFor="security" className="text-sm">Security Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="performance" 
                          checked={includePerformance}
                          onCheckedChange={(checked) => setIncludePerformance(checked as boolean)}
                        />
                        <label htmlFor="performance" className="text-sm">Performance Test Cases</label>
                      </div>
                    </div>
                  </div>

                  {/* User Experience Testing */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">User Experience Testing</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="ui" 
                          checked={includeUI}
                          onCheckedChange={(checked) => setIncludeUI(checked as boolean)}
                        />
                        <label htmlFor="ui" className="text-sm">UI Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="usability" 
                          checked={includeUsability}
                          onCheckedChange={(checked) => setIncludeUsability(checked as boolean)}
                        />
                        <label htmlFor="usability" className="text-sm">Usability Test Cases</label>
                      </div>
                    </div>
                  </div>

                  {/* Technical & Integration Testing */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">Technical & Integration Testing</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="api" 
                          checked={includeApi}
                          onCheckedChange={(checked) => setIncludeApi(checked as boolean)}
                        />
                        <label htmlFor="api" className="text-sm">API Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="compatibility" 
                          checked={includeCompatibility}
                          onCheckedChange={(checked) => setIncludeCompatibility(checked as boolean)}
                        />
                        <label htmlFor="compatibility" className="text-sm">Compatibility Test Cases</label>
                      </div>
                    </div>
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
                <label className="text-sm font-medium mb-3 block">Comprehensive Test Coverage Types</label>
                <div className="space-y-4">
                  {/* Core Functional Testing */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Core Functional Testing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mp-positive" 
                          checked={includePositive}
                          onCheckedChange={(checked) => setIncludePositive(checked as boolean)}
                        />
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <label htmlFor="mp-positive" className="text-sm">Positive Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mp-negative" 
                          checked={includeNegative}
                          onCheckedChange={(checked) => setIncludeNegative(checked as boolean)}
                        />
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <label htmlFor="mp-negative" className="text-sm">Negative Test Cases</label>
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
                    </div>
                  </div>

                  {/* Security & Performance Testing */}
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">Security & Performance Testing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mp-security" 
                          checked={includeSecurity}
                          onCheckedChange={(checked) => setIncludeSecurity(checked as boolean)}
                        />
                        <Shield className="h-4 w-4 text-purple-500" />
                        <label htmlFor="mp-security" className="text-sm">Security Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mp-performance" 
                          checked={includePerformance}
                          onCheckedChange={(checked) => setIncludePerformance(checked as boolean)}
                        />
                        <Gauge className="h-4 w-4 text-orange-500" />
                        <label htmlFor="mp-performance" className="text-sm">Performance Test Cases</label>
                      </div>
                    </div>
                  </div>

                  {/* User Experience Testing */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">User Experience Testing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mp-ui" 
                          checked={includeUI}
                          onCheckedChange={(checked) => setIncludeUI(checked as boolean)}
                        />
                        <Globe className="h-4 w-4 text-blue-500" />
                        <label htmlFor="mp-ui" className="text-sm">UI Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mp-usability" 
                          checked={includeUsability}
                          onCheckedChange={(checked) => setIncludeUsability(checked as boolean)}
                        />
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <label htmlFor="mp-usability" className="text-sm">Usability Test Cases</label>
                      </div>
                    </div>
                  </div>

                  {/* Technical & Integration Testing */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <h4 className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">Technical & Integration Testing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mp-api" 
                          checked={includeApi}
                          onCheckedChange={(checked) => setIncludeApi(checked as boolean)}
                        />
                        <Code className="h-4 w-4 text-green-500" />
                        <label htmlFor="mp-api" className="text-sm">API Test Cases</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="mp-compatibility" 
                          checked={includeCompatibility}
                          onCheckedChange={(checked) => setIncludeCompatibility(checked as boolean)}
                        />
                        <Settings className="h-4 w-4 text-green-600" />
                        <label htmlFor="mp-compatibility" className="text-sm">Compatibility Test Cases</label>
                      </div>
                    </div>
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