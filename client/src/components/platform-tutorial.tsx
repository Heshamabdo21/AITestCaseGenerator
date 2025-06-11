import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Smartphone, Code, ArrowRight, Lightbulb } from "lucide-react";

const platformConfigs = {
  web: {
    icon: <Globe className="h-4 w-4" />,
    label: "Web Portal Tests",
    color: "bg-blue-500",
    description: "Browser-based testing with UI interactions and responsive design validation"
  },
  mobile: {
    icon: <Smartphone className="h-4 w-4" />,
    label: "Mobile App Tests", 
    color: "bg-green-500",
    description: "Touch-based testing for mobile devices with gesture and orientation support"
  },
  api: {
    icon: <Code className="h-4 w-4" />,
    label: "API Tests",
    color: "bg-purple-500",
    description: "Backend service validation with endpoint testing and data verification"
  }
};

const sampleTestCases = {
  web: {
    title: "Web Portal Login Validation",
    steps: [
      "Open web browser and navigate to login page",
      "Enter username and password in form fields",
      "Click login button and verify redirect",
      "Validate dashboard elements load correctly",
      "Test responsive design on different screen sizes"
    ],
    validations: [
      "Login form displays correctly",
      "Error messages show for invalid credentials", 
      "Session management works properly",
      "Multi-browser compatibility verified"
    ]
  },
  mobile: {
    title: "Mobile App Login Experience",
    steps: [
      "Launch mobile app on target device",
      "Tap on username and password input fields",
      "Use on-screen keyboard for text entry",
      "Tap login button with finger gesture",
      "Verify smooth transition to main screen"
    ],
    validations: [
      "Touch interactions respond correctly",
      "Screen orientation changes handled",
      "Mobile keyboard integration works",
      "App performance acceptable on device"
    ]
  },
  api: {
    title: "Authentication API Endpoint",
    steps: [
      "Send POST request to /api/auth/login",
      "Include username/password in JSON payload",
      "Verify response status code is 200",
      "Extract authentication token from response",
      "Test token for subsequent API calls"
    ],
    validations: [
      "API returns proper HTTP status codes",
      "Response structure matches documentation",
      "Authentication tokens are valid",
      "Error handling works for invalid requests"
    ]
  }
};

export function PlatformTutorial() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["web"]);
  const [currentStep, setCurrentStep] = useState(1);

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    } else {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    }
  };

  const getGeneratedTestCount = () => {
    // Simulate: 3 test types (positive, negative, edge) × selected platforms
    return selectedPlatforms.length * 3;
  };

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>Interactive Platform Selection Tutorial</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Try selecting different platform combinations below to see how test case generation adapts to your choices.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="font-medium">Step 1: Select Target Platforms</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(platformConfigs).map(([key, platform]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id={`tutorial-${key}`}
                    checked={selectedPlatforms.includes(key)}
                    onCheckedChange={(checked) => handlePlatformToggle(key, !!checked)}
                  />
                  <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                  <span className="font-medium text-sm">{platform.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {platform.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Step 2: Preview Generated Test Cases</h3>
            <Badge variant="secondary">
              {getGeneratedTestCount()} test cases will be generated
            </Badge>
          </div>

          {selectedPlatforms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Select at least one platform to see test case previews</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPlatforms.map((platform) => {
                const config = platformConfigs[platform as keyof typeof platformConfigs];
                const testCase = sampleTestCases[platform as keyof typeof sampleTestCases];
                
                return (
                  <div key={platform} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      {config.icon}
                      <span className="font-medium">{testCase.title}</span>
                      <Badge variant="outline">{config.label}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Test Steps</h5>
                        <div className="space-y-1">
                          {testCase.steps.map((step, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <Badge variant="secondary" className="text-xs mt-0.5">
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
                          {testCase.validations.map((validation, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <span className="text-green-500 text-xs mt-1">✓</span>
                              <span className="text-xs">{validation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-medium">Step 3: Understanding the Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">What Happens When You Select:</h4>
              <div className="space-y-2">
                {selectedPlatforms.length > 0 ? (
                  selectedPlatforms.map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <ArrowRight className="h-3 w-3 text-blue-500" />
                      <span className="text-sm">
                        {platformConfigs[platform as keyof typeof platformConfigs].label}: 
                        Creates platform-specific test scenarios
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select platforms above to see the impact
                  </p>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Best Practices:</h4>
              <div className="space-y-1">
                <p className="text-xs">• Select Web Portal for browser-based testing</p>
                <p className="text-xs">• Choose Mobile App for touch device scenarios</p>
                <p className="text-xs">• Pick API for backend service validation</p>
                <p className="text-xs">• Combine multiple platforms for comprehensive coverage</p>
              </div>
            </div>
          </div>
        </div>

        {selectedPlatforms.length > 0 && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              Perfect! With {selectedPlatforms.length} platform(s) selected, you'll generate {getGeneratedTestCount()} comprehensive test cases. 
              Each platform will have tailored test steps and validation criteria specific to that testing environment.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}