import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface WorkflowProgressProps {
  currentStep: number;
  onReset: () => void;
}

const steps = [
  { number: 1, label: "Configure" },
  { number: 2, label: "Fetch Stories" },
  { number: 3, label: "Generate Tests" },
  { number: 4, label: "Review & Approve" },
];

export function WorkflowProgress({ currentStep, onReset }: WorkflowProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Test Case Generation Workflow</h2>
        <Button 
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset Workflow
        </Button>
      </div>
      <div className="flex items-center space-x-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center space-x-2">
            {index > 0 && <div className="h-px bg-border flex-1 w-16"></div>}
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                currentStep >= step.number
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {step.number}
              </div>
              <span className={cn(
                "text-sm font-medium",
                currentStep >= step.number ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
