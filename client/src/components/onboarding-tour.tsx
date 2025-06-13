import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Zap,
  Target,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  highlight?: boolean;
}

interface OnboardingTourProps {
  steps?: TourStep[];
  isOpen?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
}

const defaultSteps: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to Test Case Manager!',
    content: 'Let me show you around this powerful test management platform. This tour will take about 2 minutes.',
    position: 'bottom',
    highlight: true
  },

  {
    id: 'test-generation',
    target: '[data-tour="test-generator"]',
    title: 'Smart Test Generation',
    content: 'Generate comprehensive test cases from user stories using AI. Upload your requirements and watch the magic happen.',
    position: 'top',
    highlight: true
  },
  {
    id: 'progress-tracking',
    target: '[data-tour="progress"]',
    title: 'Progress Visualization',
    content: 'Track your project milestones with beautiful, animated progress indicators. Stay on top of deadlines and celebrate wins!',
    position: 'right'
  },
  {
    id: 'dark-mode',
    target: '[data-tour="theme-toggle"]',
    title: 'Smooth Theme Switching',
    content: 'Toggle between light and dark modes with buttery-smooth transitions. Your eyes will thank you during those late coding sessions.',
    position: 'bottom',
    action: 'Try switching themes!'
  },
  {
    id: 'complete',
    target: 'body',
    title: 'You\'re All Set!',
    content: 'That\'s the essential tour! Explore the features, import your test cases, and let AI help you build better tests. Happy testing!',
    position: 'bottom',
    highlight: true
  }
];

export function OnboardingTour({ 
  steps = defaultSteps,
  isOpen = false,
  onClose,
  onComplete,
  autoStart = false,
  className 
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(isOpen);
  const [isPaused, setIsPaused] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (autoStart) {
      const hasSeenTour = localStorage.getItem('onboarding-tour-completed');
      if (!hasSeenTour) {
        setTimeout(() => setIsActive(true), 1000);
      }
    }
  }, [autoStart]);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const target = steps[currentStep].target;
      const element = target === 'body' 
        ? document.body 
        : document.querySelector(target) as HTMLElement;
      
      setTargetElement(element);
      
      if (element && target !== 'body') {
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height
        });
        
        // Scroll element into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [currentStep, isActive, steps]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem('onboarding-tour-completed', 'true');
    onComplete?.();
  };

  const closeTour = () => {
    setIsActive(false);
    onClose?.();
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsPaused(false);
    setIsActive(true);
  };

  const getTooltipPosition = () => {
    if (!targetElement || steps[currentStep]?.target === 'body') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = targetElement.getBoundingClientRect();
    const position = steps[currentStep]?.position || 'bottom';
    const offset = 20;

    switch (position) {
      case 'top':
        return {
          top: rect.top - offset,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - offset,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + offset,
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, 0)'
        };
    }
  };

  const step = steps[currentStep];

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          onClick={closeTour}
        />

        {/* Highlight spotlight */}
        {step?.highlight && targetElement && step.target !== 'body' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute pointer-events-none"
            style={{
              top: highlightPosition.top - 8,
              left: highlightPosition.left - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
              borderRadius: '8px',
              zIndex: 99
            }}
          />
        )}

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0 
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.5
              }}
            >
              <Sparkles className="h-4 w-4 text-blue-400" />
            </motion.div>
          ))}
        </div>

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          className="absolute pointer-events-auto z-[101]"
          style={getTooltipPosition()}
        >
          <Card className={cn(
            "w-80 shadow-2xl border-2 border-primary/20",
            "bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm",
            className
          )}>
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentStep === 0 && <Rocket className="h-5 w-5 text-blue-500" />}
                    {currentStep === 1 && <Zap className="h-5 w-5 text-purple-500" />}
                    {currentStep === 2 && <Target className="h-5 w-5 text-green-500" />}
                    {currentStep === 3 && <Sparkles className="h-5 w-5 text-yellow-500" />}
                    {currentStep === 4 && <Sparkles className="h-5 w-5 text-indigo-500" />}
                    {currentStep === 5 && <Rocket className="h-5 w-5 text-pink-500" />}
                  </motion.div>
                  <h3 className="font-semibold text-lg">{step?.title}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPaused(!isPaused)}
                    className="h-6 w-6 p-0"
                  >
                    {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeTour}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {step?.content}
              </p>

              {/* Action suggestion */}
              {step?.action && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {step.action}
                  </Badge>
                </motion.div>
              )}

              {/* Progress indicator */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex space-x-1">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === currentStep 
                          ? "bg-primary" 
                          : index < currentStep 
                          ? "bg-green-500" 
                          : "bg-gray-300 dark:bg-gray-600"
                      )}
                      initial={{ scale: 0.8 }}
                      animate={{ 
                        scale: index === currentStep ? 1.2 : 1,
                        opacity: index === currentStep ? 1 : 0.7
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {currentStep + 1} of {steps.length}
                </span>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="h-8"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restartTour}
                    className="h-8"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>

                <Button
                  onClick={nextStep}
                  size="sm"
                  className="h-8"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Complete
                      <Sparkles className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}