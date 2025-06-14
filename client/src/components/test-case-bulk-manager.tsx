import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Check, 
  X, 
  Trash2, 
  Download, 
  Upload, 
  Filter, 
  ArrowUpDown, 
  Search,
  CheckSquare,
  Square,
  Settings,
  MoreHorizontal,
  Copy,
  Edit,
  Tags
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { TestCase } from "@shared/schema";

interface BulkOperation {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (selectedIds?: number[]) => void | Promise<void>;
  variant?: "default" | "destructive" | "outline" | "secondary";
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
}

export function TestCaseBulkManager() {
  const [selectedTestCases, setSelectedTestCases] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    status: "",
    priority: "",
    tags: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for test cases
  const { data: testCases = [], isLoading } = useQuery<TestCase[]>({
    queryKey: ['/api/test-cases'],
    retry: false,
  });

  // Mutation to update test case status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      api.updateTestCaseStatus(id, status),
    onSuccess: () => {
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

  // Filter and sort test cases
  const filteredAndSortedTestCases = useMemo(() => {
    let filtered = testCases.filter(testCase => {
      // Search filter
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

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "status":
          aValue = a.status || "pending";
          bValue = b.status || "pending";
          break;
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority?.toLowerCase() as keyof typeof priorityOrder] || 2;
          bValue = priorityOrder[b.priority?.toLowerCase() as keyof typeof priorityOrder] || 2;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [testCases, searchTerm, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder]);

  // Bulk operations
  const handleBulkApprove = async () => {
    if (selectedTestCases.length === 0) return;
    
    try {
      const promises = selectedTestCases.map(id => 
        updateStatusMutation.mutateAsync({ id, status: "approved" })
      );
      await Promise.all(promises);
      
      setSelectedTestCases([]);
      toast({
        title: "Bulk Approval",
        description: `${selectedTestCases.length} test cases approved`,
      });
    } catch (error) {
      toast({
        title: "Bulk Approval Failed",
        description: "Some test cases could not be approved",
        variant: "destructive",
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedTestCases.length === 0) return;
    
    try {
      const promises = selectedTestCases.map(id => 
        updateStatusMutation.mutateAsync({ id, status: "rejected" })
      );
      await Promise.all(promises);
      
      setSelectedTestCases([]);
      toast({
        title: "Bulk Rejection",
        description: `${selectedTestCases.length} test cases rejected`,
      });
    } catch (error) {
      toast({
        title: "Bulk Rejection Failed",
        description: "Some test cases could not be rejected",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTestCases.length === 0) return;
    
    try {
      const promises = selectedTestCases.map(id => 
        deleteTestCaseMutation.mutateAsync(id)
      );
      await Promise.all(promises);
      
      setSelectedTestCases([]);
      toast({
        title: "Bulk Deletion",
        description: `${selectedTestCases.length} test cases deleted`,
      });
    } catch (error) {
      toast({
        title: "Bulk Deletion Failed",
        description: "Some test cases could not be deleted",
        variant: "destructive",
      });
    }
  };

  const handleBulkEdit = async () => {
    if (selectedTestCases.length === 0) return;
    
    try {
      if (bulkEditData.status) {
        const promises = selectedTestCases.map(id => 
          updateStatusMutation.mutateAsync({ id, status: bulkEditData.status })
        );
        await Promise.all(promises);
      }
      
      const selectedCount = selectedTestCases.length;
      setSelectedTestCases([]);
      setBulkEditDialogOpen(false);
      setBulkEditData({ status: "", priority: "", tags: "" });
      
      toast({
        title: "Bulk Edit Complete",
        description: `${selectedCount} test cases updated`,
      });
    } catch (error) {
      toast({
        title: "Bulk Edit Failed",
        description: "Some test cases could not be updated",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedTestCases.length === filteredAndSortedTestCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(filteredAndSortedTestCases.map(tc => tc.id));
    }
  };

  const handleTestCaseSelect = (testCaseId: number) => {
    setSelectedTestCases(prev => 
      prev.includes(testCaseId) 
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const isOperationInProgress = updateStatusMutation.isPending || deleteTestCaseMutation.isPending;

  const bulkOperations: BulkOperation[] = [
    {
      id: "approve",
      label: "Approve Selected",
      icon: <Check className="h-4 w-4" />,
      action: handleBulkApprove,
      variant: "default"
    },
    {
      id: "reject",
      label: "Reject Selected",
      icon: <X className="h-4 w-4" />,
      action: handleBulkReject,
      variant: "secondary"
    },
    {
      id: "edit",
      label: "Bulk Edit",
      icon: <Edit className="h-4 w-4" />,
      action: () => setBulkEditDialogOpen(true),
      variant: "outline"
    },
    {
      id: "delete",
      label: "Delete Selected",
      icon: <Trash2 className="h-4 w-4" />,
      action: handleBulkDelete,
      variant: "destructive",
      requiresConfirmation: true,
      confirmationTitle: "Delete Selected Test Cases",
      confirmationDescription: `Are you sure you want to delete ${selectedTestCases.length} test cases? This action cannot be undone.`
    }
  ];

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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Test Case Bulk Manager</span>
            <Badge variant="outline" className="ml-2">
              {filteredAndSortedTestCases.length} of {testCases.length}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
          >
            {isAdvancedMode ? "Simple Mode" : "Advanced Mode"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search test cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              {isAdvancedMode && (
                <>
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
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">ID</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center space-x-2"
            >
              {selectedTestCases.length === filteredAndSortedTestCases.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>
                {selectedTestCases.length === filteredAndSortedTestCases.length ? "Deselect All" : "Select All"}
              </span>
            </Button>
            {selectedTestCases.length > 0 && (
              <Badge variant="secondary">
                {selectedTestCases.length} selected
              </Badge>
            )}
          </div>
          
          {selectedTestCases.length > 0 && (
            <div className="flex items-center space-x-2">
              {bulkOperations.map((operation) => (
                operation.requiresConfirmation ? (
                  <AlertDialog key={operation.id}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={operation.variant}
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        {operation.icon}
                        <span>{operation.label}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{operation.confirmationTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {operation.confirmationDescription}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => operation.action(selectedTestCases)}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    key={operation.id}
                    variant={operation.variant}
                    size="sm"
                    onClick={() => operation.action(selectedTestCases)}
                    className="flex items-center space-x-2"
                  >
                    {operation.icon}
                    <span>{operation.label}</span>
                  </Button>
                )
              ))}
            </div>
          )}
        </div>

        {/* Test Cases List */}
        <div className="space-y-2">
          {filteredAndSortedTestCases.map((testCase) => (
            <div
              key={testCase.id}
              className={`p-4 border rounded-lg transition-colors ${
                selectedTestCases.includes(testCase.id) 
                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
                  : "bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedTestCases.includes(testCase.id)}
                    onCheckedChange={() => handleTestCaseSelect(testCase.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-sm font-medium">
                        TC-{testCase.id.toString().padStart(3, '0')}
                      </span>
                      <Badge className={getStatusColor(testCase.status)}>
                        {testCase.status}
                      </Badge>
                      <Badge className={getPriorityColor(testCase.priority)}>
                        {testCase.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{testCase.title}</p>
                    {isAdvancedMode && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {testCase.title.includes('Positive') ? 'Positive' : 
                               testCase.title.includes('Negative') ? 'Negative' :
                               testCase.title.includes('Edge') ? 'Edge Case' :
                               testCase.title.includes('Security') ? 'Security' :
                               testCase.title.includes('Performance') ? 'Performance' : 'Standard'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedTestCases.length === 0 && (
          <div className="text-center py-8">
            <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Test Cases Found</h3>
            <p className="text-muted-foreground">
              Adjust your filters to see test cases.
            </p>
          </div>
        )}

        {/* Bulk Edit Dialog */}
        <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit Test Cases</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-status">Status</Label>
                <Select value={bulkEditData.status} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bulk-priority">Priority</Label>
                <Select value={bulkEditData.priority} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkEdit}>
                  Apply Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}