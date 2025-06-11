import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Zap, Settings, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export function QuickTestGenerator() {
  const [testType, setTestType] = useState<string>("web");
  const [includePositive, setIncludePositive] = useState(true);
  const [includeNegative, setIncludeNegative] = useState(true);
  const [includeEdgeCases, setIncludeEdgeCases] = useState(false);
  const [includeSecurity, setIncludeSecurity] = useState(false);
  const [includePerformance, setIncludePerformance] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/test-cases/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userStoryIds: [3], // Using demo user story
          testType,
          style: "step-by-step",
          coverageLevel: "standard",
          includePositive,
          includeNegative,
          includeEdgeCases,
          includeSecurity,
          includePerformance,
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

  const selectedCount = [includePositive, includeNegative, includeEdgeCases, includeSecurity, includePerformance].filter(Boolean).length;

  return (
    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Quick Test Generator</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Structured Format
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
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
          
          <div className="space-y-3">
            <label className="text-sm font-medium mb-2 block">Test Case Types</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="positive" 
                  checked={includePositive}
                  onCheckedChange={(checked) => setIncludePositive(checked as boolean)}
                />
                <label htmlFor="positive" className="text-sm">Positive Tests</label>
                <Badge variant="outline" className="text-xs">Core</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="negative" 
                  checked={includeNegative}
                  onCheckedChange={(checked) => setIncludeNegative(checked as boolean)}
                />
                <label htmlFor="negative" className="text-sm">Negative Tests</label>
                <Badge variant="outline" className="text-xs">Error Handling</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edge" 
                  checked={includeEdgeCases}
                  onCheckedChange={(checked) => setIncludeEdgeCases(checked as boolean)}
                />
                <label htmlFor="edge" className="text-sm">Edge Cases</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="security" 
                  checked={includeSecurity}
                  onCheckedChange={(checked) => setIncludeSecurity(checked as boolean)}
                />
                <label htmlFor="security" className="text-sm">Security Tests</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="performance" 
                  checked={includePerformance}
                  onCheckedChange={(checked) => setIncludePerformance(checked as boolean)}
                />
                <label htmlFor="performance" className="text-sm">Performance Tests</label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>{selectedCount} test types selected</span>
              <span>•</span>
              <span>Step-by-step format</span>
            </div>
            <Button 
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || selectedCount === 0}
              className="min-w-[120px]"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Generate Tests
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <strong>Structured Format:</strong> Each test case includes numbered steps with specific actions and expected results for clear execution and validation.
        </div>
      </CardContent>
    </Card>
  );
}