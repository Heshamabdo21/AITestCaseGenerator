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
import { Brain, Settings } from "lucide-react";
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
  testComplexity: z.enum(["simple", "medium", "complex"]).default("medium"),
  additionalInstructions: z.string().optional(),
  
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
      includeSecurityCases: false,
      testComplexity: "medium",
      additionalInstructions: "",
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

  useEffect(() => {
    if (aiConfig && typeof aiConfig === 'object') {
      const config = aiConfig as any;
      form.setValue("includePositiveTests", config.includePositiveTests ?? true);
      form.setValue("includeEdgeCases", config.includeEdgeCases ?? true);
      form.setValue("includeSecurityCases", config.includeSecurityCases ?? false);
      form.setValue("testComplexity", config.testComplexity ?? "medium");
      form.setValue("additionalInstructions", config.additionalInstructions ?? "");
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
      toast({
        title: "Failed to Save AI Configuration",
        description: error.message,
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
      toast({
        title: "Failed to Save AI Context",
        description: error.message,
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
      includeEdgeCases: data.includeEdgeCases,
      includeSecurityCases: data.includeSecurityCases,
      testComplexity: data.testComplexity,
      additionalInstructions: data.additionalInstructions,
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* AI Configuration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span>Test Generation Settings</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePositiveTests"
                  checked={form.watch("includePositiveTests")}
                  onCheckedChange={(checked) => form.setValue("includePositiveTests", !!checked)}
                />
                <Label htmlFor="includePositiveTests">Include Positive Test Cases</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeNegativeTests"
                  checked={form.watch("includeNegativeTests")}
                  onCheckedChange={(checked) => form.setValue("includeNegativeTests", !!checked)}
                />
                <Label htmlFor="includeNegativeTests">Include Negative Test Cases</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeEdgeCases"
                  checked={form.watch("includeEdgeCases")}
                  onCheckedChange={(checked) => form.setValue("includeEdgeCases", !!checked)}
                />
                <Label htmlFor="includeEdgeCases">Include Edge Cases</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSecurityCases"
                  checked={form.watch("includeSecurityCases")}
                  onCheckedChange={(checked) => form.setValue("includeSecurityCases", !!checked)}
                />
                <Label htmlFor="includeSecurityCases">Include Security Test Cases</Label>
              </div>
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
            disabled={saveAiConfigMutation.isPending || saveAiContextMutation.isPending}
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