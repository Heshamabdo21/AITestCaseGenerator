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
import { FlaskRound, Check, X, Edit3, Download, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { TestCase } from "@shared/schema";

export function TestCasesSection() {
  const [selectedTestCases, setSelectedTestCases] = useState<number[]>([]);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
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
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const typedTestCases = testCases as TestCase[];
  
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
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
        {/* Test Cases List */}
        <div className="space-y-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <Skeleton className="w-4 h-4" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
              </div>
            ))
          ) : (
            typedTestCases.map((testCase) => (
              <div
                key={testCase.id}
                className={`border border-gray-200 rounded-lg p-5 ${
                  testCase.status === "approved" ? "bg-green-50 border-green-200" : 
                  testCase.status === "rejected" ? "bg-red-50 border-red-200 opacity-75" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedTestCases.includes(testCase.id)}
                      onCheckedChange={() => handleTestCaseSelect(testCase.id)}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{testCase.title}</h4>
                      <p className="text-sm text-gray-600">Test Case ID: TC-{testCase.id.toString().padStart(3, '0')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(testCase.priority)}>
                      {testCase.priority} Priority
                    </Badge>
                    <Badge className={getStatusColor(testCase.status)}>
                      {testCase.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateStatusMutation.mutate({ id: testCase.id, status: "approved" })}
                      disabled={testCase.status === "approved" || updateStatusMutation.isPending}
                      title="Approve"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateStatusMutation.mutate({ id: testCase.id, status: "rejected" })}
                      disabled={testCase.status === "rejected" || updateStatusMutation.isPending}
                      title="Reject"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit"
                          className="text-blue-600 hover:text-blue-700"
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
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Objective:</span>
                      <p className="text-sm text-gray-700 mt-1">{testCase.objective}</p>
                    </div>

                    {testCase.prerequisites && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">Prerequisites:</span>
                        <div className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                          {Array.isArray(testCase.prerequisites) 
                            ? testCase.prerequisites.join('\n')
                            : testCase.prerequisites}
                        </div>
                      </div>
                    )}

                    {testCase.testSteps && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">Test Steps:</span>
                        <div className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                          {Array.isArray(testCase.testSteps) 
                            ? testCase.testSteps.join('\n')
                            : testCase.testSteps}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-sm font-medium text-gray-900">Expected Result:</span>
                      <p className="text-sm text-gray-700 mt-1">{testCase.expectedResult}</p>
                    </div>

                    {testCase.testPassword && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">Test Password:</span>
                        <p className="text-sm text-gray-700 mt-1 font-mono bg-gray-100 px-2 py-1 rounded">
                          {testCase.testPassword}
                        </p>
                      </div>
                    )}

                    {testCase.requiredPermissions && (
                      <div>
                        <span className="text-sm font-medium text-gray-900">Required Permissions:</span>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-line bg-blue-50 px-3 py-2 rounded border-l-4 border-blue-400">
                          {testCase.requiredPermissions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Approval Actions */}
        {typedTestCases.length > 0 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSelectAll}>
                <Check className="h-4 w-4 mr-2" />
                {selectedTestCases.length === typedTestCases.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedTestCases.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedTestCases.length} of {typedTestCases.length} selected
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
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
