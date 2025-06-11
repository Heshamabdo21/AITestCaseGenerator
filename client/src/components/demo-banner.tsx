import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardContent className="flex items-center space-x-3 py-4">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-800 dark:text-blue-200">
            Demo Mode Active
          </p>
          <p className="text-blue-700 dark:text-blue-300">
            Running with sample data. Configure your Azure DevOps settings and try the new test type selection feature (Web Portal, Mobile App, API tests).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}