import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Clock, FileText, Play, Download } from "lucide-react";
import type { TestCase } from "@shared/schema";

export function StructuredTestViewer() {
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  
  const { data: testCases = [], isLoading } = useQuery<TestCase[]>({
    queryKey: ['/api/test-cases'],
    retry: false,
  });

  const typedTestCases = testCases as TestCase[];

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getTypeColor = (testType: string) => {
    if (testType?.toLowerCase().includes('positive')) return 'bg-green-100 text-green-800';
    if (testType?.toLowerCase().includes('negative')) return 'bg-red-100 text-red-800';
    if (testType?.toLowerCase().includes('security')) return 'bg-purple-100 text-purple-800';
    if (testType?.toLowerCase().includes('performance')) return 'bg-blue-100 text-blue-800';
    if (testType?.toLowerCase().includes('edge')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (typedTestCases.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Test Cases Available</h3>
          <p className="text-muted-foreground">Generate test cases to see the structured format in action</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Test Cases List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Cases ({typedTestCases.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 p-4">
                {typedTestCases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTestCase?.id === testCase.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTestCase(testCase)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(testCase.status)}
                        <Badge className={getTypeColor(testCase.title)} variant="secondary">
                          {testCase.title.split(':')[0]}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {testCase.priority}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      {testCase.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {testCase.testStepsStructured?.length || 0} structured steps
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Test Case Details */}
      <div className="lg:col-span-2">
        {selectedTestCase ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedTestCase.status)}
                  <div>
                    <CardTitle className="text-lg">{selectedTestCase.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getTypeColor(selectedTestCase.title)}>
                        {selectedTestCase.title.split(':')[0]}
                      </Badge>
                      <Badge variant="outline">{selectedTestCase.priority}</Badge>
                      <Badge variant="outline">{selectedTestCase.testType}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="steps" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="steps">Structured Steps</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="execution">Execution</TabsTrigger>
                </TabsList>
                
                <TabsContent value="steps" className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Objective</h4>
                    <p className="text-sm text-muted-foreground">{selectedTestCase.objective}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Prerequisites</h4>
                    <div className="bg-blue-50 p-3 rounded-lg text-sm whitespace-pre-line">
                      {selectedTestCase.prerequisites}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Test Steps</h4>
                    {selectedTestCase.testStepsStructured && selectedTestCase.testStepsStructured.length > 0 ? (
                      <div className="space-y-4">
                        {selectedTestCase.testStepsStructured.map((step, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                Step {step.stepNumber}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                <span className="text-xs text-muted-foreground">Ready</span>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                  Action to Perform
                                </span>
                                <p className="text-sm text-gray-800 mt-1 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                                  {step.action}
                                </p>
                              </div>
                              
                              <div>
                                <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                  Expected Result
                                </span>
                                <p className="text-sm text-green-700 mt-1 p-3 bg-green-50 rounded border-l-4 border-green-400">
                                  {step.expectedResult}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          This test case uses legacy format. Structured steps not available.
                        </p>
                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                          {selectedTestCase.testSteps}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Overall Expected Result</h4>
                    <div className="bg-green-50 p-3 rounded-lg text-sm">
                      {selectedTestCase.expectedResult}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Test Information</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID:</span>
                          <span>{selectedTestCase.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{selectedTestCase.testType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Priority:</span>
                          <span>{selectedTestCase.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="capitalize">{selectedTestCase.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">Execution Details</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Password:</span>
                          <span>{selectedTestCase.testPassword || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Permissions:</span>
                          <div className="mt-1 text-xs">
                            {selectedTestCase.requiredPermissions || 'Default permissions'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="execution" className="space-y-4">
                  <div className="text-center py-8">
                    <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium mb-2">Test Execution</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Execute this test case step by step with clear validation points
                    </p>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      Start Execution
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-24">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Test Case</h3>
              <p className="text-muted-foreground">
                Choose a test case from the list to view its structured steps and details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}