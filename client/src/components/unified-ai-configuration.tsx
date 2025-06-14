import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Settings, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InsertAiConfiguration, InsertAiContext } from "@shared/schema";

const unifiedAiSchema = z.object({
  // AI Configuration fields
  includePositiveTests: z.boolean().default(true),
  includeNegativeTests: z.boolean().default(true),
  includeEdgeCases: z.boolean().default(true),
  includeSecurityCases: z.boolean().default(false),
  includePerformanceTests: z.boolean().default(false),
  includeUiTests: z.boolean().default(false),
  includeUsabilityTests: z.boolean().default(false),
  includeApiTests: z.boolean().default(false),
  includeCompatibilityTests: z.boolean().default(false),
  testComplexity: z.enum(["simple", "medium", "complex"]).default("medium"),
  additionalInstructions: z.string().optional(),
  
  // Test type preferences
  enableWebPortalTests: z.boolean().default(true),
  enableMobileAppTests: z.boolean().default(false),
  enableApiTests: z.boolean().default(false),
  
  // AI Context fields
  projectContext: z.array(z.string()).default([]),
  domainKnowledge: z.array(z.string()).default([]),
  testingPatterns: z.array(z.string()).default([]),
  customInstructions: z.string().optional(),
});

type UnifiedAiFormData = z.infer<typeof unifiedAiSchema>;

