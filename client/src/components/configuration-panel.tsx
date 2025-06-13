import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { InsertAzureConfig } from "@shared/schema";

const configSchema = z.object({
  organizationUrl: z.string().url("Please enter a valid Azure DevOps organization URL"),
  patToken: z.string().min(1, "Personal Access Token is required"),
  project: z.string().min(1, "Project selection is required"),
  iterationPath: z.string().optional(),
  testPlanId: z.string().optional(),
  testPlanName: z.string().optional(),
  testSuiteStrategy: z.enum(["user_story", "test_type", "single"]).default("user_story"),
  createTestSuites: z.boolean().default(true),
  openaiKey: z.string().min(1, "OpenAI API Key is required"),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface ConfigurationPanelProps {
  onConfigurationSaved: () => void;
}

export function ConfigurationPanel({ onConfigurationSaved }: ConfigurationPanelProps) {
  const [showPatToken, setShowPatToken] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [projects, setProjects] = useState<Array<{ name: string; id: string }>>([]);
  const [iterations, setIterations] = useState<Array<{ name: string; path: string }>>([]);
  const [testPlans, setTestPlans] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  
  const { toast } = useToast();

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      organizationUrl: "",
      patToken: "",
      project: "",
      iterationPath: "",
      testPlanId: "",
      testPlanName: "",
      testSuiteStrategy: "user_story" as const,
      createTestSuites: true,
      openaiKey: "",
    },
  });

  // Load existing configuration
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/azure-config/latest'],
    retry: false,
  });

  useEffect(() => {
    if (existingConfig && typeof existingConfig === 'object') {
      form.reset({
        organizationUrl: (existingConfig as any).organizationUrl || "",
        patToken: (existingConfig as any).patToken || "",
        project: (existingConfig as any).project || "",
        iterationPath: (existingConfig as any).iterationPath || "",
        testPlanId: (existingConfig as any).testPlanId || "",
        testPlanName: (existingConfig as any).testPlanName || "",
        testSuiteStrategy: (existingConfig as any).testSuiteStrategy || "user_story",
        createTestSuites: (existingConfig as any).createTestSuites !== undefined ? (existingConfig as any).createTestSuites : true,
        openaiKey: (existingConfig as any).openaiKey || "",
      });
      setConnectionStatus('success');
      setConnectionMessage('Configuration loaded successfully');
    }
  }, [existingConfig, form]);

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: { organizationUrl: string; patToken: string; project: string }) => {
      return api.testAzureConnection(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        setConnectionStatus('success');
        setConnectionMessage(result.message);
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Azure DevOps",
        });
      }
    },
    onError: (error: any) => {
      setConnectionStatus('error');
      setConnectionMessage(error.message);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch projects mutation
  const fetchProjectsMutation = useMutation({
    mutationFn: async (data: { organizationUrl: string; patToken: string }) => {
      return api.fetchAzureProjects(data);
    },
    onSuccess: (projectList) => {
      setProjects(projectList);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Fetch Projects",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch iteration paths mutation
  const fetchIterationsMutation = useMutation({
    mutationFn: async (data: { organizationUrl: string; patToken: string; project: string }) => {
      return api.fetchIterationPaths(data);
    },
    onSuccess: (iterationList) => {
      setIterations(iterationList);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Fetch Iterations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch test plans mutation
  const fetchTestPlansMutation = useMutation({
    mutationFn: async () => {
      return api.fetchTestPlans();
    },
    onSuccess: (testPlanList) => {
      setTestPlans(testPlanList);
      toast({
        title: "Test Plans Loaded",
        description: `Found ${testPlanList.length} test plans`,
      });
    },
    onError: (error: any) => {
      // Handle the specific case when no Azure DevOps configuration exists
      if (error.message.includes("No Azure DevOps configuration found")) {
        toast({
          title: "Configuration Required",
          description: "Please save your Azure DevOps configuration first before loading test plans.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Fetch Test Plans",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: InsertAzureConfig) => {
      if (existingConfig && typeof existingConfig === 'object' && (existingConfig as any).id) {
        return api.updateAzureConfig((existingConfig as any).id, data);
      } else {
        return api.createAzureConfig(data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Azure DevOps configuration saved successfully",
      });
      // Invalidate and refetch the configuration query to enable the Load Test Plans button
      queryClient.invalidateQueries({ queryKey: ['/api/azure-config/latest'] });
      // Invalidate user stories cache so iteration path filtering takes effect on next fetch
      queryClient.invalidateQueries({ queryKey: ['/api/user-stories/stored'] });
      onConfigurationSaved();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = async () => {
    const values = form.getValues();
    
    if (!values.organizationUrl || !values.patToken) {
      toast({
        title: "Missing Information",
        description: "Please enter Organization URL and PAT Token",
        variant: "destructive",
      });
      return;
    }

    // First fetch projects
    await fetchProjectsMutation.mutateAsync({
      organizationUrl: values.organizationUrl,
      patToken: values.patToken,
    });

    // Then test connection if project is selected
    if (values.project) {
      await testConnectionMutation.mutateAsync({
        organizationUrl: values.organizationUrl,
        patToken: values.patToken,
        project: values.project,
      });
    }
  };

  const handleProjectChange = async (projectName: string) => {
    form.setValue("project", projectName);
    
    const values = form.getValues();
    if (values.organizationUrl && values.patToken && projectName) {
      // Fetch iterations for the selected project
      await fetchIterationsMutation.mutateAsync({
        organizationUrl: values.organizationUrl,
        patToken: values.patToken,
        project: projectName,
      });
      
      // Test connection with the selected project
      await testConnectionMutation.mutateAsync({
        organizationUrl: values.organizationUrl,
        patToken: values.patToken,
        project: projectName,
      });
    }
  };

  const onSubmit = async (data: ConfigFormData) => {
    await saveConfigMutation.mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Azure DevOps Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="organizationUrl">Organization URL</Label>
              <Input
                id="organizationUrl"
                type="url"
                placeholder="https://dev.azure.com/yourorg"
                {...form.register("organizationUrl")}
              />
              {form.formState.errors.organizationUrl && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.organizationUrl.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="patToken">Personal Access Token</Label>
              <div className="relative">
                <Input
                  id="patToken"
                  type={showPatToken ? "text" : "password"}
                  placeholder="Enter your PAT token"
                  {...form.register("patToken")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPatToken(!showPatToken)}
                >
                  {showPatToken ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Token should have Work Items (read & write) permissions
              </p>
              {form.formState.errors.patToken && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.patToken.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="project">Project</Label>
              <Select onValueChange={handleProjectChange} value={form.watch("project")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.project && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.project.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="iterationPath">Iteration Path (Optional)</Label>
              <Select onValueChange={(value) => form.setValue("iterationPath", value)} value={form.watch("iterationPath")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an iteration path..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Iterations</SelectItem>
                  {iterations.map((iteration) => (
                    <SelectItem key={iteration.path} value={iteration.path}>
                      {iteration.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                Filter user stories by iteration path when fetching from Azure DevOps
              </p>
            </div>

            <div>
              <Label htmlFor="testPlan">Test Plan (Optional)</Label>
              <Select onValueChange={(value) => {
                const selectedPlan = testPlans.find(plan => String(plan.id) === value);
                form.setValue("testPlanId", value === "none" ? "" : value);
                form.setValue("testPlanName", selectedPlan?.name || "");
              }} value={form.watch("testPlanId") || "none"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test plan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Test Plan</SelectItem>
                  {testPlans.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                Test cases will be automatically added to the selected test plan
              </p>
              {form.watch("testPlanId") && form.watch("testPlanId") !== "none" && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    Selected: <strong>{form.watch("testPlanName")}</strong>
                  </p>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTestPlansMutation.mutate()}
                  disabled={fetchTestPlansMutation.isPending || !existingConfig}
                >
                  {fetchTestPlansMutation.isPending ? "Loading..." : "Load Test Plans"}
                </Button>
                {!existingConfig && (
                  <p className="text-xs text-amber-600 mt-1">
                    Save configuration first to load test plans
                  </p>
                )}
                {form.watch("testPlanId") && form.watch("testPlanId") !== "none" && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      form.setValue("testPlanId", "");
                      form.setValue("testPlanName", "");
                    }}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted">
              <h4 className="font-medium text-foreground">Test Suite Management</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createTestSuites"
                  checked={form.watch("createTestSuites")}
                  onCheckedChange={(checked) => form.setValue("createTestSuites", checked as boolean)}
                />
                <Label htmlFor="createTestSuites" className="text-sm font-medium">
                  Automatically create and organize test suites
                </Label>
              </div>
              
              {form.watch("createTestSuites") && (
                <div>
                  <Label htmlFor="testSuiteStrategy">Test Suite Organization Strategy</Label>
                  <Select onValueChange={(value) => form.setValue("testSuiteStrategy", value as "user_story" | "test_type" | "single")} value={form.watch("testSuiteStrategy")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization strategy..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_story">Group by User Story</SelectItem>
                      <SelectItem value="test_type">Group by Test Type</SelectItem>
                      <SelectItem value="single">Single Suite for All</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.watch("testSuiteStrategy") === "user_story" && "Creates separate test suites for each user story"}
                    {form.watch("testSuiteStrategy") === "test_type" && "Creates test suites based on test case types (Functional, Security, etc.)"}
                    {form.watch("testSuiteStrategy") === "single" && "Places all test cases in the root suite"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="openaiKey">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="openaiKey"
                  type={showOpenAiKey ? "text" : "password"}
                  placeholder="sk-..."
                  {...form.register("openaiKey")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                >
                  {showOpenAiKey ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.openaiKey && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.openaiKey.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleTestConnection}
                disabled={testConnectionMutation.isPending || fetchProjectsMutation.isPending}
              >
                {testConnectionMutation.isPending || fetchProjectsMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plug mr-2"></i>
                    Test Connection
                  </>
                )}
              </Button>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={saveConfigMutation.isPending}
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save & Continue
                  </>
                )}
              </Button>
            </div>
          </form>

          {connectionStatus !== 'idle' && (
            <Alert className={connectionStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={connectionStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
                <div className="flex items-center space-x-2">
                  <i className={`fas fa-${connectionStatus === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                  <span>{connectionMessage}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
