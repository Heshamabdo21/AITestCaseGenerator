import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Eye, FileText, RefreshCw, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { UserStory, GenerateTestCaseRequest } from "@shared/schema";

interface EnhancedUserStoriesProps {
  onTestCasesGenerated?: () => void;
}

export function EnhancedUserStories({ onTestCasesGenerated }: EnhancedUserStoriesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStories, setSelectedStories] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const itemsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for stored user stories
  const { data: userStories = [], isLoading } = useQuery<UserStory[]>({
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
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
      onTestCasesGenerated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Generate Test Cases",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter and paginate stories
  const filteredStories = userStories.filter((story) => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.acceptanceCriteria?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === "all" || story.state.toLowerCase() === stateFilter.toLowerCase();
    return matchesSearch && matchesState;
  });

  const totalPages = Math.ceil(filteredStories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStories = filteredStories.slice(startIndex, endIndex);

  const availableStates = Array.from(new Set(userStories.map((story) => story.state)));

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStorySelect = (storyId: number) => {
    const newSelected = selectedStories.includes(storyId)
      ? selectedStories.filter(id => id !== storyId)
      : [...selectedStories, storyId];
    setSelectedStories(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStories.length === currentStories.length) {
      setSelectedStories([]);
    } else {
      const allCurrentIds = currentStories.map((story: UserStory) => story.id);
      setSelectedStories(allCurrentIds);
    }
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

  const getPriorityColor = (priority?: string | null) => {
    if (!priority) return "secondary";
    if (priority === "1" || priority.toLowerCase() === "high") return "destructive";
    if (priority === "2" || priority.toLowerCase() === "medium") return "default";
    return "secondary";
  };

  const getPriorityText = (priority?: string | null) => {
    if (!priority) return "Unassigned";
    if (priority === "1" || priority.toLowerCase() === "high") return "High";
    if (priority === "2" || priority.toLowerCase() === "medium") return "Medium";
    if (priority === "3" || priority.toLowerCase() === "low") return "Low";
    return priority;
  };

  const cleanAcceptanceCriteria = (criteria?: string | null) => {
    if (!criteria) return "No acceptance criteria provided";
    return criteria
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userStories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-16 w-16 mb-4 opacity-50" />
            <p className="mb-4">No user stories found. Please fetch user stories from Azure DevOps first.</p>
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
        <CardTitle className="flex items-center justify-between">
          <span>User Stories ({userStories.length})</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => fetchStoriesMutation.mutate()}
              disabled={fetchStoriesMutation.isPending}
            >
              {fetchStoriesMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedStories.length} selected
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search user stories or acceptance criteria..."
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

        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg font-medium text-sm">
            <div className="col-span-1">Select</div>
            <div className="col-span-1">ID</div>
            <div className="col-span-3">Title</div>
            <div className="col-span-3">Acceptance Criteria</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-1">State</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Table Rows */}
          {currentStories.map((story: UserStory) => (
            <div key={story.id} className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedStories.includes(story.id)}
                  onChange={() => handleStorySelect(story.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="col-span-1 flex items-center">
                <Badge variant="outline" className="text-xs">
                  {story.azureId}
                </Badge>
              </div>
              <div className="col-span-3 flex items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" title={story.title || undefined}>
                    {story.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={story.description ?? undefined}>
                    {story.description || "No description available"}
                  </p>
                </div>
              </div>
              <div className="col-span-3 flex items-center">
                <div className="min-w-0 w-full">
                  <p className="text-xs text-muted-foreground line-clamp-2" title={cleanAcceptanceCriteria(story.acceptanceCriteria)}>
                    {cleanAcceptanceCriteria(story.acceptanceCriteria)}
                  </p>
                </div>
              </div>
              <div className="col-span-1 flex items-center">
                <Badge variant={getPriorityColor(story.priority)}>
                  {getPriorityText(story.priority)}
                </Badge>
              </div>
              <div className="col-span-1 flex items-center">
                <Badge variant="secondary">
                  {story.state || "Unknown"}
                </Badge>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Badge variant="outline">{story.azureId}</Badge>
                        <span>{story.title}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {story.description ?? "No description provided"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Acceptance Criteria</h4>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {cleanAcceptanceCriteria(story.acceptanceCriteria ?? undefined)}
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Priority</h4>
                          <Badge variant={getPriorityColor(story.priority)}>
                            {getPriorityText(story.priority)}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">State</h4>
                          <Badge variant="secondary">
                            {story.state || "Unknown"}
                          </Badge>
                        </div>
                      </div>

                      {story.assignedTo && (
                        <div>
                          <h4 className="font-medium mb-2">Assigned To</h4>
                          <p className="text-sm">{story.assignedTo}</p>
                        </div>
                      )}

                      {story.tags && Array.isArray(story.tags) && story.tags.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {story.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {story.createdDate && (
                        <div>
                          <h4 className="font-medium mb-2">Created Date</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(story.createdDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
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
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        {filteredStories.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedStories.length === currentStories.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedStories.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedStories.length} of {currentStories.length} selected
                </span>
              )}
            </div>
            <Button
              onClick={handleGenerateTests}
              disabled={selectedStories.length === 0 || generateTestCasesMutation.isPending}
              className="bg-primary hover:bg-primary/90"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredStories.length)} of {filteredStories.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}