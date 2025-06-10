import { cn } from "@/lib/utils";

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
        <h2 className="text-2xl font-semibold text-gray-900">Test Case Generation Workflow</h2>
        <button 
          onClick={onReset}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          <i className="fas fa-refresh mr-2"></i>Reset Workflow
        </button>
      </div>
      <div className="flex items-center space-x-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center space-x-2">
            {index > 0 && <div className="h-px bg-gray-300 flex-1 w-16"></div>}
            <div className="flex items-center space-x-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                currentStep >= step.number
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-600"
              )}>
                {step.number}
              </div>
              <span className={cn(
                "text-sm font-medium",
                currentStep >= step.number ? "text-blue-600" : "text-gray-500"
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
