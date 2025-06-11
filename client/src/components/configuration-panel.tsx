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
import { EyeIcon, EyeOffIcon, Settings, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InsertAzureConfig } from "@shared/schema";

const configSchema = z.object({
  organizationUrl: z.string().url("Please enter a valid Azure DevOps organization URL"),
  patToken: z.string().min(1, "Personal Access Token is required"),
  project: z.string().min(1, "Project selection is required"),
  iterationPath: z.string().optional(),
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
      openaiKey: "",
    },
  });

  // Load existing configuration
  const { data: existingConfig } = useQuery({
    queryKey: ['/api/azure-config/latest'],
    retry: false,
  });

  useEffect(() => {
    if (existingConfig) {
      form.reset({
        organizationUrl: existingConfig.organizationUrl || "",
        patToken: existingConfig.patToken || "",
        project: existingConfig.project || "",
        iterationPath: existingConfig.iterationPath || "",
        openaiKey: existingConfig.openaiKey || "",
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

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: InsertAzureConfig) => {
      return api.createAzureConfig(data);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Azure DevOps configuration saved successfully",
      });
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
              <Select onValueChange={(value) => form.setValue("project", value)} value={form.watch("project")}>
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
              <Input
                id="iterationPath"
                placeholder="e.g., Project\\Sprint 1"
                {...form.register("iterationPath")}
              />
              <p className="text-xs text-gray-600 mt-1">
                Leave empty to use default iteration path
              </p>
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

      {/* AI Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testCaseStyle">Test Case Style</Label>
            <Select defaultValue="step-by-step">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gherkin">Gherkin (BDD)</SelectItem>
                <SelectItem value="step-by-step">Step-by-step</SelectItem>
                <SelectItem value="scenario-based">Scenario-based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="coverageLevel">Coverage Level</Label>
            <Select defaultValue="standard">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="includeNegative" defaultChecked />
            <Label htmlFor="includeNegative" className="text-sm">
              Include negative test cases
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="includePerformance" />
            <Label htmlFor="includePerformance" className="text-sm">
              Generate performance tests
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
