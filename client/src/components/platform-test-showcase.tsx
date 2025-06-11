import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Smartphone, Code, Play, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const platformExamples = {
  web: {
    icon: <Globe className="h-4 w-4" />,
    title: "Web Portal Tests",
    description: "Browser-based testing with UI interactions",
    features: [
      "Cross-browser compatibility testing",
      "Responsive design validation",
      "Form submission and validation",
      "Navigation and menu testing",
      "Search and filtering functionality"
    ],
    sampleSteps: [
      "Open web browser and navigate to application",
      "Login with valid credentials",
      "Navigate to target page/module",
      "Test interactive elements and forms",
      "Verify data display and formatting",
      "Test multi-language support"
    ]
  },
  mobile: {
    icon: <Smartphone className="h-4 w-4" />,
    title: "Mobile App Tests", 
    description: "Touch-based testing for mobile devices",
    features: [
      "Touch gesture interactions",
      "Screen orientation handling",
      "Pull-to-refresh functionality",
      "Offline/online mode transitions",
      "Device-specific features testing"
    ],
    sampleSteps: [
      "Launch mobile application on device",
      "Test touch gestures and interactions",
      "Verify screen orientation changes",
      "Test offline functionality",
      "Validate mobile-optimized UI",
      "Test device-specific features"
    ]
  },
  api: {
    icon: <Code className="h-4 w-4" />,
    title: "API Tests",
    description: "Backend service and endpoint validation",
    features: [
      "HTTP status code validation",
      "Response data structure verification",
      "Authentication token testing",
      "Error handling validation",
      "Performance and rate limiting"
    ],
    sampleSteps: [
      "Authenticate with API credentials",
      "Send HTTP requests to endpoints",
      "Validate response status codes",
      "Verify response data structure",
      "Test error handling scenarios",
      "Check API rate limiting"
    ]
  }
};

export function PlatformTestShowcase() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTests, setGeneratedTests] = useState<any[]>([]);
  const { toast } = useToast();

  const generateTestsMutation = useMutation({
    mutationFn: async (platforms: string[]) => {
      const response = await api.generateTestCases({
        userStoryIds: [3], // Demo user story ID
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
      return response;
    },
    onSuccess: (data) => {
      setGeneratedTests(data);
      toast({
        title: "Test Cases Generated",
        description: `Generated ${data.length} test cases successfully`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerateDemo = async () => {
    setIsGenerating(true);
    try {
      await generateTestsMutation.mutateAsync(['web', 'mobile', 'api']);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="h-5 w-5 text-green-600" />
          <span>Platform Testing Showcase</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          Explore how test cases are generated differently for each platform type.
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="web">Web Portal</TabsTrigger>
            <TabsTrigger value="mobile">Mobile App</TabsTrigger>
            <TabsTrigger value="api">API Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(platformExamples).map(([key, platform]) => (
                <Card key={key} className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {platform.icon}
                      <span className="font-medium text-sm">{platform.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {platform.description}
                    </p>
                    <div className="space-y-1">
                      {platform.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="flex justify-center">
              <Button 
                onClick={handleGenerateDemo}
                disabled={isGenerating}
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>{isGenerating ? "Generating..." : "Generate Demo Test Cases"}</span>
              </Button>
            </div>

            {generatedTests.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Generated Test Cases Preview</h4>
                <div className="space-y-2">
                  {generatedTests.slice(0, 3).map((test, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{test.title}</span>
                        <Badge variant="outline">{test.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {test.objective}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {Object.entries(platformExamples).map(([key, platform]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  {platform.icon}
                  <h3 className="font-semibold">{platform.title}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {platform.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Sample Test Steps</h4>
                    <div className="space-y-2">
                      {platform.sampleSteps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Badge variant="secondary" className="mt-0.5 text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}