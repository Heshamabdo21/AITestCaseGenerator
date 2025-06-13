import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;
  dueDate?: Date;
  category: 'feature' | 'testing' | 'deployment' | 'optimization';
  priority: 'low' | 'medium' | 'high';
}

interface ProgressTrackerProps {
  milestones?: Milestone[];
  className?: string;
  onMilestoneClick?: (milestone: Milestone) => void;
}

const defaultMilestones: Milestone[] = [
  {
    id: '1',
    title: 'AI Assistant Integration',
    description: 'Implement AI-powered code suggestions with character interface',
    status: 'in-progress',
    progress: 75,
    category: 'feature',
    priority: 'high',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Dark Mode Implementation',
    description: 'Add smooth dark/light mode transitions',
    status: 'completed',
    progress: 100,
    category: 'feature',
    priority: 'medium',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Interactive Onboarding',
    description: 'Create playful onboarding tour with animations',
    status: 'in-progress',
    progress: 45,
    category: 'feature',
    priority: 'medium',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '4',
    title: 'Test Case Coverage',
    description: 'Achieve 90% test coverage across all modules',
    status: 'pending',
    progress: 0,
    category: 'testing',
    priority: 'high',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '5',
    title: 'Performance Optimization',
    description: 'Optimize app performance and loading times',
    status: 'pending',
    progress: 0,
    category: 'optimization',
    priority: 'low',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  }
];

export function ProgressTracker({ 
  milestones = defaultMilestones, 
  className,
  onMilestoneClick 
}: ProgressTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({});

  // Animate progress values on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const progressMap: Record<string, number> = {};
      milestones.forEach(milestone => {
        progressMap[milestone.id] = milestone.progress;
      });
      setAnimatedProgress(progressMap);
    }, 500);

    return () => clearTimeout(timer);
  }, [milestones]);

  const categories = [
    { id: 'all', label: 'All', icon: Target },
    { id: 'feature', label: 'Features', icon: Zap },
    { id: 'testing', label: 'Testing', icon: CheckCircle },
    { id: 'deployment', label: 'Deployment', icon: TrendingUp },
    { id: 'optimization', label: 'Optimization', icon: Award }
  ];

  const filteredMilestones = selectedCategory === 'all' 
    ? milestones 
    : milestones.filter(m => m.category === selectedCategory);

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Milestone['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const overallProgress = milestones.reduce((acc, milestone) => acc + milestone.progress, 0) / milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = (dueDate: Date) => {
    return new Date() > dueDate;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Project Milestones</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {completedMilestones} of {milestones.length} milestones completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {Math.round(overallProgress)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={overallProgress} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Project Timeline</span>
            <span>{completedMilestones} completed</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-xs"
              >
                <Icon className="h-3 w-3 mr-1" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Milestones List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredMilestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all duration-200",
                  "hover:shadow-md hover:border-primary/50",
                  milestone.status === 'completed' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                )}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {getStatusIcon(milestone.status)}
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {milestone.title}
                        </h4>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          getPriorityColor(milestone.priority)
                        )} />
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {milestone.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {animatedProgress[milestone.id] || 0}%
                          </span>
                        </div>
                        
                        <motion.div
                          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <motion.div
                            className={cn(
                              "h-2 rounded-full transition-all duration-1000",
                              getProgressColor(milestone.progress)
                            )}
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${animatedProgress[milestone.id] || 0}%` 
                            }}
                            transition={{ 
                              duration: 1,
                              delay: 0.5,
                              ease: "easeOut"
                            }}
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <Badge
                      variant={
                        milestone.status === 'completed' ? 'default' :
                        milestone.status === 'in-progress' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {milestone.status.replace('-', ' ')}
                    </Badge>
                    
                    {milestone.dueDate && (
                      <div className={cn(
                        "flex items-center space-x-1 text-xs",
                        isOverdue(milestone.dueDate) && milestone.status !== 'completed'
                          ? "text-red-500"
                          : "text-muted-foreground"
                      )}>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(milestone.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredMilestones.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No milestones found for this category</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}