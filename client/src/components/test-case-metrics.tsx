import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import type { TestCase } from "@shared/schema";

interface TestCaseMetricsProps {
  testCases: TestCase[];
  userStories: any[];
}

export function TestCaseMetrics({ testCases, userStories }: TestCaseMetricsProps) {
  const totalTests = testCases.length;
  const approvedTests = testCases.filter(tc => tc.status === 'approved').length;
  const pendingTests = testCases.filter(tc => tc.status === 'pending').length;
  const rejectedTests = testCases.filter(tc => tc.status === 'rejected').length;
  
  const approvalRate = totalTests > 0 ? Math.round((approvedTests / totalTests) * 100) : 0;
  const pendingRate = totalTests > 0 ? Math.round((pendingTests / totalTests) * 100) : 0;
  
  // Test type distribution
  const positiveTests = testCases.filter(tc => tc.title.includes('Positive')).length;
  const negativeTests = testCases.filter(tc => tc.title.includes('Negative')).length;
  const edgeCaseTests = testCases.filter(tc => tc.title.includes('Edge')).length;
  const securityTests = testCases.filter(tc => tc.title.includes('Security')).length;
  
  // Priority distribution
  const highPriorityTests = testCases.filter(tc => tc.priority?.toLowerCase() === 'high').length;
  const mediumPriorityTests = testCases.filter(tc => tc.priority?.toLowerCase() === 'medium').length;
  const lowPriorityTests = testCases.filter(tc => tc.priority?.toLowerCase() === 'low').length;
  
  // User Story coverage
  const uniqueUserStories = new Set(testCases.map(tc => tc.userStoryId).filter(Boolean)).size;
  const totalUserStories = userStories.length;
  const coverageRate = totalUserStories > 0 ? Math.round((uniqueUserStories / totalUserStories) * 100) : 0;

  if (totalTests === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Test Status Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Test Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Approved</span>
                <span className="font-medium">{approvedTests}</span>
              </div>
              <Progress value={approvalRate} className="h-2 mt-1" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                {approvalRate}% Ready
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 text-yellow-500 mr-1" />
                {pendingRate}% Pending
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Coverage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            User Story Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-2xl font-bold">{coverageRate}%</div>
            <div className="text-xs text-muted-foreground">
              {uniqueUserStories} of {totalUserStories} stories covered
            </div>
            <Progress value={coverageRate} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Azure DevOps Linked</span>
              <Badge variant="outline" className="text-xs">
                {uniqueUserStories} stories
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Type Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Test Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Positive</span>
              <Badge variant="secondary" className="text-xs">{positiveTests}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Negative</span>
              <Badge variant="secondary" className="text-xs">{negativeTests}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Edge Cases</span>
              <Badge variant="secondary" className="text-xs">{edgeCaseTests}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Security</span>
              <Badge variant="secondary" className="text-xs">{securityTests}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Priority Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                High
              </div>
              <Badge variant="destructive" className="text-xs">{highPriorityTests}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Medium
              </div>
              <Badge variant="secondary" className="text-xs">{mediumPriorityTests}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Low
              </div>
              <Badge variant="outline" className="text-xs">{lowPriorityTests}</Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Total: {totalTests} test cases
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}