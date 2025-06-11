import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const aiConfigurationSchema = z.object({
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
  additionalInstructions: z.string().optional()
});

type AiConfigurationFormData = z.infer<typeof aiConfigurationSchema>;

export function AiConfigurationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AiConfigurationFormData>({
    resolver: zodResolver(aiConfigurationSchema),
    defaultValues: {
      includePositiveTests: true,
      includeNegativeTests: true,
      includeEdgeCases: true,
      includeSecurityCases: false,
      testComplexity: "medium",
      additionalInstructions: ""
    }
  });

  const { data: aiConfig } = useQuery({
    queryKey: ["/api/ai-configuration"],
  });

  const saveAiConfigMutation = useMutation({
    mutationFn: async (data: AiConfigurationFormData) => {
      return apiRequest(`/api/ai-configuration`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI configuration saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-configuration"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AiConfigurationFormData) => {
    saveAiConfigMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>
          Configure AI options for test case generation including test types and complexity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="includePositiveTests"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Include Positive Test Cases
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Generate test cases for expected valid scenarios
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeNegativeTests"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Include Negative Test Cases
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Generate test cases for invalid inputs and error scenarios
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeEdgeCases"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Include Edge Cases
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Generate test cases for boundary conditions and edge scenarios
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeSecurityCases"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Include Security Test Cases
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Generate test cases for security vulnerabilities and authentication
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="testComplexity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Complexity Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="simple">Simple - Basic functionality tests</SelectItem>
                      <SelectItem value="medium">Medium - Comprehensive testing with some edge cases</SelectItem>
                      <SelectItem value="complex">Complex - Extensive testing with multiple scenarios</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any specific instructions for test case generation..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={saveAiConfigMutation.isPending}>
              {saveAiConfigMutation.isPending ? "Saving..." : "Save AI Configuration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}