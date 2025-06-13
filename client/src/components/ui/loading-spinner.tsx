import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size], className)} />
  );
}

interface PulsingDotsProps {
  className?: string;
}

export function PulsingDots({ className }: PulsingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}

interface BouncingDotsProps {
  className?: string;
}

export function BouncingDots({ className }: BouncingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
    </div>
  );
}

interface WaveDotsProps {
  className?: string;
}

export function WaveDots({ className }: WaveDotsProps) {
  return (
    <div className={cn("flex space-x-1 items-end", className)}>
      <div className="h-2 w-1 bg-primary animate-pulse" style={{ 
        animation: 'wave 1.4s infinite ease-in-out',
        animationDelay: '0ms'
      }}></div>
      <div className="h-3 w-1 bg-primary animate-pulse" style={{ 
        animation: 'wave 1.4s infinite ease-in-out',
        animationDelay: '200ms'
      }}></div>
      <div className="h-4 w-1 bg-primary animate-pulse" style={{ 
        animation: 'wave 1.4s infinite ease-in-out',
        animationDelay: '400ms'
      }}></div>
      <div className="h-3 w-1 bg-primary animate-pulse" style={{ 
        animation: 'wave 1.4s infinite ease-in-out',
        animationDelay: '600ms'
      }}></div>
      <div className="h-2 w-1 bg-primary animate-pulse" style={{ 
        animation: 'wave 1.4s infinite ease-in-out',
        animationDelay: '800ms'
      }}></div>
    </div>
  );
}

interface TestCaseLoadingProps {
  text?: string;
  className?: string;
}

export function TestCaseLoading({ text = "Processing test cases", className }: TestCaseLoadingProps) {
  return (
    <div className={cn("flex items-center space-x-3 p-4", className)}>
      <LoadingSpinner size="md" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{text}</span>
        <div className="flex items-center space-x-1 mt-1">
          <span className="text-xs text-muted-foreground">Please wait</span>
          <BouncingDots />
        </div>
      </div>
    </div>
  );
}