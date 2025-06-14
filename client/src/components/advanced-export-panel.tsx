import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileJson,
  Settings,
  Filter,
  Calendar,
  User,
  Tag,
  CheckCircle,
  FileCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { TestCase } from "@shared/schema";

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  fileExtension: string;
  mimeType: string;
}

interface ExportOptions {
  format: string;
  includeFields: string[];
  filterBy: {
    status: string[];
    priority: string[];
    userStory: string[];
  };
  groupBy: string;
  includeMetadata: boolean;
  customFilename: string;
  includeStats: boolean;
}

const exportFormats: ExportFormat[] = [
  {
    id: "excel",
    name: "Excel Workbook",
    description: "Comprehensive Excel file with multiple worksheets",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    fileExtension: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  },
  {
    id: "csv",
    name: "CSV File",
    description: "Simple comma-separated values format",
    icon: <FileText className="h-4 w-4" />,
    fileExtension: "csv",
    mimeType: "text/csv"
  },
  {
    id: "json",
    name: "JSON Export",
    description: "Machine-readable JSON format for integrations",
    icon: <FileJson className="h-4 w-4" />,
    fileExtension: "json",
    mimeType: "application/json"
  },
  {
    id: "markdown",
    name: "Markdown Report",
    description: "Formatted markdown file for documentation",
    icon: <FileCode className="h-4 w-4" />,
    fileExtension: "md",
    mimeType: "text/markdown"
  }
];

const availableFields = [
  { id: "id", label: "Test Case ID", required: true },
  { id: "title", label: "Title", required: true },
  { id: "objective", label: "Objective" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "testSteps", label: "Test Steps" },
  { id: "expectedResult", label: "Expected Result" },
  { id: "status", label: "Status" },
  { id: "priority", label: "Priority" },
  { id: "userStoryId", label: "User Story ID" },
  { id: "testType", label: "Test Type" },
  { id: "requiredPermissions", label: "Required Permissions" },
  { id: "testPassword", label: "Test Password" }
];

