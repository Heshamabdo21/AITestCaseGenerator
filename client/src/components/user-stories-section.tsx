import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks, RefreshCw, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { UserStory, GenerateTestCaseRequest } from "@shared/schema";

interface UserStoriesSectionProps {
  onTestCasesGenerated: () => void;
}

export function UserStoriesSection({ onTestCasesGenerated }: UserStoriesSectionProps) {
  const [selectedStories, setSelectedStories] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for stored user stories first
  const { data: userStories = [], isLoading, error } = useQuery<UserStory[]>({
    queryKey: ['/api/user-stories/stored'],
    retry: false,
  });

  // Mutation to fetch fresh user stories from Azure DevOps
  const fetchStoriesMutation = useMutation({
    mutationFn: () => api.fetchUserStories(),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user-stories/stored'], data);
      toast({
        title: "User Stories Fetched",
        description: `Found ${data.length} user stories from Azure DevOps`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Fetch User Stories",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to generate test cases
  const generateTestCasesMutation = useMutation({
    mutationFn: (request: GenerateTestCaseRequest) => api.generateTestCases(request),
    onSuccess: (data) => {
      toast({
        title: "Test Cases Generated",
        description: `Generated ${data.length} test cases successfully`,
      });
      setSelectedStories([]);
      // Force refresh of test cases data
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
      queryClient.refetchQueries({ queryKey: ['/api/test-cases'] });
      onTestCasesGenerated();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Test Cases",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get unique states from all stories
  const availableStates = Array.from(new Set(userStories.map((story) => story.state)));

  const filteredStories = userStories.filter((story) => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === "all" || story.state.toLowerCase() === stateFilter.toLowerCase();
    return matchesSearch && matchesState;
  });

  const handleSelectAll = () => {
    if (selectedStories.length === filteredStories.length) {
      setSelectedStories([]);
    } else {
      setSelectedStories(filteredStories.map(story => story.id));
    }
  };

  const handleStorySelect = (storyId: number) => {
    setSelectedStories(prev => 
      prev.includes(storyId) 
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleGenerateTests = () => {
    if (selectedStories.length === 0) {
      toast({
        title: "No Stories Selected",
        description: "Please select at least one user story to generate test cases",
        variant: "destructive",
      });
      return;
    }

    const request: GenerateTestCaseRequest = {
      userStoryIds: selectedStories,
      testType: "web",
      style: "step-by-step",
      coverageLevel: "standard",
      includePositive: true,
      includeNegative: true,
      includeEdgeCases: true,
      includeSecurity: false,
      includePerformance: false,
      includeAccessibility: false,
      testComplexity: "medium",
    };

    generateTestCasesMutation.mutate(request);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
      case "1":
        return "bg-red-100 text-red-800";
      case "medium":
      case "2":
        return "bg-yellow-100 text-yellow-800";
      case "low":
      case "3":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "new":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error || (userStories.length === 0 && !isLoading)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <span>User Stories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ListChecks className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No User Stories Found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Configure your Azure DevOps connection and fetch user stories to get started with test case generation.
            </p>
            <Button 
              onClick={() => fetchStoriesMutation.mutate()} 
              disabled={fetchStoriesMutation.isPending}
              className="flex items-center gap-2"
            >
              {fetchStoriesMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Fetch User Stories
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ListChecks className="h-5 w-5 text-blue-600" />
            <CardTitle>User Stories</CardTitle>
            <Badge variant="secondary">
              {userStories.length} found
            </Badge>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchStoriesMutation.mutate()}
            disabled={fetchStoriesMutation.isPending}
          >
            {fetchStoriesMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search user stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {availableStates.map((state) => (
                <SelectItem key={state} value={state.toLowerCase()}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stories List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-4 h-4 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              {userStories.length === 0 ? "No user stories found. Click 'Refresh' to fetch from Azure DevOps." : "No stories match your search criteria."}
            </div>
          ) : (
            filteredStories.map((story: UserStory) => (
              <div
                key={story.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Checkbox
                        checked={selectedStories.includes(story.id)}
                        onCheckedChange={() => handleStorySelect(story.id)}
                      />
                      <Badge variant="outline" className="text-xs">
                        {story.azureId}
                      </Badge>
                      <Badge className={getStateColor(story.state)}>
                        {story.state}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{story.title}</h4>
                    {story.description && (
                      <p className="text-sm text-gray-600 mb-3">{story.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {story.assignedTo && (
                        <span>
                          <i className="fas fa-user mr-1"></i>
                          {story.assignedTo}
                        </span>
                      )}
                      {story.createdDate && (
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          {new Date(story.createdDate).toLocaleDateString()}
                        </span>
                      )}
                      <Badge className={getPriorityColor(story.priority || "Medium")}>
                        {story.priority || "Medium"} Priority
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const request: GenerateTestCaseRequest = {
                        userStoryIds: [story.id],
                        testType: "web",
                        style: "step-by-step",
                        coverageLevel: "standard",
                        includePositive: true,
                        includeNegative: true,
                        includeEdgeCases: true,
                        includeSecurity: false,
                        includePerformance: false,
                        includeAccessibility: false,
                        testComplexity: "medium",
                      };
                      generateTestCasesMutation.mutate(request);
                    }}
                    disabled={generateTestCasesMutation.isPending}
                  >
                    Generate Tests
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bulk Actions */}
        {filteredStories.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSelectAll}>
                <i className="fas fa-check-square mr-2"></i>
                {selectedStories.length === filteredStories.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedStories.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedStories.length} of {filteredStories.length} selected
                </span>
              )}
            </div>
            <Button
              onClick={handleGenerateTests}
              disabled={selectedStories.length === 0 || generateTestCasesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generateTestCasesMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Tests for Selected
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
