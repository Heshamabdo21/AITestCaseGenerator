import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  TestTube, 
  Shield, 
  Zap, 
  Users, 
  Monitor, 
  Smartphone, 
  Globe,
  CheckCircle,
  AlertCircle,
  Target,
  Bug,
  Clock,
  Eye,
  Settings
} from "lucide-react";

const testCoverageConfigSchema = z.object({
  // Core Functional Testing
  includePositiveTests: z.boolean().default(true),
  includeNegativeTests: z.boolean().default(true),
  includeEdgeCases: z.boolean().default(true),
  
  // Specialized Testing Types
  includeSecurityTests: z.boolean().default(false),
  includePerformanceTests: z.boolean().default(false),
  includeUsabilityTests: z.boolean().default(false),
  includeCompatibilityTests: z.boolean().default(false),
  includeApiTests: z.boolean().default(false),
  includeUiTests: z.boolean().default(true),
  
  // Platform-Specific Testing
  enableWebPortalTests: z.boolean().default(true),
  enableMobileAppTests: z.boolean().default(false),
  enableApiEndpointTests: z.boolean().default(false),
  
  // Test Complexity Levels
  basicTestComplexity: z.boolean().default(true),
  intermediateTestComplexity: z.boolean().default(true),
  advancedTestComplexity: z.boolean().default(false),
  
  // Coverage Metrics
  minimumCoveragePercentage: z.number().min(0).max(100).default(80),
  includeRegressionTests: z.boolean().default(true),
  includeSmokeTests: z.boolean().default(true),
});

type TestCoverageConfig = z.infer<typeof testCoverageConfigSchema>;

