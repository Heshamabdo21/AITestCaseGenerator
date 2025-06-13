import { StructuredTestViewer } from "@/components/structured-test-viewer";
import { UnifiedTestGenerator } from "@/components/unified-test-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Layers, CheckSquare, Target } from "lucide-react";
import { Link } from "wouter";

export default function TestViewer() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Layers className="text-primary-foreground" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Structured Test Cases</h1>
                  <p className="text-sm text-muted-foreground">Step-by-step format with actions and expected results</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Structured Format Active
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Format Overview */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Structured Test Case Format</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Step Number</h3>
                  <p className="text-sm text-muted-foreground">Sequential numbering for clear execution order</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckSquare className="text-white" size={20} />
                  </div>
                  <h3 className="font-semibold mb-2">Action to Perform</h3>
                  <p className="text-sm text-muted-foreground">Specific action or test step to execute</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="text-white" size={16} />
                  </div>
                  <h3 className="font-semibold mb-2">Expected Result</h3>
                  <p className="text-sm text-muted-foreground">Clear validation criteria for each step</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unified Generator */}
        <div className="mb-8">
          <UnifiedTestGenerator />
        </div>

        {/* Test Cases Viewer */}
        <StructuredTestViewer />
      </div>
    </div>
  );
}