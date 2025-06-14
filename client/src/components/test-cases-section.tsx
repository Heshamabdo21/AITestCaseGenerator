import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskRound, Check, X, Edit3, Download, CloudUpload, Eye, Trash2, ChevronLeft, ChevronRight, Loader2, Filter, Search, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { LoadingSpinner, TestCaseLoading, BouncingDots } from "@/components/ui/loading-spinner";
import { Confetti, useConfetti } from "@/components/ui/confetti";
import { TestCaseMetrics } from "@/components/test-case-metrics";
import type { TestCase } from "@shared/schema";

export function TestCasesSection() {
  const [selectedTestCases, setSelectedTestCases] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Per-user-story pagination state
  const [userStoryPages, setUserStoryPages] = useState<Record<string, number>>({});
  const [userStoryItemsPerPage] = useState(5);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userStoryFilter, setUserStoryFilter] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trigger: confettiAnimation, fire: fireConfetti } = useConfetti();

  // Enhanced confetti system for different celebration types
  const celebrateSuccess = (type: 'single' | 'batch' | 'export' | 'azure', count?: number) => {
    switch (type) {
      case 'single':
        setTimeout(() => fireConfetti(), 200);
        break;
      case 'batch':
        if (count && count >= 10) {
          // Mega celebration for large batches
          setTimeout(() => fireConfetti(), 200);
          setTimeout(() => fireConfetti(), 500);
          setTimeout(() => fireConfetti(), 800);
          setTimeout(() => fireConfetti(), 1100);
        } else if (count && count >= 5) {
          // Triple burst for medium-large batches
          setTimeout(() => fireConfetti(), 200);
          setTimeout(() => fireConfetti(), 600);
          setTimeout(() => fireConfetti(), 1000);
        } else if (count && count >= 3) {
          // Double burst for medium batches
          setTimeout(() => fireConfetti(), 200);
          setTimeout(() => fireConfetti(), 600);
        } else {
          setTimeout(() => fireConfetti(), 200);
        }
        break;
      case 'export':
        setTimeout(() => fireConfetti(), 300);
        setTimeout(() => fireConfetti(), 700);
        break;
      case 'azure':
        setTimeout(() => fireConfetti(), 400);
        setTimeout(() => fireConfetti(), 800);
        setTimeout(() => fireConfetti(), 1200);
        break;
    }
  };

  // Query for test cases
  const { data: testCases = [], isLoading } = useQuery<TestCase[]>({
    queryKey: ['/api/test-cases'],
    retry: false,
  });

  // Query for user stories to enable grouping
  const { data: userStories = [] } = useQuery<any[]>({
    queryKey: ['/api/user-stories/stored'],
    retry: false,
  });

  // Mutation to update test case status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      api.updateTestCaseStatus(id, status),
    onSuccess: (_, { status }) => {
      if (status === "approved") {
        celebrateSuccess('single');
        toast({
          title: "Test Case Approved",
          description: "Test case approved successfully",
        });
      } else {
        toast({
          title: "Test Case Rejected",
          description: "Test case rejected successfully",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Test Case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete test case
  const deleteTestCaseMutation = useMutation({
    mutationFn: (id: number) => api.deleteTestCase(id),
    onSuccess: () => {
      toast({
        title: "Test Case Deleted",
        description: "Test case deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Test Case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete all test cases
  const deleteAllTestCasesMutation = useMutation({
    mutationFn: () => api.deleteAllTestCases(),
    onSuccess: (deletedCount) => {
      toast({
        title: "All Test Cases Deleted",
        description: `Successfully deleted ${deletedCount} test cases`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Test Cases",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  // Mutation to export test cases
  const exportTestCasesMutation = useMutation({
    mutationFn: () => api.exportTestCases(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-cases.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      celebrateSuccess('export');
      toast({
        title: "Export Successful",
        description: "Test cases exported to Excel successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestCaseSelect = (testCaseId: number) => {
    setSelectedTestCases(prev => 
      prev.includes(testCaseId) 
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTestCases.length === typedTestCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(typedTestCases.map(tc => tc.id));
    }
  };

  const handleApproveSelected = () => {
    const count = selectedTestCases.length;
    selectedTestCases.forEach(id => {
      updateStatusMutation.mutate({ id, status: "approved" });
    });
    setSelectedTestCases([]);
    
    // Fire confetti for batch approvals with enhanced timing
    if (count > 1) {
      celebrateSuccess('batch', count);
      toast({
        title: `${count} Test Cases Approved`,
        description: `Successfully approved ${count} test cases`,
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const typedTestCases = testCases as TestCase[];
  const typedUserStories = userStories as any[];

  // Filter logic
  const filteredTestCases = typedTestCases.filter(testCase => {
    // Search term filter
    if (searchTerm && !testCase.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !testCase.id.toString().includes(searchTerm)) {
      return false;
    }

    // Status filter
    if (statusFilter !== "all" && testCase.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== "all" && testCase.priority?.toLowerCase() !== priorityFilter) {
      return false;
    }

    // Type filter
    if (typeFilter !== "all") {
      const testType = testCase.title.includes('Positive') ? 'positive' : 
                      testCase.title.includes('Negative') ? 'negative' :
                      testCase.title.includes('Edge') ? 'edge' :
                      testCase.title.includes('Security') ? 'security' :
                      testCase.title.includes('Performance') ? 'performance' : 'standard';
      if (testType !== typeFilter) {
        return false;
      }
    }

    // User story filter
    if (userStoryFilter !== "all") {
      const userStoryId = testCase.userStoryId?.toString() || 'unassigned';
      if (userStoryId !== userStoryFilter) {
        return false;
      }
    }

    return true;
  });
  
  // Group filtered test cases by user story
  const groupedTestCases = filteredTestCases.reduce((groups, testCase) => {
    const userStoryId = testCase.userStoryId || 'unassigned';
    if (!groups[userStoryId]) {
      groups[userStoryId] = [];
    }
    groups[userStoryId].push(testCase);
    return groups;
  }, {} as Record<string, TestCase[]>);

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setTypeFilter("all");
    setUserStoryFilter("all");
    setCurrentPage(1);
  };

  // Get unique values for filter options
  const getUniqueStatuses = () => {
    const statusSet = new Set<string>();
    typedTestCases.forEach(tc => {
      if (tc.status) statusSet.add(tc.status);
    });
    return Array.from(statusSet);
  };

  const getUniquePriorities = () => {
    const prioritySet = new Set<string>();
    typedTestCases.forEach(tc => {
      if (tc.priority) prioritySet.add(tc.priority.toLowerCase());
    });
    return Array.from(prioritySet);
  };

  const getUniqueUserStories = () => {
    const userStorySet = new Set<string>();
    typedTestCases.forEach(tc => {
      userStorySet.add(tc.userStoryId?.toString() || 'unassigned');
    });
    return Array.from(userStorySet);
  };

  // Get user story title by ID
  const getUserStoryTitle = (userStoryId: number | string) => {
    if (userStoryId === 'unassigned') return 'Unassigned Test Cases';
    const story = userStories.find((s: any) => s.id === userStoryId);
    return story?.title || `User Story ${userStoryId}`;
  };

  // Get user story display with Azure DevOps ID and title
  const getUserStoryDisplay = (userStoryId: number | string) => {
    if (userStoryId === 'unassigned') {
      return {
        id: 'unassigned',
        title: 'Unassigned Test Cases',
        fullDisplay: 'Unassigned Test Cases',
        state: 'Unassigned',
        priority: null,
        assignedTo: null
      };
    }
    const story = userStories.find((s: any) => s.id === userStoryId);
    if (story) {
      // Enhanced display with Azure DevOps ID and title for better traceability
      return {
        id: story.azureId,
        title: story.title,
        fullDisplay: `${story.azureId}: ${story.title}`,
        state: story.state,
        priority: story.priority,
        assignedTo: story.assignedTo
      };
    }
    // Fallback when user story details aren't loaded
    return {
      id: userStoryId.toString(),
      title: `User Story ${userStoryId}`,
      fullDisplay: `${userStoryId}: User Story ${userStoryId}`,
      state: 'Unknown',
      priority: null,
      assignedTo: null
    };
  };
  
  // Pagination logic
  const totalPages = Math.ceil(typedTestCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTestCases = typedTestCases.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper functions for per-user-story pagination
  const getUserStoryPage = (userStoryId: string) => {
    return userStoryPages[userStoryId] || 1;
  };

  const setUserStoryPage = (userStoryId: string, page: number) => {
    setUserStoryPages(prev => ({ ...prev, [userStoryId]: page }));
  };

  const getPaginatedTestCasesForUserStory = (testCases: TestCase[], userStoryId: string) => {
    const currentPage = getUserStoryPage(userStoryId);
    const startIndex = (currentPage - 1) * userStoryItemsPerPage;
    const endIndex = startIndex + userStoryItemsPerPage;
    return testCases.slice(startIndex, endIndex);
  };

  const getTotalPagesForUserStory = (testCasesCount: number) => {
    return Math.ceil(testCasesCount / userStoryItemsPerPage);
  };

  const handleDeleteTestCase = (testCaseId: number) => {
    deleteTestCaseMutation.mutate(testCaseId);
  };

  const handleDeleteAllTestCases = () => {
    deleteAllTestCasesMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FlaskRound className="h-5 w-5" />
            <span>Test Cases</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TestCaseLoading />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FlaskRound className="h-5 w-5" />
            <span>Generated Test Cases</span>
            <Badge variant="outline" className="ml-2">
              {typedTestCases.length}
            </Badge>
            {typedTestCases.length > 0 && (
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Azure DevOps Linked</span>
              </div>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTestCasesMutation.mutate()}
              disabled={exportTestCasesMutation.isPending || typedTestCases.length === 0}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
            >
              {exportTestCasesMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2 border-blue-600" />
                  Exporting
                  <BouncingDots className="ml-2" />
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleApproveSelected}
              disabled={selectedTestCases.length === 0 || updateStatusMutation.isPending}
              className="border-green-300 text-green-700 hover:bg-green-50 transition-all duration-200 hover:scale-105"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2 border-green-600" />
                  Approving
                  <BouncingDots className="ml-2" />
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve Selected
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search test cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {getUniqueStatuses().map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {getUniquePriorities().map(priority => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="edge">Edge Case</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userStoryFilter} onValueChange={setUserStoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="User Story" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stories</SelectItem>
                  {getUniqueUserStories().map(userStoryId => {
                    const storyDisplay = getUserStoryDisplay(userStoryId);
                    return (
                      <SelectItem key={userStoryId} value={userStoryId}>
                        {userStoryId === 'unassigned' ? 'Unassigned' : storyDisplay.fullDisplay}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all" || userStoryFilter !== "all") && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {priorityFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Priority: {priorityFilter}
                  <button
                    onClick={() => setPriorityFilter("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Type: {typeFilter}
                  <button
                    onClick={() => setTypeFilter("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {userStoryFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Story: {userStoryFilter === 'unassigned' ? 'Unassigned' : getUserStoryDisplay(userStoryFilter).fullDisplay}
                  <button
                    onClick={() => setUserStoryFilter("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted-foreground">
              Showing {filteredTestCases.length} of {typedTestCases.length} test cases
              {filteredTestCases.length !== typedTestCases.length && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">(filtered)</span>
              )}
            </div>
            {(searchTerm || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all" || userStoryFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset All Filters
              </Button>
            )}
          </div>
        </div>

        {/* Test Case Metrics Dashboard */}
        <TestCaseMetrics testCases={typedTestCases} userStories={userStories} />

        {/* User Stories Summary Panel */}
        {typedTestCases.length > 0 && Object.keys(groupedTestCases).length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Azure DevOps User Stories Overview
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {Object.keys(groupedTestCases).length} active {Object.keys(groupedTestCases).length === 1 ? 'story' : 'stories'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {typedTestCases.length} total tests
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(groupedTestCases).map(([userStoryId, groupTestCases]) => {
                const storyDisplay = getUserStoryDisplay(userStoryId);
                const approvedCount = groupTestCases.filter(tc => tc.status === 'approved').length;
                const pendingCount = groupTestCases.filter(tc => tc.status === 'pending').length;
                const rejectedCount = groupTestCases.filter(tc => tc.status === 'rejected').length;
                const completionRate = Math.round((approvedCount / groupTestCases.length) * 100);
                
                return (
                  <div key={userStoryId} className="p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                          {storyDisplay.fullDisplay}
                        </h4>
                        <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                          {groupTestCases.length} tests
                        </Badge>
                      </div>
                      
                      {/* Test Status Breakdown */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          {approvedCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-700 dark:text-green-300">{approvedCount}</span>
                            </div>
                          )}
                          {pendingCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-yellow-700 dark:text-yellow-300">{pendingCount}</span>
                            </div>
                          )}
                          {rejectedCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-red-700 dark:text-red-300">{rejectedCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {completionRate}% ready
                        </div>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-1">
                        {storyDisplay.state !== 'Unknown' && storyDisplay.state !== 'Unassigned' && (
                          <Badge variant="secondary" className="text-xs">
                            {storyDisplay.state}
                          </Badge>
                        )}
                        {storyDisplay.priority && (
                          <Badge variant="outline" className="text-xs">
                            P{storyDisplay.priority}
                          </Badge>
                        )}
                      </div>
                      {storyDisplay.assignedTo && (
                        <div className="text-xs text-muted-foreground truncate">
                          Assigned: {storyDisplay.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State for No Test Cases */}
        {typedTestCases.length === 0 ? (
          <div className="text-center py-12">
            <FlaskRound className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Test Cases Found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Test cases will appear here once you import user stories and generate test cases from them.
            </p>
          </div>
        ) : (
          <>
            {/* Empty State for Filtered Results */}
            {filteredTestCases.length === 0 && typedTestCases.length > 0 ? (
              <div className="text-center py-12">
                <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Test Cases Match Your Filters</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Try adjusting your filters or clearing them to see more test cases.
                </p>
                <Button onClick={resetFilters} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Test Cases Grouped by User Story */}
                <div className="space-y-6">
                  {Object.entries(groupedTestCases).map(([userStoryId, groupTestCases]) => {
                    const paginatedGroupTestCases = getPaginatedTestCasesForUserStory(groupTestCases, userStoryId);
                    const totalPages = getTotalPagesForUserStory(groupTestCases.length);
                    const currentPage = getUserStoryPage(userStoryId);
                    const userStory = typedUserStories.find(us => us.id.toString() === userStoryId);
                    
                    return (
                      <div key={userStoryId} className="border rounded-lg">
                        {/* User Story Header */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-3 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-medium text-blue-800 dark:text-blue-200">
                                  User Story #{userStoryId}
                                </span>
                              </div>
                              {userStory && (
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {userStory.title}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {groupTestCases.length} test {groupTestCases.length === 1 ? 'case' : 'cases'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="rounded-md border-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                                <TableHead className="w-12">
                                  <Checkbox
                                    checked={selectedTestCases.filter(id => paginatedGroupTestCases.map(tc => tc.id).includes(id)).length === paginatedGroupTestCases.length && paginatedGroupTestCases.length > 0}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedTestCases(prev => [...prev, ...paginatedGroupTestCases.map(tc => tc.id).filter(id => !prev.includes(id))]);
                                      } else {
                                        setSelectedTestCases(prev => prev.filter(id => !paginatedGroupTestCases.map(tc => tc.id).includes(id)));
                                      }
                                    }}
                                  />
                                </TableHead>
                                <TableHead className="font-semibold">
                                  <div className="flex flex-col">
                                    <span>Test ID</span>
                                    <span className="text-xs font-normal text-muted-foreground">TC-XXX</span>
                                  </div>
                                </TableHead>
                                <TableHead className="font-semibold">
                                  <div className="flex flex-col">
                                    <span>Test Case Title</span>
                                    <span className="text-xs font-normal text-muted-foreground">Test Description</span>
                                  </div>
                                </TableHead>
                                <TableHead className="font-semibold">
                                  <div className="flex flex-col">
                                    <span>Priority</span>
                                    <span className="text-xs font-normal text-muted-foreground">High/Med/Low</span>
                                  </div>
                                </TableHead>
                                <TableHead className="font-semibold">
                                  <div className="flex flex-col">
                                    <span>Status</span>
                                    <span className="text-xs font-normal text-muted-foreground">Approval State</span>
                                  </div>
                                </TableHead>
                                <TableHead className="font-semibold">
                                  <div className="flex flex-col">
                                    <span>Test Type</span>
                                    <span className="text-xs font-normal text-muted-foreground">Category</span>
                                  </div>
                                </TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                  <TableRow key={i} className="animate-fade-in-up">
                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                paginatedGroupTestCases.map((testCase) => (
                                  <TableRow 
                                    key={testCase.id}
                                    className={
                                      testCase.status === "approved" ? "bg-green-50/50 dark:bg-green-950/20" : 
                                      testCase.status === "rejected" ? "bg-red-50/50 dark:bg-red-950/20" : ""
                                    }
                                  >
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedTestCases.includes(testCase.id)}
                                        onCheckedChange={() => handleTestCaseSelect(testCase.id)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-mono">
                                      TC-{testCase.id.toString().padStart(3, '0')}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                      <div className="space-y-1">
                                        <div className="truncate font-medium" title={testCase.title}>
                                          {testCase.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {(() => {
                                            const storyDisplay = getUserStoryDisplay(testCase.userStoryId || 'unassigned');
                                            return `Linked to: ${storyDisplay.fullDisplay}`;
                                          })()}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={getPriorityColor(testCase.priority)}>
                                        {testCase.priority}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                          testCase.status === "approved" ? "bg-green-500" :
                                          testCase.status === "rejected" ? "bg-red-500" :
                                          "bg-yellow-500"
                                        }`}></div>
                                        <Badge className={getStatusColor(testCase.status)}>
                                          {testCase.status}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="text-xs">
                                        {testCase.title.includes('Positive') ? 'Positive' : 
                                         testCase.title.includes('Negative') ? 'Negative' :
                                         testCase.title.includes('Edge') ? 'Edge Case' :
                                         testCase.title.includes('Security') ? 'Security' :
                                         testCase.title.includes('Performance') ? 'Performance' : 'Standard'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end space-x-1">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              title="View Details"
                                              className="h-8 w-8"
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                              <DialogTitle>Test Case Details - TC-{testCase.id.toString().padStart(3, '0')}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-6">
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                  <Label className="text-xs font-semibold text-muted-foreground">PRIORITY</Label>
                                                  <Badge className={getPriorityColor(testCase.priority)}>
                                                    {testCase.priority}
                                                  </Badge>
                                                </div>
                                                <div>
                                                  <Label className="text-xs font-semibold text-muted-foreground">STATUS</Label>
                                                  <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                      testCase.status === "approved" ? "bg-green-500" :
                                                      testCase.status === "rejected" ? "bg-red-500" :
                                                      "bg-yellow-500"
                                                    }`}></div>
                                                    <Badge className={getStatusColor(testCase.status)}>
                                                      {testCase.status}
                                                    </Badge>
                                                  </div>
                                                </div>
                                                <div>
                                                  <Label className="text-xs font-semibold text-muted-foreground">TYPE</Label>
                                                  <Badge variant="outline" className="text-xs">
                                                    {testCase.title.includes('Positive') ? 'Positive' : 
                                                     testCase.title.includes('Negative') ? 'Negative' :
                                                     testCase.title.includes('Edge') ? 'Edge Case' :
                                                     testCase.title.includes('Security') ? 'Security' :
                                                     testCase.title.includes('Performance') ? 'Performance' : 'Standard'}
                                                  </Badge>
                                                </div>
                                                <div>
                                                  <Label className="text-xs font-semibold text-muted-foreground">AZURE DEVOPS USER STORY</Label>
                                                  <div className="flex flex-col space-y-1">
                                                    {(() => {
                                                      const storyDisplay = getUserStoryDisplay(testCase.userStoryId || 'unassigned');
                                                      return (
                                                        <>
                                                          <Badge variant="outline" className="text-xs">
                                                            {storyDisplay.fullDisplay}
                                                          </Badge>
                                                          {storyDisplay.state !== 'Unknown' && storyDisplay.state !== 'Unassigned' && (
                                                            <div className="flex items-center space-x-1">
                                                              <Badge variant="secondary" className="text-xs">
                                                                {storyDisplay.state}
                                                              </Badge>
                                                              {storyDisplay.priority && (
                                                                <Badge variant="outline" className="text-xs">
                                                                  P{storyDisplay.priority}
                                                                </Badge>
                                                              )}
                                                            </div>
                                                          )}
                                                        </>
                                                      );
                                                    })()}
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <div>
                                                <Label className="text-sm font-semibold">Title</Label>
                                                <div className="mt-1 p-3 bg-muted rounded-md">
                                                  <p className="text-sm">{testCase.title}</p>
                                                </div>
                                              </div>

                                              <div>
                                                <Label className="text-sm font-semibold">Objective</Label>
                                                <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-400 dark:border-blue-600 rounded-md">
                                                  <pre className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">{testCase.objective}</pre>
                                                </div>
                                              </div>

                                              {testCase.prerequisites && (
                                                <div>
                                                  <Label className="text-sm font-semibold">Prerequisites</Label>
                                                  <div className="mt-1 p-3 bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-400 dark:border-amber-600 rounded-md">
                                                    <pre className="text-sm whitespace-pre-wrap text-amber-800 dark:text-amber-200">{testCase.prerequisites}</pre>
                                                  </div>
                                                </div>
                                              )}

                                              <div>
                                                <Label className="text-sm font-semibold">Test Steps</Label>
                                                <div className="mt-1 p-3 bg-purple-50 dark:bg-purple-950 border-l-4 border-purple-400 dark:border-purple-600 rounded-md">
                                                  <pre className="text-sm whitespace-pre-wrap text-purple-800 dark:text-purple-200">{testCase.testSteps}</pre>
                                                </div>
                                              </div>

                                              <div>
                                                <Label className="text-sm font-semibold">Expected Result</Label>
                                                <div className="mt-1 p-3 bg-green-50 dark:bg-green-950 border-l-4 border-green-400 dark:border-green-600 rounded-md">
                                                  <p className="text-sm text-green-800 dark:text-green-200">{testCase.expectedResult}</p>
                                                </div>
                                              </div>

                                              {testCase.testPassword && (
                                                <div>
                                                  <Label className="text-sm font-semibold">Test Password</Label>
                                                  <div className="font-mono bg-muted px-3 py-2 rounded-md mt-1">
                                                    {testCase.testPassword}
                                                  </div>
                                                </div>
                                              )}

                                              {testCase.requiredPermissions && (
                                                <div>
                                                  <Label className="text-sm font-semibold">Required Permissions</Label>
                                                  <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-400 dark:border-blue-600 rounded-md">
                                                    <pre className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">{testCase.requiredPermissions}</pre>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          title="Approve"
                                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={() => updateStatusMutation.mutate({ id: testCase.id, status: "approved" })}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          title="Reject"
                                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => updateStatusMutation.mutate({ id: testCase.id, status: "rejected" })}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              title="Delete"
                                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              disabled={deleteTestCaseMutation.isPending}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Test Case</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to delete this test case? This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteTestCase(testCase.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {/* Pagination Controls for this User Story */}
                        {totalPages > 1 && (
                          <div className="px-4 py-3 bg-muted/25 border-t flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Showing {((currentPage - 1) * userStoryItemsPerPage) + 1} to {Math.min(currentPage * userStoryItemsPerPage, groupTestCases.length)} of {groupTestCases.length} test cases
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserStoryPage(userStoryId, currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                  <Button
                                    key={pageNum}
                                    variant={pageNum === currentPage ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setUserStoryPage(userStoryId, pageNum)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {pageNum}
                                  </Button>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserStoryPage(userStoryId, currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bulk Actions */}
                {filteredTestCases.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t mt-6">
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" onClick={handleSelectAll}>
                        <Check className="h-4 w-4 mr-2" />
                        {selectedTestCases.length === filteredTestCases.length ? "Deselect All" : "Select All"}
                      </Button>
                      {selectedTestCases.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {selectedTestCases.length} of {filteredTestCases.length} selected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-105"
                            disabled={deleteAllTestCasesMutation.isPending}
                          >
                            {deleteAllTestCasesMutation.isPending ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2 border-red-600" />
                                Deleting All
                                <BouncingDots className="ml-2" />
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete All
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete All Test Cases</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete all test cases? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAllTestCases}>Delete All</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
      <Confetti trigger={confettiAnimation} />
    </Card>
  );
}