export function TestCoverageConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<TestCoverageConfig>({
    resolver: zodResolver(testCoverageConfigSchema),
    defaultValues: {
      includePositiveTests: true,
      includeNegativeTests: true,
      includeEdgeCases: true,
      includeSecurityTests: false,
      includePerformanceTests: false,
      includeUsabilityTests: false,
      includeCompatibilityTests: false,
      includeApiTests: false,
      includeUiTests: true,
      enableWebPortalTests: true,
      enableMobileAppTests: false,
      enableApiEndpointTests: false,
      basicTestComplexity: true,
      intermediateTestComplexity: true,
      advancedTestComplexity: false,
      minimumCoveragePercentage: 80,
      includeRegressionTests: true,
      includeSmokeTests: true,
    },
  });

  // Load existing configuration
  const { data: existingConfig } = useQuery({
    queryKey: ["/api/test-coverage-config"],
    enabled: true,
  });

  // Update form when data loads
  if (existingConfig && !form.formState.isDirty) {
    form.reset(existingConfig);
  }

  const saveConfigMutation = useMutation({
    mutationFn: async (data: TestCoverageConfig) => {
      const response = await fetch("/api/test-coverage-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save test coverage configuration");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Test coverage settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/test-coverage-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TestCoverageConfig) => {
    saveConfigMutation.mutate(data);
  };

  const resetToDefaults = () => {
    form.reset({
      includePositiveTests: true,
      includeNegativeTests: true,
      includeEdgeCases: true,
      includeSecurityTests: false,
      includePerformanceTests: false,
      includeUsabilityTests: false,
      includeCompatibilityTests: false,
      includeApiTests: false,
      includeUiTests: true,
      enableWebPortalTests: true,
      enableMobileAppTests: false,
      enableApiEndpointTests: false,
      basicTestComplexity: true,
      intermediateTestComplexity: true,
      advancedTestComplexity: false,
      minimumCoveragePercentage: 80,
      includeRegressionTests: true,
      includeSmokeTests: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-5 w-5 text-green-600" />
          <span>Comprehensive Test Coverage Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Core Functional Testing */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Core Functional Testing</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePositiveTests"
                  checked={form.watch("includePositiveTests")}
                  onCheckedChange={(checked) => form.setValue("includePositiveTests", !!checked)}
                />
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Label htmlFor="includePositiveTests" className="text-sm">Positive Test Cases</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeNegativeTests"
                  checked={form.watch("includeNegativeTests")}
                  onCheckedChange={(checked) => form.setValue("includeNegativeTests", !!checked)}
                />
                <AlertCircle className="h-4 w-4 text-red-500" />
                <Label htmlFor="includeNegativeTests" className="text-sm">Negative Test Cases</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeEdgeCases"
                  checked={form.watch("includeEdgeCases")}
                  onCheckedChange={(checked) => form.setValue("includeEdgeCases", !!checked)}
                />
                <Target className="h-4 w-4 text-orange-500" />
                <Label htmlFor="includeEdgeCases" className="text-sm">Edge Cases</Label>
              </div>
            </div>
          </div>

          {/* Specialized Testing Types */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-3 flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>Specialized Testing Types</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSecurityTests"
                  checked={form.watch("includeSecurityTests")}
                  onCheckedChange={(checked) => form.setValue("includeSecurityTests", !!checked)}
                />
                <Shield className="h-4 w-4 text-blue-500" />
                <Label htmlFor="includeSecurityTests" className="text-sm">Security Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePerformanceTests"
                  checked={form.watch("includePerformanceTests")}
                  onCheckedChange={(checked) => form.setValue("includePerformanceTests", !!checked)}
                />
                <Zap className="h-4 w-4 text-yellow-500" />
                <Label htmlFor="includePerformanceTests" className="text-sm">Performance Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeUsabilityTests"
                  checked={form.watch("includeUsabilityTests")}
                  onCheckedChange={(checked) => form.setValue("includeUsabilityTests", !!checked)}
                />
                <Users className="h-4 w-4 text-purple-500" />
                <Label htmlFor="includeUsabilityTests" className="text-sm">Usability Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCompatibilityTests"
                  checked={form.watch("includeCompatibilityTests")}
                  onCheckedChange={(checked) => form.setValue("includeCompatibilityTests", !!checked)}
                />
                <Globe className="h-4 w-4 text-cyan-500" />
                <Label htmlFor="includeCompatibilityTests" className="text-sm">Compatibility Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeApiTests"
                  checked={form.watch("includeApiTests")}
                  onCheckedChange={(checked) => form.setValue("includeApiTests", !!checked)}
                />
                <Settings className="h-4 w-4 text-gray-500" />
                <Label htmlFor="includeApiTests" className="text-sm">API Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeUiTests"
                  checked={form.watch("includeUiTests")}
                  onCheckedChange={(checked) => form.setValue("includeUiTests", !!checked)}
                />
                <Eye className="h-4 w-4 text-indigo-500" />
                <Label htmlFor="includeUiTests" className="text-sm">UI Tests</Label>
              </div>
            </div>
          </div>

          {/* Platform-Specific Testing */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300 mb-3 flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-purple-500" />
              <span>Platform-Specific Testing</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableWebPortalTests"
                  checked={form.watch("enableWebPortalTests")}
                  onCheckedChange={(checked) => form.setValue("enableWebPortalTests", !!checked)}
                />
                <Monitor className="h-4 w-4 text-blue-500" />
                <Label htmlFor="enableWebPortalTests" className="text-sm">Web Portal Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableMobileAppTests"
                  checked={form.watch("enableMobileAppTests")}
                  onCheckedChange={(checked) => form.setValue("enableMobileAppTests", !!checked)}
                />
                <Smartphone className="h-4 w-4 text-green-500" />
                <Label htmlFor="enableMobileAppTests" className="text-sm">Mobile App Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableApiEndpointTests"
                  checked={form.watch("enableApiEndpointTests")}
                  onCheckedChange={(checked) => form.setValue("enableApiEndpointTests", !!checked)}
                />
                <Settings className="h-4 w-4 text-orange-500" />
                <Label htmlFor="enableApiEndpointTests" className="text-sm">API Endpoint Tests</Label>
              </div>
            </div>
          </div>

          {/* Test Complexity Levels */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-orange-700 dark:text-orange-300 mb-3 flex items-center space-x-2">
              <Target className="h-4 w-4 text-orange-500" />
              <span>Test Complexity Levels</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="basicTestComplexity"
                  checked={form.watch("basicTestComplexity")}
                  onCheckedChange={(checked) => form.setValue("basicTestComplexity", !!checked)}
                />
                <Badge variant="outline" className="text-green-600">Basic</Badge>
                <Label htmlFor="basicTestComplexity" className="text-sm">Basic Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="intermediateTestComplexity"
                  checked={form.watch("intermediateTestComplexity")}
                  onCheckedChange={(checked) => form.setValue("intermediateTestComplexity", !!checked)}
                />
                <Badge variant="outline" className="text-yellow-600">Intermediate</Badge>
                <Label htmlFor="intermediateTestComplexity" className="text-sm">Intermediate Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="advancedTestComplexity"
                  checked={form.watch("advancedTestComplexity")}
                  onCheckedChange={(checked) => form.setValue("advancedTestComplexity", !!checked)}
                />
                <Badge variant="outline" className="text-red-600">Advanced</Badge>
                <Label htmlFor="advancedTestComplexity" className="text-sm">Advanced Tests</Label>
              </div>
            </div>
          </div>

          {/* Additional Test Types */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-green-700 dark:text-green-300 mb-3 flex items-center space-x-2">
              <Bug className="h-4 w-4 text-green-500" />
              <span>Additional Test Types</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRegressionTests"
                  checked={form.watch("includeRegressionTests")}
                  onCheckedChange={(checked) => form.setValue("includeRegressionTests", !!checked)}
                />
                <Bug className="h-4 w-4 text-red-500" />
                <Label htmlFor="includeRegressionTests" className="text-sm">Regression Tests</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSmokeTests"
                  checked={form.watch("includeSmokeTests")}
                  onCheckedChange={(checked) => form.setValue("includeSmokeTests", !!checked)}
                />
                <Clock className="h-4 w-4 text-blue-500" />
                <Label htmlFor="includeSmokeTests" className="text-sm">Smoke Tests</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={saveConfigMutation.isPending}
              className="flex-1"
            >
              {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={resetToDefaults}
              className="flex-1"
            >
              Reset to Defaults
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}