export function AdvancedExportPanel() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "excel",
    includeFields: ["id", "title", "objective", "testSteps", "expectedResult", "status", "priority"],
    filterBy: {
      status: [],
      priority: [],
      userStory: []
    },
    groupBy: "userStory",
    includeMetadata: true,
    customFilename: "",
    includeStats: true
  });

  const { toast } = useToast();

  const { data: testCases = [] } = useQuery<TestCase[]>({
    queryKey: ['/api/test-cases'],
    retry: false,
  });

  const { data: userStories = [] } = useQuery<any[]>({
    queryKey: ['/api/user-stories/stored'],
    retry: false,
  });

  const exportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      // Filter test cases based on export options
      let filteredTestCases = testCases.filter(tc => {
        if (options.filterBy.status.length > 0 && !options.filterBy.status.includes(tc.status)) {
          return false;
        }
        if (options.filterBy.priority.length > 0 && !options.filterBy.priority.includes(tc.priority?.toLowerCase() || 'medium')) {
          return false;
        }
        if (options.filterBy.userStory.length > 0 && !options.filterBy.userStory.includes(tc.userStoryId?.toString() || 'unassigned')) {
          return false;
        }
        return true;
      });

      // Generate export data based on format
      return generateExportData(filteredTestCases, options);
    },
    onSuccess: (data, options) => {
      downloadFile(data, options);
      toast({
        title: "Export Successful",
        description: `Test cases exported as ${exportFormats.find(f => f.id === options.format)?.name}`,
      });
      setExportDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateExportData = (testCases: TestCase[], options: ExportOptions) => {
    const selectedFormat = exportFormats.find(f => f.id === options.format);
    
    switch (options.format) {
      case "excel":
        return generateExcelData(testCases, options);
      case "csv":
        return generateCsvData(testCases, options);
      case "json":
        return generateJsonData(testCases, options);
      case "markdown":
        return generateMarkdownData(testCases, options);
      default:
        throw new Error("Unsupported export format");
    }
  };

  const generateExcelData = (testCases: TestCase[], options: ExportOptions) => {
    // Simulate Excel data generation
    const headers = options.includeFields.map(field => 
      availableFields.find(f => f.id === field)?.label || field
    );
    
    const rows = testCases.map(tc => 
      options.includeFields.map(field => {
        switch (field) {
          case "id": return `TC-${tc.id.toString().padStart(3, '0')}`;
          case "testType": 
            return tc.title.includes('Positive') ? 'Positive' : 
                   tc.title.includes('Negative') ? 'Negative' :
                   tc.title.includes('Edge') ? 'Edge Case' :
                   tc.title.includes('Security') ? 'Security' :
                   tc.title.includes('Performance') ? 'Performance' : 'Standard';
          default: return (tc as any)[field] || '';
        }
      })
    );

    return { headers, rows, type: 'excel' };
  };

  const generateCsvData = (testCases: TestCase[], options: ExportOptions) => {
    const headers = options.includeFields.map(field => 
      availableFields.find(f => f.id === field)?.label || field
    );
    
    const csvContent = [
      headers.join(','),
      ...testCases.map(tc => 
        options.includeFields.map(field => {
          let value: any;
          switch (field) {
            case "id": 
              value = `TC-${tc.id.toString().padStart(3, '0')}`;
              break;
            case "testType": 
              value = tc.title.includes('Positive') ? 'Positive' : 
                     tc.title.includes('Negative') ? 'Negative' :
                     tc.title.includes('Edge') ? 'Edge Case' :
                     tc.title.includes('Security') ? 'Security' :
                     tc.title.includes('Performance') ? 'Performance' : 'Standard';
              break;
            default: 
              value = (tc as any)[field] || '';
          }
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const generateJsonData = (testCases: TestCase[], options: ExportOptions) => {
    const exportData = {
      metadata: options.includeMetadata ? {
        exportDate: new Date().toISOString(),
        totalTestCases: testCases.length,
        exportedFields: options.includeFields,
        exportOptions: options
      } : undefined,
      testCases: testCases.map(tc => {
        const exported: any = {};
        options.includeFields.forEach(field => {
          switch (field) {
            case "id": 
              exported.id = `TC-${tc.id.toString().padStart(3, '0')}`;
              break;
            case "testType": 
              exported.testType = tc.title.includes('Positive') ? 'Positive' : 
                                 tc.title.includes('Negative') ? 'Negative' :
                                 tc.title.includes('Edge') ? 'Edge Case' :
                                 tc.title.includes('Security') ? 'Security' :
                                 tc.title.includes('Performance') ? 'Performance' : 'Standard';
              break;
            default: 
              exported[field] = (tc as any)[field];
          }
        });
        return exported;
      }),
      statistics: options.includeStats ? {
        byStatus: testCases.reduce((acc, tc) => {
          acc[tc.status] = (acc[tc.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPriority: testCases.reduce((acc, tc) => {
          const priority = tc.priority?.toLowerCase() || 'medium';
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      } : undefined
    };

    return JSON.stringify(exportData, null, 2);
  };

  const generateMarkdownData = (testCases: TestCase[], options: ExportOptions) => {
    let markdown = `# Test Cases Export\n\n`;
    
    if (options.includeMetadata) {
      markdown += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
      markdown += `**Total Test Cases:** ${testCases.length}\n\n`;
    }

    if (options.includeStats) {
      const statusStats = testCases.reduce((acc, tc) => {
        acc[tc.status] = (acc[tc.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      markdown += `## Statistics\n\n`;
      markdown += `### By Status\n`;
      Object.entries(statusStats).forEach(([status, count]) => {
        markdown += `- **${status}:** ${count}\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Test Cases\n\n`;

    testCases.forEach((tc, index) => {
      markdown += `### ${index + 1}. TC-${tc.id.toString().padStart(3, '0')}: ${tc.title}\n\n`;
      
      if (options.includeFields.includes('objective') && tc.objective) {
        markdown += `**Objective:** ${tc.objective}\n\n`;
      }
      
      if (options.includeFields.includes('prerequisites') && tc.prerequisites) {
        markdown += `**Prerequisites:**\n${tc.prerequisites}\n\n`;
      }
      
      if (options.includeFields.includes('testSteps') && tc.testSteps) {
        markdown += `**Test Steps:**\n${tc.testSteps}\n\n`;
      }
      
      if (options.includeFields.includes('expectedResult') && tc.expectedResult) {
        markdown += `**Expected Result:** ${tc.expectedResult}\n\n`;
      }

      markdown += `**Status:** ${tc.status}  \n`;
      markdown += `**Priority:** ${tc.priority}\n\n`;
      markdown += `---\n\n`;
    });

    return markdown;
  };

  const downloadFile = (data: any, options: ExportOptions) => {
    const selectedFormat = exportFormats.find(f => f.id === options.format);
    if (!selectedFormat) return;

    let content: string;
    let mimeType = selectedFormat.mimeType;

    if (options.format === 'excel') {
      // For Excel, we'd need a proper library like xlsx
      // For now, convert to CSV format
      content = `${data.headers.join(',')}\n${data.rows.map((row: any[]) => row.join(',')).join('\n')}`;
      mimeType = 'text/csv';
    } else {
      content = typeof data === 'string' ? data : JSON.stringify(data);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const filename = options.customFilename || 
      `test-cases-${new Date().toISOString().split('T')[0]}.${selectedFormat.fileExtension}`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getUniqueValues = (field: keyof TestCase) => {
    const values = new Set<string>();
    testCases.forEach(tc => {
      const value = tc[field];
      if (value) {
        if (field === 'priority') {
          values.add(value.toLowerCase());
        } else {
          values.add(value.toString());
        }
      }
    });
    return Array.from(values);
  };

  const getUniqueUserStories = () => {
    const userStoryIds = new Set<string>();
    testCases.forEach(tc => {
      userStoryIds.add(tc.userStoryId?.toString() || 'unassigned');
    });
    return Array.from(userStoryIds);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Advanced Export</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {exportFormats.map((format) => (
              <Button
                key={format.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => {
                  setExportOptions(prev => ({ ...prev, format: format.id }));
                  setExportDialogOpen(true);
                }}
              >
                {format.icon}
                <div className="text-center">
                  <div className="font-medium text-sm">{format.name}</div>
                  <div className="text-xs text-muted-foreground">{format.description}</div>
                </div>
              </Button>
            ))}
          </div>

          <Button
            onClick={() => setExportDialogOpen(true)}
            className="w-full"
            disabled={testCases.length === 0}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure Export Options
          </Button>
        </div>

        {/* Export Configuration Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Export Configuration</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <Label className="text-sm font-semibold">Export Format</Label>
                <Select 
                  value={exportOptions.format} 
                  onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exportFormats.map(format => (
                      <SelectItem key={format.id} value={format.id}>
                        <div className="flex items-center space-x-2">
                          {format.icon}
                          <span>{format.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Field Selection */}
              <div>
                <Label className="text-sm font-semibold">Include Fields</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {availableFields.map(field => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={exportOptions.includeFields.includes(field.id)}
                        onCheckedChange={(checked) => {
                          if (field.required) return;
                          setExportOptions(prev => ({
                            ...prev,
                            includeFields: checked 
                              ? [...prev.includeFields, field.id]
                              : prev.includeFields.filter(f => f !== field.id)
                          }));
                        }}
                        disabled={field.required}
                      />
                      <Label className={`text-sm ${field.required ? 'text-muted-foreground' : ''}`}>
                        {field.label} {field.required && '(Required)'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Filters */}
              <div>
                <Label className="text-sm font-semibold">Filters</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <div className="space-y-1 mt-1">
                      {getUniqueValues('status').map(status => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            checked={exportOptions.filterBy.status.includes(status)}
                            onCheckedChange={(checked) => {
                              setExportOptions(prev => ({
                                ...prev,
                                filterBy: {
                                  ...prev.filterBy,
                                  status: checked 
                                    ? [...prev.filterBy.status, status]
                                    : prev.filterBy.status.filter(s => s !== status)
                                }
                              }));
                            }}
                          />
                          <Label className="text-xs">{status}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Priority</Label>
                    <div className="space-y-1 mt-1">
                      {getUniqueValues('priority').map(priority => (
                        <div key={priority} className="flex items-center space-x-2">
                          <Checkbox
                            checked={exportOptions.filterBy.priority.includes(priority)}
                            onCheckedChange={(checked) => {
                              setExportOptions(prev => ({
                                ...prev,
                                filterBy: {
                                  ...prev.filterBy,
                                  priority: checked 
                                    ? [...prev.filterBy.priority, priority]
                                    : prev.filterBy.priority.filter(p => p !== priority)
                                }
                              }));
                            }}
                          />
                          <Label className="text-xs">{priority}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">User Story</Label>
                    <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                      {getUniqueUserStories().slice(0, 5).map(userStoryId => (
                        <div key={userStoryId} className="flex items-center space-x-2">
                          <Checkbox
                            checked={exportOptions.filterBy.userStory.includes(userStoryId)}
                            onCheckedChange={(checked) => {
                              setExportOptions(prev => ({
                                ...prev,
                                filterBy: {
                                  ...prev.filterBy,
                                  userStory: checked 
                                    ? [...prev.filterBy.userStory, userStoryId]
                                    : prev.filterBy.userStory.filter(us => us !== userStoryId)
                                }
                              }));
                            }}
                          />
                          <Label className="text-xs">
                            {userStoryId === 'unassigned' ? 'Unassigned' : `Story ${userStoryId}`}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Additional Options */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filename">Custom Filename</Label>
                  <Input
                    id="filename"
                    value={exportOptions.customFilename}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, customFilename: e.target.value }))}
                    placeholder="Leave empty for auto-generated filename"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeMetadata: !!checked }))}
                    />
                    <Label className="text-sm">Include metadata</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeStats}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeStats: !!checked }))}
                    />
                    <Label className="text-sm">Include statistics</Label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => exportMutation.mutate(exportOptions)}
                  disabled={exportMutation.isPending}
                >
                  {exportMutation.isPending ? "Exporting..." : "Export"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}