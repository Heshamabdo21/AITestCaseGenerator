import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  PieChart as PieChartIcon,
  Target,
  AlertTriangle
} from "lucide-react";
import type { TestCase } from "@shared/schema";

const COLORS = {
  approved: '#22c55e',
  rejected: '#ef4444',
  pending: '#f59e0b',
  positive: '#3b82f6',
  negative: '#f97316',
  edge: '#8b5cf6',
  security: '#ec4899',
  performance: '#06b6d4',
  standard: '#6b7280'
};

export function TestCaseAnalytics() {
  const { data: testCases = [] } = useQuery<TestCase[]>({
    queryKey: ['/api/test-cases'],
    retry: false,
  });

  const { data: userStories = [] } = useQuery<any[]>({
    queryKey: ['/api/user-stories/stored'],
    retry: false,
  });

  const analytics = useMemo(() => {
    const typedTestCases = testCases as TestCase[];
    
    // Status distribution
    const statusCounts = typedTestCases.reduce((acc, tc) => {
      const status = tc.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Priority distribution
    const priorityCounts = typedTestCases.reduce((acc, tc) => {
      const priority = tc.priority?.toLowerCase() || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Type distribution
    const typeCounts = typedTestCases.reduce((acc, tc) => {
      const type = tc.title.includes('Positive') ? 'positive' : 
                   tc.title.includes('Negative') ? 'negative' :
                   tc.title.includes('Edge') ? 'edge' :
                   tc.title.includes('Security') ? 'security' :
                   tc.title.includes('Performance') ? 'performance' : 'standard';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // User story distribution
    const userStoryCounts = typedTestCases.reduce((acc, tc) => {
      const userStoryId = tc.userStoryId || 'unassigned';
      acc[userStoryId] = (acc[userStoryId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate completion rate
    const approvedCount = statusCounts.approved || 0;
    const totalCount = typedTestCases.length;
    const completionRate = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

    return {
      total: totalCount,
      statusCounts,
      priorityCounts,
      typeCounts,
      userStoryCounts,
      completionRate,
      approvedCount,
      rejectedCount: statusCounts.rejected || 0,
      pendingCount: statusCounts.pending || 0
    };
  }, [testCases]);

  const statusData = Object.entries(analytics.statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: COLORS[status as keyof typeof COLORS] || COLORS.standard
  }));

  const typeData = Object.entries(analytics.typeCounts).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: COLORS[type as keyof typeof COLORS] || COLORS.standard
  }));

  const priorityData = Object.entries(analytics.priorityCounts).map(([priority, count]) => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    count
  }));

  const topUserStories = Object.entries(analytics.userStoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([userStoryId, count]) => {
      const story = userStories.find(s => s.id.toString() === userStoryId);
      return {
        id: userStoryId,
        title: story ? `${story.azureId}: ${story.title}` : `Story ${userStoryId}`,
        count
      };
    });

  if (analytics.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Test Case Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Analytics Available</h3>
            <p className="text-muted-foreground">
              Generate test cases to see analytics and insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.total}</p>
                <p className="text-xs text-muted-foreground">Total Test Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Completion Rate</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Test Cases Approved</span>
              <span>{Math.round(analytics.completionRate)}%</span>
            </div>
            <Progress value={analytics.completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {analytics.approvedCount} of {analytics.total} test cases approved
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Test Type Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Priority Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top User Stories by Test Case Count */}
      {topUserStories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top User Stories by Test Case Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUserStories.map((story, index) => (
                <div key={story.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-sm">{story.title}</p>
                      <p className="text-xs text-muted-foreground">Story ID: {story.id}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{story.count} tests</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}