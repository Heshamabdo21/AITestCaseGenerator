import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CsvImportResponse {
  message: string;
  testCases: any[];
  userStory: any;
}

export function CsvImportPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const response = await fetch('/api/test-cases/import-csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data: CsvImportResponse) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/test-cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-stories/stored'] });
      toast({
        title: "Import Successful",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setImportResult(null);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV Test Case Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Upload a CSV file with test case data for enhanced processing
            </p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          <Button 
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
            className="w-full"
          >
            {importMutation.isPending ? "Importing..." : "Import & Enhance Test Cases"}
          </Button>
        </div>

        {importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {importResult.message}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Import Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Test Cases Created:</span>
                    <span className="font-medium">{importResult.testCases.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>User Story:</span>
                    <span className="font-medium">{importResult.userStory.title}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Enhancement Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Enhanced with comprehensive test scenarios including:
                  </div>
                  <ul className="text-xs space-y-1">
                    <li>✓ Positive test cases</li>
                    <li>✓ Negative test cases</li>
                    <li>✓ Detailed prerequisites</li>
                    <li>✓ Step-by-step instructions</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">CSV Format Requirements</h4>
          <Textarea
            readOnly
            value={`Expected CSV columns:
ID, Work Item Type, Title, Test Step, Step Action, Step Expected, Area Path, Assigned To, State

Example:
,Test Case,"User can view page content",1,"Navigate to page","Page loads successfully",,,"Design"`}
            className="text-xs font-mono"
            rows={6}
          />
        </div>
      </CardContent>
    </Card>
  );
}