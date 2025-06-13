import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EnhancedThemeProvider } from "@/components/enhanced-theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { AiAssistant } from "@/components/ai-assistant";
import { OnboardingTour } from "@/components/onboarding-tour";
import Home from "@/pages/home";
import Demo from "@/pages/demo";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/demo" component={Demo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <EnhancedThemeProvider defaultTheme="light" storageKey="ai-test-generator-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
            <AiAssistant data-tour="ai-assistant" />
            <OnboardingTour autoStart={true} />
          </TooltipProvider>
        </QueryClientProvider>
      </EnhancedThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
