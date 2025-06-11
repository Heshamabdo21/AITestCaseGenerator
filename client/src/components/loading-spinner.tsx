import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <Loader2 
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} 
    />
  );
}

export function LoadingCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        {children && (
          <p className="text-sm text-muted-foreground">{children}</p>
        )}
      </div>
    </div>
  );
}