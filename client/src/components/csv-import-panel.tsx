import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Download, CheckCircle, AlertCircle, Info } from "lucide-react";

interface CsvPreview {
  success: boolean;
  preview: Array<{
    originalData: any;
    processedPreview: any;
  }>;
  analysis: {
    totalRows: number;
    uniqueTitles: number;
    workItemTypes: string[];
    hasTestSteps: number;
    hasExpectedResults: number;
  };
  fileName: string;
  recommendations: string[];
}

interface ImportResult {
  success: boolean;
  message: string;
  stats: {
    total: number;
    enhanced: number;
    categories: Record<string, number>;
  };
  testCases: any[];
  userStory: any;
  fileName: string;
}

export function CsvImportPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [enhanceTestCases, setEnhanceTestCases] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: async (file: File): Promise<CsvPreview> => {
      const formData = new FormData();
      formData.append('csvFile', file);
      const response = await fetch('/api/test-cases/preview-csv', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Preview failed: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: CsvPreview) => {
      setPreview(data);
      toast({
        title: "CSV Preview Generated",
        description: `Analyzed ${data.analysis.totalRows} rows from ${data.fileName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Preview Failed",
        description: error.message || "Failed to preview CSV file",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ file, enhance }: { file: File; enhance: boolean }): Promise<ImportResult> => {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('enhanceTestCases', enhance.toString());
      const response = await fetch('/api/test-cases/import-csv', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
      toast({
        title: "Import Successful",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV file",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setPreview(null);
      setImportResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (selectedFile) {
      previewMutation.mutate(selectedFile);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate({ file: selectedFile, enhance: enhanceTestCases });
    }
  };

  const downloadTemplate = () => {
    window.open('/api/test-cases/csv-template', '_blank');
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreview(null);
    setImportResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload size={20} />
          CSV Test Case Import
        </CardTitle>
        <CardDescription>
          Import and enhance test cases from CSV files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Need a template?</p>
            <p className="text-sm text-muted-foreground">Download CSV template with proper format</p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download size={16} className="mr-2" />
            Template
          </Button>
        </div>

        {/* File Selection */}
        <div className="space-y-4">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText size={16} />
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Enhancement Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="enhance"
            checked={enhanceTestCases}
            onCheckedChange={(checked) => setEnhanceTestCases(checked === true)}
          />
          <Label htmlFor="enhance" className="text-sm">
            Generate enhanced test cases (positive, negative, edge cases)
          </Label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handlePreview}
            disabled={!selectedFile || previewMutation.isPending}
            variant="outline"
          >
            {previewMutation.isPending ? "Analyzing..." : "Preview"}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
          >
            {importMutation.isPending ? "Importing..." : "Import"}
          </Button>
          {(preview || importResult) && (
            <Button onClick={resetImport} variant="ghost">
              Reset
            </Button>
          )}
        </div>

        {/* Loading Progress */}
        {(previewMutation.isPending || importMutation.isPending) && (
          <div className="space-y-2">
            <Progress value={previewMutation.isPending ? 50 : 75} />
            <p className="text-sm text-muted-foreground text-center">
              {previewMutation.isPending ? "Analyzing CSV structure..." : "Importing test cases..."}
            </p>
          </div>
        )}

        {/* Preview Results */}
        {preview && (
          <div className="space-y-4">
            <Separator />
            <div>
              <h4 className="font-medium mb-3">CSV Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Rows:</span>
                  <Badge variant="secondary" className="ml-2">{preview.analysis.totalRows}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Unique Titles:</span>
                  <Badge variant="secondary" className="ml-2">{preview.analysis.uniqueTitles}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">With Test Steps:</span>
                  <Badge variant="secondary" className="ml-2">{preview.analysis.hasTestSteps}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">With Expected Results:</span>
                  <Badge variant="secondary" className="ml-2">{preview.analysis.hasExpectedResults}</Badge>
                </div>
              </div>
              
              <div className="mt-3">
                <span className="text-muted-foreground text-sm">Work Item Types:</span>
                <div className="flex gap-1 mt-1">
                  {preview.analysis.workItemTypes.map((type) => (
                    <Badge key={type} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="font-medium">Recommendations</h4>
              {preview.recommendations.map((rec, index) => (
                <Alert key={index}>
                  <Info size={16} />
                  <AlertDescription>{rec}</AlertDescription>
                </Alert>
              ))}
            </div>

            {/* Sample Data Preview */}
            {preview.preview.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sample Data (First 5 rows)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3 border-b">
                    <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                      <span>Title</span>
                      <span>Action</span>
                      <span>Expected</span>
                    </div>
                  </div>
                  <div className="divide-y">
                    {preview.preview.map((item, index) => (
                      <div key={index} className="p-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <span className="truncate">{item.processedPreview.title}</span>
                          <span className="truncate">{item.processedPreview.stepAction}</span>
                          <span className="truncate">{item.processedPreview.stepExpected}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-4">
            <Separator />
            <Alert>
              <CheckCircle size={16} />
              <AlertDescription>
                {importResult.message}
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="font-medium mb-3">Import Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Base Test Cases:</span>
                  <Badge variant="secondary" className="ml-2">{importResult.stats.total}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Enhanced Cases:</span>
                  <Badge variant="secondary" className="ml-2">{importResult.stats.enhanced}</Badge>
                </div>
              </div>

              <div className="mt-3">
                <span className="text-muted-foreground text-sm">Categories:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(importResult.stats.categories).map(([category, count]) => (
                    <Badge key={category} variant="outline">
                      {category}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>User Story Created:</strong> {importResult.userStory?.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                All imported test cases have been organized under this user story
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}