export function UnifiedAiConfiguration() {
  const [projectContextInput, setProjectContextInput] = useState("");
  const [domainKnowledgeInput, setDomainKnowledgeInput] = useState("");
  const [testingPatternsInput, setTestingPatternsInput] = useState("");
  
  const { toast } = useToast();

  const form = useForm<UnifiedAiFormData>({
    resolver: zodResolver(unifiedAiSchema),
    defaultValues: {
      includePositiveTests: true,
      includeNegativeTests: true,
      includeEdgeCases: true,
      includeSecurityCases: true,
      includePerformanceTests: true,
      includeUiTests: true,
      includeUsabilityTests: true,
      includeApiTests: true,
      includeCompatibilityTests: true,
      testComplexity: "medium",
      additionalInstructions: "",
      enableWebPortalTests: true,
      enableMobileAppTests: false,
      enableApiTests: false,
      projectContext: [],
      domainKnowledge: [],
      testingPatterns: [],
      customInstructions: "",
    },
  });

  // Load existing AI configuration
  const { data: aiConfig } = useQuery({
    queryKey: ['/api/ai-configuration'],
    retry: false,
  });

  // Load existing AI context
  const { data: aiContext } = useQuery({
    queryKey: ['/api/ai-context'],
    retry: false,
  });

  // Check if Azure configuration exists
  const { data: azureConfig } = useQuery({
    queryKey: ['/api/azure-config/latest'],
    retry: false,
  });

  useEffect(() => {
    if (aiConfig && typeof aiConfig === 'object') {
      const config = aiConfig as any;
      form.setValue("includePositiveTests", config.includePositiveTests ?? true);
      form.setValue("includeNegativeTests", config.includeNegativeTests ?? true);
      form.setValue("includeEdgeCases", config.includeEdgeCases ?? true);
      form.setValue("includeSecurityCases", config.includeSecurityCases ?? false);
      form.setValue("includePerformanceTests", config.includePerformanceTests ?? false);
      form.setValue("includeUiTests", config.includeUiTests ?? false);
      form.setValue("includeUsabilityTests", config.includeUsabilityTests ?? false);
      form.setValue("includeApiTests", config.includeApiTests ?? false);
      form.setValue("includeCompatibilityTests", config.includeCompatibilityTests ?? false);
      form.setValue("testComplexity", config.testComplexity ?? "medium");
      form.setValue("additionalInstructions", config.additionalInstructions ?? "");
      form.setValue("enableWebPortalTests", config.enableWebPortalTests ?? true);
      form.setValue("enableMobileAppTests", config.enableMobileAppTests ?? false);
      form.setValue("enableApiTests", config.enableApiTests ?? false);
    }
  }, [aiConfig, form]);

  useEffect(() => {
    if (aiContext && typeof aiContext === 'object') {
      const context = aiContext as any;
      form.setValue("projectContext", context.projectContext ?? []);
      form.setValue("domainKnowledge", context.domainKnowledge ?? []);
      form.setValue("testingPatterns", context.testingPatterns ?? []);
      form.setValue("customInstructions", context.customInstructions ?? "");
    }
  }, [aiContext, form]);

  // Save AI configuration mutation
  const saveAiConfigMutation = useMutation({
    mutationFn: async (data: Partial<InsertAiConfiguration>) => {
      if (aiConfig) {
        return api.updateAiConfiguration(data);
      } else {
        return api.createAiConfiguration(data as InsertAiConfiguration);
      }
    },
    onSuccess: () => {
      toast({
        title: "AI Configuration Saved",
        description: "AI configuration updated successfully",
      });
    },
    onError: (error: any) => {
      const isAzureConfigMissing = error.message?.includes("No Azure DevOps configuration found");
      toast({
        title: "Failed to Save AI Configuration",
        description: isAzureConfigMissing 
          ? "Please configure your Azure DevOps connection first before setting up AI preferences."
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Save AI context mutation
  const saveAiContextMutation = useMutation({
    mutationFn: async (data: InsertAiContext) => {
      return api.createOrUpdateAiContext(data);
    },
    onSuccess: () => {
      toast({
        title: "AI Context Saved",
        description: "AI context updated successfully",
      });
    },
    onError: (error: any) => {
      const isAzureConfigMissing = error.message?.includes("No Azure DevOps configuration found");
      toast({
        title: "Failed to Save AI Context",
        description: isAzureConfigMissing 
          ? "Please configure your Azure DevOps connection first before setting up AI context."
          : error.message,
        variant: "destructive",
      });
    },
  });

  const addToArray = (field: keyof Pick<UnifiedAiFormData, 'projectContext' | 'domainKnowledge' | 'testingPatterns'>, input: string, setInput: (value: string) => void) => {
    if (input.trim()) {
      const currentValues = form.getValues(field);
      form.setValue(field, [...currentValues, input.trim()]);
      setInput("");
    }
  };

  const removeFromArray = (field: keyof Pick<UnifiedAiFormData, 'projectContext' | 'domainKnowledge' | 'testingPatterns'>, index: number) => {
    const currentValues = form.getValues(field);
    form.setValue(field, currentValues.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: UnifiedAiFormData) => {
    // Save AI Configuration
    await saveAiConfigMutation.mutateAsync({
      includePositiveTests: data.includePositiveTests,
      includeNegativeTests: data.includeNegativeTests,
      includeEdgeCases: data.includeEdgeCases,
      includeSecurityCases: data.includeSecurityCases,
      includePerformanceTests: data.includePerformanceTests,
      includeUiTests: data.includeUiTests,
      includeUsabilityTests: data.includeUsabilityTests,
      includeApiTests: data.includeApiTests,
      includeCompatibilityTests: data.includeCompatibilityTests,
      testComplexity: data.testComplexity,
      additionalInstructions: data.additionalInstructions,
      enableWebPortalTests: data.enableWebPortalTests,
      enableMobileAppTests: data.enableMobileAppTests,
      enableApiTests: data.enableApiTests,
    });

    // Save AI Context
    await saveAiContextMutation.mutateAsync({
      projectContext: data.projectContext,
      domainKnowledge: data.domainKnowledge,
      testingPatterns: data.testingPatterns,
      customInstructions: data.customInstructions,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI Configuration & Context</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!azureConfig && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Azure DevOps configuration is required before setting up AI preferences. 
              Please configure your Azure connection first in the Configuration tab.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* AI Configuration Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span>Comprehensive Test Coverage Configuration</span>
            </h3>
            
            {/* Core Functional Test Types */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Core Functional Testing</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePositiveTests"
                    checked={form.watch("includePositiveTests")}
                    onCheckedChange={(checked) => form.setValue("includePositiveTests", !!checked)}
                  />
                  <Label htmlFor="includePositiveTests" className="text-sm">Positive Test Cases</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeNegativeTests"
                    checked={form.watch("includeNegativeTests")}
                    onCheckedChange={(checked) => form.setValue("includeNegativeTests", !!checked)}
                  />
                  <Label htmlFor="includeNegativeTests" className="text-sm">Negative Test Cases</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeEdgeCases"
                    checked={form.watch("includeEdgeCases")}
                    onCheckedChange={(checked) => form.setValue("includeEdgeCases", !!checked)}
                  />
                  <Label htmlFor="includeEdgeCases" className="text-sm">Edge Cases</Label>
                </div>
              </div>
            </div>

            {/* Security & Performance Test Types */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-red-700 dark:text-red-300 mb-3">Security & Performance Testing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSecurityCases"
                    checked={form.watch("includeSecurityCases")}
                    onCheckedChange={(checked) => form.setValue("includeSecurityCases", !!checked)}
                  />
                  <Label htmlFor="includeSecurityCases" className="text-sm">Security Test Cases</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePerformanceTests"
                    checked={form.watch("includePerformanceTests")}
                    onCheckedChange={(checked) => form.setValue("includePerformanceTests", !!checked)}
                  />
                  <Label htmlFor="includePerformanceTests" className="text-sm">Performance Test Cases</Label>
                </div>
              </div>
            </div>

            {/* User Experience Test Types */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-3">User Experience Testing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeUiTests"
                    checked={form.watch("includeUiTests")}
                    onCheckedChange={(checked) => form.setValue("includeUiTests", !!checked)}
                  />
                  <Label htmlFor="includeUiTests" className="text-sm">UI Test Cases</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeUsabilityTests"
                    checked={form.watch("includeUsabilityTests")}
                    onCheckedChange={(checked) => form.setValue("includeUsabilityTests", !!checked)}
                  />
                  <Label htmlFor="includeUsabilityTests" className="text-sm">Usability Test Cases</Label>
                </div>
              </div>
            </div>

            {/* Technical & Integration Test Types */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-green-700 dark:text-green-300 mb-3">Technical & Integration Testing</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeApiTests"
                    checked={form.watch("includeApiTests")}
                    onCheckedChange={(checked) => form.setValue("includeApiTests", !!checked)}
                  />
                  <Label htmlFor="includeApiTests" className="text-sm">API Test Cases</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCompatibilityTests"
                    checked={form.watch("includeCompatibilityTests")}
                    onCheckedChange={(checked) => form.setValue("includeCompatibilityTests", !!checked)}
                  />
                  <Label htmlFor="includeCompatibilityTests" className="text-sm">Compatibility Test Cases</Label>
                </div>
              </div>
            </div>

            {/* Test Type Preferences */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Test Target Platforms</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableWebPortalTests"
                    checked={form.watch("enableWebPortalTests")}
                    onCheckedChange={(checked) => form.setValue("enableWebPortalTests", !!checked)}
                  />
                  <Label htmlFor="enableWebPortalTests" className="text-sm font-medium">Web Portal Tests</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableMobileAppTests"
                    checked={form.watch("enableMobileAppTests")}
                    onCheckedChange={(checked) => form.setValue("enableMobileAppTests", !!checked)}
                  />
                  <Label htmlFor="enableMobileAppTests" className="text-sm font-medium">Mobile App Tests</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableApiTests"
                    checked={form.watch("enableApiTests")}
                    onCheckedChange={(checked) => form.setValue("enableApiTests", !!checked)}
                  />
                  <Label htmlFor="enableApiTests" className="text-sm font-medium">API Tests</Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Select the platforms you want to create test cases for. This will influence the test case generation to focus on platform-specific scenarios.
              </p>
            </div>

            <div>
              <Label htmlFor="testComplexity">Test Complexity</Label>
              <Select 
                value={form.watch("testComplexity")} 
                onValueChange={(value) => form.setValue("testComplexity", value as "simple" | "medium" | "complex")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select complexity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="additionalInstructions">Additional Instructions</Label>
              <Textarea
                id="additionalInstructions"
                placeholder="Any specific instructions for test case generation..."
                {...form.register("additionalInstructions")}
              />
            </div>
          </div>

          {/* AI Context Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span>Project Context & Knowledge</span>
            </h3>

            {/* Project Context */}
            <div>
              <Label>Project Context</Label>
              <div className="flex space-x-2 mb-2">
                <Input
                  placeholder="Add project context item..."
                  value={projectContextInput}
                  onChange={(e) => setProjectContextInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('projectContext', projectContextInput, setProjectContextInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray('projectContext', projectContextInput, setProjectContextInput)}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.watch("projectContext").map((item, index) => (
                  <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center space-x-1">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('projectContext', index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Domain Knowledge */}
            <div>
              <Label>Domain Knowledge</Label>
              <div className="flex space-x-2 mb-2">
                <Input
                  placeholder="Add domain knowledge item..."
                  value={domainKnowledgeInput}
                  onChange={(e) => setDomainKnowledgeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('domainKnowledge', domainKnowledgeInput, setDomainKnowledgeInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray('domainKnowledge', domainKnowledgeInput, setDomainKnowledgeInput)}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.watch("domainKnowledge").map((item, index) => (
                  <div key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm flex items-center space-x-1">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('domainKnowledge', index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Testing Patterns */}
            <div>
              <Label>Testing Patterns</Label>
              <div className="flex space-x-2 mb-2">
                <Input
                  placeholder="Add testing pattern..."
                  value={testingPatternsInput}
                  onChange={(e) => setTestingPatternsInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('testingPatterns', testingPatternsInput, setTestingPatternsInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addToArray('testingPatterns', testingPatternsInput, setTestingPatternsInput)}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.watch("testingPatterns").map((item, index) => (
                  <div key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm flex items-center space-x-1">
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('testingPatterns', index)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="customInstructions">Custom Instructions</Label>
              <Textarea
                id="customInstructions"
                placeholder="Provide any custom instructions for AI test generation..."
                {...form.register("customInstructions")}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!azureConfig || saveAiConfigMutation.isPending || saveAiContextMutation.isPending}
          >
            {(saveAiConfigMutation.isPending || saveAiContextMutation.isPending) ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Save AI Configuration"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}