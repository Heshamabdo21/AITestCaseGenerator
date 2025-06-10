import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const aiContextSchema = z.object({
  projectContext: z.string().min(1, "Project context is required"),
  customInstructions: z.string().optional(),
});

type AiContextFormData = z.infer<typeof aiContextSchema>;

export function AiContextPanel() {
  const [domainKnowledge, setDomainKnowledge] = useState<string[]>([]);
  const [testingPatterns, setTestingPatterns] = useState<string[]>([]);
  const [newKnowledge, setNewKnowledge] = useState("");
  const [newPattern, setNewPattern] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AiContextFormData>({
    resolver: zodResolver(aiContextSchema),
    defaultValues: {
      projectContext: "",
      customInstructions: "",
    },
  });

  // Load existing AI context
  const { data: aiContext } = useQuery({
    queryKey: ['/api/ai-context'],
    retry: false,
  });

  // Save AI context mutation
  const saveContextMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/ai-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          domainKnowledge,
          testingPatterns,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AI Context Saved",
        description: "Context will improve future test case generation",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai-context'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Context",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addDomainKnowledge = () => {
    if (newKnowledge.trim()) {
      setDomainKnowledge([...domainKnowledge, newKnowledge.trim()]);
      setNewKnowledge("");
    }
  };

  const removeDomainKnowledge = (index: number) => {
    setDomainKnowledge(domainKnowledge.filter((_, i) => i !== index));
  };

  const addTestingPattern = () => {
    if (newPattern.trim()) {
      setTestingPatterns([...testingPatterns, newPattern.trim()]);
      setNewPattern("");
    }
  };

  const removeTestingPattern = (index: number) => {
    setTestingPatterns(testingPatterns.filter((_, i) => i !== index));
  };

  const onSubmit = (data: AiContextFormData) => {
    saveContextMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI Context & Learning</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="projectContext">Project Context</Label>
            <Textarea
              id="projectContext"
              placeholder="Describe your project, technology stack, business domain, and specific requirements..."
              rows={4}
              {...form.register("projectContext")}
            />
            <p className="text-xs text-gray-600 mt-1">
              Provide context about your project to help AI generate more relevant test cases
            </p>
            {form.formState.errors.projectContext && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.projectContext.message}
              </p>
            )}
          </div>

          <div>
            <Label>Domain Knowledge</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add domain-specific knowledge or terminology..."
                  value={newKnowledge}
                  onChange={(e) => setNewKnowledge(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addDomainKnowledge())}
                />
                <Button type="button" onClick={addDomainKnowledge} size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {domainKnowledge.map((knowledge, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {knowledge}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeDomainKnowledge(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Testing Patterns</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add preferred testing patterns or methodologies..."
                  value={newPattern}
                  onChange={(e) => setNewPattern(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTestingPattern())}
                />
                <Button type="button" onClick={addTestingPattern} size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {testingPatterns.map((pattern, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {pattern}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeTestingPattern(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="customInstructions">Custom Instructions</Label>
            <Textarea
              id="customInstructions"
              placeholder="Any specific instructions for test case generation..."
              rows={3}
              {...form.register("customInstructions")}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={saveContextMutation.isPending}
          >
            {saveContextMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving Context...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Save AI Context
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}