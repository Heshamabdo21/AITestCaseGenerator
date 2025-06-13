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
import { FlaskRound, Check, X, Edit3, Download, CloudUpload, Eye, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { LoadingSpinner, TestCaseLoading, BouncingDots } from "@/components/ui/loading-spinner";
import type { TestCase } from "@shared/schema";

export function TestCasesSection() {
  const [selectedTestCases, setSelectedTestCases] = useState<number[]>([]);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [viewingTestCase, setViewingTestCase] = useState<TestCase | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
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
    onSuccess: (_, { status }) => {
      toast({
        title: status === "approved" ? "Test Case Approved" : "Test Case Rejected",
        description: `Test case ${status} successfully`,
      });
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

  // Mutation to add test cases to Azure DevOps
  const addToAzureMutation = useMutation({
    mutationFn: (testCaseIds: number[]) => api.addTestCasesToAzure(testCaseIds),
    onSuccess: (result) => {
      toast({
        title: "Test Cases Added to Azure DevOps",
        description: `Successfully added ${result.successCount} test cases`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
      setSelectedTestCases([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Test Cases",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to export test cases to Excel
  const exportToExcelMutation = useMutation({
    mutationFn: () => api.exportTestCasesToExcel(),
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Test cases have been exported to Excel file",
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

  // Mutation to delete test case
  const deleteTestCaseMutation = useMutation({
    mutationFn: (testCaseId: number) => 
      fetch(`/api/test-cases/${testCaseId}`, { method: 'DELETE' })
        .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to delete'))),
    onSuccess: (_, deletedTestCaseId) => {
      toast({
        title: "Test Case Deleted",
        description: "Test case deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
      setSelectedTestCases(prev => prev.filter(id => id !== deletedTestCaseId));
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete all test cases
  const deleteAllTestCasesMutation = useMutation({
    mutationFn: () => 
      fetch('/api/test-cases', { method: 'DELETE' })
        .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to delete all'))),
    onSuccess: () => {
      toast({
        title: "All Test Cases Deleted",
        description: "All test cases have been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
      setSelectedTestCases([]);
      setCurrentPage(1);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = () => {
    const typedTestCases = testCases as TestCase[];
    if (selectedTestCases.length === typedTestCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(typedTestCases.map((tc) => tc.id));
    }
  };

  const handleTestCaseSelect = (testCaseId: number) => {
    setSelectedTestCases(prev => 
      prev.includes(testCaseId) 
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const handleApproveSelected = () => {
    const typedTestCases = testCases as TestCase[];
    const approvedTestCases = typedTestCases.filter((tc) => 
      selectedTestCases.includes(tc.id) && tc.status === "approved"
    );

    if (approvedTestCases.length === 0) {
      // First approve all selected test cases
      selectedTestCases.forEach(id => {
        const testCase = typedTestCases.find((tc) => tc.id === id);
        if (testCase && testCase.status === "pending") {
          updateStatusMutation.mutate({ id, status: "approved" });
        }
      });
      
      setTimeout(() => {
        addToAzureMutation.mutate(selectedTestCases);
      }, 1000);
    } else {
      addToAzureMutation.mutate(selectedTestCases);
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
  
  // Pagination logic
  const totalPages = Math.ceil(typedTestCases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTestCases = typedTestCases.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteTestCase = (testCaseId: number) => {
    deleteTestCaseMutation.mutate(testCaseId);
  };

  const handleDeleteAllTestCases = () => {
    deleteAllTestCasesMutation.mutate();
  };
  
  if (typedTestCases.length === 0 && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FlaskRound className="h-5 w-5 text-primary" />
            <span>Generated Test Cases</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FlaskRound className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Test Cases Generated</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Select user stories and generate test cases to begin the testing workflow.
            </p>
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
            <FlaskRound className="h-5 w-5 text-blue-600" />
            <CardTitle>Generated Test Cases</CardTitle>
            <Badge className="bg-green-100 text-green-800">
              {typedTestCases.length} generated
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToExcelMutation.mutate()}
              disabled={typedTestCases.length === 0 || exportToExcelMutation.isPending}
            >
              {exportToExcelMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
            <Button
              onClick={handleApproveSelected}
              disabled={selectedTestCases.length === 0 || addToAzureMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {addToAzureMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2 border-white" />
                  Processing
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
        {/* Test Cases Table */}
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTestCases.length === paginatedTestCases.length && paginatedTestCases.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, i) => (
                    <TableRow key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                      <TableCell>
                        <Skeleton className="h-4 w-4 shimmer animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16 shimmer animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48 shimmer animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16 shimmer animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20 shimmer animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 shimmer animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 w-8 shimmer animate-pulse rounded" />
                          <Skeleton className="h-8 w-8 shimmer animate-pulse rounded" />
                          <Skeleton className="h-8 w-8 shimmer animate-pulse rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedTestCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FlaskRound className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No test cases found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTestCases.map((testCase) => (
                    <TableRow 
                      key={testCase.id}
                      className={
                        testCase.status === "approved" ? "bg-green-50/50" : 
                        testCase.status === "rejected" ? "bg-red-50/50" : ""
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
                        <div className="truncate" title={testCase.title}>
                          {testCase.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(testCase.priority)}>
                          {testCase.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(testCase.status)}>
                          {testCase.status}
                        </Badge>
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
                                onClick={() => setViewingTestCase(testCase)}
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
                                    <Badge className={getStatusColor(testCase.status)}>
                                      {testCase.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-semibold text-muted-foreground">TYPE</Label>
                                    <Badge variant="outline">
                                      {testCase.title.includes('Positive') ? 'Positive' : 
                                       testCase.title.includes('Negative') ? 'Negative' :
                                       testCase.title.includes('Edge') ? 'Edge Case' :
                                       testCase.title.includes('Security') ? 'Security' :
                                       testCase.title.includes('Performance') ? 'Performance' : 'Standard'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-semibold">Title</Label>
                                  <p className="mt-1 text-sm">{testCase.title}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-semibold">Objective</Label>
                                  <p className="mt-1 text-sm text-muted-foreground">{testCase.objective}</p>
                                </div>

                                {testCase.prerequisites && (
                                  <div>
                                    <Label className="text-sm font-semibold">Prerequisites</Label>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                      <pre className="text-sm whitespace-pre-wrap">
                                        {Array.isArray(testCase.prerequisites) 
                                          ? testCase.prerequisites.join('\n')
                                          : testCase.prerequisites}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {testCase.testSteps && (
                                  <div>
                                    <Label className="text-sm font-semibold">Test Steps</Label>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                      {testCase.testStepsStructured && testCase.testStepsStructured.length > 0 ? (
                                        <div className="space-y-3">
                                          {testCase.testStepsStructured.map((step, index) => (
                                            <div key={index} className="border rounded-md p-3 bg-background">
                                              <div className="mb-2">
                                                <Badge variant="secondary" className="text-xs">
                                                  Step {step.stepNumber}
                                                </Badge>
                                              </div>
                                              <div className="space-y-2">
                                                <div>
                                                  <span className="text-xs font-medium">Action:</span>
                                                  <p className="text-sm">{step.action}</p>
                                                </div>
                                                <div>
                                                  <span className="text-xs font-medium">Expected Result:</span>
                                                  <p className="text-sm text-green-700">{step.expectedResult}</p>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <pre className="text-sm whitespace-pre-wrap">
                                          {Array.isArray(testCase.testSteps) 
                                            ? testCase.testSteps.join('\n')
                                            : testCase.testSteps}
                                        </pre>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <Label className="text-sm font-semibold">Expected Result</Label>
                                  <div className="mt-1 p-3 bg-green-50 border-l-4 border-green-400 rounded-md">
                                    <p className="text-sm">{testCase.expectedResult}</p>
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
                                    <div className="mt-1 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                                      <pre className="text-sm whitespace-pre-wrap">{testCase.requiredPermissions}</pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Edit"
                                className="h-8 w-8"
                                onClick={() => setEditingTestCase(testCase)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Test Case</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="title">Title</Label>
                                  <Input id="title" defaultValue={testCase.title} />
                                </div>
                                <div>
                                  <Label htmlFor="objective">Objective</Label>
                                  <Textarea id="objective" defaultValue={testCase.objective} />
                                </div>
                                <div>
                                  <Label>Prerequisites</Label>
                                  <Textarea 
                                    defaultValue={Array.isArray(testCase.prerequisites) 
                                      ? testCase.prerequisites.join('\n') 
                                      : testCase.prerequisites || ''} 
                                    placeholder="Enter each prerequisite on a new line"
                                  />
                                </div>
                                <div>
                                  <Label>Test Steps</Label>
                                  <Textarea 
                                    defaultValue={Array.isArray(testCase.testSteps) 
                                      ? testCase.testSteps.join('\n') 
                                      : testCase.testSteps || ''} 
                                    placeholder="Enter each step on a new line"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="expectedResult">Expected Result</Label>
                                  <Textarea id="expectedResult" defaultValue={testCase.expectedResult} />
                                </div>
                                <div>
                                  <Label htmlFor="testPassword">Test Password</Label>
                                  <Input 
                                    id="testPassword" 
                                    type="text" 
                                    defaultValue={testCase.testPassword || ''} 
                                    placeholder="Enter test password for execution"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="requiredPermissions">Required Permissions</Label>
                                  <Textarea 
                                    id="requiredPermissions" 
                                    defaultValue={testCase.requiredPermissions || ''} 
                                    placeholder="Enter required permissions for test execution (e.g., admin, read-write, user-management)"
                                    rows={3}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateStatusMutation.mutate({ id: testCase.id, status: "approved" })}
                            disabled={testCase.status === "approved" || updateStatusMutation.isPending}
                            title="Approve"
                            className="h-8 w-8 text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-110"
                          >
                            {updateStatusMutation.isPending ? (
                              <LoadingSpinner size="sm" className="border-green-600" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateStatusMutation.mutate({ id: testCase.id, status: "rejected" })}
                            disabled={testCase.status === "rejected" || updateStatusMutation.isPending}
                            title="Reject"
                            className="h-8 w-8 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                          >
                            {updateStatusMutation.isPending ? (
                              <LoadingSpinner size="sm" className="border-red-600" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Delete"
                                className="h-8 w-8 text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                                disabled={deleteTestCaseMutation.isPending}
                              >
                                {deleteTestCaseMutation.isPending ? (
                                  <LoadingSpinner size="sm" className="border-red-600" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
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
                                <AlertDialogAction
                                  onClick={() => handleDeleteTestCase(testCase.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, typedTestCases.length)} of {typedTestCases.length} test cases
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="transition-all duration-200 hover:scale-105"
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
                      className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110"
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
                  className="transition-all duration-200 hover:scale-105"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {typedTestCases.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSelectAll}>
                <Check className="h-4 w-4 mr-2" />
                {selectedTestCases.length === typedTestCases.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedTestCases.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedTestCases.length} of {typedTestCases.length} selected
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
                      Are you sure you want to delete all {typedTestCases.length} test cases? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllTestCases}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                onClick={() => {
                  selectedTestCases.forEach(id => {
                    updateStatusMutation.mutate({ id, status: "rejected" });
                  });
                  setSelectedTestCases([]);
                }}
                disabled={selectedTestCases.length === 0 || updateStatusMutation.isPending}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Reject Selected
              </Button>

              <Button
                onClick={handleApproveSelected}
                disabled={selectedTestCases.length === 0 || addToAzureMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {addToAzureMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding to Azure DevOps...
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-4 w-4 mr-2" />
                    Add to Azure DevOps
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
